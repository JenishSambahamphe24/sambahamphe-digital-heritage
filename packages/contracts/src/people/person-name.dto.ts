import { z } from "zod";

import { NAME_TYPES } from "./person.enums.js";

const MAX_NAME_LENGTH = 200;
const MAX_TAG_LENGTH = 16;

// The romanized search form is computed by the API, never sent.
export const personNameSchema = z.object({
  nameType: z.enum(NAME_TYPES),
  givenName: z.string().trim().max(MAX_NAME_LENGTH).nullish(),
  surname: z.string().trim().max(MAX_NAME_LENGTH).nullish(),
  fullName: z.string().trim().min(1).max(MAX_NAME_LENGTH),
  language: z.string().trim().max(MAX_TAG_LENGTH).nullish(),
  script: z.string().trim().max(MAX_TAG_LENGTH).nullish(),
  isPrimary: z.boolean().default(false),
});

export type TPersonName = z.infer<typeof personNameSchema>;
