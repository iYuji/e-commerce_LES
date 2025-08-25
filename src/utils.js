export const qs = sel => document.querySelector(sel);
export const qsa = sel => Array.from(document.querySelectorAll(sel));
export const fmtCurrency = v => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);
export const fmtDate = iso => new Date(iso).toLocaleString('pt-BR');

export function render(html) {
  const app = qs('#app');
  if (app) app.innerHTML = html;
}
