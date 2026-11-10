import type { TTransaction } from "../../../core/database/database.types.js";
import type {
  TCreateTermRequest,
  TTermListResponse,
  TTermResponse,
  TUpdateTermRequest,
} from "@repo/contracts";
import type { Request } from "express";

import { HttpStatus, Injectable } from "@nestjs/common";

import { termListResponseSchema } from "@repo/contracts";

import { AuditService } from "../../../core/audit/audit.service.js";
import { DatabaseErrorHelper } from "../../../core/database/database-error.helper.js";
import { DatabaseService } from "../../../core/database/database.service.js";
import { AppException } from "../../../core/errors/app.exception.js";
import { VersionConflictException } from "../../../core/errors/version-conflict.exception.js";
import { OrgDateHelper } from "../domain/org-date.helper.js";
import { OrgUnitsRepository } from "../internal/org-units.repository.js";
import { TermsRepository } from "../internal/terms.repository.js";
import { OrgResponseHelper } from "../org-response.helper.js";
import { ORG_CONSTRAINT } from "../organization.constants.js";
import { OrgScopeService } from "./org-scope.service.js";
import { OrgUnitsService } from "./org-units.service.js";

@Injectable()
export class TermsService {
  constructor(
    private readonly database: DatabaseService,
    private readonly terms: TermsRepository,
    private readonly units: OrgUnitsRepository,
    private readonly scope: OrgScopeService,
    private readonly audit: AuditService,
  ) {}

  async list(unitId: string): Promise<TTermListResponse> {
    if (!(await this.units.findById(unitId))) {
      throw OrgUnitsService.notFound();
    }
    const today = OrgDateHelper.today();
    const rows = await this.terms.forUnit(unitId);
    return termListResponseSchema.parse({
      data: rows.map((row) => OrgResponseHelper.term(row, today)),
    });
  }

  async create(
    request: Request,
    actorId: string,
    unitId: string,
    body: TCreateTermRequest,
  ): Promise<TTermResponse> {
    if (!(await this.units.findById(unitId))) {
      throw OrgUnitsService.notFound();
    }
    await this.scope.assertCanManage(request, unitId);
    return this.write(async (tx) => {
      const row = await this.terms.insert(
        {
          ...TermsService.columns(body),
          orgUnitId: unitId,
          createdBy: actorId,
          updatedBy: actorId,
        },
        tx,
      );
      await this.audit.record(
        {
          action: "term.created",
          entityType: "term",
          entityId: row.id,
          actorId,
          changes: { orgUnitId: unitId },
        },
        tx,
      );
      return OrgResponseHelper.term(row, OrgDateHelper.today());
    });
  }

  async update(
    request: Request,
    actorId: string,
    unitId: string,
    termId: string,
    body: TUpdateTermRequest,
  ): Promise<TTermResponse> {
    await this.scope.assertCanManage(request, unitId);
    const current = await this.terms.findInUnit(unitId, termId);
    if (!current) {
      throw new AppException(HttpStatus.NOT_FOUND, "not_found", "Not found", "Term not found.");
    }
    return this.write(async (tx) => {
      const row = await this.terms.updateIfVersion(
        termId,
        body.version,
        { ...TermsService.columns(body), updatedBy: actorId },
        tx,
      );
      if (!row) {
        throw new VersionConflictException(current.version);
      }
      await this.audit.record(
        {
          action: "term.updated",
          entityType: "term",
          entityId: termId,
          actorId,
          changes: { orgUnitId: unitId, version: row.version },
        },
        tx,
      );
      return OrgResponseHelper.term(row, OrgDateHelper.today());
    });
  }

  private async write<T>(run: (tx: TTransaction) => Promise<T>): Promise<T> {
    try {
      return await this.database.db.transaction(run);
    } catch (error) {
      if (DatabaseErrorHelper.isExclusionViolation(error, ORG_CONSTRAINT.termsNoOverlap)) {
        throw new AppException(
          HttpStatus.CONFLICT,
          "term_overlap",
          "Terms overlap",
          "This board already has a term in those dates.",
        );
      }
      throw error;
    }
  }

  private static columns(body: TCreateTermRequest) {
    return {
      ordinal: body.ordinal ?? null,
      labelI18n: body.labelI18n ?? null,
      startsOn: body.startsOn,
      endsOn: body.endsOn ?? null,
      datePrecision: body.datePrecision,
      notes: body.notes ?? null,
    };
  }
}
