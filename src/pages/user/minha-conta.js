import { readStore, writeStore, STORE_KEYS } from '../../store.js';
import { render, qs } from '../../utils.js';

export function pageMinhaConta() {
  const u = readStore(STORE_KEYS.customers, [])[0];
  render(`
    <section class="view">
      <div class="view-header"><h2>Minha Conta</h2></div>
      <div class="grid">
        <form class="card" id="profile-form">
          <h3>Dados do cliente</h3>
          <div class="form-field"><label>Nome</label><input id="pf-name" value="${u.name||''}"></div>
          <div class="form-field"><label>E-mail</label><input id="pf-email" value="${u.email||''}"></div>
          <div class="form-field"><label>Senha</label><input id="pf-pass" type="password" placeholder="••••••"></div>
          <div class="form-actions"><button class="btn primary">Salvar</button></div>
        </form>
        <div class="card">
          <div class="section-header"><h3>Endereços</h3><button class="btn small" id="add-addr">Novo</button></div>
          <div id="addr-list"></div>
          <form id="addr-form" class="grid hidden">
            <input id="a-label" placeholder="Identificação" required>
            <input id="a-street" placeholder="Rua" required>
            <input id="a-number" placeholder="Número">
            <input id="a-city" placeholder="Cidade">
            <input id="a-state" placeholder="Estado">
            <div class="form-actions span-2"><button class="btn primary" type="submit">Salvar</button><button class="btn ghost" type="button" id="cancel-addr">Cancelar</button></div>
          </form>
        </div>
        <div class="card">
          <h3>Trocas</h3>
          <p class="muted">Solicite troca de itens de um pedido.</p>
          <button class="btn" id="go-exchange">Solicitar troca</button>
        </div>
      </div>
    </section>
  `);
  qs('#profile-form').addEventListener('submit', e => {
    e.preventDefault();
    const next = { ...u, name: qs('#pf-name').value.trim(), email: qs('#pf-email').value.trim() };
    const pass = qs('#pf-pass').value; if (pass) next.password = pass;
    writeStore(STORE_KEYS.customers, [next]); alert('Perfil salvo');
  });
  function refreshAddr() {
    const user = readStore(STORE_KEYS.customers, [])[0];
    const wrap = qs('#addr-list');
    wrap.innerHTML = (user.addresses||[]).map(a => `<div class="card"><strong>${a.label}</strong><span class="muted">${a.street}, ${a.number||'s/n'} - ${a.city||''}/${a.state||''}</span><div><button class="btn small" data-id="${a.id}" data-action="del">Excluir</button></div></div>`).join('') || '<span class="muted">Nenhum endereço</span>';
    wrap.querySelectorAll('button[data-action="del"]').forEach(b => b.addEventListener('click', e => {
      const id = e.currentTarget.getAttribute('data-id');
      const u2 = readStore(STORE_KEYS.customers, [])[0];
      u2.addresses = (u2.addresses||[]).filter(a => a.id !== id);
      writeStore(STORE_KEYS.customers, [u2]);
      refreshAddr();
    }));
  }
  qs('#add-addr').addEventListener('click', () => qs('#addr-form').classList.remove('hidden'));
  qs('#cancel-addr').addEventListener('click', () => qs('#addr-form').classList.add('hidden'));
  qs('#addr-form').addEventListener('submit', e => {
    e.preventDefault();
    const u3 = readStore(STORE_KEYS.customers, [])[0];
    const addr = { id: crypto.randomUUID(), label: qs('#a-label').value.trim(), street: qs('#a-street').value.trim(), number: qs('#a-number').value.trim(), city: qs('#a-city').value.trim(), state: qs('#a-state').value.trim() };
    (u3.addresses || (u3.addresses=[])).push(addr);
    writeStore(STORE_KEYS.customers, [u3]);
    qs('#addr-form').classList.add('hidden');
    qs('#addr-form').reset();
    refreshAddr();
  });
  refreshAddr();
  qs('#go-exchange').addEventListener('click', () => location.hash = '#/trocas');
}
