import { z } from "zod";

import { emailField } from "./fields.js";

export const emailRequestSchema = z.object({ email: emailField });

export type TEmailRequest = z.infer<typeof emailRequestSchema>;
