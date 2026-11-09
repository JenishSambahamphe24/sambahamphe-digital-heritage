# @repo/dates

Bikram Sambat ↔ AD conversion and fuzzy historical dates (ADR-011). Pure TypeScript, no runtime dependencies except `zod` (peer).

- `BikramSambatHelper` converts exact dates within **1970–2090 BS** and throws `DateOutOfRangeError` outside it. Never guess outside the table.
- `fuzzyDateSchema` validates a `TFuzzyDate`; `FuzzyDateHelper.normalize()` gives the AD sort range (`approximate: true` before 1970 BS); `FuzzyDateFormatHelper` formats in `en` / `ne`.
- `src/bs-calendar.data.ts` is generated from upstream data (see `NOTICE.md`). Do not edit it by hand; refresh it from upstream and re-run the reference test.
- Any change to conversion must keep `test/bikram-sambat.reference.test.ts` green: all 30,572 reference pairs, both directions.
- Nepali wording (qualifiers, word order) awaits the organization's review.
