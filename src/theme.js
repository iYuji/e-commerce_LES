import { THEME_KEY, SESSION_KEY, readStore, getCart } from './store.js';
import { qs } from './utils.js';

export function applyTheme(theme) {
  const t = theme === 'light' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', t);
  const btn = qs('#btn-toggle-theme');
  if (btn) {
    btn.textContent = t === 'light' ? '🌞' : '🌙';
    btn.title = t === 'light' ? 'Alternar para modo escuro' : 'Alternar para modo claro';
  }
}

export function initTheme() {
  const stored = localStorage.getItem(THEME_KEY);
  if (stored) return applyTheme(stored);
  const prefersLight = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
  applyTheme(prefersLight ? 'light' : 'dark');
}

export function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
  const next = current === 'light' ? 'dark' : 'light';
  localStorage.setItem(THEME_KEY, next);
  applyTheme(next);
}

export function updateAuthNav() {
  const s = readStore(SESSION_KEY, { userId: null });
  const logged = !!s.userId;
  const elLogin = qs('#nav-login');
  const elLogout = qs('#nav-logout');
  const elAccount = qs('#nav-account');
  const elOrders = qs('#nav-orders');
  if (elLogin) elLogin.style.display = logged ? 'none' : '';
  if (elLogout) elLogout.style.display = logged ? '' : 'none';
  if (elAccount) elAccount.style.display = logged ? '' : 'none';
  if (elOrders) elOrders.style.display = logged ? '' : 'none';
}

export function updateCartNav() {
  const el = qs('#nav-cart');
  if (!el) return;
  const count = getCart().reduce((n, i) => n + i.qty, 0);
  el.textContent = `Carrinho (${count})`;
}
