import { sql } from "drizzle-orm";
import { boolean, check, index, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { ColumnHelper } from "./column.helper.js";
import { users } from "./users.schema.js";

export const crDomain = pgEnum("cr_domain", ["genealogy"]);
export const crStatus = pgEnum("cr_status", [
  "pending",
  "under_review",
  "needs_correction",
  "approved",
  "rejected",
  "withdrawn",
]);

// The single write path for genealogy (ADR-012). Editors' requests
// auto-approve; contributor submissions and review arrive in M3.2.
export const changeRequests = pgTable(
  "change_requests",
  {
    id: ColumnHelper.primaryId(),
    domain: crDomain("domain").notNull(),
    title: text("title").notNull(),
    rationale: text("rationale"),
    status: crStatus("status").notNull().default("pending"),
    autoApproved: boolean("auto_approved").notNull().default(false),
    submittedBy: uuid("submitted_by")
      .notNull()
      .references(() => users.id),
    submittedAt: timestamp("submitted_at", { withTimezone: true }).notNull().defaultNow(),
    reviewerId: uuid("reviewer_id").references(() => users.id),
    decidedBy: uuid("decided_by").references(() => users.id),
    decidedAt: timestamp("decided_at", { withTimezone: true }),
    decisionNote: text("decision_note"),
    version: ColumnHelper.version(),
    createdAt: ColumnHelper.createdAt(),
    updatedAt: ColumnHelper.updatedAt(),
  },
  (table) => [
    index("change_requests_status_submitted_idx").on(table.status, table.submittedAt),
    index("change_requests_submitted_by_idx").on(table.submittedBy),
    check(
      "change_requests_decided_iff_final",
      sql`(${table.status} in ('approved', 'rejected')) = (${table.decidedAt} is not null)`,
    ),
  ],
);
