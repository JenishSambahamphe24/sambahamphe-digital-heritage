import { z } from "zod";

import { appointmentResponseSchema } from "./appointment.response.dto.js";

export const appointmentListResponseSchema = z.object({ data: z.array(appointmentResponseSchema) });

export type TAppointmentListResponse = z.infer<typeof appointmentListResponseSchema>;
