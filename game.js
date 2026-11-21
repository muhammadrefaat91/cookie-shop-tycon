/* Pure game rules, shared by the browser and the local checks. All money is cents. */
(function (root) {
  const events = [
    {title:'A fresh start', description:'The neighborhood is curious. A $2 cookie and a modest ad budget make a good first batch.', factor:1, outlook:'A lovely day'},
    {title:'A little sidewalk sunshine', description:'More people are out for a stroll. Expect a few extra sweet-toothed visitors.', factor:1.18, outlook:'Sunny sidewalks'},
    {title:'Rain on the window', description:'The streets are quieter today. A smaller batch could save some dough.', factor:.75, outlook:'A rainy day'},
    {title:'The office snack run', description:'Local offices are looking for an afternoon treat. There’s more appetite than usual.', factor:1.3, outlook:'Snack-time rush'},
    {title:'Business as usual', description:'A steady neighborhood day. Find the balance between your batch size and your price.', factor:1, outlook:'Steady traffic'},
    {title:'The weekend wanderers', description:'The neighborhood market is bringing people past your window. Make it smell delicious.', factor:1.4, outlook:'Market day'},
    {title:'A slow morning', description:'Not many people are passing by. Advertising can help, but keep an eye on your costs.', factor:.85, outlook:'Quiet streets'}
  ];
  const money = cents => new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(cents/100);
  const fresh = () => ({version:1,cash:10000,day:1,phase:'planning',history:[]});
  const eventFor = day => events[(day-1)%events.length];
  function validate(state, q, price, ads) {
    if(state.phase!=='planning' || state.day>30) return 'This day has already finished.';
    if(!Number.isInteger(q)||q<0||q>10000) return 'Choose a whole number of cookies from 0 to 10,000.';
    if(!Number.isInteger(price)||price<25||price>2000) return 'Set a price between $0.25 and $20.00.';
    if(!Number.isInteger(ads)||ads<0||ads>1000000) return 'Enter an advertising budget of $0 or more.';
    if(q*50+ads>state.cash) return 'This plan costs more cash than you have. Try a smaller batch or ad budget.';
    return '';
  }
  function play(state,q,price,ads,random=Math.random) {
    const error=validate(state,q,price,ads); if(error) throw new Error(error);
    const expense=q*50+ads;
    const demand=Math.max(0,Math.round((54+24*Math.log1p(ads/500))*eventFor(state.day).factor*Math.pow(200/price,1.55)*(.88+random()*.24)));
    const sold=Math.min(q,demand),revenue=sold*price,profit=revenue-expense,cash=state.cash+profit;
    const result={day:state.day,baked:q,price,ads,sold,revenue,expense,profit,cash,demand};
    return {...state,cash,phase:'results',history:[...state.history,result]};
  }
  function next(state){if(state.phase!=='results'||state.day>=30)return state;return {...state,day:state.day+1,phase:'planning'};}
  const api={money,fresh,eventFor,validate,play,next};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.CookieGame=api;
})(typeof window==='undefined'?globalThis:window);
