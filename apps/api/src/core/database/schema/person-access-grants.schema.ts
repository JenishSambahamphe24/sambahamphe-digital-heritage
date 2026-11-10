import { index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { ColumnHelper } from "./column.helper.js";
import { persons } from "./persons.schema.js";
import { users } from "./users.schema.js";

// Named access to a restricted person's field groups (genealogy-access-policy §3).
export const personAccessGrants = pgTable(
  "person_access_grants",
  {
    id: ColumnHelper.primaryId(),
    personId: uuid("person_id")
      .notNull()
      .references(() => persons.id),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    fieldGroups: text("field_groups").array().notNull(),
    grantedBy: uuid("granted_by")
      .notNull()
      .references(() => users.id),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    createdAt: ColumnHelper.createdAt(),
  },
  (table) => [index("person_access_grants_person_user_idx").on(table.personId, table.userId)],
);
