import { readStore, STORE_KEYS } from '../../store.js';
import { render, qs, fmtCurrency } from '../../utils.js';

export function pageAssistente() {
  render(`
    <section class="view">
      <h2>Assistente IA</h2>
      <div class="card">
        <p class="muted">Olá! Sou seu assistente. Baseado nos seus pedidos, você pode gostar destas cartas:</p>
        <div id="ai-suggestions" class="cards"></div>
      </div>
    </section>
  `);
  const orders = readStore(STORE_KEYS.orders, []);
  const freq = new Map();
  orders.forEach(o => o.items.forEach(it => freq.set(it.id, (freq.get(it.id)||0)+it.qty)));
  const cards = readStore(STORE_KEYS.cards, []);
  const sorted = cards.slice().sort((a,b) => (freq.get(b.id)||0)-(freq.get(a.id)||0)).slice(0,4);
  const wrap = qs('#ai-suggestions');
  wrap.innerHTML = sorted.map(c => `<div class="card"><strong>${c.name}</strong><span class="muted">${c.set} • ${c.rarity}</span><span>${fmtCurrency(c.price)}</span><button class="btn small" onclick="location.hash='#/carta/${c.id}'">Ver</button></div>`).join('') || '<span class="muted">Sem recomendações ainda.</span>';
}
