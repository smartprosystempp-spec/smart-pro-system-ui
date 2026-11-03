# Smart Pro System Cards — shared visual contract

This is the initial **design-token foundation**, not yet enabled in the alpha.10 Home Assistant card runtime.

## Sources of truth
- `themes.json`: canonical Night / Graphite / Light colors, semantic states, sizing tokens, and Solid / Soft Glass / Glass surface modes
- `generate-css.cjs`: deterministic CSS generator, with `--check` mode
- `themes.css`: generated, scoped CSS attributes for future Home Assistant components and Design Studio preview
- `tests/theme-contract.cjs`: validation of complete theme/surface sets, WCAG AA text contrast against each **solid** card surface, and CSS/JSON consistency

## Planned use

Apply `data-sp-theme="night|graphite|light"` and `data-sp-surface="solid|soft-glass|glass"` on a wrapper. The opt-in `.sp-themed-card-surface` class provides a base surface. Themes intentionally use scoped variables and do not modify WordPress or Home Assistant globals.

Glass surfaces **cannot guarantee contrast over every arbitrary wallpaper**. The real cards must include a fallback to solid when contrast, device performance or user preferences require it. The CSS includes reduced-transparency and increased-contrast fallbacks as progressive enhancement.

The Home Assistant runtime remains authoritative. The Design Studio uses these appearance tokens in a separate preview adapter; no actual device services should be invoked from its preview.

## Constraints

- No source changes to recovered alpha.10 in this branch
- No live HA resource URL changes or HACS release yet
- No licensing decision made for third-party distribution

## First visual review checkpoint: Light Card

Open `design/preview.html` in a browser **with the sibling `design/themes.css` file available in the same folder**. This is an interactive, self-contained **design-only** lab using shared theme tokens, not an actual `custom:smart-pro-light-card` runtime.

The review selectors cover:
- Night / Graphite / Light
- Solid / Soft Glass / Glass
- Aurora / Warm / Plain background
- Desktop / Tablet / Mobile preview widths
- On / Off / Unavailable / Unknown demo states, with a simulated brightness slider

**Review gate:** No Light Card style migration, Cover/Thermostat restyling, or customer-facing Design Studio visual commitment is final before the user sees a live side-by-side visual checkpoint. The user should be shown a working preview, not only code or screenshots.

Limitations: the laboratory uses illustrative data and basic controls; it does not implement Home Assistant service calls, actual entity capabilities, device fault diagnostics, drag/drop layout, screen reader QA or installation packages. A real HA live QA follows once the Light Card runtime is migrated.

**Visual decision log:** First agree on card hierarchy, radius, typography, spacing, semantic states, responsiveness and wallpaper transparency. Then implement those decisions across the runtime using the same design tokens. Prefer legibility to transparency.
