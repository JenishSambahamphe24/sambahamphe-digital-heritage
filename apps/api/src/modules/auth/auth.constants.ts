const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

export const CLIENT_HEADER = "x-client";

export const SESSION_COOKIE = {
  web: "sid",
  admin: "admin_sid",
} as const;

export const SESSION_LIFETIME = {
  member: { idleMs: 30 * DAY_MS, absoluteMs: 180 * DAY_MS },
  admin: { idleMs: 2 * HOUR_MS, absoluteMs: 12 * HOUR_MS },
} as const;

// Extending the idle expiry on every request would mean a database write per
// request; once a minute is precise enough.
export const SESSION_TOUCH_INTERVAL_MS = MINUTE_MS;

export const SESSION_TOKEN_BYTES = 32;

export const EMAIL_VERIFICATION_TTL_MS = DAY_MS;
export const PASSWORD_RESET_TTL_MS = HOUR_MS;

export const PASSWORD_MIN_LENGTH = 10;
// argon2 cost grows with input; capping it stops multi-megabyte "passwords"
// from being used to burn CPU.
export const PASSWORD_MAX_LENGTH = 128;

export const AUTH_RATE_LIMIT = { limit: 10, ttl: MINUTE_MS } as const;
export const DEFAULT_RATE_LIMIT = { limit: 300, ttl: MINUTE_MS } as const;
