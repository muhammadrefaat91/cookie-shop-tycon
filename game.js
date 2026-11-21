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
  const varieties = [
    {id:'classic', name:'Chocolate chip', cost:50, price:200, share:.5, icon:'🍪', description:'The neighborhood classic.'},
    {id:'oatmeal', name:'Oatmeal raisin', cost:70, price:250, share:.28, icon:'🌾', description:'A hearty, chewy favorite.'},
    {id:'double', name:'Double chocolate', cost:90, price:300, share:.22, icon:'🍫', description:'Rich cookies for chocolate lovers.'}
  ];
  const fresh = () => ({version:2,cash:10000,day:1,phase:'planning',history:[]});
  const eventFor = day => events[(day-1)%events.length];
  const defaultPlan = () => varieties.map(v=>({id:v.id,baked:v.id==='classic'?30:15,price:v.price}));
  // Numeric arguments remain supported for classic-cookie saves and existing clients.
  function args(q,price,ads,random) {
    return Array.isArray(q) ? {plan:q,ads:price,random:typeof ads==='function'?ads:Math.random} :
      {plan:varieties.map(v=>({id:v.id,baked:v.id==='classic'?q:0,price:v.id==='classic'?price:v.price})),ads,random:random||Math.random};
  }
  const bakingCost = plan => plan.reduce((sum,line)=>sum+line.baked*(varieties.find(v=>v.id===line.id)?.cost||0),0);
  function validatePlan(state, plan, ads) {
    if(state.phase!=='planning' || state.day>30) return 'This day has already finished.';
    if(!Array.isArray(plan)||plan.length!==varieties.length||varieties.some(v=>plan.filter(line=>line.id===v.id).length!==1)) return 'Choose a batch and price for each cookie variety.';
    for(const line of plan) {
      const name=varieties.find(v=>v.id===line.id).name;
      if(!Number.isInteger(line.baked)||line.baked<0||line.baked>10000) return `${name}: choose a whole batch from 0 to 10,000 cookies.`;
      if(!Number.isInteger(line.price)||line.price<25||line.price>2000) return `${name}: set a price between $0.25 and $20.00.`;
    }
    if(!Number.isInteger(ads)||ads<0||ads>1000000) return 'Enter an advertising budget of $0 or more.';
    if(bakingCost(plan)+ads>state.cash) return 'This plan costs more cash than you have. Try smaller batches or less advertising.';
    return '';
  }
  function validate(state,q,price,ads) { const a=args(q,price,ads); return validatePlan(state,a.plan,a.ads); }
  function play(state,q,price,ads,random) {
    const a=args(q,price,ads,random), error=validatePlan(state,a.plan,a.ads); if(error) throw new Error(error);
    const base=(54+24*Math.log1p(a.ads/500))*eventFor(state.day).factor*(.88+a.random()*.24);
    const activeShare=varieties.reduce((sum,v)=>sum+(a.plan.find(line=>line.id===v.id).baked>0?v.share:0),0);
    const lines=varieties.map(v=>{
      const line=a.plan.find(line=>line.id===v.id);
      const demand=line.baked===0?0:Math.max(0,Math.round(base*v.share/activeShare*Math.pow(v.price/line.price,1.55)));
      const sold=Math.min(line.baked,demand),revenue=sold*line.price,expense=line.baked*v.cost;
      return {...line,cost:v.cost,demand,sold,revenue,expense,profit:revenue-expense};
    });
    const sum=field=>lines.reduce((total,line)=>total+line[field],0);
    const baked=sum('baked'),sold=sum('sold'),revenue=sum('revenue'),baking=sum('expense'),expense=baking+a.ads,profit=revenue-expense,cash=state.cash+profit;
    const result={day:state.day,baked,price:sold?Math.round(revenue/sold):0,ads:a.ads,sold,revenue,baking,expense,profit,cash,demand:sum('demand'),varieties:lines};
    return {...state,version:2,cash,phase:'results',history:[...state.history,result]};
  }
  function next(state){if(state.phase!=='results'||state.day>=30)return state;return {...state,day:state.day+1,phase:'planning'};}
  function restore(saved) {
    if(!saved||![1,2].includes(saved.version)||!Number.isInteger(saved.cash)||saved.cash<0||!Number.isInteger(saved.day)||saved.day<1||saved.day>30||!['planning','results'].includes(saved.phase)||!Array.isArray(saved.history)||saved.history.length!==saved.day-(saved.phase==='planning'?1:0)) return null;
    if(!saved.history.every((r,i)=>r.day===i+1&&['baked','price','ads','sold','revenue','expense','profit','cash','demand'].every(k=>Number.isInteger(r[k])))) return null;
    const history=saved.history.map(r=>{
      if(saved.version===2) return r;
      const baking=r.baked*50;
      return {...r,baking,varieties:varieties.map(v=>({id:v.id,baked:v.id==='classic'?r.baked:0,price:v.id==='classic'?r.price:v.price,cost:v.cost,sold:v.id==='classic'?r.sold:0,revenue:v.id==='classic'?r.revenue:0,expense:v.id==='classic'?baking:0,profit:v.id==='classic'?r.revenue-baking:0,demand:v.id==='classic'?r.demand:0}))};
    });
    if(history.some(r=>!Array.isArray(r.varieties)||r.varieties.length!==varieties.length||varieties.some(v=>r.varieties.filter(line=>line.id===v.id).length!==1)||!r.varieties.every(line=>['baked','price','cost','sold','revenue','expense','profit','demand'].every(k=>Number.isInteger(line[k]))))) return null;
    return {...saved,version:2,history};
  }
  const api={money,fresh,eventFor,varieties,defaultPlan,bakingCost,validate,play,next,restore};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.CookieGame=api;
})(typeof window==='undefined'?globalThis:window);
