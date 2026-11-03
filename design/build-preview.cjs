'use strict';
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.join(__dirname, '..');
const input = fs.readFileSync(path.join(root, 'design/preview.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'design/themes.css'), 'utf8');
const stylesheet = '<link rel="stylesheet" href="./themes.css">';
assert.equal(input.split(stylesheet).length, 2, 'Expected one local theme stylesheet link');
assert(!/<\/style/i.test(css), 'Unexpected closing style tag inside theme tokens');
const output = input.replace(stylesheet, '<style data-sp-inline-theme-tokens>\n' + css + '\n</style>');
assert(output.includes('data-sp-inline-theme-tokens'));
assert(!output.includes(stylesheet));
assert(!/https?:\/\/|<script[^>]+src=/i.test(output), 'Standalone preview must not require external assets');
const destination = path.join(root, 'dist/smart-pro-light-visual-lab.html');
if (process.argv.includes('--check')) {
  assert(fs.existsSync(destination), 'Standalone preview has not been generated');
  assert.equal(fs.readFileSync(destination, 'utf8'), output, 'Standalone preview is out of date');
  console.log('PASS: self-contained preview matches source and tokens');
} else {
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.writeFileSync(destination, output);
  console.log('Built ' + path.relative(root, destination) + ' (' + Buffer.byteLength(output) + ' bytes)');
}
