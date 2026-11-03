'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.join(__dirname,'..');
const alpha=fs.readFileSync(path.join(root,'smart-pro-cards.js'),'utf8');
const qa=fs.readFileSync(path.join(root,'dist/smart-pro-cover-qa.js'),'utf8');
const lightQA=fs.readFileSync(path.join(root,'dist/smart-pro-light-qa.js'),'utf8');
const sizingQA=fs.readFileSync(path.join(root,'dist/smart-pro-light-sizing-qa.js'),'utf8');
assert(qa.includes('const COVER_QA_TAG = "smart-pro-cover-qa-card"'));
assert(!qa.includes('class SmartProLightCard'));
assert(!qa.includes('class SmartProThermostatCard'));
assert(!qa.includes('const COVER_TAG_NAME'));
class FakeNode {
  constructor(){this.listeners={};this.textContent='';}
  addEventListener(type,fn){this.listeners[type]=fn;}
  fire(type,other={}){
    assert(this.listeners[type], 'No '+type+' listener');
    this.listeners[type]({preventDefault(){},stopPropagation(){},target:this,...other});
  }
}
class FakeElement {
  constructor(){this.events=[];}
  attachShadow(){
    const nodes=new Map();
    const shadow={
      _html:'',
      set innerHTML(value){this._html=value;nodes.clear();},
      get innerHTML(){return this._html;},
      querySelector(selector){
        const name=selector.replace(/^\./,'');
        const markup=this._html.split('</style>').slice(1).join('</style>');
        if(!new RegExp('class="[^"]*\\b'+name+'\\b').test(markup))return null;
        if(!nodes.has(selector))nodes.set(selector,new FakeNode());
        return nodes.get(selector);
      }
    };
    this.shadowRoot=shadow;return shadow;
  }
  dispatchEvent(event){this.events.push(event);return true;}
}
function environment(order){
  const registry=new Map(),window={};
  const context={
    HTMLElement:FakeElement,
    customElements:{
      get:name=>registry.get(name),
      define:(name,value)=>{assert(!registry.has(name),'Duplicate tag '+name);registry.set(name,value);}
    },
    window,
    requestAnimationFrame:fn=>fn(),
    CustomEvent:class {constructor(name,opts){this.type=name;this.options=opts;}},
    console:{info(){}}
  };
  vm.createContext(context);
  for(const [filename,js] of order)vm.runInContext(js,context,{filename,timeout:4500});
  for(const tag of ['smart-pro-light-card','smart-pro-cover-card','smart-pro-thermostat-card',
    'smart-pro-light-qa-card','smart-pro-light-sizing-qa-card','smart-pro-cover-qa-card'])
    assert(registry.has(tag), 'Missing expected '+tag);
  assert.notEqual(registry.get('smart-pro-cover-card'),registry.get('smart-pro-cover-qa-card'));
  assert.equal(window.customCards.filter(card=>card.type==='smart-pro-cover-qa-card').length,1);
  vm.runInContext(qa,context,{filename:'cover-qa-second-load.js',timeout:4500});
  assert.equal(window.customCards.filter(card=>card.type==='smart-pro-cover-qa-card').length,1);
  return registry;
}
const scripts=[['alpha.js',alpha],['light-qa.js',lightQA],['light-sizing-qa.js',sizingQA],['cover-qa.js',qa]];
const registry=environment(scripts);
environment([...scripts].reverse());
const Cover=registry.get('smart-pro-cover-qa-card');
function makeCard(options={},state='open',position=40){
  const calls=[],card=new Cover();
  const native=Object.hasOwn(options,'position_entity')?{}:{
    'cover.test':{state,attributes:{current_position:position,friendly_name:'Test cover'}}
  };
  card.setConfig({entity:'cover.test',...options});
  card.hass={states:{
    ...native,
    'input_number.position':{state:String(position),attributes:{friendly_name:'Test helper'}},
    'input_number.target':{state:'0',attributes:{}},
    'input_select.cover_status':{state:'idle',attributes:{}}
  },callService:(...args)=>calls.push(args)};
  return {card,calls};
}
for(const theme of ['night','graphite','light']){
  for(const surface of ['solid','soft-glass','glass']){
    for(const density of ['ultra-compact','compact','comfortable']){
      const {card}=makeCard({theme,surface,density});
      const html=card.shadowRoot.innerHTML;
      assert(html.includes('data-sp-theme="'+theme+'"'));
      assert(html.includes('data-sp-surface="'+surface+'"'));
      assert(html.includes('data-density="'+density+'"'));
      assert(html.includes('@container (max-width:360px)'));
      assert(html.includes('.card[data-sp-theme="'+theme+'"]'));
      assert(html.includes('class="quick-action quick-open"'));
      assert(html.includes('class="quick-action quick-close"'));
      card._expanded=true;card._render();
      const expanded=card.shadowRoot.innerHTML;
      assert(expanded.includes('class="position-slider"'));
      assert(expanded.includes('class="control stop"'));
    }
  }
}
assert(makeCard().card.shadowRoot.innerHTML.includes('data-sp-theme="legacy"'));
assert(makeCard({theme:'evil',surface:'bad'}).card.shadowRoot.innerHTML.includes('data-sp-surface="solid"'));
const native=makeCard({theme:'night',surface:'glass'});
native.card.shadowRoot.querySelector('.quick-open').fire('click');
native.card.shadowRoot.querySelector('.quick-close').fire('click');
assert.deepEqual(native.calls.map(x=>x[1]),['open_cover','close_cover']);
native.card.shadowRoot.querySelector('.summary').fire('click');
assert(native.card._expanded);
assert(native.card.events.some(x=>x.type==='iron-resize'));
native.card.shadowRoot.querySelector('.open').fire('click');
native.card.shadowRoot.querySelector('.stop').fire('click');
native.card.shadowRoot.querySelector('.close').fire('click');
native.card.shadowRoot.querySelector('.position-slider').fire('change',{target:{value:'73'}});
assert.deepEqual(native.calls.slice(2).map(x=>x[1]),['open_cover','stop_cover','close_cover','set_cover_position']);
assert.equal(native.calls.at(-1)[2].position,73);
assert.equal(native.calls.at(-1)[2].entity_id,'cover.test');
const helper=makeCard({entity:undefined,position_entity:'input_number.position',target_entity:'input_number.target',
  status_entity:'input_select.cover_status',theme:'graphite',surface:'soft-glass'});
helper.card._open();
helper.card._stop();
helper.card._close();
helper.card._setPosition(68);
assert.deepEqual(helper.calls.map(x=>x[0]),['input_number','input_number','input_number','input_number']);
assert.deepEqual(helper.calls.map(x=>x[1]),['set_value','set_value','set_value','set_value']);
assert.deepEqual(helper.calls.map(x=>x[2].value),[100,40,0,68]);
for(const unavailable of ['unknown','unavailable']){
  const fail=makeCard({theme:'light'},unavailable);
  fail.card._open();fail.card._close();fail.card._stop();fail.card._setPosition(45);
  assert.equal(fail.calls.length,0,'Unavailable state must not issue commands');
  assert(fail.card.shadowRoot.innerHTML.includes('is-unavailable'));
}
console.log('PASS: isolated Cover QA coexists in both load orders, 27 appearance/density configurations, native & helper commands, unavailable safety');
