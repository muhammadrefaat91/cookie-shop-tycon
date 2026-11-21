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
