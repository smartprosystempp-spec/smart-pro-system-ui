'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const pathToOutput = path.join(__dirname, '../dist/smart-pro-light-visual-lab.html');
const html = fs.readFileSync(pathToOutput, 'utf8');
assert(html.includes('<style data-sp-inline-theme-tokens>'), 'CSS tokens should be embedded');
assert(!html.includes('<link rel="stylesheet" href="./themes.css">'), 'No external CSS is allowed');
assert(!/<script[^>]+src=|https?:\/\/|fetch\s*\(|XMLHttpRequest|WebSocket/i.test(html), 'Preview must be network-independent');
for(const theme of ['night','graphite','light']) {
  assert(html.includes('[data-sp-theme="'+theme+'"]'), 'Missing CSS for theme '+theme);
}
for(const surface of ['solid','soft-glass','glass']) {
  assert(html.includes('[data-sp-surface="'+surface+'"]'), 'Missing CSS for surface '+surface);
}
const script = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)];
assert.equal(script.length, 1);
new vm.Script(script[0][1], {filename:'standalone-visual-lab-inline.js'});
assert(html.includes('Σχεδιαστικό δείγμα με εικονικά δεδομένα'));
console.log('PASS: portable visual lab built with embedded themes, local-only controls');
