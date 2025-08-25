import { readStore, STORE_KEYS, addToCart } from '../../store.js';
import { render, qs, qsa, fmtCurrency } from '../../utils.js';
import { navigate } from '../../router.js';

export function pageCatalogo() {
  const all = readStore(STORE_KEYS.cards, []).filter(c => c.active);
  render(`
    <section class="view">
      <div class="toolbar">
        <div class="grid">
          <div class="form-field"><label>Nome</label><input id="f-name" placeholder="Ex.: Pikachu"></div>
          <div class="form-field"><label>Raridade</label>
            <select id="f-rarity"><option value="">Todas</option><option>Comum</option><option>Rara</option><option>Ultra Rara</option></select>
          </div>
          <div class="form-field"><label>Expansão</label><input id="f-set" placeholder="Ex.: Base"></div>
          <div class="form-field"><label>Preço até</label><input id="f-price" type="number" min="0" step="0.01"></div>
        </div>
        <div class="form-actions"><button class="btn" id="btn-do-filter">Filtrar</button><button class="btn ghost" id="btn-clear-filter">Limpar</button></div>
      </div>
      <div class="cards" id="catalog-cards"></div>
    </section>
  `);
  function renderCards(list) {
    const wrap = qs('#catalog-cards');
    wrap.innerHTML = '';
    list.forEach(c => {
      const div = document.createElement('div');
      div.className = 'card';
      div.innerHTML = `
        <strong>${c.name}</strong>
        <span class="muted">${c.set} • ${c.rarity}</span>
        <span>${fmtCurrency(c.price)}</span>
        <div>
          <button class="btn small" data-action="view" data-id="${c.id}">Detalhes</button>
          <button class="btn small" data-action="add" data-id="${c.id}">Adicionar ao Carrinho</button>
        </div>
      `;
      wrap.appendChild(div);
    });
    wrap.querySelectorAll('button').forEach(b => b.addEventListener('click', e => {
      const id = e.currentTarget.getAttribute('data-id');
      const action = e.currentTarget.getAttribute('data-action');
      if (action === 'view') navigate(`#/carta/${id}`);
      if (action === 'add') { addToCart(id, 1); alert('Adicionado ao carrinho'); }
    }));
  }
  function doFilter() {
    const name = (qs('#f-name').value || '').toLowerCase().trim();
    const rarity = (qs('#f-rarity').value || '').trim();
    const set = (qs('#f-set').value || '').toLowerCase().trim();
    const price = parseFloat(qs('#f-price').value || '0');
    const list = all.filter(c => {
      if (name && !c.name.toLowerCase().includes(name)) return false;
      if (rarity && c.rarity !== rarity) return false;
      if (set && !c.set.toLowerCase().includes(set)) return false;
      if (price && c.price > price) return false;
      return true;
    });
    renderCards(list);
  }
  qs('#btn-do-filter').addEventListener('click', doFilter);
  qs('#btn-clear-filter').addEventListener('click', () => { qsa('.toolbar input').forEach(i => i.value = ''); qs('#f-rarity').value=''; renderCards(all); });
  renderCards(all);
}
