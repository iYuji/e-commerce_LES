import { readStore, writeStore, setSession, STORE_KEYS } from '../store.js';
import { render, qs } from '../utils.js';

export function pageAuth() {
  render(`
    <section class="view">
      <div class="grid">
        <form class="card" id="login-form">
          <h3>Entrar</h3>
          <input id="lg-email" type="email" placeholder="E-mail" required>
          <input id="lg-pass" type="password" placeholder="Senha" required>
          <div class="form-actions"><button class="btn primary">Entrar</button></div>
        </form>
        <form class="card" id="signup-form">
          <h3>Criar conta</h3>
          <input id="su-name" placeholder="Nome" required>
          <input id="su-email" type="email" placeholder="E-mail" required>
          <input id="su-pass" type="password" placeholder="Senha" required>
          <div class="form-actions"><button class="btn">Cadastrar</button></div>
        </form>
      </div>
    </section>
  `);
  const loginForm = qs('#login-form');
  if (loginForm) loginForm.addEventListener('submit', e => {
    e.preventDefault();
    const email = qs('#lg-email').value.trim().toLowerCase();
    const pass = qs('#lg-pass').value;
    const users = readStore(STORE_KEYS.customers, []);
    const u = users.find(x => (x.email||'').toLowerCase() === email && x.password === pass && x.active !== false);
    if (!u) { alert('Credenciais inválidas'); return; }
    setSession({ userId: u.id });
    location.hash = '#/catalogo';
  });
  const signupForm = qs('#signup-form');
  if (signupForm) signupForm.addEventListener('submit', e => {
    e.preventDefault();
    const name = qs('#su-name').value.trim();
    const email = qs('#su-email').value.trim();
    const pass = qs('#su-pass').value;
    const users = readStore(STORE_KEYS.customers, []);
    if (users.some(x => (x.email||'').toLowerCase() === email.toLowerCase())) { alert('E-mail já cadastrado'); return; }
    const nu = { id: (crypto && crypto.randomUUID ? crypto.randomUUID() : String(Date.now())), name, email, password: pass, addresses: [], cards: [], active: true };
    users.push(nu); writeStore(STORE_KEYS.customers, users);
    setSession({ userId: nu.id });
    location.hash = '#/catalogo';
  });
}
