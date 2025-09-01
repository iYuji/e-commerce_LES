import { Card, CartItem, Order, Customer, Coupon, Exchange, Session } from '../types';

// Local storage backed store with in-memory fallback
export const THEME_KEY = 'theme';
export const SESSION_KEY = 'session';
const __memStore: Record<string, any> = {};

export const STORE_KEYS = {
  cards: 'cards',
  cart: 'cart',
  orders: 'orders',
  customers: 'customers',
  coupons: 'coupons',
  exchanges: 'exchanges',
} as const;

export function readStore<T>(key: string, fallback: T): T {
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
  window.dispatchEvent(new CustomEvent('session:change'));
}

export function addToCart(card: Card, quantity: number = 1): void {
  const cart = getCart();
  const existingItem = cart.find(item => item.cardId === card.id);
  
  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    const newItem: CartItem = {
      id: Date.now().toString(),
      cardId: card.id,
      card,
      quantity
    };
    cart.push(newItem);
  }
  
  writeStore(STORE_KEYS.cart, cart);
  window.dispatchEvent(new CustomEvent('cart:change'));
}

export function removeFromCart(itemId: string): void {
  const cart = getCart().filter(item => item.id !== itemId);
  writeStore(STORE_KEYS.cart, cart);
  window.dispatchEvent(new CustomEvent('cart:change'));
}

export function clearCart(): void {
  writeStore(STORE_KEYS.cart, []);
  window.dispatchEvent(new CustomEvent('cart:change'));
}

export function updateCartQuantity(itemId: string, quantity: number): void {
  const cart = getCart();
  const item = cart.find(item => item.id === itemId);
  
  if (item) {
    if (quantity <= 0) {
      removeFromCart(itemId);
    } else {
      item.quantity = quantity;
      writeStore(STORE_KEYS.cart, cart);
      window.dispatchEvent(new CustomEvent('cart:change'));
    }
  }
}

export function addOrder(order: Omit<Order, 'id'>): string {
  const orders = getOrders();
  const newOrder: Order = {
    ...order,
    id: `ORD-${Date.now().toString().slice(-6)}`
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
        id: '1',
        name: 'Pikachu',
        type: 'Electric',
        rarity: 'Common',
        price: 10.99,
        stock: 50,
        description: 'Mouse Pokémon elétrico muito popular',
        image: 'https://images.pokemontcg.io/xy1/42_hires.png'
      },
      {
        id: '2',
        name: 'Charizard',
        type: 'Fire',
        rarity: 'Rare',
        price: 99.99,
        stock: 5,
        description: 'Pokémon dragão de fogo lendário',
        image: 'https://images.pokemontcg.io/base1/4_hires.png'
      },
      {
        id: '3',
        name: 'Blastoise',
        type: 'Water',
        rarity: 'Rare',
        price: 89.99,
        stock: 8,
        description: 'Pokémon tartaruga de água poderoso',
        image: 'https://images.pokemontcg.io/base1/2_hires.png'
      },
      {
        id: '4',
        name: 'Venusaur',
        type: 'Grass',
        rarity: 'Rare',
        price: 79.99,
        stock: 6,
        description: 'Pokémon planta poderoso',
        image: 'https://images.pokemontcg.io/base1/15_hires.png'
      },
      {
        id: '5',
        name: 'Alakazam',
        type: 'Psychic',
        rarity: 'Rare',
        price: 45.99,
        stock: 12,
        description: 'Pokémon psíquico com grande poder mental',
        image: 'https://images.pokemontcg.io/base1/1_hires.png'
      },
      {
        id: '6',
        name: 'Machamp',
        type: 'Fighting',
        rarity: 'Uncommon',
        price: 25.99,
        stock: 20,
        description: 'Pokémon lutador com quatro braços poderosos',
        image: 'https://images.pokemontcg.io/base1/8_hires.png'
      },
      {
        id: '7',
        name: 'Gengar',
        type: 'Ghost',
        rarity: 'Rare',
        price: 65.99,
        stock: 8,
        description: 'Pokémon fantasma sorrateiro',
        image: 'https://images.pokemontcg.io/fossil/5_hires.png'
      },
      {
        id: '8',
        name: 'Gyarados',
        type: 'Water',
        rarity: 'Rare',
        price: 55.99,
        stock: 10,
        description: 'Pokémon serpente marinha feroz',
        image: 'https://images.pokemontcg.io/base1/6_hires.png'
      },
      {
        id: '9',
        name: 'Dragonite',
        type: 'Dragon',
        rarity: 'Epic',
        price: 120.99,
        stock: 3,
        description: 'Pokémon dragão lendário e gentil',
        image: 'https://images.pokemontcg.io/fossil/4_hires.png'
      },
      {
        id: '10',
        name: 'Mewtwo',
        type: 'Psychic',
        rarity: 'Legendary',
        price: 199.99,
        stock: 2,
        description: 'Pokémon psíquico criado geneticamente',
        image: 'https://images.pokemontcg.io/base1/10_hires.png'
      },
      {
        id: '11',
        name: 'Mew',
        type: 'Psychic',
        rarity: 'Legendary',
        price: 299.99,
        stock: 1,
        description: 'Pokémon místico ancestral',
        image: 'https://images.pokemontcg.io/wizpromos/8_hires.png'
      },
      {
        id: '12',
        name: 'Raichu',
        type: 'Electric',
        rarity: 'Uncommon',
        price: 18.99,
        stock: 25,
        description: 'Evolução de Pikachu com poder elétrico ampliado',
        image: 'https://images.pokemontcg.io/base1/14_hires.png'
      },
      {
        id: '13',
        name: 'Snorlax',
        type: 'Normal',
        rarity: 'Uncommon',
        price: 22.99,
        stock: 18,
        description: 'Pokémon gigante que adora dormir',
        image: 'https://images.pokemontcg.io/jungle/11_hires.png'
      },
      {
        id: '14',
        name: 'Lapras',
        type: 'Water',
        rarity: 'Uncommon',
        price: 28.99,
        stock: 15,
        description: 'Pokémon gentil que transporta pessoas',
        image: 'https://images.pokemontcg.io/fossil/10_hires.png'
      },
      {
        id: '15',
        name: 'Eevee',
        type: 'Normal',
        rarity: 'Common',
        price: 8.99,
        stock: 40,
        description: 'Pokémon com múltiplas possibilidades de evolução',
        image: 'https://images.pokemontcg.io/jungle/51_hires.png'
      }
    ];
    writeStore(STORE_KEYS.cards, sampleCards);
  }

  if (getCoupons().length === 0) {
    const sampleCoupons: Coupon[] = [
      {
        id: '1',
        code: 'WELCOME10',
        discount: 10,
        type: 'percentage',
        expiresAt: '2025-12-31',
        isActive: true
      },
      {
        id: '2',
        code: 'SAVE5',
        discount: 5,
        type: 'fixed',
        expiresAt: '2025-12-31',
        isActive: true
      },
      {
        id: '3',
        code: 'LEGENDARY20',
        discount: 20,
        type: 'percentage',
        expiresAt: '2025-12-31',
        isActive: true
      }
    ];
    writeStore(STORE_KEYS.coupons, sampleCoupons);
  }

  if (getCustomers().length === 0) {
    const sampleCustomers: Customer[] = [
      {
        id: '1',
        name: 'João Silva',
        email: 'joao@example.com',
        phone: '(11) 99999-9999',
        address: 'Rua das Flores, 123 - São Paulo, SP',
        cpf: '123.456.789-00',
        createdAt: '2025-01-01T10:00:00Z'
      },
      {
        id: '2',
        name: 'Maria Santos',
        email: 'maria@example.com',
        phone: '(11) 88888-8888',
        address: 'Av. Paulista, 456 - São Paulo, SP',
        cpf: '987.654.321-00',
        createdAt: '2025-01-05T14:30:00Z'
      }
    ];
    writeStore(STORE_KEYS.customers, sampleCustomers);
  }

  // Inicializar pedidos de exemplo se não existirem
  if (getOrders().length === 0) {
    const sampleOrders: Order[] = [
      {
        id: 'ORD-001',
        customerId: 'current-user',
        items: [
          {
            id: 'item1',
            cardId: '1',
            card: getCards().find(c => c.id === '1') || getCards()[0],
            quantity: 2
          },
          {
            id: 'item2',
            cardId: '4',
            card: getCards().find(c => c.id === '4') || getCards()[3],
            quantity: 1
          }
        ],
        total: 185.97,
        status: 'delivered',
        shippingAddress: {
          firstName: 'João',
          lastName: 'Silva',
          address: 'Rua das Flores, 123',
          city: 'São Paulo',
          state: 'SP',
          zipCode: '01234-567',
          phone: '(11) 99999-9999'
        },
        paymentMethod: 'credit',
        createdAt: '2024-01-15T10:00:00Z',
        estimatedDelivery: '2024-01-20T18:00:00Z',
      },
      {
        id: 'ORD-002',
        customerId: 'current-user',
        items: [
          {
            id: 'item3',
            cardId: '2',
            card: getCards().find(c => c.id === '2') || getCards()[1],
            quantity: 1
          },
          {
            id: 'item4',
            cardId: '8',
            card: getCards().find(c => c.id === '8') || getCards()[7],
            quantity: 1
          }
        ],
        total: 183.98,
        status: 'shipped',
        shippingAddress: {
          firstName: 'João',
          lastName: 'Silva',
          address: 'Rua das Flores, 123',
          city: 'São Paulo',
          state: 'SP',
          zipCode: '01234-567',
          phone: '(11) 99999-9999'
        },
        paymentMethod: 'pix',
        createdAt: '2024-01-25T10:00:00Z',
        estimatedDelivery: '2024-01-30T18:00:00Z',
      },
      {
        id: 'ORD-003',
        customerId: 'current-user',
        items: [
          {
            id: 'item5',
            cardId: '6',
            card: getCards().find(c => c.id === '6') || getCards()[5],
            quantity: 1
          },
          {
            id: 'item6',
            cardId: '10',
            card: getCards().find(c => c.id === '10') || getCards()[9],
            quantity: 1
          }
        ],
        total: 323.47,
        status: 'processing',
        shippingAddress: {
          firstName: 'João',
          lastName: 'Silva',
          address: 'Rua das Flores, 123',
          city: 'São Paulo',
          state: 'SP',
          zipCode: '01234-567',
          phone: '(11) 99999-9999'
        },
        paymentMethod: 'debit',
        createdAt: '2024-02-01T10:00:00Z',
        estimatedDelivery: '2024-02-05T18:00:00Z',
      },
      {
        id: 'ORD-004',
        customerId: 'current-user',
        items: [
          {
            id: 'item7',
            cardId: '3',
            card: getCards().find(c => c.id === '3') || getCards()[2],
            quantity: 1
          }
        ],
        total: 73.49,
        status: 'pending',
        shippingAddress: {
          firstName: 'João',
          lastName: 'Silva',
          address: 'Rua das Flores, 123',
          city: 'São Paulo',
          state: 'SP',
          zipCode: '01234-567',
          phone: '(11) 99999-9999'
        },
        paymentMethod: 'boleto',
        createdAt: new Date().toISOString(),
        estimatedDelivery: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
      }
    ];
    writeStore(STORE_KEYS.orders, sampleOrders);
  }

  // Inicializar trocas de exemplo se não existirem
  if (getExchanges().length === 0) {
    const sampleExchanges: Exchange[] = [
      {
        id: 'EXC-001',
        userId: '1',
        customerId: '1',
        orderId: 'ORD-001',
        offeredCardId: '1',
        requestedCardId: '4',
        reason: 'Quero trocar por carta mais rara',
        notes: 'Carta em perfeito estado',
        status: 'pending',
        createdAt: '2025-01-20T10:00:00Z'
      },
      {
        id: 'EXC-002',
        userId: '2',
        customerId: '2',
        orderId: 'ORD-002',
        offeredCardId: '2',
        requestedCardId: '6',
        reason: 'Não gostei da carta recebida',
        notes: 'Prefiro cartas do tipo Ghost',
        status: 'approved',
        createdAt: '2025-01-22T14:30:00Z'
      },
      {
        id: 'EXC-003',
        userId: '1',
        customerId: '1',
        orderId: 'ORD-003',
        offeredCardId: '3',
        requestedCardId: '10',
        reason: 'Carta com defeito',
        notes: 'Carta chegou com riscos',
        status: 'completed',
        createdAt: '2025-01-25T09:15:00Z'
      }
    ];
    writeStore(STORE_KEYS.exchanges, sampleExchanges);
  }
}
