import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { ColumnHelper } from "./column.helper.js";
import { orgUnits } from "./org-units.schema.js";
import { users } from "./users.schema.js";

export const scopeType = pgEnum("scope_type", ["global", "org_unit", "branch"]);

export const permissions = pgTable("permissions", {
  key: text("key").primaryKey(),
  description: text("description").notNull(),
});

export const roles = pgTable("roles", {
  id: ColumnHelper.primaryId(),
  key: text("key").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  isSystem: boolean("is_system").notNull().default(false),
  createdAt: ColumnHelper.createdAt(),
  updatedAt: ColumnHelper.updatedAt(),
});

export const rolePermissions = pgTable(
  "role_permissions",
  {
    roleId: uuid("role_id")
      .notNull()
      .references(() => roles.id, { onDelete: "cascade" }),
    permissionKey: text("permission_key")
      .notNull()
      .references(() => permissions.key),
  },
  (table) => [primaryKey({ columns: [table.roleId, table.permissionKey] })],
);

// branch_id gets its foreign key when branches arrive (Phase 3).
export const roleAssignments = pgTable(
  "role_assignments",
  {
    id: ColumnHelper.primaryId(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    roleId: uuid("role_id")
      .notNull()
      .references(() => roles.id),
    scopeType: scopeType("scope_type").notNull(),
    orgUnitId: uuid("org_unit_id").references(() => orgUnits.id),
    branchId: uuid("branch_id"),
    grantedBy: uuid("granted_by").references(() => users.id),
    grantedAt: timestamp("granted_at", { withTimezone: true }).notNull().defaultNow(),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    revokedBy: uuid("revoked_by").references(() => users.id),
  },
  (table) => [
    check(
      "role_assignments_scope_consistent",
      sql`(${table.scopeType} = 'global' and ${table.orgUnitId} is null and ${table.branchId} is null)
        or (${table.scopeType} = 'org_unit' and ${table.orgUnitId} is not null and ${table.branchId} is null)
        or (${table.scopeType} = 'branch' and ${table.branchId} is not null and ${table.orgUnitId} is null)`,
    ),
    // The nil uuid stands in for "no scope id" so two active global grants of
    // one role collide (plain NULLs would be treated as distinct).
    uniqueIndex("role_assignments_active_unique")
      .on(
        table.userId,
        table.roleId,
        table.scopeType,
        sql`coalesce(${table.orgUnitId}, ${table.branchId}, '00000000-0000-0000-0000-000000000000'::uuid)`,
      )
      .where(sql`revoked_at is null`),
    index("role_assignments_active_by_user")
      .on(table.userId)
      .where(sql`revoked_at is null`),
  ],
);
