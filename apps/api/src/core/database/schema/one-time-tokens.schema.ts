import { index, integer, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { ColumnHelper } from "./column.helper.js";
import { users } from "./users.schema.js";

export const tokenPurpose = pgEnum("token_purpose", [
  "email_verification",
  "phone_verification",
  "password_reset",
  "invitation",
]);

export const oneTimeTokens = pgTable(
  "one_time_tokens",
  {
    id: ColumnHelper.primaryId(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    purpose: tokenPurpose("purpose").notNull(),
    tokenHash: text("token_hash").notNull().unique(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    usedAt: timestamp("used_at", { withTimezone: true }),
    attempts: integer("attempts").notNull().default(0),
    createdAt: ColumnHelper.createdAt(),
  },
  (table) => [index("one_time_tokens_by_user_purpose").on(table.userId, table.purpose)],
);
