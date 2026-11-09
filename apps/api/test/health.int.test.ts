import type { NestExpressApplication } from "@nestjs/platform-express";

import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { AppFactory } from "../src/app.factory.js";
import { TestDatabase } from "./support/test-database.js";
import { TestEnv } from "./support/test-env.js";

// Port 1 is never a Postgres server, so connections fail fast.
const UNREACHABLE_DATABASE_URL = "postgres://nobody:nothing@127.0.0.1:1/none";

async function createApp(databaseUrl: string): Promise<NestExpressApplication> {
  const env = TestEnv.build({ DATABASE_URL: databaseUrl });
  const app = await AppFactory.create(env);
  await app.init();
  return app;
}

describe("health and error handling (real Postgres)", () => {
  let database: TestDatabase;
  let app: NestExpressApplication;

  beforeAll(async () => {
    database = await TestDatabase.start();
    app = await createApp(database.url);
  });

  afterAll(async () => {
    await app?.close();
    await database?.stop();
  });

  it("migrations enable the extensions the schema relies on", async () => {
    const rows = await database.query<{ extname: string }>(
      "select extname from pg_extension where extname <> 'plpgsql' order by extname",
    );
    expect(rows.map((row) => row.extname)).toEqual(["btree_gist", "citext", "pg_trgm", "unaccent"]);
  });

  it("GET /health/live answers with a generated request id", async () => {
    const response = await request(app.getHttpServer()).get("/health/live").expect(200);

    expect(response.body).toEqual({ status: "ok" });
    expect(response.headers["x-request-id"]).toMatch(/^[0-9a-f-]{36}$/);
  });

  it("GET /health/ready checks the database", async () => {
    const response = await request(app.getHttpServer()).get("/health/ready").expect(200);

    expect(response.body).toEqual({ status: "ok", checks: { database: "ok" } });
  });

  it("keeps a safe client request id and replaces an unsafe one", async () => {
    const kept = await request(app.getHttpServer())
      .get("/health/live")
      .set("X-Request-Id", "trace-abc.123");
    const replaced = await request(app.getHttpServer())
      .get("/health/live")
      .set("X-Request-Id", "bad id<script>");

    expect(kept.headers["x-request-id"]).toBe("trace-abc.123");
    expect(replaced.headers["x-request-id"]).not.toContain("<script>");
  });

  it("unknown routes return problem+json carrying the request id", async () => {
    const response = await request(app.getHttpServer()).get("/api/v1/nope").expect(404);

    expect(response.headers["content-type"]).toContain("application/problem+json");
    expect(response.body).toMatchObject({
      type: "urn:sambahamphe:problem:not_found",
      status: 404,
      code: "not_found",
      instance: "/api/v1/nope",
      requestId: response.headers["x-request-id"],
    });
  });

  it("health routes are not served under the API prefix", async () => {
    await request(app.getHttpServer()).get("/api/v1/health/live").expect(404);
  });
});

describe("readiness when the database is down", () => {
  let app: NestExpressApplication;

  beforeAll(async () => {
    app = await createApp(UNREACHABLE_DATABASE_URL);
  });

  afterAll(async () => {
    await app?.close();
  });

  it("GET /health/ready returns 503 problem+json without leaking connection details", async () => {
    const response = await request(app.getHttpServer()).get("/health/ready").expect(503);

    expect(response.body).toMatchObject({ code: "service_unavailable", status: 503 });
    expect(JSON.stringify(response.body)).not.toContain("127.0.0.1");
  });

  it("liveness stays green: the process itself is fine", async () => {
    await request(app.getHttpServer()).get("/health/live").expect(200);
  });
});
