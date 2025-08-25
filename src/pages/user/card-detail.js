import { readStore, STORE_KEYS, addToCart } from '../../store.js';
import { render, qs, fmtCurrency } from '../../utils.js';

export function pageCardDetail(id) {
  const card = readStore(STORE_KEYS.cards, []).find(c => c.id === id);
  if (!card) { render('<section class="view"><h2>Página não encontrada</h2></section>'); return; }
  render(`
    <section class="view">
      <div class="view-header">
        <button class="btn ghost" onclick="location.hash='#/catalogo'">← Voltar</button>
        <h2>${card.name}</h2>
        <div class="spacer"></div>
        <span>${fmtCurrency(card.price)}</span>
      </div>
      <div class="cards">
        <div class="card">
          <strong>${card.name}</strong>
          <span class="muted">${card.set} • ${card.rarity}</span>
          <span>Estoque: ${card.stock}</span>
          <p class="muted">${card.description || ''}</p>
          <div>
            <label class="muted">Quantidade</label>
            <input id="qty" type="number" min="1" value="1" style="width:120px">
          </div>
          <div>
            <button class="btn primary" id="btn-add">Adicionar ao Carrinho</button>
          </div>
        </div>
      </div>
    </section>
  `);
  qs('#btn-add').addEventListener('click', () => { const q = Math.max(1, parseInt(qs('#qty').value||'1',10)); addToCart(card.id, q); location.hash = '#/carrinho'; });
}
