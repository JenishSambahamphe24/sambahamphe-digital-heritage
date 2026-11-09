import type { TDbExecutor } from "../../../core/database/database.types.js";
import type { IGrant, TScopeType } from "../access.types.js";

import { Injectable } from "@nestjs/common";
import { and, asc, eq, gt, isNull, or } from "drizzle-orm";

import { DatabaseService } from "../../../core/database/database.service.js";
import { roleAssignments, rolePermissions, roles } from "../../../core/database/schema/index.js";
import { SUPER_ADMIN_ROLE } from "../access.catalog.js";

export type TRoleRow = typeof roles.$inferSelect;
export type TAssignmentRow = typeof roleAssignments.$inferSelect;

export interface IRoleWithPermissions {
  role: TRoleRow;
  permissions: string[];
}

export interface IAssignmentWithRole {
  assignment: TAssignmentRow;
  roleKey: string;
}

@Injectable()
export class AccessRepository {
  constructor(private readonly database: DatabaseService) {}

  async grantsForUser(userId: string, now: Date): Promise<IGrant[]> {
    return this.database.db
      .select({
        roleKey: roles.key,
        permissionKey: rolePermissions.permissionKey,
        scopeType: roleAssignments.scopeType,
        orgUnitId: roleAssignments.orgUnitId,
        branchId: roleAssignments.branchId,
      })
      .from(roleAssignments)
      .innerJoin(roles, eq(roles.id, roleAssignments.roleId))
      .leftJoin(rolePermissions, eq(rolePermissions.roleId, roles.id))
      .where(and(eq(roleAssignments.userId, userId), AccessRepository.active(now)));
  }

  async rolesWithPermissions(): Promise<IRoleWithPermissions[]> {
    const rows = await this.database.db
      .select({ role: roles, permissionKey: rolePermissions.permissionKey })
      .from(roles)
      .leftJoin(rolePermissions, eq(rolePermissions.roleId, roles.id))
      .orderBy(asc(roles.key), asc(rolePermissions.permissionKey));

    const byKey = new Map<string, IRoleWithPermissions>();
    for (const row of rows) {
      const entry = byKey.get(row.role.key) ?? { role: row.role, permissions: [] };
      if (row.permissionKey) {
        entry.permissions.push(row.permissionKey);
      }
      byKey.set(row.role.key, entry);
    }
    return [...byKey.values()];
  }

  async findRoleByKey(
    key: string,
    executor: TDbExecutor = this.database.db,
  ): Promise<TRoleRow | null> {
    const [row] = await executor.select().from(roles).where(eq(roles.key, key)).limit(1);
    return row ?? null;
  }

  async assignmentsForUser(userId: string): Promise<IAssignmentWithRole[]> {
    return this.database.db
      .select({ assignment: roleAssignments, roleKey: roles.key })
      .from(roleAssignments)
      .innerJoin(roles, eq(roles.id, roleAssignments.roleId))
      .where(eq(roleAssignments.userId, userId))
      .orderBy(asc(roleAssignments.grantedAt));
  }

  async findActiveAssignment(
    id: string,
    now: Date,
    executor: TDbExecutor,
  ): Promise<IAssignmentWithRole | null> {
    const [row] = await executor
      .select({ assignment: roleAssignments, roleKey: roles.key })
      .from(roleAssignments)
      .innerJoin(roles, eq(roles.id, roleAssignments.roleId))
      .where(and(eq(roleAssignments.id, id), AccessRepository.active(now)))
      .limit(1)
      .for("update");
    return row ?? null;
  }

  // Locks every active super-admin grant, so two concurrent revocations can't
  // both see "two left" and remove the last one between them.
  async lockActiveSuperAdminCount(now: Date, executor: TDbExecutor): Promise<number> {
    const rows = await executor
      .select({ id: roleAssignments.id })
      .from(roleAssignments)
      .innerJoin(roles, eq(roles.id, roleAssignments.roleId))
      .where(and(eq(roles.key, SUPER_ADMIN_ROLE), AccessRepository.active(now)))
      .for("update", { of: roleAssignments });
    return rows.length;
  }

  async insertAssignment(
    values: {
      userId: string;
      roleId: string;
      scopeType: TScopeType;
      orgUnitId: string | null;
      branchId: string | null;
      grantedBy: string | null;
      expiresAt: Date | null;
    },
    executor: TDbExecutor,
  ): Promise<TAssignmentRow> {
    const [row] = await executor.insert(roleAssignments).values(values).returning();
    if (!row) {
      throw new Error("Insert into role_assignments returned no row");
    }
    return row;
  }

  async revokeAssignment(
    id: string,
    revokedBy: string | null,
    executor: TDbExecutor,
  ): Promise<void> {
    await executor
      .update(roleAssignments)
      .set({ revokedAt: new Date(), revokedBy })
      .where(eq(roleAssignments.id, id));
  }

  private static active(now: Date) {
    return and(
      isNull(roleAssignments.revokedAt),
      or(isNull(roleAssignments.expiresAt), gt(roleAssignments.expiresAt, now)),
    );
  }
}
