import { z } from "zod";

import { fuzzyDateSchema } from "@repo/dates";

import { i18nTextSchema } from "../common/i18n-text.dto.js";
import { placeSummaryResponseSchema } from "../places/place-summary.response.dto.js";
import { orgUnitNodeResponseSchema } from "./org-unit-node.response.dto.js";
import { ORG_UNIT_STATUSES } from "./organization.enums.js";

export const orgUnitResponseSchema = z.object({
  id: z.uuid(),
  slug: z.string(),
  nameI18n: i18nTextSchema,
  typeId: z.uuid(),
  typeKey: z.string(),
  parentId: z.uuid().nullable(),
  // Root first, ending with the parent.
  ancestors: z.array(orgUnitNodeResponseSchema),
  place: placeSummaryResponseSchema.nullable(),
  establishedDate: fuzzyDateSchema.nullable(),
  dissolvedDate: fuzzyDateSchema.nullable(),
  status: z.enum(ORG_UNIT_STATUSES),
  sortOrder: z.int(),
  version: z.int(),
  createdAt: z.iso.datetime({ offset: true }),
  updatedAt: z.iso.datetime({ offset: true }),
});

export type TOrgUnitResponse = z.infer<typeof orgUnitResponseSchema>;
