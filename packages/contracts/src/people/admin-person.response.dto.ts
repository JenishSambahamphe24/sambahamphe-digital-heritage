import { z } from "zod";

import { fuzzyDateSchema } from "@repo/dates";

import { placeSummaryResponseSchema } from "../places/place-summary.response.dto.js";
import { consentResponseSchema } from "./consent.response.dto.js";
import { fieldVisibilitySchema } from "./field-visibility.dto.js";
import { personNameResponseSchema } from "./person-name.response.dto.js";
import {
  GENDERS,
  LINEAGE_ROLES,
  LIVING_STATUSES,
  PERSON_RECORD_STATUSES,
  VERIFICATION_STATUSES,
  VISIBILITY_LEVELS,
} from "./person.enums.js";

// The genealogy editor's full view; only returned on admin routes.
export const adminPersonResponseSchema = z.object({
  id: z.uuid(),
  recordStatus: z.enum(PERSON_RECORD_STATUSES),
  lineageRole: z.enum(LINEAGE_ROLES),
  isFoundingAncestor: z.boolean(),
  displayName: z.string(),
  names: z.array(personNameResponseSchema),
  gender: z.enum(GENDERS).nullable(),
  genderNote: z.string().nullable(),
  livingStatus: z.enum(LIVING_STATUSES),
  presumedLiving: z.boolean(),
  isMinor: z.boolean(),
  birthDate: fuzzyDateSchema.nullable(),
  deathDate: fuzzyDateSchema.nullable(),
  birthPlace: placeSummaryResponseSchema.nullable(),
  deathPlace: placeSummaryResponseSchema.nullable(),
  occupation: z.string().nullable(),
  internalNotes: z.string().nullable(),
  visibility: z.enum(VISIBILITY_LEVELS),
  fieldVisibility: fieldVisibilitySchema,
  verificationStatus: z.enum(VERIFICATION_STATUSES),
  consents: z.array(consentResponseSchema),
  version: z.int(),
  createdAt: z.iso.datetime({ offset: true }),
  updatedAt: z.iso.datetime({ offset: true }),
});

export type TAdminPersonResponse = z.infer<typeof adminPersonResponseSchema>;
