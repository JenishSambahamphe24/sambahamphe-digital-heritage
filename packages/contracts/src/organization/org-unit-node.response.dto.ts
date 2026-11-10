import { z } from "zod";

import { i18nTextSchema } from "../common/i18n-text.dto.js";
import { ORG_UNIT_STATUSES } from "./organization.enums.js";

// One board in the flat tree list; clients nest by parentId.
export const orgUnitNodeResponseSchema = z.object({
  id: z.uuid(),
  parentId: z.uuid().nullable(),
  slug: z.string(),
  nameI18n: i18nTextSchema,
  typeKey: z.string(),
  status: z.enum(ORG_UNIT_STATUSES),
  sortOrder: z.int(),
});

export type TOrgUnitNodeResponse = z.infer<typeof orgUnitNodeResponseSchema>;
