'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.join(__dirname, '..');
const alpha = fs.readFileSync(path.join(root,'smart-pro-cards.js'),'utf8');
const qa1 = fs.readFileSync(path.join(root,'dist/smart-pro-light-qa.js'),'utf8');
const qa2 = fs.readFileSync(path.join(root,'dist/smart-pro-light-sizing-qa.js'),'utf8');
assert(qa1.includes('const TAG_NAME = "smart-pro-light-qa-card"'));
assert(qa2.includes('const TAG_NAME = "smart-pro-light-sizing-qa-card"'));
for (const fragment of [
  ':host { container-type: inline-size; min-width: 0; width: 100%; }',
  '@container (max-width: 360px)',
  '@container (max-width: 260px)',
  '@container (min-width: 560px)',
  'minmax(0, 1fr)',
  '.card[data-density="comfortable"]',
  '.card .slider-row',
  '.card .version { display: none; }'
]) assert(qa2.includes(fragment), 'Missing sizing contract: '+fragment);
for(const tag of ['smart-pro-cover-card','smart-pro-thermostat-card']) {
  assert(!qa2.includes(tag), 'Isolated QA2 must not register '+tag);
}
class FakeNode {
  constructor(){this.listeners={};this.textContent='';}
  addEventListener(type,cb){this.listeners[type]=cb;}
  fire(type,extra={}) {
    assert(this.listeners[type], 'Missing event '+type);
    this.listeners[type]({preventDefault(){},stopPropagation(){},target:this,...extra});
  }
}
class FakeElement {
  attachShadow(){
    const nodes=new Map();
    const shadow={
      _html:'',
      set innerHTML(html){this._html=html;nodes.clear();},
      get innerHTML(){return this._html;},
      querySelector(sel){
        if(sel==='.slider'&&!this._html.includes('class="slider"'))return null;
        if(sel==='.percent'&&!this._html.includes('class="percent"'))return null;
        if(!nodes.has(sel))nodes.set(sel,new FakeNode());
        return nodes.get(sel);
      }
    };
    this.shadowRoot=shadow;
    return shadow;
  }
}
function createEnvironment(order) {
  const registry=new Map();
  const context={
    HTMLElement:FakeElement,
    customElements:{get:n=>registry.get(n),define:(n,cls)=>{assert(!registry.has(n),'Duplicate custom element '+n);registry.set(n,cls);}},
    window:{},console:{info(){}}
  };
  vm.createContext(context);
  for(const [name,source] of order)vm.runInContext(source,context,{filename:name,timeout:3000});
  for(const tag of ['smart-pro-light-card','smart-pro-cover-card','smart-pro-thermostat-card','smart-pro-light-qa-card','smart-pro-light-sizing-qa-card'])assert(registry.has(tag),'Missing '+tag);
  assert.notEqual(registry.get('smart-pro-light-qa-card'),registry.get('smart-pro-light-sizing-qa-card'));
  return registry;
}
const reg=createEnvironment([['alpha.js',alpha],['qa1.js',qa1],['qa2.js',qa2]]);
createEnvironment([['qa2.js',qa2],['qa1.js',qa1],['alpha.js',alpha]]);
const Light=reg.get('smart-pro-light-sizing-qa-card');
function createCard({density='compact',theme='night',surface='solid',state='on',domain='light'}={}){
  const calls=[];
  const card=new Light();
  card.setConfig({entity:domain+'.test',density,theme,surface,name:'Test'});
  card.hass={states:{[domain+'.test']:{state,attributes:{friendly_name:'Test',supported_color_modes:['brightness'],brightness:170}}},callService:(...args)=>calls.push(args)};
  return {card,calls};
}
for(const density of ['ultra-compact','compact','comfortable']){
  for(const theme of ['night','graphite','light']){
    const {card}=createCard({density,theme,surface:'soft-glass'});
    const html=card.shadowRoot.innerHTML;
    assert(html.includes('data-density="'+density+'"'));
    assert(html.includes('data-sp-theme="'+theme+'"'));
    assert(html.includes('data-sp-surface="soft-glass"'));
    assert(html.includes('class="slider"'));
    assert(html.includes('@container (max-width: 260px)'));
  }
}
const {card,calls}=createCard({density:'comfortable',surface:'glass'});
card.shadowRoot.querySelector('.card').fire('click');
assert.equal(calls.length,1);
assert.equal(calls[0][0],'light');
assert.equal(calls[0][1],'toggle');
card.shadowRoot.querySelector('.slider').fire('change',{target:{value:'53'}});
assert.equal(calls.length,2);
assert.equal(calls[1][0],'light');
assert.equal(calls[1][1],'turn_on');
assert.equal(calls[1][2].brightness_pct,53);
for(const state of ['unavailable','unknown']) {
  const item=createCard({state});
  item.card.shadowRoot.querySelector('.card').fire('click');
  assert.equal(item.calls.length,0);
}
const sw=createCard({domain:'switch'});
assert(!sw.card.shadowRoot.innerHTML.includes('class="slider"'));
sw.card.shadowRoot.querySelector('.card').fire('click');
assert.equal(sw.calls[0][0],'switch');
assert.equal(sw.calls[0][1],'toggle');
console.log('PASS: original, QA1 and QA2 coexist; three densities, responsive CSS and simulated Light controls are preserved');
