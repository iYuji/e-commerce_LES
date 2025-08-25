import { readStore, STORE_KEYS } from '../../store.js';
import { render } from '../../utils.js';

export function pageCupons() {
  const coupons = readStore(STORE_KEYS.coupons, []).filter(c => !!c.active);
  render(
    '<section class="view">'
    + '<h2>Cupons disponíveis</h2>'
    + '<div class="cards">'
    + (coupons.length ? coupons.map(c => '<div class="card"><strong>'+c.code+'</strong><span class="muted">'+c.percentage+'% de desconto</span></div>').join('') : '<span class="muted">Nenhum cupom no momento.</span>')
    + '</div>'
    + '</section>'
  );
}
