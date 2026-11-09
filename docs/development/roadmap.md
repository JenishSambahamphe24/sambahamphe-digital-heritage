# Development Roadmap

Status: **Draft for review** (Phase 0) · Last updated: 2026-11-07

Phases follow the project brief, with one adjustment: the **shared Person core and Places** move into Phase 2, because boards (Phase 2) need people, and building boards with a throwaway "member" table would later collide with genealogy persons. Full genealogy (relationships, tree, workflow) remains Phase 3.

Every milestone ends with: lint + typecheck + unit + integration tests green in CI, docs updated, and a short demo/review. A milestone is not done if any of these were skipped.

---

## Phase 0 — Discovery & architecture *(current)*

| Deliverable | Status |
|---|---|
| `docs/product/requirements.md` | Draft |
| `docs/architecture/system-design.md` | Draft |
| `docs/architecture/architecture-decisions.md` | Draft |
| `docs/database/erd.md`, `docs/database/schema-design.md` | Draft |
| `docs/api/api-conventions.md` | Draft |
| `docs/development/roadmap.md` | Draft |
| `docs/product/genealogy-access-policy.md` | Adopted |
| `docs/product/member-registration-flow.md` | Adopted |

Decided 2026-11-07: Q-1 (access policy), Q-2 (male line), Q-3 (English + Nepali), backend framework (NestJS). See requirements §7.

**Exit criteria:** ~~blocking questions Q-1, Q-2, Q-3 answered~~ ✅; ADRs accepted or amended; schema reviewed with at least one person who knows the community's genealogy and the organization's statute (bylaws).

---

## Phase 1 — Foundation

**M1.1 Monorepo & tooling** — ✅ done (2026-11-07)
- git init, pnpm workspace with **catalogs** (`generic`, `fe`, `be`), Turborepo tasks (`dev`, `build`, `lint`, `format`, `format:write`, `check`, `typecheck`, `test`).
- `@repo/config` presets following Bitsky (ADR-025): eslint (`base`, `node`, `api`, `react`), prettier (`base`, `api`, `react`), tsconfig (`base`, `node`, `react`).
- commitlint (conventional) + husky (`commit-msg`; `pre-push` runs lint + format). Root `CLAUDE.md`, `.gitattributes`, PR template (already in place).
- `docker-compose.yml`: Postgres 17, Redis 7.4, SeaweedFS (S3), Mailpit; ports bound to 127.0.0.1, overridable via `.env`.
- GitHub Actions CI: one job (install → lint → format check → typecheck → test) on pull requests.

**M1.2 API skeleton** — ✅ done (2026-11-07)
- NestJS 12 (ESM) app, Zod env validation (refuses to start on bad config), pino logging with request IDs, problem+json error filter, `/health/live` + `/health/ready`.
- Drizzle setup (drizzle-kit, schema-per-table), first custom migration enabling `citext`, `pg_trgm`, `unaccent`, `btree_gist`.
- Testcontainers integration-test harness (`TestDatabase`), Vitest + SWC.
- Moved to M1.3, where they get their first real use: worker entrypoint + Redis/BullMQ, request validation and OpenAPI generation, `users`/auth/roles tables, `audit_log`, `outbox`, role seeds.

**M1.3 Auth & access** — ✅ done (2026-11-09)
- Tables: `users`, `auth_sessions`, `one_time_tokens`, `roles`, `permissions`, `role_assignments`, `audit_log`, `outbox`; seed system roles and permissions.
- Worker entrypoint (BullMQ on Redis) with the first job: sending verification and reset emails (Mailpit locally).
- Request validation with NestJS 12 Standard Schema + Zod; choose the Zod→OpenAPI generator and serve docs in non-production.
- Register with email or phone (ADR-024; SMS behind a provider interface, enabled once Q-16 is settled), verify email/phone, login with server-side sessions (ADR-006), logout, session list and revoke, password reset; rate limiting.
- RBAC guard + scoped policy service (org-unit/branch scopes stubbed until those tables exist).
- Audit interceptor.
- Tests: auth flows, token reuse, permission matrix.

**M1.4 Shared packages**
- `contracts` (common schemas: pagination, problem, FuzzyDate, LocalizedText).
- `dates`: BS↔AD conversion with exhaustive tests against a reference table; FuzzyDate normalization.
- `api-client` generation pipeline.
- `ui`: tokens, typography (Latin/Devanagari/Limbu fonts), buttons, forms, layout primitives.

**M1.5 Web & admin shells**
- `web`: App Router, locales (`en`, `ne`), layout, header/footer, home/about placeholders driven by real API health only (no fake content), SEO basics.
- `admin`: login, session handling, navigation shell, user list & role assignment screens.
- Playwright: login journey.

**Exit:** a developer can clone, `docker compose up`, `pnpm dev`, log in to admin, assign a role; CI green.

---

## Phase 2 — Places, People core, Organization, CMS, Media, Events

**M2.1 Places & People core**
- `places` + alt names; admin CRUD with hierarchy picker.
- `persons`, `person_names`, consents, privacy policy module (table-driven tests), basic person CRUD for editors (direct, audited; change-request flow arrives in M3.2).
- Person search (trigram on names, romanization).

**M2.2 Organization & governance**
- Org unit types, units (tree), terms, positions, appointments; exclusion constraints; scoped `org_manager`.
- Admin: org tree editor, term management, "board for term" editor (assign people to positions quickly, create person inline).
- Public: organization page, current central board, regional boards and gaau committees, past boards by term.
- Seed: Central Board, unit types, standard positions (pending confirmation of the statute).

**M2.3 Media**
- Pre-signed upload flow, worker processing (variants, EXIF stripping, MIME sniffing), media library UI (grid, search, metadata editing, bulk upload), galleries.
- Restricted media signed URLs.

**M2.4 Content**
- Content items + translations, categories/tags (seed heritage categories), Tiptap editor with media/person embeds, workflow (draft → review → publish/schedule), revisions with diff/restore, announcements (pin/expiry).
- Public: articles, heritage section, news, announcements; on-demand revalidation; sitemaps; JSON-LD.

**M2.5 Events**
- Events, categories, organizers, derived lifecycle, gallery linkage, activity reports.
- Public: upcoming/past events, event detail with gallery.

**Exit:** the organization can run its public site (about, boards, news, events, galleries, heritage articles) without developer help.

---

## Phase 3 — Genealogy

**M3.1 Relationships & branches**
- `parent_child`, `unions`, `union_partners`, branches, sources/citations.
- Cycle check, biological-parent limit, plausibility warnings; recursive-CTE ancestor/descendant queries (Drizzle `sql`); integration tests with generated large graphs (100k persons) for performance budgets.

**M3.2 Change requests**
- Generic `contributions` module, genealogy operation types, temp refs, base-version conflicts, auto-approve for editors, review inbox with diffs, comments, notifications.
- Submission by any registered member (verified email, rate-limited); search-and-anchor submission form; **duplicate check at submission**.
- Male-line rules (ADR-020) and branch inheritance on approval.
- Migrate M2.1 direct person edits onto change requests.

**M3.3 Tree visualization**
- Neighborhood endpoint, React Flow top-down descendant tree + father-chain lineage view, progressive expand/collapse, search-to-focus, profile panel, mobile list fallback, accessibility (keyboard navigation, screen-reader family list).

**M3.4 Profiles, privacy & search**
- Public person profiles (deceased/consented), redaction in tree, search and exports, consent management UI, individual privacy settings, access grants, profile claiming flow.
- **Identity claims** (ADR-022): "Are you in the tree?" onboarding step, privacy-safe claim lookup, claim review queue, approval that links the account and grants branch access.
- **My Family Tree → Add Family Member** wizard (G-23), with male-line rules and duplicate check.
- **Minors** rules (ADR-023), plus a "turns 18" review job.
- **Branch access requests** (ADR-021): request form, editor approval queue, revoke/expiry; branch-scoped visibility of living relatives.
- Relationship finder (common ancestors / path).

**M3.5 Import & data quality**
- CSV import (staged into change requests, row-level validation report), duplicate detection, merge tool, (GEDCOM import if Q-5 shows existing GEDCOM data).

**Exit:** reviewers can process community submissions; the public can browse the tree without exposing living people's data; existing family records imported.

---

## Phase 4 — Community features

- Member contributions for articles/stories/photos via change requests (`domain = content|media`).
- Photo person-tagging.
- Notifications (in-app + email digests).
- Event registration & attendance.
- Historical archives section (documents browser, periods, sources).
- Global search page with facets.
- GEDCOM/CSV export and yearly archive export job.

## Phase 5 — Mobile

- Expo app: auth, news & announcements, events, galleries, tree browsing, own profile; push notifications.
- Contribution submission from mobile (photos, corrections).
- Store releases (Play Store first — likely most of the community uses Android).

---

## Cross-phase tracks

| Track | Ongoing work |
|---|---|
| Security | Dependency updates (Renovate), periodic review of public endpoints against privacy policy, pen-test checklist before Phase 3 public launch |
| Ops | Staging environment from Phase 1 end; production from Phase 2 end; backups + restore drill before any real genealogy data is entered |
| Docs | ADRs updated when decisions change; runbooks for deploy, backup/restore, privacy erasure request |
| Content | Organization gathers history texts, photos, board lists, statute — in parallel with Phase 1 so Phase 2 launches with real content |

## Immediate next steps (after approval)

1. Answer blocking questions Q-1–Q-3 (and Q-5, Q-9 if possible).
2. Accept/amend ADRs.
3. Begin M1.1 — monorepo initialization.
