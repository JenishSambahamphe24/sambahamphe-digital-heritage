import { index, integer, jsonb, pgEnum, pgTable, text, unique, uuid } from "drizzle-orm/pg-core";

import { changeRequests } from "./change-requests.schema.js";
import { ColumnHelper } from "./column.helper.js";

export const crApplyStatus = pgEnum("cr_apply_status", [
  "pending",
  "applied",
  "conflict",
  "skipped",
]);

export const changeRequestOperations = pgTable(
  "change_request_operations",
  {
    id: ColumnHelper.primaryId(),
    changeRequestId: uuid("change_request_id")
      .notNull()
      .references(() => changeRequests.id, { onDelete: "cascade" }),
    seq: integer("seq").notNull(),
    opType: text("op_type").notNull(),
    // Validated per op_type by the change-request operation schemas.
    payload: jsonb("payload").$type<Record<string, unknown>>().notNull(),
    payloadVersion: integer("payload_version").notNull().default(1),
    tempRef: text("temp_ref"),
    targetType: text("target_type"),
    targetId: uuid("target_id"),
    baseVersion: integer("base_version"),
    applyStatus: crApplyStatus("apply_status").notNull().default("pending"),
    resultEntityId: uuid("result_entity_id"),
  },
  (table) => [
    unique("change_request_operations_seq_unique").on(table.changeRequestId, table.seq),
    index("change_request_operations_target_idx").on(table.targetType, table.targetId),
  ],
);
