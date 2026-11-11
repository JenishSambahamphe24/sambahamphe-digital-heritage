import { z } from "zod";

import { fuzzyDateSchema } from "@repo/dates";

import { i18nTextSchema } from "../common/i18n-text.dto.js";
import { ORG_UNIT_STATUSES } from "./organization.enums.js";

const MAX_SLUG_LENGTH = 80;
const MAX_SORT_ORDER = 10_000;

export const slugField = z
  .string()
  .trim()
  .min(1)
  .max(MAX_SLUG_LENGTH)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and dashes");

export const orgUnitFieldsSchema = z.object({
  typeId: z.uuid(),
  parentId: z.uuid().nullish(),
  slug: slugField,
  nameI18n: i18nTextSchema,
  placeId: z.uuid().nullish(),
  establishedDate: fuzzyDateSchema.nullish(),
  dissolvedDate: fuzzyDateSchema.nullish(),
  status: z.enum(ORG_UNIT_STATUSES).default("active"),
  sortOrder: z.int().min(0).max(MAX_SORT_ORDER).default(0),
});

export type TOrgUnitFields = z.infer<typeof orgUnitFieldsSchema>;
