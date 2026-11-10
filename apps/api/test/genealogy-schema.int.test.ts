import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { TestDatabase } from "./support/test-database.js";

let database: TestDatabase;

const LIVING_CASES = [
  { living: "living", death: null, birthTo: null, expected: true },
  { living: "deceased", death: null, birthTo: null, expected: false },
  { living: "unknown", death: null, birthTo: null, expected: true },
  { living: "unknown", death: null, birthTo: "1990-12-31", expected: true },
  { living: "unknown", death: null, birthTo: "1890-12-31", expected: false },
  {
    living: "unknown",
    death: '{"calendar":"AD","qualifier":"exact","year":1980}',
    birthTo: null,
    expected: false,
  },
] as const;

function insertPerson(id: string): Promise<unknown> {
  return database.query(
    `insert into persons (id, lineage_role, gender) values ('${id}', 'lineage', 'male')`,
  );
}

beforeAll(async () => {
  database = await TestDatabase.start();
});

afterAll(async () => {
  await database?.stop();
});

describe("person_presumed_living", () => {
  it.each(LIVING_CASES)(
    "$living, death $death, born by $birthTo → $expected",
    async ({ living, death, birthTo, expected }) => {
      const [row] = await database.query<{ presumed: boolean }>(
        `with inserted as (
           insert into persons (id, lineage_role, gender, living_status, birth_sort_from, birth_sort_to, death_date)
           values (gen_random_uuid(), 'lineage', 'male', '${living}',
                   ${birthTo ? `'${birthTo}'` : "null"}, ${birthTo ? `'${birthTo}'` : "null"},
                   ${death ? `'${death}'` : "null"})
           returning *
         )
         select person_presumed_living(inserted) as presumed from inserted`,
      );
      expect(row?.presumed).toBe(expected);
    },
  );
});

describe("genealogy integrity in the database", () => {
  it("refuses to delete or truncate persons", async () => {
    const id = "01900000-0000-7000-8000-000000000001";
    await insertPerson(id);
    await expect(database.query(`delete from persons where id = '${id}'`)).rejects.toThrow(
      /status-managed/,
    );
    await expect(database.query("truncate persons cascade")).rejects.toThrow(/status-managed/);
  });

  it("keeps revisions append-only", async () => {
    await database.query(
      `insert into entity_revisions (id, entity_type, entity_id, version, snapshot)
       values ('01900000-0000-7000-8000-0000000000a1', 'person', gen_random_uuid(), 1, '{}')`,
    );
    await expect(database.query("update entity_revisions set reason = 'x'")).rejects.toThrow(
      /append-only/,
    );
    await expect(database.query("delete from entity_revisions")).rejects.toThrow(/append-only/);
  });

  it("requires a male or female gender for lineage members and a male founder", async () => {
    await expect(
      database.query(
        `insert into persons (id, lineage_role, gender) values (gen_random_uuid(), 'lineage', 'unknown')`,
      ),
    ).rejects.toThrow(/persons_lineage_gender/);
    await expect(
      database.query(
        `insert into persons (id, lineage_role, gender, is_founding_ancestor)
         values (gen_random_uuid(), 'lineage', 'female', true)`,
      ),
    ).rejects.toThrow(/persons_founder_is_lineage_male/);
  });

  it("allows at most one primary name per person", async () => {
    const id = "01900000-0000-7000-8000-000000000002";
    await insertPerson(id);
    const name = (n: string) =>
      `insert into person_names (id, person_id, name_type, full_name, romanized, is_primary)
       values (gen_random_uuid(), '${id}', 'birth', '${n}', '${n}', true)`;
    await database.query(name("a"));
    await expect(database.query(name("b"))).rejects.toThrow(/person_names_one_primary/);
  });
});
