import {
  displayNameField,
  emailField,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
} from "@repo/contracts";

type TTranslate = (key: string, values?: Record<string, number>) => string;

// Same rules as the API (from @repo/contracts), with translated messages
// instead of Zod's English ones.
export class AuthValidationHelper {
  static email(value: string, t: TTranslate): string | undefined {
    return emailField.safeParse(value).success ? undefined : t("auth_email_invalid");
  }

  static newPassword(value: string, t: TTranslate): string | undefined {
    if (value.length < PASSWORD_MIN_LENGTH) {
      return t("auth_password_too_short", { min: PASSWORD_MIN_LENGTH });
    }
    if (value.length > PASSWORD_MAX_LENGTH) {
      return t("auth_password_too_long", { max: PASSWORD_MAX_LENGTH });
    }
    return undefined;
  }

  static requiredPassword(value: string, t: TTranslate): string | undefined {
    return value.length > 0 ? undefined : t("auth_password_required");
  }

  static displayName(value: string, t: TTranslate): string | undefined {
    return displayNameField.safeParse(value).success ? undefined : t("auth_display_name_required");
  }
}
