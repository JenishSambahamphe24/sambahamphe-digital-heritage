import { sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { ColumnHelper } from "./column.helper.js";
import { persons } from "./persons.schema.js";

export const nameType = pgEnum("name_type", [
  "birth",
  "given",
  "married",
  "alias",
  "ritual",
  "nickname",
  "honorific",
  "other",
]);

export const personNames = pgTable(
  "person_names",
  {
    id: ColumnHelper.primaryId(),
    personId: uuid("person_id")
      .notNull()
      .references(() => persons.id),
    nameType: nameType("name_type").notNull(),
    givenName: text("given_name"),
    // Free text: spelling varies, and it is never a lineage key.
    surname: text("surname"),
    fullName: text("full_name").notNull(),
    language: text("language"),
    script: text("script"),
    // Lowercase, unaccented Latin transliteration used for search.
    romanized: text("romanized").notNull(),
    isPrimary: boolean("is_primary").notNull().default(false),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: ColumnHelper.createdAt(),
    updatedAt: ColumnHelper.updatedAt(),
  },
  (table) => [
    uniqueIndex("person_names_one_primary")
      .on(table.personId)
      .where(sql`${table.isPrimary}`),
    index("person_names_person_id_idx").on(table.personId),
    index("person_names_romanized_trgm_idx").using("gin", table.romanized.op("gin_trgm_ops")),
    index("person_names_full_name_trgm_idx").using("gin", table.fullName.op("gin_trgm_ops")),
  ],
);
