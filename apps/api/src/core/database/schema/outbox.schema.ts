import { index, integer, jsonb, pgTable, text } from "drizzle-orm/pg-core";

import { ColumnHelper } from "./column.helper.js";

// Rows are deleted once handed to the queue: payloads can carry one-time
// links, which must not sit in the database after delivery.
export const outbox = pgTable(
  "outbox",
  {
    id: ColumnHelper.primaryId(),
    topic: text("topic").notNull(),
    payload: jsonb("payload").notNull(),
    attempts: integer("attempts").notNull().default(0),
    createdAt: ColumnHelper.createdAt(),
  },
  (table) => [index("outbox_by_age").on(table.createdAt)],
);
