# api

NestJS 12 REST API for web, admin and mobile. Default port `3001`. Read the root `CLAUDE.md` first; these rules add to it.

## Runtime shape

- **ESM** (`"type": "module"`, `module: nodenext`). Relative imports **must** end in `.js`, even though the file is `.ts`: `import { AppConfig } from "./app-config.js"`. TypeScript resolves it to the `.ts` file; Node needs the `.js` at runtime.
- `src/main.ts` loads `.env` (if present), validates it, then calls `AppFactory.create(env)` and listens. **Tests use the same `AppFactory`**, so they run the real middleware, filters and prefix.
- Routes live under `/api/v1`, except `GET /health/live` and `GET /health/ready`.

## Layout

```
src/
  main.ts, app.module.ts, app.factory.ts
  core/                       # cross-cutting, no business logic
    config/                   # env.schema.ts (Zod), EnvHelper, AppConfig (typed getters)
    database/                 # DatabaseService (pool + drizzle `db`), schema/<table>.schema.ts
    errors/                   # AppException, ProblemDetailsHelper, global ProblemDetailsFilter
    logging/                  # pino options, request-id
  modules/<domain>/           # one folder per domain module
drizzle/                      # migrations (generated + custom SQL), meta/ is generated
test/                         # integration tests (*.int.test.ts) + support/
```

Small modules stay flat (`health/`). A module with real business logic uses the layering in `docs/architecture/system-design.md` §3: `http/` (controllers), `application/` (services), `domain/` (pure logic), `internal/` (repositories, raw SQL — private to the module).

## Auth (ADR-006)

- **Every route is private by default.** The global `SessionGuard` returns `401 unauthenticated` unless the handler or controller is marked `@Public()`. On public routes the viewer is still resolved when a session exists (privacy depends on who is looking).
- Read the signed-in user with `@CurrentAuth() auth: IAuthContext` — only on non-public routes.
- Global guard order: rate limit → CSRF → session. Unsafe methods from browser clients need an allow-listed `Origin` and a JSON body; mobile (`X-Client: mobile` + Bearer) skips the Origin check.
- Cookies are written and cleared **only** through `SessionCookieHelper`.
- Auth-sensitive public endpoints add `@Throttle({ default: AUTH_RATE_LIMIT })`.
- Never reveal whether an email exists: registration, resend and reset answer `202 { status: "check_email" }` either way.

## Access control

- Permissions and system roles are defined in `modules/access/access.catalog.ts` and synced to the database at startup. Add a permission there; never insert one by hand.
- `@RequirePermission(PERMISSION.x)` on a route checks a **global** grant. Checks about a specific board or branch go in the service: `accessService.can(request, permission, { orgUnitPath, branchPath })`.
- `super_admin` holds every permission implicitly. Only a super admin can grant or revoke it, and the last one can't be removed.
- The admin CMS (`X-Client: admin`) requires at least one active role, checked at login and on every request.
- First super admin: `pnpm --filter api build && pnpm --filter api admin:bootstrap --email <verified address>` (refuses once one exists).

## Audit

- Record domain events with `audit.record({ action, entityType, entityId, changes }, tx)` **inside the transaction of the change**. Actor, request id, hashed IP and user agent are filled in from the request context.
- `changes` holds ids, keys and statuses only — never names, emails, phones or birth dates.
- `audit_log` is append-only, enforced by a database trigger.

## Background work (worker)

- `src/worker.ts` is a second entrypoint (no HTTP). `pnpm --filter api dev:worker` runs it; root `pnpm dev` runs API and worker together.
- To trigger async work, write to the outbox **inside the same transaction** as the data change: `outbox.enqueue(tx, OUTBOX_TOPIC.sendEmail, job)`. Never add BullMQ jobs directly from a request.
- Job processors live in `src/workers/`. Never log email recipients or job payloads.

## Request/response schemas and OpenAPI

- Zod schemas come from `@repo/contracts` (see its CLAUDE.md). Validate with `@Body({ schema })` / `@Query({ schema })` / `@Param({ schema })`; failures become `422 validation_error` with per-field `errors`.
- Return data **parsed through the response schema** (for lists, the list schema), and document it on the route: `@ApiOkResponse({ standardSchema: xResponseSchema })` (`ApiCreatedResponse`, `ApiAcceptedResponse`, `ApiNoContentResponse` likewise). Every controller also gets `@ApiTags(...)` and `@ApiProblemResponse()`.
- After changing an endpoint or a contract: `pnpm openapi:generate` from the root, and commit `packages/api-client/openapi.json`. `test/openapi.test.ts` fails if you forget.
- Interactive docs: `http://localhost:3001/api/docs` (not in production).

## Config

- Every env var is declared in `src/core/config/env.schema.ts` and documented in `.env.example`. The app **refuses to start** on invalid config and lists every bad field.
- Read config only through the injected `AppConfig` getters, never `process.env` in feature code.

## Errors

- Throw `AppException(status, code, title, detail?, errors?)` for expected failures. `code` is a stable snake_case string clients may switch on (`docs/api/api-conventions.md` §3).
- Everything is rendered as `application/problem+json` by `ProblemDetailsFilter`, with `type: urn:sambahamphe:problem:<code>` and the request id.
- Unexpected errors become a generic `500 internal_error`. Their message is logged, never returned.

## Logging

- Use Nest's `Logger` (backed by pino via `nestjs-pino`): `this.logger.warn({ err, requestId }, "message")`. No `console.log` outside startup config errors (`EnvHelper.loadOrExit`).
- Every response carries `X-Request-Id`; a safe caller-supplied id is reused.
- Never log personal data (names, birth dates, emails, phones). Authorization and cookie headers are redacted.

## Database (Drizzle)

- Inject `DatabaseService`; repositories use `this.database.db`. `DatabaseService.ping()` is for health checks only.
- `pnpm db:generate --name=<snake_case_change>` after editing a schema file. `pnpm db:generate --custom --name=<…>` for SQL Drizzle can't express; write it in the generated file and list the constraint in `docs/database/schema-design.md` §13.
- `pnpm db:migrate` applies migrations to the database in `.env`.

## Tests

- Vitest. Unit tests sit next to the code (`*.test.ts`); integration tests in `test/*.int.test.ts`.
- Integration tests use **a real Postgres** via Testcontainers (`TestDatabase.start()` runs all migrations). Docker must be running. Never mock the database.
- Vitest compiles with SWC (`vitest.config.ts`) because Vite's default transform drops the decorator metadata Nest needs for injection.

## Commands

```bash
pnpm --filter api dev         # watch mode on :3001 (needs `pnpm infra:up`)
pnpm --filter api build       # nest build → dist/
pnpm --filter api test        # unit + integration (Docker required)
pnpm --filter api typecheck
pnpm db:migrate               # root shortcut
```
