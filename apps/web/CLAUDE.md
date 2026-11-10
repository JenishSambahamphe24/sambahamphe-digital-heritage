# web

Public site, Next.js 16 App Router (ADR-007). SEO-critical. Read the root `CLAUDE.md` first.

## Shape

- Pages live under `src/app/[locale]/`; route files are **thin**: metadata + `setRequestLocale` + render the feature component. The real UI is in `src/features/<feature>/components/`.
- Locales `en`, `ne` (`src/i18n/routing.ts`). `src/proxy.ts` (Next 16's renamed middleware) redirects `/` by browser language. Use `Link`, `useRouter` from `#/i18n/navigation`, never `next/link`, so URLs keep their locale.
- All copy in `messages/en.json` and `messages/ne.json` (same keys in both; snake_case, feature prefix). Nepali text needs review by the organization.
- `/api/*` is forwarded to the API (`next.config.ts` rewrite locally, Caddy in production) so the `sid` cookie is same-origin. Browser code uses `apiClient` from `#/lib/api-client`; server code must create a client with an absolute URL.
- Forms: TanStack Form; field rules from `@repo/contracts` via `AuthValidationHelper`, messages translated. Show API errors with `ProblemMessageHelper.keyFor(code)`, never the server's English text.
- Personal pages (auth, account) set `robots: noindex`. Public content pages fetch first-paint data on the server.
- Fonts: Noto Sans / Devanagari / Limbu / Serif via `next/font`, exposed as `--font-app-*` for the `@repo/ui` theme.

## Commands

```bash
pnpm --filter web dev        # :3000 (API must run on :3001)
pnpm --filter web build      # production build; pre-renders both locales
pnpm --filter web typecheck  # next typegen + tsc
```
