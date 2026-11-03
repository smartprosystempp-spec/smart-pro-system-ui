'use strict';
// Build an isolated QA-only Lovelace card from the opt-in themed Light runtime.
// The original smart-pro-light-card, Cover and Thermostat tags are never registered here.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const themedPath = path.join(root, 'dist/smart-pro-cards-themed.js');
const themed = fs.readFileSync(themedPath, 'utf8');
const lightStart = themed.indexOf('  class SmartProLightCard extends HTMLElement {');
const coverStart = themed.indexOf('  class SmartProCoverCard extends HTMLElement {');
assert(lightStart !== -1 && coverStart > lightStart, 'Themed Light class boundary not found');
const light = themed.slice(lightStart, coverStart);
assert(light.includes('data-sp-theme='), 'Opt-in themed card missing');
assert(!light.includes('customElements.define'), 'Class extraction must not include registrations');
assert(!light.includes('class SmartProCoverCard'), 'Cover must not be imported');
const output = [
  '/* Smart Pro System Light QA — separate, experimental custom element.',
  ' * Purpose: coexist with existing smart-pro-light-card without overwriting it.',
  ' * Do not redistribute as a stable HACS release.',
  ' */',
  '(() => {',
  '  "use strict";',
  '  const VERSION = "0.1.0-alpha.10-qa1";',
  '  const TAG_NAME = "smart-pro-light-qa-card";',
  light,
  '  if (!customElements.get(TAG_NAME)) {',
  '    customElements.define(TAG_NAME, SmartProLightCard);',
  '  }',
  '  window.customCards = window.customCards || [];',
  '  if (!window.customCards.some(card => card.type === TAG_NAME)) {',
  '    window.customCards.push({',
  '      type: TAG_NAME,',
  '      name: "Smart Pro Light QA — Experimental",',
  '      description: "Isolated visual QA card. Does not replace existing Smart Pro Light Card.",',
  '      preview: true,',
  '    });',
  '  }',
  '  console.info("Smart Pro System Light QA " + VERSION + " loaded");',
  '})();',
  ''
].join('\n');
const destination = path.join(root, 'dist/smart-pro-light-qa.js');
if (process.argv.includes('--check')) {
  assert(fs.existsSync(destination), 'Build the QA file before checking it');
  assert.equal(fs.readFileSync(destination, 'utf8'), output, 'Isolated QA output is stale');
  console.log('PASS: isolated Light QA code is deterministically generated from themed runtime');
} else {
  fs.mkdirSync(path.dirname(destination), {recursive: true});
  fs.writeFileSync(destination, output, 'utf8');
  console.log('Built isolated Light QA (' + Buffer.byteLength(output) + ' bytes)');
}
