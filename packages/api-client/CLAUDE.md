# @repo/api-client

Typed client for the API: types are generated from `openapi.json` (`openapi-typescript`), calls go through `openapi-fetch`.

- `openapi.json` is generated — never edit it. Run `pnpm openapi:generate` from the repo root after any endpoint or contract change; the API's freshness test fails otherwise.
- `src/generated/` is produced by `pnpm generate` (run automatically by build, typecheck, lint and test) and is git-ignored.
- Create clients with `ApiClientFactory.create({ baseUrl, client })`. Browser code may use the site's own origin; server-side code (Next.js rendering) must pass an absolute URL.
