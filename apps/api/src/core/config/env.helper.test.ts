import { describe, expect, it } from "vitest";

import { EnvHelper } from "./env.helper.js";
import { InvalidEnvError } from "./invalid-env.error.js";

const VALID_DATABASE_URL = "postgres://user:pass@localhost:5432/db";

describe("EnvHelper.parse", () => {
  it("applies defaults when only the database URL is given", () => {
    const env = EnvHelper.parse({ DATABASE_URL: VALID_DATABASE_URL });

    expect(env).toEqual({
      NODE_ENV: "development",
      PORT: 3001,
      DATABASE_URL: VALID_DATABASE_URL,
      LOG_LEVEL: "info",
    });
  });

  it("coerces PORT from a string", () => {
    expect(EnvHelper.parse({ DATABASE_URL: VALID_DATABASE_URL, PORT: "4000" }).PORT).toBe(4000);
  });

  it("accepts the postgresql:// scheme too", () => {
    const url = "postgresql://user:pass@localhost:5432/db";
    expect(EnvHelper.parse({ DATABASE_URL: url }).DATABASE_URL).toBe(url);
  });

  it("lists every invalid field at once", () => {
    const parse = () => EnvHelper.parse({ DATABASE_URL: "mysql://x", PORT: "abc" });

    expect(parse).toThrow(InvalidEnvError);
    try {
      parse();
    } catch (error) {
      const fields = (error as InvalidEnvError).issues.map((issue) => issue.split(":")[0]);
      expect(fields.sort()).toEqual(["DATABASE_URL", "PORT"]);
    }
  });

  it("rejects a missing database URL", () => {
    expect(() => EnvHelper.parse({})).toThrow(/DATABASE_URL/);
  });
});
