# @repo/contracts

Zod schemas for every API request and response, shared by the API and all clients (ADR-005).

- One schema per file, grouped by domain: `<domain>/<action>-<resource>.request.dto.ts`, `<domain>/<resource>.response.dto.ts`, plus `common/` for shared shapes. Export the schema (`registerRequestSchema`) and its type (`TRegisterRequest`).
- List endpoints get an explicit list schema (`{ data, page }`) so the OpenAPI document and client are exact.
- Limits that both sides enforce (password length, locales) live here, not in the API.
- `src/index.ts` re-exports every file. After changing a schema, run `pnpm openapi:generate` from the root and commit the updated `packages/api-client/openapi.json`.
