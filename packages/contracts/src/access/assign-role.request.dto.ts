import { z } from "zod";

const roleKey = z.string().min(1).max(64);
const expiresAt = z.iso.datetime({ offset: true }).optional();

export const assignRoleRequestSchema = z.discriminatedUnion("scopeType", [
  z.object({ userId: z.uuid(), roleKey, scopeType: z.literal("global"), expiresAt }),
  z.object({
    userId: z.uuid(),
    roleKey,
    scopeType: z.literal("org_unit"),
    orgUnitId: z.uuid(),
    expiresAt,
  }),
  z.object({
    userId: z.uuid(),
    roleKey,
    scopeType: z.literal("branch"),
    branchId: z.uuid(),
    expiresAt,
  }),
]);

export type TAssignRoleRequest = z.infer<typeof assignRoleRequestSchema>;
