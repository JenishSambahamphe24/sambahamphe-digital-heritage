import { ApiError } from "./api-error";

const UNAUTHENTICATED = 401;
const ADMIN_ACCESS_REQUIRED = "admin_access_required";

export class SessionLossHelper {
  // The session expired, was revoked, or the user's last role was removed.
  // Any request can be the first to find out, so it's checked globally.
  static isSessionLost(error: unknown): boolean {
    return (
      error instanceof ApiError &&
      (error.status === UNAUTHENTICATED || error.code === ADMIN_ACCESS_REQUIRED)
    );
  }
}
