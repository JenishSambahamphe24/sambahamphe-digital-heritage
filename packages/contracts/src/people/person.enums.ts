export const LINEAGE_ROLES = ["lineage", "spouse"] as const;
export const GENDERS = ["female", "male", "other", "unknown"] as const;
export const LIVING_STATUSES = ["living", "deceased", "unknown"] as const;
export const VISIBILITY_LEVELS = ["public", "members", "branch", "restricted", "private"] as const;
export const VERIFICATION_STATUSES = ["unverified", "verified", "disputed"] as const;
export const PERSON_RECORD_STATUSES = ["active", "merged", "retracted"] as const;
export const NAME_TYPES = [
  "birth",
  "given",
  "married",
  "alias",
  "ritual",
  "nickname",
  "honorific",
  "other",
] as const;
export const CONSENT_RELATIONS = ["self", "parent_guardian", "next_of_kin", "estate"] as const;
export const FIELD_GROUPS = [
  "names",
  "vital_dates",
  "places",
  "biography",
  "photos",
  "contact",
  "relationships",
] as const;

export type TLineageRole = (typeof LINEAGE_ROLES)[number];
export type TGender = (typeof GENDERS)[number];
export type TLivingStatus = (typeof LIVING_STATUSES)[number];
export type TVisibilityLevel = (typeof VISIBILITY_LEVELS)[number];
export type TVerificationStatus = (typeof VERIFICATION_STATUSES)[number];
export type TPersonRecordStatus = (typeof PERSON_RECORD_STATUSES)[number];
export type TNameType = (typeof NAME_TYPES)[number];
export type TConsentRelation = (typeof CONSENT_RELATIONS)[number];
export type TFieldGroup = (typeof FIELD_GROUPS)[number];
