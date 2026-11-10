import type { TListAuditLogQuery } from "@repo/contracts";

import { Injectable } from "@nestjs/common";
import { and, desc, eq, lt } from "drizzle-orm";

import { DatabaseService } from "../../core/database/database.service.js";
import { auditLog } from "../../core/database/schema/index.js";

export type TAuditRow = typeof auditLog.$inferSelect;

@Injectable()
export class AuditLogRepository {
  constructor(private readonly database: DatabaseService) {}

  async list(
    query: TListAuditLogQuery,
    beforeId: number | null,
    limit: number,
  ): Promise<TAuditRow[]> {
    return this.database.db
      .select()
      .from(auditLog)
      .where(
        and(
          query.entityType ? eq(auditLog.entityType, query.entityType) : undefined,
          query.entityId ? eq(auditLog.entityId, query.entityId) : undefined,
          query.actorId ? eq(auditLog.actorId, query.actorId) : undefined,
          query.action ? eq(auditLog.action, query.action) : undefined,
          beforeId ? lt(auditLog.id, beforeId) : undefined,
        ),
      )
      .orderBy(desc(auditLog.id))
      .limit(limit);
  }
}
