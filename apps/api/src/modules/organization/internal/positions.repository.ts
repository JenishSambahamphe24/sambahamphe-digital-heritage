import type { TDbExecutor } from "../../../core/database/database.types.js";

import { Injectable } from "@nestjs/common";
import { and, asc, eq, sql } from "drizzle-orm";

import { DatabaseService } from "../../../core/database/database.service.js";
import { positionDefinitions } from "../../../core/database/schema/index.js";

export type TPositionRow = typeof positionDefinitions.$inferSelect;
export type TNewPositionRow = typeof positionDefinitions.$inferInsert;

@Injectable()
export class PositionsRepository {
  constructor(private readonly database: DatabaseService) {}

  async all(): Promise<TPositionRow[]> {
    return this.database.db
      .select()
      .from(positionDefinitions)
      .orderBy(asc(positionDefinitions.rank));
  }

  async findById(
    id: string,
    executor: TDbExecutor = this.database.db,
  ): Promise<TPositionRow | null> {
    const [row] = await executor
      .select()
      .from(positionDefinitions)
      .where(eq(positionDefinitions.id, id))
      .limit(1);
    return row ?? null;
  }

  async insert(values: TNewPositionRow, executor: TDbExecutor): Promise<TPositionRow> {
    const [row] = await executor.insert(positionDefinitions).values(values).returning();
    if (!row) {
      throw new Error("Insert into position_definitions returned no row");
    }
    return row;
  }

  async updateIfVersion(
    id: string,
    version: number,
    values: Partial<TNewPositionRow>,
    executor: TDbExecutor,
  ): Promise<TPositionRow | null> {
    const [row] = await executor
      .update(positionDefinitions)
      .set({ ...values, version: sql`${positionDefinitions.version} + 1` })
      .where(and(eq(positionDefinitions.id, id), eq(positionDefinitions.version, version)))
      .returning();
    return row ?? null;
  }
}
