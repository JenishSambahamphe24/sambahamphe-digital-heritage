import type { TI18nText } from "@repo/contracts";

import { sql } from "drizzle-orm";
import { boolean, check, integer, jsonb, pgTable, text, unique, uuid } from "drizzle-orm/pg-core";

import { ColumnHelper } from "./column.helper.js";
import { organizations } from "./organizations.schema.js";

// One list for the whole organization: the same positions on every board (Q-8).
export const positionDefinitions = pgTable(
  "position_definitions",
  {
    id: ColumnHelper.primaryId(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id),
    key: text("key").notNull(),
    titleI18n: jsonb("title_i18n").$type<TI18nText>().notNull(),
    rank: integer("rank").notNull(),
    isOfficeBearer: boolean("is_office_bearer").notNull().default(false),
    // null = any number of holders; 1 = one at a time.
    maxHolders: integer("max_holders"),
    active: boolean("active").notNull().default(true),
    version: ColumnHelper.version(),
    createdAt: ColumnHelper.createdAt(),
    updatedAt: ColumnHelper.updatedAt(),
  },
  (table) => [
    unique("position_definitions_key_unique").on(table.organizationId, table.key),
    check(
      "position_definitions_max_holders",
      sql`${table.maxHolders} is null or ${table.maxHolders} >= 1`,
    ),
  ],
);
