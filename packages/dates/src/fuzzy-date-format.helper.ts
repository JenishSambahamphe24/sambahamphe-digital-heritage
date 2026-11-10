import type { TDateParts, TFuzzyDate } from "./fuzzy-date.schema.js";

import { FuzzyDateHelper } from "./fuzzy-date.helper.js";

export type TDateLocale = "en" | "ne";

const BS_MONTHS: Record<TDateLocale, readonly string[]> = {
  en: [
    "Baisakh",
    "Jestha",
    "Asar",
    "Shrawan",
    "Bhadra",
    "Asoj",
    "Kartik",
    "Mangsir",
    "Poush",
    "Magh",
    "Falgun",
    "Chaitra",
  ],
  ne: [
    "बैशाख",
    "जेठ",
    "असार",
    "साउन",
    "भदौ",
    "असोज",
    "कात्तिक",
    "मंसिर",
    "पुस",
    "माघ",
    "फागुन",
    "चैत",
  ],
};

const AD_MONTHS: Record<TDateLocale, readonly string[]> = {
  en: [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ],
  ne: [
    "जनवरी",
    "फेब्रुअरी",
    "मार्च",
    "अप्रिल",
    "मे",
    "जुन",
    "जुलाई",
    "अगस्ट",
    "सेप्टेम्बर",
    "अक्टोबर",
    "नोभेम्बर",
    "डिसेम्बर",
  ],
};

const ERA: Record<TDateLocale, Record<"BS" | "AD", string>> = {
  en: { BS: "BS", AD: "AD" },
  ne: { BS: "वि.सं.", AD: "ई.सं." },
};

const DEVANAGARI_DIGITS = "०१२३४५६७८९";

// Nepali wording awaits review by the organization (requirements Q-3).
const QUALIFIER_TEMPLATES: Record<TDateLocale, Record<TFuzzyDate["qualifier"], string>> = {
  en: {
    exact: "{date}",
    about: "about {date}",
    before: "before {date}",
    after: "after {date}",
    between: "between {date} and {end}",
    calculated: "{date} (calculated)",
  },
  ne: {
    exact: "{date}",
    about: "करिब {date}",
    before: "{date} भन्दा अघि",
    after: "{date} पछि",
    between: "{date} देखि {end} सम्म",
    calculated: "{date} (गणना गरिएको)",
  },
};

export class FuzzyDateFormatHelper {
  // In the calendar the date was recorded in, e.g. "about Shrawan 2010 BS".
  static format(date: TFuzzyDate, locale: TDateLocale): string {
    const era = ERA[locale][date.calendar];
    const start = FuzzyDateFormatHelper.parts(date.calendar, date, locale);
    const end = date.end ? FuzzyDateFormatHelper.parts(date.calendar, date.end, locale) : "";
    const template = QUALIFIER_TEMPLATES[locale][date.qualifier];
    const text = template.replace("{date}", start).replace("{end}", end);
    return locale === "ne" ? `${era} ${text}` : `${text} ${era}`;
  }

  // The same date in the other calendar, as a year span, e.g. "1953–1954 AD";
  // prefixed with "≈" when the conversion is only approximate.
  static equivalent(date: TFuzzyDate, locale: TDateLocale): string {
    const range = FuzzyDateHelper.normalize(date);
    const fromYear = Number(range.from.slice(0, 4));
    const toYear = Number(range.to.slice(0, 4));
    const years =
      fromYear === toYear
        ? FuzzyDateFormatHelper.number(fromYear, locale)
        : `${FuzzyDateFormatHelper.number(fromYear, locale)}–${FuzzyDateFormatHelper.number(toYear, locale)}`;
    const marker = range.approximate ? "≈ " : "";
    const era = ERA[locale][date.calendar === "BS" ? "AD" : "BS"];
    return date.calendar === "BS"
      ? locale === "ne"
        ? `${marker}${era} ${years}`
        : `${marker}${years} ${era}`
      : FuzzyDateFormatHelper.adToBsEquivalent(range, locale, marker);
  }

  private static adToBsEquivalent(
    range: { from: string; to: string },
    locale: TDateLocale,
    marker: string,
  ): string {
    // An AD year overlaps two BS years (BS year = AD + 56 or + 57).
    const fromBs = Number(range.from.slice(0, 4)) + 56;
    const toBs = Number(range.to.slice(0, 4)) + 57;
    const years = `${FuzzyDateFormatHelper.number(fromBs, locale)}–${FuzzyDateFormatHelper.number(toBs, locale)}`;
    return locale === "ne" ? `${marker}${ERA.ne.BS} ${years}` : `${marker}${years} ${ERA.en.BS}`;
  }

  private static parts(calendar: "BS" | "AD", parts: TDateParts, locale: TDateLocale): string {
    const months = calendar === "BS" ? BS_MONTHS[locale] : AD_MONTHS[locale];
    const segments = [
      parts.day !== undefined ? FuzzyDateFormatHelper.number(parts.day, locale) : null,
      parts.month !== undefined ? months[parts.month - 1] : null,
      FuzzyDateFormatHelper.number(parts.year, locale),
    ];
    return segments.filter((segment) => segment !== null).join(" ");
  }

  static number(value: number, locale: TDateLocale): string {
    const text = String(value);
    return locale === "ne"
      ? text.replace(/\d/g, (digit) => DEVANAGARI_DIGITS[Number(digit)] ?? digit)
      : text;
  }
}
