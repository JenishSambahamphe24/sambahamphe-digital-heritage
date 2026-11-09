-- Extensions the schema relies on (docs/database/schema-design.md §1).
-- citext: case-insensitive emails. pg_trgm + unaccent: fuzzy name search.
-- btree_gist: exclusion constraints on board appointments and terms.
CREATE EXTENSION IF NOT EXISTS citext;--> statement-breakpoint
CREATE EXTENSION IF NOT EXISTS pg_trgm;--> statement-breakpoint
CREATE EXTENSION IF NOT EXISTS unaccent;--> statement-breakpoint
CREATE EXTENSION IF NOT EXISTS btree_gist;
