import type { TDbExecutor } from "../database/database.types.js";
import type { IAuditEvent } from "./audit.types.js";

import { Injectable } from "@nestjs/common";

import { AppConfig } from "../config/app-config.js";
import { DatabaseService } from "../database/database.service.js";
import { auditLog } from "../database/schema/index.js";
import { RequestContextHelper } from "../request-context/request-context.helper.js";
import { IpHashHelper } from "../security/ip-hash.helper.js";

@Injectable()
export class AuditService {
  constructor(
    private readonly database: DatabaseService,
    private readonly config: AppConfig,
  ) {}

  // Pass the transaction of the change being audited, so the record and the
  // change commit or roll back together.
  async record(event: IAuditEvent, executor: TDbExecutor = this.database.db): Promise<void> {
    const request = RequestContextHelper.currentRequest();
    const actorId = event.actorId ?? request?.auth?.user.id ?? null;
    const actorType = actorId ? "user" : request ? "anonymous" : "system";

    await executor.insert(auditLog).values({
      actorType,
      actorId,
      action: event.action,
      entityType: event.entityType ?? null,
      entityId: event.entityId ?? null,
      changes: event.changes ?? null,
      requestId: typeof request?.id === "string" ? request.id : null,
      ipHash: request ? IpHashHelper.hash(request.ip, this.config.ipHashSecret) : null,
      userAgent: request?.headers["user-agent"] ?? null,
    });
  }
}
