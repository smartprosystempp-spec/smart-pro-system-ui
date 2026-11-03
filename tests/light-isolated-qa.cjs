'use strict';
// Validate coexistence in BOTH load orders plus basic Light Card service safety.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.join(__dirname, '..');
const original = fs.readFileSync(path.join(root, 'smart-pro-cards.js'), 'utf8');
const qa = fs.readFileSync(path.join(root, 'dist/smart-pro-light-qa.js'), 'utf8');
const originalTag = 'smart-pro-light-card';
const qaTag = 'smart-pro-light-qa-card';
assert(qa.includes('const TAG_NAME = "' + qaTag + '"'));
assert(!qa.includes('smart-pro-cover-card'), 'QA output must not install Cover');
assert(!qa.includes('smart-pro-thermostat-card'), 'QA output must not install Thermostat');
assert(!qa.includes('const TAG_NAME = "' + originalTag + '"'), 'QA must not use original Light tag');

function environment(){
  const registry=new Map();
  class FakeNode {
    constructor(){this.listeners={};this.textContent='';}
    addEventListener(name,fn){this.listeners[name]=fn;}
    fire(name,other={}){
      assert(this.listeners[name], 'Missing event listener: '+name);
      this.listeners[name]({preventDefault(){},stopPropagation(){},target:this,...other});
    }
  }
  class FakeHTMLElement {
    attachShadow(){
      const nodes=new Map();
      const shadow={
        _html:'',
        get innerHTML(){return this._html;},
        set innerHTML(html){this._html=html;nodes.clear();},
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
  const ctx={
    HTMLElement:FakeHTMLElement,
    customElements:{
      get:name=>registry.get(name),
      define:(name,cls)=>{assert(!registry.has(name),'Unexpected duplicate '+name);registry.set(name,cls);}
    },
    window:{},console:{info(){}}
  };
  vm.createContext(ctx);
  return {registry,ctx};
}
function loadBoth(qaFirst){
  const e=environment();
  const scripts=qaFirst?[qa,original]:[original,qa];
  scripts.forEach((script,i)=>vm.runInContext(script,e.ctx,{timeout:3000,filename:'load-order-'+i+'.js'}));
  assert(e.registry.has(originalTag));
  assert(e.registry.has(qaTag));
  assert(e.registry.has('smart-pro-cover-card'));
  assert(e.registry.has('smart-pro-thermostat-card'));
  assert.notEqual(e.registry.get(originalTag),e.registry.get(qaTag));
  assert.equal(e.ctx.window.customCards.filter(x=>x.type===qaTag).length,1);
  vm.runInContext(qa,e.ctx,{timeout:3000,filename:'duplicate-load.js'});
  assert.equal(e.ctx.window.customCards.filter(x=>x.type===qaTag).length,1);
  return e;
}
const both=loadBoth(false);
loadBoth(true);
function card(options={},state='on',domain='light'){
  const obj=new (both.registry.get(qaTag))();
  obj.setConfig({entity:domain+'.test',...options});
  const calls=[];
  obj.hass={
    states:{[domain+'.test']:{
      state,
      attributes:{friendly_name:'Test',supported_color_modes:['brightness'],brightness:128}
    }},
    callService:(...args)=>calls.push(args)
  };
  return {obj,calls};
}
for(const theme of ['night','graphite','light']) {
  for(const surface of ['solid','soft-glass','glass']) {
    const {obj}=card({theme,surface});
    assert(obj.shadowRoot.innerHTML.includes('data-sp-theme="'+theme+'"'));
    assert(obj.shadowRoot.innerHTML.includes('data-sp-surface="'+surface+'"'));
    assert(obj.shadowRoot.innerHTML.includes('class="slider"'));
  }
}
assert(card().obj.shadowRoot.innerHTML.includes('data-sp-theme="legacy"'));
assert(card({theme:'";background:red',surface:'evil'}).obj.shadowRoot.innerHTML.includes('data-sp-theme="legacy"'));
const sample=card({theme:'night',surface:'soft-glass'});
sample.obj.shadowRoot.querySelector('.card').fire('click');
assert.equal(sample.calls.length,1);
assert.equal(sample.calls[0][0],'light');
assert.equal(sample.calls[0][1],'toggle');
sample.obj.shadowRoot.querySelector('.slider').fire('change',{target:{value:'41'}});
assert.equal(sample.calls.length,2);
assert.equal(sample.calls[1][0],'light');
assert.equal(sample.calls[1][1],'turn_on');
assert.equal(sample.calls[1][2].brightness_pct,41);
for(const state of ['unknown','unavailable']){
  const unavailable=card({theme:'light'},state);
  unavailable.obj.shadowRoot.querySelector('.card').fire('click');
  assert.equal(unavailable.calls.length,0,'No service call while '+state);
}
const sw=card({theme:'graphite'},'on','switch');
assert(!sw.obj.shadowRoot.innerHTML.includes('class="slider"'),'Switch must not show dimmer');
sw.obj.shadowRoot.querySelector('.card').fire('click');
assert.equal(sw.calls[0][0],'switch');
assert.equal(sw.calls[0][1],'toggle');
console.log('PASS: QA and existing cards coexist in either load order, controls and safety preserved');
