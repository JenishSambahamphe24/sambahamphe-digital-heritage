import { z } from "zod";

import { passwordField, tokenField } from "./auth-fields.js";

export const confirmPasswordResetRequestSchema = z.object({
  token: tokenField,
  newPassword: passwordField,
});

export type TConfirmPasswordResetRequest = z.infer<typeof confirmPasswordResetRequestSchema>;
