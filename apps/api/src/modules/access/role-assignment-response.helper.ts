import type { TRoleAssignmentResponse } from "./http/dto/role-assignment.response.dto.js";
import type { TAssignmentRow } from "./internal/access.repository.js";

import { roleAssignmentResponseSchema } from "./http/dto/role-assignment.response.dto.js";

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
