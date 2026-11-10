import { z } from "zod";

import { fuzzyDateSchema } from "@repo/dates";

import { fieldVisibilitySchema } from "./field-visibility.dto.js";
import { personNameSchema } from "./person-name.dto.js";
import { GENDERS, LINEAGE_ROLES, LIVING_STATUSES, VISIBILITY_LEVELS } from "./person.enums.js";

const MAX_NOTE_LENGTH = 2000;
const MAX_SHORT_TEXT_LENGTH = 200;
const MAX_NAMES = 20;

// The editable fields of a person, shared by create and update.
export const personFieldsSchema = z.object({
  lineageRole: z.enum(LINEAGE_ROLES),
  isFoundingAncestor: z.boolean().default(false),
  gender: z.enum(GENDERS).nullish(),
  genderNote: z.string().trim().max(MAX_SHORT_TEXT_LENGTH).nullish(),
  livingStatus: z.enum(LIVING_STATUSES).default("unknown"),
  birthDate: fuzzyDateSchema.nullish(),
  deathDate: fuzzyDateSchema.nullish(),
  birthPlaceId: z.uuid().nullish(),
  deathPlaceId: z.uuid().nullish(),
  occupation: z.string().trim().max(MAX_SHORT_TEXT_LENGTH).nullish(),
  internalNotes: z.string().trim().max(MAX_NOTE_LENGTH).nullish(),
  // Omitted on create: the API applies the defaults for the person's status.
  visibility: z.enum(VISIBILITY_LEVELS).optional(),
  fieldVisibility: fieldVisibilitySchema.optional(),
  names: z
    .array(personNameSchema)
    .min(1)
    .max(MAX_NAMES)
    .refine((names) => names.filter((name) => name.isPrimary).length === 1, {
      message: "Mark exactly one name as the main name",
    }),
});

export type TPersonFields = z.infer<typeof personFieldsSchema>;
