import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  date,
  foreignKey,
  index,
  pgEnum,
  pgTable,
  text,
  uuid,
} from "drizzle-orm/pg-core";

import { APPOINTMENT_END_REASONS, APPOINTMENT_TYPES, ASSERTION_STATUSES } from "@repo/contracts";

import { ColumnHelper } from "./column.helper.js";
import { daterange } from "./daterange.type.js";
import { orgUnits } from "./org-units.schema.js";
import { persons } from "./persons.schema.js";
import { positionDefinitions } from "./position-definitions.schema.js";
import { datePrecision, terms } from "./terms.schema.js";
import { users } from "./users.schema.js";

export const appointmentType = pgEnum("appointment_type", APPOINTMENT_TYPES);
export const appointmentEndReason = pgEnum("appointment_end_reason", APPOINTMENT_END_REASONS);
export const assertionStatus = pgEnum("assertion_status", ASSERTION_STATUSES);

// Person × unit × position over time. Mistakes are retracted, never deleted.
// One holder at a time for exclusive positions, and no double appointment to
// the same seat: exclusion constraints in migration 0008; is_exclusive is
// copied from the position there by trigger.
export const appointments = pgTable(
  "appointments",
  {
    id: ColumnHelper.primaryId(),
    personId: uuid("person_id")
      .notNull()
      .references(() => persons.id),
    orgUnitId: uuid("org_unit_id")
      .notNull()
      .references(() => orgUnits.id),
    positionId: uuid("position_id")
      .notNull()
      .references(() => positionDefinitions.id),
    termId: uuid("term_id"),
    appointmentType: appointmentType("appointment_type").notNull().default("elected"),
    startsOn: date("starts_on").notNull(),
    endsOn: date("ends_on"),
    datePrecision: datePrecision("date_precision").notNull().default("day"),
    endReason: appointmentEndReason("end_reason"),
    isExclusive: boolean("is_exclusive").notNull().default(false),
    recordStatus: assertionStatus("record_status").notNull().default("accepted"),
    notes: text("notes"),
    period: daterange("period").generatedAlwaysAs(sql`daterange(starts_on, ends_on, '[)')`),
    version: ColumnHelper.version(),
    createdAt: ColumnHelper.createdAt(),
    updatedAt: ColumnHelper.updatedAt(),
    createdBy: uuid("created_by").references(() => users.id),
    updatedBy: uuid("updated_by").references(() => users.id),
  },
  (table) => [
    foreignKey({
      name: "appointments_term_same_unit_fk",
      columns: [table.termId, table.orgUnitId],
      foreignColumns: [terms.id, terms.orgUnitId],
    }),
    check(
      "appointments_end_after_start",
      sql`${table.endsOn} is null or ${table.endsOn} > ${table.startsOn}`,
    ),
    check(
      "appointments_end_reason_needs_end",
      sql`${table.endReason} is null or ${table.endsOn} is not null`,
    ),
    index("appointments_unit_starts_idx").on(table.orgUnitId, table.startsOn.desc()),
    index("appointments_person_idx").on(table.personId),
  ],
);
