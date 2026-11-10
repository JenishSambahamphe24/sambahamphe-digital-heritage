import { z } from "zod";

export const DEFAULT_AUDIT_LIMIT = 50;
export const MAX_AUDIT_LIMIT = 100;

export const listAuditLogQuerySchema = z.object({
  entityType: z.string().min(1).max(64).optional(),
  entityId: z.uuid().optional(),
  actorId: z.uuid().optional(),
  action: z.string().min(1).max(64).optional(),
  cursor: z.string().max(64).optional(),
  limit: z.coerce.number().int().min(1).max(MAX_AUDIT_LIMIT).default(DEFAULT_AUDIT_LIMIT),
});

export type TListAuditLogQuery = z.infer<typeof listAuditLogQuerySchema>;
