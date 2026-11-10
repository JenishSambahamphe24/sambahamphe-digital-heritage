import { z } from "zod";

export const roleAssignmentResponseSchema = z.object({
  id: z.uuid(),
  userId: z.uuid(),
  role: z.string(),
  scopeType: z.enum(["global", "org_unit", "branch"]),
  orgUnitId: z.uuid().nullable(),
  branchId: z.uuid().nullable(),
  grantedAt: z.iso.datetime(),
  expiresAt: z.iso.datetime().nullable(),
  revokedAt: z.iso.datetime().nullable(),
});

export type TRoleAssignmentResponse = z.infer<typeof roleAssignmentResponseSchema>;
