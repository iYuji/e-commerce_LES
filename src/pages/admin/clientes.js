import { readStore, STORE_KEYS } from '../../store.js';
import { render } from '../../utils.js';

export function pageAdminClientes() {
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
