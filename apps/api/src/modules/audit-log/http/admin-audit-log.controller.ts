import type { TAuditEntryListResponse, TListAuditLogQuery } from "@repo/contracts";

import { Controller, Get, Query } from "@nestjs/common";
import { ApiOkResponse, ApiTags } from "@nestjs/swagger";

import {
  auditEntryListResponseSchema,
  auditEntryResponseSchema,
  listAuditLogQuerySchema,
} from "@repo/contracts";

import { ApiProblemResponse } from "../../../core/openapi/api-problem-response.decorator.js";
import { PERMISSION } from "../../access/access.catalog.js";
import { RequirePermission } from "../../access/guards/require-permission.decorator.js";
import { AuditCursorHelper } from "../audit-cursor.helper.js";
import { AuditLogRepository } from "../audit-log.repository.js";

@ApiTags("admin")
@ApiProblemResponse()
@Controller("admin/audit-log")
export class AdminAuditLogController {
  constructor(private readonly auditLog: AuditLogRepository) {}

  @Get()
  @ApiOkResponse({ standardSchema: auditEntryListResponseSchema })
  @RequirePermission(PERMISSION.auditRead)
  async list(
    @Query({ schema: listAuditLogQuerySchema }) query: TListAuditLogQuery,
  ): Promise<TAuditEntryListResponse> {
    // One extra row tells us whether another page exists.
    const rows = await this.auditLog.list(
      query,
      AuditCursorHelper.decode(query.cursor),
      query.limit + 1,
    );
    const page = rows.slice(0, query.limit);
    const last = page.at(-1);
    return auditEntryListResponseSchema.parse({
      data: page.map((row) =>
        auditEntryResponseSchema.parse({
          id: row.id,
          occurredAt: row.occurredAt.toISOString(),
          actorType: row.actorType,
          actorId: row.actorId,
          action: row.action,
          entityType: row.entityType,
          entityId: row.entityId,
          changes: row.changes,
          requestId: row.requestId,
        }),
      ),
      page: {
        nextCursor: rows.length > query.limit && last ? AuditCursorHelper.encode(last.id) : null,
        limit: query.limit,
      },
    });
  }
}
