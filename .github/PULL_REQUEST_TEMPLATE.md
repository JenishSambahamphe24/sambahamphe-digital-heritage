<!--
  Don't delete sections. If one doesn't apply, write "N/A — <reason>".
-->

## Summary

<!-- WHAT changed and WHY, in one paragraph. -->

**Closes:** <!-- issue / "N/A" -->

## Type of change

- [ ] 🐛 Bug fix
- [ ] ✨ Feature
- [ ] 💥 Breaking change (API contract / DB / behavior a client depends on)
- [ ] ♻️ Refactor (no behavior change)
- [ ] 🔒 Security / privacy
- [ ] 🧱 Infra / CI
- [ ] 📝 Docs
- [ ] 🧹 Chore / deps

## Convention gates (see CLAUDE.md — a violation blocks merge)

- [ ] **Privacy:** person data goes through the privacy policy; no living-person data reachable without the right access; no PII logged. *(or N/A)*
- [ ] **Genealogy integrity:** writes go through change requests; nothing approved is deleted or silently overwritten. *(or N/A)*
- [ ] **Helpers** are classes with static methods in `<name>.helper.ts`; no magic values. *(or N/A)*
- [ ] **Deps** via catalogs; `packages/*` use `peerDependencies`. *(or N/A)*
- [ ] **Comments:** no restate-the-code or AI-authorship comments, no `console.log`, no commented-out code.
- [ ] **Docs** updated if a design decision changed (ADR / schema / API conventions). *(or N/A)*

## Database & API contract

- [ ] N/A — no DB or contract change.
- [ ] Migration is named, and hand-written constraints are covered by an integration test.
- [ ] Contracts (`@repo/contracts`) updated on producer and consumer sides.

## Verification

- [ ] Typecheck, lint and tests pass for affected workspaces.
- [ ] Exercised the happy path **and** at least one failure path.

**Commands run + what I observed:**

```

```

## Screenshots / sample requests

<!-- UI: before/after. API: sample request/response. N/A otherwise. -->
