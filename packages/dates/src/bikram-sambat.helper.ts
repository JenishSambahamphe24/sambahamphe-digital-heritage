import type { ICalendarDate } from "./dates.types.js";

import { BS_MONTH_LENGTHS, BS_TABLE_FIRST_YEAR, BS_TABLE_LAST_YEAR } from "./bs-calendar.data.js";
import { DateOutOfRangeError } from "./date-out-of-range.error.js";

const DAY_MS = 86_400_000;
const MONTHS_PER_YEAR = 12;
// 1 Baisakh 1970 BS. UTC throughout, so the host timezone can never shift a day.
const EPOCH_AD_MS = Date.UTC(1913, 3, 13);

const YEAR_START_OFFSETS = new Map<number, number>();
let totalDays = 0;
for (let year = BS_TABLE_FIRST_YEAR; year <= BS_TABLE_LAST_YEAR; year += 1) {
  YEAR_START_OFFSETS.set(year, totalDays);
  totalDays += (BS_MONTH_LENGTHS[year] ?? []).reduce((sum, days) => sum + days, 0);
}
const TABLE_DAY_COUNT = totalDays;

export class BikramSambatHelper {
  static readonly firstYear = BS_TABLE_FIRST_YEAR;
  static readonly lastYear = BS_TABLE_LAST_YEAR;

  static isSupportedYear(year: number): boolean {
    return Number.isInteger(year) && year >= BS_TABLE_FIRST_YEAR && year <= BS_TABLE_LAST_YEAR;
  }

  static daysInMonth(year: number, month: number): number {
    const days = BikramSambatHelper.monthLengths(year)[month - 1];
    if (days === undefined) {
      throw new DateOutOfRangeError(`Month ${month} is not between 1 and ${MONTHS_PER_YEAR}`);
    }
    return days;
  }

  static isValid(date: ICalendarDate): boolean {
    return (
      BikramSambatHelper.isSupportedYear(date.year) &&
      Number.isInteger(date.month) &&
      date.month >= 1 &&
      date.month <= MONTHS_PER_YEAR &&
      Number.isInteger(date.day) &&
      date.day >= 1 &&
      date.day <= BikramSambatHelper.daysInMonth(date.year, date.month)
    );
  }

  static toAd(bs: ICalendarDate): ICalendarDate {
    if (!BikramSambatHelper.isValid(bs)) {
      throw new DateOutOfRangeError(
        `${bs.year}-${bs.month}-${bs.day} BS is not a valid date in the supported range ` +
          `${BS_TABLE_FIRST_YEAR}–${BS_TABLE_LAST_YEAR} BS`,
      );
    }
    const monthsBefore = BikramSambatHelper.monthLengths(bs.year)
      .slice(0, bs.month - 1)
      .reduce((sum, days) => sum + days, 0);
    const offset = (YEAR_START_OFFSETS.get(bs.year) ?? 0) + monthsBefore + bs.day - 1;
    const date = new Date(EPOCH_AD_MS + offset * DAY_MS);
    return { year: date.getUTCFullYear(), month: date.getUTCMonth() + 1, day: date.getUTCDate() };
  }

  static fromAd(ad: ICalendarDate): ICalendarDate {
    let offset = Math.round((Date.UTC(ad.year, ad.month - 1, ad.day) - EPOCH_AD_MS) / DAY_MS);
    if (offset < 0 || offset >= TABLE_DAY_COUNT) {
      throw new DateOutOfRangeError(
        `${ad.year}-${ad.month}-${ad.day} AD falls outside the supported BS range ` +
          `${BS_TABLE_FIRST_YEAR}–${BS_TABLE_LAST_YEAR}`,
      );
    }
    for (let year = BS_TABLE_FIRST_YEAR; year <= BS_TABLE_LAST_YEAR; year += 1) {
      const lengths = BikramSambatHelper.monthLengths(year);
      for (let index = 0; index < lengths.length; index += 1) {
        const days = lengths[index] ?? 0;
        if (offset < days) {
          return { year, month: index + 1, day: offset + 1 };
        }
        offset -= days;
      }
    }
    throw new DateOutOfRangeError("Unreachable: offset checked against the table size");
  }

  private static monthLengths(year: number): readonly number[] {
    const lengths = BS_MONTH_LENGTHS[year];
    if (!lengths) {
      throw new DateOutOfRangeError(
        `${year} BS is outside the supported range ${BS_TABLE_FIRST_YEAR}–${BS_TABLE_LAST_YEAR}`,
      );
    }
    return lengths;
  }
}
