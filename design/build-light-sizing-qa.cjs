'use strict';
// Development-only sizing experiment. It builds a NEW card tag without replacing
// the existing alpha.10 card or the already-installed Light QA card.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const existingPath = path.join(root, 'dist/smart-pro-light-qa.js');
const original = fs.readFileSync(existingPath, 'utf8');
const oldTag = 'smart-pro-light-qa-card';
const newTag = 'smart-pro-light-sizing-qa-card';
assert(original.includes('const TAG_NAME = "' + oldTag + '"'), 'Expected isolated QA source');
assert(original.includes('const VERSION = "0.1.0-alpha.10-qa1"'), 'Unexpected base QA version');
assert(!original.includes(newTag), 'Already migrated?');
const anchor = '          @media (prefers-reduced-motion: reduce) {';
assert.equal(original.split(anchor).length, 2, 'Expected exactly one style insertion anchor');
const css = [
  '          /* QA2: sizing follows the actual Home Assistant card container, not the device viewport. */',
  '          :host { container-type: inline-size; min-width: 0; width: 100%; }',
  '          .card { min-width: 0; width: 100%; box-sizing: border-box; }',
  '          .content, .slider-row, .slider { min-width: 0; }',
  '          @container (max-width: 360px) {',
  '            .card { gap: 10px; padding: 12px; }',
  '            .card[data-density="comfortable"] { gap: 12px; padding: 14px; }',
  '            .card:not([data-density="ultra-compact"]) .icon-tile { width: 42px; height: 42px; }',
  '            .card:not([data-density="ultra-compact"]) .name { font-size: 13px; }',
  '            .card .slider-row { grid-template-columns: minmax(0, 1fr) 38px; gap: 8px; }',
  '            .card .percent { font-size: 11px; }',
  '          }',
  '          @container (max-width: 260px) {',
  '            .card { gap: 8px; padding: 9px; }',
  '            .card[data-density="comfortable"] { gap: 9px; padding: 12px; }',
  '            .card .name { font-size: 12px; }',
  '            .card .state { font-size: 10px; }',
  '            .card .icon-tile { width: 36px; height: 36px; border-radius: 11px; }',
  '            .card .slider-row { grid-template-columns: minmax(0, 1fr) 32px; gap: 5px; }',
  '            .card .percent { font-size: 10px; }',
  '            .card .version { display: none; }',
  '          }',
  '          @container (min-width: 560px) {',
  '            .card[data-density="comfortable"] { padding: 20px; gap: 16px; }',
  '            .card[data-density="comfortable"] .name { font-size: 17px; }',
  '          }',
  ''
].join('\n');
const output = original
  .replace('const TAG_NAME = "' + oldTag + '"', 'const TAG_NAME = "' + newTag + '"')
  .replace('const VERSION = "0.1.0-alpha.10-qa1"', 'const VERSION = "0.1.0-alpha.10-qa2"')
  .replace('name: "Smart Pro Light QA — Experimental"', 'name: "Smart Pro Light Sizing QA — Experimental"')
  .replace(anchor, css + anchor);
assert(output.includes('const TAG_NAME = "' + newTag + '"'));
assert(!output.includes('const TAG_NAME = "' + oldTag + '"'));
const dest = path.join(root, 'dist/smart-pro-light-sizing-qa.js');
if (process.argv.includes('--check')) {
  assert(fs.existsSync(dest), 'Build QA2 output first');
  assert.equal(fs.readFileSync(dest, 'utf8'), output, 'Generated sizing QA output is stale');
  console.log('PASS: QA2 sizing experiment generated without touching QA1');
} else {
  fs.mkdirSync(path.dirname(dest), {recursive:true});
  fs.writeFileSync(dest, output, 'utf8');
  console.log('Built isolated sizing QA2 (' + Buffer.byteLength(output) + ' bytes)');
}
