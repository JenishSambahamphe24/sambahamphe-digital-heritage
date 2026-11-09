import type { TFuzzyDate } from "./fuzzy-date.schema.js";

import { describe, expect, it } from "vitest";

import { FuzzyDateHelper } from "./fuzzy-date.helper.js";

function bs(fields: Partial<TFuzzyDate> & { year: number }): TFuzzyDate {
  return { calendar: "BS", qualifier: "exact", ...fields };
}

describe("FuzzyDateHelper.normalize", () => {
  it("maps a whole BS year onto the AD days it covers", () => {
    expect(FuzzyDateHelper.normalize(bs({ year: 2081 }))).toEqual({
      from: "2024-04-13",
      to: "2025-04-13",
      approximate: false,
    });
  });

  it("maps a BS month, including a 32-day month", () => {
    expect(FuzzyDateHelper.normalize(bs({ year: 2010, month: 4 }))).toEqual({
      from: "1953-07-16",
      to: "1953-08-16",
      approximate: false,
    });
  });

  it("maps an exact BS day to a single AD day", () => {
    expect(FuzzyDateHelper.normalize(bs({ year: 2079, month: 4, day: 15 }))).toEqual({
      from: "2022-07-31",
      to: "2022-07-31",
      approximate: false,
    });
  });

  it("widens 'about' by five years each side", () => {
    expect(FuzzyDateHelper.normalize(bs({ year: 2010, qualifier: "about" }))).toEqual({
      from: "1948-04-13",
      to: "1959-04-12",
      approximate: false,
    });
  });

  it("opens 'before' and 'after' by one generation, excluding the date itself", () => {
    const before = FuzzyDateHelper.normalize(bs({ year: 2010, qualifier: "before" }));
    const after = FuzzyDateHelper.normalize(bs({ year: 2010, qualifier: "after" }));

    expect(before).toEqual({ from: "1928-04-13", to: "1953-04-12", approximate: false });
    expect(after).toEqual({ from: "1954-04-13", to: "1979-04-12", approximate: false });
  });

  it("spans 'between' from the start of the first to the end of the last", () => {
    expect(
      FuzzyDateHelper.normalize(bs({ year: 2010, qualifier: "between", end: { year: 2011 } })),
    ).toEqual({ from: "1953-04-13", to: "1955-04-13", approximate: false });
  });

  it("approximates BS years older than the conversion table instead of failing", () => {
    expect(FuzzyDateHelper.normalize(bs({ year: 1950, month: 6, day: 10 }))).toEqual({
      from: "1893-04-01",
      to: "1894-04-30",
      approximate: true,
    });
  });

  it("handles AD dates at year, month and day precision", () => {
    const ad = (fields: Partial<TFuzzyDate>) =>
      FuzzyDateHelper.normalize({ calendar: "AD", qualifier: "exact", year: 1953, ...fields });

    expect(ad({})).toEqual({ from: "1953-01-01", to: "1953-12-31", approximate: false });
    expect(ad({ month: 2 })).toEqual({ from: "1953-02-01", to: "1953-02-28", approximate: false });
    expect(ad({ month: 2, day: 14 })).toEqual({
      from: "1953-02-14",
      to: "1953-02-14",
      approximate: false,
    });
  });
});
