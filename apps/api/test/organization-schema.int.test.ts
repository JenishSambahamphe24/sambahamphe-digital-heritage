import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { TestDatabase } from "./support/test-database.js";

let database: TestDatabase;
let unitId: string;
const PERSON_A = "01900000-0000-7000-8000-0000000000b1";
const PERSON_B = "01900000-0000-7000-8000-0000000000b2";

async function position(key: string, maxHolders: number | null): Promise<string> {
  const [row] = await database.query<{ id: string }>(
    `insert into position_definitions (id, organization_id, key, title_i18n, rank, max_holders)
     select gen_random_uuid(), id, '${key}', '{"en":"${key}"}', 1, ${maxHolders ?? "null"} from organizations
     returning id`,
  );
  return row?.id ?? "";
}

function appoint(
  personId: string,
  positionId: string,
  from: string,
  to: string | null,
): Promise<unknown> {
  return database.query(
    `insert into appointments (id, person_id, org_unit_id, position_id, starts_on, ends_on)
     values (gen_random_uuid(), '${personId}', '${unitId}', '${positionId}', '${from}', ${to ? `'${to}'` : "null"})`,
  );
}

beforeAll(async () => {
  database = await TestDatabase.start();
  const [unit] = await database.query<{ id: string }>(
    `select id from org_units where slug = 'central-board'`,
  );
  unitId = unit?.id ?? "";
  for (const id of [PERSON_A, PERSON_B]) {
    await database.query(
      `insert into persons (id, lineage_role, gender) values ('${id}', 'lineage', 'male')`,
    );
  }
});

afterAll(async () => {
  await database?.stop();
});

describe("organization seed", () => {
  it("creates the organization, three board levels and the Central Board", async () => {
    const types = await database.query<{ key: string }>(
      `select key from org_unit_types order by level_order`,
    );
    expect(types.map((type) => type.key)).toEqual([
      "central_board",
      "regional_board",
      "gaau_committee",
    ]);
    expect(unitId).not.toBe("");
  });
});

describe("organization constraints", () => {
  it("refuses overlapping terms of one board", async () => {
    await database.query(
      `insert into terms (id, org_unit_id, starts_on, ends_on) values (gen_random_uuid(), '${unitId}', '2020-01-01', '2024-01-01')`,
    );
    await expect(
      database.query(
        `insert into terms (id, org_unit_id, starts_on) values (gen_random_uuid(), '${unitId}', '2023-06-01')`,
      ),
    ).rejects.toThrow(/terms_no_overlap/);
    await database.query(
      `insert into terms (id, org_unit_id, starts_on) values (gen_random_uuid(), '${unitId}', '2024-01-01')`,
    );
  });

  it("allows one chairperson at a time, any number of members", async () => {
    const chair = await position("chairperson", 1);
    await appoint(PERSON_A, chair, "2020-01-01", "2024-01-01");
    await expect(appoint(PERSON_B, chair, "2023-01-01", null)).rejects.toThrow(
      /appointments_exclusive_one_holder/,
    );
    await appoint(PERSON_B, chair, "2024-01-01", null);

    const member = await position("member", null);
    await appoint(PERSON_A, member, "2024-01-01", null);
    await appoint(PERSON_B, member, "2024-01-01", null);
  });

  it("refuses the same person twice in the same seat", async () => {
    const advisor = await position("advisor", null);
    await appoint(PERSON_A, advisor, "2020-01-01", null);
    await expect(appoint(PERSON_A, advisor, "2021-01-01", null)).rejects.toThrow(
      /appointments_no_double_seat/,
    );
  });

  it("re-checks existing holders when a position becomes one-holder", async () => {
    const treasurer = await position("treasurer", null);
    await appoint(PERSON_A, treasurer, "2020-01-01", null);
    await appoint(PERSON_B, treasurer, "2020-06-01", null);
    await expect(
      database.query(`update position_definitions set max_holders = 1 where id = '${treasurer}'`),
    ).rejects.toThrow(/appointments_exclusive_one_holder/);
  });

  it("ignores retracted appointments in the one-holder rule", async () => {
    const secretary = await position("secretary", 1);
    await database.query(
      `insert into appointments (id, person_id, org_unit_id, position_id, starts_on, record_status)
       values (gen_random_uuid(), '${PERSON_A}', '${unitId}', '${secretary}', '2020-01-01', 'retracted')`,
    );
    await appoint(PERSON_B, secretary, "2020-01-01", null);
  });
});
