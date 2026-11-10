import { integer, jsonb, pgTable, text, timestamp, unique, uuid } from "drizzle-orm/pg-core";

import { changeRequests } from "./change-requests.schema.js";
import { ColumnHelper } from "./column.helper.js";
import { users } from "./users.schema.js";

// A full snapshot per version, child rows included, so any version can be
// shown or restored without replaying history.
export const entityRevisions = pgTable(
  "entity_revisions",
  {
    id: ColumnHelper.primaryId(),
    entityType: text("entity_type").notNull(),
    entityId: uuid("entity_id").notNull(),
    version: integer("version").notNull(),
    snapshot: jsonb("snapshot").$type<Record<string, unknown>>().notNull(),
    changeRequestId: uuid("change_request_id").references(() => changeRequests.id),
    actorId: uuid("actor_id").references(() => users.id),
    reason: text("reason"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique("entity_revisions_version_unique").on(table.entityType, table.entityId, table.version),
  ],
);
