import { z } from "zod";

import { CONSENT_RELATIONS, FIELD_GROUPS, VISIBILITY_LEVELS } from "./person.enums.js";

export const consentResponseSchema = z.object({
  id: z.uuid(),
  grantedByName: z.string(),
  relationToSubject: z.enum(CONSENT_RELATIONS),
  scope: z.object({
    visibility: z.enum(VISIBILITY_LEVELS),
    fieldGroups: z.array(z.enum(FIELD_GROUPS)),
  }),
  grantedAt: z.iso.datetime({ offset: true }),
  revokedAt: z.iso.datetime({ offset: true }).nullable(),
  notes: z.string().nullable(),
});

export type TConsentResponse = z.infer<typeof consentResponseSchema>;
