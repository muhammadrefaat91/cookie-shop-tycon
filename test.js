const assert=require('node:assert/strict');
const G=require('./game.js');
let s=G.fresh();assert.equal(s.cash,10000);
assert.ok(G.validate(s,201,200,0));assert.ok(G.validate(s,1.5,200,0));
assert.ok(G.validate(s,1,24,0));assert.ok(G.validate(s,1,200,-1));
s=G.play(s,60,200,500,()=>.5);
assert.equal(s.history[0].expense,3500);assert.equal(s.cash,10000+s.history[0].profit);
assert.equal(s.history[0].revenue,s.history[0].sold*200);
assert.throws(()=>G.play(s,1,200,0));
while(s.day<30){s=G.next(s);s=G.play(s,Math.min(70,Math.floor(s.cash/50)),200,0,()=>.5);}
assert.equal(s.history.length,30);assert.equal(G.next(s),s);
assert.equal(s.cash,10000+s.history.reduce((a,r)=>a+r.profit,0));
let zero={...G.fresh(),cash:0};zero=G.play(zero,0,200,0,()=>0);assert.equal(zero.cash,0);assert.equal(zero.history[0].sold,0);
const low=G.play(G.fresh(),100,100,0,()=>.5).history[0].demand;
const high=G.play(G.fresh(),100,400,0,()=>.5).history[0].demand;assert.ok(low>high);
const ad=G.play(G.fresh(),100,200,1000,()=>.5).history[0].demand;
const noAd=G.play(G.fresh(),100,200,0,()=>.5).history[0].demand;assert.ok(ad>noAd);
console.log('Passed: 30-day game, finances, validation, demand, zero cash, and duplicate-day protection.');

// Every recipe has its own ingredient cost, price, demand, and row in the ledger.
const plan=G.defaultPlan();
let mixed=G.play(G.fresh(),plan,500,()=>.5), result=mixed.history[0];
assert.equal(result.baking,3900);assert.equal(result.expense,4400);
for(const key of ['baked','sold','revenue','demand'])assert.equal(result[key],result.varieties.reduce((sum,line)=>sum+line[key],0));
assert.equal(result.profit,result.varieties.reduce((sum,line)=>sum+line.profit,0)-result.ads);
assert.ok(result.varieties.every(line=>line.sold<=line.baked&&line.revenue===line.sold*line.price&&line.expense===line.baked*line.cost));
const invalid=G.defaultPlan();invalid[1].baked=10000;assert.ok(G.validate(G.fresh(),invalid,0));
assert.ok(G.validate(G.fresh(),[plan[0],plan[0],plan[2]],0));
assert.ok(G.validate(G.fresh(),plan.map(line=>({...line,price:NaN})),0));
const one=plan.map(line=>({...line,baked:line.id==='double'?50:0}));
const premium=G.play(G.fresh(),one,0,()=>.5).history[0];assert.equal(premium.baking,4500);assert.equal(premium.sold,50);assert.equal(premium.revenue,15000);
const old={version:1,cash:15000,day:1,phase:'results',history:[{day:1,baked:60,price:200,ads:0,sold:40,revenue:8000,expense:3000,profit:5000,cash:15000,demand:40}]};
const migrated=G.restore(old);assert.equal(migrated.version,2);assert.equal(migrated.history[0].varieties[0].sold,40);assert.equal(migrated.history[0].varieties[1].baked,0);
assert.deepEqual(G.restore(JSON.parse(JSON.stringify(mixed))),mixed);assert.equal(G.restore({...mixed,day:31}),null);
console.log('Passed: mixed-recipe costs, prices, demand, reporting, validation, and save migration.');

let month=G.fresh();
for(let day=1;day<=30;day++){
  const recipePlan=G.defaultPlan(),cost=G.bakingCost(recipePlan),ratio=Math.min(1,month.cash/cost);
  month=G.play(month,recipePlan.map(line=>({...line,baked:Math.floor(line.baked*ratio)})),0,()=>.5);
  assert.equal(month.cash,10000+month.history.reduce((sum,r)=>sum+r.profit,0));
  if(day<30)month=G.next(month);
}
assert.equal(month.history.length,30);assert.equal(G.next(month),month);
assert.deepEqual(G.restore(JSON.parse(JSON.stringify(month))),month);
console.log('Passed: 30 mixed-menu days and complete save/reload accounting.');
