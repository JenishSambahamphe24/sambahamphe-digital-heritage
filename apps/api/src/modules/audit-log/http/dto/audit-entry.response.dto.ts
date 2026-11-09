import { z } from "zod";

export const auditEntryResponseSchema = z.object({
  id: z.number().int(),
  occurredAt: z.iso.datetime(),
  actorType: z.enum(["user", "anonymous", "system", "job"]),
  actorId: z.uuid().nullable(),
  action: z.string(),
  entityType: z.string().nullable(),
  entityId: z.uuid().nullable(),
  changes: z.record(z.string(), z.unknown()).nullable(),
  requestId: z.string().nullable(),
});

export type TAuditEntryResponse = z.infer<typeof auditEntryResponseSchema>;
