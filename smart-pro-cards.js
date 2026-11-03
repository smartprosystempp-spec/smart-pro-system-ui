/*
 * Smart Pro Cards
 * Prototype: Smart Pro Cards
 * Version: 0.1.0-alpha.10
 *
 * Changes in alpha.10:
 * - Thermostat Card now supports both native climate.* entities and helper-based test thermostats.
 * - Added helper adapter for power, heat/cool mode, target and room temperature.
 * - Added optional boiler status/control and Eco Pause indication.
 * - Helper mode exposes Off / Heat / Cool controls without requiring a template climate entity.
 *
 * Earlier changes:
 * - Automatic capability detection for simple lights vs dimmable lights.
 * - Dimmable light entities display an inline brightness slider.
 * - Moving the slider sets brightness without triggering the card toggle.
 * - Simple light.* and switch.* entities remain compact ON/OFF cards.
 */

(() => {
  "use strict";

  const VERSION = "0.1.0-alpha.10";
  const TAG_NAME = "smart-pro-light-card";
  const COVER_TAG_NAME = "smart-pro-cover-card";
  const THERMOSTAT_TAG_NAME = "smart-pro-thermostat-card";

  class SmartProLightCard extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: "open" });
      this._config = null;
      this._hass = null;
      this._lastBrightnessPct = 1;
    }

    setConfig(config) {
      if (!config?.entity) {
        throw new Error("Η Smart Pro Light Card χρειάζεται entity.");
      }

      const domain = this._domain(config.entity);
      if (!["light", "switch"].includes(domain)) {
        throw new Error(
          "Η Smart Pro Light Card υποστηρίζει οντότητες light.* και switch.*."
        );
      }

      this._config = {
        name: "",
        icon: "💡",
        density: "compact",
        ...config,
      };

      this._render();
    }

    set hass(hass) {
      this._hass = hass;
      this._render();
    }

    getCardSize() {
      const entity = this._entity();
      return this._isDimmable(entity) ? 2 : 1;
    }

    _domain(entityId) {
      return String(entityId || "").split(".", 1)[0];
    }

    _entity() {
      return this._hass?.states?.[this._config?.entity] || null;
    }

    _displayName(entity) {
      return (
        this._config?.name ||
        entity?.attributes?.friendly_name ||
        this._config?.entity ||
        "Φωτισμός"
      );
    }

    _isUnavailable(entity) {
      return !entity || ["unavailable", "unknown"].includes(entity.state);
    }

    _isDimmable(entity) {
      if (!entity || this._domain(this._config?.entity) !== "light") {
        return false;
      }

      const modes = Array.isArray(entity.attributes?.supported_color_modes)
        ? entity.attributes.supported_color_modes
        : [];

      if (modes.some((mode) => mode && mode !== "onoff")) {
        return true;
      }

      return Object.prototype.hasOwnProperty.call(
        entity.attributes || {},
        "brightness"
      );
    }

    _brightnessPct(entity) {
      const brightness = Number(entity?.attributes?.brightness);

      if (Number.isFinite(brightness)) {
        const pct = Math.round((brightness / 255) * 100);
        this._lastBrightnessPct = Math.min(100, Math.max(1, pct || 1));
      }

      return this._lastBrightnessPct;
    }

    _toggle(event) {
      event?.preventDefault();
      event?.stopPropagation();

      const entity = this._entity();
      if (this._isUnavailable(entity)) {
        return;
      }

      const domain = this._domain(this._config.entity);

      this._hass.callService(domain, "toggle", {
        entity_id: this._config.entity,
      });
    }

    _setBrightness(value) {
      const entity = this._entity();
      if (this._isUnavailable(entity) || !this._isDimmable(entity)) {
        return;
      }

      const brightnessPct = Math.min(
        100,
        Math.max(1, Math.round(Number(value) || 1))
      );

      this._lastBrightnessPct = brightnessPct;

      this._hass.callService("light", "turn_on", {
        entity_id: this._config.entity,
        brightness_pct: brightnessPct,
      });
    }

    _escape(value) {
      return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
    }

    _render() {
      if (!this.shadowRoot || !this._config) {
        return;
      }

      const entity = this._entity();
      const unavailable = this._isUnavailable(entity);
      const isOn = entity?.state === "on";
      const dimmable = this._isDimmable(entity);
      const brightnessPct = this._brightnessPct(entity);
      const name = this._displayName(entity);

      const stateLabel = !entity
        ? "Φόρτωση…"
        : unavailable
          ? "Μη διαθέσιμο"
          : isOn
            ? dimmable
              ? `Αναμμένο · ${brightnessPct}%`
              : "Αναμμένο"
            : dimmable
              ? `Σβηστό · ${brightnessPct}%`
              : "Σβηστό";

      const density = ["comfortable", "compact", "ultra-compact"].includes(
        this._config.density
      )
        ? this._config.density
        : "compact";

      this.shadowRoot.innerHTML = `
        <style>
          :host {
            --sp-bg: rgba(13, 25, 48, 0.90);
            --sp-border: rgba(144, 176, 220, 0.18);
            --sp-text: #f7fbff;
            --sp-muted: #91a2b9;
            --sp-accent: #ffd64d;
            --sp-accent-soft: rgba(255, 214, 77, 0.17);

            display: block;
            font-family:
              Inter,
              system-ui,
              -apple-system,
              BlinkMacSystemFont,
              "Segoe UI",
              sans-serif;
          }

          .card {
            position: relative;
            display: grid;
            grid-template-columns: auto minmax(0, 1fr);
            align-items: center;
            gap: 12px;
            min-height: 68px;
            padding: 12px 14px;
            overflow: hidden;
            border: 1px solid var(--sp-border);
            border-radius: 18px;
            background:
              linear-gradient(
                145deg,
                rgba(255, 255, 255, 0.035),
                transparent 45%
              ),
              var(--sp-bg);
            box-shadow: 0 14px 34px rgba(0, 0, 0, 0.26);
            color: var(--sp-text);
            cursor: pointer;
            user-select: none;
            -webkit-tap-highlight-color: transparent;
            transition:
              transform 140ms ease,
              border-color 140ms ease,
              background 140ms ease,
              box-shadow 140ms ease;
          }

          .card.has-slider {
            grid-template-rows: auto auto;
            min-height: 96px;
          }

          .card[data-density="comfortable"] {
            min-height: 92px;
            padding: 18px;
            gap: 15px;
          }

          .card[data-density="comfortable"].has-slider {
            min-height: 124px;
          }

          .card[data-density="ultra-compact"] {
            min-height: 54px;
            padding: 8px 10px;
            gap: 9px;
            border-radius: 14px;
          }

          .card[data-density="ultra-compact"].has-slider {
            min-height: 78px;
          }

          .card:hover:not(.is-unavailable) {
            transform: translateY(-1px);
            border-color: rgba(144, 176, 220, 0.32);
          }

          .card:active:not(.is-unavailable) {
            transform: scale(0.992);
          }

          .card:focus-visible {
            outline: 2px solid #49d7ff;
            outline-offset: 2px;
          }

          .card.is-on {
            border-color: rgba(255, 214, 77, 0.38);
            background:
              radial-gradient(
                circle at 12% 25%,
                var(--sp-accent-soft),
                transparent 38%
              ),
              var(--sp-bg);
          }

          .card.is-unavailable {
            cursor: not-allowed;
            opacity: 0.58;
          }

          .icon-tile {
            display: grid;
            place-items: center;
            width: 46px;
            height: 46px;
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 14px;
            background: rgba(255, 255, 255, 0.055);
            color: var(--sp-muted);
            transition:
              background 140ms ease,
              border-color 140ms ease,
              color 140ms ease,
              box-shadow 140ms ease;
          }

          .card[data-density="comfortable"] .icon-tile {
            width: 56px;
            height: 56px;
            border-radius: 17px;
          }

          .card[data-density="ultra-compact"] .icon-tile {
            width: 38px;
            height: 38px;
            border-radius: 12px;
          }

          .card.is-on .icon-tile {
            border-color: rgba(255, 214, 77, 0.42);
            background: var(--sp-accent-soft);
            color: var(--sp-accent);
            box-shadow: 0 0 24px rgba(255, 214, 77, 0.16);
          }

          .icon {
            font-size: 23px;
            line-height: 1;
          }

          .card[data-density="comfortable"] .icon {
            font-size: 28px;
          }

          .card[data-density="ultra-compact"] .icon {
            font-size: 19px;
          }

          .content {
            min-width: 0;
            padding-right: 8px;
          }

          .name {
            overflow: hidden;
            color: var(--sp-text);
            font-size: 14px;
            font-weight: 760;
            line-height: 1.25;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          .card[data-density="comfortable"] .name {
            font-size: 16px;
          }

          .card[data-density="ultra-compact"] .name {
            font-size: 12px;
          }

          .state {
            margin-top: 4px;
            color: var(--sp-muted);
            font-size: 11px;
            font-weight: 650;
            line-height: 1.2;
          }

          .card.is-on .state {
            color: #ffe88b;
          }

          .card[data-density="ultra-compact"] .state {
            margin-top: 2px;
            font-size: 10px;
          }

          .slider-row {
            grid-column: 1 / -1;
            display: grid;
            grid-template-columns: minmax(0, 1fr) 42px;
            align-items: center;
            gap: 10px;
            padding: 2px 2px 0;
            cursor: default;
          }

          .slider {
            width: 100%;
            height: 18px;
            margin: 0;
            accent-color: var(--sp-accent);
            cursor: pointer;
          }

          .slider:focus-visible {
            outline: 2px solid #49d7ff;
            outline-offset: 3px;
            border-radius: 999px;
          }

          .percent {
            color: var(--sp-text);
            font-size: 11px;
            font-weight: 750;
            text-align: right;
            font-variant-numeric: tabular-nums;
          }

          .card[data-density="ultra-compact"] .slider-row {
            grid-template-columns: minmax(0, 1fr) 36px;
            gap: 7px;
          }

          .card[data-density="ultra-compact"] .percent {
            font-size: 10px;
          }

          .version {
            position: absolute;
            right: 9px;
            bottom: 3px;
            color: rgba(145, 162, 185, 0.32);
            font-size: 8px;
            pointer-events: none;
          }

          @media (prefers-reduced-motion: reduce) {
            .card,
            .icon-tile {
              transition: none;
            }
          }
        </style>

        <article
          class="card ${isOn ? "is-on" : ""} ${unavailable ? "is-unavailable" : ""} ${dimmable ? "has-slider" : ""}"
          data-density="${density}"
          role="button"
          tabindex="${unavailable ? "-1" : "0"}"
          aria-disabled="${unavailable ? "true" : "false"}"
          aria-label="${isOn ? "Σβήσιμο" : "Άναμμα"}: ${this._escape(name)}"
        >
          <div class="icon-tile" aria-hidden="true">
            <span class="icon">${this._escape(this._config.icon)}</span>
          </div>

          <div class="content">
            <div class="name">${this._escape(name)}</div>
            <div class="state">${this._escape(stateLabel)}</div>
          </div>

          ${
            dimmable
              ? `
                <div class="slider-row">
                  <input
                    class="slider"
                    type="range"
                    min="1"
                    max="100"
                    step="1"
                    value="${brightnessPct}"
                    aria-label="Φωτεινότητα ${this._escape(name)}"
                    ${unavailable ? "disabled" : ""}
                  />
                  <span class="percent">${brightnessPct}%</span>
                </div>
              `
              : ""
          }

          <span class="version">α ${VERSION}</span>
        </article>
      `;

      const card = this.shadowRoot.querySelector(".card");
      const slider = this.shadowRoot.querySelector(".slider");
      const percent = this.shadowRoot.querySelector(".percent");

      card?.addEventListener("click", (event) => {
        this._toggle(event);
      });

      card?.addEventListener("keydown", (event) => {
        if (event.target === slider) {
          return;
        }

        if (event.key === "Enter" || event.key === " ") {
          this._toggle(event);
        }
      });

      if (slider) {
        for (const eventName of [
          "click",
          "pointerdown",
          "pointerup",
          "mousedown",
          "mouseup",
          "touchstart",
          "touchend",
        ]) {
          slider.addEventListener(eventName, (event) => {
            event.stopPropagation();
          });
        }

        slider.addEventListener("input", (event) => {
          event.stopPropagation();
          const value = Math.round(Number(event.target.value) || 1);
          this._lastBrightnessPct = value;

          if (percent) {
            percent.textContent = `${value}%`;
          }
        });

        slider.addEventListener("change", (event) => {
          event.stopPropagation();
          this._setBrightness(event.target.value);
        });
      }
    }
  }


  class SmartProCoverCard extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: "open" });
      this._config = null;
      this._hass = null;
      this._expanded = false;
      this._pendingPosition = null;
    }

    setConfig(config) {
      const hasCoverEntity =
        typeof config?.entity === "string" &&
        config.entity.startsWith("cover.");

      const hasHelperAdapter =
        typeof config?.position_entity === "string" &&
        typeof config?.target_entity === "string";

      if (!hasCoverEntity && !hasHelperAdapter) {
        throw new Error(
          "Η Smart Pro Cover Card χρειάζεται entity: cover.* ή position_entity και target_entity για δοκιμαστικό helper mode."
        );
      }

      this._config = {
        name: "",
        icon: "mdi:window-shutter",
        density: "compact",
        show_position: true,
        ...config,
      };

      this._render();
    }

    set hass(hass) {
      this._hass = hass;
      this._render();
    }

    getCardSize() {
      return this._expanded ? 3 : 1;
    }

    _isHelperMode() {
      return !this._config?.entity;
    }

    _state(entityId) {
      return this._hass?.states?.[entityId] || null;
    }

    _coverEntity() {
      return this._config?.entity ? this._state(this._config.entity) : null;
    }

    _positionEntity() {
      return this._config?.position_entity
        ? this._state(this._config.position_entity)
        : null;
    }

    _targetEntity() {
      return this._config?.target_entity
        ? this._state(this._config.target_entity)
        : null;
    }

    _statusEntity() {
      return this._config?.status_entity
        ? this._state(this._config.status_entity)
        : null;
    }

    _clampPosition(value) {
      const number = Math.round(Number(value));
      if (!Number.isFinite(number)) {
        return null;
      }
      return Math.min(100, Math.max(0, number));
    }

    _position() {
      if (this._isHelperMode()) {
        return this._clampPosition(this._positionEntity()?.state);
      }

      return this._clampPosition(
        this._coverEntity()?.attributes?.current_position
      );
    }

    _targetPosition() {
      if (this._pendingPosition !== null) {
        return this._pendingPosition;
      }

      // The slider is a live position indicator, not a target indicator.
      // This keeps it synchronized with the actual roller movement.
      return this._position();
    }

    _normalizedStatus() {
      let rawStatus = "";

      if (this._isHelperMode()) {
        rawStatus = String(this._statusEntity()?.state || "idle");
      } else {
        rawStatus = String(this._coverEntity()?.state || "unknown");
      }

      const status = rawStatus.trim().toLowerCase();

      if (["opening", "ανοιγμα", "άνοιγμα", "opening..."].includes(status)) {
        return "opening";
      }

      if (["closing", "κλεισιμο", "κλείσιμο", "closing..."].includes(status)) {
        return "closing";
      }

      if (["open", "opened", "ανοιχτό", "ανοικτό"].includes(status)) {
        return "open";
      }

      if (["closed", "κλειστό"].includes(status)) {
        return "closed";
      }

      return "idle";
    }

    _isUnavailable() {
      if (!this._hass) {
        return true;
      }

      if (this._isHelperMode()) {
        const position = this._positionEntity();
        const target = this._targetEntity();

        return (
          !position ||
          !target ||
          ["unavailable", "unknown"].includes(position.state) ||
          ["unavailable", "unknown"].includes(target.state)
        );
      }

      const cover = this._coverEntity();

      return (
        !cover ||
        ["unavailable", "unknown"].includes(cover.state)
      );
    }

    _hasPosition() {
      if (this._config?.show_position === false) {
        return false;
      }

      if (this._isHelperMode()) {
        return Boolean(this._positionEntity() && this._targetEntity());
      }

      return this._position() !== null;
    }

    _displayName() {
      const entity = this._isHelperMode()
        ? this._positionEntity()
        : this._coverEntity();

      return (
        this._config?.name ||
        entity?.attributes?.friendly_name ||
        "Ρολό"
      );
    }

    _statusLabel(status, position) {
      if (!this._hass) {
        return "Φόρτωση…";
      }

      if (this._isUnavailable()) {
        return "Μη διαθέσιμο";
      }

      if (status === "opening") {
        return position === null ? "Ανοίγει" : `Ανοίγει · ${position}%`;
      }

      if (status === "closing") {
        return position === null ? "Κλείνει" : `Κλείνει · ${position}%`;
      }

      if (position !== null) {
        if (position <= 0) {
          return "Κλειστό";
        }

        if (position >= 100) {
          return "Ανοιχτό";
        }

        return `Ανοιχτό · ${position}%`;
      }

      if (status === "open") {
        return "Ανοιχτό";
      }

      if (status === "closed") {
        return "Κλειστό";
      }

      return "Έτοιμο";
    }

    _setExpanded(expanded) {
      if (this._isUnavailable()) {
        return;
      }

      this._expanded = expanded;
      this._render();

      requestAnimationFrame(() => {
        this.dispatchEvent(
          new CustomEvent("iron-resize", {
            bubbles: true,
            composed: true,
          })
        );
      });
    }

    _toggleExpanded(event) {
      event?.preventDefault();
      event?.stopPropagation();
      this._setExpanded(!this._expanded);
    }

    _callCoverService(service, data = {}) {
      this._hass.callService("cover", service, {
        entity_id: this._config.entity,
        ...data,
      });
    }

    _setHelperTarget(value) {
      const position = this._clampPosition(value);
      if (position === null) {
        return;
      }

      this._hass.callService("input_number", "set_value", {
        entity_id: this._config.target_entity,
        value: position,
      });
    }

    _open(event) {
      event?.preventDefault();
      event?.stopPropagation();

      if (this._isUnavailable()) {
        return;
      }

      if (this._isHelperMode()) {
        this._setHelperTarget(100);
      } else {
        this._callCoverService("open_cover");
      }
    }

    _stop(event) {
      event?.preventDefault();
      event?.stopPropagation();

      if (this._isUnavailable()) {
        return;
      }

      if (this._isHelperMode()) {
        this._setHelperTarget(this._position() ?? 0);
      } else {
        this._callCoverService("stop_cover");
      }
    }

    _close(event) {
      event?.preventDefault();
      event?.stopPropagation();

      if (this._isUnavailable()) {
        return;
      }

      if (this._isHelperMode()) {
        this._setHelperTarget(0);
      } else {
        this._callCoverService("close_cover");
      }
    }

    _setPosition(value) {
      const position = this._clampPosition(value);
      if (position === null || this._isUnavailable()) {
        return;
      }

      this._pendingPosition = position;

      if (this._isHelperMode()) {
        this._setHelperTarget(position);
      } else {
        this._callCoverService("set_cover_position", {
          position,
        });
      }
    }

    _escape(value) {
      return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
    }

    _render() {
      if (!this.shadowRoot || !this._config) {
        return;
      }

      const unavailable = this._isUnavailable();
      const position = this._position();
      const targetPosition = this._targetPosition();
      const status = this._normalizedStatus();
      const hasPosition = this._hasPosition();
      const isMoving = status === "opening" || status === "closing";
      const atClosed = position !== null && position <= 0;
      const atOpen = position !== null && position >= 100;
      const name = this._displayName();
      const stateLabel = this._statusLabel(status, position);

      if (
        this._pendingPosition !== null &&
        targetPosition !== null &&
        Math.abs(targetPosition - this._pendingPosition) <= 1
      ) {
        this._pendingPosition = null;
      }

      const density = ["comfortable", "compact", "ultra-compact"].includes(
        this._config.density
      )
        ? this._config.density
        : "compact";

      this.shadowRoot.innerHTML = `
        <style>
          :host {
            --sp-cover-bg: rgba(13, 25, 48, 0.90);
            --sp-cover-border: rgba(144, 176, 220, 0.18);
            --sp-cover-text: #f7fbff;
            --sp-cover-muted: #91a2b9;
            --sp-cover-accent: #49d7ff;
            --sp-cover-accent-soft: rgba(73, 215, 255, 0.16);

            display: block;
            font-family:
              Inter,
              system-ui,
              -apple-system,
              BlinkMacSystemFont,
              "Segoe UI",
              sans-serif;
          }

          button,
          input {
            font: inherit;
          }

          .card {
            position: relative;
            overflow: hidden;
            border: 1px solid var(--sp-cover-border);
            border-radius: 18px;
            background:
              linear-gradient(
                145deg,
                rgba(255, 255, 255, 0.035),
                transparent 45%
              ),
              var(--sp-cover-bg);
            box-shadow: 0 14px 34px rgba(0, 0, 0, 0.26);
            color: var(--sp-cover-text);
            transition:
              border-color 150ms ease,
              background 150ms ease,
              box-shadow 150ms ease;
          }

          .card.is-active {
            border-color: rgba(73, 215, 255, 0.40);
            background:
              radial-gradient(
                circle at 12% 20%,
                var(--sp-cover-accent-soft),
                transparent 38%
              ),
              var(--sp-cover-bg);
          }

          .card.is-unavailable {
            opacity: 0.58;
          }

          .summary {
            display: grid;
            grid-template-columns: auto minmax(0, 1fr) auto;
            align-items: center;
            gap: 12px;
            min-height: 68px;
            padding: 12px 14px;
            cursor: pointer;
            user-select: none;
            -webkit-tap-highlight-color: transparent;
          }

          .summary:hover:not(.disabled) {
            background: rgba(255, 255, 255, 0.025);
          }

          .summary:focus-visible,
          .control:focus-visible,
          .position-slider:focus-visible {
            outline: 2px solid var(--sp-cover-accent);
            outline-offset: -2px;
          }

          .summary.disabled {
            cursor: not-allowed;
          }

          .icon-tile {
            display: grid;
            place-items: center;
            width: 46px;
            height: 46px;
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 14px;
            background: rgba(255, 255, 255, 0.055);
            color: var(--sp-cover-muted);
          }

          .card.is-active .icon-tile {
            border-color: rgba(73, 215, 255, 0.40);
            background: var(--sp-cover-accent-soft);
            color: var(--sp-cover-accent);
            box-shadow: 0 0 24px rgba(73, 215, 255, 0.14);
          }

          ha-icon {
            width: 24px;
            height: 24px;
          }

          .content {
            min-width: 0;
          }

          .name {
            overflow: hidden;
            color: var(--sp-cover-text);
            font-size: 14px;
            font-weight: 760;
            line-height: 1.25;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          .state {
            margin-top: 4px;
            color: var(--sp-cover-muted);
            font-size: 11px;
            font-weight: 650;
            line-height: 1.2;
          }

          .card.is-active .state {
            color: #9cecff;
          }

          .chevron {
            display: grid;
            place-items: center;
            width: 32px;
            height: 32px;
            border-radius: 10px;
            color: var(--sp-cover-muted);
            transition: transform 150ms ease;
          }

          .card.is-expanded .chevron {
            transform: rotate(180deg);
          }

          .quick-actions {
            display: flex;
            align-items: center;
            justify-content: flex-end;
            gap: 6px;
          }

          .quick-action {
            display: grid;
            place-items: center;
            width: 34px;
            height: 34px;
            padding: 0;
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 11px;
            background: rgba(255, 255, 255, 0.045);
            color: var(--sp-cover-muted);
            cursor: pointer;
            transition:
              transform 120ms ease,
              border-color 140ms ease,
              background 140ms ease,
              color 140ms ease;
          }

          .quick-action:hover:not(:disabled) {
            border-color: rgba(73, 215, 255, 0.34);
            color: var(--sp-cover-text);
          }

          .quick-action:active:not(:disabled) {
            transform: scale(0.95);
          }

          .quick-action:focus-visible {
            outline: 2px solid var(--sp-cover-accent);
            outline-offset: 2px;
          }

          .quick-action:disabled {
            cursor: not-allowed;
            opacity: 0.32;
          }

          .quick-action.quick-stop {
            width: 74px;
            border-color: rgba(73, 215, 255, 0.42);
            background: var(--sp-cover-accent-soft);
            color: var(--sp-cover-accent);
          }

          .details {
            display: grid;
            gap: 12px;
            padding: 0 14px 14px;
            border-top: 1px solid rgba(255, 255, 255, 0.055);
          }

          .controls {
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 8px;
            padding-top: 12px;
          }

          .control {
            display: grid;
            place-items: center;
            min-height: 44px;
            padding: 0;
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 13px;
            background: rgba(255, 255, 255, 0.045);
            color: var(--sp-cover-muted);
            cursor: pointer;
            transition:
              transform 120ms ease,
              border-color 140ms ease,
              background 140ms ease,
              color 140ms ease;
          }

          .control:hover:not(:disabled) {
            border-color: rgba(73, 215, 255, 0.30);
            color: var(--sp-cover-text);
          }

          .control:active:not(:disabled) {
            transform: scale(0.97);
          }

          .control.active {
            border-color: rgba(73, 215, 255, 0.44);
            background: var(--sp-cover-accent-soft);
            color: var(--sp-cover-accent);
          }

          .control.stop {
            color: #d8e2ef;
          }

          .control:disabled {
            cursor: not-allowed;
            opacity: 0.45;
          }

          .position-row {
            display: grid;
            grid-template-columns: minmax(0, 1fr) 44px;
            align-items: center;
            gap: 10px;
          }

          .position-slider {
            width: 100%;
            height: 18px;
            margin: 0;
            accent-color: var(--sp-cover-accent);
            cursor: pointer;
          }

          .position-value {
            color: var(--sp-cover-text);
            font-size: 11px;
            font-weight: 760;
            text-align: right;
            font-variant-numeric: tabular-nums;
          }

          .version {
            position: absolute;
            right: 9px;
            bottom: 3px;
            color: rgba(145, 162, 185, 0.30);
            font-size: 8px;
            pointer-events: none;
          }

          .card[data-density="comfortable"] .summary {
            min-height: 92px;
            padding: 18px;
            gap: 15px;
          }

          .card[data-density="comfortable"] .icon-tile {
            width: 56px;
            height: 56px;
            border-radius: 17px;
          }

          .card[data-density="comfortable"] .name {
            font-size: 16px;
          }

          .card[data-density="ultra-compact"] {
            border-radius: 14px;
          }

          .card[data-density="ultra-compact"] .summary {
            min-height: 54px;
            padding: 8px 10px;
            gap: 9px;
          }

          .card[data-density="ultra-compact"] .icon-tile {
            width: 38px;
            height: 38px;
            border-radius: 12px;
          }

          .card[data-density="ultra-compact"] .name {
            font-size: 12px;
          }

          .card[data-density="ultra-compact"] .state,
          .card[data-density="ultra-compact"] .position-value {
            font-size: 10px;
          }

          .card[data-density="ultra-compact"] .details {
            gap: 8px;
            padding: 0 10px 10px;
          }

          .card[data-density="ultra-compact"] .controls {
            gap: 6px;
            padding-top: 9px;
          }

          .card[data-density="ultra-compact"] .control {
            min-height: 38px;
            border-radius: 11px;
          }

          .card[data-density="ultra-compact"] .quick-action {
            width: 30px;
            height: 30px;
            border-radius: 10px;
          }

          .card[data-density="ultra-compact"] .quick-action.quick-stop {
            width: 62px;
          }

          @media (prefers-reduced-motion: reduce) {
            .card,
            .chevron,
            .control,
            .quick-action {
              transition: none;
            }
          }
        </style>

        <article
          class="card ${this._expanded ? "is-expanded" : ""} ${
            status === "opening" || status === "closing" || (position ?? 0) > 0
              ? "is-active"
              : ""
          } ${unavailable ? "is-unavailable" : ""}"
          data-density="${density}"
        >
          <div
            class="summary ${unavailable ? "disabled" : ""}"
            role="button"
            tabindex="${unavailable ? "-1" : "0"}"
            aria-expanded="${this._expanded ? "true" : "false"}"
            aria-disabled="${unavailable ? "true" : "false"}"
            aria-label="${this._expanded ? "Κλείσιμο" : "Άνοιγμα"} χειριστηρίων για ${this._escape(name)}"
          >
            <div class="icon-tile" aria-hidden="true">
              <ha-icon icon="${this._escape(this._config.icon)}"></ha-icon>
            </div>

            <div class="content">
              <div class="name">${this._escape(name)}</div>
              <div class="state">${this._escape(stateLabel)}</div>
            </div>

            ${
              this._expanded
                ? `
                  <div class="chevron" aria-hidden="true">
                    <ha-icon icon="mdi:chevron-down"></ha-icon>
                  </div>
                `
                : isMoving
                  ? `
                    <div class="quick-actions">
                      <button
                        class="quick-action quick-stop quick-stop-command"
                        type="button"
                        aria-label="Άμεσο σταμάτημα ${this._escape(name)}"
                        ${unavailable ? "disabled" : ""}
                      >
                        <ha-icon icon="mdi:stop"></ha-icon>
                      </button>
                    </div>
                  `
                  : `
                    <div class="quick-actions">
                      <button
                        class="quick-action quick-close"
                        type="button"
                        aria-label="Γρήγορο κλείσιμο ${this._escape(name)}"
                        ${unavailable || atClosed ? "disabled" : ""}
                      >
                        <ha-icon icon="mdi:chevron-left"></ha-icon>
                      </button>

                      <button
                        class="quick-action quick-open"
                        type="button"
                        aria-label="Γρήγορο άνοιγμα ${this._escape(name)}"
                        ${unavailable || atOpen ? "disabled" : ""}
                      >
                        <ha-icon icon="mdi:chevron-right"></ha-icon>
                      </button>
                    </div>
                  `
            }
          </div>

          ${
            this._expanded
              ? `
                <div class="details">
                  <div class="controls">
                    <button
                      class="control close ${status === "closing" ? "active" : ""}"
                      type="button"
                      aria-label="Κλείσιμο ${this._escape(name)}"
                      ${unavailable || atClosed ? "disabled" : ""}
                    >
                      <ha-icon icon="mdi:chevron-left"></ha-icon>
                    </button>

                    <button
                      class="control stop"
                      type="button"
                      aria-label="Σταμάτημα ${this._escape(name)}"
                      ${unavailable ? "disabled" : ""}
                    >
                      <ha-icon icon="mdi:stop"></ha-icon>
                    </button>

                    <button
                      class="control open ${status === "opening" ? "active" : ""}"
                      type="button"
                      aria-label="Άνοιγμα ${this._escape(name)}"
                      ${unavailable || atOpen ? "disabled" : ""}
                    >
                      <ha-icon icon="mdi:chevron-right"></ha-icon>
                    </button>
                  </div>

                  ${
                    hasPosition
                      ? `
                        <div class="position-row">
                          <input
                            class="position-slider"
                            type="range"
                            min="0"
                            max="100"
                            step="1"
                            value="${targetPosition ?? position ?? 0}"
                            aria-label="Θέση ${this._escape(name)}"
                            ${unavailable ? "disabled" : ""}
                          />
                          <span class="position-value">${targetPosition ?? position ?? 0}%</span>
                        </div>
                      `
                      : ""
                  }
                </div>
              `
              : ""
          }

          <span class="version">α ${VERSION}</span>
        </article>
      `;

      const summary = this.shadowRoot.querySelector(".summary");
      const openButton = this.shadowRoot.querySelector(".open");
      const stopButton = this.shadowRoot.querySelector(".stop");
      const closeButton = this.shadowRoot.querySelector(".close");
      const quickOpenButton = this.shadowRoot.querySelector(".quick-open");
      const quickCloseButton = this.shadowRoot.querySelector(".quick-close");
      const quickStopButton = this.shadowRoot.querySelector(".quick-stop-command");
      const slider = this.shadowRoot.querySelector(".position-slider");
      const positionValue = this.shadowRoot.querySelector(".position-value");

      summary?.addEventListener("click", (event) => {
        this._toggleExpanded(event);
      });

      summary?.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          this._toggleExpanded(event);
        }
      });

      openButton?.addEventListener("click", (event) => this._open(event));
      stopButton?.addEventListener("click", (event) => this._stop(event));
      closeButton?.addEventListener("click", (event) => this._close(event));
      quickOpenButton?.addEventListener("click", (event) => this._open(event));
      quickCloseButton?.addEventListener("click", (event) => this._close(event));
      quickStopButton?.addEventListener("click", (event) => this._stop(event));

      if (slider) {
        for (const eventName of [
          "click",
          "pointerdown",
          "pointerup",
          "mousedown",
          "mouseup",
          "touchstart",
          "touchend",
        ]) {
          slider.addEventListener(eventName, (event) => {
            event.stopPropagation();
          });
        }

        slider.addEventListener("input", (event) => {
          event.stopPropagation();
          const value = this._clampPosition(event.target.value) ?? 0;
          this._pendingPosition = value;

          if (positionValue) {
            positionValue.textContent = `${value}%`;
          }
        });

        slider.addEventListener("change", (event) => {
          event.stopPropagation();
          this._setPosition(event.target.value);
        });
      }
    }
  }


  class SmartProThermostatCard extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: "open" });
      this._config = null;
      this._hass = null;
      this._expanded = false;
      this._pendingTarget = null;
    }

    setConfig(config) {
      const hasClimateEntity =
        typeof config?.entity === "string" &&
        config.entity.startsWith("climate.");

      const hasHelperAdapter =
        typeof config?.power_entity === "string" &&
        typeof config?.heat_mode_entity === "string" &&
        typeof config?.target_entity === "string" &&
        typeof config?.current_temperature_entity === "string";

      if (!hasClimateEntity && !hasHelperAdapter) {
        throw new Error(
          "Η Smart Pro Thermostat Card χρειάζεται entity: climate.* ή power_entity, heat_mode_entity, target_entity και current_temperature_entity."
        );
      }

      this._config = {
        name: "",
        icon: "mdi:thermostat",
        density: "compact",
        show_humidity: true,
        show_presets: true,
        show_boiler: true,
        ...config,
      };

      this._render();
    }

    set hass(hass) {
      this._hass = hass;
      this._reconcilePendingTarget();
      this._render();
    }

    getCardSize() {
      return this._expanded ? 5 : 2;
    }

    _isHelperMode() {
      return !this._config?.entity;
    }

    _state(entityId) {
      return entityId ? this._hass?.states?.[entityId] || null : null;
    }

    _entity() {
      return this._config?.entity
        ? this._state(this._config.entity)
        : null;
    }

    _attributes() {
      return this._entity()?.attributes || {};
    }

    _helperBoolean(entityId) {
      return this._state(entityId)?.state === "on";
    }

    _number(value) {
      const number = Number(value);
      return Number.isFinite(number) ? number : null;
    }

    _isUnavailable() {
      if (!this._hass) {
        return true;
      }

      if (this._isHelperMode()) {
        const requiredEntities = [
          this._config.power_entity,
          this._config.heat_mode_entity,
          this._config.target_entity,
          this._config.current_temperature_entity,
        ];

        return requiredEntities.some((entityId) => {
          const entity = this._state(entityId);
          return (
            !entity ||
            ["unavailable", "unknown"].includes(entity.state)
          );
        });
      }

      const entity = this._entity();

      return (
        !entity ||
        ["unavailable", "unknown"].includes(entity.state)
      );
    }

    _unit() {
      if (this._isHelperMode()) {
        return (
          this._config.temperature_unit ||
          this._state(this._config.current_temperature_entity)
            ?.attributes?.unit_of_measurement ||
          this._hass?.config?.unit_system?.temperature ||
          "°C"
        );
      }

      return (
        this._attributes().temperature_unit ||
        this._hass?.config?.unit_system?.temperature ||
        "°C"
      );
    }

    _temperatureStep() {
      if (this._isHelperMode()) {
        const helperStep =
          this._number(this._config.temperature_step) ??
          this._number(
            this._state(this._config.target_entity)?.attributes?.step
          );

        if (helperStep && helperStep > 0) {
          return helperStep;
        }
      }

      const step = this._number(this._attributes().target_temp_step);

      if (step && step > 0) {
        return step;
      }

      return this._unit() === "°F" ? 1 : 0.5;
    }

    _temperatureLimits() {
      const unit = this._unit();
      const fallbackMin = unit === "°F" ? 45 : 7;
      const fallbackMax = unit === "°F" ? 95 : 35;

      if (this._isHelperMode()) {
        const attributes =
          this._state(this._config.target_entity)?.attributes || {};

        return {
          min:
            this._number(this._config.min_temp) ??
            this._number(attributes.min) ??
            fallbackMin,
          max:
            this._number(this._config.max_temp) ??
            this._number(attributes.max) ??
            fallbackMax,
        };
      }

      return {
        min: this._number(this._attributes().min_temp) ?? fallbackMin,
        max: this._number(this._attributes().max_temp) ?? fallbackMax,
      };
    }

    _roundToStep(value) {
      const step = this._temperatureStep();
      const decimals = step < 1 ? 1 : 0;
      const rounded = Math.round(value / step) * step;
      return Number(rounded.toFixed(decimals));
    }

    _clampTemperature(value) {
      const { min, max } = this._temperatureLimits();
      return Math.min(max, Math.max(min, this._roundToStep(value)));
    }

    _currentTemperature() {
      if (this._isHelperMode()) {
        return this._number(
          this._state(this._config.current_temperature_entity)?.state
        );
      }

      return this._number(this._attributes().current_temperature);
    }

    _actualTarget() {
      if (this._isHelperMode()) {
        const temperature = this._number(
          this._state(this._config.target_entity)?.state
        );

        return temperature === null
          ? null
          : {
              type: "single",
              temperature,
            };
      }

      const attributes = this._attributes();
      const low = this._number(attributes.target_temp_low);
      const high = this._number(attributes.target_temp_high);

      if (low !== null && high !== null) {
        return {
          type: "range",
          low,
          high,
        };
      }

      const temperature = this._number(attributes.temperature);

      if (temperature !== null) {
        return {
          type: "single",
          temperature,
        };
      }

      return null;
    }

    _target() {
      return this._pendingTarget || this._actualTarget();
    }

    _reconcilePendingTarget() {
      if (!this._pendingTarget) {
        return;
      }

      const actual = this._actualTarget();
      const step = this._temperatureStep();
      const tolerance = Math.max(0.1, step / 2);

      if (!actual || actual.type !== this._pendingTarget.type) {
        return;
      }

      if (
        actual.type === "single" &&
        Math.abs(actual.temperature - this._pendingTarget.temperature) <= tolerance
      ) {
        this._pendingTarget = null;
      }

      if (
        actual.type === "range" &&
        Math.abs(actual.low - this._pendingTarget.low) <= tolerance &&
        Math.abs(actual.high - this._pendingTarget.high) <= tolerance
      ) {
        this._pendingTarget = null;
      }
    }

    _targetCenter(target = this._target()) {
      if (!target) {
        return null;
      }

      if (target.type === "range") {
        return (target.low + target.high) / 2;
      }

      return target.temperature;
    }

    _formatTemperature(value, includeUnit = true) {
      if (value === null || value === undefined || !Number.isFinite(Number(value))) {
        return "—";
      }

      const step = this._temperatureStep();
      const decimals =
        step < 1 || Math.abs(Number(value) % 1) > 0.001 ? 1 : 0;
      const formatted = Number(value).toFixed(decimals);

      return includeUnit ? `${formatted}${this._unit()}` : formatted;
    }

    _formatTarget(target = this._target()) {
      if (!target) {
        return "—";
      }

      if (target.type === "range") {
        return `${this._formatTemperature(target.low, false)}–${this._formatTemperature(
          target.high,
          false
        )}${this._unit()}`;
      }

      return this._formatTemperature(target.temperature);
    }

    _hvacMode() {
      if (this._isHelperMode()) {
        if (!this._helperBoolean(this._config.power_entity)) {
          return "off";
        }

        return this._helperBoolean(this._config.heat_mode_entity)
          ? "heat"
          : "cool";
      }

      return String(this._entity()?.state || "unknown");
    }

    _hvacModes() {
      if (this._isHelperMode()) {
        return ["off", "heat", "cool"];
      }

      const modes = this._attributes().hvac_modes;
      return Array.isArray(modes) ? modes : [];
    }

    _presetModes() {
      if (this._isHelperMode()) {
        return [];
      }

      const presets = this._attributes().preset_modes;
      return Array.isArray(presets) ? presets : [];
    }

    _hvacAction() {
      if (this._isHelperMode()) {
        const mode = this._hvacMode();

        if (mode === "off") {
          return "off";
        }

        if (
          this._config.eco_pause_entity &&
          this._helperBoolean(this._config.eco_pause_entity)
        ) {
          return "idle";
        }

        const current = this._currentTemperature();
        const target = this._targetCenter();

        if (current === null || target === null) {
          return "idle";
        }

        const deadband =
          this._number(this._config.deadband) ??
          Math.max(0.1, this._temperatureStep() / 2);

        if (mode === "heat" && current < target - deadband) {
          return "heating";
        }

        if (mode === "cool" && current > target + deadband) {
          return "cooling";
        }

        return "idle";
      }

      return String(this._attributes().hvac_action || "idle");
    }

    _modeLabel(mode) {
      const labels = {
        off: "Κλειστό",
        heat: "Θέρμανση",
        cool: "Ψύξη",
        heat_cool: "Auto H/C",
        auto: "Αυτόματο",
        dry: "Αφύγρανση",
        fan_only: "Ανεμιστήρας",
      };

      return labels[mode] || String(mode || "Άγνωστο");
    }

    _presetLabel(preset) {
      const labels = {
        none: "Κανονικό",
        home: "Σπίτι",
        away: "Απουσία",
        eco: "Eco",
        comfort: "Comfort",
        sleep: "Ύπνος",
        activity: "Δραστηριότητα",
        boost: "Boost",
      };

      return labels[preset] || String(preset);
    }

    _actionLabel() {
      const action = this._hvacAction();
      const labels = {
        heating: "Θερμαίνει",
        cooling: "Ψύχει",
        drying: "Αφυγραίνει",
        fan: "Αερισμός",
        idle: "Σε αναμονή",
        off: "Κλειστό",
      };

      if (labels[action]) {
        return labels[action];
      }

      return this._modeLabel(this._hvacMode());
    }

    _tone() {
      const action = this._hvacAction();
      const mode = this._hvacMode();

      if (action === "heating") {
        return "heat";
      }

      if (action === "cooling") {
        return "cool";
      }

      if (action === "drying") {
        return "dry";
      }

      if (action === "fan") {
        return "fan";
      }

      if (mode === "heat") {
        return "heat-idle";
      }

      if (mode === "cool") {
        return "cool-idle";
      }

      if (mode === "off") {
        return "off";
      }

      return "neutral";
    }

    _displayName() {
      const helperFriendlyName = this._isHelperMode()
        ? this._state(this._config.current_temperature_entity)
            ?.attributes?.friendly_name
        : "";

      return (
        this._config?.name ||
        this._attributes().friendly_name ||
        helperFriendlyName ||
        "Θερμοστάτης"
      );
    }

    _humidity() {
      if (this._isHelperMode()) {
        return this._number(
          this._state(this._config.humidity_entity)?.state
        );
      }

      return (
        this._number(this._attributes().current_humidity) ??
        this._number(this._attributes().humidity)
      );
    }

    _boilerIsOn() {
      return Boolean(
        this._config.boiler_entity &&
        this._helperBoolean(this._config.boiler_entity)
      );
    }

    _ecoPauseIsOn() {
      return Boolean(
        this._config.eco_pause_entity &&
        this._helperBoolean(this._config.eco_pause_entity)
      );
    }

    _dialProgress() {
      const center = this._targetCenter();
      const { min, max } = this._temperatureLimits();

      if (center === null || max <= min) {
        return 0;
      }

      const ratio = Math.min(1, Math.max(0, (center - min) / (max - min)));
      return Math.round(ratio * 270);
    }

    _toggleExpanded(event) {
      event?.preventDefault();
      event?.stopPropagation();

      if (this._isUnavailable()) {
        return;
      }

      this._expanded = !this._expanded;
      this._render();

      requestAnimationFrame(() => {
        this.dispatchEvent(
          new CustomEvent("iron-resize", {
            bubbles: true,
            composed: true,
          })
        );
      });
    }

    _adjustTarget(direction, event) {
      event?.preventDefault();
      event?.stopPropagation();

      if (this._isUnavailable()) {
        return;
      }

      const target = this._target();
      if (!target) {
        return;
      }

      const delta = this._temperatureStep() * direction;
      let serviceData;

      if (target.type === "range") {
        const width = Math.max(this._temperatureStep(), target.high - target.low);
        let low = this._clampTemperature(target.low + delta);
        let high = this._clampTemperature(target.high + delta);
        const { min, max } = this._temperatureLimits();

        if (high - low < width) {
          if (direction > 0) {
            low = this._roundToStep(Math.max(min, high - width));
          } else {
            high = this._roundToStep(Math.min(max, low + width));
          }
        }

        this._pendingTarget = {
          type: "range",
          low,
          high,
        };

        serviceData = {
          entity_id: this._config.entity,
          target_temp_low: low,
          target_temp_high: high,
        };
      } else {
        const temperature = this._clampTemperature(
          target.temperature + delta
        );

        this._pendingTarget = {
          type: "single",
          temperature,
        };

        serviceData = {
          entity_id: this._config.entity,
          temperature,
        };
      }

      this._render();

      if (this._isHelperMode()) {
        this._hass.callService("input_number", "set_value", {
          entity_id: this._config.target_entity,
          value: this._pendingTarget.temperature,
        });
        return;
      }

      this._hass.callService("climate", "set_temperature", serviceData);
    }

    _setMode(mode, event) {
      event?.preventDefault();
      event?.stopPropagation();

      if (
        this._isUnavailable() ||
        !this._hvacModes().includes(mode)
      ) {
        return;
      }

      if (this._isHelperMode()) {
        if (mode === "off") {
          this._hass.callService("input_boolean", "turn_off", {
            entity_id: this._config.power_entity,
          });
          return;
        }

        this._hass.callService("input_boolean", "turn_on", {
          entity_id: this._config.power_entity,
        });

        this._hass.callService(
          "input_boolean",
          mode === "heat" ? "turn_on" : "turn_off",
          {
            entity_id: this._config.heat_mode_entity,
          }
        );
        return;
      }

      this._hass.callService("climate", "set_hvac_mode", {
        entity_id: this._config.entity,
        hvac_mode: mode,
      });
    }

    _toggleBoiler(event) {
      event?.preventDefault();
      event?.stopPropagation();

      if (
        this._isUnavailable() ||
        !this._config.boiler_entity
      ) {
        return;
      }

      this._hass.callService("input_boolean", "toggle", {
        entity_id: this._config.boiler_entity,
      });
    }

    _setPreset(preset, event) {
      event?.preventDefault();
      event?.stopPropagation();

      if (
        this._isUnavailable() ||
        !this._presetModes().includes(preset)
      ) {
        return;
      }

      this._hass.callService("climate", "set_preset_mode", {
        entity_id: this._config.entity,
        preset_mode: preset,
      });
    }

    _escape(value) {
      return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
    }

    _render() {
      if (!this.shadowRoot || !this._config) {
        return;
      }

      const unavailable = this._isUnavailable();
      const entity = this._entity();
      const hasSource = this._isHelperMode()
        ? Boolean(this._state(this._config.current_temperature_entity))
        : Boolean(entity);
      const currentTemperature = this._currentTemperature();
      const target = this._target();
      const humidity = this._humidity();
      const mode = this._hvacMode();
      const modes = this._hvacModes();
      const presets = this._presetModes();
      const activePreset = this._isHelperMode()
        ? ""
        : String(this._attributes().preset_mode || "");
      const boilerIsOn = this._boilerIsOn();
      const ecoPauseIsOn = this._ecoPauseIsOn();
      const name = this._displayName();
      const tone = this._tone();
      const targetText = this._formatTarget(target);
      const currentText = this._formatTemperature(currentTemperature);
      const progress = this._dialProgress();

      const statusText = !hasSource
        ? "Φόρτωση…"
        : unavailable
          ? "Μη διαθέσιμο"
          : ecoPauseIsOn
            ? `Eco Pause · Στόχος ${targetText}`
            : `${this._actionLabel()} · Στόχος ${targetText}`;

      this.shadowRoot.innerHTML = `
        <style>
          :host {
            --sp-climate-bg: rgba(13, 25, 48, 0.92);
            --sp-climate-border: rgba(144, 176, 220, 0.18);
            --sp-climate-text: #f7fbff;
            --sp-climate-muted: #91a2b9;
            --sp-climate-heat: #ffad4d;
            --sp-climate-cool: #49d7ff;
            --sp-climate-dry: #c897ff;
            --sp-climate-fan: #6ee7c8;
            --sp-climate-neutral: #91a2b9;
            --sp-climate-tone: var(--sp-climate-neutral);
            --sp-climate-tone-soft: rgba(145, 162, 185, 0.12);

            display: block;
            font-family:
              Inter,
              system-ui,
              -apple-system,
              BlinkMacSystemFont,
              "Segoe UI",
              sans-serif;
          }

          button {
            font: inherit;
          }

          .card[data-tone="heat"],
          .card[data-tone="heat-idle"] {
            --sp-climate-tone: var(--sp-climate-heat);
            --sp-climate-tone-soft: rgba(255, 173, 77, 0.15);
          }

          .card[data-tone="cool"],
          .card[data-tone="cool-idle"] {
            --sp-climate-tone: var(--sp-climate-cool);
            --sp-climate-tone-soft: rgba(73, 215, 255, 0.15);
          }

          .card[data-tone="dry"] {
            --sp-climate-tone: var(--sp-climate-dry);
            --sp-climate-tone-soft: rgba(200, 151, 255, 0.15);
          }

          .card[data-tone="fan"] {
            --sp-climate-tone: var(--sp-climate-fan);
            --sp-climate-tone-soft: rgba(110, 231, 200, 0.14);
          }

          .card[data-tone="off"] {
            --sp-climate-tone: #77869a;
            --sp-climate-tone-soft: rgba(119, 134, 154, 0.10);
          }

          .card {
            position: relative;
            overflow: hidden;
            border: 1px solid var(--sp-climate-border);
            border-radius: 20px;
            background:
              radial-gradient(
                circle at 88% 10%,
                var(--sp-climate-tone-soft),
                transparent 36%
              ),
              linear-gradient(
                145deg,
                rgba(255, 255, 255, 0.035),
                transparent 48%
              ),
              var(--sp-climate-bg);
            box-shadow: 0 16px 38px rgba(0, 0, 0, 0.28);
            color: var(--sp-climate-text);
            transition:
              border-color 160ms ease,
              background 160ms ease,
              box-shadow 160ms ease;
          }

          .card.is-active {
            border-color: color-mix(
              in srgb,
              var(--sp-climate-tone) 42%,
              transparent
            );
            box-shadow:
              0 16px 38px rgba(0, 0, 0, 0.28),
              0 0 30px color-mix(
                in srgb,
                var(--sp-climate-tone) 11%,
                transparent
              );
          }

          .card.is-unavailable {
            opacity: 0.58;
          }

          .summary {
            display: grid;
            grid-template-columns: auto minmax(0, 1fr) auto;
            align-items: center;
            gap: 13px;
            min-height: 82px;
            padding: 14px 15px;
            cursor: pointer;
            user-select: none;
            -webkit-tap-highlight-color: transparent;
          }

          .summary:hover:not(.disabled) {
            background: rgba(255, 255, 255, 0.022);
          }

          .summary.disabled {
            cursor: not-allowed;
          }

          .summary:focus-visible,
          .temperature-button:focus-visible,
          .mode-button:focus-visible,
          .preset-button:focus-visible {
            outline: 2px solid var(--sp-climate-tone);
            outline-offset: 2px;
          }

          .icon-tile {
            position: relative;
            display: grid;
            place-items: center;
            width: 50px;
            height: 50px;
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 16px;
            background: rgba(255, 255, 255, 0.05);
            color: var(--sp-climate-tone);
          }

          .icon-tile::after {
            content: "";
            position: absolute;
            width: 7px;
            height: 7px;
            right: 5px;
            bottom: 5px;
            border: 2px solid var(--sp-climate-bg);
            border-radius: 999px;
            background: var(--sp-climate-tone);
            box-shadow: 0 0 12px var(--sp-climate-tone);
          }

          ha-icon {
            width: 25px;
            height: 25px;
          }

          .summary-content {
            min-width: 0;
          }

          .name-line {
            display: flex;
            align-items: center;
            gap: 8px;
            min-width: 0;
          }

          .name {
            overflow: hidden;
            color: var(--sp-climate-text);
            font-size: 14px;
            font-weight: 780;
            line-height: 1.25;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          .mode-badge {
            flex: 0 0 auto;
            max-width: 98px;
            overflow: hidden;
            padding: 4px 7px;
            border: 1px solid color-mix(
              in srgb,
              var(--sp-climate-tone) 32%,
              transparent
            );
            border-radius: 999px;
            background: var(--sp-climate-tone-soft);
            color: var(--sp-climate-tone);
            font-size: 9px;
            font-weight: 820;
            letter-spacing: 0.35px;
            text-overflow: ellipsis;
            text-transform: uppercase;
            white-space: nowrap;
          }

          .status {
            margin-top: 5px;
            overflow: hidden;
            color: var(--sp-climate-muted);
            font-size: 11px;
            font-weight: 650;
            line-height: 1.25;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          .current-block {
            min-width: 72px;
            text-align: right;
          }

          .current-temperature {
            color: var(--sp-climate-text);
            font-size: 24px;
            font-weight: 850;
            line-height: 1;
            letter-spacing: -0.8px;
            font-variant-numeric: tabular-nums;
          }

          .current-caption {
            margin-top: 5px;
            color: var(--sp-climate-muted);
            font-size: 9px;
            font-weight: 700;
            letter-spacing: 0.5px;
            text-transform: uppercase;
          }

          .details {
            display: grid;
            gap: 15px;
            padding: 14px 15px 16px;
            border-top: 1px solid rgba(255, 255, 255, 0.055);
          }

          .temperature-stage {
            display: grid;
            grid-template-columns: 52px minmax(0, 1fr) 52px;
            align-items: center;
            gap: 11px;
          }

          .temperature-button {
            display: grid;
            place-items: center;
            width: 52px;
            height: 52px;
            padding: 0;
            border: 1px solid rgba(255, 255, 255, 0.09);
            border-radius: 16px;
            background: rgba(255, 255, 255, 0.045);
            color: var(--sp-climate-text);
            cursor: pointer;
            font-size: 25px;
            font-weight: 350;
            transition:
              transform 120ms ease,
              border-color 140ms ease,
              background 140ms ease,
              color 140ms ease;
          }

          .temperature-button:hover:not(:disabled) {
            border-color: color-mix(
              in srgb,
              var(--sp-climate-tone) 40%,
              transparent
            );
            background: var(--sp-climate-tone-soft);
            color: var(--sp-climate-tone);
          }

          .temperature-button:active:not(:disabled) {
            transform: scale(0.96);
          }

          .temperature-button:disabled {
            cursor: not-allowed;
            opacity: 0.4;
          }

          .dial {
            position: relative;
            display: grid;
            place-items: center;
            width: min(176px, 100%);
            aspect-ratio: 1;
            margin: 0 auto;
          }

          .dial-ring {
            position: absolute;
            inset: 0;
            border-radius: 50%;
            background:
              conic-gradient(
                from 225deg,
                var(--sp-climate-tone) 0deg,
                var(--sp-climate-tone) var(--dial-progress),
                rgba(255, 255, 255, 0.085) var(--dial-progress),
                rgba(255, 255, 255, 0.085) 270deg,
                transparent 270deg,
                transparent 360deg
              );
            filter: drop-shadow(
              0 0 13px
              color-mix(
                in srgb,
                var(--sp-climate-tone) 18%,
                transparent
              )
            );
            -webkit-mask:
              radial-gradient(
                circle,
                transparent 59%,
                #000 60%,
                #000 69%,
                transparent 70%
              );
            mask:
              radial-gradient(
                circle,
                transparent 59%,
                #000 60%,
                #000 69%,
                transparent 70%
              );
          }

          .dial-center {
            position: relative;
            z-index: 1;
            display: grid;
            place-items: center;
            text-align: center;
          }

          .target-caption {
            color: var(--sp-climate-muted);
            font-size: 10px;
            font-weight: 780;
            letter-spacing: 0.7px;
            text-transform: uppercase;
          }

          .target-temperature {
            margin-top: 5px;
            color: var(--sp-climate-text);
            font-size: clamp(28px, 5vw, 42px);
            font-weight: 900;
            line-height: 1;
            letter-spacing: -1.5px;
            font-variant-numeric: tabular-nums;
          }

          .dial-current {
            margin-top: 7px;
            color: var(--sp-climate-tone);
            font-size: 11px;
            font-weight: 750;
          }

          .facts {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(110px, 1fr));
            gap: 8px;
          }

          .fact {
            min-width: 0;
            padding: 9px 10px;
            border: 1px solid rgba(255, 255, 255, 0.065);
            border-radius: 12px;
            background: rgba(255, 255, 255, 0.028);
          }

          .fact-label {
            color: var(--sp-climate-muted);
            font-size: 9px;
            font-weight: 750;
            letter-spacing: 0.45px;
            text-transform: uppercase;
          }

          .fact-value {
            margin-top: 4px;
            overflow: hidden;
            color: var(--sp-climate-text);
            font-size: 12px;
            font-weight: 760;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          .section {
            display: grid;
            gap: 8px;
          }

          .section-title {
            color: var(--sp-climate-muted);
            font-size: 9px;
            font-weight: 800;
            letter-spacing: 0.65px;
            text-transform: uppercase;
          }

          .button-list {
            display: flex;
            flex-wrap: wrap;
            gap: 7px;
          }

          .mode-button,
          .preset-button {
            min-height: 34px;
            padding: 0 11px;
            border: 1px solid rgba(255, 255, 255, 0.075);
            border-radius: 999px;
            background: rgba(255, 255, 255, 0.035);
            color: var(--sp-climate-muted);
            cursor: pointer;
            font-size: 10px;
            font-weight: 760;
            transition:
              transform 120ms ease,
              border-color 140ms ease,
              background 140ms ease,
              color 140ms ease;
          }

          .mode-button:hover:not(:disabled),
          .preset-button:hover:not(:disabled) {
            color: var(--sp-climate-text);
          }

          .mode-button:active:not(:disabled),
          .preset-button:active:not(:disabled) {
            transform: scale(0.97);
          }

          .mode-button.active,
          .preset-button.active {
            border-color: color-mix(
              in srgb,
              var(--sp-climate-tone) 42%,
              transparent
            );
            background: var(--sp-climate-tone-soft);
            color: var(--sp-climate-tone);
          }

          .mode-button:disabled,
          .preset-button:disabled {
            cursor: not-allowed;
            opacity: 0.42;
          }

          .version {
            position: absolute;
            right: 9px;
            bottom: 3px;
            color: rgba(145, 162, 185, 0.30);
            font-size: 8px;
            pointer-events: none;
          }

          .card[data-density="comfortable"] .summary {
            min-height: 96px;
            padding: 18px;
          }

          .card[data-density="comfortable"] .icon-tile {
            width: 58px;
            height: 58px;
            border-radius: 18px;
          }

          .card[data-density="comfortable"] .name {
            font-size: 16px;
          }

          .card[data-density="comfortable"] .current-temperature {
            font-size: 28px;
          }

          .card[data-density="comfortable"] .details {
            padding: 18px;
          }

          .card[data-density="ultra-compact"] {
            border-radius: 15px;
          }

          .card[data-density="ultra-compact"] .summary {
            min-height: 61px;
            padding: 9px 10px;
            gap: 9px;
          }

          .card[data-density="ultra-compact"] .icon-tile {
            width: 39px;
            height: 39px;
            border-radius: 12px;
          }

          .card[data-density="ultra-compact"] .name {
            font-size: 12px;
          }

          .card[data-density="ultra-compact"] .status {
            margin-top: 3px;
            font-size: 9px;
          }

          .card[data-density="ultra-compact"] .current-temperature {
            font-size: 19px;
          }

          .card[data-density="ultra-compact"] .current-caption {
            display: none;
          }

          .card[data-density="ultra-compact"] .mode-badge {
            display: none;
          }

          .card[data-density="ultra-compact"] .details {
            gap: 11px;
            padding: 11px 10px 12px;
          }

          .card[data-density="ultra-compact"] .temperature-stage {
            grid-template-columns: 42px minmax(0, 1fr) 42px;
            gap: 7px;
          }

          .card[data-density="ultra-compact"] .temperature-button {
            width: 42px;
            height: 42px;
            border-radius: 13px;
          }

          .card[data-density="ultra-compact"] .dial {
            width: min(140px, 100%);
          }

          @media (max-width: 390px) {
            .summary {
              grid-template-columns: auto minmax(0, 1fr) 66px;
            }

            .mode-badge {
              display: none;
            }

            .temperature-stage {
              grid-template-columns: 46px minmax(0, 1fr) 46px;
              gap: 8px;
            }

            .temperature-button {
              width: 46px;
              height: 46px;
            }

            .dial {
              width: min(150px, 100%);
            }
          }

          @media (prefers-reduced-motion: reduce) {
            .card,
            .temperature-button,
            .mode-button,
            .preset-button {
              transition: none;
            }
          }
        </style>

        <article
          class="card ${
            ["heating", "cooling", "drying", "fan"].includes(this._hvacAction())
              ? "is-active"
              : ""
          } ${unavailable ? "is-unavailable" : ""}"
          data-tone="${this._escape(tone)}"
          data-density="${this._escape(this._config.density)}"
        >
          <div
            class="summary ${unavailable ? "disabled" : ""}"
            role="button"
            tabindex="${unavailable ? "-1" : "0"}"
            aria-expanded="${this._expanded ? "true" : "false"}"
            aria-disabled="${unavailable ? "true" : "false"}"
            aria-label="${this._expanded ? "Κλείσιμο" : "Άνοιγμα"} χειριστηρίων για ${this._escape(name)}"
          >
            <div class="icon-tile" aria-hidden="true">
              <ha-icon icon="${this._escape(this._config.icon)}"></ha-icon>
            </div>

            <div class="summary-content">
              <div class="name-line">
                <div class="name">${this._escape(name)}</div>
                <span class="mode-badge">${this._escape(this._modeLabel(mode))}</span>
              </div>
              <div class="status">${this._escape(statusText)}</div>
            </div>

            <div class="current-block">
              <div class="current-temperature">${this._escape(currentText)}</div>
              <div class="current-caption">Χώρος</div>
            </div>
          </div>

          ${
            this._expanded
              ? `
                <div class="details">
                  <div class="temperature-stage">
                    <button
                      class="temperature-button temperature-down"
                      type="button"
                      aria-label="Μείωση επιθυμητής θερμοκρασίας"
                      ${unavailable || !target ? "disabled" : ""}
                    >
                      −
                    </button>

                    <div
                      class="dial"
                      style="--dial-progress: ${progress}deg;"
                      aria-label="Επιθυμητή θερμοκρασία ${this._escape(targetText)}"
                    >
                      <div class="dial-ring" aria-hidden="true"></div>
                      <div class="dial-center">
                        <div class="target-caption">Επιθυμητή</div>
                        <div class="target-temperature">${this._escape(targetText)}</div>
                        <div class="dial-current">Χώρος ${this._escape(currentText)}</div>
                      </div>
                    </div>

                    <button
                      class="temperature-button temperature-up"
                      type="button"
                      aria-label="Αύξηση επιθυμητής θερμοκρασίας"
                      ${unavailable || !target ? "disabled" : ""}
                    >
                      +
                    </button>
                  </div>

                  <div class="facts">
                    <div class="fact">
                      <div class="fact-label">Κατάσταση</div>
                      <div class="fact-value">${this._escape(this._actionLabel())}</div>
                    </div>

                    ${
                      this._config.show_humidity && humidity !== null
                        ? `
                          <div class="fact">
                            <div class="fact-label">Υγρασία</div>
                            <div class="fact-value">${Math.round(humidity)}%</div>
                          </div>
                        `
                        : ""
                    }

                    ${
                      activePreset
                        ? `
                          <div class="fact">
                            <div class="fact-label">Preset</div>
                            <div class="fact-value">${this._escape(this._presetLabel(activePreset))}</div>
                          </div>
                        `
                        : ""
                    }

                    ${
                      this._config.boiler_entity
                        ? `
                          <div class="fact">
                            <div class="fact-label">Boiler</div>
                            <div class="fact-value">${boilerIsOn ? "Ενεργό" : "Ανενεργό"}</div>
                          </div>
                        `
                        : ""
                    }

                    ${
                      this._config.eco_pause_entity
                        ? `
                          <div class="fact">
                            <div class="fact-label">Eco Pause</div>
                            <div class="fact-value">${ecoPauseIsOn ? "Ενεργό" : "Ανενεργό"}</div>
                          </div>
                        `
                        : ""
                    }
                  </div>

                  ${
                    this._config.show_boiler && this._config.boiler_entity
                      ? `
                        <div class="section">
                          <div class="section-title">Ζεστό νερό</div>
                          <div class="button-list">
                            <button
                              class="preset-button boiler-button ${boilerIsOn ? "active" : ""}"
                              type="button"
                              ${unavailable ? "disabled" : ""}
                            >
                              ${boilerIsOn ? "Boiler ενεργό" : "Ενεργοποίηση boiler"}
                            </button>
                          </div>
                        </div>
                      `
                      : ""
                  }

                  ${
                    modes.length
                      ? `
                        <div class="section">
                          <div class="section-title">Λειτουργία</div>
                          <div class="button-list">
                            ${modes
                              .map(
                                (availableMode) => `
                                  <button
                                    class="mode-button ${
                                      availableMode === mode ? "active" : ""
                                    }"
                                    type="button"
                                    data-mode="${this._escape(availableMode)}"
                                    ${unavailable ? "disabled" : ""}
                                  >
                                    ${this._escape(this._modeLabel(availableMode))}
                                  </button>
                                `
                              )
                              .join("")}
                          </div>
                        </div>
                      `
                      : ""
                  }

                  ${
                    this._config.show_presets && presets.length
                      ? `
                        <div class="section">
                          <div class="section-title">Σενάριο</div>
                          <div class="button-list">
                            ${presets
                              .map(
                                (preset) => `
                                  <button
                                    class="preset-button ${
                                      preset === activePreset ? "active" : ""
                                    }"
                                    type="button"
                                    data-preset="${this._escape(preset)}"
                                    ${unavailable ? "disabled" : ""}
                                  >
                                    ${this._escape(this._presetLabel(preset))}
                                  </button>
                                `
                              )
                              .join("")}
                          </div>
                        </div>
                      `
                      : ""
                  }
                </div>
              `
              : ""
          }

          <span class="version">α ${VERSION}</span>
        </article>
      `;

      const summary = this.shadowRoot.querySelector(".summary");
      const downButton = this.shadowRoot.querySelector(".temperature-down");
      const upButton = this.shadowRoot.querySelector(".temperature-up");
      const boilerButton = this.shadowRoot.querySelector(".boiler-button");

      summary?.addEventListener("click", (event) => {
        this._toggleExpanded(event);
      });

      summary?.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          this._toggleExpanded(event);
        }
      });

      downButton?.addEventListener("click", (event) => {
        this._adjustTarget(-1, event);
      });

      upButton?.addEventListener("click", (event) => {
        this._adjustTarget(1, event);
      });

      boilerButton?.addEventListener("click", (event) => {
        this._toggleBoiler(event);
      });

      this.shadowRoot.querySelectorAll(".mode-button").forEach((button) => {
        button.addEventListener("click", (event) => {
          this._setMode(button.dataset.mode, event);
        });
      });

      this.shadowRoot.querySelectorAll(".preset-button").forEach((button) => {
        button.addEventListener("click", (event) => {
          this._setPreset(button.dataset.preset, event);
        });
      });
    }
  }

  if (!customElements.get(TAG_NAME)) {
    customElements.define(TAG_NAME, SmartProLightCard);
  }

  if (!customElements.get(COVER_TAG_NAME)) {
    customElements.define(COVER_TAG_NAME, SmartProCoverCard);
  }

  if (!customElements.get(THERMOSTAT_TAG_NAME)) {
    customElements.define(
      THERMOSTAT_TAG_NAME,
      SmartProThermostatCard
    );
  }

  window.customCards = window.customCards || [];

  if (!window.customCards.some((card) => card.type === TAG_NAME)) {
    window.customCards.push({
      type: TAG_NAME,
      name: "Smart Pro Light Card",
      description:
        "Smart Pro κάρτα φωτισμού με αυτόματη αναγνώριση απλού ON/OFF ή dimmer.",
      preview: true,
    });
  }

  if (!window.customCards.some((card) => card.type === COVER_TAG_NAME)) {
    window.customCards.push({
      type: COVER_TAG_NAME,
      name: "Smart Pro Cover Card",
      description:
        "Compact Smart Pro κάρτα ρολού με ανάπτυξη χειριστηρίων και προαιρετική θέση 0–100%.",
      preview: true,
    });
  }

  if (!window.customCards.some((card) => card.type === THERMOSTAT_TAG_NAME)) {
    window.customCards.push({
      type: THERMOSTAT_TAG_NAME,
      name: "Smart Pro Thermostat Card",
      description:
        "Premium Smart Pro θερμοστάτης για climate.* ή helper-based δοκιμαστική εγκατάσταση.",
      preview: true,
    });
  }

  console.info(`Smart Pro Cards ${VERSION} loaded`);
})();
