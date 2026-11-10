const KNOWN_CODES = {
  invalid_credentials: "error_invalid_credentials",
  account_disabled: "error_account_disabled",
  rate_limited: "error_rate_limited",
  invalid_token: "error_invalid_token",
  validation_error: "error_validation",
} as const;

export type TProblemMessageKey = (typeof KNOWN_CODES)[keyof typeof KNOWN_CODES] | "error_generic";

export class ProblemMessageHelper {
  // Maps the API's stable error code to a translated message key; unknown
  // codes get the generic message rather than English text from the server.
  static keyFor(code: string | undefined): TProblemMessageKey {
    return code && code in KNOWN_CODES
      ? KNOWN_CODES[code as keyof typeof KNOWN_CODES]
      : "error_generic";
  }
}
