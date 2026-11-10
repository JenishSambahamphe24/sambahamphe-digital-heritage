import type { TI18nText } from "@repo/contracts";

import { jsonb, pgTable, text } from "drizzle-orm/pg-core";

import { ColumnHelper } from "./column.helper.js";

export const clans = pgTable("clans", {
  id: ColumnHelper.primaryId(),
  slug: text("slug").notNull().unique(),
  nameI18n: jsonb("name_i18n").$type<TI18nText>().notNull(),
  community: text("community").notNull().default("Limbu"),
  notes: text("notes"),
  createdAt: ColumnHelper.createdAt(),
  updatedAt: ColumnHelper.updatedAt(),
});
