# Architecture Decision Records

Format: Context → Decision → Consequences. Status values: *Proposed* (awaiting review), *Accepted*, *Superseded by ADR-n*.
All entries below are **Proposed** until the Phase 0 review.

---

## ADR-001 — Modular monolith, not microservices

**Context.** Small volunteer team, modest traffic, strongly related domains (a Person appears in genealogy, boards, articles, photos). Many operations need cross-module transactions (approve a change request → create persons + relationships + revisions + audit rows).

**Decision.** One NestJS application (`apps/api`) with strict module boundaries, run as two processes (HTTP and worker) from the same build.

**Consequences.** Single deploy, single DB, real ACID transactions. Boundaries are enforced by convention and lint rules rather than network calls. A module could be extracted later if a real need arises (none is foreseen).

## ADR-002 — pnpm workspaces + Turborepo monorepo

**Context.** Web, admin, API and mobile share contracts and UI.
**Decision.** pnpm workspaces for dependency management; Turborepo for task orchestration and caching.
**Consequences.** One PR can change a contract and all its consumers atomically. Expo works with pnpm via `node-linker=hoisted` scoped to the mobile app if needed (to be verified in Phase 5).

## ADR-003 — Drizzle as the single ORM

**Status.** Accepted (2026-11-07). Supersedes the earlier Prisma proposal.

**Context.** The brief requires choosing Prisma or Drizzle. Genealogy needs recursive CTEs and Postgres-specific features: exclusion constraints, ranges, `pg_trgm`, generated columns. The maintainer uses Drizzle daily in the Bitsky monorepo (ADR-025).

**Decision.** **Drizzle ORM** with `drizzle-kit` migrations, following Bitsky's conventions:
- one schema file per table (`<table>.schema.ts`), re-exported from a `schema/index.ts`; snake_case columns in the database, camelCase in TypeScript;
- migrations always generated with a name (`--name=add_branch_access`);
- constraints Drizzle cannot express (exclusion constraints, some checks, triggers, the presumed-living SQL function) go in **custom migrations** (`drizzle-kit generate --custom --name=…`), documented in `schema-design.md` and covered by integration tests;
- recursive CTEs written with Drizzle's `sql` template (parameterized) in the genealogy repository.

The database code lives inside `apps/api` (`src/database/`). Bitsky keeps it in `packages/database` because several backends share one database; we have one API and one worker in the same app, so a separate package would add structure without benefit. It can be extracted later if a second consumer appears.

**Why Drizzle over Prisma.** The same tool at work and here, so experience transfers both ways. Recursive CTEs and Postgres features stay close to plain SQL. No separate generated client or engine binary. Prisma's main advantage (a schema file that's easy to read) is outweighed by the maintainer already knowing Drizzle.

**Consequences.** Some constraints live only in custom migration SQL, so each is listed in `schema-design.md` §13 and tested so it cannot be lost silently.

## ADR-004 — Genealogy stored as an adjacency graph in Postgres, queried with recursive CTEs

**Context.** Options: graph DB (Neo4j), closure table, nested sets/ltree, adjacency list.
**Decision.** Adjacency (`parent_child`, `unions`, `union_partners`) in Postgres; depth-bounded recursive CTEs.
**Why.** Genealogy is a DAG with multiple parents and pedigree collapse — ltree/nested sets assume a single-parent tree. A graph DB adds a second datastore and loses transactional integrity with the rest of the platform. At ≤100k persons, indexed recursive CTEs to depth 5–10 run in milliseconds.
**Consequences.** If needed later, add a trigger-maintained closure table for O(1) ancestor checks; API unchanged.

## ADR-005 — Zod schemas as the shared contract; OpenAPI generated

**Decision.** `packages/contracts` holds Zod schemas for all request/response bodies and enums. NestJS validates with them; OpenAPI 3.1 is generated from them; `packages/api-client` is generated from OpenAPI.
**Why.** One source of truth usable at runtime on server and client (forms), avoiding class-validator DTOs duplicated by frontend types.
**Consequences.** We forgo NestJS's decorator-based Swagger in favor of Zod→OpenAPI generation; the generator library is chosen in M1.3 with the first input-taking endpoints.

**Update (2026-11-07).** NestJS 12 validates Standard Schema objects natively (`@Body({ schema })`, `StandardSchemaValidationPipe`), and Zod 4 is a Standard Schema. Request validation therefore needs **no adapter library** (`nestjs-zod` dropped).

## ADR-006 — Self-hosted authentication in the API

**Context.** Options: Auth0/Clerk (cost, vendor lock-in for a long-lived archive), Keycloak (heavy to operate), Auth.js (tied to Next.js, not suitable for mobile + NestJS as the authority), own implementation.
**Decision.** Implement auth in NestJS: argon2id passwords, short-lived EdDSA JWT access tokens, rotating hashed refresh tokens, cookie transport for web/admin, bearer for mobile. Add OAuth (Google) later via a standard library.
**Consequences.** We own security-sensitive code; it is kept small, follows OWASP ASVS L2 guidance, and gets dedicated tests. No per-user vendor cost; users are stored with the rest of the archive.

## ADR-007 — Separate admin app

**Decision.** `apps/admin` is a separate Next.js app (not `/admin` inside the public site).
**Why.** Different needs (no SEO, heavy client interactivity, larger bundles), separate deploy and attack surface, can sit behind stricter headers/IP rules. Shared UI comes from `packages/ui`.
**Consequences.** Two Next.js apps to maintain; mitigated by shared config packages.

## ADR-008 — S3-compatible object storage with pre-signed uploads

**Decision.** Cloudflare R2 in production (zero egress cost), SeaweedFS locally (MinIO stopped publishing community images in late 2025); clients upload directly via pre-signed URLs; the worker processes files.
**Consequences.** API servers never stream large files; storage provider swappable (S3 API). Restricted media requires signed GET URLs.

## ADR-009 — Rich text stored as Tiptap/ProseMirror JSON

**Decision.** Store article bodies as structured JSON, render server-side with an allow-listed node/mark renderer. Also store derived plain text for search.
**Why.** Safer than stored HTML (no XSS surface), allows structured embeds (media asset by ID, person reference, event reference) that stay valid if a URL changes, renders identically on web and mobile.
**Consequences.** Body format is tied to the Tiptap schema; schema changes need content migrations (versioned via `body_schema_version`).

## ADR-010 — UUIDv7 primary keys

**Decision.** All primary keys are UUIDv7 generated in the application.
**Why.** Non-enumerable (important for person records), time-ordered (good index locality), generated offline (mobile, imports with temporary IDs).
**Consequences.** Slightly larger indexes than bigint — irrelevant at this scale. Human-friendly references use slugs (content) or short codes where needed.

## ADR-011 — Fuzzy dates with original calendar preserved

**Context.** Historical dates are often approximate ("around 1950", "before 2030 BS") and frequently recorded in Bikram Sambat.
**Decision.** Store each genealogical/historical date as a composite:
`{calendar: 'BS'|'AD', year, month?, day?, qualifier: exact|about|before|after|between|calculated, end{year,month?,day?}? , text?}` plus two normalized AD columns `sort_from` / `sort_to` (`date`) for sorting, range filtering and living-person inference. Conversion lives in `packages/dates` (table-driven BS↔AD).
**Consequences.** Original input is never lost to conversion error; queries use the normalized range. Exact operational timestamps (created_at, event start) use `timestamptz`.

## ADR-012 — Change requests as the single write path for genealogy

**Decision.** All genealogy mutations are operations inside a change request; trusted editors' requests auto-approve. Records are versioned; update operations carry the base version; conflicts block application.
**Why.** Uniform audit trail, no "silent overwrite", atomic multi-entity submissions, one code path to secure and test.
**Consequences.** Slightly more ceremony for editors (mitigated by UI). Operation payloads are a versioned contract.

## ADR-013 — Organizational positions are separate from application roles

**Decision.** Positions (governance facts) and roles (application permissions) are separate tables with no automatic coupling. Role assignments can be **scoped** to an org unit subtree or a family branch.
**Why.** A chairperson may not be technical; a volunteer web admin may hold no position; positions change at elections and must not silently grant or revoke system access.
**Consequences.** An optional admin *suggestion* ("new Regional Secretary appointed — grant regional manager role?") can be added later, but the grant is always explicit.

## ADR-014 — Event lifecycle status is derived

**Decision.** Upcoming/ongoing/completed are computed from start/end times (event timezone); only `cancelled`/`postponed` are stored overrides. Publication status is separate.
**Consequences.** No stale status, no cron dependency. Filters translate to date predicates.

## ADR-015 — Translations in per-locale rows

**Decision.** Translatable content uses a `*_translations` table keyed by `(entity_id, locale)` for title, slug, summary, body, SEO fields. Non-translatable fields (dates, status, relations) live on the parent.
**Why.** Adding a locale (Limbu) needs no migration; per-locale slugs; partial translations allowed with fallback.
Short labels on taxonomy/reference data (category names, position titles, unit and place names) use a `name_i18n jsonb` map (`{"en": "...", "ne": "..."}`) validated by Zod rather than a translation table per lookup table.
**Consequences.** Queries join translations; the API resolves a requested locale with fallback order (requested → default `en`).

## ADR-016 — Postgres search first

**Decision.** `tsvector` (simple config) + `pg_trgm` + `unaccent` + a romanized name column. No external search engine initially.
**Consequences.** One datastore; adequate at expected volume. Revisit (Meilisearch) only if multilingual relevance proves inadequate.

## ADR-017 — Soft deletion and non-destructive history

**Decision.** Genealogy, governance, content and media records are never hard-deleted by application code. They use `deleted_at` (content, media) or status transitions (`retracted`, `merged`) for genealogy. Hard deletion is a super-admin maintenance action reserved for legal/privacy erasure requests, which is itself logged (with the erased data excluded).
**Consequences.** Queries must filter deleted rows — done in module repositories, covered by tests. Right-to-erasure requests are handled by a documented procedure that removes PII while keeping structural placeholders so the tree is not broken.

## ADR-018 — Testing strategy

**Decision.** Vitest for unit tests (packages, domain logic, React components); Vitest + Testcontainers (real Postgres & Redis) for API integration tests via Supertest; Playwright for end-to-end journeys. No mocking of the database in integration tests.
**Consequences.** Constraints and SQL (CTEs, exclusion constraints) are tested against real Postgres. CI needs Docker.

## ADR-019 — NestJS as the backend framework

**Status.** Accepted (2026-11-07).

**Context.** Express/Fastify can support the same layered structure (routes, controllers, services, repositories, middleware), but the project would have to design and maintain that structure itself. The platform has ~15 domain modules, mandatory permission checks and audit logging on writes, a separate worker process, and will be maintained by changing volunteers over many years.

**Decision.** Use NestJS (on its default Express adapter).

**Why.**
- Dependency injection wires services for both the HTTP and worker processes, with no hand-maintained composition file.
- Module `exports` enforce boundaries at startup (a module cannot use another module's private providers).
- Guards run after routing, enabling deny-by-default permissions with explicit `@Public()` opt-out.
- Interceptors wrap handlers before *and* after, which suits audit logging of results.
- Structure is documented externally, so new contributors can learn it from the official docs.
- Official integrations: throttler, config, terminus (health), BullMQ.

**Consequences.** More concepts to learn up front (decorators, modules, DI). Zod validation works natively in NestJS 12 (ADR-005). Express knowledge still applies underneath.

**Update (2026-11-07) — NestJS 12, ESM.** NestJS 12 (Aug 2026) ships ESM-only packages. The API is an ESM project (`"type": "module"`, `module: nodenext`, `.js` extensions on relative imports), built with the default `tsc` compiler via `nest build`. Tests run on Vitest with SWC, which keeps the decorator metadata Nest's injection needs.

## ADR-020 — Genealogy scope: Sambahamphe male line

**Status.** Accepted (2026-11-07) — answers requirements Q-2 and Q-15.

**Context.** The organization decided the family tree records the Sambahamphe male line only.

**Decision.** Each person gets a `lineage_role`:
- `lineage` — founding ancestors and every child (son or daughter, biological or adopted) of a lineage man;
- `spouse` — a woman married to a lineage man (her own parents/clan ancestry not recorded; clan kept as an attribute);

Rules (service layer, inside the write transaction):
1. A child can be added only under a **lineage man** (biological or adoptive father). The child becomes `lineage`.
2. A lineage person has **exactly one accepted father** (competing claims stay `disputed`). **Founding ancestors** — there are several — have none and are marked `is_founding_ancestor`. Any other lineage person without a father appears in a data-quality report ("father missing") instead of silently becoming a root.
3. Mother edges (from a `spouse`) are recorded, but descent continues only through sons.
4. Children are not recorded under daughters or spouses. **A daughter's record ends with her:** no marriage, husband or children are recorded for her.
5. **Adopted sons** (`parent_child.kind = 'adoptive'` from a lineage man) are full lineage members and continue the line.
6. Unions are recorded only between a lineage man and his wife or wives (`spouse`).
7. A lineage person's primary branch is inherited from their father unless an editor overrides it.

**Consequences.**
- The lineage is a **true tree** (one father each), so ancestors are a single chain, the default view is a classic top-down descendant tree, and there is no pedigree collapse within the lineage.
- We **keep** the general model (separate parent–child edges, unions, disputed claims, adoption) instead of a simpler `father_id` column. Disputes, multiple marriages and half-siblings still need it, and widening the scope later would need no migration.
- `gender` is required (male/female) for lineage members, because it decides whether the line continues.

## ADR-021 — Access to living people is granted per family branch

**Status.** Accepted (2026-11-07) — implements the [genealogy access policy](../product/genealogy-access-policy.md).

**Context.** The policy grants verified family members access to living relatives **in their authorized branches**, not to the whole tree. Registration alone grants nothing private.

**Decision.**
- New table `branch_access` (user × branch, status `requested | approved | rejected | revoked`, relation statement, optional vouching person, decision, expiry). Access to a branch includes its sub-branches.
- "Verified family member" is **derived** (has at least one approved branch access), not an account flag.
- This is **data-access privacy, not RBAC.** It is evaluated by the people module's privacy policy alongside the person's own visibility settings, consents and individual grants (ADR-013 still holds: roles control *actions*; privacy controls *which records are visible*).
- Any registered member with a verified email or phone can submit change requests (rate-limited). Approval remains with genealogy editors.
- Genealogy editor and reviewer are merged into one `genealogy_editor` role, matching the policy's level 4. It can be scoped to a branch.

**Consequences.** Branch structure matters for privacy, so editing branches and moving people between branches are audited, editor-only actions. A living person not yet assigned to any branch is visible only to editors.

## ADR-022 — Identity claims link accounts to persons through a reviewed request

**Status.** Accepted (2026-11-07) — implements [member-registration-flow.md](../product/member-registration-flow.md) §1–2.

**Context.** Accounts (`users`) and family-tree records (`persons`) must stay separate. A person often exists in the tree before they register, so registration must never create a person automatically.

**Decision.**
- Replace the `users.person_id` column with a `user_person_links` table: user × person, status `requested | approved | rejected | revoked`, the claimant's statement and evidence, and the editor's decision. One approved link per user and per person.
- **Privacy-safe claim lookup.** Living people are hidden from registered members, so a normal search cannot find the claimant's own record. A dedicated lookup takes the claimant's **name + father's name + birth year** and returns at most 3 strong matches. Each match shows only the name, father's name and branch — no dates, places or photos. The lookup is rate-limited (10 per day per user) and audited, so it cannot be used to list living people.
- If nothing matches, the claimant attaches the claim to a **known ancestor** ("I am a grandson of …") and the editor finds or creates the record through a normal change request.
- **Approval** links the account, and by default also grants `branch_access` to the person's primary branch, in the same decision. The editor can untick it. Both are recorded and both are revocable.
- A linked person's own privacy settings can then be managed by that user (self-consent).

**Consequences.** Editors handle a second queue (claims) next to submissions. The lookup is a deliberate, narrow exception to "living people are invisible", protected by exact-match rules, rate limits and auditing.

## ADR-023 — Minors are added only with parent/guardian authority and maximum privacy

**Status.** Accepted (2026-11-07) — implements member-registration-flow §5.

**Decision.**
- A living person added to the tree must have at least an approximate birth year, so minor status can be determined. A person is a **minor** if presumed living and born less than 18 years ago.
- A minor can be submitted only by a user whose **linked person is the minor's parent** (or recorded guardian), or by a genealogy editor, who must record a note on the authority.
- Minors' defaults: `names` and `relationships` → `branch`; every other field group → `private`; profile photos not allowed. A minor's record **cannot be raised to `public`** until they turn 18, even with consent.
- When a minor turns 18, a maintenance job flags the record for review. Nothing becomes more visible automatically.

**Consequences.** Some children will be missing until a linked parent adds them. That is intended.

## ADR-024 — Registration with email or mobile number

**Status.** Accepted (2026-11-07) — implements member-registration-flow §2.

**Decision.** A user registers with an email **or** a mobile number (E.164 format), or both, and must verify at least one. Mobile verification uses a 6-digit one-time code sent by SMS: hashed in storage, valid for 10 minutes, at most 5 attempts, with resends rate-limited. The SMS provider sits behind an interface, with a Nepal-local gateway likely for cost (decision pending Q-16). Login accepts either identifier.

**Consequences.** SMS has a running cost and attracts abuse (fake sign-ups that burn SMS credit). Mitigations: per-number and per-IP limits, and a CAPTCHA on sign-up when abuse is detected. If budget is not approved, launch with email only; the schema already supports phone.

## ADR-025 — Coding conventions adapted from the Bitsky monorepo

**Status.** Accepted (2026-11-07).

**Context.** The maintainer works daily in the Bitsky monorepo (pnpm + Turborepo, Express/tsyringe APIs, TanStack Start frontends, Drizzle). Shared conventions mean habits transfer both ways. Bitsky's rules also carry lessons from real incidents. Bitsky is a large, team-built, money-handling product on AWS, though, so not all of its machinery fits a small volunteer project.

**Adopted** (operational rules live in the root `CLAUDE.md`):

| Rule | Why it fits here |
|---|---|
| Root + per-app `CLAUDE.md`, app rules blocking | Keeps rules next to the code they govern |
| pnpm **catalogs**, no literal versions; `packages/*` use `peerDependencies`; one lockfile; no app code at root | Cheap, avoids version drift from day one |
| `@repo/config` presets (eslint / prettier / tsconfig) with Bitsky's settings: double quotes, semicolons, trailing commas, sorted imports, Tailwind class sorting, strict TS with no-unused | Same formatting at work and here. Differences: ESLint **10** (Bitsky's 9 is out of support since Nov 2026), `no-floating-promises` on, `noUncheckedIndexedAccess` on |
| Helpers = classes with static methods (`<name>.helper.ts`) | One shape for cross-cutting code |
| Comments only for a non-obvious *why*; no AI-authorship comments, no `console.log` | Readable, honest code |
| `I`/`T` type prefixes, named exports, function declarations, named `Props` interfaces | Consistency with the maintainer's daily code |
| No magic values | Prevents scattered literals (depth caps, limits) |
| Controller → Service → Repository; one DTO per file with Bitsky's naming; services return data parsed through response schemas | Maps 1:1 onto NestJS (ADR-019) |
| Per-field masking with "no request context = masked" (Bitsky PII masking) | The same principle as our privacy policy; adopted as a hard rule |
| Never cache a viewer-dependent parsed response | Bitsky lesson, directly relevant to privacy-filtered person data |
| **Images are full file objects with blurhash** | Better UX on slow connections in Nepal; adds `media_assets.blur_hash` |
| Named migrations (`--name=snake_case`) | Readable migration history |
| Feature folders, thin routes, one component per file, Tailwind tokens only, no arbitrary values, `cn()`, no hardcoded strings, React-first DOM, confirm destructive actions | Proven frontend hygiene |
| Conventional commits (commitlint) + husky (`commit-msg`, `pre-push` lint + format) | Light guardrails |
| `.gitattributes` (LF endings), strict PR template | Adapted: gates replaced with ours (privacy, genealogy integrity) |

**Skipped**, as too much for this project:

| Bitsky practice | Why skipped |
|---|---|
| Coin-as-string money rules | No money in this platform |
| graphify knowledge graph | Built for a very large codebase; ours is small |
| `.devops` ECS task definitions | We deploy with Docker Compose on one server (hosting-and-costs) |
| Release scripts, nightly/production branch guard, package changelogs/versioning | One maintainer, one environment. `develop` is the main branch, with short-lived feature branches merged into it; add release branches and tooling only when needed |
| Auto-migrate on boot with advisory lock; expand/contract migration rule; read-replica handling | Exist because several backends share one database. We have one API; run `migrate deploy` as a deploy step |
| CI matrix (separate lint/test/typecheck runners), affected-only filters | One CI job is fast enough at our size |
| Claude PR-review GitHub workflow | Paid API use; a local review is enough for one developer |
| Backend i18n of error messages (`tk()`) | Our API returns stable error `code`s that clients translate (API conventions §3) |
| `ApiResponse` envelope with a message on every success | Our API conventions use plain resources and `{ data, page }`, which suit the mobile client |
| Mobile `<field>File` twin fields, pnpm patches/overrides/hoist patterns | Solve problems we don't have yet |
| PR-review checklist file | Bitsky's grew from real incidents. Start ours empty and add an entry when a review misses something real |

**Kept as our own decisions (different from Bitsky):** NestJS instead of Express + tsyringe (ADR-019), and Next.js instead of TanStack Start (SEO and ecosystem for the public site). The ORM now matches Bitsky: Drizzle (ADR-003).
