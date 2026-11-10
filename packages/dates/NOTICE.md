# Third-party data

`src/bs-calendar.data.ts` and `test/fixtures/bs-ad-reference.json` are derived from
[medic/bikram-sambat](https://github.com/medic/bikram-sambat) (`test-data/daysInMonth.json`
and `test-data/toBik_euro.json`, commit `2bb4363`, 2026-06-04),
Copyright Medic Mobile, licensed under the
[Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0).

Changes: the month-length table was converted from JSON to a TypeScript module; the reference
pairs were re-serialized with sorted keys. The conversion code in this package is our own.

Coverage is 1970–2090 BS (13 April 1913 – April 2034 AD). Nepal's calendar committee revises
month lengths for future years, so the table must be refreshed from upstream periodically
(see `docs/database/schema-design.md` §1.1).
