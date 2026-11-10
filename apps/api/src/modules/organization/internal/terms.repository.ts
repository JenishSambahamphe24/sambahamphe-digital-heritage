import type { TDbExecutor } from "../../../core/database/database.types.js";

import { Injectable } from "@nestjs/common";
import { and, desc, eq, sql } from "drizzle-orm";

import { DatabaseService } from "../../../core/database/database.service.js";
import { terms } from "../../../core/database/schema/index.js";

export type TTermRow = typeof terms.$inferSelect;
export type TNewTermRow = typeof terms.$inferInsert;

@Injectable()
export class TermsRepository {
  constructor(private readonly database: DatabaseService) {}

  async forUnit(orgUnitId: string): Promise<TTermRow[]> {
    return this.database.db
      .select()
      .from(terms)
      .where(eq(terms.orgUnitId, orgUnitId))
      .orderBy(desc(terms.startsOn));
  }

  async findInUnit(
    orgUnitId: string,
    id: string,
    executor: TDbExecutor = this.database.db,
  ): Promise<TTermRow | null> {
    const [row] = await executor
      .select()
      .from(terms)
      .where(and(eq(terms.id, id), eq(terms.orgUnitId, orgUnitId)))
      .limit(1);
    return row ?? null;
  }

  async coveringDay(orgUnitId: string, day: string): Promise<TTermRow | null> {
    const [row] = await this.database.db
      .select()
      .from(terms)
      .where(and(eq(terms.orgUnitId, orgUnitId), sql`${terms.period} @> ${day}::date`))
      .limit(1);
    return row ?? null;
  }

  async insert(values: TNewTermRow, executor: TDbExecutor): Promise<TTermRow> {
    const [row] = await executor.insert(terms).values(values).returning();
    if (!row) {
      throw new Error("Insert into terms returned no row");
    }
    return row;
  }

  async updateIfVersion(
    id: string,
    version: number,
    values: Partial<TNewTermRow>,
    executor: TDbExecutor,
  ): Promise<TTermRow | null> {
    const [row] = await executor
      .update(terms)
      .set({ ...values, version: sql`${terms.version} + 1` })
      .where(and(eq(terms.id, id), eq(terms.version, version)))
      .returning();
    return row ?? null;
  }
}
