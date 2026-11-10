import type { TDbExecutor } from "../../../core/database/database.types.js";
import type { TI18nText, TPlaceKind } from "@repo/contracts";

import { Injectable } from "@nestjs/common";
import { and, eq, sql } from "drizzle-orm";

import { DatabaseService } from "../../../core/database/database.service.js";
import { placeAltNames, places } from "../../../core/database/schema/index.js";
import { PLACE_MAX_DEPTH, PLACE_SEARCH_MIN_SIMILARITY } from "../places.constants.js";

export type TPlaceRow = typeof places.$inferSelect;
export type TNewPlaceRow = typeof places.$inferInsert;
export type TPlaceAltNameRow = typeof placeAltNames.$inferSelect;
export type TNewPlaceAltNameRow = Omit<typeof placeAltNames.$inferInsert, "placeId">;

export interface IPlaceSummaryRow {
  id: string;
  kind: TPlaceKind;
  nameI18n: TI18nText;
}

export interface IPlaceListRow extends IPlaceSummaryRow {
  parentId: string | null;
  childCount: number;
  matchedAltName: string | null;
}

@Injectable()
export class PlacesRepository {
  constructor(private readonly database: DatabaseService) {}

  async findById(id: string, executor: TDbExecutor = this.database.db): Promise<TPlaceRow | null> {
    const [row] = await executor.select().from(places).where(eq(places.id, id)).limit(1);
    return row ?? null;
  }

  async findSummaries(ids: string[]): Promise<Map<string, IPlaceSummaryRow>> {
    if (ids.length === 0) {
      return new Map();
    }
    const rows = await this.database.db
      .select({ id: places.id, kind: places.kind, nameI18n: places.nameI18n })
      .from(places)
      .where(sql`${places.id} in ${ids}`);
    return new Map(rows.map((row) => [row.id, row]));
  }

  async altNames(placeId: string, executor: TDbExecutor = this.database.db) {
    return executor.select().from(placeAltNames).where(eq(placeAltNames.placeId, placeId));
  }

  // Root first, ending with the parent, for every requested place at once.
  async ancestorsOf(ids: string[]): Promise<Map<string, IPlaceSummaryRow[]>> {
    const result = new Map<string, IPlaceSummaryRow[]>(ids.map((id) => [id, []]));
    if (ids.length === 0) {
      return result;
    }
    const { rows } = await this.database.db.execute<{
      start_id: string;
      depth: number;
      id: string;
      kind: TPlaceKind;
      name_i18n: TI18nText;
    }>(sql`
      with recursive chain as (
        select p.id as start_id, p.parent_id as id, 1 as depth
        from places p where p.id in ${ids} and p.parent_id is not null
        union all
        select c.start_id, p.parent_id, c.depth + 1
        from chain c join places p on p.id = c.id
        where p.parent_id is not null and c.depth < ${PLACE_MAX_DEPTH}
      )
      select c.start_id, c.depth, p.id, p.kind, p.name_i18n
      from chain c join places p on p.id = c.id
      order by c.start_id, c.depth desc
    `);
    for (const row of rows) {
      result.get(row.start_id)?.push({ id: row.id, kind: row.kind, nameI18n: row.name_i18n });
    }
    return result;
  }

  async isSelfOrDescendant(
    candidateId: string,
    placeId: string,
    executor: TDbExecutor,
  ): Promise<boolean> {
    const { rows } = await executor.execute<{ found: boolean }>(sql`
      with recursive up as (
        select id, parent_id, 1 as depth from places where id = ${candidateId}
        union all
        select p.id, p.parent_id, up.depth + 1
        from up join places p on p.id = up.parent_id
        where up.depth < ${PLACE_MAX_DEPTH}
      )
      select exists (select 1 from up where id = ${placeId}) as found
    `);
    return rows[0]?.found ?? false;
  }

  async list(query: {
    q?: string;
    parentId?: string;
    offset: number;
    limit: number;
  }): Promise<{ rows: IPlaceListRow[]; total: number }> {
    const childCount = sql<number>`(select count(*)::int from places c where c.parent_id = p.id)`;
    if (!query.q) {
      const parent = query.parentId
        ? sql`p.parent_id = ${query.parentId}`
        : sql`p.parent_id is null`;
      const [{ rows }, { rows: totals }] = await Promise.all([
        this.database.db.execute<IListSqlRow>(sql`
          select p.id, p.kind, p.name_i18n, p.parent_id, ${childCount} as child_count, null as matched_alt_name
          from places p where ${parent}
          order by coalesce(p.name_i18n->>'en', p.name_i18n->>'ne')
          offset ${query.offset} limit ${query.limit}
        `),
        this.database.db.execute<{ total: number }>(
          sql`select count(*)::int as total from places p where ${parent}`,
        ),
      ]);
      return {
        rows: rows.map((row) => PlacesRepository.toListRow(row)),
        total: totals[0]?.total ?? 0,
      };
    }

    // Current names (either language) and alternative names, best match first.
    const matches = sql`
      select p.id, greatest(
        similarity(coalesce(p.name_i18n->>'en', ''), ${query.q}),
        similarity(coalesce(p.name_i18n->>'ne', ''), ${query.q})
      ) as score, null::text as alt
      from places p
      where similarity(coalesce(p.name_i18n->>'en', ''), ${query.q}) >= ${PLACE_SEARCH_MIN_SIMILARITY}
         or similarity(coalesce(p.name_i18n->>'ne', ''), ${query.q}) >= ${PLACE_SEARCH_MIN_SIMILARITY}
         or p.name_i18n->>'en' ilike ${PlacesRepository.contains(query.q)}
         or p.name_i18n->>'ne' ilike ${PlacesRepository.contains(query.q)}
      union all
      select a.place_id, similarity(a.name, ${query.q}), a.name
      from place_alt_names a
      where similarity(a.name, ${query.q}) >= ${PLACE_SEARCH_MIN_SIMILARITY} or a.name ilike ${PlacesRepository.contains(query.q)}
    `;
    const best = sql`
      select distinct on (id) id, score, alt from (${matches}) m order by id, score desc
    `;
    const [{ rows }, { rows: totals }] = await Promise.all([
      this.database.db.execute<IListSqlRow>(sql`
        select p.id, p.kind, p.name_i18n, p.parent_id, ${childCount} as child_count, b.alt as matched_alt_name
        from (${best}) b join places p on p.id = b.id
        order by b.score desc, coalesce(p.name_i18n->>'en', p.name_i18n->>'ne')
        offset ${query.offset} limit ${query.limit}
      `),
      this.database.db.execute<{ total: number }>(
        sql`select count(*)::int as total from (${best}) b`,
      ),
    ]);
    return {
      rows: rows.map((row) => PlacesRepository.toListRow(row)),
      total: totals[0]?.total ?? 0,
    };
  }

  async insert(values: TNewPlaceRow, executor: TDbExecutor): Promise<TPlaceRow> {
    const [row] = await executor.insert(places).values(values).returning();
    if (!row) {
      throw new Error("Insert into places returned no row");
    }
    return row;
  }

  // Null when the version no longer matches (someone saved first).
  async updateIfVersion(
    id: string,
    version: number,
    values: Partial<TNewPlaceRow>,
    executor: TDbExecutor,
  ): Promise<TPlaceRow | null> {
    const [row] = await executor
      .update(places)
      .set({ ...values, version: sql`${places.version} + 1` })
      .where(and(eq(places.id, id), eq(places.version, version)))
      .returning();
    return row ?? null;
  }

  async replaceAltNames(
    placeId: string,
    altNames: TNewPlaceAltNameRow[],
    executor: TDbExecutor,
  ): Promise<void> {
    await executor.delete(placeAltNames).where(eq(placeAltNames.placeId, placeId));
    if (altNames.length > 0) {
      await executor.insert(placeAltNames).values(altNames.map((alt) => ({ ...alt, placeId })));
    }
  }

  private static contains(q: string): string {
    return `%${q.replace(/[\\%_]/g, (match) => `\\${match}`)}%`;
  }

  private static toListRow(row: IListSqlRow): IPlaceListRow {
    return {
      id: row.id,
      kind: row.kind,
      nameI18n: row.name_i18n,
      parentId: row.parent_id,
      childCount: row.child_count,
      matchedAltName: row.matched_alt_name,
    };
  }
}

interface IListSqlRow extends Record<string, unknown> {
  id: string;
  kind: TPlaceKind;
  name_i18n: TI18nText;
  parent_id: string | null;
  child_count: number;
  matched_alt_name: string | null;
}
