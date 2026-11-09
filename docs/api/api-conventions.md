# API Conventions

Status: **Draft for review** (Phase 0) · Last updated: 2026-11-07

Applies to every endpoint of `apps/api`. Web, admin and mobile clients rely on these rules; changing them is a breaking change.

---

## 1. Basics

| Rule | Convention |
|---|---|
| Style | REST over HTTPS, JSON (`application/json; charset=utf-8`) |
| Base path | `/api/v1` — major version in path; additive changes don't bump it |
| Resource paths | plural, kebab-case nouns: `/persons`, `/org-units`, `/change-requests` |
| Nesting | at most one level when the child only makes sense in the parent: `/org-units/{id}/terms`. Otherwise top-level with filters: `/appointments?orgUnitId=` |
| Actions that are not CRUD | sub-resource verbs as `POST`: `/change-requests/{id}/approve`, `/persons/{id}/merge`, `/media/{id}/complete` |
| JSON field names | camelCase |
| IDs | UUID strings (UUIDv7). Content/events also addressable by slug: `/content/by-slug/{locale}/{slug}` |
| Dates | `timestamptz` → ISO 8601 UTC (`2026-11-07T04:15:00Z`); calendar dates → `YYYY-MM-DD`; fuzzy dates → `FuzzyDate` object (see §8) |
| Enums | lower snake_case strings (`under_review`) |
| Nulls | absent optional fields are returned as `null`, not omitted (stable shapes for clients) |
| Admin vs public | Same resources; what you see depends on permissions and privacy. Admin-only endpoints live under `/api/v1/admin/...` only when the shape genuinely differs (e.g., audit log, user management) |

## 2. HTTP methods & status codes

| Method | Use | Success |
|---|---|---|
| `GET` | read | `200` |
| `POST` | create / action | `201` + `Location` for creates; `200`/`202` for actions (`202` when work is queued) |
| `PATCH` | partial update (JSON merge semantics on the documented fields) | `200` with updated resource |
| `PUT` | full replacement of ordered sub-collections only (e.g., gallery item order) | `200` |
| `DELETE` | soft delete / retract where allowed | `204` |

Error codes: `400` malformed, `401` unauthenticated, `403` forbidden, `404` not found (also used when a resource exists but is hidden by privacy — never reveal existence), `409` version conflict / state conflict, `412` `If-Match` mismatch, `422` validation failed, `429` rate limited, `500` unexpected.

## 3. Errors — RFC 9457 Problem Details

```json
{
  "type": "urn:sambahamphe:problem:validation_error",
  "title": "Validation failed",
  "status": 422,
  "code": "validation_error",
  "detail": "2 fields are invalid.",
  "instance": "/api/v1/persons",
  "requestId": "01JC9X…",
  "errors": [
    { "path": ["names", 0, "fullName"], "code": "too_small", "message": "Name is required." },
    { "path": ["birthDate", "month"], "code": "too_big", "message": "Month must be 1–12." }
  ]
}
```

- `type` is a URN (`urn:sambahamphe:problem:<code>`) until the organization has a domain to host problem documentation pages.
- `code` is a stable machine-readable string clients may switch on (`validation_error`, `version_conflict`, `genealogy_cycle`, `position_already_filled`, `invalid_state_transition`, …).
- Domain errors map to codes in one place (`core/errors`). Database constraint violations (e.g., exclusion constraint on appointments) are translated to domain codes, never leaked raw.
- Messages are English; clients localize by `code` where it matters.

## 4. Pagination

**Cursor pagination** for feeds and large lists (public lists, genealogy search, audit log):

```http
GET /api/v1/content?type=news&limit=20&cursor=eyJwIjoiMjAyNi0xMS0wMVQuLi4ifQ
```
```json
{ "data": [ … ], "page": { "nextCursor": "…", "limit": 20 } }
```

**Offset pagination** where admins need page numbers and totals (admin tables of bounded size):

```http
GET /api/v1/admin/users?page=3&pageSize=50
```
```json
{ "data": [ … ], "page": { "page": 3, "pageSize": 50, "total": 812 } }
```

Defaults: `limit`/`pageSize` 20, max 100. Cursors are opaque base64url; clients must not parse them.

Single resources are returned **unwrapped** (no `data` envelope); collections always use `{ data, page }`.

## 5. Filtering, sorting, search, field expansion

- Filters as plain query params named after fields: `?status=published&categoryId=…&from=2026-01-01&to=2026-12-31`. Multiple values comma-separated: `?status=draft,in_review`.
- Sorting: `?sort=-publishedAt,title` (prefix `-` = descending). Each endpoint documents its allowed sort fields; others → `400`.
- Full-text: `?q=deusi`.
- Related data: `?include=translations,categories` from a documented allow-list per endpoint. No arbitrary deep expansion.
- Locale: `?locale=ne` or `Accept-Language`. Response includes `locale` actually served (fallback may apply).

## 6. Concurrency & idempotency

- Versioned resources return `ETag: "v<version>"` and a `version` field.
- `PATCH`/`DELETE` on versioned resources **require** `If-Match: "v<version>"` (or `version` in body for mobile convenience). Mismatch → `412` with the current version in the problem body.
- `POST` endpoints that create submissions or start jobs accept `Idempotency-Key` (UUID); repeated keys within 24 h return the original response.

## 7. Authentication & authorization

- Server-side sessions (ADR-006). Web: HttpOnly cookie `sid`; admin: `admin_sid`. Unsafe methods (`POST`, `PATCH`, `PUT`, `DELETE`) with a session cookie require an allow-listed `Origin` header and `Content-Type: application/json`, otherwise `403 csrf_rejected`.
- Mobile: send `X-Client: mobile` on login to receive the session token in the body; then `Authorization: Bearer <token>`. No refresh endpoint: the session slides while in use.
- Endpoints declare required permission(s) in the controller via a decorator, e.g. `@RequirePermission('appointment:create')`; scoped checks happen in services.
- Anonymous access is allowed only on explicitly marked public endpoints (`@Public()`); default is authenticated.

## 8. Shared schemas

```ts
// packages/contracts/src/common/fuzzy-date.ts
FuzzyDate = {
  calendar: 'BS' | 'AD';
  qualifier: 'exact' | 'about' | 'before' | 'after' | 'between' | 'calculated';
  year: number; month?: number; day?: number;
  end?: { year: number; month?: number; day?: number };  // required iff qualifier = 'between'
  text?: string;
  // response only (computed):
  ad?: { from: string; to: string };   // normalized ISO dates
  display?: { en: string; ne: string };
}

LocalizedText = Record<Locale, string>   // { en: "...", ne: "..." }

MediaImage = {                            // every image in a response is this full object, never a bare URL (ADR-025)
  id: string; url: string; width: number; height: number;
  blurHash: string | null; alt: string | null;
  variants?: Record<'thumb' | 'sm' | 'md' | 'lg' | 'xl', string>;
}

RedactedPerson = {                        // used when a person is in a response but hidden
  id: string;                             // opaque stable id (not the real UUID for anonymous viewers)
  redacted: true;
  label: 'Living person' | 'Private';
}
```

Privacy-redacted fields are returned as `null` with a sibling `redactedFields: string[]` so clients can show "hidden" rather than "unknown".

## 9. Rate limiting

Redis-backed. Default 300 req/min per IP for anonymous reads, 600/min per user; strict buckets on `/auth/login` (5/min per account + 20/min per IP), `/auth/register`, `/auth/password-reset` and `/media/uploads`. Responses include `RateLimit-*` headers (IETF draft) and `Retry-After` on `429`.

## 10. Documentation

- OpenAPI 3.1 generated from `packages/contracts` at build time → `docs/api/openapi.json`, served at `/api/docs` in non-production.
- Each endpoint documents: permission required, privacy behavior, error codes, pagination style.
- Breaking changes require a new major path (`/api/v2`) and a deprecation window with `Deprecation`/`Sunset` headers on v1.

## 11. Initial resource map

| Area | Endpoints (abridged) |
|---|---|
| Auth | `POST /auth/register` (email and/or phone), `/auth/verify-phone`, `/auth/resend-code`, `/auth/login` (email or phone), `/auth/logout`, `GET /me/sessions`, `DELETE /me/sessions/{id}`, `/auth/verify-email`, `/auth/password-reset`, `/auth/password-reset/confirm`; `GET /me` |
| Users & access | `GET /admin/users?q=&page=&pageSize=` (offset paging), `GET /admin/users/{id}/role-assignments`, `GET /admin/roles` (system roles + permissions; synced from code), `POST /admin/role-assignments` (`{ userId, roleKey, scopeType, orgUnitId?, branchId?, expiresAt? }`), `DELETE /admin/role-assignments/{id}`. Verified family membership is branch access (ADR-021), not a user flag.
| Persons | `GET /persons?q=&branchId=&clanId=`, `GET /persons/{id}`, `GET /persons/{id}/family` (parents, unions, children, siblings), `GET /persons/{id}/history` (revisions) |
| Identity claims | `POST /identity-claims/lookup` (name + father's name + birth year → ≤3 masked matches, 10/day), `POST /identity-claims`, `GET /me/identity-claims`, `GET /admin/identity-claims?status=requested`, `POST /admin/identity-claims/{id}/approve` (option `grantBranchAccess`, default true), `/reject`, `/revoke` |
| My family tree | `GET /me/family` (own record's family unit), `POST /me/family/members` (relationship + person data → creates a change request; returns duplicate candidates first if any) |
| Genealogy tree | `GET /genealogy/persons/{id}/tree?up=2&down=2`, `GET /genealogy/persons/{id}/ancestors?depth=`, `GET /genealogy/persons/{id}/descendants?depth=`, `GET /genealogy/relationship?from=&to=` |
| Branches & sources | `GET /branches`, `GET /branches/{slug}`, `GET /sources/{id}`, `GET /genealogy/persons/{id}/lineage` (father-chain to founder) |
| Branch access | `POST /branches/{id}/access-requests` (registered member), `GET /me/branch-access`, `GET /admin/branch-access?status=requested`, `POST /admin/branch-access/{id}/approve`, `/reject`, `/revoke` |
| Duplicate check | `POST /genealogy/duplicate-check` (name, birth year, father) → likely matches; also run automatically when a change request is submitted |
| Contributions | `POST /change-requests`, `GET /change-requests?status=&mine=true`, `GET /change-requests/{id}`, `PATCH /change-requests/{id}` (revise while pending/needs_correction), `POST /change-requests/{id}/claim`, `/approve`, `/reject`, `/request-correction`, `/withdraw`, `POST /change-requests/{id}/comments` |
| Places | `GET /places?q=`, `GET /places/{id}` |
| Organization | `GET /org-units` (tree), `GET /org-units/{slug}`, `GET /org-units/{id}/board?at=2026-11-07` or `?termId=`, `GET /org-units/{id}/terms`, `GET /positions?unitTypeId=`, `POST/PATCH /appointments`, `POST /appointments/{id}/end` |
| Content | `GET /content?type=&categoryId=&tag=&q=`, `GET /content/by-slug/{locale}/{slug}`, `POST /content`, `PATCH /content/{id}`, `POST /content/{id}/submit`, `/publish`, `/schedule`, `/archive`, `GET /content/{id}/revisions`, `POST /content/{id}/revisions/{version}/restore`, `GET /categories`, `GET /tags` |
| Events | `GET /events?when=upcoming|past&categoryId=&orgUnitId=`, `GET /events/by-slug/{locale}/{slug}`, `POST/PATCH /events`, `POST /events/{id}/cancel` |
| Media | `POST /media/uploads`, `POST /media/{id}/complete`, `GET /media?q=&kind=`, `PATCH /media/{id}`, `GET /galleries`, `GET /galleries/{slug}`, `PUT /galleries/{id}/items` |
| Search | `GET /search?q=&types=content,persons,events` |
| Audit | `GET /admin/audit-log?entityType=&entityId=&actorId=&action=&cursor=&limit=` (cursor paging, newest first) |
| Health | `GET /health/live`, `GET /health/ready` |

Genealogy writes are **not** exposed as direct `POST /persons` / `POST /parent-child` endpoints; they are change-request operations (ADR-012). Editors' UI submits a change request that auto-approves.

### Example: tree neighborhood

```http
GET /api/v1/genealogy/persons/0193…/tree?up=2&down=1
```
```json
{
  "focusId": "0193…",
  "nodes": [
    { "id": "0193…", "displayName": "…", "lifespan": "1932–2004", "gender": "male",
      "photoUrl": "…", "redacted": false, "hasMoreUp": false, "hasMoreDown": true }
  ],
  "unions": [ { "id": "…", "partnerIds": ["…", "…"], "kind": "marriage" } ],
  "parentChild": [ { "parentId": "…", "childId": "…", "kind": "biological", "unionId": "…", "status": "accepted" } ]
}
```
