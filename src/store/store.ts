import {
  Card,
  CartItem,
  Order,
  Customer,
  Coupon,
  Exchange,
  Session,
} from "../types";

// Local storage backed store with in-memory fallback
export const THEME_KEY = "theme";
export const SESSION_KEY = "session";
const __memStore: Record<string, any> = {};

export const STORE_KEYS = {
  cards: "cards",
  cart: "cart",
  orders: "orders",
  customers: "customers",
  coupons: "coupons",
  exchanges: "exchanges",
} as const;

export function readStore<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null || typeof raw === "undefined") return fallback;
    const v = JSON.parse(raw);
    return v === null || typeof v === "undefined" ? fallback : v;
  } catch {
    if (Object.prototype.hasOwnProperty.call(__memStore, key))
      return __memStore[key];
    return fallback;
  }
}

export function writeStore<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    __memStore[key] = value;
  }
}

export function deleteStore(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    delete __memStore[key];
  }
}

// Store helpers
export function getCards(): Card[] {
  return readStore(STORE_KEYS.cards, []);
}

export function getCart(): CartItem[] {
  return readStore(STORE_KEYS.cart, []);
}

export function getOrders(): Order[] {
  return readStore(STORE_KEYS.orders, []);
}

export function getCustomers(): Customer[] {
  return readStore(STORE_KEYS.customers, []);
}

export function getCoupons(): Coupon[] {
  return readStore(STORE_KEYS.coupons, []);
}

export function getExchanges(): Exchange[] {
  return readStore(STORE_KEYS.exchanges, []);
}

export function getSession(): Session {
  return readStore(SESSION_KEY, { userId: null });
}

export function setSession(session: Session): void {
  writeStore(SESSION_KEY, session);
  window.dispatchEvent(new CustomEvent("session:change"));
}

export function addToCart(card: Card, quantity: number = 1): void {
  const cart = getCart();
  const existingItem = cart.find((item) => item.cardId === card.id);

  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    const newItem: CartItem = {
      id: Date.now().toString(),
      cardId: card.id,
      card,
      quantity,
    };
    cart.push(newItem);
  }

  writeStore(STORE_KEYS.cart, cart);
  window.dispatchEvent(new CustomEvent("cart:change"));
}

export function removeFromCart(itemId: string): void {
  const cart = getCart().filter((item) => item.id !== itemId);
  writeStore(STORE_KEYS.cart, cart);
  window.dispatchEvent(new CustomEvent("cart:change"));
}

export function clearCart(): void {
  writeStore(STORE_KEYS.cart, []);
  window.dispatchEvent(new CustomEvent("cart:change"));
}

export function updateCartQuantity(itemId: string, quantity: number): void {
  const cart = getCart();
  const item = cart.find((item) => item.id === itemId);

  if (item) {
    if (quantity <= 0) {
      removeFromCart(itemId);
    } else {
      item.quantity = quantity;
      writeStore(STORE_KEYS.cart, cart);
      window.dispatchEvent(new CustomEvent("cart:change"));
    }
  }
}

export function addOrder(order: Omit<Order, "id">): string {
  const orders = getOrders();
  const newOrder: Order = {
    ...order,
    id: `ORD-${Date.now().toString().slice(-6)}`,
  };

  orders.push(newOrder);
  writeStore(STORE_KEYS.orders, orders);
  return newOrder.id;
}

// Seed data
export function ensureSeed(): void {
  if (getCards().length === 0) {
    const sampleCards: Card[] = [
      {
        id: "1",
        name: "Pikachu",
        type: "Electric",
        rarity: "Common",
        price: 10.99,
        stock: 50,
        description: "Mouse Pokémon elétrico muito popular",
        image: "https://images.pokemontcg.io/xy1/42_hires.png",
      },
      {
        id: "2",
        name: "Charizard",
        type: "Fire",
        rarity: "Rare",
        price: 99.99,
        stock: 5,
        description: "Pokémon dragão de fogo lendário",
        image: "https://images.pokemontcg.io/base1/4_hires.png",
      },
      {
        id: "3",
        name: "Blastoise",
        type: "Water",
        rarity: "Rare",
        price: 89.99,
        stock: 8,
        description: "Pokémon tartaruga de água poderoso",
        image: "https://images.pokemontcg.io/base1/2_hires.png",
      },
    ];
    writeStore(STORE_KEYS.cards, sampleCards);
  }

  if (getCoupons().length === 0) {
    const sampleCoupons: Coupon[] = [
      {
        id: "1",
        code: "WELCOME10",
        discount: 10,
        type: "percentage",
        expiresAt: "2025-12-31",
        isActive: true,
      },
    ];
    writeStore(STORE_KEYS.coupons, sampleCoupons);
  }

  if (getCustomers().length === 0) {
    const sampleCustomers: Customer[] = [
      {
        id: "1",
        name: "João Silva",
        email: "joao@example.com",
        phone: "(11) 99999-9999",
        address: "Rua das Flores, 123 - São Paulo, SP",
        cpf: "123.456.789-00",
        createdAt: "2025-01-01T10:00:00Z",
      },
    ];
    writeStore(STORE_KEYS.customers, sampleCustomers);
  }
}
