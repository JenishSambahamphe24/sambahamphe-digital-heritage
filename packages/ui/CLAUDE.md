# @repo/ui

Design tokens and shared React components for `apps/web` and `apps/admin`.

- **Tokens** live in `src/styles/theme.css` (Tailwind v4 `@theme`). Apps import it with `@import "@repo/ui/theme.css";` and add `@source "../../../packages/ui/dist";` so Tailwind sees the classes used here. The palette is derived from the organization's logo (ink blue `#2c3090`) and checked against WCAG AA; change colors here only.
- Components use semantic tokens only (`bg-primary`, `text-foreground-muted`), never raw palette colors or arbitrary values.
- One component per file, named `interface <Component>Props`, function declarations (root CLAUDE.md).
- `cn()` is the one helper kept as a plain function: it is called in nearly every component.
- Components that use hooks or Radix start with `"use client"` so they work inside Next.js server components.
- Only promote something here when both apps need it; app-specific components stay in the app.
