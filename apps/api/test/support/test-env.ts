import type { TEnv } from "../../src/core/config/env.schema.js";

import { EnvHelper } from "../../src/core/config/env.helper.js";

export const TEST_WEB_ORIGIN = "http://localhost:3000";
export const TEST_ADMIN_ORIGIN = "http://localhost:3002";

const UNUSED_REDIS_URL = "redis://127.0.0.1:1";
const UNUSED_SMTP_URL = "smtp://127.0.0.1:1";

export class TestEnv {
  static build(overrides: Partial<Record<keyof TEnv, string>> & { DATABASE_URL: string }): TEnv {
    return EnvHelper.parse({
      NODE_ENV: "test",
      LOG_LEVEL: "silent",
      REDIS_URL: UNUSED_REDIS_URL,
      SMTP_URL: UNUSED_SMTP_URL,
      MAIL_FROM: "Sambahamphe Test <test@sambahamphe.local>",
      PUBLIC_WEB_URL: TEST_WEB_ORIGIN,
      ADMIN_WEB_URL: TEST_ADMIN_ORIGIN,
      COOKIE_SECURE: "false",
      IP_HASH_SECRET: "test-secret-".padEnd(40, "x"),
      ...overrides,
    });
  }
}
