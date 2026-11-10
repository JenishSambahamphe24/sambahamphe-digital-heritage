import type { ApiError } from "./api-error";

// Codes the forms know how to explain; anything else shows a generic line
// (never the server's English text).
const KNOWN_FIELD_CODES = [
  "lineage_gender_required",
  "founder_must_be_lineage_male",
  "living_has_no_death_date",
  "birth_year_required",
  "death_before_birth",
  "unknown_place",
  "minor_authority_required",
  "minor_not_public",
  "consent_required",
] as const;

export class FieldErrorsHelper {
  // "fieldVisibility.names" → "field_error_consent_required", from a 422.
  static byPath(error: ApiError | null): Map<string, string> {
    const result = new Map<string, string>();
    for (const field of error?.errors ?? []) {
      const key = (KNOWN_FIELD_CODES as readonly string[]).includes(field.code)
        ? `field_error_${field.code}`
        : "field_error_invalid";
      result.set(field.path.join("."), key);
    }
    return result;
  }
}
