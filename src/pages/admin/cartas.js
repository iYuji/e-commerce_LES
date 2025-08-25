import { readStore, writeStore, STORE_KEYS } from '../../store.js';
import { render, qs, qsa, fmtCurrency } from '../../utils.js';

export function pageAdminCartas() {
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
