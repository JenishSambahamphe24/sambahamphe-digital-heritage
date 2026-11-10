import type { App } from "supertest/types.js";

import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { TEST_PASSWORD, TestAccounts } from "./support/test-accounts.js";
import { TEST_WEB_ORIGIN } from "./support/test-env.js";
import { TestStack } from "./support/test-stack.js";

let stack: TestStack;
let server: App;
let editor: Awaited<ReturnType<typeof TestAccounts.withRole>>;
let admin: Awaited<ReturnType<typeof TestAccounts.withRole>>;
let memberCookie: string;

const API = "/api/v1";
const name = (fullName: string, extra: Record<string, unknown> = {}) => ({
  nameType: "birth",
  fullName,
  isPrimary: true,
  ...extra,
});

function asEditor() {
  return TestAccounts.admin(server, editor.cookie);
}

async function create(body: Record<string, unknown>) {
  const response = await asEditor().post("/admin/persons").send(body);
  expect(response.status, JSON.stringify(response.body)).toBe(201);
  return response.body as { id: string; version: number; visibility: string };
}

beforeAll(async () => {
  stack = await TestStack.start();
  server = stack.app.getHttpServer();
  editor = await TestAccounts.withRole(stack, server, "genealogy-editor", "genealogy_editor");
  admin = await TestAccounts.withRole(stack, server, "people-admin", "admin");
  const member = await TestAccounts.createVerified(stack, server, "member");
  const login = await request(server)
    .post(`${API}/auth/login`)
    .set("Origin", TEST_WEB_ORIGIN)
    .set("X-Forwarded-For", TestAccounts.freshIp())
    .send({ email: member.email, password: TEST_PASSWORD })
    .expect(200);
  const cookies = login.headers["set-cookie"] as unknown as string[];
  memberCookie = cookies.find((cookie) => cookie.startsWith("sid="))?.split(";")[0] ?? "";
});

afterAll(async () => {
  await stack?.stop();
});

describe("people", () => {
  let founder: { id: string };
  let living: { id: string; version: number; visibility: string };

  it("adds a deceased founder through an auto-approved change request", async () => {
    founder = await create({
      lineageRole: "lineage",
      gender: "male",
      isFoundingAncestor: true,
      livingStatus: "deceased",
      birthDate: { calendar: "BS", qualifier: "about", year: 1900 },
      names: [
        name("Sambahamphe Founder"),
        name("सम्बाहाङ्फे पुर्खा", { nameType: "alias", isPrimary: false, script: "Deva" }),
      ],
    });
    const [request] = await stack.database.query<{
      status: string;
      auto_approved: boolean;
      apply_status: string;
    }>(
      `select r.status, r.auto_approved, o.apply_status from change_requests r
       join change_request_operations o on o.change_request_id = r.id
       where o.result_entity_id = '${founder.id}'`,
    );
    expect(request).toMatchObject({
      status: "approved",
      auto_approved: true,
      apply_status: "applied",
    });
    const revisions = await stack.database.query(
      `select version from entity_revisions where entity_id = '${founder.id}'`,
    );
    expect(revisions).toHaveLength(1);
  });

  it("shows a deceased person to anyone", async () => {
    const response = await request(server).get(`${API}/persons/${founder.id}`).expect(200);
    expect(response.body).toMatchObject({
      displayName: "Sambahamphe Founder",
      birthDate: { calendar: "BS", year: 1900 },
    });
  });

  it("requires a birth year for a living person (ADR-023)", async () => {
    const response = await asEditor()
      .post("/admin/persons")
      .send({
        lineageRole: "lineage",
        gender: "male",
        livingStatus: "living",
        names: [name("No Year")],
      })
      .expect(422);
    expect(response.body.errors[0].code).toBe("birth_year_required");
  });

  it("hides a living adult from visitors and members, not from editors", async () => {
    living = await create({
      lineageRole: "lineage",
      gender: "female",
      livingStatus: "living",
      birthDate: { calendar: "AD", qualifier: "exact", year: 1985 },
      names: [name("Living Sambahamphe")],
    });
    expect(living.visibility).toBe("branch");
    await request(server).get(`${API}/persons/${living.id}`).expect(404);
    await request(server)
      .get(`${API}/persons/${living.id}`)
      .set("Cookie", memberCookie)
      .expect(404);
    await asEditor().get(`/admin/persons/${living.id}`).expect(200);
  });

  it("opens a living adult's names only with recorded consent", async () => {
    const opened = {
      lineageRole: "lineage",
      gender: "female",
      livingStatus: "living",
      birthDate: { calendar: "AD", qualifier: "exact", year: 1985 },
      names: [name("Living Sambahamphe")],
      visibility: "public",
      fieldVisibility: { names: "public" },
      version: living.version,
    };
    const refused = await asEditor().patch(`/admin/persons/${living.id}`).send(opened).expect(422);
    expect(refused.body.errors.map((error: { code: string }) => error.code)).toContain(
      "consent_required",
    );

    await asEditor()
      .post(`/admin/persons/${living.id}/consents`)
      .send({
        grantedByName: "The person herself",
        relationToSubject: "self",
        scope: { visibility: "public", fieldGroups: ["names"] },
        grantedAt: "2026-11-01T00:00:00Z",
      })
      .expect(201);
    const saved = await asEditor().patch(`/admin/persons/${living.id}`).send(opened).expect(200);
    living = saved.body;

    const visible = await request(server).get(`${API}/persons/${living.id}`).expect(200);
    expect(visible.body.displayName).toBe("Living Sambahamphe");
    expect(visible.body).not.toHaveProperty("birthDate");
  });

  it("refuses a stale version with 409", async () => {
    const response = await asEditor()
      .patch(`/admin/persons/${living.id}`)
      .send({
        lineageRole: "lineage",
        gender: "female",
        livingStatus: "living",
        birthDate: { calendar: "AD", qualifier: "exact", year: 1985 },
        names: [name("Stale")],
        version: 1,
      })
      .expect(409);
    expect(response.body).toMatchObject({
      code: "version_conflict",
      currentVersion: living.version,
    });
  });

  it("guards minors: authority note required, never public (ADR-023)", async () => {
    const minor = {
      lineageRole: "lineage",
      gender: "male",
      livingStatus: "living",
      birthDate: { calendar: "AD", qualifier: "exact", year: 2015 },
      names: [name("Young One")],
    };
    const noNote = await asEditor().post("/admin/persons").send(minor).expect(422);
    expect(noNote.body.errors[0].code).toBe("minor_authority_required");

    const publicMinor = await asEditor()
      .post("/admin/persons")
      .send({
        ...minor,
        reason: "Added at his father's request",
        visibility: "public",
        fieldVisibility: { names: "public" },
      })
      .expect(422);
    expect(publicMinor.body.errors.map((error: { code: string }) => error.code)).toContain(
      "minor_not_public",
    );

    const created = await create({ ...minor, reason: "Added at his father's request" });
    await request(server).get(`${API}/persons/${created.id}`).expect(404);
  });

  it("searches names in either script, without leaking hidden people", async () => {
    const latin = await request(server).get(`${API}/persons?q=sambahamphe`).expect(200);
    const ids = latin.body.data.map((person: { id: string }) => person.id);
    expect(ids).toContain(founder.id);
    expect(ids).toContain(living.id);
    expect(
      latin.body.data.find((person: { id: string }) => person.id === living.id),
    ).not.toHaveProperty("birthDate");
    expect(latin.body.page.total).toBe(2);

    const devanagari = await request(server)
      .get(`${API}/persons?q=${encodeURIComponent("सम्बाहाङ्फे")}`)
      .expect(200);
    expect(devanagari.body.data.map((person: { id: string }) => person.id)).toContain(founder.id);

    const young = await request(server).get(`${API}/persons?q=young`).expect(200);
    expect(young.body.data).toHaveLength(0);
    const editorSearch = await asEditor().get("/admin/persons?q=young").expect(200);
    expect(editorSearch.body.data).toHaveLength(1);
  });

  it("retracts instead of deleting", async () => {
    const current = await asEditor().get(`/admin/persons/${founder.id}`).expect(200);
    const retracted = await asEditor()
      .post(`/admin/persons/${founder.id}/retract`)
      .send({ version: current.body.version, reason: "Duplicate entry" })
      .expect(200);
    expect(retracted.body.recordStatus).toBe("retracted");
    await request(server).get(`${API}/persons/${founder.id}`).expect(404);
    await asEditor()
      .patch(`/admin/persons/${founder.id}`)
      .send({
        lineageRole: "lineage",
        gender: "male",
        livingStatus: "deceased",
        names: [name("x")],
        version: retracted.body.version,
      })
      .expect(409);
  });

  it("requires genealogy:edit for the editor routes", async () => {
    await TestAccounts.admin(server, admin.cookie).get("/admin/persons").expect(403);
  });

  it("keeps names and birth dates out of the audit log", async () => {
    const rows = await stack.database.query(
      `select changes from audit_log where entity_type in ('person', 'person_consent')`,
    );
    expect(rows.length).toBeGreaterThan(0);
    const text = JSON.stringify(rows);
    expect(text).not.toContain("Sambahamphe");
    expect(text).not.toContain("1985");
  });
});
