(() => {
  const G=window.CookieGame, $=id=>document.getElementById(id), key='kevins-cookie-shop-v1';
  let state=G.fresh();
  let serving=false, cancelCustomers=()=>{};
  const motion=()=>window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth';
  function showResults(){
    serving=false;
    render();
    $('results').focus({preventScroll:true});
    $('results').scrollIntoView({behavior:motion(),block:'center'});
  }
  try { state=G.restore(JSON.parse(localStorage.getItem(key)))||G.fresh(); } catch {}
  const varietySelect=$('cookie-variety');
  const inputs=[$('quantity'),$('price'),$('advertising')];
  const recipe=()=>G.varieties.find(v=>v.id===varietySelect.value)||G.varieties[0];
  const values=()=>[G.varieties.map(v=>({id:v.id,baked:v.id===recipe().id?Number($('quantity').value):0,price:v.id===recipe().id?Math.round(Number($('price').value)*100):v.price})),Math.round(Number($('advertising').value)*100)];
  function describeVariety(){const v=recipe();$('variety-cost').textContent=`${G.money(v.cost)} each`;$('variety-price').textContent=`Suggested: ${G.money(v.price)}`;$('variety-description').textContent=`${v.description} Bake one variety for the whole day.`;$('variety-icon').textContent=v.icon;}
  function setPlan(plan,ads=0){const line=plan.find(line=>line.baked>0)||plan.find(line=>line.id===recipe().id)||plan[0];varietySelect.value=line.id;$('quantity').value=line.baked;$('price').value=(line.price/100).toFixed(2);$('advertising').value=(ads/100).toFixed(2);describeVariety();}
  function affordablePlan(plan){return plan.map(line=>({...line,baked:Math.min(line.baked,Math.floor(state.cash/G.varieties.find(v=>v.id===line.id).cost))}));}
  const draft=state.draft;
  if(draft&&G.varieties.some(v=>v.id===draft.id))varietySelect.value=draft.id;
  if(state.phase==='planning'&&draft&&G.varieties.some(v=>v.id===draft.id)&&Number.isInteger(draft.baked)&&draft.baked>=0&&draft.baked<=10000&&Number.isInteger(draft.price)&&draft.price>=25&&draft.price<=2000&&Number.isInteger(draft.ads)&&draft.ads>=0&&draft.ads<=1000000){setPlan([{id:draft.id,baked:draft.baked,price:draft.price}],draft.ads);}
  else if(state.history.length){const last=state.history.at(-1);setPlan(state.phase==='results'?last.varieties:affordablePlan(last.varieties),state.phase==='results'?last.ads:0);}
  else {varietySelect.value='classic';describeVariety();}
  function rememberPlan(){if(state.phase!=='planning')return;const [plan,ads]=values(),line=plan.find(line=>line.id===recipe().id);state={...state,draft:{...line,ads}};save();}
  function save(){try{localStorage.setItem(key,JSON.stringify(state));}catch{}}
  function budget(){const [plan,ads]=values(),cost=G.bakingCost(plan)+ads; $('cost').textContent=G.money(cost);$('cash-after').textContent=G.money(state.cash-cost);$('cash-after').classList.toggle('negative',cost>state.cash); const error=inputs.some(i=>i.value==='')?'Fill in the batch, price, and advertising fields.':G.validate(state,plan,ads);$('error').textContent=state.phase==='planning'?error:'';$('bake-button').disabled=!!error||state.phase!=='planning';}
  function render(){
    const done=state.phase==='results', finished=done&&state.day===30;
    $('day-label').textContent=finished?'30 DAYS · A DREAM REALIZED':`DAY ${state.day} OF 30`;
    $('progress').style.width=`${state.history.length/30*100}%`;
    $('cash').textContent=G.money(state.cash);const profit=state.cash-10000;$('total-profit').textContent=G.money(profit);$('total-profit').className=profit<0?'negative':profit>0?'positive':'';
    $('total-sold').textContent=state.history.reduce((s,r)=>s+r.sold,0).toLocaleString();
    const event=G.eventFor(state.day);$('outlook').textContent=event.outlook;$('event-title').textContent=event.title;$('event-description').textContent=event.description;
    $('plan-day').textContent=`DAY ${state.day} · ${serving?'SERVING CUSTOMERS':done?'SHOP CLOSED':'YOUR GAME PLAN'}`;
    inputs.forEach(i=>i.disabled=done);varietySelect.disabled=done;$('bake-button').textContent=serving?'Serving fresh cookies…':done?'Today’s batch is in the books':'Open shop & bake';
    $('results').hidden=!done||serving;
    if(done){const r=state.history.at(-1);$('result-day').textContent=finished?'YOUR 30-DAY STORY':`DAY ${r.day} · THE SHOP IS CLOSED`;
      $('result-title').textContent=finished?(profit>0?'Look how far you’ve risen.':'Every baker starts somewhere.'):(r.profit>0?'Now that’s a sweet day.':r.profit===0?'A perfectly balanced batch.':'A little lesson in dough.');
      $('result-pill').textContent=finished?'Month complete':`${r.sold} of ${r.baked} sold`;
      const metrics=[['Cookies sold',String(r.sold)],['Revenue',G.money(r.revenue)],['Expenses',G.money(r.expense)],['Profit',G.money(r.profit)],['Remaining cash',G.money(r.cash)]];
      $('result-grid').replaceChildren(...metrics.map(([label,value])=>{const d=document.createElement('div'),s=document.createElement('span'),b=document.createElement('strong');s.textContent=label;b.textContent=value;if(label==='Profit')b.className=r.profit<0?'negative':'positive';d.append(s,b);return d;}));
      $('result-note').textContent=finished?`You sold ${state.history.reduce((s,r)=>s+r.sold,0)} cookies and ended with ${G.money(state.cash)} — a ${G.money(Math.abs(profit))} ${profit>=0?'gain':'loss'} on your starting cash. Ready for another month?`:`Baking: ${G.money(r.baking)} · Advertising: ${G.money(r.ads)}. ${r.baked-r.sold} unsold cookies were donated at closing. ${r.sold===r.baked&&r.baked>0?'Sold out! You might have room for a bigger batch tomorrow.':r.baked===0?'A day off from baking. Tomorrow is a fresh opportunity.':'Try adjusting your batch size, price, or advertising tomorrow.'}`;
      $('variety-results').replaceChildren(...r.varieties.map(line=>{const tr=document.createElement('tr');const v=G.varieties.find(v=>v.id===line.id);[v.name,line.baked,line.sold,G.money(line.price),G.money(line.expense),G.money(line.revenue),G.money(line.profit)].forEach((value,index)=>{const td=document.createElement('td');td.textContent=value;if(index===6)td.className=line.profit<0?'negative':'positive';tr.append(td);});return tr;}));
      $('next-day').textContent=finished?'Play another month':'Plan the next day';
    }
    $('empty-history').hidden=!!state.history.length;$('history-wrap').hidden=!state.history.length;
    $('history').replaceChildren(...[...state.history].reverse().map(r=>{const tr=document.createElement('tr');[r.day,r.baked,r.sold,G.money(r.price),G.money(r.revenue),G.money(r.expense),G.money(r.profit),G.money(r.cash)].forEach((v,i)=>{const td=document.createElement('td');td.textContent=v;if(i===6)td.className=r.profit<0?'negative':'positive';tr.append(td);});const menu=document.createElement('td'),details=document.createElement('details'),summary=document.createElement('summary');summary.textContent='Recipe details';details.append(summary);r.varieties.forEach(line=>{const p=document.createElement('p');p.textContent=`${G.varieties.find(v=>v.id===line.id).name}: ${line.sold}/${line.baked} sold at ${G.money(line.price)} · baking ${G.money(line.expense)} · revenue ${G.money(line.revenue)}`;details.append(p);});menu.append(details);tr.append(menu);return tr;}));budget();
  }
  inputs.forEach(i=>i.addEventListener('input',()=>{budget();rememberPlan();}));
  varietySelect.addEventListener('change',()=>{if(state.phase!=='planning')return;$('price').value=(recipe().price/100).toFixed(2);describeVariety();budget();rememberPlan();});
  $('plan-form').addEventListener('submit',e=>{e.preventDefault();if(serving||state.phase!=='planning'||inputs.some(i=>i.value===''))return;try{state=G.play(state,...values());save();serving=true;render();cancelCustomers=window.CookieCustomers.start(state.history.at(-1).sold,showResults);$('skip-customers').focus({preventScroll:true});$('customers').closest('svg').scrollIntoView({behavior:motion(),block:'center'});}catch(e){serving=false;render();$('error').textContent=e.message;}});
  $('next-day').addEventListener('click',()=>{if(serving)return;if(state.day===30){$('restart-dialog').showModal();return;}cancelCustomers();state=G.next(state);const last=state.history.at(-1);setPlan(affordablePlan(last.varieties));rememberPlan();save();render();$('plan-form').scrollIntoView({behavior:motion(),block:'center'});inputs[0].focus({preventScroll:true});});
  $('restart').addEventListener('click',()=>$('restart-dialog').showModal());$('cancel-restart').addEventListener('click',()=>$('restart-dialog').close());$('confirm-restart').addEventListener('click',()=>{cancelCustomers();serving=false;state=G.fresh();setPlan(G.varieties.map(v=>({id:v.id,baked:v.id==='classic'?60:0,price:v.price})),500);save();$('restart-dialog').close();render();window.scrollTo({top:0,behavior:motion()});});
  render();
})();
