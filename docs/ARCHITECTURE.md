# Smart Pro System Cards — architecture roadmap

## Purpose
One Smart Pro System identity for a family of dashboard cards.

### Home Assistant (authoritative)
The Home Assistant runtime renders current device state and executes user-authorized services. Capability checks and unavailable/unknown behavior must be tested per entity domain.

### Smart Pro Design Studio (preview)
Preview reads the project's intended room/entity model and uses simulated/illustrative state. It must not make live Home Assistant service calls. The final Home Assistant experience takes priority over 1:1 preview fidelity.

### Shared design contract
- 3 themes: Night (brand navy/cyan), Graphite (neutral premium charcoal), Light (high-contrast pale surfaces).
- 3 card surfaces: Solid, Soft Glass, Glass, with opaque fallback if needed for contrast or performance.
- Shared spacing, typography, control hierarchy, responsiveness, iconography and semantic status.
- Mobile, wall tablet, desktop sizing without hiding necessary safety/status information.
- State handling: active, inactive, unknown, unavailable, transition; distinguish verified faults from merely offline devices.

## Card inventory
**Recovered historical families:** Light, Cover, Thermostat. The original alpha.10 runtime was restored without modification in the recovery branch; it is not a released HACS package.

**Future candidates:** Switch/Plug, Sensors/Measurements, Scenes/Scripts, Security, Locks/Gates, Media, Energy, Weather, Cameras, Room Summary. Prioritize by real Design Studio and Home Assistant use, not by creating every card simultaneously.

## Technical migration plan
1. Imported and hash-verified untouched `smart-pro-cards.js` in the recovery foundation.
2. Add smoke/capability tests, examples and safe distribution metadata.
3. Run live Home Assistant light/cover/thermostat QA.
4. Extract design tokens incrementally without behavior regressions.
5. Build Design Studio preview adapter once runtime contract is stable.
6. Release only after review and QA; no automatic production deployment.

## Distribution and rights
This is a public repository with no confirmed license selection. Decide a license and branding policy before third-party distribution. Do not assume that public visibility grants unrestricted reuse.
