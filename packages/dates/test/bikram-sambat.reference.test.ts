import type { ICalendarDate } from "../src/dates.types.js";

import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { BikramSambatHelper } from "../src/bikram-sambat.helper.js";
import { DateOutOfRangeError } from "../src/date-out-of-range.error.js";

const REFERENCE_PAIRS = Object.entries(
  JSON.parse(
    readFileSync(new URL("./fixtures/bs-ad-reference.json", import.meta.url), "utf8"),
  ) as Record<string, string>,
);

function parse(iso: string): ICalendarDate {
  const [year, month, day] = iso.split("-").map(Number);
  return { year: year ?? 0, month: month ?? 0, day: day ?? 0 };
}

function iso(date: ICalendarDate): string {
  return [date.year, date.month, date.day]
    .map((part, index) => String(part).padStart(index ? 2 : 4, "0"))
    .join("-");
}

describe("BikramSambatHelper against Medic's reference conversions", () => {
  it(`converts all ${REFERENCE_PAIRS.length} reference AD dates to the expected BS date`, () => {
    const mismatches = REFERENCE_PAIRS.filter(
      ([ad, bs]) => iso(BikramSambatHelper.fromAd(parse(ad))) !== bs,
    );
    expect(mismatches.slice(0, 5)).toEqual([]);
  });

  it("converts every reference BS date back to the expected AD date", () => {
    const mismatches = REFERENCE_PAIRS.filter(
      ([ad, bs]) => iso(BikramSambatHelper.toAd(parse(bs))) !== ad,
    );
    expect(mismatches.slice(0, 5)).toEqual([]);
  });
});

describe("BikramSambatHelper across the whole table", () => {
  it("round-trips every day from 1970 to 2090 BS, with AD dates one day apart", () => {
    let previous: number | null = null;
    let days = 0;
    for (let year = BikramSambatHelper.firstYear; year <= BikramSambatHelper.lastYear; year += 1) {
      for (let month = 1; month <= 12; month += 1) {
        for (let day = 1; day <= BikramSambatHelper.daysInMonth(year, month); day += 1) {
          const ad = BikramSambatHelper.toAd({ year, month, day });
          expect(BikramSambatHelper.fromAd(ad)).toEqual({ year, month, day });
          const time = Date.UTC(ad.year, ad.month - 1, ad.day);
          if (previous !== null) {
            expect(time - previous).toBe(86_400_000);
          }
          previous = time;
          days += 1;
        }
      }
    }
    expect(days).toBeGreaterThan(44_000);
  });

  it("matches independently known Nepali New Year dates", () => {
    expect(BikramSambatHelper.toAd({ year: 2080, month: 1, day: 1 })).toEqual({
      year: 2023,
      month: 4,
      day: 14,
    });
    expect(BikramSambatHelper.toAd({ year: 2081, month: 1, day: 1 })).toEqual({
      year: 2024,
      month: 4,
      day: 13,
    });
    expect(BikramSambatHelper.toAd({ year: 2082, month: 1, day: 1 })).toEqual({
      year: 2025,
      month: 4,
      day: 14,
    });
  });
});

describe("BikramSambatHelper limits", () => {
  it("rejects dates outside the table instead of guessing", () => {
    expect(() => BikramSambatHelper.toAd({ year: 1969, month: 12, day: 30 })).toThrow(
      DateOutOfRangeError,
    );
    expect(() => BikramSambatHelper.fromAd({ year: 1913, month: 4, day: 12 })).toThrow(
      DateOutOfRangeError,
    );
    expect(BikramSambatHelper.isSupportedYear(1960)).toBe(false);
  });

  it("rejects days a month doesn't have", () => {
    const length = BikramSambatHelper.daysInMonth(2081, 1);
    expect(BikramSambatHelper.isValid({ year: 2081, month: 1, day: length })).toBe(true);
    expect(BikramSambatHelper.isValid({ year: 2081, month: 1, day: length + 1 })).toBe(false);
    expect(BikramSambatHelper.isValid({ year: 2081, month: 13, day: 1 })).toBe(false);
  });
});
