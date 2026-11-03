'use strict';
const fs = require('node:fs');
const vm = require('node:vm');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const path = require('node:path');
const root = path.join(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'smart-pro-cards.js'));
assert.equal(source.length, 85397, 'Original source byte count changed');
assert.equal(crypto.createHash('sha256').update(source).digest('hex'),
  'db611964bab281eb0d7e67e5f137189b6dee87a5c0bd5931daaadc9f128177a8',
  'Original alpha.10 source changed');
const registry = new Map();
const window = {};
const context = {
  HTMLElement: class {},
  customElements: {
    get: (key) => registry.get(key),
    define: (key, cls) => { assert(!registry.has(key)); registry.set(key, cls); },
  },
  window,
  console: { info: () => {} },
};
vm.createContext(context);
vm.runInContext(source.toString('utf8'), context, { filename: 'smart-pro-cards.js', timeout: 2500 });
for (const tag of ['smart-pro-light-card', 'smart-pro-cover-card', 'smart-pro-thermostat-card']) {
  assert(registry.has(tag), `Missing custom element: ${tag}`);
  assert(window.customCards.some(c => c.type === tag), `Missing dashboard card registration: ${tag}`);
}
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'hacs.json'), 'utf8'));
assert.equal(manifest.filename, 'smart-pro-cards.js', 'HACS filename mismatch');
console.log('PASS: exact alpha.10 source, 3 card registrations, HACS filename');
