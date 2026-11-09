import { sql } from "drizzle-orm";
import { check, pgEnum, pgTable, text, timestamp } from "drizzle-orm/pg-core";

import { ColumnHelper } from "./column.helper.js";

export const userStatus = pgEnum("user_status", ["active", "suspended", "deleted"]);

export const users = pgTable(
  "users",
  {
    id: ColumnHelper.primaryId(),
    email: ColumnHelper.citext("email").unique(),
    emailVerifiedAt: timestamp("email_verified_at", { withTimezone: true }),
    phone: text("phone").unique(),
    phoneVerifiedAt: timestamp("phone_verified_at", { withTimezone: true }),
    passwordHash: text("password_hash"),
    displayName: text("display_name").notNull(),
    preferredLocale: text("preferred_locale").notNull().default("en"),
    status: userStatus("status").notNull().default("active"),
    lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
    createdAt: ColumnHelper.createdAt(),
    updatedAt: ColumnHelper.updatedAt(),
  },
  (table) => [
    check("users_email_or_phone", sql`num_nonnulls(${table.email}, ${table.phone}) >= 1`),
  ],
);
