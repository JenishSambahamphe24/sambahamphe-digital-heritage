import { z } from "zod";

import { isoDateField } from "../common/iso-date.dto.js";
import { versionField } from "../common/version.dto.js";
import {
  APPOINTMENT_END_REASONS,
  APPOINTMENT_TYPES,
  DATE_PRECISIONS,
} from "./organization.enums.js";

const MAX_NOTES_LENGTH = 2000;

// Who and which seat are fixed; a wrong person or seat is retracted and re-entered.
export const updateAppointmentRequestSchema = z
  .object({
    termId: z.uuid().nullish(),
    appointmentType: z.enum(APPOINTMENT_TYPES),
    startsOn: isoDateField,
    endsOn: isoDateField.nullish(),
    datePrecision: z.enum(DATE_PRECISIONS),
    endReason: z.enum(APPOINTMENT_END_REASONS).nullish(),
    notes: z.string().trim().max(MAX_NOTES_LENGTH).nullish(),
    version: versionField,
  })
  .refine((appointment) => !appointment.endsOn || appointment.endsOn > appointment.startsOn, {
    message: "The end must be after the start",
    path: ["endsOn"],
  })
  .refine((appointment) => !appointment.endReason || Boolean(appointment.endsOn), {
    message: "Give the end date for this reason",
    path: ["endsOn"],
  });

export type TUpdateAppointmentRequest = z.infer<typeof updateAppointmentRequestSchema>;
