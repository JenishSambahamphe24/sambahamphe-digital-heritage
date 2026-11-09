import type { OnApplicationBootstrap } from "@nestjs/common";

import { Injectable, Logger } from "@nestjs/common";
import { and, eq, notInArray, sql } from "drizzle-orm";

import { DatabaseService } from "../../../core/database/database.service.js";
import { permissions, rolePermissions, roles } from "../../../core/database/schema/index.js";
import { PERMISSION_DESCRIPTIONS, SYSTEM_ROLES } from "../access.catalog.js";

// Any constant works; it only has to be the same for every API instance.
const CATALOG_SYNC_LOCK_KEY = 4_211_001;

@Injectable()
export class CatalogSyncService implements OnApplicationBootstrap {
  private readonly logger = new Logger(CatalogSyncService.name);

  constructor(private readonly database: DatabaseService) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.sync();
  }

  // The code is the source of truth for permissions and system roles. Custom
  // roles (is_system = false), if ever added, are left alone.
  async sync(): Promise<void> {
    await this.database.db.transaction(async (tx) => {
      await tx.execute(sql`select pg_advisory_xact_lock(${CATALOG_SYNC_LOCK_KEY})`);

      for (const [key, description] of Object.entries(PERMISSION_DESCRIPTIONS)) {
        await tx
          .insert(permissions)
          .values({ key, description })
          .onConflictDoUpdate({ target: permissions.key, set: { description } });
      }

      for (const role of SYSTEM_ROLES) {
        const [row] = await tx
          .insert(roles)
          .values({ key: role.key, name: role.name, description: role.description, isSystem: true })
          .onConflictDoUpdate({
            target: roles.key,
            set: { name: role.name, description: role.description, isSystem: true },
          })
          .returning({ id: roles.id });
        if (!row) {
          throw new Error(`Upsert of role ${role.key} returned no row`);
        }

        const stale = role.permissions.length
          ? and(
              eq(rolePermissions.roleId, row.id),
              notInArray(rolePermissions.permissionKey, role.permissions),
            )
          : eq(rolePermissions.roleId, row.id);
        await tx.delete(rolePermissions).where(stale);
        if (role.permissions.length) {
          await tx
            .insert(rolePermissions)
            .values(role.permissions.map((permissionKey) => ({ roleId: row.id, permissionKey })))
            .onConflictDoNothing();
        }
      }
    });
    this.logger.log({ roles: SYSTEM_ROLES.length }, "Permission catalog synced");
  }
}
