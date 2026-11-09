import type { Request } from "express";

import { describe, expect, it } from "vitest";

import { AuthClientHelper } from "./auth-client.helper.js";

function fakeRequest(
  headers: Record<string, string>,
  cookies: Record<string, string> = {},
): Request {
  return { headers, cookies } as unknown as Request;
}

describe("AuthClientHelper", () => {
  it("defaults to the web client and ignores unknown values", () => {
    expect(AuthClientHelper.fromRequest(fakeRequest({}))).toBe("web");
    expect(AuthClientHelper.fromRequest(fakeRequest({ "x-client": "superuser" }))).toBe("web");
    expect(AuthClientHelper.fromRequest(fakeRequest({ "x-client": "admin" }))).toBe("admin");
  });

  it("reads each browser client's own cookie only", () => {
    const request = fakeRequest({}, { sid: "web-token", admin_sid: "admin-token" });

    expect(AuthClientHelper.sessionToken(request, "web")).toBe("web-token");
    expect(AuthClientHelper.sessionToken(request, "admin")).toBe("admin-token");
  });

  it("reads mobile tokens from the Bearer header, never from cookies", () => {
    const withBearer = fakeRequest({ authorization: "Bearer mobile-token" }, { sid: "web-token" });
    const cookieOnly = fakeRequest({}, { sid: "web-token" });

    expect(AuthClientHelper.sessionToken(withBearer, "mobile")).toBe("mobile-token");
    expect(AuthClientHelper.sessionToken(cookieOnly, "mobile")).toBeNull();
    expect(
      AuthClientHelper.sessionToken(fakeRequest({ authorization: "Bearer " }), "mobile"),
    ).toBeNull();
  });
});
