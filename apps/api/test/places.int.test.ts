import type { App } from "supertest/types.js";

import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { TestAccounts } from "./support/test-accounts.js";
import { TestStack } from "./support/test-stack.js";

let stack: TestStack;
let server: App;
let editor: Awaited<ReturnType<typeof TestAccounts.withRole>>;
let admin: Awaited<ReturnType<typeof TestAccounts.withRole>>;

async function createPlace(body: Record<string, unknown>) {
  const response = await TestAccounts.admin(server, editor.cookie).post("/admin/places").send(body);
  expect(response.status).toBe(201);
  return response.body as { id: string; version: number };
}

beforeAll(async () => {
  stack = await TestStack.start();
  server = stack.app.getHttpServer();
  editor = await TestAccounts.withRole(stack, server, "place-editor", "genealogy_editor");
  admin = await TestAccounts.withRole(stack, server, "plain-admin", "admin");
});

afterAll(async () => {
  await stack?.stop();
});

describe("places", () => {
  let district: { id: string; version: number };
  let municipality: { id: string; version: number };

  it("builds a hierarchy and shows the ancestor path", async () => {
    const country = await createPlace({ kind: "country", nameI18n: { en: "Nepal", ne: "नेपाल" } });
    district = await createPlace({
      kind: "district",
      parentId: country.id,
      nameI18n: { en: "Panchthar" },
    });
    municipality = await createPlace({
      kind: "municipality",
      parentId: district.id,
      nameI18n: { en: "Phidim" },
      altNames: [{ name: "Phidim VDC", kind: "historical", validToYear: 2017 }],
    });

    const response = await request(server).get(`/api/v1/places/${municipality.id}`).expect(200);
    expect(response.body.ancestors.map((a: { nameI18n: { en: string } }) => a.nameI18n.en)).toEqual(
      ["Nepal", "Panchthar"],
    );
    expect(response.body.altNames[0]).toMatchObject({ name: "Phidim VDC", kind: "historical" });
  });

  it("lists children and finds a place by its old name", async () => {
    const children = await request(server)
      .get(`/api/v1/places?parentId=${district.id}`)
      .expect(200);
    expect(children.body.data).toHaveLength(1);

    const search = await request(server).get("/api/v1/places?q=Phidim%20VDC").expect(200);
    expect(search.body.data[0]).toMatchObject({
      id: municipality.id,
      matchedAltName: "Phidim VDC",
    });
    expect(search.body.data[0].ancestors).toHaveLength(2);
  });

  it("refuses a stale version with 409 and the current version", async () => {
    const body = {
      kind: "district",
      nameI18n: { en: "Panchthar District" },
      version: district.version,
    };
    const first = await TestAccounts.admin(server, editor.cookie)
      .patch(`/admin/places/${district.id}`)
      .send(body)
      .expect(200);
    expect(first.body.version).toBe(district.version + 1);

    const stale = await TestAccounts.admin(server, editor.cookie)
      .patch(`/admin/places/${district.id}`)
      .send(body)
      .expect(409);
    expect(stale.body).toMatchObject({
      code: "version_conflict",
      currentVersion: district.version + 1,
    });
  });

  it("refuses to put a place inside its own sub-place", async () => {
    const current = await request(server).get(`/api/v1/places/${district.id}`).expect(200);
    const response = await TestAccounts.admin(server, editor.cookie)
      .patch(`/admin/places/${district.id}`)
      .send({
        kind: "district",
        nameI18n: { en: "Panchthar" },
        parentId: municipality.id,
        version: current.body.version,
      })
      .expect(422);
    expect(response.body.code).toBe("place_cycle");
  });

  it("requires place:manage to write", async () => {
    await TestAccounts.admin(server, admin.cookie)
      .post("/admin/places")
      .send({ kind: "village", nameI18n: { en: "Nowhere" } })
      .expect(403);
  });

  it("audits writes without names", async () => {
    const rows = await stack.database.query<{ action: string; changes: Record<string, unknown> }>(
      `select action, changes from audit_log where entity_type = 'place' order by id`,
    );
    expect(rows.map((row) => row.action)).toContain("place.created");
    expect(JSON.stringify(rows)).not.toContain("Panchthar");
  });
});
