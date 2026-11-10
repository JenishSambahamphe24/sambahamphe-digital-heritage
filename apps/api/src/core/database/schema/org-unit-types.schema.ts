import type { TI18nText } from "@repo/contracts";

import { integer, jsonb, pgTable, text, unique, uuid } from "drizzle-orm/pg-core";

import { ColumnHelper } from "./column.helper.js";
import { organizations } from "./organizations.schema.js";

// Configurable levels (central board, regional board, gaau committee, …).
export const orgUnitTypes = pgTable(
  "org_unit_types",
  {
    id: ColumnHelper.primaryId(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id),
    key: text("key").notNull(),
    nameI18n: jsonb("name_i18n").$type<TI18nText>().notNull(),
    levelOrder: integer("level_order").notNull(),
  },
  (table) => [unique("org_unit_types_key_unique").on(table.organizationId, table.key)],
);
