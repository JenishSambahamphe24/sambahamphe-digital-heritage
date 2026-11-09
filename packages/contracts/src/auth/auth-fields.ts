import { z } from "zod";

import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH, SUPPORTED_LOCALES } from "./auth.limits.js";

const DISPLAY_NAME_MAX_LENGTH = 100;
const TOKEN_MAX_LENGTH = 128;

export const emailField = z.string().trim().toLowerCase().pipe(z.email());
export const passwordField = z.string().min(PASSWORD_MIN_LENGTH).max(PASSWORD_MAX_LENGTH);
export const displayNameField = z.string().trim().min(1).max(DISPLAY_NAME_MAX_LENGTH);
export const tokenField = z.string().min(1).max(TOKEN_MAX_LENGTH);
export const localeField = z.enum(SUPPORTED_LOCALES).default("en");
