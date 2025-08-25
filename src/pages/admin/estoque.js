import { readStore, writeStore, STORE_KEYS } from '../../store.js';
import { qs } from '../../utils.js';

export function pageAdminEstoque() {
  const app = qs('#app');
  const products = readStore(STORE_KEYS.cards, []);

  app.innerHTML = `
    <section class="container">
      <h1>Admin · Estoque</h1>
      <div class="table-responsive">
        <table class="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nome</th>
              <th>Preço</th>
              <th>Estoque</th>
              <th>Ajuste</th>
            </tr>
          </thead>
          <tbody>
            ${products.map(p => `
              <tr>
                <td>${p.id}</td>
                <td>${p.name}</td>
                <td>R$ ${(p.price || 0).toFixed(2)}</td>
                <td>${p.stock ?? 0}</td>
                <td>
                  <input type="number" class="qty" data-id="${p.id}" value="0" style="width:80px" />
                  <button class="btn" data-action="apply" data-id="${p.id}">Aplicar</button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </section>
  `;

  app.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-action="apply"]');
    if (!btn) return;
    const id = btn.getAttribute('data-id');
    const input = app.querySelector(`input.qty[data-id="${id}"]`);
    const delta = parseInt(input.value, 10) || 0;
  const list = readStore(STORE_KEYS.cards, []);
    const idx = list.findIndex(x => String(x.id) === String(id));
    if (idx !== -1) {
      const current = Number(list[idx].stock || 0);
      list[idx].stock = Math.max(0, current + delta);
  writeStore(STORE_KEYS.cards, list);
  pageAdminEstoque();
    }
  });
}
