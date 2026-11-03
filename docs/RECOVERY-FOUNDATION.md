# Smart Pro System Cards — alpha.10 recovery checkpoint

**Status:** original historical source imported and Git blob verified; Home Assistant runtime / HACS deployment QA is pending.

## Provenance
- Source: the user's archived `smart-pro-cards-alpha-10(1).zip`, originally dated 2026-08-01.
- ZIP member: `smart-pro-cards.js`, **85,397 bytes**.
- SHA-256 (original ZIP member): `db611964bab281eb0d7e67e5f137189b6dee87a5c0bd5931daaadc9f128177a8`.
- Expected + verified Git blob SHA-1: `2b4218d2c924532b0c213372ac3a07650538d1d8`.
- The committed root `smart-pro-cards.js` is byte-identical to the ZIP member. No refactoring or design changes were applied.
- Historic archive SHA-256 values for alpha.1 through alpha.10 are recorded in `legacy/SHA256SUMS.txt`. The 10 original ZIPs are retained outside this repo in the user-provided recovery package.

## Recovered card tags
- `custom:smart-pro-light-card`
- `custom:smart-pro-cover-card`
- `custom:smart-pro-thermostat-card`

## Repository corrections
- Correct `hacs.json` filename: `smart-pro-cards.js`.
- Remove the old empty `smart_pro_cards.js` placeholder.
- `package.json` and `tests/smoke.cjs` provide source-integrity, JS syntax, card registration and manifest checks.
- `.github/workflows/cards-recovery-checks.yml` runs `npm test` on PRs and recovery branch pushes.

## Guardrails before merge/release
1. Keep the recovery PR as a draft until the source and CI checks are reviewed.
2. Treat automated smoke checks as **static QA only**, not Home Assistant compatibility proof.
3. Do not alter existing Home Assistant resource URLs, HACS installations or any live dashboard.
4. Do not add or assume an OSS license or third-party redistribution rights without the repository owner's choice.
5. In a separate milestone, design themes Night / Graphite / Light, surfaces Solid / Soft Glass / Glass and a Design Studio preview adapter. **None of these are implemented in alpha.10**.

The main branch must remain unchanged until explicitly reviewed and merged.
