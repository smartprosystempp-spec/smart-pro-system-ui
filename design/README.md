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
