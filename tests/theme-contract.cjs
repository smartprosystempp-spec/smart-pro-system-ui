'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const dir = path.join(__dirname, '..');
const themes = JSON.parse(fs.readFileSync(path.join(dir, 'design/themes.json'), 'utf8'));
assert.equal(themes.schema, 'smart-pro-system-cards-theme-v1');
assert.deepEqual(Object.keys(themes.themes), ['night','graphite','light']);
assert.deepEqual(Object.keys(themes.surfaces), ['solid','soft-glass','glass']);
assert(themes.themes[themes.defaultTheme]);
assert(themes.surfaces[themes.defaultSurface]);
const luminance = hex => {
  const channels = [1, 3, 5].map(i => parseInt(hex.slice(i, i+2), 16)/255);
  const linear = channels.map(v => v <= 0.04045 ? v / 12.92 : Math.pow((v+0.055)/1.055, 2.4));
  return 0.2126*linear[0] + 0.7152*linear[1] + 0.0722*linear[2];
};
const contrast = (a,b) => {
  const [x,y] = [luminance(a),luminance(b)].sort((u,v)=>v-u);
  return (x+0.05)/(y+0.05);
};
for (const [name, t] of Object.entries(themes.themes)) {
  for (const key of ['canvas','surface','text','muted','border','accent','active','success','warning','error','focus']) {
    assert(/^#[0-9A-F]{6}$/i.test(t[key]), `${name}: invalid ${key}`);
  }
  assert.deepEqual(t.surfaceRGB.split(' ').map(Number), [1,3,5].map(i=>parseInt(t.surface.slice(i,i+2),16)), `${name}: RGB mismatch`);
  assert(contrast(t.surface,t.text)>=4.5, `${name}: text contrast below WCAG AA`);
  assert(contrast(t.surface,t.muted)>=4.5, `${name}: muted text contrast below WCAG AA`);
  assert(contrast(t.surface,t.accent)>=4.5, `${name}: accent text contrast below WCAG AA`);
}
for (const [name, surface] of Object.entries(themes.surfaces)) {
  assert(surface.alpha > 0 && surface.alpha <= 1, `${name}: invalid alpha`);
  assert(/^\d+px$/.test(surface.blur), `${name}: invalid blur`);
}
execFileSync(process.execPath, [path.join(dir,'design/generate-css.cjs'),'--check'], {stdio:'inherit'});
console.log('PASS: three themes, three surfaces, accessible solid surface contrast');
