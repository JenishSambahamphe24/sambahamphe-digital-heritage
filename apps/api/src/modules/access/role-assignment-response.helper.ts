import type { TAssignmentRow } from "./internal/access.repository.js";
import type { TRoleAssignmentResponse } from "@repo/contracts";

import { roleAssignmentResponseSchema } from "@repo/contracts";

export class RoleAssignmentResponseHelper {
  static fromRow(row: TAssignmentRow, roleKey: string): TRoleAssignmentResponse {
    return roleAssignmentResponseSchema.parse({
      id: row.id,
      userId: row.userId,
      role: roleKey,
      scopeType: row.scopeType,
      orgUnitId: row.orgUnitId,
      branchId: row.branchId,
      grantedAt: row.grantedAt.toISOString(),
      expiresAt: row.expiresAt?.toISOString() ?? null,
      revokedAt: row.revokedAt?.toISOString() ?? null,
    });
  }
}
