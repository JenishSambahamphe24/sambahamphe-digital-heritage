export const ORG_UNIT_STATUSES = ["active", "dissolved", "merged"] as const;
export const DATE_PRECISIONS = ["day", "month", "year"] as const;
export const APPOINTMENT_TYPES = [
  "elected",
  "nominated",
  "co_opted",
  "acting",
  "ex_officio",
  "honorary",
] as const;
export const APPOINTMENT_END_REASONS = [
  "term_ended",
  "resigned",
  "removed",
  "deceased",
  "replaced",
  "other",
] as const;
export const ASSERTION_STATUSES = [
  "accepted",
  "disputed",
  "superseded",
  "rejected",
  "retracted",
] as const;

export type TOrgUnitStatus = (typeof ORG_UNIT_STATUSES)[number];
export type TDatePrecision = (typeof DATE_PRECISIONS)[number];
export type TAppointmentType = (typeof APPOINTMENT_TYPES)[number];
export type TAppointmentEndReason = (typeof APPOINTMENT_END_REASONS)[number];
export type TAssertionStatus = (typeof ASSERTION_STATUSES)[number];
