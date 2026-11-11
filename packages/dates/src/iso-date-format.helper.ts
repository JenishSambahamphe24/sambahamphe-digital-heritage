import type { ICalendarDate, TCalendar } from "./dates.types.js";
import type { TDateLocale } from "./fuzzy-date-format.helper.js";

import { BikramSambatHelper } from "./bikram-sambat.helper.js";
import { FuzzyDateFormatHelper } from "./fuzzy-date-format.helper.js";

export type TIsoDatePrecision = "day" | "month" | "year";

const ERA: Record<TDateLocale, Record<TCalendar, string>> = {
  en: { BS: "BS", AD: "AD" },
  ne: { BS: "वि.सं.", AD: "ई.सं." },
};

// Dates the API stores as AD days ("2025-04-14") with how exact they are,
// shown in BS. Outside the BS table they fall back to AD rather than failing.
export class IsoDateFormatHelper {
  static format(iso: string, precision: TIsoDatePrecision, locale: TDateLocale): string {
    const { calendar, date } = IsoDateFormatHelper.toDisplayCalendar(iso);
    return FuzzyDateFormatHelper.format(
      {
        calendar,
        qualifier: "exact",
        year: date.year,
        month: precision === "year" ? undefined : date.month,
        day: precision === "day" ? date.day : undefined,
      },
      locale,
    );
  }

  // "2082–2084 BS"; a single year when the range has no end or ends the same year.
  static yearRange(startIso: string, endIso: string | null, locale: TDateLocale): string {
    const start = IsoDateFormatHelper.toDisplayCalendar(startIso);
    const end = endIso ? IsoDateFormatHelper.toDisplayCalendar(endIso) : null;
    const calendar = end && end.calendar !== start.calendar ? "AD" : start.calendar;
    const startYear =
      calendar === start.calendar ? start.date.year : IsoDateFormatHelper.parse(startIso).year;
    const endYear = end
      ? calendar === end.calendar
        ? end.date.year
        : IsoDateFormatHelper.parse(endIso ?? startIso).year
      : null;
    const years =
      endYear === null || endYear === startYear
        ? FuzzyDateFormatHelper.number(startYear, locale)
        : `${FuzzyDateFormatHelper.number(startYear, locale)}–${FuzzyDateFormatHelper.number(endYear, locale)}`;
    return locale === "ne" ? `${ERA.ne[calendar]} ${years}` : `${years} ${ERA.en[calendar]}`;
  }

  private static toDisplayCalendar(iso: string): { calendar: TCalendar; date: ICalendarDate } {
    const ad = IsoDateFormatHelper.parse(iso);
    try {
      return { calendar: "BS", date: BikramSambatHelper.fromAd(ad) };
    } catch {
      return { calendar: "AD", date: ad };
    }
  }

  private static parse(iso: string): ICalendarDate {
    const [year = 0, month = 1, day = 1] = iso.split("-").map(Number);
    return { year, month, day };
  }
}
