import { z } from "zod";

import { versionField } from "../common/version.dto.js";

const MAX_REASON_LENGTH = 500;

export const retractPersonRequestSchema = z.object({
  version: versionField,
  reason: z.string().trim().min(1).max(MAX_REASON_LENGTH),
});

export type TRetractPersonRequest = z.infer<typeof retractPersonRequestSchema>;
