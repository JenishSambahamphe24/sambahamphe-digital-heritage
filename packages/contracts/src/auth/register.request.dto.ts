import { z } from "zod";

import { displayNameField, emailField, localeField, passwordField } from "./auth-fields.js";

export const registerRequestSchema = z.object({
  email: emailField,
  password: passwordField,
  displayName: displayNameField,
  locale: localeField,
});

export type TRegisterRequest = z.infer<typeof registerRequestSchema>;
