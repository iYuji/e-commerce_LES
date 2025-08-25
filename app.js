// Utilidades e estado da aplicação (SPA E-commerce TCG)
const THEME_KEY = 'theme';
const SESSION_KEY = 'session';
const __memStore = {};
const STORE_KEYS = {
  cards: 'cards',
  cart: 'cart',
  orders: 'orders',
  customers: 'customers',
  coupons: 'coupons',
  exchanges: 'exchanges',
};

const qs = sel => document.querySelector(sel);
const qsa = sel => Array.from(document.querySelectorAll(sel));
const fmtCurrency = v => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);
const fmtDate = iso => new Date(iso).toLocaleString('pt-BR');

function readStore(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null || typeof raw === 'undefined') return fallback;
    const v = JSON.parse(raw);
    return (v === null || typeof v === 'undefined') ? fallback : v;
  } catch {
    if (Object.prototype.hasOwnProperty.call(__memStore, key)) return __memStore[key];
    return fallback;
  }
}
function writeStore(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    __memStore[key] = value;
  }
}

// Sessão
function getSession() { return readStore(SESSION_KEY, { userId: null }); }
function setSession(s) { writeStore(SESSION_KEY, s); updateAuthNav(); }
function requireAuth(redirectTo = '#/auth') { const s = getSession(); if (!s.userId) { location.hash = redirectTo; return false; } return true; }
function updateAuthNav() {
  const s = getSession();
  const logged = !!s.userId;
  const elLogin = qs('#nav-login');
  const elLogout = qs('#nav-logout');
  const elAccount = qs('#nav-account');
  const elOrders = qs('#nav-orders');
  if (elLogin) elLogin.style.display = logged ? 'none' : '';
  if (elLogout) elLogout.style.display = logged ? '' : 'none';
  if (elAccount) elAccount.style.display = logged ? '' : 'none';
  if (elOrders) elOrders.style.display = logged ? '' : 'none';
}

// Tema
function applyTheme(theme) {
  const t = theme === 'light' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', t);
  const btn = qs('#btn-toggle-theme');
  if (btn) {
    btn.textContent = t === 'light' ? '🌞' : '🌙';
    btn.title = t === 'light' ? 'Alternar para modo escuro' : 'Alternar para modo claro';
  }
}
function initTheme() {
  const stored = localStorage.getItem(THEME_KEY);
  if (stored) return applyTheme(stored);
  const prefersLight = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
  applyTheme(prefersLight ? 'light' : 'dark');
}

// Seed de dados
(function seed() {
  if (!readStore(STORE_KEYS.cards)) {
    const demoCards = [
      { id: 'bulbasaur-1', name: 'Bulbasaur', rarity: 'Comum', set: 'Base', price: 9.9, stock: 25, active: true, image: '', description: 'Bulbasaur da coleção Base.' },
      { id: 'charmander-1', name: 'Charmander', rarity: 'Comum', set: 'Base', price: 12.5, stock: 18, active: true, image: '', description: 'Charmander da coleção Base.' },
      { id: 'squirtle-1', name: 'Squirtle', rarity: 'Comum', set: 'Base', price: 11.0, stock: 20, active: true, image: '', description: 'Squirtle da coleção Base.' },
      { id: 'pikachu-rare', name: 'Pikachu', rarity: 'Rara', set: 'Jungle', price: 49.9, stock: 8, active: true, image: '', description: 'Pikachu edição Jungle.' },
      { id: 'charizard-holo', name: 'Charizard', rarity: 'Ultra Rara', set: 'Base', price: 1499.9, stock: 1, active: true, image: '', description: 'Charizard holográfico clássico.' },
    ];
    writeStore(STORE_KEYS.cards, demoCards);
  }
  if (!readStore(STORE_KEYS.cart)) writeStore(STORE_KEYS.cart, []);
  if (!readStore(STORE_KEYS.orders)) writeStore(STORE_KEYS.orders, []);
  if (!readStore(STORE_KEYS.coupons)) writeStore(STORE_KEYS.coupons, [{ code: 'BEMVINDO10', percentage: 10, active: true }]);
  if (!readStore(STORE_KEYS.customers)) writeStore(STORE_KEYS.customers, [{
    id: 'me', name: 'Treinador', email: 'treinador@example', addresses: [], cards: [], password: '123', active: true
  }]);
  if (!readStore(STORE_KEYS.exchanges)) writeStore(STORE_KEYS.exchanges, []);
})();

// Carrinho
function getCart() { return readStore(STORE_KEYS.cart, []); }
function setCart(items) { writeStore(STORE_KEYS.cart, items); updateCartNav(); }
function addToCart(cardId, qty) {
  const items = getCart();
  const found = items.find(i => i.id === cardId);
  if (found) found.qty += qty; else items.push({ id: cardId, qty });
  setCart(items);
}
function removeFromCart(cardId) { setCart(getCart().filter(i => i.id !== cardId)); }
function updateQty(cardId, qty) { const items = getCart(); const f = items.find(i => i.id === cardId); if (f) { f.qty = Math.max(1, qty|0); setCart(items);} }
function cartTotal() {
  const cards = readStore(STORE_KEYS.cards, []);
  return getCart().reduce((sum, it) => {
    const c = cards.find(x => x.id === it.id);
    return sum + (c ? c.price * it.qty : 0);
  }, 0);
}
function updateCartNav() {
  const el = qs('#nav-cart');
  if (!el) return;
  const count = getCart().reduce((n, i) => n + i.qty, 0);
  el.textContent = `Carrinho (${count})`;
}

// Router
const routes = new Map();
function route(path, handler) { routes.set(path, handler); }
function parseHash() {
  const h = location.hash.replace(/^#/, '') || '/catalogo';
  const [pathname, rawQuery] = h.split('?');
  const segments = pathname.split('/').filter(Boolean);
  return { pathname: '/' + segments.join('/'), segments, query: Object.fromEntries(new URLSearchParams(rawQuery || '')) };
}
function navigate(path) { location.hash = path; }
function render(content) { const app = qs('#app'); if (app) app.innerHTML = content; }

function startRouter() {
  function dispatch() {
    const { pathname, segments, query } = parseHash();
    if (segments[0] === 'carta' && segments[1]) return pageCardDetail(segments[1]);
    if (pathname === '/logout') { setSession({ userId: null }); navigate('#/auth'); return; }
    const handler = routes.get(pathname) || pageNotFound;
    handler({ segments, query });
  }
  window.addEventListener('hashchange', dispatch);
  dispatch();
}

// Views
function pageCatalogo() {
  const all = readStore(STORE_KEYS.cards, []).filter(c => c.active);
  render(`
    <section class="view">
      <div class="toolbar">
        <div class="grid">
          <div class="form-field"><label>Nome</label><input id="f-name" placeholder="Ex.: Pikachu"></div>
          <div class="form-field"><label>Raridade</label>
            <select id="f-rarity"><option value="">Todas</option><option>Comum</option><option>Rara</option><option>Ultra Rara</option></select>
          </div>
          <div class="form-field"><label>Expansão</label><input id="f-set" placeholder="Ex.: Base"></div>
          <div class="form-field"><label>Preço até</label><input id="f-price" type="number" min="0" step="0.01"></div>
        </div>
        <div class="form-actions"><button class="btn" id="btn-do-filter">Filtrar</button><button class="btn ghost" id="btn-clear-filter">Limpar</button></div>
      </div>
      <div class="cards" id="catalog-cards"></div>
    </section>
  `);
  function renderCards(list) {
    const wrap = qs('#catalog-cards');
  wrap.innerHTML = '';
    list.forEach(c => {
    const div = document.createElement('div');
    div.className = 'card';
    div.innerHTML = `
        <strong>${c.name}</strong>
        <span class="muted">${c.set} • ${c.rarity}</span>
        <span>${fmtCurrency(c.price)}</span>
      <div>
          <button class="btn small" data-action="view" data-id="${c.id}">Detalhes</button>
          <button class="btn small" data-action="add" data-id="${c.id}">Adicionar ao Carrinho</button>
      </div>
    `;
    wrap.appendChild(div);
  });
  wrap.querySelectorAll('button').forEach(b => b.addEventListener('click', e => {
    const id = e.currentTarget.getAttribute('data-id');
    const action = e.currentTarget.getAttribute('data-action');
      if (action === 'view') navigate(`#/carta/${id}`);
      if (action === 'add') { addToCart(id, 1); alert('Adicionado ao carrinho'); }
    }));
  }
  function doFilter() {
    const name = (qs('#f-name').value || '').toLowerCase().trim();
    const rarity = (qs('#f-rarity').value || '').trim();
    const set = (qs('#f-set').value || '').toLowerCase().trim();
    const price = parseFloat(qs('#f-price').value || '0');
    const list = all.filter(c => {
      if (name && !c.name.toLowerCase().includes(name)) return false;
      if (rarity && c.rarity !== rarity) return false;
      if (set && !c.set.toLowerCase().includes(set)) return false;
      if (price && c.price > price) return false;
      return true;
    });
    renderCards(list);
  }
  qs('#btn-do-filter').addEventListener('click', doFilter);
  qs('#btn-clear-filter').addEventListener('click', () => { qsa('.toolbar input').forEach(i => i.value = ''); qs('#f-rarity').value=''; renderCards(all); });
  renderCards(all);
}

function pageCardDetail(id) {
  const card = readStore(STORE_KEYS.cards, []).find(c => c.id === id);
  if (!card) return pageNotFound();
  render(`
    <section class="view">
      <div class="view-header">
        <button class="btn ghost" onclick="location.hash='#/catalogo'">← Voltar</button>
        <h2>${card.name}</h2>
        <div class="spacer"></div>
        <span>${fmtCurrency(card.price)}</span>
      </div>
      <div class="cards">
        <div class="card">
          <strong>${card.name}</strong>
          <span class="muted">${card.set} • ${card.rarity}</span>
          <span>Estoque: ${card.stock}</span>
          <p class="muted">${card.description || ''}</p>
          <div>
            <label class="muted">Quantidade</label>
            <input id="qty" type="number" min="1" value="1" style="width:120px">
          </div>
          <div>
            <button class="btn primary" id="btn-add">Adicionar ao Carrinho</button>
          </div>
        </div>
      </div>
    </section>
  `);
  qs('#btn-add').addEventListener('click', () => { const q = Math.max(1, parseInt(qs('#qty').value||'1',10)); addToCart(card.id, q); navigate('#/carrinho'); });
}

function pageCarrinho() {
  const cards = readStore(STORE_KEYS.cards, []);
  function renderCart() {
    const items = getCart();
    const rows = items.map(it => {
      const c = cards.find(x => x.id === it.id);
      if (!c) return '';
      return `
        <tr>
          <td>${c.name}</td>
          <td>${fmtCurrency(c.price)}</td>
          <td><input data-id="${c.id}" class="qty" type="number" min="1" value="${it.qty}" style="width:80px"></td>
          <td>${fmtCurrency(c.price * it.qty)}</td>
          <td class="right"><button class="btn small" data-action="rm" data-id="${c.id}">Remover</button></td>
        </tr>
      `;
    }).join('');
    render(`
      <section class="view">
        <h2>Carrinho</h2>
        <div class="table-wrapper">
          <table class="table">
            <thead><tr><th>Item</th><th>Preço</th><th>Qtd</th><th>Subtotal</th><th class="right">Ações</th></tr></thead>
            <tbody>${rows || '<tr><td colspan="5">Seu carrinho está vazio</td></tr>'}</tbody>
          </table>
        </div>
        <div class="view-header">
          <div class="spacer"></div>
          <strong>Total: ${fmtCurrency(cartTotal())}</strong>
          <button class="btn primary" id="go-checkout" ${getCart().length ? '' : 'disabled'}>Finalizar Compra</button>
        </div>
      </section>
    `);
    qsa('button[data-action="rm"]').forEach(b => b.addEventListener('click', e => { removeFromCart(e.currentTarget.getAttribute('data-id')); renderCart(); }));
    qsa('input.qty').forEach(inp => inp.addEventListener('change', e => { updateQty(e.currentTarget.getAttribute('data-id'), parseInt(e.currentTarget.value||'1',10)); renderCart(); }));
    const btn = qs('#go-checkout'); if (btn) btn.addEventListener('click', () => navigate('#/checkout'));
  }
  renderCart();
}

function pageCheckout() {
  const customer = readStore(STORE_KEYS.customers, [])[0];
  const coupons = readStore(STORE_KEYS.coupons, []);
  const cards = readStore(STORE_KEYS.cards, []);
  const items = getCart();
  const orderTotal = cartTotal();
  render(`
    <section class="view">
      <h2>Checkout</h2>
      <div class="grid">
        <div class="card">
          <h3>Endereço de entrega</h3>
          <div id="addr-list">${(customer.addresses||[]).map(a => `<label class="switch"><input type="radio" name="addr" value="${a.id}"><span>${a.label} • ${a.street}, ${a.number||'s/n'}</span></label>`).join('') || '<span class="muted">Nenhum endereço salvo.</span>'}</div>
          <button class="btn small" id="add-addr">Novo endereço</button>
          <form id="addr-form" class="grid hidden">
            <input id="a-label" placeholder="Identificação" required>
            <input id="a-street" placeholder="Rua" required>
            <input id="a-number" placeholder="Número">
            <input id="a-city" placeholder="Cidade">
            <input id="a-state" placeholder="Estado">
            <div class="form-actions span-2"><button class="btn primary" type="submit">Salvar</button><button class="btn ghost" type="button" id="cancel-addr">Cancelar</button></div>
          </form>
        </div>
        <div class="card">
          <h3>Pagamento</h3>
          <label class="switch"><input type="radio" name="pay" value="card" checked><span>Cartão</span></label>
          <label class="switch"><input type="radio" name="pay" value="coupon"><span>Cupom</span></label>
          <div id="coupon-wrap" class="hidden">
            <select id="coupon-select">${coupons.filter(c=>c.active).map(c=>`<option value="${c.code}">${c.code} • ${c.percentage}%</option>`).join('')}</select>
          </div>
        </div>
        <div class="card span-2">
          <h3>Revisão</h3>
          <div class="table-wrapper">
            <table class="table"><thead><tr><th>Item</th><th>Qtd</th><th>Preço</th></tr></thead><tbody>
              ${items.map(it => { const c = cards.find(x=>x.id===it.id); return `<tr><td>${(c && c.name) || it.id}</td><td>${it.qty}</td><td>${fmtCurrency(((c ? c.price : 0)*it.qty))}</td></tr>`; }).join('')}
            </tbody></table>
          </div>
          <div class="view-header"><div class="spacer"></div><strong>Total: ${fmtCurrency(orderTotal)}</strong><button class="btn primary" id="confirm">Confirmar Pedido</button></div>
        </div>
      </div>
    </section>
  `);
  function refreshAddrList() {
    const u = readStore(STORE_KEYS.customers, [])[0];
    const wrap = qs('#addr-list');
    wrap.innerHTML = (u.addresses||[]).map(a => `<label class="switch"><input type="radio" name="addr" value="${a.id}"><span>${a.label} • ${a.street}, ${a.number||'s/n'}</span></label>`).join('') || '<span class="muted">Nenhum endereço salvo.</span>';
  }
  qs('#add-addr').addEventListener('click', () => qs('#addr-form').classList.remove('hidden'));
  qs('#cancel-addr').addEventListener('click', () => qs('#addr-form').classList.add('hidden'));
  qs('#addr-form').addEventListener('submit', e => {
  e.preventDefault();
    const u = readStore(STORE_KEYS.customers, [])[0];
    const addr = { id: crypto.randomUUID(), label: qs('#a-label').value.trim(), street: qs('#a-street').value.trim(), number: qs('#a-number').value.trim(), city: qs('#a-city').value.trim(), state: qs('#a-state').value.trim() };
    (u.addresses || (u.addresses=[])).push(addr);
    writeStore(STORE_KEYS.customers, [u]);
    qs('#addr-form').classList.add('hidden');
    qs('#addr-form').reset();
    refreshAddrList();
  });
  qsa('input[name="pay"]').forEach(r => r.addEventListener('change', () => {
    const usingCoupon = (document.querySelector('input[name="pay"]:checked')||{}).value === 'coupon';
    qs('#coupon-wrap').classList.toggle('hidden', !usingCoupon);
  }));
  qs('#confirm').addEventListener('click', () => {
    if (!getCart().length) { alert('Carrinho vazio'); return; }
    const addrId = (document.querySelector('input[name="addr"]:checked')||{}).value;
    if (!addrId) { alert('Selecione um endereço'); return; }
    const payType = (document.querySelector('input[name="pay"]:checked')||{}).value;
    let discount = 0; let couponCode = null;
    if (payType === 'coupon') {
      couponCode = (qs('#coupon-select')||{}).value || null;
      const c = readStore(STORE_KEYS.coupons, []).find(x => x.code === couponCode && x.active);
      discount = c ? (cartTotal() * (c.percentage/100)) : 0;
    }
    const order = { id: crypto.randomUUID(), date: new Date().toISOString(), items: getCart(), total: cartTotal(), discount, couponCode, status: 'Aprovado' };
    const orders = readStore(STORE_KEYS.orders, []);
    orders.push(order);
    writeStore(STORE_KEYS.orders, orders);
    setCart([]);
    alert('Pedido confirmado!');
    navigate('#/meus-pedidos');
  });
}

function pageMinhaConta() {
  if (!requireAuth()) return;
  const u = readStore(STORE_KEYS.customers, [])[0];
  render(`
    <section class="view">
      <div class="view-header"><h2>Minha Conta</h2></div>
      <div class="grid">
        <form class="card" id="profile-form">
          <h3>Dados do cliente</h3>
          <div class="form-field"><label>Nome</label><input id="pf-name" value="${u.name||''}"></div>
          <div class="form-field"><label>E-mail</label><input id="pf-email" value="${u.email||''}"></div>
          <div class="form-field"><label>Senha</label><input id="pf-pass" type="password" placeholder="••••••"></div>
          <div class="form-actions"><button class="btn primary">Salvar</button></div>
        </form>
        <div class="card">
          <div class="section-header"><h3>Endereços</h3><button class="btn small" id="add-addr">Novo</button></div>
          <div id="addr-list"></div>
          <form id="addr-form" class="grid hidden">
            <input id="a-label" placeholder="Identificação" required>
            <input id="a-street" placeholder="Rua" required>
            <input id="a-number" placeholder="Número">
            <input id="a-city" placeholder="Cidade">
            <input id="a-state" placeholder="Estado">
            <div class="form-actions span-2"><button class="btn primary" type="submit">Salvar</button><button class="btn ghost" type="button" id="cancel-addr">Cancelar</button></div>
          </form>
        </div>
        <div class="card">
          <h3>Trocas</h3>
          <p class="muted">Solicite troca de itens de um pedido.</p>
          <button class="btn" id="go-exchange">Solicitar troca</button>
        </div>
      </div>
    </section>
  `);
  qs('#profile-form').addEventListener('submit', e => {
    e.preventDefault();
    const next = { ...u, name: qs('#pf-name').value.trim(), email: qs('#pf-email').value.trim() };
    const pass = qs('#pf-pass').value; if (pass) next.password = pass;
    writeStore(STORE_KEYS.customers, [next]); alert('Perfil salvo');
  });
  function refreshAddr() {
    const user = readStore(STORE_KEYS.customers, [])[0];
    const wrap = qs('#addr-list');
    wrap.innerHTML = (user.addresses||[]).map(a => `<div class="card"><strong>${a.label}</strong><span class="muted">${a.street}, ${a.number||'s/n'} - ${a.city||''}/${a.state||''}</span><div><button class="btn small" data-id="${a.id}" data-action="del">Excluir</button></div></div>`).join('') || '<span class="muted">Nenhum endereço</span>';
    wrap.querySelectorAll('button[data-action="del"]').forEach(b => b.addEventListener('click', e => {
      const id = e.currentTarget.getAttribute('data-id');
      const u2 = readStore(STORE_KEYS.customers, [])[0];
      u2.addresses = (u2.addresses||[]).filter(a => a.id !== id);
      writeStore(STORE_KEYS.customers, [u2]);
      refreshAddr();
    }));
  }
  qs('#add-addr').addEventListener('click', () => qs('#addr-form').classList.remove('hidden'));
  qs('#cancel-addr').addEventListener('click', () => qs('#addr-form').classList.add('hidden'));
  qs('#addr-form').addEventListener('submit', e => {
    e.preventDefault();
    const u3 = readStore(STORE_KEYS.customers, [])[0];
    const addr = { id: crypto.randomUUID(), label: qs('#a-label').value.trim(), street: qs('#a-street').value.trim(), number: qs('#a-number').value.trim(), city: qs('#a-city').value.trim(), state: qs('#a-state').value.trim() };
    (u3.addresses || (u3.addresses=[])).push(addr);
    writeStore(STORE_KEYS.customers, [u3]);
    qs('#addr-form').classList.add('hidden');
    qs('#addr-form').reset();
    refreshAddr();
  });
  refreshAddr();
  qs('#go-exchange').addEventListener('click', () => navigate('#/trocas'));
}

function pageMeusPedidos() {
  if (!requireAuth()) return;
  const orders = readStore(STORE_KEYS.orders, []).slice().reverse();
  render(`
    <section class="view">
      <h2>Meus Pedidos</h2>
      <div class="table-wrapper">
        <table class="table"><thead><tr><th>Data</th><th>Total</th><th>Status</th><th>Ações</th></tr></thead><tbody>
          ${orders.map(o => `<tr><td>${fmtDate(o.date)}</td><td>${fmtCurrency(o.total - (o.discount||0))}</td><td>${o.status}</td><td><button class="btn small" data-id="${o.id}" data-action="exchange">Solicitar troca</button></td></tr>`).join('') || '<tr><td colspan="4">Nenhum pedido</td></tr>'}
        </tbody></table>
      </div>
    </section>
  `);
  qsa('button[data-action="exchange"]').forEach(b => b.addEventListener('click', e => { const id = e.currentTarget.getAttribute('data-id'); navigate(`#/trocas?orderId=${id}`); }));
}

function pageTrocas(ctx) {
  if (!requireAuth()) return;
  render(`
    <section class="view">
      <div class="grid">
        <form class="card" id="exchange-form">
          <h3>Solicitar troca</h3>
          <input id="ex-order" placeholder="ID do pedido" value="${(ctx && ctx.query && ctx.query.orderId) || ''}">
          <input id="ex-reason" placeholder="Motivo" class="span-2">
          <div class="form-actions span-2"><button class="btn primary">Enviar</button></div>
        </form>
      </div>
    </section>
  `);
  qs('#exchange-form').addEventListener('submit', e => {
    e.preventDefault();
    const list = readStore(STORE_KEYS.exchanges, []);
    list.push({ id: crypto.randomUUID(), orderId: qs('#ex-order').value.trim(), reason: qs('#ex-reason').value.trim(), date: new Date().toISOString(), status: 'Solicitado' });
    writeStore(STORE_KEYS.exchanges, list);
    alert('Troca solicitada');
  });
}

// Admin: Cartas (CRUD simples)
function pageAdminCartas() {
  const cards = readStore(STORE_KEYS.cards, []);
  render(`
    <section class="view">
      <div class="view-header"><h2>Admin • Cartas</h2><div class="spacer"></div><button class="btn" id="new-card">Nova Carta</button></div>
      <div class="table-wrapper"><table class="table"><thead><tr><th>Ativo</th><th>Nome</th><th>Raridade</th><th>Set</th><th>Preço</th><th>Estoque</th><th class="right">Ações</th></tr></thead><tbody>
        ${cards.map(c => `<tr><td>${c.active? '✅':'❌'}</td><td>${c.name}</td><td>${c.rarity}</td><td>${c.set}</td><td>${fmtCurrency(c.price)}</td><td>${c.stock}</td><td class="right"><button class="btn small" data-action="edit" data-id="${c.id}">Editar</button><button class="btn small" data-action="toggle" data-id="${c.id}">${c.active?'Inativar':'Ativar'}</button></td></tr>`).join('')}
      </tbody></table></div>
      <dialog id="card-dialog">
        <form method="dialog" id="card-form" class="grid">
          <h3 id="card-title" class="span-2">Nova Carta</h3>
          <input type="hidden" id="c-id">
          <input id="c-name" placeholder="Nome" required>
          <select id="c-rarity"><option>Comum</option><option>Rara</option><option>Ultra Rara</option></select>
          <input id="c-set" placeholder="Expansão" required>
          <input id="c-price" type="number" min="0" step="0.01" placeholder="Preço" required>
          <input id="c-stock" type="number" min="0" step="1" placeholder="Estoque" required>
          <label class="switch"><input type="checkbox" id="c-active" checked><span>Ativo</span></label>
          <div class="form-actions span-2"><button value="cancel" class="btn ghost">Cancelar</button><button value="confirm" class="btn primary" id="save-card">Salvar</button></div>
        </form>
      </dialog>
    </section>
  `);
  const dialog = document.getElementById('card-dialog');
  function openEditor(card) {
    qs('#card-title').textContent = card ? 'Editar Carta' : 'Nova Carta';
    qs('#c-id').value = (card && card.id) || '';
    qs('#c-name').value = (card && card.name) || '';
    qs('#c-rarity').value = (card && card.rarity) || 'Comum';
    qs('#c-set').value = (card && card.set) || '';
    qs('#c-price').value = (card && typeof card.price !== 'undefined') ? card.price : '';
    qs('#c-stock').value = (card && typeof card.stock !== 'undefined') ? card.stock : '';
    qs('#c-active').checked = (card && typeof card.active !== 'undefined') ? !!card.active : true;
    if (typeof dialog.showModal === 'function') dialog.showModal();
  }
  qs('#new-card').addEventListener('click', () => openEditor(null));
  qsa('button[data-action="edit"]').forEach(b => b.addEventListener('click', e => {
    const id = e.currentTarget.getAttribute('data-id');
    const card = readStore(STORE_KEYS.cards, []).find(x => x.id === id);
    openEditor(card);
  }));
  qsa('button[data-action="toggle"]').forEach(b => b.addEventListener('click', e => {
    const id = e.currentTarget.getAttribute('data-id');
    const cards2 = readStore(STORE_KEYS.cards, []);
    const idx = cards2.findIndex(x => x.id === id);
    if (idx >= 0) { cards2[idx].active = !cards2[idx].active; writeStore(STORE_KEYS.cards, cards2); pageAdminCartas(); }
  }));
  qs('#save-card').addEventListener('click', e => {
    e.preventDefault();
    const id = qs('#c-id').value || crypto.randomUUID();
    const card = { id, name: qs('#c-name').value.trim(), rarity: qs('#c-rarity').value, set: qs('#c-set').value.trim(), price: parseFloat(qs('#c-price').value||'0'), stock: parseInt(qs('#c-stock').value||'0',10), active: qs('#c-active').checked };
    const cards3 = readStore(STORE_KEYS.cards, []);
    const idx = cards3.findIndex(x => x.id === id);
    if (idx >= 0) cards3[idx] = card; else cards3.push(card);
    writeStore(STORE_KEYS.cards, cards3);
    if (dialog.open) dialog.close();
    pageAdminCartas();
  });
}

function pageAdminClientes() {
  const customers = readStore(STORE_KEYS.customers, []);
  render(`
    <section class="view">
      <h2>Admin • Clientes</h2>
      <div class="table-wrapper"><table class="table"><thead><tr><th>Nome</th><th>E-mail</th><th>Status</th></tr></thead><tbody>
        ${customers.map(c => `<tr><td>${c.name}</td><td>${c.email}</td><td>${c.active?'Ativo':'Inativo'}</td></tr>`).join('')}
      </tbody></table></div>
    </section>
  `);
}

function pageAdminVendas() {
  const orders = readStore(STORE_KEYS.orders, []);
  render(`
    <section class="view">
      <h2>Admin • Vendas</h2>
      <div class="table-wrapper"><table class="table"><thead><tr><th>Data</th><th>Total</th><th>Status</th><th class="right">Ações</th></tr></thead><tbody>
        ${orders.map((o,i)=>`<tr><td>${fmtDate(o.date)}</td><td>${fmtCurrency(o.total - (o.discount||0))}</td><td>${o.status}</td><td class="right"><button class="btn small" data-i="${i}" data-s="Em Trânsito">Em Trânsito</button><button class="btn small" data-i="${i}" data-s="Entregue">Entregue</button></td></tr>`).join('')||'<tr><td colspan="4">Sem pedidos</td></tr>'}
      </tbody></table></div>
    </section>
  `);
  qsa('button[data-i]').forEach(b => b.addEventListener('click', e => { const i = +e.currentTarget.getAttribute('data-i'); const s = e.currentTarget.getAttribute('data-s'); const os = readStore(STORE_KEYS.orders, []); if (os[i]) { os[i].status = s; writeStore(STORE_KEYS.orders, os); pageAdminVendas(); }}));
}

function pageAdminTrocas() {
  const list = readStore(STORE_KEYS.exchanges, []);
  render(`
    <section class="view">
      <h2>Admin • Trocas</h2>
      <div class="table-wrapper"><table class="table"><thead><tr><th>Data</th><th>Pedido</th><th>Motivo</th><th>Status</th><th class="right">Ações</th></tr></thead><tbody>
        ${list.map((t,i)=>`<tr><td>${fmtDate(t.date)}</td><td>${t.orderId}</td><td>${t.reason}</td><td>${t.status}</td><td class="right"><button class="btn small" data-i="${i}" data-s="Autorizada">Autorizar</button><button class="btn small" data-i="${i}" data-s="Recusada">Recusar</button></td></tr>`).join('')||'<tr><td colspan="5">Sem trocas</td></tr>'}
      </tbody></table></div>
    </section>
  `);
  qsa('button[data-i]').forEach(b => b.addEventListener('click', e => { const i = +e.currentTarget.getAttribute('data-i'); const s = e.currentTarget.getAttribute('data-s'); const arr = readStore(STORE_KEYS.exchanges, []); if (arr[i]) { arr[i].status = s; writeStore(STORE_KEYS.exchanges, arr); pageAdminTrocas(); }}));
}

function pageAdminEstoque() {
  const cards = readStore(STORE_KEYS.cards, []);
  render(`
    <section class="view">
      <h2>Admin • Estoque</h2>
      <div class="table-wrapper"><table class="table"><thead><tr><th>Nome</th><th>Preço</th><th>Estoque</th><th class="right">Ajuste</th></tr></thead><tbody>
        ${cards.map((c,i)=>`<tr><td>${c.name}</td><td>${fmtCurrency(c.price)}</td><td>${c.stock}</td><td class="right"><input type="number" style="width:90px" id="adj-${i}" value="0"><button class="btn small" data-i="${i}">Aplicar</button></td></tr>`).join('')}</tbody></table></div>
    </section>
  `);
  qsa('button[data-i]').forEach(b => b.addEventListener('click', e => { const i = +e.currentTarget.getAttribute('data-i'); const v = parseInt((qs(`#adj-${i}`)||{value:'0'}).value||'0',10); const arr = readStore(STORE_KEYS.cards, []); if (arr[i]) { arr[i].stock = Math.max(0, (arr[i].stock|0)+v); writeStore(STORE_KEYS.cards, arr); pageAdminEstoque(); }}));
}

function pageAdminRelatorios() {
  const orders = readStore(STORE_KEYS.orders, []);
  const bySet = {};
  const cards = readStore(STORE_KEYS.cards, []);
  orders.forEach(o => o.items.forEach(it => { const c = cards.find(x=>x.id===it.id); if (!c) return; bySet[c.set] = (bySet[c.set]||0) + (c.price*it.qty); }));
  const rows = Object.entries(bySet).map(([set, total]) => `<tr><td>${set}</td><td>${fmtCurrency(total)}</td></tr>`).join('');
  render(`
    <section class="view">
      <h2>Admin • Relatórios</h2>
      <div class="table-wrapper"><table class="table"><thead><tr><th>Expansão</th><th>Total vendido</th></tr></thead><tbody>${rows||'<tr><td colspan="2">Sem dados</td></tr>'}</tbody></table></div>
    </section>
  `);
}

function pageAssistente() {
  render(`
    <section class="view">
      <h2>Assistente IA</h2>
      <div class="card">
        <p class="muted">Olá! Sou seu assistente. Baseado nos seus pedidos, você pode gostar destas cartas:</p>
        <div id="ai-suggestions" class="cards"></div>
      </div>
    </section>
  `);
  const orders = readStore(STORE_KEYS.orders, []);
  const freq = new Map();
  orders.forEach(o => o.items.forEach(it => freq.set(it.id, (freq.get(it.id)||0)+it.qty)));
  const cards = readStore(STORE_KEYS.cards, []);
  const sorted = cards.slice().sort((a,b) => (freq.get(b.id)||0)-(freq.get(a.id)||0)).slice(0,4);
  const wrap = qs('#ai-suggestions');
  wrap.innerHTML = sorted.map(c => `<div class="card"><strong>${c.name}</strong><span class="muted">${c.set} • ${c.rarity}</span><span>${fmtCurrency(c.price)}</span><button class="btn small" onclick="location.hash='#/carta/${c.id}'">Ver</button></div>`).join('') || '<span class="muted">Sem recomendações ainda.</span>';
}

// Autenticação (login/cadastro)
// Cupons (somente listagem)
function pageCupons() {
  const coupons = readStore(STORE_KEYS.coupons, []).filter(function(c){ return !!c.active; });
  render(
    '<section class="view">'
    + '<h2>Cupons disponíveis</h2>'
    + '<div class="cards">'
    + (coupons.length ? coupons.map(function(c){ return '<div class="card"><strong>'+c.code+'</strong><span class="muted">'+c.percentage+'% de desconto</span></div>'; }).join('') : '<span class="muted">Nenhum cupom no momento.</span>')
    + '</div>'
    + '</section>'
  );
}
// expõe no escopo global por compatibilidade
try { window.pageCupons = pageCupons; } catch {}

// Autenticação (login/cadastro)
function pageAuth() {
  render(`
    <section class="view">
      <div class="grid">
        <form class="card" id="login-form">
          <h3>Entrar</h3>
          <input id="lg-email" type="email" placeholder="E-mail" required>
          <input id="lg-pass" type="password" placeholder="Senha" required>
          <div class="form-actions"><button class="btn primary">Entrar</button></div>
        </form>
        <form class="card" id="signup-form">
          <h3>Criar conta</h3>
          <input id="su-name" placeholder="Nome" required>
          <input id="su-email" type="email" placeholder="E-mail" required>
          <input id="su-pass" type="password" placeholder="Senha" required>
          <div class="form-actions"><button class="btn">Cadastrar</button></div>
        </form>
      </div>
    </section>
  `);
  const loginForm = qs('#login-form');
  if (loginForm) loginForm.addEventListener('submit', e => {
  e.preventDefault();
    const email = qs('#lg-email').value.trim().toLowerCase();
    const pass = qs('#lg-pass').value;
    const users = readStore(STORE_KEYS.customers, []);
    const u = users.find(x => (x.email||'').toLowerCase() === email && x.password === pass && x.active !== false);
    if (!u) { alert('Credenciais inválidas'); return; }
    setSession({ userId: u.id });
    navigate('#/catalogo');
  });
  const signupForm = qs('#signup-form');
  if (signupForm) signupForm.addEventListener('submit', e => {
  e.preventDefault();
    const name = qs('#su-name').value.trim();
    const email = qs('#su-email').value.trim();
    const pass = qs('#su-pass').value;
    const users = readStore(STORE_KEYS.customers, []);
    if (users.some(x => (x.email||'').toLowerCase() === email.toLowerCase())) { alert('E-mail já cadastrado'); return; }
    const nu = { id: (crypto && crypto.randomUUID ? crypto.randomUUID() : String(Date.now())), name, email, password: pass, addresses: [], cards: [], active: true };
    users.push(nu); writeStore(STORE_KEYS.customers, users);
    setSession({ userId: nu.id });
    navigate('#/catalogo');
  });
}

function pageNotFound() { render('<section class="view"><h2>Página não encontrada</h2></section>'); }

// Definição de rotas
route('/catalogo', pageCatalogo);
route('/carrinho', pageCarrinho);
route('/checkout', pageCheckout);
route('/auth', pageAuth);
route('/minha-conta', pageMinhaConta);
route('/meus-pedidos', pageMeusPedidos);
route('/trocas', pageTrocas);
route('/cupons', function(ctx){ if (typeof pageCupons === 'function') { pageCupons(ctx); } else { pageNotFound(); } });
route('/admin/cartas', pageAdminCartas);
route('/admin/clientes', pageAdminClientes);
route('/admin/vendas', pageAdminVendas);
route('/admin/trocas', pageAdminTrocas);
route('/admin/estoque', pageAdminEstoque);
route('/admin/relatorios', pageAdminRelatorios);
route('/assistente', pageAssistente);

// Inicialização
initTheme();
startRouter();
updateCartNav();
updateAuthNav();

// Toggle de tema
qs('#btn-toggle-theme').addEventListener('click', () => {
  const current = document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
  const next = current === 'light' ? 'dark' : 'light';
  localStorage.setItem(THEME_KEY, next);
  applyTheme(next);
});
