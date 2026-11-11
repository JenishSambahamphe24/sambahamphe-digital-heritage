import { z } from "zod";

import { isoDateField } from "../common/iso-date.dto.js";
import {
  APPOINTMENT_END_REASONS,
  APPOINTMENT_TYPES,
  ASSERTION_STATUSES,
  DATE_PRECISIONS,
} from "./organization.enums.js";

// The organization manager's view, on admin routes only.
export const appointmentResponseSchema = z.object({
  id: z.uuid(),
  person: z.object({ id: z.uuid(), displayName: z.string() }),
  orgUnitId: z.uuid(),
  positionId: z.uuid(),
  termId: z.uuid().nullable(),
  appointmentType: z.enum(APPOINTMENT_TYPES),
  startsOn: isoDateField,
  endsOn: isoDateField.nullable(),
  datePrecision: z.enum(DATE_PRECISIONS),
  endReason: z.enum(APPOINTMENT_END_REASONS).nullable(),
  recordStatus: z.enum(ASSERTION_STATUSES),
  notes: z.string().nullable(),
  version: z.int(),
});

export type TAppointmentResponse = z.infer<typeof appointmentResponseSchema>;
