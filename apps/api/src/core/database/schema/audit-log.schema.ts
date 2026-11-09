import { bigint, index, jsonb, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const actorType = pgEnum("actor_type", ["user", "anonymous", "system", "job"]);

// Append-only: a trigger (migration 0003) rejects UPDATE, DELETE and TRUNCATE.
export const auditLog = pgTable(
  "audit_log",
  {
    id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
    occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull().defaultNow(),
    actorType: actorType("actor_type").notNull(),
    actorId: uuid("actor_id"),
    action: text("action").notNull(),
    entityType: text("entity_type"),
    entityId: uuid("entity_id"),
    changes: jsonb("changes"),
    requestId: text("request_id"),
    ipHash: text("ip_hash"),
    userAgent: text("user_agent"),
  },
  (table) => [
    index("audit_log_by_entity").on(table.entityType, table.entityId, table.occurredAt.desc()),
    index("audit_log_by_actor").on(table.actorId, table.occurredAt.desc()),
  ],
);
