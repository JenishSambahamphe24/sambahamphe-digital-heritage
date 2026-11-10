import type { TI18nText } from "./i18n-text.type.js";
import type { AnyPgColumn } from "drizzle-orm/pg-core";

import { index, jsonb, numeric, pgEnum, pgTable, text, uuid } from "drizzle-orm/pg-core";

import { ColumnHelper } from "./column.helper.js";
import { users } from "./users.schema.js";

export const placeKind = pgEnum("place_kind", [
  "country",
  "province",
  "district",
  "municipality",
  "ward",
  "village",
  "locality",
  "venue",
  "other",
]);

export const places = pgTable(
  "places",
  {
    id: ColumnHelper.primaryId(),
    parentId: uuid("parent_id").references((): AnyPgColumn => places.id),
    kind: placeKind("kind").notNull(),
    nameI18n: jsonb("name_i18n").$type<TI18nText>().notNull(),
    latitude: numeric("latitude", { precision: 9, scale: 6 }),
    longitude: numeric("longitude", { precision: 9, scale: 6 }),
    notes: text("notes"),
    version: ColumnHelper.version(),
    createdAt: ColumnHelper.createdAt(),
    updatedAt: ColumnHelper.updatedAt(),
    createdBy: uuid("created_by").references(() => users.id),
    updatedBy: uuid("updated_by").references(() => users.id),
  },
  (table) => [index("places_parent_id_idx").on(table.parentId)],
);
