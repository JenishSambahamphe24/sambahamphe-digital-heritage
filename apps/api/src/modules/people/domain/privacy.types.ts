import type {
  TFieldGroup,
  TFieldVisibility,
  TLivingStatus,
  TVisibilityLevel,
} from "@repo/contracts";
import type { TFuzzyDate } from "@repo/dates";

export interface IPrivacySubject {
  livingStatus: TLivingStatus;
  deathDate: TFuzzyDate | null;
  // Latest possible birth (normalized Gregorian, YYYY-MM-DD), or null.
  birthSortTo: string | null;
  visibility: TVisibilityLevel;
  fieldVisibility: TFieldVisibility;
}

export interface IActiveConsent {
  visibility: TVisibilityLevel;
  fieldGroups: readonly TFieldGroup[];
}

// No viewer (a script, job or export) is "anonymous": the most restrictive view.
export type TViewer =
  | { kind: "anonymous" }
  | { kind: "member"; grantedGroups: ReadonlySet<TFieldGroup> }
  | { kind: "editor" };

export interface IPrivacyView {
  visible: boolean;
  groups: ReadonlySet<TFieldGroup>;
}

export interface IPrivacyViolation {
  field: TFieldGroup | "visibility";
  code: "consent_required" | "minor_not_public";
}
