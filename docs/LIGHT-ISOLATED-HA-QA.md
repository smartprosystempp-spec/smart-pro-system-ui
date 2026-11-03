# Smart Pro System Light Card — Isolated Home Assistant QA

**Status:** development-only. A GitHub Actions PASS does not mean this candidate has been tested on a real Home Assistant installation.

## Why a separate tag?

A custom element already registered by the browser cannot safely be redefined by loading another JavaScript version. The unmodified alpha.10 registers `smart-pro-light-card`; the experimental themed runtime also uses that production tag.

The isolated QA artifact **only** registers `smart-pro-light-qa-card`. It includes the experimental Light class plus its required constants, and does not register Cover or Thermostat. Existing `smart-pro-light-card`, `smart-pro-cover-card` and `smart-pro-thermostat-card` remain untouched.

## Sources and reproducibility

- Existing alpha.10: `smart-pro-cards.js`, byte-for-byte SHA-256 protected
- Canonical visual tokens: `design/themes.json`
- First-stage generated themed runtime: `design/build-light-runtime.cjs`
- Second-stage isolated QA generator: `design/build-light-qa.cjs`
- Output: `dist/smart-pro-light-qa.js`
- CI artifact: `smart-pro-light-isolated-qa` from the relevant successful GitHub Actions run
- Tests: `tests/light-isolated-qa.cjs` validates both script load orders and simulated control behavior

Run `npm test` to regenerate and validate. Never manually edit generated output.

## Live QA record — 2026-11-03 (partial, owner screenshots)

**Test Home Assistant instance only.** The existing `/config/www/smart-pro-cards/smart-pro-cards.js` was kept, and the QA file was added separately at `/config/www/smart-pro-cards/smart-pro-light-qa.js`. A JavaScript module resource was registered as `/local/smart-pro-cards/smart-pro-light-qa.js?v=qa1`.

- **PASS — initial loading:** `custom:smart-pro-light-qa-card` rendered in the real Lovelace editor and after Save, using `light.smart_pro_test_dimmer`, a helper-based test entity.
- **PASS — basic on-state visual feedback:** owner reported the test helper responded; screenshot showed `Αναμμένο · 79%` and matching slider/active styling in Night / Soft Glass. This is not verification against a physical dimmer.
- **PASS — Graphite / Glass visual:** screenshot showed `Αναμμένο · 29%`, dark graphite surface, readable label, aligned slider and accent.
- **PASS — Light / Solid visual:** screenshot showed `Αναμμένο · 29%`, bright surface, dark legible title, amber state/accent and aligned slider.
- **Observed:** the helper shows 1% even when off; owner explained this arises from its original helper configuration and does not treat it as a blocker.
- **Owner feedback:** visual direction is positive; mobile/tablet sizing is not yet approved based on the desktop/preview screenshots alone.

**Still pending:** direct real-device test; independently verified slider service-call behavior on actual hardware; unknown/unavailable state in the live HA UI; glass over a visibly patterned wallpaper; actual mobile/tablet touch/resize checks; accessible keyboard/focus review; formal final design approval. The Light QA module remains experimental. No changes to the main branch or original production resources.

## Controlled Home Assistant live checkpoint (PARTIALLY PERFORMED)

**Only when the owner is ready for an explicitly controlled visual/functional test.**

1. Use a dedicated Home Assistant test installation with a reversible backup and a test `light.*` entity, ideally a dimmer helper.
2. Keep the existing alpha.10 resource and dashboard cards untouched.
3. Place the generated QA JavaScript in a *new, separately named* file under the test instance's `/config/www/`, for example `smart-pro-light-qa.js`. Do **not** overwrite the existing resource.
4. Add a new JavaScript module resource pointing to `/local/smart-pro-light-qa.js` in the test dashboard. Check for any resource-cache issues with a versioned URL.
5. Create a **new test-only card**, using an actual test entity belonging to that instance, e.g.:

```yaml
type: custom:smart-pro-light-qa-card
entity: light.test_dimmer
name: Smart Pro Light QA
density: compact
theme: night
surface: soft-glass
```

6. Compare side-by-side with the existing `custom:smart-pro-light-card` if available. Test Night / Graphite / Light, Solid / Soft Glass / Glass, normal ON/OFF and dimmer, and unsupported/unknown/unavailable states.
7. Inspect desktop, wall tablet and mobile layout **inside Home Assistant**; compare on dark/light wallpaper and check contrast, card height, touch and keyboard focus. The demo's two cards did not set the dashboard's capacity or column limits.
8. Record visual findings before any styling is approved or applied to Cover/Thermostat.

## Rollback

Remove only the new `custom:smart-pro-light-qa-card` instances and the separate QA JavaScript resource. Optionally delete the test instance's separate QA file after confirming no cards reference it. **Do not** delete the original alpha.10 resource. The main branch, HACS configuration, Portal and Design Studio require no change.

## Known limits

- Theme selection is **per QA Light Card**, not global.
- Device/service commands are real if attached to a real entity; do not test on operational devices.
- This code does not detect hardware faults independent of HA entity state.
- No release, production deployment, HACS migration or Design Studio integration is authorized by a successful simulation alone.
