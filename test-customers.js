// Dependency-free interaction checks; a small DOM stand-in tests lifecycle, not rendering.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const G = require('./game.js');
function setup({reduced = false, saved = null} = {}) {
  class Element {
    constructor() { this.children = []; this.listeners = {}; this.style = {}; this.hidden = false; this.value = ''; this.classList = {toggle(){}}; }
    setAttribute(key, value) { this[key] = value; }
    append(...nodes) { this.children.push(...nodes); }
    replaceChildren(...nodes) { this.children = nodes; }
    addEventListener(type, fn) { (this.listeners[type] ||= new Set()).add(fn); }
    removeEventListener(type, fn) { this.listeners[type]?.delete(fn); }
    fire(type) { [...(this.listeners[type] || [])].forEach(fn => fn({preventDefault(){}})); }
    focus() {} scrollIntoView() {} closest() { return this; }
    showModal() { this.open = true; } close() { this.open = false; }
  }
  const elements = Object.fromEntries([...fs.readFileSync('index.html', 'utf8').matchAll(/id="([^"]+)"/g)].map(m => [m[1], new Element()]));
  elements['cookie-variety'].value = 'classic';
  elements.quantity.value = '60'; elements.price.value = '2.00'; elements.advertising.value = '5.00';
  const pending = new Map(); let sequence = 0, time = 0;
  let stored = saved ? JSON.stringify(saved) : null;
  const window = {CookieGame:G, matchMedia:() => ({matches:reduced}), scrollTo(){}};
  const context = vm.createContext({window, document:{getElementById:id => elements[id], createElement:() => new Element(), createElementNS:() => new Element()},
    localStorage:{getItem:() => stored, setItem:(_,value) => { stored = value; }},
    setTimeout:(fn,delay) => { const id = ++sequence; pending.set(id,{fn,at:time+delay}); return id; }, clearTimeout:id => pending.delete(id)});
  for (const file of ['customers.js','app.js']) vm.runInContext(fs.readFileSync(file,'utf8'), context);
  function tick(until = Infinity) {
    while (pending.size) {
      const [id, job] = [...pending].sort((a,b) => a[1].at-b[1].at)[0];
      if (job.at > until) break;
      time = job.at; pending.delete(id); job.fn();
    }
  }
  return {elements,pending,tick,state:() => JSON.parse(stored)};
}
// The dropdown chooses the entire daily batch and updates pricing/costs.
let choice=setup({reduced:true}), menu=choice.elements;
menu['cookie-variety'].value='oatmeal';menu['cookie-variety'].fire('change');
assert.equal(menu.price.value,'2.50');assert.equal(menu['variety-cost'].textContent,'$0.70 each');
assert.equal(menu.cost.textContent,'$47.00');
menu.quantity.value='20';menu.quantity.fire('input');
assert.equal(menu.cost.textContent,'$19.00');
let restored=setup({saved:choice.state()});
assert.equal(restored.elements['cookie-variety'].value,'oatmeal');
assert.equal(restored.elements.quantity.value,20);assert.equal(restored.elements.price.value,'2.50');
menu['plan-form'].fire('submit');choice.tick();
let result=choice.state().history[0];
assert.equal(result.expense,1900);assert.equal(result.baked,20);
assert.equal(result.varieties.find(v=>v.id==='oatmeal').baked,20);
assert.ok(result.varieties.filter(v=>v.id!=='oatmeal').every(v=>v.baked===0&&v.sold===0));
assert.equal(menu['cookie-variety'].disabled,true);
menu['next-day'].fire('click');assert.equal(menu['cookie-variety'].disabled,false);
assert.equal(menu['cookie-variety'].value,'oatmeal');
menu['cookie-variety'].value='double';menu['cookie-variety'].fire('change');
assert.equal(menu.price.value,'3.00');assert.equal(menu['variety-cost'].textContent,'$0.90 each');
menu['confirm-restart'].fire('click');assert.equal(menu['cookie-variety'].value,'classic');
assert.equal(menu.quantity.value,60);assert.equal(menu.price.value,'2.00');
console.log('Passed: daily variety dropdown, recipe pricing/costs, exclusive batch, draft reload, next day, and reset.');
let t = setup(), e = t.elements;
e['plan-form'].fire('submit');
assert.equal(t.state().history.length,1); // Settled once, before animation.
assert.equal(e.results.hidden,true);
const sold = t.state().history[0].sold;
assert.equal(e.customers.children.length,Math.min(18,Math.ceil(sold/5)));
e['plan-form'].fire('submit');assert.equal(t.state().history.length,1);
t.tick(1700);assert.match(e['customer-count'].textContent,/cookies sold/);
t.tick();assert.equal(e.results.hidden,false);assert.equal(e.customers.children.length,0);
assert.equal(e['customer-count'].textContent,`${sold} cookies sold today`);
e['next-day'].fire('click');assert.equal(t.state().day,2);assert.equal(e['customer-status'].hidden,true);
e['plan-form'].fire('submit');e['skip-customers'].fire('click');
assert.equal(e.results.hidden,false);assert.equal(t.pending.size,0);
e['next-day'].fire('click');e['plan-form'].fire('submit');e['confirm-restart'].fire('click');
assert.equal(t.state().day,1);assert.equal(t.state().cash,10000);assert.equal(t.pending.size,0);assert.equal(e.customers.children.length,0);assert.equal(e.results.hidden,true);
t = setup();e=t.elements;e.quantity.value='0';e.advertising.value='0';e['plan-form'].fire('submit');
assert.equal(e.customers.children.length,0);t.tick();assert.equal(e.results.hidden,false);assert.equal(t.state().history[0].sold,0);
t = setup({reduced:true});e=t.elements;e['plan-form'].fire('submit');assert.equal(e.customers.children.length,0);t.tick();assert.equal(e.results.hidden,false);
const saved = t.state();t=setup({saved});assert.equal(t.elements.results.hidden,false);assert.equal(t.pending.size,0);
// Large sales create at most 18 visitors and still account for every cookie.
t=setup({saved:{...G.fresh(),cash:1000000}});e=t.elements;e.quantity.value='10000';e.price.value='0.25';e.advertising.value='100';e['plan-form'].fire('submit');
assert.equal(e.customers.children.length,18);t.tick();assert.equal(e['customer-count'].textContent,`${t.state().history[0].sold} cookies sold today`);
console.log('Passed: customer scaling, purchase counter, completion, skip, restart, zero sales, reduced motion, and reload.');

// Play a full month through the UI, rotating the daily recipe and checking cash.
const month = setup({reduced:true}), ui = month.elements;
for(let day=1;day<=30;day++){
  const variety=G.varieties[(day-1)%G.varieties.length];
  ui['cookie-variety'].value=variety.id;ui['cookie-variety'].fire('change');
  ui.quantity.value='40';ui.advertising.value='0';ui.quantity.fire('input');
  assert.equal(ui['bake-button'].disabled,false);
  ui['plan-form'].fire('submit');month.tick();
  const state=month.state(),result=state.history.at(-1);
  assert.equal(result.day,day);assert.equal(result.baking,40*variety.cost);
  assert.equal(result.varieties.find(line=>line.id===variety.id).baked,40);
  assert.ok(result.varieties.filter(line=>line.id!==variety.id).every(line=>line.baked===0&&line.sold===0));
  assert.equal(state.cash,10000+state.history.reduce((sum,line)=>sum+line.profit,0));
  assert.equal(ui.results.hidden,false);
  if(day<30)ui['next-day'].fire('click');
}
assert.equal(month.state().history.length,30);
assert.equal(ui['next-day'].textContent,'Play another month');
ui['next-day'].fire('click');assert.equal(ui['restart-dialog'].open,true);
assert.equal(month.state().day,30);
console.log('Passed: full 30-day UI playthrough with daily recipe changes and reconciled finances.');
