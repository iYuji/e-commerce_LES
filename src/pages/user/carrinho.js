import { readStore, STORE_KEYS, getCart, removeFromCart, updateQty } from '../../store.js';
import { render, qsa, fmtCurrency, qs } from '../../utils.js';

export function pageCarrinho() {
  const cards = readStore(STORE_KEYS.cards, []);
  function cartTotal() {
    return getCart().reduce((sum, it) => {
      const c = cards.find(x => x.id === it.id);
      return sum + (c ? c.price * it.qty : 0);
    }, 0);
  }
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
    const btn = qs('#go-checkout'); if (btn) btn.addEventListener('click', () => location.hash = '#/checkout');
  }
  renderCart();
}
