// Deep enough for country › province › district › municipality › ward ›
// village › locality, with room for venues; guards the recursive queries.
export const PLACE_MAX_DEPTH = 12;
// pg_trgm similarity below this is noise for short place names.
export const PLACE_SEARCH_MIN_SIMILARITY = 0.2;
