import type { TDbExecutor } from "../../../core/database/database.types.js";

import { Injectable } from "@nestjs/common";
import { and, asc, desc, eq, ne, sql } from "drizzle-orm";

import { DatabaseService } from "../../../core/database/database.service.js";
import { appointments, positionDefinitions } from "../../../core/database/schema/index.js";

export type TAppointmentRow = typeof appointments.$inferSelect;
export type TNewAppointmentRow = typeof appointments.$inferInsert;

@Injectable()
export class AppointmentsRepository {
  constructor(private readonly database: DatabaseService) {}

  async forUnit(orgUnitId: string): Promise<TAppointmentRow[]> {
    return this.database.db
      .select()
      .from(appointments)
      .where(eq(appointments.orgUnitId, orgUnitId))
      .orderBy(desc(appointments.startsOn));
  }

  async findInUnit(
    orgUnitId: string,
    id: string,
    executor: TDbExecutor = this.database.db,
  ): Promise<TAppointmentRow | null> {
    const [row] = await executor
      .select()
      .from(appointments)
      .where(and(eq(appointments.id, id), eq(appointments.orgUnitId, orgUnitId)))
      .limit(1);
    return row ?? null;
  }

  // Accepted holders of one seat whose period overlaps [startsOn, endsOn).
  async countOverlapping(
    input: {
      orgUnitId: string;
      positionId: string;
      startsOn: string;
      endsOn: string | null;
      excludeId?: string;
    },
    executor: TDbExecutor,
  ): Promise<number> {
    const [row] = await executor
      .select({ total: sql<number>`count(*)::int` })
      .from(appointments)
      .where(
        and(
          eq(appointments.orgUnitId, input.orgUnitId),
          eq(appointments.positionId, input.positionId),
          eq(appointments.recordStatus, "accepted"),
          sql`${appointments.period} && daterange(${input.startsOn}::date, ${input.endsOn}::date, '[)')`,
          input.excludeId ? ne(appointments.id, input.excludeId) : undefined,
        ),
      );
    return row?.total ?? 0;
  }

  // Accepted appointments that overlap a period, ordered as a board page lists them.
  async board(orgUnitId: string, range: { from: string; to: string | null }) {
    return this.database.db
      .select({ appointment: appointments, position: positionDefinitions })
      .from(appointments)
      .innerJoin(positionDefinitions, eq(positionDefinitions.id, appointments.positionId))
      .where(
        and(
          eq(appointments.orgUnitId, orgUnitId),
          eq(appointments.recordStatus, "accepted"),
          sql`${appointments.period} && daterange(${range.from}::date, ${range.to}::date, '[)')`,
        ),
      )
      .orderBy(asc(positionDefinitions.rank), asc(appointments.startsOn));
  }

  async insert(values: TNewAppointmentRow, executor: TDbExecutor): Promise<TAppointmentRow> {
    const [row] = await executor.insert(appointments).values(values).returning();
    if (!row) {
      throw new Error("Insert into appointments returned no row");
    }
    return row;
  }

  async updateIfVersion(
    id: string,
    version: number,
    values: Partial<TNewAppointmentRow>,
    executor: TDbExecutor,
  ): Promise<TAppointmentRow | null> {
    const [row] = await executor
      .update(appointments)
      .set({ ...values, version: sql`${appointments.version} + 1` })
      .where(and(eq(appointments.id, id), eq(appointments.version, version)))
      .returning();
    return row ?? null;
  }
}
