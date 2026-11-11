import type { TI18nText } from "@repo/contracts";

export class I18nTextHelper {
  // The label in the page's language, falling back to the other one.
  static pick(text: TI18nText, locale: string): string {
    return (locale === "ne" ? (text.ne ?? text.en) : (text.en ?? text.ne)) ?? "";
  }

  static initials(name: string): string {
    return name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word.charAt(0).toUpperCase())
      .join("");
  }
}
