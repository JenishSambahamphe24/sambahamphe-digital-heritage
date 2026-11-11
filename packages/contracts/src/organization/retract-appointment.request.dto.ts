import { z } from "zod";

import { versionField } from "../common/version.dto.js";

const MAX_REASON_LENGTH = 500;

export const retractAppointmentRequestSchema = z.object({
  version: versionField,
  reason: z.string().trim().min(1).max(MAX_REASON_LENGTH),
});

export type TRetractAppointmentRequest = z.infer<typeof retractAppointmentRequestSchema>;
