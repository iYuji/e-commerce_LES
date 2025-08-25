import { readStore, writeStore, STORE_KEYS, getCart, setCart } from '../../store.js';
import { render, qs, qsa, fmtCurrency } from '../../utils.js';

export function pageCheckout() {
  const customer = readStore(STORE_KEYS.customers, [])[0];
  const coupons = readStore(STORE_KEYS.coupons, []);
  const cards = readStore(STORE_KEYS.cards, []);
  const items = getCart();
  const orderTotal = items.reduce((sum, it) => {
    const c = cards.find(x => x.id === it.id);
    return sum + (c ? c.price * it.qty : 0);
  }, 0);
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
    const cards2 = readStore(STORE_KEYS.cards, []);
    const total = getCart().reduce((sum, it) => {
      const c = cards2.find(x => x.id === it.id);
      return sum + (c ? c.price * it.qty : 0);
    }, 0);
    if (payType === 'coupon') {
      couponCode = (qs('#coupon-select')||{}).value || null;
      const c = readStore(STORE_KEYS.coupons, []).find(x => x.code === couponCode && x.active);
      discount = c ? (total * (c.percentage/100)) : 0;
    }
    const order = { id: crypto.randomUUID(), date: new Date().toISOString(), items: getCart(), total, discount, couponCode, status: 'Aprovado' };
    const orders = readStore(STORE_KEYS.orders, []);
    orders.push(order);
    writeStore(STORE_KEYS.orders, orders);
    setCart([]);
    alert('Pedido confirmado!');
    location.hash = '#/meus-pedidos';
  });
}
