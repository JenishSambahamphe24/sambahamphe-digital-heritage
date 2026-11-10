import type { TTransaction } from "../../../core/database/database.types.js";
import type { TOrgUnitRow } from "../internal/org-units.repository.js";
import type {
  TCreateOrgUnitRequest,
  TOrgUnitResponse,
  TOrgUnitTreeResponse,
  TOrgUnitTypeListResponse,
  TUpdateOrgUnitRequest,
} from "@repo/contracts";
import type { Request } from "express";

import { HttpStatus, Injectable } from "@nestjs/common";

import {
  orgUnitResponseSchema,
  orgUnitTreeResponseSchema,
  orgUnitTypeListResponseSchema,
} from "@repo/contracts";
import { FuzzyDateHelper } from "@repo/dates";

import { AuditService } from "../../../core/audit/audit.service.js";
import { DatabaseErrorHelper } from "../../../core/database/database-error.helper.js";
import { DatabaseService } from "../../../core/database/database.service.js";
import { AppException } from "../../../core/errors/app.exception.js";
import { VersionConflictException } from "../../../core/errors/version-conflict.exception.js";
import { ChangeRequestsRepository } from "../../change-requests/internal/change-requests.repository.js";
import { PlacesRepository } from "../../places/internal/places.repository.js";
import { PlaceResponseHelper } from "../../places/place-response.helper.js";
import { OrgUnitsRepository } from "../internal/org-units.repository.js";
import { OrgResponseHelper } from "../org-response.helper.js";
import { ORG_ENTITY } from "../organization.constants.js";
import { OrgScopeService } from "./org-scope.service.js";

@Injectable()
export class OrgUnitsService {
  constructor(
    private readonly database: DatabaseService,
    private readonly units: OrgUnitsRepository,
    private readonly places: PlacesRepository,
    private readonly scope: OrgScopeService,
    private readonly revisions: ChangeRequestsRepository,
    private readonly audit: AuditService,
  ) {}

  async types(): Promise<TOrgUnitTypeListResponse> {
    const types = await this.units.types();
    return orgUnitTypeListResponseSchema.parse({
      data: types.map((type) => ({
        id: type.id,
        key: type.key,
        nameI18n: type.nameI18n,
        levelOrder: type.levelOrder,
        allowedParentTypeIds: type.allowedParentTypeIds,
      })),
    });
  }

  async tree(): Promise<TOrgUnitTreeResponse> {
    const rows = await this.units.all();
    return orgUnitTreeResponseSchema.parse({
      data: rows.map((row) => OrgResponseHelper.node(row)),
    });
  }

  async get(id: string): Promise<TOrgUnitResponse> {
    const row = await this.units.findById(id);
    if (!row) {
      throw OrgUnitsService.notFound();
    }
    const path = await this.units.pathOf(id);
    const ancestors = await Promise.all(
      path.slice(0, -1).map((ancestorId) => this.units.findById(ancestorId)),
    );
    const place = row.placeId
      ? (await this.places.findSummaries([row.placeId])).get(row.placeId)
      : undefined;
    return orgUnitResponseSchema.parse({
      id: row.id,
      slug: row.slug,
      nameI18n: row.nameI18n,
      typeId: row.typeId,
      typeKey: row.typeKey,
      parentId: row.parentId,
      ancestors: ancestors
        .filter((ancestor) => ancestor !== null)
        .map((ancestor) => OrgResponseHelper.node(ancestor)),
      place: place ? PlaceResponseHelper.summary(place) : null,
      establishedDate: row.establishedDate,
      dissolvedDate: row.dissolvedDate,
      status: row.status,
      sortOrder: row.sortOrder,
      version: row.version,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    });
  }

  async create(
    request: Request,
    actorId: string,
    body: TCreateOrgUnitRequest,
  ): Promise<TOrgUnitResponse> {
    await this.scope.assertCanManage(request, body.parentId ?? null);
    const id = await this.write(async (tx) => {
      await this.validate(body, null, tx);
      const unit = await this.units.insert(
        {
          ...OrgUnitsService.columns(body),
          organizationId: await this.units.organizationId(tx),
          createdBy: actorId,
          updatedBy: actorId,
        },
        tx,
      );
      await this.recordChange("org_unit.created", unit, actorId, tx);
      return unit.id;
    });
    return this.get(id);
  }

  async update(
    request: Request,
    actorId: string,
    id: string,
    body: TUpdateOrgUnitRequest,
  ): Promise<TOrgUnitResponse> {
    await this.scope.assertCanManage(request, id);
    const current = await this.units.findById(id);
    if (!current) {
      throw OrgUnitsService.notFound();
    }
    if ((body.parentId ?? null) !== current.parentId) {
      await this.scope.assertCanManage(request, body.parentId ?? null);
    }
    await this.write(async (tx) => {
      await this.validate(body, current, tx);
      const unit = await this.units.updateIfVersion(
        id,
        body.version,
        { ...OrgUnitsService.columns(body), updatedBy: actorId },
        tx,
      );
      if (!unit) {
        throw new VersionConflictException(current.version);
      }
      await this.recordChange("org_unit.updated", unit, actorId, tx);
      return unit.id;
    });
    return this.get(id);
  }

  private async validate(
    body: TCreateOrgUnitRequest,
    current: (TOrgUnitRow & { typeKey: string }) | null,
    tx: TTransaction,
  ): Promise<void> {
    const type = await this.units.findType(body.typeId, tx);
    if (!type) {
      throw OrgUnitsService.invalid(
        "typeId",
        "unknown_unit_type",
        "This kind of board doesn't exist.",
      );
    }
    const allowedParents = await this.units.allowedParentTypeIds(type.id, tx);
    const parentId = body.parentId ?? null;
    if (parentId === null) {
      if (allowedParents.length > 0) {
        throw OrgUnitsService.invalid(
          "parentId",
          "parent_required",
          "Choose the board this one sits under.",
        );
      }
    } else {
      const parent = await this.units.findById(parentId, tx);
      if (!parent) {
        throw OrgUnitsService.invalid(
          "parentId",
          "unknown_parent",
          "The parent board doesn't exist.",
        );
      }
      if (!allowedParents.includes(parent.typeId)) {
        throw OrgUnitsService.invalid(
          "parentId",
          "parent_type_not_allowed",
          "This kind of board can't sit under that one.",
        );
      }
      if (current && (await this.units.pathOf(parentId, tx)).includes(current.id)) {
        throw OrgUnitsService.invalid(
          "parentId",
          "org_unit_cycle",
          "A board can't sit under itself or one of its own sub-boards.",
        );
      }
    }
    if (
      current &&
      current.typeId !== body.typeId &&
      (await this.units.all()).some((unit) => unit.parentId === current.id)
    ) {
      throw OrgUnitsService.invalid(
        "typeId",
        "org_unit_has_children",
        "Move or change the boards under this one before changing its kind.",
      );
    }
    if (body.placeId && !(await this.places.findSummaries([body.placeId])).has(body.placeId)) {
      throw OrgUnitsService.invalid("placeId", "unknown_place", "This place doesn't exist.");
    }
  }

  private async write(run: (tx: TTransaction) => Promise<string>): Promise<string> {
    try {
      return await this.database.db.transaction(run);
    } catch (error) {
      if (DatabaseErrorHelper.isUniqueViolation(error)) {
        throw new AppException(
          HttpStatus.CONFLICT,
          "slug_taken",
          "Address taken",
          "Another board already uses this web address.",
        );
      }
      throw error;
    }
  }

  private async recordChange(
    action: string,
    unit: TOrgUnitRow,
    actorId: string,
    tx: TTransaction,
  ): Promise<void> {
    // Revisions keep the unit as it was, so past boards show their old place in the tree.
    await this.revisions.insertRevision(
      {
        entityType: ORG_ENTITY.unit,
        entityId: unit.id,
        version: unit.version,
        snapshot: JSON.parse(JSON.stringify(unit)) as Record<string, unknown>,
        actorId,
      },
      tx,
    );
    await this.audit.record(
      {
        action,
        entityType: ORG_ENTITY.unit,
        entityId: unit.id,
        actorId,
        changes: {
          parentId: unit.parentId,
          typeId: unit.typeId,
          status: unit.status,
          version: unit.version,
        },
      },
      tx,
    );
  }

  private static columns(body: TCreateOrgUnitRequest) {
    return {
      typeId: body.typeId,
      parentId: body.parentId ?? null,
      slug: body.slug,
      nameI18n: body.nameI18n,
      placeId: body.placeId ?? null,
      establishedDate: body.establishedDate ?? null,
      establishedSort: body.establishedDate
        ? FuzzyDateHelper.normalize(body.establishedDate).from
        : null,
      dissolvedDate: body.dissolvedDate ?? null,
      dissolvedSort: body.dissolvedDate ? FuzzyDateHelper.normalize(body.dissolvedDate).from : null,
      status: body.status,
      sortOrder: body.sortOrder,
    };
  }

  static notFound(): AppException {
    return new AppException(HttpStatus.NOT_FOUND, "not_found", "Not found", "Board not found.");
  }

  private static invalid(path: string, code: string, message: string): AppException {
    return new AppException(
      HttpStatus.UNPROCESSABLE_ENTITY,
      "validation_error",
      "Validation failed",
      "Some fields need attention.",
      [{ path: [path], code, message }],
    );
  }
}
