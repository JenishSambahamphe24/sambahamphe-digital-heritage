import type { TUserRow } from "./users.repository.js";
import type { TUserResponse } from "@repo/contracts";

import { userResponseSchema } from "@repo/contracts";

export class UserResponseHelper {
  static fromRow(row: TUserRow): TUserResponse {
    return userResponseSchema.parse({
      id: row.id,
      email: row.email,
      emailVerified: row.emailVerifiedAt !== null,
      displayName: row.displayName,
      preferredLocale: row.preferredLocale,
    });
  }
}
