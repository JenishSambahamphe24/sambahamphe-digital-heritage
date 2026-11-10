import type { TDbExecutor } from "../../../core/database/database.types.js";
import type { TVisibilityLevel } from "@repo/contracts";

import { Injectable } from "@nestjs/common";
import { and, asc, eq, gt, inArray, isNull, or, sql } from "drizzle-orm";

import { DatabaseService } from "../../../core/database/database.service.js";
import {
  personAccessGrants,
  personConsents,
  personNames,
  persons,
} from "../../../core/database/schema/index.js";
import { ADULT_AGE_YEARS } from "../domain/privacy.constants.js";
import { PERSON_SEARCH_MIN_SIMILARITY } from "../people.constants.js";

export type TPersonRow = typeof persons.$inferSelect;
export type TNewPersonRow = typeof persons.$inferInsert;
export type TPersonNameRow = typeof personNames.$inferSelect;
export type TNewPersonNameRow = Omit<typeof personNames.$inferInsert, "personId">;
export type TConsentRow = typeof personConsents.$inferSelect;
export type TNewConsentRow = typeof personConsents.$inferInsert;

export interface IPersonSearchRow {
  id: string;
  matchedName: string | null;
}

@Injectable()
export class PersonsRepository {
  constructor(private readonly database: DatabaseService) {}

  async findById(id: string, executor: TDbExecutor = this.database.db): Promise<TPersonRow | null> {
    const [row] = await executor.select().from(persons).where(eq(persons.id, id)).limit(1);
    return row ?? null;
  }

  async lockById(id: string, executor: TDbExecutor): Promise<TPersonRow | null> {
    const [row] = await executor
      .select()
      .from(persons)
      .where(eq(persons.id, id))
      .for("update")
      .limit(1);
    return row ?? null;
  }

  async findManyById(ids: string[]): Promise<TPersonRow[]> {
    return ids.length === 0
      ? []
      : this.database.db.select().from(persons).where(inArray(persons.id, ids));
  }

  async namesOf(
    personIds: string[],
    executor: TDbExecutor = this.database.db,
  ): Promise<Map<string, TPersonNameRow[]>> {
    const result = new Map<string, TPersonNameRow[]>(personIds.map((id) => [id, []]));
    if (personIds.length === 0) {
      return result;
    }
    const rows = await executor
      .select()
      .from(personNames)
      .where(inArray(personNames.personId, personIds))
      .orderBy(asc(personNames.sortOrder));
    for (const row of rows) {
      result.get(row.personId)?.push(row);
    }
    return result;
  }

  async consentsOf(
    personId: string,
    executor: TDbExecutor = this.database.db,
  ): Promise<TConsentRow[]> {
    return executor
      .select()
      .from(personConsents)
      .where(eq(personConsents.personId, personId))
      .orderBy(asc(personConsents.grantedAt));
  }

  async activeConsentsOf(
    personId: string,
    executor: TDbExecutor = this.database.db,
  ): Promise<TConsentRow[]> {
    return executor
      .select()
      .from(personConsents)
      .where(and(eq(personConsents.personId, personId), isNull(personConsents.revokedAt)));
  }

  async grantedGroups(personId: string, userId: string, now: Date): Promise<string[]> {
    const rows = await this.database.db
      .select({ fieldGroups: personAccessGrants.fieldGroups })
      .from(personAccessGrants)
      .where(
        and(
          eq(personAccessGrants.personId, personId),
          eq(personAccessGrants.userId, userId),
          isNull(personAccessGrants.revokedAt),
          or(isNull(personAccessGrants.expiresAt), gt(personAccessGrants.expiresAt, now)),
        ),
      );
    return rows.flatMap((row) => row.fieldGroups);
  }

  async insert(values: TNewPersonRow, executor: TDbExecutor): Promise<TPersonRow> {
    const [row] = await executor.insert(persons).values(values).returning();
    if (!row) {
      throw new Error("Insert into persons returned no row");
    }
    return row;
  }

  // Null when the version no longer matches (someone saved first).
  async updateIfVersion(
    id: string,
    version: number,
    values: Partial<TNewPersonRow>,
    executor: TDbExecutor,
  ): Promise<TPersonRow | null> {
    const [row] = await executor
      .update(persons)
      .set({ ...values, version: sql`${persons.version} + 1` })
      .where(and(eq(persons.id, id), eq(persons.version, version)))
      .returning();
    return row ?? null;
  }

  async replaceNames(
    personId: string,
    names: TNewPersonNameRow[],
    executor: TDbExecutor,
  ): Promise<TPersonNameRow[]> {
    await executor.delete(personNames).where(eq(personNames.personId, personId));
    return executor
      .insert(personNames)
      .values(names.map((name) => ({ ...name, personId })))
      .returning();
  }

  async insertConsent(values: TNewConsentRow, executor: TDbExecutor): Promise<TConsentRow> {
    const [row] = await executor.insert(personConsents).values(values).returning();
    if (!row) {
      throw new Error("Insert into person_consents returned no row");
    }
    return row;
  }

  async revokeConsent(
    personId: string,
    consentId: string,
    executor: TDbExecutor,
  ): Promise<TConsentRow | null> {
    const [row] = await executor
      .update(personConsents)
      .set({ revokedAt: new Date() })
      .where(
        and(
          eq(personConsents.id, consentId),
          eq(personConsents.personId, personId),
          isNull(personConsents.revokedAt),
        ),
      )
      .returning();
    return row ?? null;
  }

  // Editors see every record; results ordered by best name match.
  async searchAll(query: { romanized?: string; raw?: string; offset: number; limit: number }) {
    return this.search({ ...query, where: sql`true` });
  }

  // The SQL mirror of the privacy policy's record visibility, so paging totals
  // never count hidden people. The policy still runs on every returned row.
  async searchVisible(query: {
    romanized?: string;
    raw?: string;
    level: TVisibilityLevel;
    offset: number;
    limit: number;
  }) {
    const level = sql`${query.level}::visibility_level`;
    const where = sql`
      p.record_status = 'active'
      and p.visibility <= ${level}
      and coalesce((p.field_visibility->>'names')::visibility_level, p.visibility) <= ${level}
      and (
        not person_presumed_living(p)
        or (
          not (p.birth_sort_to is not null and p.birth_sort_to > current_date - make_interval(years => ${ADULT_AGE_YEARS}))
          and exists (
            select 1 from person_consents c
            where c.person_id = p.id and c.revoked_at is null
              and c.scope->'fieldGroups' ? 'names'
              and (c.scope->>'visibility')::visibility_level <= ${level}
          )
        )
      )`;
    return this.search({ ...query, where });
  }

  private async search(query: {
    romanized?: string;
    raw?: string;
    where: ReturnType<typeof sql>;
    offset: number;
    limit: number;
  }): Promise<{ rows: IPersonSearchRow[]; total: number }> {
    if (!query.romanized || !query.raw) {
      const [{ rows }, { rows: totals }] = await Promise.all([
        this.database.db.execute<{ id: string }>(sql`
          select p.id from persons p where ${query.where}
          order by p.updated_at desc offset ${query.offset} limit ${query.limit}
        `),
        this.database.db.execute<{ total: number }>(
          sql`select count(*)::int as total from persons p where ${query.where}`,
        ),
      ]);
      return {
        rows: rows.map((row) => ({ id: row.id, matchedName: null })),
        total: totals[0]?.total ?? 0,
      };
    }
    const contains = `%${query.raw.replace(/[\\%_]/g, (match) => `\\${match}`)}%`;
    const best = sql`
      select distinct on (n.person_id) n.person_id as id, n.full_name, n.is_primary,
        greatest(similarity(n.romanized, ${query.romanized}), similarity(n.full_name, ${query.raw})) as score
      from person_names n
      where similarity(n.romanized, ${query.romanized}) >= ${PERSON_SEARCH_MIN_SIMILARITY}
         or similarity(n.full_name, ${query.raw}) >= ${PERSON_SEARCH_MIN_SIMILARITY}
         or n.full_name ilike ${contains}
         or n.romanized ilike ${`%${query.romanized}%`}
      order by n.person_id, score desc
    `;
    const matched = sql`select b.* from (${best}) b join persons p on p.id = b.id where ${query.where}`;
    const [{ rows }, { rows: totals }] = await Promise.all([
      this.database.db.execute<{ id: string; full_name: string; is_primary: boolean }>(sql`
        select * from (${matched}) m order by m.score desc offset ${query.offset} limit ${query.limit}
      `),
      this.database.db.execute<{ total: number }>(
        sql`select count(*)::int as total from (${matched}) m`,
      ),
    ]);
    return {
      rows: rows.map((row) => ({ id: row.id, matchedName: row.is_primary ? null : row.full_name })),
      total: totals[0]?.total ?? 0,
    };
  }
}
