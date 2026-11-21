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
  try { const saved=JSON.parse(localStorage.getItem(key)); if(saved?.version===1&&Number.isInteger(saved.cash)&&saved.cash>=0&&saved.day>=1&&saved.day<=30&&['planning','results'].includes(saved.phase)&&Array.isArray(saved.history)&&saved.history.length===saved.day-(saved.phase==='planning'?1:0)&&saved.history.every((r,i)=>r.day===i+1&&['baked','price','ads','sold','revenue','expense','profit','cash','demand'].every(k=>Number.isFinite(r[k])))) state=saved; } catch {}
  const inputs=[$('quantity'),$('price'),$('advertising')];
  const values=()=>[Number(inputs[0].value),Math.round(Number(inputs[1].value)*100),Math.round(Number(inputs[2].value)*100)];
  function save(){try{localStorage.setItem(key,JSON.stringify(state));}catch{}}
  function budget(){const [q,p,a]=values(),cost=q*50+a; $('cost').textContent=G.money(cost);$('cash-after').textContent=G.money(state.cash-cost);$('cash-after').classList.toggle('negative',cost>state.cash); const error=inputs.some(i=>i.value==='')?'Fill in all three fields.':G.validate(state,q,p,a);$('error').textContent=state.phase==='planning'?error:'';$('bake-button').disabled=!!error||state.phase!=='planning';}
  function render(){
    const done=state.phase==='results', finished=done&&state.day===30;
    $('day-label').textContent=finished?'30 DAYS · A DREAM REALIZED':`DAY ${state.day} OF 30`;
    $('progress').style.width=`${state.history.length/30*100}%`;
    $('cash').textContent=G.money(state.cash);const profit=state.cash-10000;$('total-profit').textContent=G.money(profit);$('total-profit').className=profit<0?'negative':profit>0?'positive':'';
    $('total-sold').textContent=state.history.reduce((s,r)=>s+r.sold,0).toLocaleString();
    const event=G.eventFor(state.day);$('outlook').textContent=event.outlook;$('event-title').textContent=event.title;$('event-description').textContent=event.description;
    $('plan-day').textContent=`DAY ${state.day} · ${serving?'SERVING CUSTOMERS':done?'SHOP CLOSED':'YOUR GAME PLAN'}`;
    inputs.forEach(i=>i.disabled=done);$('bake-button').textContent=serving?'Serving fresh cookies…':done?'Today’s batch is in the books':'Open shop & bake';
    $('results').hidden=!done||serving;
    if(done){const r=state.history.at(-1);$('result-day').textContent=finished?'YOUR 30-DAY STORY':`DAY ${r.day} · THE SHOP IS CLOSED`;
      $('result-title').textContent=finished?(profit>0?'Look how far you’ve risen.':'Every baker starts somewhere.'):(r.profit>0?'Now that’s a sweet day.':r.profit===0?'A perfectly balanced batch.':'A little lesson in dough.');
      $('result-pill').textContent=finished?'Month complete':`${r.sold} of ${r.baked} sold`;
      const metrics=[['Cookies sold',String(r.sold)],['Revenue',G.money(r.revenue)],['Expenses',G.money(r.expense)],['Profit',G.money(r.profit)],['Remaining cash',G.money(r.cash)]];
      $('result-grid').replaceChildren(...metrics.map(([label,value])=>{const d=document.createElement('div'),s=document.createElement('span'),b=document.createElement('strong');s.textContent=label;b.textContent=value;if(label==='Profit')b.className=r.profit<0?'negative':'positive';d.append(s,b);return d;}));
      $('result-note').textContent=finished?`You sold ${state.history.reduce((s,r)=>s+r.sold,0)} cookies and ended with ${G.money(state.cash)} — a ${G.money(Math.abs(profit))} ${profit>=0?'gain':'loss'} on your starting cash. Ready for another month?`:`Baking: ${G.money(r.baked*50)} · Advertising: ${G.money(r.ads)}. ${r.baked-r.sold} unsold cookies were donated at closing. ${r.sold===r.baked&&r.baked>0?'Sold out! You might have room for a bigger batch tomorrow.':r.baked===0?'A day off from baking. Tomorrow is a fresh opportunity.':'Try adjusting your batch size, price, or advertising tomorrow.'}`;
      $('next-day').textContent=finished?'Play another month':'Plan the next day';
    }
    $('empty-history').hidden=!!state.history.length;$('history-wrap').hidden=!state.history.length;
    $('history').replaceChildren(...[...state.history].reverse().map(r=>{const tr=document.createElement('tr');[r.day,r.baked,r.sold,G.money(r.price),G.money(r.revenue),G.money(r.expense),G.money(r.profit),G.money(r.cash)].forEach((v,i)=>{const td=document.createElement('td');td.textContent=v;if(i===6)td.className=r.profit<0?'negative':'positive';tr.append(td);});return tr;}));budget();
  }
  inputs.forEach(i=>i.addEventListener('input',budget));
  $('plan-form').addEventListener('submit',e=>{e.preventDefault();if(serving||state.phase!=='planning'||inputs.some(i=>i.value===''))return;try{state=G.play(state,...values());save();serving=true;render();cancelCustomers=window.CookieCustomers.start(state.history.at(-1).sold,showResults);$('skip-customers').focus({preventScroll:true});$('customers').closest('svg').scrollIntoView({behavior:motion(),block:'center'});}catch(e){serving=false;render();$('error').textContent=e.message;}});
  $('next-day').addEventListener('click',()=>{if(serving)return;if(state.day===30){$('restart-dialog').showModal();return;}cancelCustomers();state=G.next(state);const last=state.history.at(-1);inputs[0].value=Math.min(last.baked,Math.floor(state.cash/50));inputs[2].value='0.00';save();render();$('plan-form').scrollIntoView({behavior:motion(),block:'center'});inputs[0].focus({preventScroll:true});});
  $('restart').addEventListener('click',()=>$('restart-dialog').showModal());$('cancel-restart').addEventListener('click',()=>$('restart-dialog').close());$('confirm-restart').addEventListener('click',()=>{cancelCustomers();serving=false;state=G.fresh();inputs[0].value=60;inputs[1].value='2.00';inputs[2].value='5.00';save();$('restart-dialog').close();render();window.scrollTo({top:0,behavior:motion()});});
  render();
})();
