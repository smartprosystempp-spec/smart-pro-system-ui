# Experimental themed Light Card — runtime candidate

**Status: draft-only. Not a HACS release and not approved for live Home Assistant installation.**

## Why this exists
The owner reviewed the independent Light Visual Lab and approved the direction of Night / Graphite / Light and Solid / Soft Glass / Glass. This milestone connects the *existing* Lovelace Light Card to the canonical design token palette in a generated experimental runtime while keeping the recovered alpha.10 source immutable.

## Source and generated candidate

- Immutable source: `smart-pro-cards.js` — original alpha.10 from the user's ZIP (SHA-256 `db611964bab281eb0d7e67e5f137189b6dee87a5c0bd5931daaadc9f128177a8`).
- Canonical design palette: `design/themes.json`.
- Builder: `node design/build-light-runtime.cjs`.
- Candidate output: `dist/smart-pro-cards-themed.js` (generated, intentionally untracked).
- GitHub Actions on Draft PR #3 attaches the candidate as `smart-pro-light-runtime-candidate`.

The builder changes only the Light Card rendering/style section. Cover and Thermostat class text remains byte-identical to the alpha.10 source. Service-call methods, brightness logic and card density are unchanged.

## Opt-in future configuration (only for controlled QA)

```yaml
type: custom:smart-pro-light-card
entity: light.living_room
name: Κεντρικός φωτισμός
density: compact
theme: night          # night | graphite | light
surface: soft-glass   # solid | soft-glass | glass
```

**Do not install this file from these instructions yet.** The release/install procedure, compatibility and rollback checkpoint are still pending. On existing dashboards with no `theme` option, legacy alpha.10 appearance remains the default. Unknown theme values are rejected to legacy; unknown surface values fall back to solid. These settings currently apply per Light Card; global dashboard theme selection has not yet been implemented.

## Safety / scope

- No changes to the `main` branch, the stable `hacs.json` target, or installed Home Assistant resources.
- No automatic creation of dashboard cards; Home Assistant layout still determines how many cards appear on mobile/tablet/desktop.
- No Design Studio runtime integration at this milestone.
- No runtime update to Cover or Thermostat Cards.
- Soft Glass and Glass over arbitrary wallpaper need real-device readability, performance and accessibility QA.
- Unavailable/unknown are not assumed to be hardware faults.
- Future live HA QA must test real light/dimmer/switch entities, input methods, re-rendering, current entity state, density, theme contrast, wallpaper and mobile/tablet behavior.

## Gates to proceed
1. Reconfirm CI PASS and review generated runtime artifact.
2. Controlled Home Assistant test on a *test installation*, not a production replacement.
3. Visual review of actual cards together with the owner; amend spacing, text, states as needed.
4. Only then consider versioning/HACS distribution and extending the approved visual contract to Cover and Thermostat.
