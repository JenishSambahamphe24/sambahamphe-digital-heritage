import { z } from "zod";

import { NAME_TYPES } from "./person.enums.js";

export const personNameResponseSchema = z.object({
  nameType: z.enum(NAME_TYPES),
  givenName: z.string().nullable(),
  surname: z.string().nullable(),
  fullName: z.string(),
  language: z.string().nullable(),
  script: z.string().nullable(),
  isPrimary: z.boolean(),
});

export type TPersonNameResponse = z.infer<typeof personNameResponseSchema>;
