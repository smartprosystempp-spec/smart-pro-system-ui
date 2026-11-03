'use strict';
// Pure Node smoke test of opt-in Home Assistant Light runtime. No browser or HA instance needed.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.join(__dirname,'..');
const source = fs.readFileSync(path.join(root,'dist/smart-pro-cards-themed.js'),'utf8');
const original = fs.readFileSync(path.join(root,'smart-pro-cards.js'),'utf8');
assert.notEqual(source,original);
const boundary = '  class SmartProCoverCard extends HTMLElement {';
assert.equal(source.slice(source.indexOf(boundary)),original.slice(original.indexOf(boundary)),
  'Cover and Thermostat families must remain byte-identical');
const registry = new Map();
class FakeNode {
  constructor(){this.listeners = {};this.textContent='';}
  addEventListener(type,cb){this.listeners[type]=cb;}
  fire(type,extra={}) {
    assert(this.listeners[type], 'No listener: ' + type);
    const event={preventDefault(){},stopPropagation(){},target:this,...extra};
    this.listeners[type](event);
  }
}
class FakeElement {
  attachShadow(){
    const nodes = new Map();
    const shadow = {
      _html:'',
      set innerHTML(value){this._html=value;nodes.clear();},
      get innerHTML(){return this._html;},
      querySelector(selector){
        if(selector==='.slider'&&!this._html.includes('class="slider"'))return null;
        if(selector==='.percent'&&!this._html.includes('class="percent"'))return null;
        if(!nodes.has(selector))nodes.set(selector,new FakeNode());
        return nodes.get(selector);
      }
    };
    this.shadowRoot=shadow;
    return shadow;
  }
}
const context = {
  HTMLElement:FakeElement,
  customElements:{get:n=>registry.get(n),define:(n,c)=>registry.set(n,c)},
  window:{},console:{info(){}}
};
vm.createContext(context);
vm.runInContext(source,context,{timeout:3000,filename:'smart-pro-cards-themed.js'});
for(const tag of ['smart-pro-light-card','smart-pro-cover-card','smart-pro-thermostat-card'])assert(registry.has(tag));
const Light=registry.get('smart-pro-light-card');
function newCard(options={},entityState='on',brightness=170){
  const calls=[];
  const card=new Light();
  card.setConfig({entity:'light.demo',...options});
  card.hass={states:{'light.demo':{state:entityState,attributes:{friendly_name:'Test',brightness,supported_color_modes:['brightness']}}},
    callService:(...args)=>calls.push(args)};
  return {card,calls};
}
const themes=['night','graphite','light'];
const surfaces=['solid','soft-glass','glass'];
for(const theme of themes)for(const surface of surfaces) {
  const {card}=newCard({theme,surface});
  const html=card.shadowRoot.innerHTML;
  assert(html.includes('data-sp-theme="'+theme+'"'),'Wrong theme '+theme);
  assert(html.includes('data-sp-surface="'+surface+'"'),'Wrong surface '+surface);
  assert(html.includes('.card[data-sp-theme="'+theme+'"]'),'Theme CSS not generated');
  assert(html.includes('class="slider"'),'Existing dimmer slider disappeared');
}
const legacy=newCard();
assert(legacy.card.shadowRoot.innerHTML.includes('data-sp-theme="legacy"'));
assert(legacy.card.shadowRoot.innerHTML.includes('data-sp-surface="solid"'));
assert(newCard({theme:'";color:red',surface:'evil'}).card.shadowRoot.innerHTML.includes('data-sp-theme="legacy"'),
  'Unexpected untrusted theme must not enter HTML/CSS');
const demo=newCard({theme:'night',surface:'glass'});
demo.card.shadowRoot.querySelector('.card').fire('click');
assert.equal(demo.calls.length,1);
assert.equal(demo.calls[0][0],'light');
assert.equal(demo.calls[0][1],'toggle');
assert.equal(demo.calls[0][2].entity_id,'light.demo');
demo.card.shadowRoot.querySelector('.slider').fire('change',{target:{value:'42'}});
assert.equal(demo.calls.length,2);
assert.equal(demo.calls[1][0],'light');
assert.equal(demo.calls[1][1],'turn_on');
assert.equal(demo.calls[1][2].brightness_pct,42);
const unavailable=newCard({theme:'graphite',surface:'soft-glass'},'unavailable');
assert(unavailable.card.shadowRoot.innerHTML.includes('is-unavailable'));
unavailable.card.shadowRoot.querySelector('.card').fire('click');
assert.equal(unavailable.calls.length,0,'Unavailable entity must not send service calls');
const unknown=newCard({theme:'light'},'unknown');
unknown.card.shadowRoot.querySelector('.card').fire('click');
assert.equal(unknown.calls.length,0,'Unknown entity must not send service calls');
console.log('PASS: 3x3 themes/surfaces, legacy default, safe config, real Light controls, unavailable gates, non-Light family preservation');
