'use strict';
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const root = path.join(__dirname,'..');
const html = fs.readFileSync(path.join(root,'design/preview.html'),'utf8');
assert.match(html,/<html lang="el">/);
assert.match(html,/<link rel="stylesheet" href="\.\/themes\.css">/);
for(const id of ['theme','surface','wallpaper','size','state','viewport','canvas','main-card','status','details','brightness','power']){
  assert.match(html,new RegExp('id="'+id+'"'), 'Missing preview control '+id);
}
for(const theme of ['night','graphite','light'])assert.match(html,new RegExp('value="'+theme+'"'));
for(const surface of ['solid','soft-glass','glass'])assert.match(html,new RegExp('value="'+surface+'"'));
for(const state of ['on','off','unavailable','unknown'])assert.match(html,new RegExp('value="'+state+'"'));
assert.match(html,/data-sp-theme="night"/);
assert.match(html,/data-sp-surface="soft-glass"/);
assert.match(html,/data-size="desktop"/);
assert.match(html,/Σχεδιαστικό δείγμα με εικονικά δεδομένα/);
assert(!/\.callService\s*\(|XMLHttpRequest|WebSocket|fetch\s*\(/.test(html), 'Preview must not issue live HA or network actions');
const inlineScripts = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)];
assert.equal(inlineScripts.length,1,'Expected exactly one local preview controller script');
new vm.Script(inlineScripts[0][1],{filename:'preview-inline.js'});
console.log('PASS: preview controls, 3 themes/surfaces and states, JS syntax, no HA service calls');
