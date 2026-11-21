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
