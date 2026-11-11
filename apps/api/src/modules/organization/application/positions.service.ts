import type { TTransaction } from "../../../core/database/database.types.js";
import type {
  TCreatePositionRequest,
  TPositionListResponse,
  TPositionResponse,
  TUpdatePositionRequest,
} from "@repo/contracts";

import { HttpStatus, Injectable } from "@nestjs/common";

import { positionListResponseSchema } from "@repo/contracts";

import { AuditService } from "../../../core/audit/audit.service.js";
import { DatabaseErrorHelper } from "../../../core/database/database-error.helper.js";
import { DatabaseService } from "../../../core/database/database.service.js";
import { AppException } from "../../../core/errors/app.exception.js";
import { VersionConflictException } from "../../../core/errors/version-conflict.exception.js";
import { OrgUnitsRepository } from "../internal/org-units.repository.js";
import { PositionsRepository } from "../internal/positions.repository.js";
import { OrgResponseHelper } from "../org-response.helper.js";
import { ORG_CONSTRAINT } from "../organization.constants.js";

@Injectable()
export class PositionsService {
  constructor(
    private readonly database: DatabaseService,
    private readonly positions: PositionsRepository,
    private readonly units: OrgUnitsRepository,
    private readonly audit: AuditService,
  ) {}

  async list(): Promise<TPositionListResponse> {
    const rows = await this.positions.all();
    return positionListResponseSchema.parse({
      data: rows.map((row) => OrgResponseHelper.position(row)),
    });
  }

  async create(actorId: string, body: TCreatePositionRequest): Promise<TPositionResponse> {
    return this.write(async (tx) => {
      const row = await this.positions.insert(
        { ...PositionsService.columns(body), organizationId: await this.units.organizationId(tx) },
        tx,
      );
      await this.audit.record(
        {
          action: "position.created",
          entityType: "position",
          entityId: row.id,
          actorId,
          changes: { key: row.key, maxHolders: row.maxHolders },
        },
        tx,
      );
      return OrgResponseHelper.position(row);
    });
  }

  async update(
    actorId: string,
    id: string,
    body: TUpdatePositionRequest,
  ): Promise<TPositionResponse> {
    const current = await this.positions.findById(id);
    if (!current) {
      throw new AppException(HttpStatus.NOT_FOUND, "not_found", "Not found", "Position not found.");
    }
    return this.write(async (tx) => {
      const row = await this.positions.updateIfVersion(
        id,
        body.version,
        PositionsService.columns(body),
        tx,
      );
      if (!row) {
        throw new VersionConflictException(current.version);
      }
      await this.audit.record(
        {
          action: "position.updated",
          entityType: "position",
          entityId: id,
          actorId,
          changes: { key: row.key, maxHolders: row.maxHolders, active: row.active },
        },
        tx,
      );
      return OrgResponseHelper.position(row);
    });
  }

  private async write<T>(run: (tx: TTransaction) => Promise<T>): Promise<T> {
    try {
      return await this.database.db.transaction(run);
    } catch (error) {
      if (DatabaseErrorHelper.isUniqueViolation(error)) {
        throw new AppException(
          HttpStatus.CONFLICT,
          "position_key_taken",
          "Key taken",
          "Another position already uses this key.",
        );
      }
      // Making a position one-holder while two people overlap in it.
      if (DatabaseErrorHelper.isExclusionViolation(error, ORG_CONSTRAINT.exclusiveOneHolder)) {
        throw new AppException(
          HttpStatus.CONFLICT,
          "position_has_overlapping_holders",
          "Overlapping holders",
          "Some board has two people in this position at the same time; fix those first.",
        );
      }
      throw error;
    }
  }

  private static columns(body: TCreatePositionRequest) {
    return {
      key: body.key,
      titleI18n: body.titleI18n,
      rank: body.rank,
      isOfficeBearer: body.isOfficeBearer,
      maxHolders: body.maxHolders ?? null,
      active: body.active,
    };
  }
}
