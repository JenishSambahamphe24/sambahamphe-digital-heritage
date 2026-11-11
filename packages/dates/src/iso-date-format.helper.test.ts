import { describe, expect, it } from "vitest";

import { IsoDateFormatHelper } from "./iso-date-format.helper.js";

// 2025-04-14 AD is 1 Baisakh 2082 BS; 2028-04-12 AD is in Chaitra 2084 BS.
describe("IsoDateFormatHelper", () => {
  it("formats an AD day in BS at the stored precision", () => {
    expect(IsoDateFormatHelper.format("2025-04-14", "day", "en")).toBe("1 Baisakh 2082 BS");
    expect(IsoDateFormatHelper.format("2025-04-14", "month", "en")).toBe("Baisakh 2082 BS");
    expect(IsoDateFormatHelper.format("2025-04-14", "year", "ne")).toBe("वि.सं. २०८२");
  });

  it("falls back to AD outside the BS table", () => {
    expect(IsoDateFormatHelper.format("1800-06-01", "year", "en")).toBe("1800 AD");
  });

  it("gives a term's span in BS years", () => {
    expect(IsoDateFormatHelper.yearRange("2025-04-14", "2028-04-12", "en")).toBe("2082–2084 BS");
    expect(IsoDateFormatHelper.yearRange("2025-04-14", null, "en")).toBe("2082 BS");
    expect(IsoDateFormatHelper.yearRange("2025-04-14", "2028-04-12", "ne")).toBe(
      "वि.सं. २०८२–२०८४",
    );
  });
});
