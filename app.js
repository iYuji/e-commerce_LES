// Utilidades de armazenamento
const STORAGE_KEY = 'clients';
const THEME_KEY = 'theme';

function loadClients() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function saveClients(clients) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(clients));
}

function findClientById(id) {
  return loadClients().find(c => c.id === id) || null;
}

function upsertClient(client) {
  const clients = loadClients();
  const existingIdx = clients.findIndex(c => c.id === client.id);
  if (existingIdx >= 0) clients[existingIdx] = client; else clients.push(client);
  saveClients(clients);
  return client;
}

function updateClientPartial(id, patch) {
  const clients = loadClients();
  const idx = clients.findIndex(c => c.id === id);
  if (idx < 0) return null;
  clients[idx] = { ...clients[idx], ...patch };
  saveClients(clients);
  return clients[idx];
}

// Views helpers
const qs = sel => document.querySelector(sel);
const qsa = sel => Array.from(document.querySelectorAll(sel));
const fmtCurrency = v => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
const fmtDate = iso => new Date(iso).toLocaleString('pt-BR');

function showView(id) {
  qsa('.view').forEach(v => v.classList.add('hidden'));
  qs('#' + id).classList.remove('hidden');
}

// Theme handling
function applyTheme(theme) {
  const t = theme === 'light' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', t === 'light' ? 'light' : 'dark');
  const btn = qs('#btn-toggle-theme');
  if (btn) {
    btn.textContent = t === 'light' ? '🌞' : '🌙';
    btn.title = t === 'light' ? 'Alternar para modo escuro' : 'Alternar para modo claro';
  }
}

function initTheme() {
  const stored = localStorage.getItem(THEME_KEY);
  if (stored) {
    applyTheme(stored);
    return;
  }
  // Preferência do sistema
  const prefersLight = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
  applyTheme(prefersLight ? 'light' : 'dark');
}

// Render list
function applyFilters() {
  const name = qs('#filter-name').value.trim().toLowerCase();
  const email = qs('#filter-email').value.trim().toLowerCase();
  const cpf = qs('#filter-cpf').value.trim();
  const phone = qs('#filter-phone').value.trim();
  const status = qs('#filter-status').value;
  const clients = loadClients();
  return clients.filter(c => {
    if (name && !c.name.toLowerCase().includes(name)) return false;
    if (email && !c.email.toLowerCase().includes(email)) return false;
    if (cpf && !c.cpf.includes(cpf)) return false;
    if (phone && !c.phone.includes(phone)) return false;
    if (status !== 'all') {
      const shouldBeActive = status === 'active';
      if (!!c.active !== shouldBeActive) return false;
    }
    return true;
  });
}

function renderList() {
  const tbody = qs('#clients-tbody');
  tbody.innerHTML = '';
  const rows = applyFilters();
  rows.forEach(c => {
    const tr = document.createElement('tr');
    const statusChip = `<span class="chip ${c.active ? 'success' : 'danger'}">${c.active ? 'Ativo' : 'Inativo'}</span>`;
    tr.innerHTML = `
      <td>${statusChip}</td>
      <td>${c.name}</td>
      <td>${c.email}</td>
      <td>${c.cpf}</td>
      <td>${c.phone}</td>
      <td class="right">
        <button class="btn small" data-action="view" data-id="${c.id}">Abrir</button>
        <button class="btn small" data-action="edit" data-id="${c.id}">Editar</button>
        <button class="btn small" data-action="toggle" data-id="${c.id}">${c.active ? 'Inativar' : 'Reativar'}</button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  tbody.querySelectorAll('button').forEach(btn => btn.addEventListener('click', e => {
    const id = e.currentTarget.getAttribute('data-id');
    const action = e.currentTarget.getAttribute('data-action');
    if (action === 'view') openDetail(id);
    if (action === 'edit') openForm(id);
    if (action === 'toggle') toggleActive(id);
  }));
}

// Create/Edit form
function resetForm() {
  qs('#client-id').value = '';
  qs('#client-name').value = '';
  qs('#client-email').value = '';
  qs('#client-cpf').value = '';
  qs('#client-phone').value = '';
  qs('#client-password').value = '';
  qs('#client-password-confirm').value = '';
  qs('#client-active').checked = true;
  qs('#password-hint').textContent = '';
}

function openForm(id) {
  resetForm();
  const isEdit = !!id;
  qs('#form-title').textContent = isEdit ? 'Editar Cliente' : 'Novo Cliente';
  if (isEdit) {
    const c = findClientById(id);
    if (!c) return;
    qs('#client-id').value = c.id;
    qs('#client-name').value = c.name || '';
    qs('#client-email').value = c.email || '';
    qs('#client-cpf').value = c.cpf || '';
    qs('#client-phone').value = c.phone || '';
    qs('#client-active').checked = !!c.active;
    qs('#password-hint').textContent = 'Deixe a senha em branco para manter a atual.';
  }
  showView('view-form');
}

function handleFormSubmit(ev) {
  ev.preventDefault();
  const id = qs('#client-id').value || crypto.randomUUID();
  const payload = {
    id,
    name: qs('#client-name').value.trim(),
    email: qs('#client-email').value.trim(),
    cpf: qs('#client-cpf').value.trim(),
    phone: qs('#client-phone').value.trim(),
    active: qs('#client-active').checked,
  };

  const pass = qs('#client-password').value;
  const pass2 = qs('#client-password-confirm').value;
  const isEdit = !!qs('#client-id').value;
  if (!isEdit || pass || pass2) {
    if (pass !== pass2) {
      alert('As senhas não coincidem.');
      return;
    }
    if (!pass) {
      alert('Informe a senha.');
      return;
    }
    payload.password = pass;
  } else {
    // manter senha atual
    const existing = findClientById(id);
    payload.password = existing ? existing.password : '';
  }

  const existing = findClientById(id);
  if (!existing) {
    payload.addresses = [];
    payload.creditCards = [];
    payload.transactions = [];
  } else {
    payload.addresses = existing.addresses || [];
    payload.creditCards = existing.creditCards || [];
    payload.transactions = existing.transactions || [];
  }
  upsertClient(payload);
  renderList();
  showView('view-list');
}

function toggleActive(id) {
  const c = findClientById(id);
  if (!c) return;
  updateClientPartial(id, { active: !c.active });
  renderList();
}

// Detail view
let currentClientId = null;

function openDetail(id) {
  const c = findClientById(id);
  if (!c) return;
  currentClientId = id;
  qs('#detail-title').textContent = `${c.name} ${c.active ? '' : '(inativo)'} `;
  qs('#btn-toggle-active').textContent = c.active ? 'Inativar' : 'Reativar';

  const kv = qs('#detail-key-values');
  kv.innerHTML = '';
  const rows = [
    ['E-mail', c.email],
    ['CPF', c.cpf],
    ['Telefone', c.phone],
    ['Status', c.active ? 'Ativo' : 'Inativo']
  ];
  rows.forEach(([k, v]) => {
    const div = document.createElement('div');
    div.className = 'row';
    div.innerHTML = `<div class="key">${k}</div><div class="value">${v}</div>`;
    kv.appendChild(div);
  });

  renderAddresses(c);
  renderCards(c);
  renderTransactions(c);
  showView('view-detail');
}

// Addresses
function renderAddresses(client) {
  const wrap = qs('#addresses-list');
  wrap.innerHTML = '';
  (client.addresses || []).forEach(addr => {
    const div = document.createElement('div');
    div.className = 'card';
    const line1 = `${addr.recipient} • ${addr.label}`;
    const line2 = `${addr.street}, ${addr.number || 's/n'} - ${addr.neighborhood || ''}`;
    const line3 = `${addr.city || ''} - ${addr.state || ''} · CEP ${addr.zip || ''}`;
    div.innerHTML = `
      <strong>${line1}</strong>
      <span class="muted">${line2}</span>
      <span class="muted">${line3}</span>
      <div>
        <button class="btn small" data-action="edit-address" data-id="${addr.id}">Editar</button>
        <button class="btn small" data-action="delete-address" data-id="${addr.id}">Excluir</button>
      </div>
    `;
    wrap.appendChild(div);
  });

  wrap.querySelectorAll('button').forEach(b => b.addEventListener('click', e => {
    const id = e.currentTarget.getAttribute('data-id');
    const action = e.currentTarget.getAttribute('data-action');
    if (action === 'edit-address') openAddressForm(id);
    if (action === 'delete-address') deleteAddress(id);
  }));
}

function openAddressForm(addressId) {
  const client = findClientById(currentClientId);
  const addr = (client.addresses || []).find(a => a.id === addressId);
  qs('#address-id').value = addr ? addr.id : '';
  qs('#address-label').value = addr ? addr.label : '';
  qs('#address-recipient').value = addr ? addr.recipient : '';
  qs('#address-zip').value = addr ? addr.zip || '' : '';
  qs('#address-street').value = addr ? addr.street || '' : '';
  qs('#address-number').value = addr ? addr.number || '' : '';
  qs('#address-complement').value = addr ? addr.complement || '' : '';
  qs('#address-neighborhood').value = addr ? addr.neighborhood || '' : '';
  qs('#address-city').value = addr ? addr.city || '' : '';
  qs('#address-state').value = addr ? addr.state || '' : '';
  qs('#address-form').classList.remove('hidden');
}

function deleteAddress(addressId) {
  const client = findClientById(currentClientId);
  client.addresses = (client.addresses || []).filter(a => a.id !== addressId);
  upsertClient(client);
  renderAddresses(client);
}

qs('#address-form').addEventListener('submit', e => {
  e.preventDefault();
  const client = findClientById(currentClientId);
  const id = qs('#address-id').value || crypto.randomUUID();
  const addr = {
    id,
    label: qs('#address-label').value.trim(),
    recipient: qs('#address-recipient').value.trim(),
    zip: qs('#address-zip').value.trim(),
    street: qs('#address-street').value.trim(),
    number: qs('#address-number').value.trim(),
    complement: qs('#address-complement').value.trim(),
    neighborhood: qs('#address-neighborhood').value.trim(),
    city: qs('#address-city').value.trim(),
    state: qs('#address-state').value.trim(),
  };
  const idx = (client.addresses || []).findIndex(a => a.id === id);
  if (idx >= 0) client.addresses[idx] = addr; else (client.addresses || (client.addresses = [])).push(addr);
  upsertClient(client);
  qs('#address-form').classList.add('hidden');
  qs('#address-form').reset();
  renderAddresses(client);
});

qs('#btn-cancel-address').addEventListener('click', () => {
  qs('#address-form').classList.add('hidden');
  qs('#address-form').reset();
});

qs('#btn-add-address').addEventListener('click', () => {
  qs('#address-id').value = '';
  qs('#address-form').classList.remove('hidden');
});

// Cards
function renderCards(client) {
  const wrap = qs('#cards-list');
  wrap.innerHTML = '';
  (client.creditCards || []).forEach(card => {
    const div = document.createElement('div');
    div.className = 'card';
    const masked = card.number.replace(/\d(?=\d{4})/g, '•');
    div.innerHTML = `
      <div style="display:flex; align-items:center; gap:8px;">
        <strong>${card.label}</strong>
        ${card.preferred ? '<span class="chip success">Preferencial</span>' : ''}
      </div>
      <span class="muted">${card.holder}</span>
      <span class="muted">${masked} · ${card.expiry}</span>
      <div>
        <button class="btn small" data-action="make-preferred" data-id="${card.id}">Preferir</button>
        <button class="btn small" data-action="edit-card" data-id="${card.id}">Editar</button>
        <button class="btn small" data-action="delete-card" data-id="${card.id}">Excluir</button>
      </div>
    `;
    wrap.appendChild(div);
  });

  wrap.querySelectorAll('button').forEach(b => b.addEventListener('click', e => {
    const id = e.currentTarget.getAttribute('data-id');
    const action = e.currentTarget.getAttribute('data-action');
    if (action === 'edit-card') openCardForm(id);
    if (action === 'delete-card') deleteCard(id);
    if (action === 'make-preferred') makeCardPreferred(id);
  }));
}

function openCardForm(cardId) {
  const client = findClientById(currentClientId);
  const card = (client.creditCards || []).find(a => a.id === cardId);
  qs('#card-id').value = card ? card.id : '';
  qs('#card-label').value = card ? card.label : '';
  qs('#card-holder').value = card ? card.holder : '';
  qs('#card-number').value = card ? card.number : '';
  qs('#card-expiry').value = card ? card.expiry : '';
  qs('#card-preferred').checked = !!(card && card.preferred);
  qs('#card-form').classList.remove('hidden');
}

function deleteCard(cardId) {
  const client = findClientById(currentClientId);
  client.creditCards = (client.creditCards || []).filter(a => a.id !== cardId);
  // Garantir que exista ao menos um preferencial se houver cartões
  if ((client.creditCards || []).length > 0 && !client.creditCards.some(c => c.preferred)) {
    client.creditCards[0].preferred = true;
  }
  upsertClient(client);
  renderCards(client);
}

function makeCardPreferred(cardId) {
  const client = findClientById(currentClientId);
  (client.creditCards || []).forEach(c => c.preferred = c.id === cardId);
  upsertClient(client);
  renderCards(client);
}

qs('#card-form').addEventListener('submit', e => {
  e.preventDefault();
  const client = findClientById(currentClientId);
  const id = qs('#card-id').value || crypto.randomUUID();
  const card = {
    id,
    label: qs('#card-label').value.trim(),
    holder: qs('#card-holder').value.trim(),
    number: qs('#card-number').value.trim(),
    expiry: qs('#card-expiry').value.trim(),
    preferred: qs('#card-preferred').checked,
  };
  const idx = (client.creditCards || []).findIndex(a => a.id === id);
  if (card.preferred) {
    (client.creditCards || []).forEach(c => c.preferred = false);
  }
  if (idx >= 0) client.creditCards[idx] = card; else (client.creditCards || (client.creditCards = [])).push(card);
  // Se nenhum preferido marcado, define o primeiro
  if (!(client.creditCards || []).some(c => c.preferred)) client.creditCards[0].preferred = true;
  upsertClient(client);
  qs('#card-form').classList.add('hidden');
  qs('#card-form').reset();
  renderCards(client);
});

qs('#btn-cancel-card').addEventListener('click', () => {
  qs('#card-form').classList.add('hidden');
  qs('#card-form').reset();
});

qs('#btn-add-card').addEventListener('click', () => {
  qs('#card-id').value = '';
  qs('#card-form').classList.remove('hidden');
});

// Transactions
function renderTransactions(client) {
  const tbody = qs('#transactions-tbody');
  tbody.innerHTML = '';
  (client.transactions || []).forEach(t => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${fmtDate(t.date)}</td>
      <td>${t.description}</td>
      <td>${fmtCurrency(t.amount)}</td>
      <td>${t.status}</td>
    `;
    tbody.appendChild(tr);
  });
}

qs('#btn-add-transaction').addEventListener('click', () => {
  const client = findClientById(currentClientId);
  const fake = {
    id: crypto.randomUUID(),
    date: new Date().toISOString(),
    description: 'Transação de teste',
    amount: Number((Math.random() * 500 + 50).toFixed(2)),
    status: 'Pago'
  };
  (client.transactions || (client.transactions = [])).push(fake);
  upsertClient(client);
  renderTransactions(client);
});

// Password only change
const passwordDialog = qs('#password-dialog');
qs('#btn-change-password').addEventListener('click', () => {
  if (typeof passwordDialog.showModal === 'function') passwordDialog.showModal();
});

qs('#password-form').addEventListener('close', () => {
  // noop
});

qs('#password-form').addEventListener('submit', e => {
  e.preventDefault();
});

qs('#btn-confirm-password').addEventListener('click', (e) => {
  e.preventDefault();
  const pass = qs('#new-password').value;
  const pass2 = qs('#new-password-confirm').value;
  if (pass !== pass2) { alert('As senhas não coincidem.'); return; }
  updateClientPartial(currentClientId, { password: pass });
  qs('#new-password').value = '';
  qs('#new-password-confirm').value = '';
  passwordDialog.close();
});

// Header buttons on detail
qs('#btn-edit-client').addEventListener('click', () => openForm(currentClientId));
qs('#btn-toggle-active').addEventListener('click', () => { toggleActive(currentClientId); openDetail(currentClientId); });

// List view buttons
qs('#btn-new-client').addEventListener('click', () => openForm());
qs('#btn-apply-filters').addEventListener('click', renderList);
qs('#btn-clear-filters').addEventListener('click', () => { qsa('#filter-form input').forEach(i => i.value = ''); qs('#filter-status').value = 'all'; renderList(); });

// Form buttons
qs('#client-form').addEventListener('submit', handleFormSubmit);
qs('#btn-cancel-client').addEventListener('click', () => { showView('view-list'); });
qs('#btn-back-to-list').addEventListener('click', () => { showView('view-list'); });
qs('#btn-back-to-list-from-detail').addEventListener('click', () => { showView('view-list'); renderList(); });

// Inicializar
initTheme();
renderList();

// Theme toggle button
qs('#btn-toggle-theme').addEventListener('click', () => {
  const current = document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
  const next = current === 'light' ? 'dark' : 'light';
  localStorage.setItem(THEME_KEY, next);
  applyTheme(next);
});


