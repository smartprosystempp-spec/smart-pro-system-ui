# Smart Pro System Cards

**Recovery branch status: historical alpha.10 restored; NOT a production/HACS release.**

This repository is intended to become the official Smart Pro System dashboard card library. It contains the **unmodified** JavaScript from the last historical prototype, `0.1.0-alpha.10`, recovered from the project owner's original archive.

### Existing card families
- `custom:smart-pro-light-card` — Light / switch and brightness where supported
- `custom:smart-pro-cover-card` — Cover and prototype helper controls
- `custom:smart-pro-thermostat-card` — Climate and prototype helper thermostat / boiler controls

**Source file:** `smart-pro-cards.js` (85,397 bytes, SHA-256 `db611964bab281eb0d7e67e5f137189b6dee87a5c0bd5931daaadc9f128177a8`).

### Quality checks

Run `npm test` using Node.js 22. The test checks JavaScript syntax, source fingerprint, the three card registrations and the HACS filename.

See `docs/RECOVERY-FOUNDATION.md` for the provenance, `docs/ARCHITECTURE.md` for the planned theme/preview architecture, `legacy/SHA256SUMS.txt` for archive hashes, and `examples/` for **illustrative**, unverified Lovelace YAML.

### Planned product design (not yet part of alpha.10)

- Three themes: **Smart Pro Night**, **Graphite**, **Light**.
- Three surfaces: **Solid**, **Soft Glass**, **Glass**.
- Consistent semantic device states, mobile/tablet/desktop density and accessibility.
- Home Assistant runtime as the authoritative experience; Smart Pro Design Studio will use a separate preview adapter.

### Release safety

Do not replace a deployed Home Assistant resource or announce a HACS version based solely on this source recovery. Visual, capability and live device checks are still required. No license has been selected for redistribution.
