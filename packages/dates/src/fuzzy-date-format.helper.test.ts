import type { TFuzzyDate } from "./fuzzy-date.schema.js";

import { describe, expect, it } from "vitest";

import { FuzzyDateFormatHelper } from "./fuzzy-date-format.helper.js";

const shrawan2010: TFuzzyDate = {
  calendar: "BS",
  qualifier: "exact",
  year: 2010,
  month: 4,
  day: 12,
};

describe("FuzzyDateFormatHelper", () => {
  it("formats BS dates in English and Nepali", () => {
    expect(FuzzyDateFormatHelper.format(shrawan2010, "en")).toBe("12 Shrawan 2010 BS");
    expect(FuzzyDateFormatHelper.format(shrawan2010, "ne")).toBe("वि.सं. १२ साउन २०१०");
  });

  it("applies qualifiers", () => {
    const about: TFuzzyDate = { calendar: "BS", qualifier: "about", year: 2010 };
    const between: TFuzzyDate = {
      calendar: "AD",
      qualifier: "between",
      year: 1950,
      end: { year: 1955 },
    };

    expect(FuzzyDateFormatHelper.format(about, "en")).toBe("about 2010 BS");
    expect(FuzzyDateFormatHelper.format(about, "ne")).toBe("वि.सं. करिब २०१०");
    expect(FuzzyDateFormatHelper.format(between, "en")).toBe("between 1950 and 1955 AD");
  });

  it("gives the other calendar as a year span", () => {
    expect(FuzzyDateFormatHelper.equivalent(shrawan2010, "en")).toBe("1953 AD");
    expect(
      FuzzyDateFormatHelper.equivalent({ calendar: "BS", qualifier: "exact", year: 2010 }, "en"),
    ).toBe("1953–1954 AD");
    expect(
      FuzzyDateFormatHelper.equivalent({ calendar: "AD", qualifier: "exact", year: 1953 }, "en"),
    ).toBe("2009–2010 BS");
  });

  it("marks approximate conversions", () => {
    expect(
      FuzzyDateFormatHelper.equivalent({ calendar: "BS", qualifier: "exact", year: 1950 }, "en"),
    ).toBe("≈ 1893–1894 AD");
  });
});
