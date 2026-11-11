import type { TDbExecutor } from "../../../core/database/database.types.js";

import { Injectable } from "@nestjs/common";
import { and, asc, eq, sql } from "drizzle-orm";

import { DatabaseService } from "../../../core/database/database.service.js";
import {
  organizations,
  orgUnits,
  orgUnitTypeParents,
  orgUnitTypes,
} from "../../../core/database/schema/index.js";
import { ORG_UNIT_MAX_DEPTH } from "../organization.constants.js";

export type TOrgUnitRow = typeof orgUnits.$inferSelect;
export type TNewOrgUnitRow = typeof orgUnits.$inferInsert;
export type TOrgUnitTypeRow = typeof orgUnitTypes.$inferSelect;

@Injectable()
export class OrgUnitsRepository {
  constructor(private readonly database: DatabaseService) {}

  // There is one organization; every unit, type and position belongs to it.
  async organizationId(executor: TDbExecutor = this.database.db): Promise<string> {
    const [row] = await executor.select({ id: organizations.id }).from(organizations).limit(1);
    if (!row) {
      throw new Error("The organization row is missing (migration 0008 seeds it)");
    }
    return row.id;
  }

  async types(): Promise<Array<TOrgUnitTypeRow & { allowedParentTypeIds: string[] }>> {
    const [types, parents] = await Promise.all([
      this.database.db.select().from(orgUnitTypes).orderBy(asc(orgUnitTypes.levelOrder)),
      this.database.db.select().from(orgUnitTypeParents),
    ]);
    return types.map((type) => ({
      ...type,
      allowedParentTypeIds: parents
        .filter((row) => row.typeId === type.id)
        .map((row) => row.parentTypeId),
    }));
  }

  async findType(
    id: string,
    executor: TDbExecutor = this.database.db,
  ): Promise<TOrgUnitTypeRow | null> {
    const [row] = await executor
      .select()
      .from(orgUnitTypes)
      .where(eq(orgUnitTypes.id, id))
      .limit(1);
    return row ?? null;
  }

  async allowedParentTypeIds(typeId: string, executor: TDbExecutor): Promise<string[]> {
    const rows = await executor
      .select()
      .from(orgUnitTypeParents)
      .where(eq(orgUnitTypeParents.typeId, typeId));
    return rows.map((row) => row.parentTypeId);
  }

  async all(): Promise<Array<TOrgUnitRow & { typeKey: string }>> {
    const rows = await this.database.db
      .select({ unit: orgUnits, typeKey: orgUnitTypes.key })
      .from(orgUnits)
      .innerJoin(orgUnitTypes, eq(orgUnitTypes.id, orgUnits.typeId))
      .orderBy(
        asc(orgUnits.sortOrder),
        asc(sql`coalesce(${orgUnits.nameI18n}->>'en', ${orgUnits.nameI18n}->>'ne')`),
      );
    return rows.map((row) => ({ ...row.unit, typeKey: row.typeKey }));
  }

  async findById(
    id: string,
    executor: TDbExecutor = this.database.db,
  ): Promise<(TOrgUnitRow & { typeKey: string }) | null> {
    const [row] = await executor
      .select({ unit: orgUnits, typeKey: orgUnitTypes.key })
      .from(orgUnits)
      .innerJoin(orgUnitTypes, eq(orgUnitTypes.id, orgUnits.typeId))
      .where(eq(orgUnits.id, id))
      .limit(1);
    return row ? { ...row.unit, typeKey: row.typeKey } : null;
  }

  // Locks the unit row so appointment counts for it can't race (max_holders > 1).
  async lock(id: string, executor: TDbExecutor): Promise<void> {
    await executor
      .select({ id: orgUnits.id })
      .from(orgUnits)
      .where(eq(orgUnits.id, id))
      .for("update");
  }

  // Root first, the unit itself last: the scope path for access checks.
  async pathOf(id: string, executor: TDbExecutor = this.database.db): Promise<string[]> {
    const { rows } = await executor.execute<{ id: string; depth: number }>(sql`
      with recursive up as (
        select id, parent_id, 1 as depth from org_units where id = ${id}
        union all
        select u.id, u.parent_id, up.depth + 1
        from up join org_units u on u.id = up.parent_id
        where up.depth < ${ORG_UNIT_MAX_DEPTH}
      )
      select id, depth from up order by depth desc
    `);
    return rows.map((row) => row.id);
  }

  async insert(values: TNewOrgUnitRow, executor: TDbExecutor): Promise<TOrgUnitRow> {
    const [row] = await executor.insert(orgUnits).values(values).returning();
    if (!row) {
      throw new Error("Insert into org_units returned no row");
    }
    return row;
  }

  async updateIfVersion(
    id: string,
    version: number,
    values: Partial<TNewOrgUnitRow>,
    executor: TDbExecutor,
  ): Promise<TOrgUnitRow | null> {
    const [row] = await executor
      .update(orgUnits)
      .set({ ...values, version: sql`${orgUnits.version} + 1` })
      .where(and(eq(orgUnits.id, id), eq(orgUnits.version, version)))
      .returning();
    return row ?? null;
  }
}
