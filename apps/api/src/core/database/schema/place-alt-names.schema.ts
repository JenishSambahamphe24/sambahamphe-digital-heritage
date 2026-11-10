import { sql } from "drizzle-orm";
import { check, index, integer, pgEnum, pgTable, text, uuid } from "drizzle-orm/pg-core";

import { ColumnHelper } from "./column.helper.js";
import { places } from "./places.schema.js";

export const placeAltNameKind = pgEnum("place_alt_name_kind", [
  "historical",
  "variant",
  "official",
]);

// Historical and variant names (e.g. a VDC renamed into a municipality in 2017)
// so old records and searches still find the place.
export const placeAltNames = pgTable(
  "place_alt_names",
  {
    id: ColumnHelper.primaryId(),
    placeId: uuid("place_id")
      .notNull()
      .references(() => places.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    language: text("language"),
    script: text("script"),
    kind: placeAltNameKind("kind").notNull().default("variant"),
    validFromYear: integer("valid_from_year"),
    validToYear: integer("valid_to_year"),
  },
  (table) => [
    index("place_alt_names_place_id_idx").on(table.placeId),
    index("place_alt_names_name_trgm_idx").using("gin", table.name.op("gin_trgm_ops")),
    check(
      "place_alt_names_valid_years",
      sql`${table.validFromYear} is null or ${table.validToYear} is null or ${table.validFromYear} <= ${table.validToYear}`,
    ),
  ],
);
