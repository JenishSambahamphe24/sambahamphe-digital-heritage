import type { TI18nText } from "@repo/contracts";
import type { TFuzzyDate } from "@repo/dates";
import type { AnyPgColumn } from "drizzle-orm/pg-core";

import { sql } from "drizzle-orm";
import {
  check,
  date,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  uuid,
} from "drizzle-orm/pg-core";

import { ORG_UNIT_STATUSES } from "@repo/contracts";

import { ColumnHelper } from "./column.helper.js";
import { orgUnitTypes } from "./org-unit-types.schema.js";
import { organizations } from "./organizations.schema.js";
import { places } from "./places.schema.js";
import { users } from "./users.schema.js";

export const orgUnitStatus = pgEnum("org_unit_status", ORG_UNIT_STATUSES);

// Boards and committees. Only the top unit (the Central Board) has no parent.
export const orgUnits = pgTable(
  "org_units",
  {
    id: ColumnHelper.primaryId(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id),
    typeId: uuid("type_id")
      .notNull()
      .references(() => orgUnitTypes.id),
    parentId: uuid("parent_id").references((): AnyPgColumn => orgUnits.id),
    slug: text("slug").notNull().unique(),
    nameI18n: jsonb("name_i18n").$type<TI18nText>().notNull(),
    placeId: uuid("place_id").references(() => places.id),
    establishedDate: jsonb("established_date").$type<TFuzzyDate>(),
    establishedSort: date("established_sort"),
    dissolvedDate: jsonb("dissolved_date").$type<TFuzzyDate>(),
    dissolvedSort: date("dissolved_sort"),
    status: orgUnitStatus("status").notNull().default("active"),
    sortOrder: integer("sort_order").notNull().default(0),
    version: ColumnHelper.version(),
    createdAt: ColumnHelper.createdAt(),
    updatedAt: ColumnHelper.updatedAt(),
    createdBy: uuid("created_by").references(() => users.id),
    updatedBy: uuid("updated_by").references(() => users.id),
  },
  (table) => [
    index("org_units_parent_id_idx").on(table.parentId),
    check(
      "org_units_not_own_parent",
      sql`${table.parentId} is null or ${table.parentId} <> ${table.id}`,
    ),
  ],
);
