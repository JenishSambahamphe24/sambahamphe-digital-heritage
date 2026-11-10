import { z } from "zod";

import { fuzzyDateSchema } from "@repo/dates";

import { LINEAGE_ROLES, LIVING_STATUSES, PERSON_RECORD_STATUSES } from "./person.enums.js";

export const adminPersonListItemResponseSchema = z.object({
  id: z.uuid(),
  displayName: z.string(),
  // The alternative name that matched a search, if it wasn't the main one.
  matchedName: z.string().nullable(),
  lineageRole: z.enum(LINEAGE_ROLES),
  livingStatus: z.enum(LIVING_STATUSES),
  presumedLiving: z.boolean(),
  recordStatus: z.enum(PERSON_RECORD_STATUSES),
  birthDate: fuzzyDateSchema.nullable(),
  updatedAt: z.iso.datetime({ offset: true }),
});

export type TAdminPersonListItemResponse = z.infer<typeof adminPersonListItemResponseSchema>;
