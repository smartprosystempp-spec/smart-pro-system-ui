'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname,'..');
const template = fs.readFileSync(path.join(__dirname,'sizing-review.template.html'),'utf8');
const css = fs.readFileSync(path.join(__dirname,'themes.css'),'utf8');
const runtime = fs.readFileSync(path.join(root,'dist/smart-pro-light-sizing-qa.js'),'utf8');
assert.equal(template.split('<!--QA2_RUNTIME-->').length,2,'Expected one runtime placeholder');
assert.equal(template.split('<link rel="stylesheet" href="./themes.css">').length,2,'Expected one CSS link');
assert(!/<\/script/i.test(runtime),'The QA runtime must not contain a script terminator');
assert(!/<\/style/i.test(css),'Theme CSS must not contain a closing style tag');
const html=template
  .replace('<link rel="stylesheet" href="./themes.css">','<style data-sp-canonical-tokens>\n'+css+'\n</style>')
  .replace('<!--QA2_RUNTIME-->','<script>\n'+runtime+'\n</script>');
assert(!/https?:\/\/|<script[^>]+src=|<link[^>]+href=/i.test(html),'Preview must be fully offline');
const target=path.join(root,'dist/smart-pro-light-sizing-review.html');
if(process.argv.includes('--check')){
  assert(fs.existsSync(target));
  assert.equal(fs.readFileSync(target,'utf8'),html,'Generated review is stale');
  console.log('PASS: standalone sizing preview equals QA2 runtime + canonical tokens');
}else{
  fs.mkdirSync(path.dirname(target),{recursive:true});
  fs.writeFileSync(target,html,'utf8');
  console.log('Built standalone sizing preview ('+Buffer.byteLength(html)+' bytes)');
}
