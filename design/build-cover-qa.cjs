'use strict';
/**
 * Generate an isolated, themed Cover QA component from the untouched historical alpha.10.
 * Never overwrites the recovered bundle, existing Home Assistant card tags, or Light QA cards.
 */
const assert=require('node:assert/strict');
const crypto=require('node:crypto');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const bytes=fs.readFileSync(path.join(root,'smart-pro-cards.js'));
assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),
  'db611964bab281eb0d7e67e5f137189b6dee87a5c0bd5931daaadc9f128177a8',
  'Recovered alpha.10 must not be modified');
const source=bytes.toString('utf8');
const tokens=JSON.parse(fs.readFileSync(path.join(__dirname,'themes.json'),'utf8'));
assert.equal(tokens.schema,'smart-pro-system-cards-theme-v1');
const start=source.indexOf('  class SmartProCoverCard extends HTMLElement {');
const end=source.indexOf('  class SmartProThermostatCard extends HTMLElement {');
assert(start>=0&&end>start,'Missing historical Cover class boundaries');
let cover=source.slice(start,end);
function replaceOnce(needle,replacement){
  assert.equal(cover.split(needle).length,2,'Missing/duplicate cover source anchor: '+needle.slice(0,56));
  cover=cover.replace(needle,replacement);
}
replaceOnce('      this.shadowRoot.innerHTML = `\n        <style>',
  [
    '      // The new theme is opt-in: no theme keeps the historical Cover appearance.',
    '      const theme = ["night", "graphite", "light"].includes(this._config.theme)',
    '        ? this._config.theme : "legacy";',
    '      const surface = ["solid", "soft-glass", "glass"].includes(this._config.surface)',
    '        ? this._config.surface : "solid";',
    '',
    '      this.shadowRoot.innerHTML = `',
    '        <style>'
  ].join('\n'));
replaceOnce('          data-density="${density}"',
  '          data-density="${density}"\n          data-sp-theme="${theme}"\n          data-sp-surface="${surface}"');
const css=[];
css.push('          /* Shared Smart Pro System themes. Isolated from the legacy Cover Card. */');
for(const [theme,t] of Object.entries(tokens.themes)){
  assert(['night','graphite','light'].includes(theme),'Unexpected canonical theme');
  css.push('          .card[data-sp-theme="'+theme+'"] {');
  css.push('            --sp-cover-bg: rgb('+t.surfaceRGB+' / var(--sp-cover-alpha, 1));');
  css.push('            --sp-cover-border: '+t.border+';');
  css.push('            --sp-cover-text: '+t.text+';');
  css.push('            --sp-cover-muted: '+t.muted+';');
  css.push('            --sp-cover-accent: '+t.accent+';');
  css.push('            --sp-cover-accent-soft: color-mix(in srgb, var(--sp-cover-accent) 16%, transparent);');
  css.push('            backdrop-filter: blur(var(--sp-cover-blur,0px));');
  css.push('            -webkit-backdrop-filter: blur(var(--sp-cover-blur,0px));');
  css.push('          }');
}
const active='.card:is([data-sp-theme="night"],[data-sp-theme="graphite"],[data-sp-theme="light"])';
css.push('          '+active+'.is-active { border-color: color-mix(in srgb,var(--sp-cover-accent) 42%,var(--sp-cover-border)); }');
css.push('          '+active+'.is-active .state { color: var(--sp-cover-accent); }');
css.push('          '+active+'.is-active .icon-tile { border-color: var(--sp-cover-border); box-shadow: none; }');
css.push('          '+active+' .quick-action, '+active+' .control { border-color: var(--sp-cover-border); color: var(--sp-cover-text); }');
css.push('          '+active+' .control.stop { color: var(--sp-cover-text); }');
css.push('          '+active+' .quick-action.quick-stop { border-color: var(--sp-cover-accent); color: var(--sp-cover-accent); }');
css.push('          '+active+' .details { border-top-color: var(--sp-cover-border); }');
css.push('          '+active+' .quick-action:hover:not(:disabled), '+active+' .control:hover:not(:disabled) { border-color: var(--sp-cover-accent); }');
for(const [surface,v] of Object.entries(tokens.surfaces)){
  assert(['solid','soft-glass','glass'].includes(surface),'Unexpected canonical surface');
  css.push('          '+active+'[data-sp-surface="'+surface+'"] {');
  css.push('            --sp-cover-alpha: '+v.alpha+';');
  css.push('            --sp-cover-blur: '+v.blur+';');
  css.push('          }');
}
css.push('          :host { container-type: inline-size; min-width:0; width:100%; }');
css.push('          .card { min-width:0; width:100%; box-sizing:border-box; }');
css.push('          .summary,.details,.controls,.position-row,.position-slider { min-width:0; }');
css.push('          @container (max-width:360px) {');
css.push('            .summary { gap:9px; padding:12px 11px; }');
css.push('            .card[data-density="comfortable"] .summary { gap:11px; padding:14px; }');
css.push('            .quick-action { width:31px; height:31px; }');
css.push('            .quick-action.quick-stop { width:61px; }');
css.push('            .details { padding-left:11px; padding-right:11px; }');
css.push('          }');
css.push('          @container (max-width:260px) {');
css.push('            .summary { gap:6px; padding:8px; }');
css.push('            .card[data-density="comfortable"] .summary { gap:8px; padding:10px; }');
css.push('            .icon-tile { width:37px; height:37px; border-radius:11px; }');
css.push('            .name { font-size:12px; }');
css.push('            .quick-actions { gap:3px; }');
css.push('            .quick-action { width:28px; height:30px; }');
css.push('            .quick-action.quick-stop { width:49px; }');
css.push('            .details { padding:0 8px 9px; }');
css.push('            .position-row { grid-template-columns:minmax(0,1fr) 32px; gap:5px; }');
css.push('            .version { display:none; }');
css.push('          }');
css.push('          @container (min-width:560px) {');
css.push('            .card[data-density="comfortable"] .summary { padding:20px; gap:16px; }');
css.push('            .card[data-density="comfortable"] .name { font-size:17px; }');
css.push('          }');
css.push('          @media (prefers-reduced-transparency:reduce), (prefers-contrast:more), (forced-colors:active) {');
css.push('            '+active+' { --sp-cover-alpha:1; --sp-cover-blur:0px; }');
css.push('          }');
replaceOnce('          @media (prefers-reduced-motion: reduce) {',
  css.join('\n')+'\n\n          @media (prefers-reduced-motion: reduce) {');
const output=[
  '/* Smart Pro System Cover QA — experimental isolated custom element.',
  ' * Does not replace the existing alpha.10 or any Light QA component.',
  ' * Themed preview; no HACS release. */',
  '(() => {',
  '  "use strict";',
  '  const VERSION = "0.1.0-alpha.10-cover-qa1";',
  '  const COVER_QA_TAG = "smart-pro-cover-qa-card";',
  cover,
  '  if (!customElements.get(COVER_QA_TAG)) {',
  '    customElements.define(COVER_QA_TAG, SmartProCoverCard);',
  '  }',
  '  window.customCards = window.customCards || [];',
  '  if (!window.customCards.some(c => c.type === COVER_QA_TAG)) {',
  '    window.customCards.push({',
  '      type: COVER_QA_TAG,',
  '      name: "Smart Pro Cover QA — Experimental",',
  '      description: "Isolated themed Cover Card preview. Does not replace existing covers.",',
  '      preview: true',
  '    });',
  '  }',
  '  console.info("Smart Pro System Cover QA " + VERSION + " loaded");',
  '})();',
  ''
].join('\n');
assert(!output.includes('class SmartProThermostatCard'),'Thermostat class must not be bundled');
assert(!output.includes('class SmartProLightCard'),'Light class must not be bundled');
assert(!output.includes('const COVER_TAG_NAME'),'Original Cover tag must not be registered');
const target=path.join(root,'dist/smart-pro-cover-qa.js');
if(process.argv.includes('--check')){
  assert(fs.existsSync(target),'Generate Cover QA candidate before checking');
  assert.equal(fs.readFileSync(target,'utf8'),output,'Generated Cover QA candidate is stale');
  console.log('PASS: isolated themed Cover QA generated deterministically');
}else{
  fs.mkdirSync(path.dirname(target),{recursive:true});
  fs.writeFileSync(target,output,'utf8');
  console.log('Built isolated Cover QA ('+Buffer.byteLength(output)+' bytes)');
}
