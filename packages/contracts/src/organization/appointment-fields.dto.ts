import { z } from "zod";

import { isoDateField } from "../common/iso-date.dto.js";
import {
  APPOINTMENT_END_REASONS,
  APPOINTMENT_TYPES,
  DATE_PRECISIONS,
} from "./organization.enums.js";

const MAX_NOTES_LENGTH = 2000;

export const appointmentFieldsSchema = z
  .object({
    personId: z.uuid(),
    positionId: z.uuid(),
    termId: z.uuid().nullish(),
    appointmentType: z.enum(APPOINTMENT_TYPES).default("elected"),
    startsOn: isoDateField,
    endsOn: isoDateField.nullish(),
    datePrecision: z.enum(DATE_PRECISIONS).default("day"),
    endReason: z.enum(APPOINTMENT_END_REASONS).nullish(),
    notes: z.string().trim().max(MAX_NOTES_LENGTH).nullish(),
  })
  .refine((appointment) => !appointment.endsOn || appointment.endsOn > appointment.startsOn, {
    message: "The end must be after the start",
    path: ["endsOn"],
  })
  .refine((appointment) => !appointment.endReason || Boolean(appointment.endsOn), {
    message: "Give the end date for this reason",
    path: ["endsOn"],
  });

export type TAppointmentFields = z.infer<typeof appointmentFieldsSchema>;
