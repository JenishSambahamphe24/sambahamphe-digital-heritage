import { describe, expect, it } from "vitest";

import { RomanizationHelper } from "./romanization.helper.js";

describe("RomanizationHelper", () => {
  it.each([
    ["सम्बाहाङ्फे", "sambahangphe"],
    ["राम", "ram"],
    ["क", "ka"],
    ["सम्बाहाङ्फे उत्थान संघ", "sambahangphe utthan sangh"],
    ["Jenish  Sambahamphe", "jenish sambahamphe"],
    ["Café", "cafe"],
    ["२०५२", "2052"],
  ])("%s → %s", (input, expected) => {
    expect(RomanizationHelper.romanize(input)).toBe(expected);
  });

  it("keeps a Limbu-script name searchable by its written form", () => {
    expect(RomanizationHelper.romanize("ᤛᤠᤔᤒᤠ")).toBe("ᤛᤠᤔᤒᤠ");
  });
});
