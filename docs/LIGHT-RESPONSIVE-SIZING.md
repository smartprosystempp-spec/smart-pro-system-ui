# Smart Pro System Cards — Responsive Sizing QA2

**Development-only. Not a Home Assistant release.** This builds a second, independently registered QA element so the original alpha.10 card and the previously tested QA1 card remain intact.

## Why a second QA card?

The existing three `density` options—`ultra-compact`, `compact`, and `comfortable`—already change spacing, padding and icon sizes. However, actual Home Assistant dashboard cards may have very different *available widths* within the same desktop/tablet/mobile viewport.

The sizing experiment therefore adds CSS **container queries on the card host**, rather than choosing styles solely by the device viewport.

## Source / boundaries

- Historical `smart-pro-cards.js` is unchanged.
- The initial `smart-pro-light-qa-card` remains unchanged, and can continue to be used for the user's Night/Graphite/Light QA.
- `design/build-light-sizing-qa.cjs` derives a new file from `dist/smart-pro-light-qa.js`.
- Generated QA2 custom tag: `smart-pro-light-sizing-qa-card`.
- Generated runtime file: `dist/smart-pro-light-sizing-qa.js`.
- CI artifact: `smart-pro-light-responsive-qa2`.

This QA2 tag is never an override of either the original Light Card or QA1, so the owner's existing dashboard is safe.

## Sizing contract (experimental)

- `ultra-compact`: lowest visual density / minimum vertical space.
- `compact`: default for frequent lighting controls.
- `comfortable`: larger paddings/icons, suitable for wall tablets and spacious grids.
- Responsive adjustments are based on **card container width** at 360px, 260px and 560px—not fixed mobile/tablet product categories.
- Preserve real Home Assistant dashboard responsibility for actual column count/card placement.
- Keep dimmer slider accessible in every density. Do not silently drop functional controls on mobile.
- No manual pixel-width/height overrides, and no changes to actual Light entity service calls.

## QA gates

1. Node syntax/source/control/coexistence tests via GitHub Actions; test all three densities.
2. Independent responsive-width browser review on desktop/tablet/mobile **when possible**.
3. Owner visual comparison in a reversible test dashboard before locking card dimensions.
4. Readability/accessibility/touch and font-scaling checks on the actual devices.
5. Only after approval, integrate sizing system with the final theme-enabled runtime and apply it to other card families.

## Future controlled Home Assistant test

When invited, add the generated QA2 JavaScript as a **new** local module resource and create cards with `type: custom:smart-pro-light-sizing-qa-card`. Keep existing alpha.10 and QA1 files and resource registrations unchanged.

Use one test helper entity (e.g. `light.smart_pro_test_dimmer`), vary only `density`, and compare on mobile/tablet/desktop. Do not use real operational devices for this checkpoint. No installation instructions or customer release are issued until the candidate passes source and visual QA.

## Offline sizing preview for the owner's review

The **sizing review** is built directly from the generated QA2 JavaScript and the canonical theme CSS; it does not use an unrelated visual mockup.

- Source HTML: `design/sizing-review.template.html`
- Build script: `design/build-sizing-preview.cjs`
- Output: `dist/smart-pro-light-sizing-review.html` (self-contained, offline)
- CI artifact: `smart-pro-light-sizing-visual-review`
- Compare all three density presets, Night/Graphite/Light, Solid/Soft Glass/Glass, and desktop/tablet/mobile widths.
- The card uses mocked Home Assistant entities and local-only service handlers. Buttons and sliders do not connect to any actual light or installation.

**Visual review gate:** The example is only for first comparison of proportions. On-device Home Assistant QA is still required, and no density or responsive breakpoint is considered final before owner review.

## Local browser visual smoke test (2026-11-03)

The exact HTML generated and archived by GitHub Actions was opened in headless Chromium and exercised with simulated helper entities. **PASS as a browser smoke test, not real Home Assistant QA.**

- Desktop 1040px (Night): Ultra Compact 87px, Compact 100px, Comfortable 124px.
- Tablet 720px (Graphite): Ultra Compact 87px, Compact 100px, Comfortable 124px.
- Mobile 390px (Light): Ultra Compact 87px, Compact 106px, Comfortable 131px.
- Narrow Mobile 320px (Night): Ultra Compact 87px, Compact 100px, Comfortable 124px.
- No horizontal overflow detected in the three rendered cards at the four tested widths.
- No JavaScript page errors; simulated ON/OFF changed state locally.
- These are measurements of the *offline comparison layout*, not definitive dimensions within a real Lovelace dashboard.

The review HTML and screenshots were bundled for the owner. **Do not treat sizing as final until the owner sees it and actual Home Assistant mobile/tablet behavior is checked.**
