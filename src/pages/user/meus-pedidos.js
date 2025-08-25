import { readStore, STORE_KEYS } from '../../store.js';
import { render, qsa, fmtCurrency, fmtDate } from '../../utils.js';

export function pageMeusPedidos() {
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
  qsa('button[data-action="exchange"]').forEach(b => b.addEventListener('click', e => { const id = e.currentTarget.getAttribute('data-id'); location.hash = `#/trocas?orderId=${id}`; }));
}
