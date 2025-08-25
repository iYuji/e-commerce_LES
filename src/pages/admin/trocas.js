import { readStore, writeStore, STORE_KEYS } from '../../store.js';
import { qs } from '../../utils.js';

export function pageAdminTrocas() {
  const app = qs('#app');
  const trocas = readStore(STORE_KEYS.exchanges, []);

  app.innerHTML = `
    <section class="container">
      <h1>Admin · Trocas</h1>
      <div class="table-responsive">
        <table class="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Pedido</th>
              <th>Cliente</th>
              <th>Motivo</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            ${trocas.map(t => `
              <tr>
                <td>${t.id}</td>
                <td>${t.orderId}</td>
                <td>${t.customer?.name || '-'}</td>
                <td>${t.reason || '-'}</td>
                <td>${t.status || 'aberta'}</td>
                <td>
                  <button class="btn" data-action="advance" data-id="${t.id}">Avançar</button>
                  <button class="btn" data-action="cancel" data-id="${t.id}">Cancelar</button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </section>
  `;

  app.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;
    const id = btn.getAttribute('data-id');
    const action = btn.getAttribute('data-action');
  const list = readStore(STORE_KEYS.exchanges, []);
    const idx = list.findIndex(x => String(x.id) === String(id));
    if (idx === -1) return;
    const nextStatusMap = {
      aberta: 'avaliando',
      avaliando: 'aprovada',
      aprovada: 'concluida',
      concluida: 'concluida'
    };
    if (action === 'advance') {
      const cur = list[idx].status || 'aberta';
      list[idx].status = nextStatusMap[cur] || 'avaliando';
    } else if (action === 'cancel') {
      list[idx].status = 'cancelada';
    }
  writeStore(STORE_KEYS.exchanges, list);
  pageAdminTrocas();
  });
}
