import type { TTermResponse } from "@repo/contracts";
import type { TDateLocale } from "@repo/dates";

import { IsoDateFormatHelper } from "@repo/dates";

import { I18nTextHelper } from "#/lib/i18n-text.helper";

export class BoardTermHelper {
  // The term's own name when an editor gave one, else its years: "2082–2084 BS".
  static label(term: TTermResponse, locale: TDateLocale): string {
    const named = term.labelI18n ? I18nTextHelper.pick(term.labelI18n, locale) : "";
    return named || IsoDateFormatHelper.yearRange(term.startsOn, term.endsOn, locale);
  }

  static locale(locale: string): TDateLocale {
    return locale === "ne" ? "ne" : "en";
  }
}
