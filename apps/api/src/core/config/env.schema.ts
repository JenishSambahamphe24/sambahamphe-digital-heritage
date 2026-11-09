import { z } from "zod";

const MIN_SECRET_LENGTH = 32;

export const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().min(1).max(65_535).default(3001),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"]).default("info"),
  DATABASE_URL: z.url({ protocol: /^postgres(ql)?$/ }),
  REDIS_URL: z.url({ protocol: /^rediss?$/ }),
  SMTP_URL: z.url({ protocol: /^smtps?$/ }),
  MAIL_FROM: z.string().min(3),
  PUBLIC_WEB_URL: z.url({ protocol: /^https?$/ }),
  ADMIN_WEB_URL: z.url({ protocol: /^https?$/ }),
  COOKIE_SECURE: z.stringbool().default(true),
  TRUST_PROXY_HOPS: z.coerce.number().int().min(0).default(0),
  IP_HASH_SECRET: z.string().min(MIN_SECRET_LENGTH),
});

export type TEnv = z.infer<typeof envSchema>;
