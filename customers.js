/* A short, decorative rush. Sales have already been settled by the game rules. */
window.CookieCustomers = (() => {
  const ns = 'http://www.w3.org/2000/svg';
  const shirts = ['#e07a75', '#64a18a', '#e2aa49', '#6f91c4', '#a57ac0'];
  const skins = ['#e6b18c', '#aa7150', '#f1c9a7', '#754e3c'];
  function svg(tag, attributes = {}, children = []) {
    const node = document.createElementNS(ns, tag);
    Object.entries(attributes).forEach(([key, value]) => node.setAttribute(key, value));
    node.append(...children);
    return node;
  }
  function customer(index, quantity, delay) {
    const body = svg('g', {class: 'customer-body'}, [
      svg('ellipse', {cx: 0, cy: 0, rx: 14, ry: 4, fill: '#4d3469', opacity: '.15'}),
      svg('path', {d: 'M-6-17l-3 16', class: 'customer-leg left-leg'}),
      svg('path', {d: 'M6-17l3 16', class: 'customer-leg right-leg'}),
      svg('rect', {x: -12, y: -41, width: 24, height: 28, rx: 9, fill: shirts[index % shirts.length]}),
      svg('circle', {cx: 0, cy: -51, r: 12, fill: skins[index % skins.length]}),
      svg('path', {d: 'M-12-53q0-19 18-10l6 12q-12-7-24-2', fill: index % 2 ? '#624032' : '#382b40'}),
      svg('circle', {cx: 4, cy: -51, r: 1.5, fill: '#332541'}),
      svg('path', {d: 'M2-46q3 3 6-1', fill: 'none', stroke: '#624032', 'stroke-width': 1.5, 'stroke-linecap': 'round'}),
      svg('path', {d: 'M8-33l10 9', fill: 'none', stroke: skins[index % skins.length], 'stroke-width': 6, 'stroke-linecap': 'round'}),
      svg('g', {class: 'customer-cookie'}, [
        svg('circle', {cx: 20, cy: -25, r: 8, fill: '#f2bc70', stroke: '#ac703f', 'stroke-width': 1.5}),
        ...[[17,-28],[23,-25],[18,-21]].map(([cx,cy]) => svg('circle', {cx, cy, r: 1.5, fill: '#624032'}))
      ])
    ]);
    const label = svg('text', {x: 0, y: -76, 'text-anchor': 'middle', class: 'customer-purchase'});
    label.textContent = `+${quantity} 🍪`;
    const node = svg('g', {class: 'customer', style: `--arrival-delay:${delay}ms`}, [body, label]);
    return node;
  }
  function start(sold, onFinish) {
    const layer = document.getElementById('customers');
    const status = document.getElementById('customer-status');
    const message = document.getElementById('customer-message');
    const counter = document.getElementById('customer-count');
    const skip = document.getElementById('skip-customers');
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const count = sold === 0 ? 0 : Math.min(18, Math.ceil(sold / 5));
    const timers = [];
    let active = true;
    let purchased = 0;
    const later = (fn, delay) => timers.push(setTimeout(fn, delay));
    function cleanup() {
      active = false;
      timers.forEach(clearTimeout);
      layer.replaceChildren();
      skip.removeEventListener('click', finish);
    }
    function finish() {
      if (!active) return;
      cleanup();
      message.textContent = sold ? 'Thanks for stopping by!' : 'A quiet day at the shop.';
      counter.textContent = `${sold} cookies sold today`;
      skip.hidden = true;
      onFinish();
    }
    status.hidden = false;
    skip.hidden = reduced;
    message.textContent = sold ? 'The cookie rush is on!' : 'A quiet day at the shop.';
    counter.textContent = sold ? `0 / ${sold} cookies sold · Customers pick up little batches` : 'No cookie purchases today. Tomorrow is a fresh start.';
    skip.addEventListener('click', finish);
    if (reduced || !count) {
      later(finish, reduced ? 0 : 1200);
    } else {
      for (let i = 0; i < count; i++) {
        // Distribute every sale among a bounded crowd, including very small batches.
        const quantity = Math.floor((i + 1) * sold / count) - Math.floor(i * sold / count);
        const delay = i * 230;
        layer.append(customer(i, quantity, delay));
        later(() => {
          purchased += quantity;
          counter.textContent = `${purchased} / ${sold} cookies sold · Customers pick up little batches`;
        }, delay + 1600);
      }
      later(finish, (count - 1) * 230 + 3400);
    }
    return () => { cleanup(); status.hidden = true; };
  }
  return {start};
})();
