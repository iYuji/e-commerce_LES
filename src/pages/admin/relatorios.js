import { readStore, STORE_KEYS } from '../../store.js';
import { qs } from '../../utils.js';

function sum(arr, sel = x => x) {
  return arr.reduce((a, b) => a + sel(b), 0);
}

export function pageAdminRelatorios() {
  const app = qs('#app');
  const orders = readStore(STORE_KEYS.orders, []);
  const products = readStore(STORE_KEYS.cards, []);

  const totalVendas = sum(orders, o => o.total || 0);
  const pedidos = orders.length;
  const estoqueTotal = sum(products, p => p.stock || 0);

  app.innerHTML = `
    <section class="container">
      <h1>Admin · Relatórios</h1>
      <div class="cards">
        <div class="card"><h3>Faturamento</h3><p>R$ ${totalVendas.toFixed(2)}</p></div>
        <div class="card"><h3>Pedidos</h3><p>${pedidos}</p></div>
        <div class="card"><h3>Itens em estoque</h3><p>${estoqueTotal}</p></div>
      </div>
      <h2>Pedidos recentes</h2>
      <ul>
        ${orders.slice(-10).reverse().map(o => `<li>#${o.id} · R$ ${(o.total||0).toFixed(2)} · ${o.status||'novo'}</li>`).join('')}
      </ul>
    </section>
  `;
}
