import { z } from "zod";

import { PASSWORD_MAX_LENGTH } from "../../auth.constants.js";
import { emailField } from "./fields.js";

// No minimum length on login: an old account's shorter password must still be
// accepted; length rules apply only when a password is set.
export const loginRequestSchema = z.object({
  email: emailField,
  password: z.string().min(1).max(PASSWORD_MAX_LENGTH),
});

export type TLoginRequest = z.infer<typeof loginRequestSchema>;
