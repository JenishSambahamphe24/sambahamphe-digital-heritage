import type { TI18nText } from "@repo/contracts";

import { sql } from "drizzle-orm";
import {
  check,
  date,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  unique,
  uuid,
} from "drizzle-orm/pg-core";

import { DATE_PRECISIONS } from "@repo/contracts";

import { ColumnHelper } from "./column.helper.js";
import { daterange } from "./daterange.type.js";
import { orgUnits } from "./org-units.schema.js";
import { users } from "./users.schema.js";

export const datePrecision = pgEnum("date_precision", DATE_PRECISIONS);

// A board's tenure. The election event link arrives with events (M2.5).
// No two terms of one unit overlap: exclusion constraint, migration 0008.
export const terms = pgTable(
  "terms",
  {
    id: ColumnHelper.primaryId(),
    orgUnitId: uuid("org_unit_id")
      .notNull()
      .references(() => orgUnits.id),
    ordinal: integer("ordinal"),
    labelI18n: jsonb("label_i18n").$type<TI18nText>(),
    startsOn: date("starts_on").notNull(),
    endsOn: date("ends_on"),
    datePrecision: datePrecision("date_precision").notNull().default("day"),
    notes: text("notes"),
    period: daterange("period").generatedAlwaysAs(sql`daterange(starts_on, ends_on, '[)')`),
    version: ColumnHelper.version(),
    createdAt: ColumnHelper.createdAt(),
    updatedAt: ColumnHelper.updatedAt(),
    createdBy: uuid("created_by").references(() => users.id),
    updatedBy: uuid("updated_by").references(() => users.id),
  },
  (table) => [
    check(
      "terms_end_after_start",
      sql`${table.endsOn} is null or ${table.endsOn} > ${table.startsOn}`,
    ),
    unique("terms_id_unit_unique").on(table.id, table.orgUnitId),
  ],
);
