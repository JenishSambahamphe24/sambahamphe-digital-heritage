import type { TFuzzyDate } from "@repo/dates";
import type { AnyPgColumn } from "drizzle-orm/pg-core";

import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  date,
  index,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { clans } from "./clans.schema.js";
import { ColumnHelper } from "./column.helper.js";
import { places } from "./places.schema.js";
import { users } from "./users.schema.js";

export const personRecordStatus = pgEnum("person_record_status", ["active", "merged", "retracted"]);
export const lineageRole = pgEnum("lineage_role", ["lineage", "spouse"]);
export const gender = pgEnum("gender", ["female", "male", "other", "unknown"]);
export const livingStatus = pgEnum("living_status", ["living", "deceased", "unknown"]);
export const visibilityLevel = pgEnum("visibility_level", [
  "public",
  "members",
  "branch",
  "restricted",
  "private",
]);
export const verificationStatus = pgEnum("verification_status", [
  "unverified",
  "verified",
  "disputed",
]);

export type TFieldVisibility = Partial<
  Record<
    "names" | "vital_dates" | "places" | "biography" | "photos" | "contact" | "relationships",
    (typeof visibilityLevel.enumValues)[number]
  >
>;

// Profile photo, biography translations and residences arrive with media
// (M2.3) and content (M2.4); relationships with genealogy (Phase 3).
export const persons = pgTable(
  "persons",
  {
    id: ColumnHelper.primaryId(),
    recordStatus: personRecordStatus("record_status").notNull().default("active"),
    mergedIntoId: uuid("merged_into_id").references((): AnyPgColumn => persons.id),
    lineageRole: lineageRole("lineage_role").notNull(),
    isFoundingAncestor: boolean("is_founding_ancestor").notNull().default(false),
    gender: gender("gender"),
    genderNote: text("gender_note"),
    livingStatus: livingStatus("living_status").notNull().default("unknown"),
    birthDate: jsonb("birth_date").$type<TFuzzyDate>(),
    birthSortFrom: date("birth_sort_from"),
    birthSortTo: date("birth_sort_to"),
    deathDate: jsonb("death_date").$type<TFuzzyDate>(),
    deathSortFrom: date("death_sort_from"),
    deathSortTo: date("death_sort_to"),
    birthPlaceId: uuid("birth_place_id").references(() => places.id),
    deathPlaceId: uuid("death_place_id").references(() => places.id),
    birthClanId: uuid("birth_clan_id").references(() => clans.id),
    occupation: text("occupation"),
    internalNotes: text("internal_notes"),
    visibility: visibilityLevel("visibility").notNull().default("restricted"),
    fieldVisibility: jsonb("field_visibility").$type<TFieldVisibility>().notNull().default({}),
    verificationStatus: verificationStatus("verification_status").notNull().default("unverified"),
    verifiedBy: uuid("verified_by").references(() => users.id),
    verifiedAt: timestamp("verified_at", { withTimezone: true }),
    version: ColumnHelper.version(),
    createdAt: ColumnHelper.createdAt(),
    updatedAt: ColumnHelper.updatedAt(),
    createdBy: uuid("created_by").references(() => users.id),
    updatedBy: uuid("updated_by").references(() => users.id),
  },
  (table) => [
    index("persons_lineage_role_idx").on(table.lineageRole),
    index("persons_birth_sort_from_idx").on(table.birthSortFrom),
    index("persons_birth_clan_id_idx").on(table.birthClanId),
    index("persons_merged_into_id_idx")
      .on(table.mergedIntoId)
      .where(sql`${table.mergedIntoId} is not null`),
    check(
      "persons_merged_has_target",
      sql`${table.recordStatus} <> 'merged' or ${table.mergedIntoId} is not null`,
    ),
    check(
      "persons_not_merged_into_self",
      sql`${table.mergedIntoId} is null or ${table.mergedIntoId} <> ${table.id}`,
    ),
    check(
      "persons_birth_sort_order",
      sql`${table.birthSortFrom} is null or ${table.birthSortFrom} <= ${table.birthSortTo}`,
    ),
    check(
      "persons_death_sort_order",
      sql`${table.deathSortFrom} is null or ${table.deathSortFrom} <= ${table.deathSortTo}`,
    ),
    check(
      "persons_living_has_no_death",
      sql`${table.livingStatus} <> 'living' or ${table.deathDate} is null`,
    ),
    // ADR-020: the gender of a lineage member decides whether the line continues.
    check(
      "persons_lineage_gender",
      sql`${table.lineageRole} <> 'lineage' or ${table.gender} in ('male', 'female')`,
    ),
    check(
      "persons_founder_is_lineage_male",
      sql`not ${table.isFoundingAncestor} or (${table.lineageRole} = 'lineage' and ${table.gender} = 'male')`,
    ),
  ],
);
