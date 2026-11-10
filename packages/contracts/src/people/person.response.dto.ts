import { z } from "zod";

import { fuzzyDateSchema } from "@repo/dates";

import { placeSummaryResponseSchema } from "../places/place-summary.response.dto.js";
import { personNameResponseSchema } from "./person-name.response.dto.js";
import { GENDERS, LINEAGE_ROLES, LIVING_STATUSES } from "./person.enums.js";

// What a viewer may see after the privacy policy. Every field group is
// optional: a missing key means hidden, never "unknown".
export const personResponseSchema = z.object({
  id: z.uuid(),
  lineageRole: z.enum(LINEAGE_ROLES),
  displayName: z.string().optional(),
  names: z.array(personNameResponseSchema).optional(),
  gender: z.enum(GENDERS).nullable().optional(),
  livingStatus: z.enum(LIVING_STATUSES).optional(),
  birthDate: fuzzyDateSchema.nullable().optional(),
  deathDate: fuzzyDateSchema.nullable().optional(),
  birthPlace: placeSummaryResponseSchema.nullable().optional(),
  deathPlace: placeSummaryResponseSchema.nullable().optional(),
  occupation: z.string().nullable().optional(),
});

export type TPersonResponse = z.infer<typeof personResponseSchema>;
