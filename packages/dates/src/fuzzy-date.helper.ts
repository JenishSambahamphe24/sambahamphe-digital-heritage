import type { ICalendarDate } from "./dates.types.js";
import type { TDateParts, TFuzzyDate } from "./fuzzy-date.schema.js";

import { BikramSambatHelper } from "./bikram-sambat.helper.js";

const DAY_MS = 86_400_000;
const MONTHS_PER_YEAR = 12;
// "About 2010" is taken to mean within five years either side.
export const ABOUT_TOLERANCE_YEARS = 5;
// "Before 2010" / "after 2010" look back or ahead one generation (ADR-011).
export const OPEN_RANGE_YEARS = 25;
// A BS year starts in mid-April of AD year (BS − 57) and ends in mid-April of
// (BS − 56). Outside the conversion table we can only say "somewhere in there".
const BS_TO_AD_YEAR_OFFSET = 57;
const BS_YEAR_APPROX_START_MONTH = 4;
const BS_YEAR_APPROX_START_DAY = 1;
const BS_YEAR_APPROX_END_MONTH = 4;
const BS_YEAR_APPROX_END_DAY = 30;

export interface INormalizedRange {
  from: string;
  to: string;
  approximate: boolean;
}

interface IDayRange {
  from: number;
  to: number;
  approximate: boolean;
}

export class FuzzyDateHelper {
  // The AD sort range a fuzzy date stands for (ISO dates, inclusive). Stored
  // next to the original value; the original is what users see and edit.
  static normalize(date: TFuzzyDate): INormalizedRange {
    const start = FuzzyDateHelper.partsRange(date.calendar, date);
    let range: IDayRange;
    switch (date.qualifier) {
      case "exact":
      case "calculated":
        range = start;
        break;
      case "about":
        range = {
          from: FuzzyDateHelper.addYears(start.from, -ABOUT_TOLERANCE_YEARS),
          to: FuzzyDateHelper.addYears(start.to, ABOUT_TOLERANCE_YEARS),
          approximate: start.approximate,
        };
        break;
      case "before":
        range = {
          from: FuzzyDateHelper.addYears(start.from, -OPEN_RANGE_YEARS),
          to: start.from - DAY_MS,
          approximate: start.approximate,
        };
        break;
      case "after":
        range = {
          from: start.to + DAY_MS,
          to: FuzzyDateHelper.addYears(start.to, OPEN_RANGE_YEARS),
          approximate: start.approximate,
        };
        break;
      case "between": {
        const end = date.end ? FuzzyDateHelper.partsRange(date.calendar, date.end) : start;
        range = { from: start.from, to: end.to, approximate: start.approximate || end.approximate };
        break;
      }
    }
    return {
      from: FuzzyDateHelper.iso(range.from),
      to: FuzzyDateHelper.iso(range.to),
      approximate: range.approximate,
    };
  }

  private static partsRange(calendar: "BS" | "AD", parts: TDateParts): IDayRange {
    return calendar === "AD" ? FuzzyDateHelper.adRange(parts) : FuzzyDateHelper.bsRange(parts);
  }

  private static adRange(parts: TDateParts): IDayRange {
    const firstMonth = parts.month ?? 1;
    const lastMonth = parts.month ?? MONTHS_PER_YEAR;
    const from = Date.UTC(parts.year, firstMonth - 1, parts.day ?? 1);
    const to = parts.day !== undefined ? from : Date.UTC(parts.year, lastMonth, 0);
    return { from, to, approximate: false };
  }

  private static bsRange(parts: TDateParts): IDayRange {
    if (!BikramSambatHelper.isSupportedYear(parts.year)) {
      const adYear = parts.year - BS_TO_AD_YEAR_OFFSET;
      return {
        from: Date.UTC(adYear, BS_YEAR_APPROX_START_MONTH - 1, BS_YEAR_APPROX_START_DAY),
        to: Date.UTC(adYear + 1, BS_YEAR_APPROX_END_MONTH - 1, BS_YEAR_APPROX_END_DAY),
        approximate: true,
      };
    }
    const firstMonth = parts.month ?? 1;
    const lastMonth = parts.month ?? MONTHS_PER_YEAR;
    const first = BikramSambatHelper.toAd({
      year: parts.year,
      month: firstMonth,
      day: parts.day ?? 1,
    });
    const last = BikramSambatHelper.toAd({
      year: parts.year,
      month: lastMonth,
      day: parts.day ?? BikramSambatHelper.daysInMonth(parts.year, lastMonth),
    });
    return { from: FuzzyDateHelper.utc(first), to: FuzzyDateHelper.utc(last), approximate: false };
  }

  private static addYears(time: number, years: number): number {
    const date = new Date(time);
    return Date.UTC(date.getUTCFullYear() + years, date.getUTCMonth(), date.getUTCDate());
  }

  private static utc(date: ICalendarDate): number {
    return Date.UTC(date.year, date.month - 1, date.day);
  }

  private static iso(time: number): string {
    return new Date(time).toISOString().slice(0, 10);
  }
}
