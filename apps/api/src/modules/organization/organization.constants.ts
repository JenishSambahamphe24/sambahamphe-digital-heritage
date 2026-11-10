// Board dates ("today", "the current term") are Nepal dates, not UTC: at
// 00:00–05:45 in Nepal the UTC date is still the day before.
export const ORG_TIMEZONE = "Asia/Kathmandu";
// Central › regional › gaau › sub-committee, with room to spare; guards recursion.
export const ORG_UNIT_MAX_DEPTH = 10;

export const ORG_CONSTRAINT = {
  termsNoOverlap: "terms_no_overlap",
  exclusiveOneHolder: "appointments_exclusive_one_holder",
  noDoubleSeat: "appointments_no_double_seat",
} as const;

export const ORG_ENTITY = { unit: "org_unit" } as const;
