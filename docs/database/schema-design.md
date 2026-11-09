# Database Schema Design

Status: **Draft for review** (Phase 0) · PostgreSQL 17 · Last updated: 2026-11-07

This is the initial logical design. It is written as PostgreSQL DDL-style pseudocode because several integrity rules (exclusion constraints, partial indexes, checks) cannot be expressed in Drizzle's schema builder and must live in custom migration SQL (ADR-003). The Drizzle schema will be derived from this document in Phase 1 and the document kept in sync.

Diagrams: [erd.md](erd.md).

---

## 1. Conventions

| Topic | Convention |
|---|---|
| Naming | `snake_case` tables (plural) and columns; Drizzle schema uses camelCase property names mapped to snake_case columns (`createdAt: timestamp("created_at", …)`) |
| Primary keys | `id uuid` UUIDv7, generated in application (ADR-010). Exception: `audit_log.id bigint identity` (append-only ordering) |
| Timestamps | `created_at timestamptz not null default now()`, `updated_at timestamptz not null` on mutable tables |
| Actors | `created_by uuid → users`, `updated_by uuid → users` (nullable for imports/system) |
| Optimistic concurrency | `version int not null default 1` on records edited concurrently (persons, relationships, content, events, org records). Updates use `WHERE id = $1 AND version = $2`; 0 rows → `409 Conflict` |
| Soft delete | `deleted_at timestamptz` for content/media/events; genealogy uses status (`retracted`, `merged`) instead (ADR-017) |
| Enums | Postgres enums for stable vocabularies; lookup tables for anything the organization should configure |
| Text | `text` everywhere, length enforced in Zod; `citext` for emails |
| Extensions | `citext`, `pg_trgm`, `unaccent`, `btree_gist` (exclusion constraints) |
| Localized labels | Small taxonomy/reference data (category names, position titles, unit names) use `name_i18n jsonb` shaped `{"en": "...", "ne": "..."}` validated by Zod. Long-form content uses `*_translations` rows (ADR-015) |

### 1.1 Fuzzy date type (ADR-011)

Used wherever a historical date may be approximate. Stored as three columns per date (`<x>_date`, `<x>_sort_from`, `<x>_sort_to`):

```sql
-- <x>_date jsonb  (validated by packages/contracts FuzzyDate schema)
-- {
--   "calendar": "BS" | "AD",
--   "qualifier": "exact" | "about" | "before" | "after" | "between" | "calculated",
--   "year": 2010, "month": 4, "day": 12,          -- month/day optional
--   "end": { "year": 2015 },                      -- only for "between"
--   "text": "around the time of the 1990 movement" -- optional original wording
-- }
-- <x>_sort_from date, <x>_sort_to date            -- normalized Gregorian bounds
-- CHECK (<x>_sort_from <= <x>_sort_to)
```

`before`/`after` use a 25-year window for bounds (configurable in `packages/dates`). Sort/filter queries use the normalized columns only.

---

## 2. Identity & access

```sql
create table users (
  id                    uuid primary key,
  email                 citext unique,              -- email and/or phone (ADR-024)
  email_verified_at     timestamptz,
  phone                 text unique,                -- E.164, e.g. +9779812345678
  phone_verified_at     timestamptz,
  password_hash         text,                       -- null for OAuth-only accounts (later)
  display_name          text not null,
  preferred_locale      text not null default 'en',
  status                user_status not null default 'active',     -- active | suspended | deleted
  -- "verified family member" is derived from approved rows in branch_access (ADR-021), not stored here
  last_login_at         timestamptz,
  created_at, updated_at,
  check (num_nonnulls(email, phone) >= 1)
  -- the link to a family-tree person lives in user_person_links (ADR-022), never on this table
);

create table auth_sessions (                       -- server-side sessions (ADR-006)
  id                  uuid primary key,
  user_id             uuid not null references users,
  token_hash          text not null unique,         -- sha-256 of the 256-bit session token
  client              auth_client not null,         -- web | admin | mobile
  user_agent          text,
  ip_hash             text,
  last_seen_at        timestamptz not null,
  idle_expires_at     timestamptz not null,         -- slides with use
  absolute_expires_at timestamptz not null,         -- hard cap, never extended
  revoked_at          timestamptz,
  revoked_reason      text,                         -- logout | logout_all | password_reset | admin
  created_at
);
create index on auth_sessions (user_id) where revoked_at is null;

create table one_time_tokens (
  id          uuid primary key,
  user_id     uuid not null references users,
  purpose     token_purpose not null,   -- email_verification | phone_verification | password_reset | invitation
  token_hash  text not null unique,     -- SMS codes: hash of (code + user id) — 6 digits are too few to be unique alone
  attempts    int not null default 0,   -- SMS codes: max 5
  expires_at  timestamptz not null,
  used_at     timestamptz,
  created_at
);

create table permissions (
  key          text primary key,       -- 'person:update', 'change_request:review', ...
  description  text not null
);

create table roles (
  id          uuid primary key,
  key         text not null unique,    -- 'super_admin', 'genealogy_editor', ...
  name        text not null,
  description text,
  is_system   boolean not null default false,   -- system roles cannot be deleted
  created_at, updated_at
);

create table role_permissions (
  role_id        uuid references roles on delete cascade,
  permission_key text references permissions,
  primary key (role_id, permission_key)
);

create table role_assignments (
  id           uuid primary key,
  user_id      uuid not null references users,
  role_id      uuid not null references roles,
  scope_type   scope_type not null,          -- global | org_unit | branch
  org_unit_id  uuid references org_units,    -- scope includes descendants
  branch_id    uuid references family_branches,
  granted_by   uuid references users,
  granted_at   timestamptz not null default now(),
  expires_at   timestamptz,
  revoked_at   timestamptz,
  revoked_by   uuid references users,
  check ( (scope_type = 'global'   and org_unit_id is null and branch_id is null)
       or (scope_type = 'org_unit' and org_unit_id is not null and branch_id is null)
       or (scope_type = 'branch'   and branch_id is not null and org_unit_id is null) )
);
create unique index on role_assignments (user_id, role_id, scope_type, coalesce(org_unit_id, branch_id))
  where revoked_at is null;
```

Seeded system roles: `super_admin`, `admin`, `content_editor`, `contributor`, `genealogy_editor` (reviews and approves; may be branch-scoped), `org_manager`, `media_manager`.

Not roles: a **registered member** is any active user with a verified email (may submit change requests); a **verified family member** is a user with approved `branch_access` (ADR-021).

---

## 3. Places

Shared by people, events, media, org units. Supports hierarchy and historical names (e.g., VDC → municipality renames after 2017).

```sql
create table places (
  id          uuid primary key,
  parent_id   uuid references places,
  kind        place_kind not null,   -- country | province | district | municipality | ward | village | locality | venue | other
  name_i18n   jsonb not null,        -- current names per locale/script
  latitude    numeric(9,6),
  longitude   numeric(9,6),
  notes       text,
  created_at, updated_at, created_by, updated_by
);
create index on places (parent_id);

create table place_alt_names (       -- historical & variant names, searchable
  id          uuid primary key,
  place_id    uuid not null references places,
  name        text not null,
  language    text,                  -- BCP-47, e.g. 'ne', 'lif' (Limbu), 'en'
  script      text,                  -- ISO 15924: 'Deva', 'Limb', 'Latn'
  kind        text not null default 'variant',  -- historical | variant | official
  valid_from_year int, valid_to_year int
);
create index on place_alt_names using gin (name gin_trgm_ops);
```

---

## 4. People (shared Person core)

```sql
create table clans (                 -- Sambahamphe, Nembang, Lawati, Sherma, ...
  id          uuid primary key,
  slug        text not null unique,
  name_i18n   jsonb not null,
  community   text not null default 'Limbu',
  notes       text,
  created_at, updated_at
);

create table persons (
  id                    uuid primary key,
  record_status         person_record_status not null default 'active',  -- active | merged | retracted
  merged_into_id        uuid references persons,       -- set when record_status = 'merged'
  lineage_role          lineage_role not null,         -- lineage | spouse  (ADR-020)
  is_founding_ancestor  boolean not null default false, -- several founders; each heads a top-level branch
  gender                gender,                        -- female | male | other | unknown; nullable = not provided
  gender_note           text,
  living_status         living_status not null default 'unknown',  -- living | deceased | unknown

  birth_date jsonb, birth_sort_from date, birth_sort_to date,
  death_date jsonb, death_sort_from date, death_sort_to date,
  birth_place_id        uuid references places,
  death_place_id        uuid references places,
  birth_clan_id         uuid references clans,         -- attribute only; never implies ancestry

  biography             jsonb,                         -- Tiptap JSON (default locale; translations below)
  occupation            text,
  internal_notes        text,                          -- editors only, never public
  profile_media_id      uuid references media_assets,

  visibility            visibility_level not null default 'restricted',
  field_visibility      jsonb not null default '{}',   -- {"vital_dates":"members","places":"restricted",...}
  verification_status   verification_status not null default 'unverified', -- unverified | verified | disputed
  verified_by           uuid references users,
  verified_at           timestamptz,

  version               int not null default 1,
  created_at, updated_at, created_by, updated_by,

  check (record_status <> 'merged' or merged_into_id is not null),
  check (merged_into_id is null or merged_into_id <> id),
  check (birth_sort_from is null or birth_sort_from <= birth_sort_to),
  check (death_sort_from is null or death_sort_from <= death_sort_to),
  check (living_status <> 'living' or death_date is null),
  check (lineage_role <> 'lineage' or gender in ('male', 'female')),  -- decides whether the line continues
  check (not is_founding_ancestor or (lineage_role = 'lineage' and gender = 'male'))
);
create index on persons (lineage_role);
create index on persons (birth_sort_from);
create index on persons (birth_clan_id);
create index on persons (merged_into_id) where merged_into_id is not null;

create table person_names (
  id           uuid primary key,
  person_id    uuid not null references persons,
  name_type    name_type not null,   -- birth | given | married | alias | ritual | nickname | honorific | other
  given_name   text,
  surname      text,                 -- free text: surname spelling varies; not a lineage key
  full_name    text not null,        -- as written
  language     text,                 -- 'ne', 'lif', 'en'
  script       text,                 -- 'Deva', 'Limb', 'Latn'
  romanized    text not null,        -- normalized Latin transliteration, lowercase, unaccented (search)
  is_primary   boolean not null default false,
  sort_order   int not null default 0,
  created_at, updated_at
);
create unique index on person_names (person_id) where is_primary;   -- exactly ≤1 primary name
create index on person_names using gin (romanized gin_trgm_ops);
create index on person_names using gin (full_name gin_trgm_ops);

create table person_translations (     -- biography in other locales
  person_id  uuid references persons,
  locale     text,
  biography  jsonb,
  primary key (person_id, locale)
);

create table person_places (           -- residences, ancestral home, migrations
  id          uuid primary key,
  person_id   uuid not null references persons,
  place_id    uuid not null references places,
  kind        person_place_kind not null,  -- residence | ancestral_home | migration | workplace | burial
  from_date jsonb, from_sort date,
  to_date   jsonb, to_sort   date,
  is_current  boolean not null default false,
  notes       text
);

create table person_media (            -- photos/documents about a person (besides photo tags)
  person_id  uuid references persons,
  media_id   uuid references media_assets,
  role       text not null default 'gallery',   -- profile | gallery | document
  sort_order int not null default 0,
  primary key (person_id, media_id)
);

create table person_consents (
  id                 uuid primary key,
  person_id          uuid not null references persons,
  granted_by_user_id uuid references users,
  granted_by_name    text not null,         -- name of consenting individual
  relation_to_subject consent_relation not null,  -- self | parent_guardian | next_of_kin | estate
  scope              jsonb not null,        -- {"visibility":"public","field_groups":["names","photos"]}
  evidence_media_id  uuid references media_assets,
  granted_at         timestamptz not null,
  revoked_at         timestamptz,
  recorded_by        uuid not null references users,
  notes              text
);

create table person_access_grants (     -- named access to restricted persons
  id           uuid primary key,
  person_id    uuid not null references persons,
  user_id      uuid not null references users,
  field_groups text[] not null,
  granted_by   uuid not null references users,
  expires_at   timestamptz,
  revoked_at   timestamptz,
  created_at
);
```

```sql
create table user_person_links (       -- identity claims: "this account is this person" (ADR-022)
  id                 uuid primary key,
  user_id            uuid not null references users,
  person_id          uuid references persons,      -- null while the claim is anchored to an ancestor only
  anchor_person_id   uuid references persons,      -- "I am a grandson of …" when no match was found
  status             link_status not null default 'requested',  -- requested | approved | rejected | revoked
  claim_statement    text not null,
  evidence_media_id  uuid references media_assets,
  requested_at       timestamptz not null default now(),
  decided_by         uuid references users,
  decided_at         timestamptz,
  decision_note      text,
  revoked_at         timestamptz,
  check (num_nonnulls(person_id, anchor_person_id) >= 1),
  check (status <> 'approved' or person_id is not null)
);
create unique index on user_person_links (user_id)   where status = 'approved';  -- one person per account
create unique index on user_person_links (person_id) where status = 'approved';  -- one account per person
create index on user_person_links (status, requested_at);
```

**Why no `father_name` / `mother_name` columns.** The brief lists them as profile fields, but storing parents as text duplicates and eventually contradicts the relationship graph. When only a parent's *name* is known, the editor creates a minimal Person (name only, `verification_status = unverified`) and links it. Later, if that parent is identified as an existing record, the two are **merged**. The profile UI still shows "Father: …" — derived from relationships.

**Field groups** used by `field_visibility`, consents and grants: `names`, `vital_dates`, `places`, `biography`, `photos`, `contact`, `relationships`.

**Presumed-living rule** (SQL function, mirrored in `people/domain/privacy.ts`):

```sql
create function person_presumed_living(p persons) returns boolean language sql stable as $$
  select case p.living_status
    when 'living'   then true
    when 'deceased' then false
    else p.death_date is null
         and (p.birth_sort_to is null or p.birth_sort_to > current_date - interval '110 years')
  end
$$;
```

Unknown with no dates ⇒ presumed living (deny-by-default).

**Default visibility on approval** (set by the service, changeable by editors and by the person's own privacy settings):

| Person | `visibility` | `field_visibility` defaults |
|---|---|---|
| Deceased (or presumed deceased) | `public` | all groups `public` except `contact` (`private`) |
| **Minor** (presumed living, born < 18 years ago — ADR-023) | `branch` | `names`, `relationships` → `branch`; everything else `private`; no profile photo; cannot be raised to `public` before 18 |
| Presumed living | `branch` | `names`, `relationships` → `branch`; `vital_dates`, `places`, `biography`, `photos` → `restricted`; `contact` → `private` |

Raising a living person's field group to `public` requires an active `person_consents` row covering it. A submitter cannot grant it on the subject's behalf unless they *are* the subject or a recorded guardian.

**Who sees a field** = the viewer's highest applicable level is ≥ the field's level, where: anonymous / registered member → `public`; approved `branch_access` covering one of the person's branches → `branch`; an active `person_access_grants` row for that field → `restricted`; genealogy editor (in scope) → `private`.

---

## 5. Genealogy

```sql
create table unions (                       -- marriage / partnership; any number per person
  id           uuid primary key,
  kind         union_kind not null default 'marriage',  -- marriage | partnership | unknown
  start_date jsonb, start_sort_from date, start_sort_to date,
  end_date   jsonb, end_sort_from   date, end_sort_to   date,
  end_reason   union_end_reason,             -- divorce | separation | death | annulment | unknown
  place_id     uuid references places,
  status       assertion_status not null default 'accepted',  -- accepted | disputed | superseded | rejected | retracted
  confidence   confidence not null default 'probable',        -- certain | probable | possible | speculative
  notes        text,
  version      int not null default 1,
  created_at, updated_at, created_by, updated_by
);

create table union_partners (
  union_id          uuid not null references unions,
  person_id         uuid not null references persons,
  sequence_for_person int,                    -- this person's 1st, 2nd... union (display order)
  primary key (union_id, person_id)
);
create index on union_partners (person_id);
-- service rule: exactly 2 partners per union (allowing 1 temporarily while the other is unknown)

create table parent_child (
  id           uuid primary key,
  parent_id    uuid not null references persons,
  child_id     uuid not null references persons,
  kind         parent_kind not null,         -- biological | adoptive | step | foster | guardian | unknown
  union_id     uuid references unions,       -- optional: the union this child belongs to
  status       assertion_status not null default 'accepted',
  confidence   confidence not null default 'probable',
  notes        text,
  version      int not null default 1,
  created_at, updated_at, created_by, updated_by,
  check (parent_id <> child_id)
);
create unique index on parent_child (parent_id, child_id, kind)
  where status in ('accepted', 'disputed');
create index on parent_child (child_id)  where status in ('accepted', 'disputed');
create index on parent_child (parent_id) where status in ('accepted', 'disputed');
```

**Rules enforced in the genealogy service (inside the transaction, under `pg_advisory_xact_lock(<genealogy graph key>)`):**

1. **No cycles:** adding `parent_id → child_id` is rejected if `child_id` is an ancestor of `parent_id` (recursive CTE, statuses `accepted`/`disputed`).
2. **Male line (ADR-020):** a child may only be added with a father whose `lineage_role = 'lineage'` and `gender = 'male'`; the child gets `lineage_role = 'lineage'`. No children under daughters or spouses. Adopted sons (`kind = 'adoptive'`) are lineage members and continue the line. Mother edges may come only from a partner of that father (`spouse` role). Unions only join a lineage man with a `spouse`; **no unions are recorded for daughters**.
3. **Exactly one `accepted` father** per lineage person (founding ancestors, `is_founding_ancestor = true`, have none — a lineage person with no father who is not a founder is listed in the "father missing" data-quality report); at most one `accepted` mother. Further claims can only be `disputed` — that is how competing claims coexist.
4. If `union_id` is set, `parent_id` must be a partner in that union.
5. **Living people and minors (ADR-023):** a person presumed living needs at least an approximate birth year. A minor can only be added by an editor, or by a user whose approved linked person is the minor's parent or guardian.
6. Plausibility warnings (not errors): parent born after child, parent < 12 years older than child, child born > 1 year after a parent's death. Warnings are shown to reviewers.

**Disputes and corrections.** Competing claims are separate `parent_child` rows with `status = 'disputed'`, each with citations. A reviewer resolves by marking one `accepted` and the others `rejected`. When an approved relationship is *corrected* (e.g., a different father proven), the old row becomes `superseded` and the new one `accepted`. Both go through a change request whose decision note records the rationale. Nothing is deleted.

**Status vocabulary.** Review states (pending, under review, needs correction, approved, rejected) belong to the **submission** (`change_requests`). Proposed relationships do not appear in the tree tables until approved, so the public tree can never show pending data. Once approved, a relationship row's own status is `accepted`, `disputed`, `superseded`, `rejected` or `retracted`.

**Merges.** `merge_persons(survivor, duplicate)` re-points the duplicate's names, relationships, places, media, appointments and citations to the survivor (de-duplicating identical edges), sets the duplicate's `record_status = 'merged'`, `merged_into_id = survivor`. All of it is one change-request operation with a full snapshot in `entity_revisions`, so it can be reversed. The API redirects (`301`-like `redirect` field) when a merged ID is requested.

### 5.1 Branches

```sql
create table family_branches (
  id                uuid primary key,
  parent_branch_id  uuid references family_branches,
  slug              text not null unique,
  name_i18n         jsonb not null,
  founder_person_id uuid references persons,     -- optional anchor ancestor
  origin_place_id   uuid references places,
  description       jsonb,                       -- Tiptap JSON
  visibility        visibility_level not null default 'public',
  version           int not null default 1,
  created_at, updated_at, created_by, updated_by
);

create table person_branches (
  person_id   uuid references persons,
  branch_id   uuid references family_branches,
  basis       branch_basis not null,   -- descent | marriage | adoption | assigned
  is_primary  boolean not null default false,
  primary key (person_id, branch_id)
);
create unique index on person_branches (person_id) where is_primary;
```

Branch membership is stored explicitly. On approval, a new lineage child **inherits its father's primary branch**, and a spouse gets the husband's branch with `basis = 'marriage'`. Editors can override this, because historical branch identity does not always follow strict descent. Storing membership also keeps privacy checks fast, since they run on every read.

```sql
create table branch_access (          -- policy "BranchMembership": user ↔ branch they may see (ADR-021)
  id                 uuid primary key,
  user_id            uuid not null references users,
  branch_id          uuid not null references family_branches,   -- covers sub-branches
  status             branch_access_status not null default 'requested',
                       -- requested | approved | rejected | revoked
  relation_statement text not null,          -- "I am the grandson of …"
  vouching_person_id uuid references persons, -- optional known relative who can confirm
  evidence_media_id  uuid references media_assets,
  requested_at       timestamptz not null default now(),
  decided_by         uuid references users,
  decided_at         timestamptz,
  decision_note      text,
  expires_at         timestamptz,
  revoked_at         timestamptz,
  revoked_by         uuid references users
);
create unique index on branch_access (user_id, branch_id) where status in ('requested', 'approved');
create index on branch_access (branch_id, status);
```

### 5.2 Sources & citations

```sql
create table sources (
  id               uuid primary key,
  kind             source_kind not null,  -- document | book | vamshawali | oral_testimony | certificate | gravestone | photograph | website | other
  title            text not null,
  author           text,
  publication      text,
  source_date jsonb, source_sort date,
  repository       text,                  -- where the original is held
  informant_person_id uuid references persons,  -- for oral testimony
  media_id         uuid references media_assets,  -- scan / recording
  url              text,
  visibility       visibility_level not null default 'members',
  notes            text,
  created_at, updated_at, created_by, updated_by
);

create table citations (
  id               uuid primary key,
  source_id        uuid not null references sources,
  person_id        uuid references persons,
  parent_child_id  uuid references parent_child,
  union_id         uuid references unions,
  field            text,                  -- e.g. 'birth_date', null = whole record
  locator          text,                  -- page, timestamp, folio
  quote            text,
  confidence       confidence,
  created_at, created_by,
  check (num_nonnulls(person_id, parent_child_id, union_id) = 1)
);
```

### 5.3 Core genealogy queries (recursive CTEs)

```sql
-- genealogy repository, via Drizzle's sql`` template — ancestors of $1 up to depth $2
with recursive anc(person_id, depth, path) as (
  select pc.parent_id, 1, array[$1::uuid, pc.parent_id]
  from parent_child pc
  where pc.child_id = $1 and pc.status in ('accepted','disputed')
  union all
  select pc.parent_id, a.depth + 1, a.path || pc.parent_id
  from anc a
  join parent_child pc on pc.child_id = a.person_id and pc.status in ('accepted','disputed')
  where a.depth < $2 and not pc.parent_id = any(a.path)      -- defensive cycle guard
)
select person_id, min(depth) as depth from anc group by person_id;
```

Descendants are symmetric. Tree endpoints return a *neighborhood* (nodes + edges + `hasMoreUp/hasMoreDown` flags per frontier node) that the client merges into its graph as the user expands.

---

## 6. Contributions (change requests) & revisions

```sql
create table change_requests (
  id               uuid primary key,
  domain           cr_domain not null,        -- genealogy (content, media later)
  title            text not null,
  rationale        text,                      -- submitter's explanation / evidence summary
  status           cr_status not null default 'pending',
    -- pending | under_review | needs_correction | approved | rejected | withdrawn
  auto_approved    boolean not null default false,
  submitted_by     uuid not null references users,
  submitted_at     timestamptz not null default now(),
  reviewer_id      uuid references users,
  decided_by       uuid references users,
  decided_at       timestamptz,
  decision_note    text,
  version          int not null default 1,
  created_at, updated_at,
  check ((status in ('approved','rejected')) = (decided_at is not null))
);
create index on change_requests (status, submitted_at);
create index on change_requests (submitted_by);

create table change_request_operations (
  id                 uuid primary key,
  change_request_id  uuid not null references change_requests on delete cascade,
  seq                int not null,
  op_type            text not null,        -- create_person | update_person | add_name | add_parent_child |
                                           -- add_union | add_union_partner | set_assertion_status |
                                           -- add_citation | assign_branch | merge_persons | ...
  payload            jsonb not null,       -- Zod-validated per op_type
  payload_version    int not null default 1,
  temp_ref           text,                 -- client temp id for entities created in this request
  target_type        text,                 -- entity type for update ops
  target_id          uuid,
  base_version       int,                  -- version the submitter saw (conflict detection)
  apply_status       cr_apply_status not null default 'pending',  -- pending | applied | conflict | skipped
  result_entity_id   uuid,                 -- id created/updated when applied
  unique (change_request_id, seq)
);
create index on change_request_operations (target_type, target_id);

create table change_request_comments (
  id                 uuid primary key,
  change_request_id  uuid not null references change_requests,
  operation_id       uuid references change_request_operations,
  author_id          uuid not null references users,
  body               text not null,
  created_at
);

create table entity_revisions (             -- full snapshots per version (genealogy, content, org records)
  id                 uuid primary key,
  entity_type        text not null,         -- 'person' | 'parent_child' | 'union' | 'content_item' | 'appointment' | ...
  entity_id          uuid not null,
  version            int not null,
  snapshot           jsonb not null,        -- including child rows (names, translations) for aggregates
  change_request_id  uuid references change_requests,
  actor_id           uuid references users,
  reason             text,
  created_at         timestamptz not null default now(),
  unique (entity_type, entity_id, version)
);
```

Approval applies operations in `seq` order in one transaction; temp refs are resolved as entities are created; any `conflict` aborts the whole application and returns the request to `under_review` with conflicts flagged.

---

## 7. Organization & governance

```sql
create table organizations (
  id               uuid primary key,
  slug             text not null unique,
  name_i18n        jsonb not null,            -- Sambahamphe Utthan Sangh / सम्बाहाम्फे उत्थान संघ
  short_name       text,
  founded_date jsonb, founded_sort date,
  registration_info jsonb,                    -- registration body, number, date (if public)
  description      jsonb,
  created_at, updated_at
);

create table org_unit_types (                 -- configurable levels
  id               uuid primary key,
  organization_id  uuid not null references organizations,
  key              text not null,             -- central_board | regional_board | gaau_committee | sub_committee | advisory
  name_i18n        jsonb not null,
  level_order      int not null,              -- display/sort hint, not a constraint
  unique (organization_id, key)
);

create table org_unit_type_parents (          -- which types may contain which
  type_id         uuid references org_unit_types,
  parent_type_id  uuid references org_unit_types,
  primary key (type_id, parent_type_id)
);

create table org_units (                      -- boards & committees
  id               uuid primary key,
  organization_id  uuid not null references organizations,
  type_id          uuid not null references org_unit_types,
  parent_id        uuid references org_units, -- null only for the top unit (Central Board)
  slug             text not null unique,
  name_i18n        jsonb not null,
  place_id         uuid references places,    -- region / gaau
  description      jsonb,
  established_date jsonb, established_sort date,
  dissolved_date   jsonb, dissolved_sort   date,
  status           org_unit_status not null default 'active',  -- active | dissolved | merged
  sort_order       int not null default 0,
  version          int not null default 1,
  created_at, updated_at, created_by, updated_by,
  check (parent_id is null or parent_id <> id)
);
create index on org_units (parent_id);
-- service rules: parent type allowed by org_unit_type_parents; no cycles in unit tree.

create table terms (                          -- tenure of a board/committee
  id               uuid primary key,
  org_unit_id      uuid not null references org_units,
  ordinal          int,                       -- e.g. 5th executive committee
  label_i18n       jsonb,                     -- "Fifth Central Executive Committee"
  starts_on        date not null,
  ends_on          date,                      -- null = current / open
  date_precision   date_precision not null default 'day',  -- day | month | year (historical terms)
  elected_at_event_id uuid references events, -- general assembly / convention
  notes            text,
  version          int not null default 1,
  created_at, updated_at, created_by, updated_by,
  period daterange generated always as (daterange(starts_on, ends_on, '[)')) stored,
  check (ends_on is null or ends_on > starts_on),
  unique (id, org_unit_id),                   -- target for composite FK below
  exclude using gist (org_unit_id with =, period with &&)   -- terms of one unit never overlap
);

create table position_definitions (           -- one list for the whole organization: the same on every board (Q-8)
  id               uuid primary key,
  organization_id  uuid not null references organizations,
  key              text not null,             -- chairperson | vice_chairperson | secretary | joint_secretary | treasurer | member | advisor ...
  title_i18n       jsonb not null,
  rank             int not null,              -- display order on board pages
  is_office_bearer boolean not null default false,
  max_holders      int,                       -- null = unlimited; 1 = exclusive
  active           boolean not null default true,
  created_at, updated_at,
  check (max_holders is null or max_holders >= 1)
);

create table appointments (                   -- person × unit × position over time
  id               uuid primary key,
  person_id        uuid not null references persons,
  org_unit_id      uuid not null references org_units,
  position_id      uuid not null references position_definitions,
  term_id          uuid,
  appointment_type appointment_type not null default 'elected',
    -- elected | nominated | co_opted | acting | ex_officio | honorary
  starts_on        date not null,
  ends_on          date,                      -- null = currently serving
  date_precision   date_precision not null default 'day',
  end_reason       appointment_end_reason,    -- term_ended | resigned | removed | deceased | replaced | other
  is_exclusive     boolean not null,          -- copied from position (max_holders = 1) by trigger on insert/update
  record_status    assertion_status not null default 'accepted',  -- retract mistaken entries, don't delete
  notes            text,
  version          int not null default 1,
  created_at, updated_at, created_by, updated_by,
  period daterange generated always as (daterange(starts_on, ends_on, '[)')) stored,
  foreign key (term_id, org_unit_id) references terms (id, org_unit_id),   -- term must belong to same unit
  check (ends_on is null or ends_on > starts_on),
  check (end_reason is null or ends_on is not null),   -- an end reason requires an end date

  -- one holder at a time for exclusive positions (e.g., Chairperson)
  exclude using gist (org_unit_id with =, position_id with =, period with &&)
    where (is_exclusive and record_status = 'accepted'),
  -- same person not double-appointed to the same seat
  exclude using gist (person_id with =, org_unit_id with =, position_id with =, period with &&)
    where (record_status = 'accepted')
);
create index on appointments (org_unit_id, starts_on desc);
create index on appointments (person_id);
create index on appointments using gist (period);
```

Notes:

- Positions with `max_holders > 1` (e.g., "Member", max 11) are enforced in the service with a row lock on the org unit.
- Acting/interim holders during a vacancy are separate appointments with `appointment_type = 'acting'`; an acting chair overlapping an absent chair would violate the exclusion constraint, which is intended — the absent chair's appointment should be ended or the acting holder recorded under a distinct "Acting Chairperson" position.
- Appointments use exact `date` + `date_precision` instead of fuzzy JSON because range constraints need real dates; for "sometime in 2045 BS" records, the date is the first day of the period and precision `year`.
- Historical unit restructuring (a regional board moved under another) is recorded via `entity_revisions` of the unit; the public board history shows units as they were per term. A dated parent history table can be added if the organization restructures often.

---

## 8. Content (articles, heritage, blog, announcements, pages)

```sql
create table categories (
  id          uuid primary key,
  parent_id   uuid references categories,
  slug        text not null unique,
  name_i18n   jsonb not null,
  description_i18n jsonb,
  sort_order  int not null default 0
);

create table tags (
  id     uuid primary key,
  slug   text not null unique,
  name_i18n jsonb not null
);

create table content_items (
  id                 uuid primary key,
  type               content_type not null,     -- article | heritage | blog | news | activity_report | announcement | page
  status             content_status not null default 'draft',  -- draft | in_review | scheduled | published | archived
  visibility         visibility_level not null default 'public',  -- public | members
  primary_category_id uuid references categories,
  featured_media_id  uuid references media_assets,
  default_locale     text not null default 'en',
  published_at       timestamptz,
  scheduled_for      timestamptz,
  is_pinned          boolean not null default false,   -- announcements
  expires_at         timestamptz,                     -- announcements
  event_id           uuid references events,          -- activity reports / event announcements
  version            int not null default 1,
  deleted_at         timestamptz,
  created_at, updated_at, created_by, updated_by,
  check (status <> 'scheduled' or scheduled_for is not null),
  check (status <> 'published' or published_at is not null)
);
create index on content_items (type, status, published_at desc) where deleted_at is null;

create table content_translations (
  id                  uuid primary key,
  content_id          uuid not null references content_items,
  locale              text not null,
  title               text not null,
  slug                text not null,
  excerpt             text,
  body                jsonb not null,            -- Tiptap JSON (ADR-009)
  body_schema_version int not null default 1,
  body_text           text not null default '',  -- derived plain text
  seo_title           text,
  seo_description     text,
  og_media_id         uuid references media_assets,
  search_vector       tsvector generated always as (
                        setweight(to_tsvector('simple', unaccent(title)), 'A') ||
                        setweight(to_tsvector('simple', unaccent(coalesce(excerpt,''))), 'B') ||
                        setweight(to_tsvector('simple', unaccent(body_text)), 'C')) stored,
  updated_at,
  unique (content_id, locale),
  unique (locale, slug)
);
create index on content_translations using gin (search_vector);

create table content_categories (content_id uuid references content_items, category_id uuid references categories, primary key (content_id, category_id));
create table content_tags       (content_id uuid references content_items, tag_id uuid references tags,             primary key (content_id, tag_id));

create table content_authors (
  id          uuid primary key,
  content_id  uuid not null references content_items,
  user_id     uuid references users,
  person_id   uuid references persons,      -- e.g. historical author
  display_name text not null,
  sort_order  int not null default 0
);

create table content_media_usage (          -- derived from body on save; answers "where is this file used?"
  content_id uuid references content_items,
  media_id   uuid references media_assets,
  role       text not null,                 -- featured | inline | attachment
  primary key (content_id, media_id, role)
);

create table content_links (                -- article ↔ subjects
  id          uuid primary key,
  content_id  uuid not null references content_items,
  person_id   uuid references persons,
  event_id    uuid references events,
  place_id    uuid references places,
  org_unit_id uuid references org_units,
  check (num_nonnulls(person_id, event_id, place_id, org_unit_id) = 1)
);
```

Note: `immutable` wrapper for `unaccent` is required in a generated column (`unaccent` is only `stable`); the migration defines `immutable_unaccent(text)`.

Revisions use `entity_revisions` with `entity_type = 'content_item'` and a snapshot including all translations, categories and tags.

---

## 9. Events

```sql
create table event_categories (
  id         uuid primary key,
  key        text not null unique,   -- deusi_bhailo | picnic | general_assembly | cultural_program | meeting | social_welfare | fundraising | other
  name_i18n  jsonb not null,
  sort_order int not null default 0
);

create table events (
  id                 uuid primary key,
  category_id        uuid not null references event_categories,
  starts_at          timestamptz not null,
  ends_at            timestamptz,
  all_day            boolean not null default false,
  timezone           text not null default 'Asia/Kathmandu',
  place_id           uuid references places,
  venue_text         text,
  status_override    event_status_override,          -- cancelled | postponed (null = derive from dates)
  publication_status publication_status not null default 'draft',  -- draft | published | archived
  published_at       timestamptz,
  cover_media_id     uuid references media_assets,
  visibility         visibility_level not null default 'public',
  version            int not null default 1,
  deleted_at         timestamptz,
  created_at, updated_at, created_by, updated_by,
  check (ends_at is null or ends_at >= starts_at)
);
create index on events (starts_at desc) where deleted_at is null;

create table event_translations (
  event_id    uuid references events,
  locale      text,
  title       text not null,
  slug        text not null,
  summary     text,
  description jsonb,
  body_text   text not null default '',
  seo_title text, seo_description text,
  primary key (event_id, locale),
  unique (locale, slug)
);

create table event_organizers (
  event_id    uuid references events,
  org_unit_id uuid references org_units,
  role        organizer_role not null default 'host',   -- host | co_host | supporter
  primary key (event_id, org_unit_id)
);
```

Derived lifecycle (API and a SQL view use the same rule): `cancelled/postponed` if overridden; else `upcoming` if now < starts_at; `ongoing` if now ≤ coalesce(ends_at, end of start day in event tz); else `completed`.

Phase 4 adds `event_registrations` and `event_attendance`.

---

## 10. Media & galleries

```sql
create table media_assets (
  id                uuid primary key,
  kind              media_kind not null,       -- image | video | audio | document | embed
  status            media_status not null default 'uploading',  -- uploading | processing | ready | failed | rejected
  storage_key       text unique,               -- 'originals/<uuid>' (null for embeds)
  original_filename text,
  mime_type         text,
  byte_size         bigint,
  checksum_sha256   text,
  width int, height int, duration_seconds numeric, page_count int,
  blur_hash         text,                      -- computed by the media worker; images ship with it (ADR-025)
  embed_provider    text,                      -- youtube | vimeo
  embed_url         text,
  taken_date jsonb, taken_sort_from date, taken_sort_to date,
  place_id          uuid references places,
  historical_period_id uuid references historical_periods,
  credit            text,                      -- photographer / contributor credit as displayed
  contributor_person_id uuid references persons,
  license           text,                      -- 'all-rights-reserved', 'CC BY 4.0', ...
  visibility        visibility_level not null default 'public',
  uploaded_by       uuid references users,
  deleted_at        timestamptz,
  created_at, updated_at,
  check ((kind = 'embed') = (embed_url is not null))
);
create index on media_assets (checksum_sha256);   -- duplicate warning, not unique

create table media_translations (
  media_id    uuid references media_assets,
  locale      text,
  title       text,
  description text,
  caption     text,
  alt_text    text,
  primary key (media_id, locale)
);

create table media_variants (
  media_id    uuid references media_assets on delete cascade,
  variant     text,                           -- thumb | sm | md | lg | xl
  format      text,                           -- avif | webp | jpeg
  width int, height int, byte_size bigint,
  storage_key text not null,
  primary key (media_id, variant, format)
);

create table historical_periods (
  id         uuid primary key,
  key        text not null unique,
  name_i18n  jsonb not null,
  from_year  int, to_year int                  -- AD
);

create table galleries (
  id                 uuid primary key,
  slug               text not null unique,
  title_i18n         jsonb not null,
  description_i18n   jsonb,
  cover_media_id     uuid references media_assets,
  event_id           uuid references events,
  org_unit_id        uuid references org_units,
  place_id           uuid references places,
  category_id        uuid references categories,
  historical_period_id uuid references historical_periods,
  year               int,                      -- AD year for browsing; BS shown via conversion
  visibility         visibility_level not null default 'public',
  publication_status publication_status not null default 'draft',
  deleted_at         timestamptz,
  created_at, updated_at, created_by, updated_by
);

create table gallery_items (
  gallery_id  uuid references galleries,
  media_id    uuid references media_assets,
  position    int not null,
  primary key (gallery_id, media_id)
);

create table media_person_tags (            -- people identified in photos
  id          uuid primary key,
  media_id    uuid not null references media_assets,
  person_id   uuid not null references persons,
  region      jsonb,                          -- {x,y,w,h} normalized 0..1, optional
  status      assertion_status not null default 'accepted',
  tagged_by   uuid references users,
  created_at,
  unique (media_id, person_id)
);
```

Effective visibility of a media asset in a public context = the most restrictive of the asset's own visibility and, for photo tags, the tagged living persons' `photos` field-group visibility.

---

## 11. Platform tables

```sql
create table audit_log (
  id                 bigint generated always as identity primary key,
  occurred_at        timestamptz not null default now(),
  actor_type         actor_type not null,       -- user | system | job | import
  actor_id           uuid,
  action             text not null,             -- 'person.update', 'appointment.create', 'auth.login_failed'
  entity_type        text,
  entity_id          uuid,
  change_request_id  uuid,
  diff               jsonb,                     -- {field: [before, after]}; PII-minimized for auth events
  request_id         text,
  ip_hash            text,
  user_agent         text
);
create index on audit_log (entity_type, entity_id, occurred_at desc);
create index on audit_log (actor_id, occurred_at desc);
-- app DB role: GRANT INSERT, SELECT only. Partition by year when > ~10M rows.

create table outbox (                         -- rows are deleted once handed to BullMQ
  id           uuid primary key,              -- reused as the BullMQ job id (idempotent hand-off)
  topic        text not null,                  -- 'email.send' (later 'media.process', 'web.revalidate')
  payload      jsonb not null,                 -- may hold one-time links: never kept after hand-off
  attempts     int not null default 0,
  created_at   timestamptz not null default now()
);
create index on outbox (created_at);

create table notifications (
  id         uuid primary key,
  user_id    uuid not null references users,
  kind       text not null,
  payload    jsonb not null,
  read_at    timestamptz,
  created_at timestamptz not null default now()
);
create index on notifications (user_id, created_at desc) where read_at is null;
```

---

## 12. Enumerations (summary)

| Enum | Values |
|---|---|
| `visibility_level` | public, members, branch, restricted, private |
| `assertion_status` | accepted, disputed, superseded, rejected, retracted |
| `lineage_role` | lineage, spouse |
| `link_status` | requested, approved, rejected, revoked |
| `branch_access_status` | requested, approved, rejected, revoked |
| `confidence` | certain, probable, possible, speculative |
| `verification_status` | unverified, verified, disputed |
| `living_status` | living, deceased, unknown |
| `gender` | female, male, other, unknown |
| `parent_kind` | biological, adoptive, step, foster, guardian, unknown |
| `union_kind` | marriage, partnership, unknown |
| `cr_status` | pending, under_review, needs_correction, approved, rejected, withdrawn |
| `content_status` | draft, in_review, scheduled, published, archived |
| `publication_status` | draft, published, archived |
| `appointment_type` | elected, nominated, co_opted, acting, ex_officio, honorary |
| `date_precision` | day, month, year |

Enums that the organization may want to extend without a deploy (event categories, unit types, positions, source kinds if needed) are lookup tables instead.

---

## 13. Integrity summary — what lives where

| Rule | Enforced by |
|---|---|
| No self-parenting, valid date bounds, exactly-one-subject citations, scope consistency | `CHECK` constraints |
| One primary name, one primary branch, unique active role assignment, unique slugs | Unique / partial unique indexes |
| Exclusive positions not double-filled; terms of a unit don't overlap; same person not double-appointed | Exclusion constraints (`btree_gist`) |
| Appointment term belongs to same unit | Composite FK |
| Lineage members have male/female gender | `CHECK` constraint |
| No genealogy cycles; male-line rule; exactly one accepted father per lineage person; union partner consistency; org unit type nesting; `max_holders > 1` | Service layer, in transaction with advisory/row lock, covered by integration tests |
| No silent overwrite | `version` column + change-request base version |
| Append-only audit | DB grants |
| Privacy | `people/domain/privacy.ts` + response schemas + `person_presumed_living` SQL function for list queries |

## 14. Data volume & indexing notes

At 100k persons, ~250k relationship edges, the largest tables fit comfortably in memory on an 8 GB instance. Recursive CTE depth is capped server-side (max 6 per request for tree views, 30 for relationship-path search with early termination). `pg_stat_statements` will be enabled to drive further indexing decisions rather than speculative indexes now.

## 15. Deferred tables (later phases)

`event_registrations`, `event_attendance`, `member_registry` (pending Q-6), `push_tokens`, `saved_searches`, `content_submissions` (reuses `change_requests` with `domain = 'content'`), `imports` (import batch tracking with row-level results).

## 16. Mapping to the genealogy access policy

[genealogy-access-policy.md §5](../product/genealogy-access-policy.md) names the entities it needs. They map to this schema as follows:

| Policy entity | Implemented by | Note |
|---|---|---|
| `Person` | `persons` + `person_names` | `lineage_role` adds the male-line scope |
| `RelationshipAssertion` | `parent_child`, `unions`, `union_partners` | Carry `status` and `confidence` |
| `GenealogySubmission` | `change_requests` + `change_request_operations` | One submission can add several people and relationships atomically |
| `FamilyBranch` | `family_branches` | |
| `UserPersonLink` / `user_person_links` | `user_person_links` | Holds the request and, once approved, the link (ADR-022) |
| `verification_requests` | The request statuses in `user_person_links` (identity claims) and `branch_access` (branch access) | Two tables with the same `requested → approved/rejected → revoked` lifecycle. Separate tables keep foreign keys real instead of polymorphic |
| `BranchMembership` | `branch_access` (user ↔ branch) and `person_branches` (person ↔ branch) | The policy's term covers both. Users get *access*; persons *belong* |
| `PrivacySetting` | `persons.visibility`, `persons.field_visibility`, `person_consents` | |
| `AccessGrant` | `branch_access` (per branch), `person_access_grants` (per person and field group) | Both revocable and expirable |
| `AuditLog` | `audit_log` + `entity_revisions` | Admin actions are audited too |

**Relationship review statuses.** The policy lists Pending, Under Review, Approved, Rejected, Needs Correction and Superseded. The workflow statuses live on the submission (`change_requests.status`), and `superseded` lives on the relationship row. Keeping unapproved claims out of the tree tables means no tree, search or export query can show pending data by accident.

**Duplicate check (policy workflow step 4).** When a change request is submitted, each `create_person` operation is matched against existing persons. Matching uses trigram similarity on `person_names.romanized` and `full_name`, plus birth-year proximity and the same father. Likely matches are attached to the operation as warnings. The submitter sees them before confirming, and the editor sees them during review.
