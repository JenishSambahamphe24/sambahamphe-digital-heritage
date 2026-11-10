import type { TPersonFields } from "@repo/contracts";

import { describe, expect, it } from "vitest";

import { PersonRulesHelper } from "./person-rules.helper.js";

const base: TPersonFields = {
  lineageRole: "lineage",
  isFoundingAncestor: false,
  gender: "male",
  livingStatus: "deceased",
  names: [{ nameType: "birth", fullName: "Test", isPrimary: true }],
};

describe("PersonRulesHelper", () => {
  it.each([
    { name: "valid deceased lineage male", fields: base, codes: [] },
    {
      name: "lineage without gender",
      fields: { ...base, gender: "unknown" },
      codes: ["lineage_gender_required"],
    },
    {
      name: "spouse without gender is fine",
      fields: { ...base, lineageRole: "spouse", gender: null },
      codes: [],
    },
    {
      name: "female founder",
      fields: { ...base, gender: "female", isFoundingAncestor: true },
      codes: ["founder_must_be_lineage_male"],
    },
    {
      name: "living without birth year",
      fields: { ...base, livingStatus: "living" },
      codes: ["birth_year_required"],
    },
    {
      name: "living with a death date",
      fields: {
        ...base,
        livingStatus: "living",
        birthDate: { calendar: "AD", qualifier: "exact", year: 1980 },
        deathDate: { calendar: "AD", qualifier: "exact", year: 2000 },
      },
      codes: ["living_has_no_death_date"],
    },
    {
      name: "death before birth (BS and AD mixed)",
      fields: {
        ...base,
        birthDate: { calendar: "BS", qualifier: "exact", year: 2040 },
        deathDate: { calendar: "AD", qualifier: "exact", year: 1950 },
      },
      codes: ["death_before_birth"],
    },
  ] as const)("$name", ({ fields, codes }) => {
    expect(PersonRulesHelper.check(fields as TPersonFields).map((error) => error.code)).toEqual(
      codes,
    );
  });
});
