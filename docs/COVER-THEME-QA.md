# Smart Pro System Cover Card — Theme / Sizing QA1

**Status: Draft technical experiment, not a production or HACS release.**

## Goal
Extend the verified shared Smart Pro System design language from the Light Card to the original Cover Card without risking any existing Home Assistant dashboard. The recovered alpha.10 remains byte-identical.

## Scope
- Experimental element: `custom:smart-pro-cover-qa-card` (distinct from `custom:smart-pro-cover-card`).
- Source generator: `design/build-cover-qa.cjs`.
- Generated (untracked) output: `dist/smart-pro-cover-qa.js`.
- Shared canonical themes: Night / Graphite / Light.
- Surface options: Solid / Soft Glass / Glass.
- Densities: Ultra Compact / Compact / Comfortable.
- Container-aware size adjustments for narrow and wide card placements.
- Original cover native and helper adapters, quick actions, expansion, position slider, and Home Assistant service calls are preserved.

## Safety properties
1. Builder refuses to operate when the alpha.10 source SHA-256 differs from the known original.
2. It extracts only `SmartProCoverCard`, re-registering it with a **separate QA tag**; neither original Light nor Cover nor Thermostat tags are overwritten.
3. The theme and surface selectors accept only known literal values. Missing or invalid theme falls back to original legacy colors.
4. Simulated native cover tests verify `open_cover`, `close_cover`, `stop_cover` and `set_cover_position`.
5. Helper-based tests verify that inputs still use `input_number.set_value` on the configured target helper.
6. Unavailable / unknown entities must not trigger service calls.
7. This milestone does not introduce new business logic, telemetry or additional runtime dependencies.

## Example for a future *controlled* HA test

```yaml
type: custom:smart-pro-cover-qa-card
entity: cover.test_blind
name: Ρολό δοκιμής
density: compact
theme: night
surface: soft-glass
```

This example is **illustrative**, not an instruction to install today. Only a dedicated test entity may be used in live QA, because these controls issue actual cover commands.

## Explicitly not yet validated
- Real Home Assistant cover / helper behavior and service capabilities.
- Position read-back after movement and pending slider feedback.
- Mobile and tablet finger interactions, accessibility, control hit targets.
- Visual appearance on patterned wallpapers, particularly Glass.
- Alignment of the whole Light/Cover/Thermostat family in one dashboard.
- Design Studio preview integration.
- Correct placement/columns are managed by Home Assistant dashboard layout, not by this card.

## Next gate
GitHub Actions PASS, then browser-only visual review of generated Cover QA using mocked states; a live Home Assistant test (only when valuable) follows later. No merge to `main`, no existing HACS resource replacement, and no changes to the installed Light QA1.

The owner has opted to defer additional visual testing for now. Do not misrepresent this as final approval of Cover styles, spacing or sizes.
