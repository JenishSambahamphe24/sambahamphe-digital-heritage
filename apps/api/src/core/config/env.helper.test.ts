import { describe, expect, it } from "vitest";

import { EnvHelper } from "./env.helper.js";
import { InvalidEnvError } from "./invalid-env.error.js";

const REQUIRED = {
  DATABASE_URL: "postgres://user:pass@localhost:5432/db",
  REDIS_URL: "redis://localhost:6379",
  SMTP_URL: "smtp://localhost:1025",
  MAIL_FROM: "Test <test@example.com>",
  PUBLIC_WEB_URL: "http://localhost:3000",
  ADMIN_WEB_URL: "http://localhost:3002",
  IP_HASH_SECRET: "x".repeat(32),
};

describe("EnvHelper.parse", () => {
  it("applies defaults for optional settings", () => {
    const env = EnvHelper.parse(REQUIRED);

    expect(env).toMatchObject({
      NODE_ENV: "development",
      PORT: 3001,
      LOG_LEVEL: "info",
      COOKIE_SECURE: true,
      TRUST_PROXY_HOPS: 0,
    });
  });

  it("coerces numbers and booleans from strings", () => {
    const env = EnvHelper.parse({ ...REQUIRED, PORT: "4000", COOKIE_SECURE: "false" });

    expect(env.PORT).toBe(4000);
    expect(env.COOKIE_SECURE).toBe(false);
  });

  it("accepts the postgresql:// scheme too", () => {
    const url = "postgresql://user:pass@localhost:5432/db";
    expect(EnvHelper.parse({ ...REQUIRED, DATABASE_URL: url }).DATABASE_URL).toBe(url);
  });

  it("lists every invalid field at once", () => {
    const parse = () => EnvHelper.parse({ ...REQUIRED, DATABASE_URL: "mysql://x", PORT: "abc" });

    expect(parse).toThrow(InvalidEnvError);
    try {
      parse();
    } catch (error) {
      const fields = (error as InvalidEnvError).issues.map((issue) => issue.split(":")[0]);
      expect(fields.sort()).toEqual(["DATABASE_URL", "PORT"]);
    }
  });

  it("rejects a short IP hash secret", () => {
    expect(() => EnvHelper.parse({ ...REQUIRED, IP_HASH_SECRET: "short" })).toThrow(
      /IP_HASH_SECRET/,
    );
  });
});
