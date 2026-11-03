'use strict';
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const sourceBytes = fs.readFileSync(path.join(root, 'smart-pro-cards.js'));
const original = sourceBytes.toString('utf8');
assert.equal(crypto.createHash('sha256').update(sourceBytes).digest('hex'),
  'db611964bab281eb0d7e67e5f137189b6dee87a5c0bd5931daaadc9f128177a8',
  'Historical alpha.10 source was modified');
const tokens = JSON.parse(fs.readFileSync(path.join(__dirname, 'themes.json'), 'utf8'));
assert.equal(tokens.schema, 'smart-pro-system-cards-theme-v1');
const lightStart = original.indexOf('  class SmartProLightCard extends HTMLElement {');
const coverStart = original.indexOf('  class SmartProCoverCard extends HTMLElement {');
assert(lightStart !== -1 && coverStart > lightStart, 'Missing historical Light/Cover boundaries');
let light = original.slice(lightStart, coverStart);
function replaceOnce(needle, replacement) {
  assert.equal(light.split(needle).length, 2, 'Missing or ambiguous anchor: ' + needle.slice(0, 60));
  light = light.replace(needle, replacement);
}
replaceOnce(
  '      this.shadowRoot.innerHTML = `\n        <style>',
  [
    '      // Opt-in themed styles; existing dashboards retain legacy appearance.',
    '      const theme = ["night", "graphite", "light"].includes(this._config.theme)',
    '        ? this._config.theme : "legacy";',
    '      const surface = ["solid", "soft-glass", "glass"].includes(this._config.surface)',
    '        ? this._config.surface : "solid";',
    '',
    '      this.shadowRoot.innerHTML = `',
    '        <style>'
  ].join('\n')
);
replaceOnce(
  '          data-density="${density}"',
  '          data-density="${density}"\n          data-sp-theme="${theme}"\n          data-sp-surface="${surface}"'
);
const rules = [];
for (const [id, t] of Object.entries(tokens.themes)) {
  assert(/^(night|graphite|light)$/.test(id));
  rules.push('          .card[data-sp-theme="' + id + '"] {');
  for (const [varName, value] of Object.entries({
    '--sp-bg':'rgb(' + t.surfaceRGB + ' / var(--sp-theme-alpha, 1))',
    '--sp-border':t.border, '--sp-text':t.text, '--sp-muted':t.muted,
    '--sp-accent':t.active,
    '--sp-accent-soft':'color-mix(in srgb, var(--sp-accent) 18%, transparent)',
    '--sp-focus':t.focus
  })) rules.push('            ' + varName + ': ' + value + ';');
  rules.push('            backdrop-filter: blur(var(--sp-theme-blur, 0px));');
  rules.push('            -webkit-backdrop-filter: blur(var(--sp-theme-blur, 0px));');
  rules.push('          }');
}
const active = '.card:is([data-sp-theme="night"], [data-sp-theme="graphite"], [data-sp-theme="light"])';
rules.push('          ' + active + '.is-on { border-color: color-mix(in srgb, var(--sp-accent) 38%, var(--sp-border)); }');
rules.push('          ' + active + '.is-on .state { color: var(--sp-accent); }');
rules.push('          ' + active + ' .icon-tile { border-color: var(--sp-border); background: var(--sp-accent-soft); }');
rules.push('          ' + active + ':focus-visible { outline-color: var(--sp-focus); }');
rules.push('          ' + active + ' .slider:focus-visible { outline-color: var(--sp-focus); }');
rules.push('          ' + active + '.is-unavailable { opacity: .74; }');
for (const [id, surface] of Object.entries(tokens.surfaces)) {
  assert(/^(solid|soft-glass|glass)$/.test(id));
  rules.push('          ' + active + '[data-sp-surface="' + id + '"] {');
  rules.push('            --sp-theme-alpha: ' + surface.alpha + ';');
  rules.push('            --sp-theme-blur: ' + surface.blur + ';');
  rules.push('          }');
}
rules.push('          @media (prefers-reduced-transparency: reduce), (prefers-contrast: more), (forced-colors: active) {');
rules.push('            ' + active + ' { --sp-theme-alpha: 1; --sp-theme-blur: 0px; }');
rules.push('          }');
replaceOnce('          @media (prefers-reduced-motion: reduce) {',
  rules.join('\n') + '\n\n          @media (prefers-reduced-motion: reduce) {');
const output = original.slice(0, lightStart) + light + original.slice(coverStart);
assert.equal(output.slice(output.indexOf('  class SmartProCoverCard extends HTMLElement {')),
  original.slice(coverStart), 'Cover/Thermostat source must be unchanged');
const dest = path.join(root, 'dist/smart-pro-cards-themed.js');
if (process.argv.includes('--check')) {
  assert(fs.existsSync(dest), 'Build themed runtime first');
  assert.equal(fs.readFileSync(dest, 'utf8'), output, 'Generated runtime is stale');
  console.log('PASS: opt-in Light runtime matches recovered source and theme tokens');
} else {
  fs.mkdirSync(path.dirname(dest), {recursive:true});
  fs.writeFileSync(dest, output, 'utf8');
  console.log('Built themed Light runtime (' + Buffer.byteLength(output) + ' bytes)');
}
