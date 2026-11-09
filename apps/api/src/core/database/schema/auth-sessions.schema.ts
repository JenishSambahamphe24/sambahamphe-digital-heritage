import { sql } from "drizzle-orm";
import { index, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { ColumnHelper } from "./column.helper.js";
import { users } from "./users.schema.js";

export const authClient = pgEnum("auth_client", ["web", "admin", "mobile"]);

export const authSessions = pgTable(
  "auth_sessions",
  {
    id: ColumnHelper.primaryId(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    tokenHash: text("token_hash").notNull().unique(),
    client: authClient("client").notNull(),
    userAgent: text("user_agent"),
    ipHash: text("ip_hash"),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true }).notNull(),
    idleExpiresAt: timestamp("idle_expires_at", { withTimezone: true }).notNull(),
    absoluteExpiresAt: timestamp("absolute_expires_at", { withTimezone: true }).notNull(),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    revokedReason: text("revoked_reason"),
    createdAt: ColumnHelper.createdAt(),
  },
  (table) => [
    index("auth_sessions_active_by_user")
      .on(table.userId)
      .where(sql`revoked_at is null`),
  ],
);
