import type {
  IActiveConsent,
  IPrivacySubject,
  IPrivacyView,
  IPrivacyViolation,
  TViewer,
} from "./privacy.types.js";
import type { TFieldGroup, TFieldVisibility, TVisibilityLevel } from "@repo/contracts";

import { FIELD_GROUPS, VISIBILITY_LEVELS } from "@repo/contracts";

import { ADULT_AGE_YEARS, PRESUMED_DEAD_AFTER_YEARS } from "./privacy.constants.js";

type TDefaults = { visibility: TVisibilityLevel; fieldVisibility: Required<TFieldVisibility> };

const DECEASED_DEFAULTS: TDefaults = {
  visibility: "public",
  fieldVisibility: {
    names: "public",
    vital_dates: "public",
    places: "public",
    biography: "public",
    photos: "public",
    contact: "private",
    relationships: "public",
  },
};

const LIVING_DEFAULTS: TDefaults = {
  visibility: "branch",
  fieldVisibility: {
    names: "branch",
    vital_dates: "restricted",
    places: "restricted",
    biography: "restricted",
    photos: "restricted",
    contact: "private",
    relationships: "branch",
  },
};

// ADR-023: names and relationships stay within the branch; everything else private.
const MINOR_DEFAULTS: TDefaults = {
  visibility: "branch",
  fieldVisibility: {
    names: "branch",
    vital_dates: "private",
    places: "private",
    biography: "private",
    photos: "private",
    contact: "private",
    relationships: "branch",
  },
};

// The single gate for person data (schema-design §4, genealogy access policy §3).
// Deny by default: anything not provably allowed is hidden.
export class PrivacyPolicyHelper {
  static rank(level: TVisibilityLevel): number {
    return VISIBILITY_LEVELS.indexOf(level);
  }

  static presumedLiving(
    subject: Pick<IPrivacySubject, "livingStatus" | "deathDate" | "birthSortTo">,
    today: Date,
  ): boolean {
    if (subject.livingStatus === "living") {
      return true;
    }
    if (subject.livingStatus === "deceased" || subject.deathDate !== null) {
      return false;
    }
    return (
      subject.birthSortTo === null ||
      subject.birthSortTo > PrivacyPolicyHelper.yearsBefore(today, PRESUMED_DEAD_AFTER_YEARS)
    );
  }

  // Uses the latest possible birth date, so an uncertain age errs towards "minor".
  static isMinor(
    subject: Pick<IPrivacySubject, "livingStatus" | "deathDate" | "birthSortTo">,
    today: Date,
  ): boolean {
    return (
      PrivacyPolicyHelper.presumedLiving(subject, today) &&
      subject.birthSortTo !== null &&
      subject.birthSortTo > PrivacyPolicyHelper.yearsBefore(today, ADULT_AGE_YEARS)
    );
  }

  static defaults(
    subject: Pick<IPrivacySubject, "livingStatus" | "deathDate" | "birthSortTo">,
    today: Date,
  ): TDefaults {
    if (PrivacyPolicyHelper.isMinor(subject, today)) {
      return MINOR_DEFAULTS;
    }
    return PrivacyPolicyHelper.presumedLiving(subject, today) ? LIVING_DEFAULTS : DECEASED_DEFAULTS;
  }

  static viewerLevel(viewer: TViewer, group: TFieldGroup): TVisibilityLevel {
    switch (viewer.kind) {
      case "editor":
        return "private";
      case "member":
        // Branch access (Phase 3) will add "branch" here.
        return viewer.grantedGroups.has(group) ? "restricted" : "members";
      default:
        return "public";
    }
  }

  // The level a field group actually has once consent and minor rules apply.
  static effectiveLevel(
    subject: IPrivacySubject,
    group: TFieldGroup,
    consents: readonly IActiveConsent[],
    today: Date,
  ): TVisibilityLevel {
    const stored = PrivacyPolicyHelper.max(
      subject.visibility,
      subject.fieldVisibility[group] ?? subject.visibility,
    );
    if (!PrivacyPolicyHelper.presumedLiving(subject, today)) {
      return stored;
    }
    const floor = PrivacyPolicyHelper.defaults(subject, today).fieldVisibility[group];
    if (PrivacyPolicyHelper.isMinor(subject, today)) {
      return PrivacyPolicyHelper.max(stored, floor);
    }
    // A living adult's field may be more open than the default only with consent.
    return PrivacyPolicyHelper.rank(stored) >= PrivacyPolicyHelper.rank(floor) ||
      PrivacyPolicyHelper.consented(consents, group, stored)
      ? stored
      : floor;
  }

  static view(
    subject: IPrivacySubject,
    consents: readonly IActiveConsent[],
    viewer: TViewer,
    today: Date,
  ): IPrivacyView {
    const groups = new Set<TFieldGroup>();
    for (const group of FIELD_GROUPS) {
      const level = PrivacyPolicyHelper.effectiveLevel(subject, group, consents, today);
      if (
        PrivacyPolicyHelper.rank(PrivacyPolicyHelper.viewerLevel(viewer, group)) >=
        PrivacyPolicyHelper.rank(level)
      ) {
        groups.add(group);
      }
    }
    // A record whose names are hidden is not shown at all (404, never "exists but hidden").
    return { visible: groups.has("names"), groups };
  }

  // Checked before saving, so an editor gets a clear error instead of a silent clamp.
  static violations(
    subject: IPrivacySubject,
    consents: readonly IActiveConsent[],
    today: Date,
  ): IPrivacyViolation[] {
    if (!PrivacyPolicyHelper.presumedLiving(subject, today)) {
      return [];
    }
    const minor = PrivacyPolicyHelper.isMinor(subject, today);
    const floors = PrivacyPolicyHelper.defaults(subject, today);
    const violations: IPrivacyViolation[] = [];
    const check = (
      field: TFieldGroup | "visibility",
      level: TVisibilityLevel,
      floor: TVisibilityLevel,
      group: TFieldGroup,
    ) => {
      if (PrivacyPolicyHelper.rank(level) >= PrivacyPolicyHelper.rank(floor)) {
        return;
      }
      if (minor) {
        violations.push({ field, code: "minor_not_public" });
      } else if (!PrivacyPolicyHelper.consented(consents, group, level)) {
        violations.push({ field, code: "consent_required" });
      }
    };
    check("visibility", subject.visibility, floors.visibility, "names");
    for (const group of FIELD_GROUPS) {
      const level = subject.fieldVisibility[group];
      if (level) {
        check(group, level, floors.fieldVisibility[group], group);
      }
    }
    return violations;
  }

  private static consented(
    consents: readonly IActiveConsent[],
    group: TFieldGroup,
    level: TVisibilityLevel,
  ): boolean {
    return consents.some(
      (consent) =>
        consent.fieldGroups.includes(group) &&
        PrivacyPolicyHelper.rank(consent.visibility) <= PrivacyPolicyHelper.rank(level),
    );
  }

  private static max(a: TVisibilityLevel, b: TVisibilityLevel): TVisibilityLevel {
    return PrivacyPolicyHelper.rank(a) >= PrivacyPolicyHelper.rank(b) ? a : b;
  }

  private static yearsBefore(today: Date, years: number): string {
    const date = new Date(
      Date.UTC(today.getUTCFullYear() - years, today.getUTCMonth(), today.getUTCDate()),
    );
    return date.toISOString().slice(0, 10);
  }
}
