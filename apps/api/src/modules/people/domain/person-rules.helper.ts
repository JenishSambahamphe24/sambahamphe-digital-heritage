import type { IProblemFieldError } from "../../../core/errors/problem-details.types.js";
import type { TPersonFields } from "@repo/contracts";

import { FuzzyDateHelper } from "@repo/dates";

// Facts that must hold before a person is saved; the database checks repeat
// the structural ones, these give the editor a field-level message first.
export class PersonRulesHelper {
  static check(fields: TPersonFields): IProblemFieldError[] {
    const errors: IProblemFieldError[] = [];
    const fail = (path: string, code: string, message: string) =>
      errors.push({ path: [path], code, message });

    // ADR-020: a lineage member's gender decides whether the line continues.
    if (
      fields.lineageRole === "lineage" &&
      fields.gender !== "male" &&
      fields.gender !== "female"
    ) {
      fail("gender", "lineage_gender_required", "Choose male or female for a member of the line.");
    }
    if (
      fields.isFoundingAncestor &&
      (fields.lineageRole !== "lineage" || fields.gender !== "male")
    ) {
      fail(
        "isFoundingAncestor",
        "founder_must_be_lineage_male",
        "A founding ancestor is a male member of the line.",
      );
    }
    if (fields.livingStatus === "living" && fields.deathDate) {
      fail("deathDate", "living_has_no_death_date", "A living person has no date of death.");
    }
    // ADR-023: minor status must be decidable for anyone living.
    if (fields.livingStatus === "living" && !fields.birthDate) {
      fail(
        "birthDate",
        "birth_year_required",
        "Give at least an approximate birth year for a living person.",
      );
    }
    if (fields.birthDate && fields.deathDate) {
      const birth = FuzzyDateHelper.normalize(fields.birthDate);
      const death = FuzzyDateHelper.normalize(fields.deathDate);
      if (death.to < birth.from) {
        fail("deathDate", "death_before_birth", "The date of death is before the date of birth.");
      }
    }
    return errors;
  }
}
