import type { App } from "supertest/types.js";

import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { RoleAssignmentsService } from "../src/modules/access/application/role-assignments.service.js";
import { TestAccounts } from "./support/test-accounts.js";
import { TestStack } from "./support/test-stack.js";

const API = "/api/v1";

let stack: TestStack;
let server: App;
let manager: Awaited<ReturnType<typeof TestAccounts.withRole>>;
let types: Record<string, string>;
let centralId: string;
let regional: { id: string; version: number };
let gaau: { id: string };
let term: { id: string };
let chair: { id: string };
let member: { id: string };
const people = {
  adultA: "01900000-0000-7000-8000-0000000000c1",
  adultB: "01900000-0000-7000-8000-0000000000c2",
  adultC: "01900000-0000-7000-8000-0000000000c3",
  minor: "01900000-0000-7000-8000-0000000000c4",
};

function admin(cookie = manager.cookie) {
  return TestAccounts.admin(server, cookie);
}

async function addPerson(id: string, name: string, birthYear: number): Promise<void> {
  await stack.database.query(
    `insert into persons (id, lineage_role, gender, living_status, birth_sort_from, birth_sort_to)
     values ('${id}', 'lineage', 'male', 'living', '${birthYear}-01-01', '${birthYear}-12-31')`,
  );
  await stack.database.query(
    `insert into person_names (id, person_id, name_type, full_name, romanized, is_primary)
     values (gen_random_uuid(), '${id}', 'birth', '${name}', '${name.toLowerCase()}', true)`,
  );
}

function appoint(personId: string, positionId: string, extra: Record<string, unknown> = {}) {
  return admin()
    .post(`/admin/org/units/${centralId}/appointments`)
    .send({ personId, positionId, termId: term.id, startsOn: "2024-01-01", ...extra });
}

beforeAll(async () => {
  stack = await TestStack.start();
  server = stack.app.getHttpServer();
  manager = await TestAccounts.withRole(stack, server, "org-manager", "org_manager");
  await addPerson(people.adultA, "Adult A", 1970);
  await addPerson(people.adultB, "Adult B", 1975);
  await addPerson(people.adultC, "Adult C", 1980);
  await addPerson(people.minor, "Young Member", 2015);
});

afterAll(async () => {
  await stack?.stop();
});

describe("board structure", () => {
  it("starts with the seeded Central Board and three levels", async () => {
    const typeList = await request(server).get(`${API}/org/unit-types`).expect(200);
    types = Object.fromEntries(
      typeList.body.data.map((type: { key: string; id: string }) => [type.key, type.id]),
    );
    const tree = await request(server).get(`${API}/org/units`).expect(200);
    expect(tree.body.data).toHaveLength(1);
    centralId = tree.body.data[0].id;
  });

  it("builds central › regional › gaau and enforces the allowed levels", async () => {
    const created = await admin()
      .post("/admin/org/units")
      .send({
        typeId: types.regional_board,
        parentId: centralId,
        slug: "koshi-regional",
        nameI18n: { en: "Koshi Regional Board" },
      })
      .expect(201);
    regional = created.body;
    gaau = (
      await admin()
        .post("/admin/org/units")
        .send({
          typeId: types.gaau_committee,
          parentId: regional.id,
          slug: "phidim-gaau",
          nameI18n: { en: "Phidim Gaau Committee" },
        })
        .expect(201)
    ).body;

    const wrongLevel = await admin()
      .post("/admin/org/units")
      .send({
        typeId: types.gaau_committee,
        parentId: centralId,
        slug: "misplaced",
        nameI18n: { en: "Misplaced" },
      })
      .expect(422);
    expect(wrongLevel.body.errors[0].code).toBe("parent_type_not_allowed");

    const noParent = await admin()
      .post("/admin/org/units")
      .send({ typeId: types.regional_board, slug: "orphan", nameI18n: { en: "Orphan" } })
      .expect(422);
    expect(noParent.body.errors[0].code).toBe("parent_required");

    const taken = await admin()
      .post("/admin/org/units")
      .send({
        typeId: types.regional_board,
        parentId: centralId,
        slug: "koshi-regional",
        nameI18n: { en: "Again" },
      })
      .expect(409);
    expect(taken.body.code).toBe("slug_taken");
  });

  it("shows a unit with its ancestor path", async () => {
    const response = await request(server).get(`${API}/org/units/${gaau.id}`).expect(200);
    expect(response.body.ancestors.map((unit: { slug: string }) => unit.slug)).toEqual([
      "central-board",
      "koshi-regional",
    ]);
  });

  it("refuses a stale version with 409", async () => {
    const body = {
      typeId: types.regional_board,
      parentId: centralId,
      slug: "koshi-regional",
      nameI18n: { en: "Koshi Board" },
    };
    await admin()
      .patch(`/admin/org/units/${regional.id}`)
      .send({ ...body, version: regional.version })
      .expect(200);
    const stale = await admin()
      .patch(`/admin/org/units/${regional.id}`)
      .send({ ...body, version: regional.version })
      .expect(409);
    expect(stale.body.code).toBe("version_conflict");
  });
});

describe("terms, positions and appointments", () => {
  it("creates positions and a term; refuses an overlapping term", async () => {
    chair = (
      await admin()
        .post("/admin/org/positions")
        .send({
          key: "chairperson",
          titleI18n: { en: "Chairperson" },
          rank: 1,
          isOfficeBearer: true,
          maxHolders: 1,
        })
        .expect(201)
    ).body;
    member = (
      await admin()
        .post("/admin/org/positions")
        .send({ key: "member", titleI18n: { en: "Member" }, rank: 9, maxHolders: 2 })
        .expect(201)
    ).body;
    term = (
      await admin()
        .post(`/admin/org/units/${centralId}/terms`)
        .send({
          ordinal: 5,
          labelI18n: { en: "Fifth Central Committee" },
          startsOn: "2024-01-01",
          endsOn: "2028-01-01",
        })
        .expect(201)
    ).body;
    const overlap = await admin()
      .post(`/admin/org/units/${centralId}/terms`)
      .send({ startsOn: "2027-06-01" })
      .expect(409);
    expect(overlap.body.code).toBe("term_overlap");
  });

  it("allows one chairperson at a time", async () => {
    await appoint(people.adultA, chair.id).expect(201);
    const second = await appoint(people.adultB, chair.id).expect(409);
    expect(second.body.code).toBe("position_taken");
  });

  it("caps a several-holder position and refuses a double seat", async () => {
    await appoint(people.adultB, member.id).expect(201);
    const again = await appoint(people.adultB, member.id).expect(409);
    expect(again.body.code).toBe("already_appointed");
    await appoint(people.minor, member.id).expect(201);
    const full = await appoint(people.adultC, member.id).expect(409);
    expect(full.body.code).toBe("position_full");
  });

  it("refuses a start date outside the chosen term", async () => {
    const response = await appoint(people.adultC, chair.id, { startsOn: "2030-01-01" }).expect(422);
    expect(response.body.errors[0].code).toBe("outside_term");
  });

  it("shows the public board by rank, without the minor", async () => {
    const board = await request(server)
      .get(`${API}/org/units/${centralId}/board?termId=${term.id}`)
      .expect(200);
    expect(board.body.members.map((m: { displayName: string }) => m.displayName)).toEqual([
      "Adult A",
      "Adult B",
    ]);
    expect(board.body.members[0]).not.toHaveProperty("birthDate");
    expect(board.body.members[0].datePrecision).toBe("day");
    expect(board.body.term.ordinal).toBe(5);
  });

  it("retracts a mistaken entry, which frees the seat", async () => {
    const list = await admin().get(`/admin/org/units/${centralId}/appointments`).expect(200);
    const chairEntry = list.body.data.find(
      (a: { positionId: string }) => a.positionId === chair.id,
    );
    await admin()
      .post(`/admin/org/units/${centralId}/appointments/${chairEntry.id}/retract`)
      .send({ version: chairEntry.version, reason: "Entered on the wrong board" })
      .expect(200);
    await appoint(people.adultC, chair.id).expect(201);
    const board = await request(server)
      .get(`${API}/org/units/${centralId}/board?termId=${term.id}`)
      .expect(200);
    expect(board.body.members[0].displayName).toBe("Adult C");
  });
});

describe("a manager limited to one regional board", () => {
  let scoped: { cookie: string };

  beforeAll(async () => {
    const account = await TestAccounts.createVerified(stack, server, "regional-manager");
    await stack.app.get(RoleAssignmentsService).assign(null, {
      userId: account.id,
      roleKey: "org_manager",
      scopeType: "org_unit",
      orgUnitId: regional.id,
    });
    const login = await TestAccounts.adminLogin(server, account);
    scoped = { cookie: TestAccounts.adminCookie(login) };
  });

  it("manages its board and the boards under it", async () => {
    await admin(scoped.cookie)
      .post(`/admin/org/units/${gaau.id}/terms`)
      .send({ startsOn: "2025-01-01" })
      .expect(201);
  });

  it("can't touch the Central Board or the organization-wide positions", async () => {
    await admin(scoped.cookie)
      .post(`/admin/org/units/${centralId}/terms`)
      .send({ startsOn: "2030-01-01" })
      .expect(403);
    await admin(scoped.cookie)
      .post("/admin/org/positions")
      .send({ key: "advisor", titleI18n: { en: "Advisor" }, rank: 20 })
      .expect(403);
  });
});

describe("person lookup for appointments", () => {
  it("returns only id and name, for managers of the board", async () => {
    const response = await admin()
      .get(`/admin/org/person-options?unitId=${centralId}&q=adult`)
      .expect(200);
    expect(response.body.data.length).toBeGreaterThan(0);
    expect(Object.keys(response.body.data[0]).sort()).toEqual(["displayName", "id"]);
    const visitor = await request(server).get(
      `${API}/admin/org/person-options?unitId=${centralId}&q=adult`,
    );
    expect(visitor.status).toBe(401);
  });
});

describe("audit", () => {
  it("records organization changes without names", async () => {
    const rows = await stack.database.query(
      `select action, changes from audit_log where action like 'appointment.%' or action like 'org_unit.%'`,
    );
    expect(rows.length).toBeGreaterThan(0);
    expect(JSON.stringify(rows)).not.toContain("Adult");
  });
});
