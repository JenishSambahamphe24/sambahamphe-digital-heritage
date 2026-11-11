import type { z } from "zod";

import { appointmentFieldsSchema } from "./appointment-fields.dto.js";

export const createAppointmentRequestSchema = appointmentFieldsSchema;

export type TCreateAppointmentRequest = z.infer<typeof createAppointmentRequestSchema>;
