import { z } from "zod";

export const personConsentParamsSchema = z.object({ id: z.uuid(), consentId: z.uuid() });

export type TPersonConsentParams = z.infer<typeof personConsentParamsSchema>;
