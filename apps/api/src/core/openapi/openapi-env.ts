import type { TEnv } from "../config/env.schema.js";

import { EnvHelper } from "../config/env.helper.js";

// Building the document instantiates the app but never starts it: nothing
// connects, so placeholder settings are enough and the output never depends
// on whose machine generated it.
export const OPENAPI_PLACEHOLDER_ENV: TEnv = EnvHelper.parse({
  NODE_ENV: "test",
  LOG_LEVEL: "silent",
  DATABASE_URL: "postgres://openapi:openapi@127.0.0.1:1/openapi",
  REDIS_URL: "redis://127.0.0.1:1",
  SMTP_URL: "smtp://127.0.0.1:1",
  MAIL_FROM: "openapi@localhost",
  PUBLIC_WEB_URL: "http://localhost:3000",
  ADMIN_WEB_URL: "http://localhost:3002",
  IP_HASH_SECRET: "openapi-generation-placeholder-secret",
});
