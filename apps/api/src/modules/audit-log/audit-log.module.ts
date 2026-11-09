import { Module } from "@nestjs/common";

import { AuditLogRepository } from "./audit-log.repository.js";
import { AdminAuditLogController } from "./http/admin-audit-log.controller.js";

@Module({
  controllers: [AdminAuditLogController],
  providers: [AuditLogRepository],
})
export class AuditLogModule {}
