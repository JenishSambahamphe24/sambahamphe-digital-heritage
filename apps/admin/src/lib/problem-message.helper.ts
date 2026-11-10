const KNOWN_CODES = [
  "invalid_credentials",
  "account_disabled",
  "rate_limited",
  "admin_access_required",
  "forbidden",
  "already_assigned",
  "last_super_admin",
  "user_not_verified",
  "unknown_role",
  "not_found",
  "validation_error",
  "version_conflict",
  "place_cycle",
  "unknown_parent",
  "person_not_active",
  "slug_taken",
  "term_overlap",
  "position_taken",
  "position_full",
  "already_appointed",
  "appointment_not_active",
  "position_key_taken",
  "position_has_overlapping_holders",
] as const;

type TKnownCode = (typeof KNOWN_CODES)[number];

export class ProblemMessageHelper {
  // The API's stable error code → a translated message key; anything
  // unexpected gets the generic message, never the server's English text.
  static keyFor(code: string | undefined): string {
    if (code === "validation_error") {
      return "error_validation";
    }
    return code && (KNOWN_CODES as readonly string[]).includes(code)
      ? `error_${code as TKnownCode}`
      : "error_generic";
  }
}
