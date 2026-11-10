export const PLACE_KINDS = [
  "country",
  "province",
  "district",
  "municipality",
  "ward",
  "village",
  "locality",
  "venue",
  "other",
] as const;

export const PLACE_ALT_NAME_KINDS = ["historical", "variant", "official"] as const;

export type TPlaceKind = (typeof PLACE_KINDS)[number];
export type TPlaceAltNameKind = (typeof PLACE_ALT_NAME_KINDS)[number];
