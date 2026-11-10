import type { TI18nText } from "@repo/contracts";

import { jsonb, pgTable, text } from "drizzle-orm/pg-core";

import { ColumnHelper } from "./column.helper.js";

export const organizations = pgTable("organizations", {
  id: ColumnHelper.primaryId(),
  slug: text("slug").notNull().unique(),
  nameI18n: jsonb("name_i18n").$type<TI18nText>().notNull(),
  shortName: text("short_name"),
  createdAt: ColumnHelper.createdAt(),
  updatedAt: ColumnHelper.updatedAt(),
});
