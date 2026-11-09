import { describe, expect, it } from "vitest";

import { fuzzyDateSchema } from "./fuzzy-date.schema.js";

function issues(input: unknown): string[] {
  const result = fuzzyDateSchema.safeParse(input);
  return result.success
    ? []
    : result.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`);
}

describe("fuzzyDateSchema", () => {
  it("accepts partial and qualified dates", () => {
    expect(issues({ calendar: "BS", qualifier: "about", year: 2010 })).toEqual([]);
    expect(issues({ calendar: "BS", qualifier: "exact", year: 2010, month: 4, day: 32 })).toEqual(
      [],
    );
    expect(
      issues({
        calendar: "AD",
        qualifier: "between",
        year: 1950,
        end: { year: 1955 },
        text: "around the war",
      }),
    ).toEqual([]);
  });

  it("rejects days a BS month doesn't have", () => {
    expect(issues({ calendar: "BS", qualifier: "exact", year: 2081, month: 1, day: 32 })).toEqual([
      "day: This day doesn't exist in that month",
    ]);
  });

  it("rejects days an AD month doesn't have, leap years included", () => {
    expect(
      issues({ calendar: "AD", qualifier: "exact", year: 2023, month: 2, day: 29 }),
    ).toHaveLength(1);
    expect(issues({ calendar: "AD", qualifier: "exact", year: 2024, month: 2, day: 29 })).toEqual(
      [],
    );
  });

  it("requires a month when a day is given", () => {
    expect(issues({ calendar: "AD", qualifier: "exact", year: 1953, day: 4 })).toContain(
      "day: A day needs a month",
    );
  });

  it("requires an end exactly when the qualifier is 'between'", () => {
    expect(issues({ calendar: "BS", qualifier: "between", year: 2010 })).toHaveLength(1);
    expect(
      issues({ calendar: "BS", qualifier: "about", year: 2010, end: { year: 2012 } }),
    ).toHaveLength(1);
  });

  it("rejects an end before the start", () => {
    expect(
      issues({ calendar: "BS", qualifier: "between", year: 2015, end: { year: 2010 } }),
    ).toEqual(["end: The end is before the start"]);
  });

  it("reports an invalid day cleanly even inside a 'between' range", () => {
    expect(
      issues({
        calendar: "BS",
        qualifier: "between",
        year: 2081,
        month: 1,
        day: 32,
        end: { year: 2082 },
      }),
    ).toEqual(["day: This day doesn't exist in that month"]);
  });
});
