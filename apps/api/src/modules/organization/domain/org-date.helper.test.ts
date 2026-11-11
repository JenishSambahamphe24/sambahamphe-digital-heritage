import { describe, expect, it } from "vitest";

import { OrgDateHelper } from "./org-date.helper.js";

describe("OrgDateHelper", () => {
  it("uses the Nepal date, not UTC", () => {
    // 20:00 UTC on 10 Nov is 01:45 on 11 Nov in Nepal.
    expect(OrgDateHelper.today(new Date("2026-11-10T20:00:00Z"))).toBe("2026-11-11");
  });

  it.each([
    [{ startsOn: "2020-01-01", endsOn: "2024-01-01" }, "2020-01-01", true],
    [{ startsOn: "2020-01-01", endsOn: "2024-01-01" }, "2024-01-01", false],
    [{ startsOn: "2020-01-01", endsOn: null }, "2030-05-05", true],
    [{ startsOn: "2020-01-01", endsOn: null }, "2019-12-31", false],
  ] as const)("%o covers %s → %s", (range, day, expected) => {
    expect(OrgDateHelper.covers(range, day)).toBe(expected);
  });
});
