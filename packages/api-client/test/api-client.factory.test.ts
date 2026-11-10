import { describe, expect, it } from "vitest";

import { ApiClientFactory } from "../src/api-client.factory.js";

interface ICapturedRequest {
  url: string;
  method: string;
  headers: Headers;
  credentials: Request["credentials"];
  body: string;
}

function recordingFetch(status: number, body: unknown) {
  const requests: ICapturedRequest[] = [];
  const fetch = async (input: Request) => {
    requests.push({
      url: input.url,
      method: input.method,
      headers: input.headers,
      credentials: input.credentials,
      body: await input.text(),
    });
    return new Response(JSON.stringify(body), {
      status,
      headers: { "Content-Type": "application/json" },
    });
  };
  return { fetch: fetch as unknown as typeof globalThis.fetch, requests };
}

describe("ApiClientFactory", () => {
  it("sends typed JSON to the documented path with the client header", async () => {
    const { fetch, requests } = recordingFetch(200, {
      user: {
        id: "0193",
        email: "ram@example.com",
        emailVerified: true,
        displayName: "Ram",
        preferredLocale: "en",
      },
    });
    const api = ApiClientFactory.create({ baseUrl: "http://localhost:3000", client: "web", fetch });

    const { data, error } = await api.POST("/api/v1/auth/login", {
      body: { email: "ram@example.com", password: "correct horse battery" },
    });

    expect(error).toBeUndefined();
    expect(data?.user.displayName).toBe("Ram");
    expect(requests[0]).toMatchObject({
      url: "http://localhost:3000/api/v1/auth/login",
      method: "POST",
      credentials: "same-origin",
    });
    expect(requests[0]?.headers.get("X-Client")).toBe("web");
    expect(JSON.parse(requests[0]?.body ?? "{}")).toEqual({
      email: "ram@example.com",
      password: "correct horse battery",
    });
  });

  it("gives mobile a Bearer token and never sends cookies", async () => {
    const { fetch, requests } = recordingFetch(200, {});
    const api = ApiClientFactory.create({
      baseUrl: "https://api.example",
      client: "mobile",
      sessionToken: "secret-token",
      fetch,
    });

    await api.GET("/api/v1/me");

    expect(requests[0]?.headers.get("Authorization")).toBe("Bearer secret-token");
    expect(requests[0]?.credentials).toBe("omit");
  });

  it("returns problem details as a typed error", async () => {
    const { fetch } = recordingFetch(401, {
      type: "urn:sambahamphe:problem:invalid_credentials",
      title: "Invalid credentials",
      status: 401,
      code: "invalid_credentials",
      detail: "The email or password is incorrect.",
      instance: "/api/v1/auth/login",
      requestId: "req-1",
    });
    const api = ApiClientFactory.create({ baseUrl: "http://localhost:3000", client: "web", fetch });

    const { data, error } = await api.POST("/api/v1/auth/login", {
      body: { email: "ram@example.com", password: "wrong password!" },
    });

    expect(data).toBeUndefined();
    expect(error?.code).toBe("invalid_credentials");
  });

  it("rejects mistakes at compile time", () => {
    const api = ApiClientFactory.create({ baseUrl: "", client: "web" });
    // These lines are never executed; `tsc` fails if the client stops catching them.
    const neverCalled = () => {
      // @ts-expect-error — no such endpoint
      void api.GET("/api/v1/not-a-route");
      // @ts-expect-error — misspelled field
      void api.POST("/api/v1/auth/login", { body: { emial: "x@example.com", password: "x" } });
      // @ts-expect-error — required path parameter missing
      void api.DELETE("/api/v1/me/sessions/{id}", {});
    };
    expect(neverCalled).toBeTypeOf("function");
  });
});
