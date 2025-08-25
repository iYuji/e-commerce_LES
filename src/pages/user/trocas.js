import { readStore, writeStore, STORE_KEYS } from '../../store.js';
import { render, qs } from '../../utils.js';

export function pageTrocas(ctx = { query: {} }) {
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
