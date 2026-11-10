import type { TI18nText } from "@repo/contracts";

export class I18nTextHelper {
  // The label in the admin's language, falling back to the other one.
  static pick(text: TI18nText, locale: string): string {
    return (locale === "ne" ? (text.ne ?? text.en) : (text.en ?? text.ne)) ?? "";
  }
}
