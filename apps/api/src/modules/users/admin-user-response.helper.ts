import type { TUserRow } from "./users.repository.js";
import type { TAdminUserResponse } from "@repo/contracts";

import { adminUserResponseSchema } from "@repo/contracts";

export class AdminUserResponseHelper {
  static fromRow(row: TUserRow): TAdminUserResponse {
    return adminUserResponseSchema.parse({
      id: row.id,
      email: row.email,
      emailVerified: row.emailVerifiedAt !== null,
      displayName: row.displayName,
      status: row.status,
      createdAt: row.createdAt.toISOString(),
      lastLoginAt: row.lastLoginAt?.toISOString() ?? null,
    });
  }
}
