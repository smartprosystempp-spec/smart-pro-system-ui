'use strict';
const fs = require('node:fs');
const path = require('node:path');
const root = __dirname;
const config = JSON.parse(fs.readFileSync(path.join(root, 'themes.json'), 'utf8'));
const tokenName = key => key.replace(/[A-Z]/g, c => '-' + c.toLowerCase());
const lines = [
  '/* Generated from design/themes.json. Do not edit manually. */',
  '[data-sp-theme] {',
  ...Object.entries(config.metrics).map(([key, value]) => `  --sp-${tokenName(key)}: ${value};`),
  '}',
];
for (const [theme, values] of Object.entries(config.themes)) {
  lines.push(`[data-sp-theme="${theme}"] {`);
  for (const [key, value] of Object.entries(values)) {
    lines.push(`  --sp-${tokenName(key)}: ${value};`);
  }
  lines.push('}');
}
for (const [surface, values] of Object.entries(config.surfaces)) {
  lines.push(`[data-sp-surface="${surface}"] {`);
  lines.push(`  --sp-surface-alpha: ${values.alpha};`);
  lines.push(`  --sp-backdrop-blur: ${values.blur};`);
  lines.push('}');
}
lines.push(
  '.sp-themed-card-surface {',
  '  color: var(--sp-text);',
  '  background: rgb(var(--sp-surface-r-g-b) / var(--sp-surface-alpha, 1));',
  '  border: 1px solid var(--sp-border);',
  '  border-radius: var(--sp-card-radius);',
  '  backdrop-filter: blur(var(--sp-backdrop-blur, 0px));',
  '  -webkit-backdrop-filter: blur(var(--sp-backdrop-blur, 0px));',
  '}',
  '@media (prefers-contrast: more), (forced-colors: active) {',
  '  [data-sp-surface] { --sp-surface-alpha: 1; --sp-backdrop-blur: 0px; }',
  '}',
  '@media (prefers-reduced-transparency: reduce) {',
  '  [data-sp-surface] { --sp-surface-alpha: 1; --sp-backdrop-blur: 0px; }',
  '}',
  ''
);
const css = lines.join('\n');
const dest = path.join(root, 'themes.css');
if (process.argv.includes('--check')) {
  if (!fs.existsSync(dest) || fs.readFileSync(dest, 'utf8') !== css) {
    console.error('Theme CSS is not synchronized with canonical JSON');
    process.exit(1);
  }
  console.log('PASS: theme CSS generated from canonical tokens');
} else {
  fs.writeFileSync(dest, css);
  console.log('Generated design/themes.css');
}
