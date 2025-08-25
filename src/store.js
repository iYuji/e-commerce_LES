// Local storage backed store with in-memory fallback
export const THEME_KEY = 'theme';
export const SESSION_KEY = 'session';
const __memStore = {};

export const STORE_KEYS = {
  cards: 'cards',
  cart: 'cart',
  orders: 'orders',
  customers: 'customers',
  coupons: 'coupons',
  exchanges: 'exchanges',
};

export function readStore(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null || typeof raw === 'undefined') return fallback;
    const v = JSON.parse(raw);
    return (v === null || typeof v === 'undefined') ? fallback : v;
  } catch {
    if (Object.prototype.hasOwnProperty.call(__memStore, key)) return __memStore[key];
    return fallback;
  }
}

export function writeStore(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    __memStore[key] = value;
  }
}

// Session
export function getSession() { return readStore(SESSION_KEY, { userId: null }); }
export function setSession(s) { writeStore(SESSION_KEY, s); try { window.dispatchEvent(new CustomEvent('session:change', { detail: s })); } catch {} }

// Seed demo data on first load
export function ensureSeed() {
  if (!readStore(STORE_KEYS.cards)) {
    const demoCards = [
      { id: 'bulbasaur-1', name: 'Bulbasaur', rarity: 'Comum', set: 'Base', price: 9.9, stock: 25, active: true, image: '', description: 'Bulbasaur da coleção Base.' },
      { id: 'charmander-1', name: 'Charmander', rarity: 'Comum', set: 'Base', price: 12.5, stock: 18, active: true, image: '', description: 'Charmander da coleção Base.' },
      { id: 'squirtle-1', name: 'Squirtle', rarity: 'Comum', set: 'Base', price: 11.0, stock: 20, active: true, image: '', description: 'Squirtle da coleção Base.' },
      { id: 'pikachu-rare', name: 'Pikachu', rarity: 'Rara', set: 'Jungle', price: 49.9, stock: 8, active: true, image: '', description: 'Pikachu edição Jungle.' },
      { id: 'charizard-holo', name: 'Charizard', rarity: 'Ultra Rara', set: 'Base', price: 1499.9, stock: 1, active: true, image: '', description: 'Charizard holográfico clássico.' },
    ];
    writeStore(STORE_KEYS.cards, demoCards);
  }
  if (!readStore(STORE_KEYS.cart)) writeStore(STORE_KEYS.cart, []);
  if (!readStore(STORE_KEYS.orders)) writeStore(STORE_KEYS.orders, []);
  if (!readStore(STORE_KEYS.coupons)) writeStore(STORE_KEYS.coupons, [{ code: 'BEMVINDO10', percentage: 10, active: true }]);
  if (!readStore(STORE_KEYS.customers)) writeStore(STORE_KEYS.customers, [{
    id: 'me', name: 'Treinador', email: 'treinador@example', addresses: [], cards: [], password: '123', active: true
  }]);
  if (!readStore(STORE_KEYS.exchanges)) writeStore(STORE_KEYS.exchanges, []);
}

// Cart helpers
export function getCart() { return readStore(STORE_KEYS.cart, []); }
export function setCart(items) { writeStore(STORE_KEYS.cart, items); try { window.dispatchEvent(new CustomEvent('cart:change', { detail: items })); } catch {} }
export function addToCart(cardId, qty) {
  const items = getCart();
  const found = items.find(i => i.id === cardId);
  if (found) found.qty += qty; else items.push({ id: cardId, qty });
  setCart(items);
}
export function removeFromCart(cardId) { setCart(getCart().filter(i => i.id !== cardId)); }
export function updateQty(cardId, qty) { const items = getCart(); const f = items.find(i => i.id === cardId); if (f) { f.qty = Math.max(1, qty|0); setCart(items);} }
