import { z } from "zod";

import { CONSENT_RELATIONS, FIELD_GROUPS, VISIBILITY_LEVELS } from "./person.enums.js";

const MAX_NAME_LENGTH = 200;
const MAX_NOTES_LENGTH = 2000;

export const recordConsentRequestSchema = z.object({
  grantedByName: z.string().trim().min(1).max(MAX_NAME_LENGTH),
  relationToSubject: z.enum(CONSENT_RELATIONS),
  scope: z.object({
    visibility: z.enum(VISIBILITY_LEVELS),
    fieldGroups: z.array(z.enum(FIELD_GROUPS)).min(1),
  }),
  grantedAt: z.iso.datetime({ offset: true }),
  notes: z.string().trim().max(MAX_NOTES_LENGTH).nullish(),
});

export type TRecordConsentRequest = z.infer<typeof recordConsentRequestSchema>;
