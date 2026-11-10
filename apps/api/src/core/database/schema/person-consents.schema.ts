import type { visibilityLevel } from "./persons.schema.js";

import { index, jsonb, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { ColumnHelper } from "./column.helper.js";
import { persons } from "./persons.schema.js";
import { users } from "./users.schema.js";

export const consentRelation = pgEnum("consent_relation", [
  "self",
  "parent_guardian",
  "next_of_kin",
  "estate",
]);

export interface IConsentScope {
  visibility: (typeof visibilityLevel.enumValues)[number];
  fieldGroups: string[];
}

// Evidence documents (a signed form) link here once media exists (M2.3).
export const personConsents = pgTable(
  "person_consents",
  {
    id: ColumnHelper.primaryId(),
    personId: uuid("person_id")
      .notNull()
      .references(() => persons.id),
    grantedByUserId: uuid("granted_by_user_id").references(() => users.id),
    grantedByName: text("granted_by_name").notNull(),
    relationToSubject: consentRelation("relation_to_subject").notNull(),
    scope: jsonb("scope").$type<IConsentScope>().notNull(),
    grantedAt: timestamp("granted_at", { withTimezone: true }).notNull(),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    recordedBy: uuid("recorded_by")
      .notNull()
      .references(() => users.id),
    notes: text("notes"),
    createdAt: ColumnHelper.createdAt(),
  },
  (table) => [index("person_consents_person_id_idx").on(table.personId)],
);
