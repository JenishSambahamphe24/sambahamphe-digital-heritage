import { Module } from "@nestjs/common";

import { UsersModule } from "../users/users.module.js";
import { AccessService } from "./application/access.service.js";
import { CatalogSyncService } from "./application/catalog-sync.service.js";
import { RoleAssignmentsService } from "./application/role-assignments.service.js";
import { AdminAccessController } from "./http/admin-access.controller.js";
import { AccessRepository } from "./internal/access.repository.js";

@Module({
  imports: [UsersModule],
  controllers: [AdminAccessController],
  providers: [AccessRepository, AccessService, CatalogSyncService, RoleAssignmentsService],
  exports: [AccessService, RoleAssignmentsService, CatalogSyncService],
})
export class AccessModule {}
