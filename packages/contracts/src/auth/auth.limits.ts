export const PASSWORD_MIN_LENGTH = 10;
// argon2 cost grows with input; capping it stops multi-megabyte "passwords"
// from being used to burn CPU.
export const PASSWORD_MAX_LENGTH = 128;

export const SUPPORTED_LOCALES = ["en", "ne"] as const;
