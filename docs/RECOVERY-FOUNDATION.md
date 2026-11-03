# Smart Pro System Cards — recovery foundation

**Status:** source recovery in progress; not a Home Assistant release.

## Verified historical source
- Last supplied historical package: `smart-pro-cards-alpha-10(1).zip` (`0.1.0-alpha.10`)
- JavaScript member: `smart-pro-cards.js`, 85,397 bytes
- SHA-256 of extracted JavaScript: `db611964bab281eb0d7e67e5f137189b6dee87a5c0bd5931daaadc9f128177a8`
- Existing custom elements: `smart-pro-light-card`, `smart-pro-cover-card`, `smart-pro-thermostat-card`
- The code is recovered locally from the user's historical ZIP, but **has not yet been imported into this branch**. Never present the branch as a completed recovery until the exact source hash is checked in GitHub.

## Guardrails
- Do not edit or merge into `main` during source recovery.
- Do not change any live Home Assistant resource URL or HACS setup yet.
- Preserve the original alpha.10 source byte-for-byte before refactoring.
- Align `hacs.json` filename only when `smart-pro-cards.js` actually exists in the branch.
- The separate Smart Pro Design Studio uses a preview adapter, not direct Home Assistant service calls.

## Planned visual system
- Themes: **Night**, **Graphite**, **Light**.
- Surface modes: **Solid**, **Soft Glass**, **Glass**, with readable fallbacks.
- Consistent semantic device states: on/off, unknown, unavailable, loading, evidence-backed warnings.
- Real Home Assistant behavior is authoritative; Design Studio preview follows it.

## Recovery checks before a PR can be merged
1. Import exact alpha.10 JavaScript and verify SHA-256.
2. Add original archive hashes and a changelog of the 10 supplied releases.
3. Add JS syntax, custom-element registration and HACS filename checks.
4. Document manual Lovelace examples and identify compatibility limits.
5. Run targeted Home Assistant functional/visual QA before publishing any release.

The historical ZIPs and the completed local recovery package remain available in the project conversation; they are not part of this GitHub branch yet.
