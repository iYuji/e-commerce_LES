import { readStore, writeStore, STORE_KEYS } from '../../store.js';
import { qs } from '../../utils.js';

export function pageAdminVendas() {
  const app = qs('#app');
  const vendas = readStore(STORE_KEYS.orders, []);

  app.innerHTML = `
    <section class="container">
      <h1>Admin · Vendas</h1>
      <div class="table-responsive">
        <table class="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Cliente</th>
              <th>Total</th>
              <th>Status</th>
              <th>Data</th>
            </tr>
          </thead>
          <tbody>
            ${vendas.map(v => `
              <tr>
                <td>${v.id}</td>
                <td>${v.customer?.name || '-'}</td>
                <td>R$ ${(v.total || 0).toFixed(2)}</td>
                <td>
                  <select data-id="${v.id}" class="status-select">
                    ${['novo','pago','enviado','concluido','cancelado'].map(s => `
                      <option value="${s}" ${v.status===s?'selected':''}>${s}</option>
                    `).join('')}
                  </select>
                </td>
                <td>${new Date(v.createdAt || Date.now()).toLocaleString()}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </section>
  `;

  app.addEventListener('change', (e) => {
    const sel = e.target.closest('.status-select');
    if (!sel) return;
    const id = sel.getAttribute('data-id');
  const orders = readStore(STORE_KEYS.orders, []);
    const idx = orders.findIndex(o => String(o.id) === String(id));
    if (idx !== -1) {
      orders[idx] = { ...orders[idx], status: sel.value };
  writeStore(STORE_KEYS.orders, orders);
    }
  });
}
