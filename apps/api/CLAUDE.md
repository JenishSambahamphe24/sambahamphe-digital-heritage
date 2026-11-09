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

## Config

- Every env var is declared in `src/core/config/env.schema.ts` and documented in `.env.example`. The app **refuses to start** on invalid config and lists every bad field.
- Read config only through the injected `AppConfig` getters, never `process.env` in feature code.

## Errors

- Throw `AppException(status, code, title, detail?, errors?)` for expected failures. `code` is a stable snake_case string clients may switch on (`docs/api/api-conventions.md` §3).
- Everything is rendered as `application/problem+json` by `ProblemDetailsFilter`, with `type: urn:sambahamphe:problem:<code>` and the request id.
- Unexpected errors become a generic `500 internal_error`. Their message is logged, never returned.

## Logging

- Use Nest's `Logger` (backed by pino via `nestjs-pino`): `this.logger.warn({ err, requestId }, "message")`. No `console.log` outside `main.ts`.
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
