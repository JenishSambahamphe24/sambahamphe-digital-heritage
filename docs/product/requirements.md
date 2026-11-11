# Product Requirements — Sambahamphe Utthan Sangh Digital Heritage Platform

Status: **Draft for review** (Phase 0) · Last updated: 2026-11-07

This document restates the project brief as structured requirements, names the actors, and lists the open questions that must be answered before or during implementation. It is the reference for *what* we build; `docs/architecture/` covers *how*.

---

## 1. Purpose

Build a long-lived platform that:

1. Preserves Sambahamphe ancestry (genealogy) in a structured, verifiable, privacy-respecting form.
2. Records the organization's governance history (boards, committees, positions, terms).
3. Publishes history, Limbu/Kirant heritage, news, announcements and event records.
4. Archives photographs, videos and documents.
5. Lets authorized community members contribute, with editorial review.

The platform must outlive individual maintainers and committees. Data integrity, auditability and plain, maintainable code take priority over feature breadth.

## 2. Actors

| Actor | Description | Typical capabilities |
|---|---|---|
| **Visitor** (policy level 1) | Anonymous public user | Read public content, public genealogy (approved records of deceased people, plus living people only with publication consent), public boards, events, galleries |
| **Registered member** (level 2) | Account with verified email **or mobile number** | Everything public; **submit genealogy contributions** (new people, relationship corrections, photos, documents); request association with a family branch; request access to restricted information; track own submissions. Registration alone grants no private data |
| **Verified family member** (level 3) | Registered member with **approved access to one or more family branches** | Permitted information about living relatives in those branches (per privacy settings); report outdated information; claim own profile |
| **Contributor** | Member trusted to submit content drafts | Draft articles / stories, upload media to review queue |
| **Genealogy editor** (level 4) | Curates and approves genealogy records | Review & approve/reject/request correction on submissions, verify evidence, resolve duplicates and disputes, correct records (versioned), manage branches and approve branch-access requests |
| **Content editor** | Manages articles, heritage, announcements, events, galleries | Full content lifecycle, publish |
| **Organization manager** | Manages boards/committees — may be **scoped** to one regional board or gaau committee | Manage units, terms, positions, appointments within scope |
| **Administrator** | Runs the platform | Users, roles, settings, all modules |
| **Super administrator** | Technical owner (1–2 people) | Everything incl. role definitions, destructive maintenance |

**Organizational positions (Chairperson, Secretary…) are not application roles.** Holding a position grants no platform permission; permissions are assigned explicitly (see ADR-013).

## 3. Functional requirements

Priority: **M** = must (in planned phase), **S** = should, **C** = could / later.

### 3.1 Genealogy (highest domain priority)

| ID | Requirement | Pri |
|---|---|---|
| G-0 | **Scope: Sambahamphe male line only** (ADR-020). Recorded: lineage members (sons *and* daughters of lineage men, including adopted sons, plus **several founding ancestors**) and wives of lineage men. A daughter's record ends with her: her marriage, husband and children are not recorded. Descendants are recorded only through sons (biological or adopted). Wives' own ancestry is not recorded | M |
| G-1 | Person profile with optional fields: names (multiple, multi-script), gender (optional for spouses; **required (male/female) for lineage members** because it decides whether the line continues), birth/death dates **with precision and calendar** (BS/AD, exact/about/before/after/between), places, biography, notes, photo, clan of birth, branch(es) | M |
| G-2 | No field mandatory except one name (which may be "Unknown") | M |
| G-3 | Parent–child relationships stored independently of people, typed: biological, adoptive, step, foster, guardian, unknown | M |
| G-4 | Unions (marriage / partnership) with any number per person, order, start/end, end reason (divorce, widowed…) | M |
| G-5 | Children may be linked to a specific union (so half-siblings are distinguishable) but need not be | M |
| G-6 | Relationships carry confidence and status (accepted, disputed, rejected) plus cited sources | M |
| G-7 | Surname/clan never implies ancestry; clan is an attribute, lineage comes only from relationship edges | M |
| G-8 | Unlimited generations; queries bounded by requested depth, not schema | M |
| G-9 | Cycle prevention (a person cannot become their own ancestor) | M |
| G-10 | Family branches: named, nestable, optionally anchored to a founding ancestor | M |
| G-11 | Interactive tree: top-down descendant tree of the male line, plus a "my lineage" father-chain view to the founding ancestor, progressive expand/collapse, search, open profile, mobile-usable | M |
| G-12 | Relationship finder: shortest kinship path / common ancestor between two people | S |
| G-13 | Submission workflow (any registered member with verified email): search existing person → pick relationship anchor (or propose new branch) → submit → **automatic duplicate check** → Pending → Under review → Approved / Rejected / Needs correction. Superseded relationships are kept with status `superseded` | M |
| G-14 | Approved data is never silently overwritten: every change versioned, attributable, revertible | M |
| G-15 | Conflict handling: competing claims coexist as *disputed* until a reviewer resolves them, with rationale recorded | M |
| G-16 | Duplicate detection and **person merge** (with redirect from merged ID) | S |
| G-17 | Sources/evidence: documents, oral testimony, publications, linked to people and relationships | S |
| G-18 | Privacy: living people private by default; visibility per record and per field group; consent records; individual privacy settings; revocable access. Submitting someone's information never grants permission to publish it. Restricted data must not leak through search, APIs, **exports** or the tree view | M |
| G-19 | **Identity claim** (ADR-022): after registering, the user is asked "Are you already in the family tree?". A privacy-safe lookup (name + father's name + birth year, at most 3 masked matches) lets them claim a record, with a statement and evidence; an editor approves, which links the account and by default grants access to that person's branch. If there is no match, they attach the claim to a known ancestor. Registration never creates a person record | M |
| G-20 | Import from existing spreadsheets / GEDCOM; export GEDCOM for archival | S (import) / C (export) |
| G-21 | Kinship terms in Limbu/Nepali (e.g., how A is related to B) | C |
| G-22 | **Branch access requests:** registered member requests access to a family branch (stating their relation, optional evidence); a genealogy editor approves/rejects; access can be revoked or expire. Access to a branch covers its sub-branches | M |
| G-23 | **Add family member** (`My Family Tree → Add Family Member`, needs an approved identity link): pick a relationship to own record (Son, Daughter, Father, Mother, Spouse, Sibling); the wizard checks duplicates, offers to link an existing match, and turns the choice into change-request operations. The male-line rules apply: e.g. *Sibling* = child of own father (father must be recorded or proposed in the same request); *Spouse* only for a lineage man (daughters' marriages are not recorded); children cannot be added under a daughter | M |
| G-24 | **Minors** (ADR-023): living people need at least an approximate birth year; minors (< 18) can be added only by a linked parent/guardian or an editor; names/relationships visible to branch only, all else private, no photos, never public before 18 | M |

### 3.2 History & heritage CMS / blog / announcements

| ID | Requirement | Pri |
|---|---|---|
| C-1 | One content model for heritage articles, blog posts, news, activity reports, announcements, static pages | M |
| C-2 | Fields: title, slug, excerpt, rich body, featured image, embedded media, categories (hierarchical), tags, authors, publish date, SEO meta | M |
| C-3 | Workflow: Draft → In review → Scheduled/Published → Archived; contributors cannot self-publish | M |
| C-4 | Revision history with diff & restore | M |
| C-5 | Multilingual-ready (English, Nepali; Limbu in Sirijanga script later) — per-locale title/slug/body | M (model) / S (UI) |
| C-6 | Announcements: pin, expiry date, optional link to event | M |
| C-7 | Seed heritage categories: Sambahamphe History, Limbu History, Kirant Heritage, Limbu Language, Sirijanga Script, Cultural Traditions, Festivals & Rituals, Historical Personalities, Historical Publications, Community Stories | M |
| C-8 | Link articles to people (historical personalities), events, places | S |

### 3.3 Organizational governance

| ID | Requirement | Pri |
|---|---|---|
| O-1 | Configurable unit types (Central Board, Regional Board, Gaau Committee, Sub-committee, Advisory Council, …) with allowed parent types | M |
| O-2 | Hierarchical units (tree), each with location/region, active period | M |
| O-3 | Terms (tenures) per unit with start/end dates (BS and AD), linked to the general assembly that elected them | M |
| O-4 | **One organization-wide list of positions, the same on every board** (Q-8), with display order, office-bearer flag, max concurrent holders | M |
| O-5 | Appointments: person × unit × position × term, start/end dates, type (elected, nominated, acting, ex-officio), end reason | M |
| O-6 | A person may hold several positions across units; one exclusive position (e.g., Chairperson) cannot be double-filled for overlapping dates | M |
| O-7 | Current and historical board views; past board archive per term | M |
| O-8 | Public org chart | M |
| O-9 | Scoped administration (regional manager edits only their region and descendants) | M |
| O-10 | Membership register (member number, home gaau committee, status) | C — needs clarification (Q-6) |

### 3.4 Events

| ID | Requirement | Pri |
|---|---|---|
| E-1 | Event with title, slug, description, category, start/end (timezone Asia/Kathmandu, all-day support), venue/place, organizing unit(s), cover image, gallery | M |
| E-2 | Categories: Deusi-Bhailo, Picnic, General Assembly, Cultural Program, Meeting, Social Welfare, Fundraising, Other (configurable) | M |
| E-3 | **Lifecycle status** (upcoming/ongoing/completed) derived from dates; explicit override only for cancelled/postponed | M |
| E-4 | **Publication status** (draft/published/archived) independent of lifecycle | M |
| E-5 | Post-event report article and gallery linkage | S |
| E-6 | Registration, attendance, participants | C (Phase 4) |

### 3.5 Media & galleries

| ID | Requirement | Pri |
|---|---|---|
| M-1 | Images, video, audio, documents (PDF) stored in S3-compatible object storage; metadata in Postgres | M |
| M-2 | Metadata: title, description, caption, alt text, credit, date taken (with precision), place, historical period, visibility | M |
| M-3 | Reusable across articles, events, profiles, galleries | M |
| M-4 | Galleries organized by event, year, place, unit, category, period | M |
| M-5 | Direct-to-storage uploads (pre-signed), type/size validation, EXIF GPS stripping, responsive variants generated in background | M |
| M-6 | Video: link/embed (YouTube) initially; self-hosted transcoding later | M (embed) / C (transcode) |
| M-7 | Tag people in photos (links media to genealogy) | S |
| M-8 | Original files preserved untouched for archival | M |

### 3.6 Platform

| ID | Requirement | Pri |
|---|---|---|
| P-1 | Accounts: email **or mobile number** + password; verify at least one (email link / SMS code); password reset; optional Google sign-in later (ADR-024) | M (email) / M if Q-16 budget approved (SMS) |
| P-2 | RBAC with permissions and scoped role assignments | M |
| P-3 | Audit log of all writes (append-only) | M |
| P-4 | Global search across content, people (respecting privacy), events | S |
| P-5 | Notifications (email first; push for mobile later) | S |
| P-6 | Public site SEO: SSR/ISR, sitemaps, structured data, Open Graph | M |
| P-7 | Accessibility WCAG 2.2 AA on public site | M |
| P-8 | Backups with tested restores; data export of the whole archive | M |

## 4. Non-functional requirements

- **Integrity:** DB constraints, transactions, optimistic concurrency on editable records, no hard deletes of historical data.
- **Privacy:** compliance with Nepal's *Individual Privacy Act, 2075 (2018)* and general good practice; minimum data; explicit consent for living people's public data. Diaspora members may be in jurisdictions with stricter law (GDPR, UK) — design to the stricter standard.
- **Performance:** public pages p75 LCP < 2.5 s on mid-range Android over 4G; tree expand < 300 ms server time for depth-3 neighborhoods at 100k persons.
- **Scale assumptions:** persons 5k–100k over the platform's life; content in the low thousands; media tens of thousands of files; concurrent users in the low hundreds (spikes around festivals). A single Postgres instance is ample.
- **Cost:** a non-profit budget. Prefer low fixed-cost hosting and storage without egress fees.
- **Longevity:** mainstream, well-documented technologies; documented runbooks; data exportable in open formats (JSON, CSV, GEDCOM).
- **Localization:** UI and content in English and Nepali; Limbu (Sirijanga, Unicode block U+1900–U+194F) for content; Bikram Sambat dates displayed alongside AD.

## 5. Out of scope (for now)

Payments/donations, membership dues, chat/forums, DNA data, multi-tenant use by other clans, offline-first mobile editing. Each can be revisited once the core is stable.

## 6. Gaps found in the brief & open questions

These came up while analysing the brief. Items marked **(blocking)** affect the schema or Phase 1; others can be settled later.

| # | Question | Why it matters | Proposed default if unanswered |
|---|---|---|---|
| Q-1 ✅ | Who may see genealogy? | Drives privacy defaults and SEO | **Decided** — see [genealogy-access-policy.md](genealogy-access-policy.md) and §7 |
| Q-2 ✅ | Genealogy scope? | Determines what "in the tree" means | **Decided: male line only** — see §7, ADR-020 |
| Q-3 ✅ | Languages at launch? | Locale routing and translation UI | **Decided: English + Nepali** (UI and content). Limbu-script content supported as Unicode text; Limbu UI later |
| Q-16 | SMS gateway and budget? | Running cost, abuse risk | **Proposed:** Sparrow SMS for Nepali numbers (≈ NPR 5,000–6,000 for a 5,000-SMS pack); diaspora verifies by email. See hosting-and-costs §3 |
| Q-15 ✅ | Male-line details | Lineage rules, import | **Decided:** (a) daughters' husbands are not recorded; a daughter's record ends with her; (b) adopted sons continue the line; (c) several founding ancestors |
| Q-4 | Calendar: should historical dates be entered primarily in Bikram Sambat? | Date entry UX and conversion | Allow entry in either; store original + normalized AD range |
| Q-5 | What existing data exists? (spreadsheets, handwritten vamshawali, books, photo archives) Volume and format? | Import tooling priority; may justify moving genealogy earlier | Build a CSV importer in Phase 3; GEDCOM if any exists |
| Q-6 | Is there a formal membership register (member numbers, dues, home committee)? Should the platform own it? | Adds a Membership module; affects "verified family member" | Defer; "verified family member" is derived from approved branch access (G-22), not a separate membership register |
| Q-7 | What evidence must a member give when requesting branch access? (known relative vouches, gaau committee confirmation, documents?) | Trust model for living-relative data | Free-text relation + optional vouching relative; a genealogy editor (optionally branch-scoped) decides |
| Q-8 ✅ | Are positions the same on every board? | Position definition scope | **Decided: yes** — one position list for the whole organization |
| Q-9 | Hosting budget and who operates the servers long-term? | Infra choice | **Proposed** in [../operations/hosting-and-costs.md](../operations/hosting-and-costs.md): Option A, ≈ NPR 60,000/year; awaiting the committee's approval |
| Q-10 | Domain name, logo, brand colors, existing photography? | Phase 1 web foundation | **Logo resolved:** supplied logo used on web and admin; palette derived from it (`packages/ui` theme). Domain name and photography still open |
| Q-11 | Should Phase ordering stand? Genealogy is the core value but is scheduled 3rd. | Roadmap | Build shared Person core in Phase 1–2, full genealogy in Phase 3 (see roadmap) |
| Q-12 | Video: are there large video archives to host, or is YouTube acceptable? | Storage & transcoding cost | YouTube/Vimeo embeds first |
| Q-13 | Do regional boards span countries (e.g., diaspora in Hong Kong, UK, Gulf)? | Place model, timezones | Support any country in Place; events store their own timezone |
| Q-14 | Should publicly visible board members show photos and contact info? | Consent for living office-bearers | **Default applied in M2.2, awaiting confirmation:** name + position public on board pages (minors never shown); no dates, places or contact details; photos with consent once media exists (M2.3) |

## 7. Decisions recorded

| Date | Question | Decision | Effect on design |
|---|---|---|---|
| 2026-11-07 | Q-1 Visibility | Adopted [genealogy-access-policy.md](genealogy-access-policy.md): public historical genealogy + registered-member contributions + branch-verified family access + editor-controlled approval | Registered members may submit change requests; access to living people is per family branch (`branch_access` table); genealogy editor and reviewer merged into one role; relationships gain status `superseded`; duplicate check runs at submission |
| 2026-11-07 | Q-2 Scope | Male line only | Lineage members have exactly one accepted father, so the lineage is a true tree (ADR-020); `persons.lineage_role`; children can only be added under a lineage man; branch membership inherited from father |
| 2026-11-07 | Q-3 Languages | English + Nepali at launch | `en` and `ne` locales for UI and content; Limbu script stored as Unicode text |
| 2026-11-07 | Backend framework | NestJS | ADR-019 |
| 2026-11-07 | Registration & contribution flow | Adopted [member-registration-flow.md](member-registration-flow.md) | Accounts link to persons via reviewed `user_person_links` (ADR-022); privacy-safe claim lookup; minors rule (ADR-023); email-or-mobile registration (ADR-024); "Add family member" wizard |
| 2026-11-07 | Reconciling the two policies on *who may submit* | The access policy lets any registered member submit; the flow puts "Add family member" after verification | **Both apply:** any registered member can submit suggestions anchored to records they can see (in practice public, deceased ancestors). The "My Family Tree" wizard, which works relative to the member's own living record, needs an approved identity link. Confirmed by the organization (2026-11-07) |
| 2026-11-07 | Q-15 Male-line details | Daughters' husbands not recorded; adopted sons continue the line; several founding ancestors | `lineage_role` is now lineage or spouse (no reference role); unions only for lineage men; `persons.is_founding_ancestor` flag (ADR-020) |
| 2026-11-07 | Q-8 Positions | Same positions on every board | `position_definitions` is one organization-wide list (no per-type or per-unit positions) |
| 2026-11-07 | Q-16 SMS & hosting budget | Expected 500–800 users in year 1 | See [../operations/hosting-and-costs.md](../operations/hosting-and-costs.md) |
