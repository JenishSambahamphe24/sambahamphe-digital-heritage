import type { TUserResponse } from "./dto/user.response.dto.js";
import type { TUserRow } from "./users.repository.js";

import { userResponseSchema } from "./dto/user.response.dto.js";

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
