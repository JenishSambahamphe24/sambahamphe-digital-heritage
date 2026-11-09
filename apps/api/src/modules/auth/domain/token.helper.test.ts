import { describe, expect, it } from "vitest";

import { TokenHelper } from "./token.helper.js";

describe("TokenHelper", () => {
  it("generates URL-safe tokens carrying 256 bits", () => {
    const token = TokenHelper.generate();

    expect(token).toMatch(/^[\w-]+$/);
    expect(Buffer.from(token, "base64url")).toHaveLength(32);
  });

  it("never repeats", () => {
    const tokens = new Set(Array.from({ length: 1_000 }, () => TokenHelper.generate()));
    expect(tokens.size).toBe(1_000);
  });

  it("hashes deterministically without returning the token itself", () => {
    const token = TokenHelper.generate();

    expect(TokenHelper.hash(token)).toBe(TokenHelper.hash(token));
    expect(TokenHelper.hash(token)).not.toContain(token);
    expect(TokenHelper.hash(token)).toMatch(/^[0-9a-f]{64}$/);
  });
});
