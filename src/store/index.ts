import {
  Card,
  CartItem,
  Order,
  Customer,
  Coupon,
  Exchange,
  Session,
  Address,
  CreditCard,
} from "../types";
import { StockService } from "../services/stockService";
import { CouponService } from "../services/couponService";

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
  addresses: "addresses",
  creditCards: "creditCards",
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

export function getAddresses(customerId: string): Address[] {
  const all: Address[] = readStore(STORE_KEYS.addresses, []);
  return all.filter((a) => a.customerId === customerId);
}

export function getCreditCards(customerId: string): CreditCard[] {
  const all: CreditCard[] = readStore(STORE_KEYS.creditCards, []);
  return all.filter((c) => c.customerId === customerId);
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

  // Dar baixa no estoque
  const stockResult = StockService.decreaseStock(order.items);
  if (!stockResult.success) {
    throw new Error(`Erro no estoque: ${stockResult.errors?.join(", ")}`);
  }

  orders.push(newOrder);
  writeStore(STORE_KEYS.orders, orders);

  // Marcar cupons como usados
  if (order.appliedCoupons) {
    order.appliedCoupons.forEach((appliedCoupon) => {
      CouponService.useCoupon(appliedCoupon.couponId);
    });
  }

  return newOrder.id;
}

// Obter pedido por ID
export function getOrderById(orderId: string): Order | null {
  const orders = getOrders();
  return orders.find((order) => order.id === orderId) || null;
}

// Atualizar status do pedido
export function updateOrderStatus(
  orderId: string,
  status: Order["status"]
): boolean {
  const orders = getOrders();
  const orderIndex = orders.findIndex((order) => order.id === orderId);

  if (orderIndex === -1) return false;

  orders[orderIndex].status = status;
  writeStore(STORE_KEYS.orders, orders);
  return true;
}

// Cancelar pedido (retornar estoque)
export function cancelOrder(orderId: string): boolean {
  const orders = getOrders();
  const orderIndex = orders.findIndex((order) => order.id === orderId);

  if (orderIndex === -1) return false;

  const order = orders[orderIndex];

  // Apenas cancelar se estiver em status apropriado
  if (order.status === "shipped" || order.status === "delivered") {
    return false;
  }

  // Devolver itens ao estoque
  StockService.increaseStock(order.items);

  // Atualizar status
  orders[orderIndex].status = "cancelled";
  writeStore(STORE_KEYS.orders, orders);

  return true;
}

// Obter pedidos por cliente
export function getOrdersByCustomer(customerId: string): Order[] {
  const orders = getOrders();
  return orders.filter((order) => order.customerId === customerId);
}

// Validar estoque antes de finalizar pedido
export function validateCartForCheckout(cartItems: CartItem[]): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const result = StockService.validateCartStock(cartItems);
  return {
    isValid: result.errors?.length === 0,
    errors: result.errors ?? [],
    warnings: result.warnings ?? [],
  };
}

// Theme functions
export function getTheme(): "light" | "dark" {
  try {
    return readStore(THEME_KEY, "light") as "light" | "dark";
  } catch {
    return "light";
  }
}

export function setTheme(theme: "light" | "dark"): void {
  try {
    writeStore(THEME_KEY, theme);
    window.dispatchEvent(new CustomEvent("theme:change"));
  } catch (error) {
    console.error("Error setting theme:", error);
  }
}

export function toggleTheme(): void {
  try {
    const currentTheme = getTheme();
    const newTheme = currentTheme === "light" ? "dark" : "light";
    setTheme(newTheme);
  } catch (error) {
    console.error("Error toggling theme:", error);
  }
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
        price: 45.99,
        stock: 25,
        description: "O adorável rato elétrico, mascote dos Pokémon",
        image: "https://images.pokemontcg.io/xy1/42_hires.png",
        category: undefined,
      },
      {
        id: "2",
        name: "Charizard-EX",
        type: "Fire",
        rarity: "Ultra Rare",
        price: 249.99,
        stock: 3,
        description: "O lendário dragão de fogo em sua forma EX",
        image:
          "https://img.mypcards.com/img/2/1865/pokemon_obf_125_197/pokemon_obf_125_197_pt.jpg",
        category: undefined,
      },
      {
        id: "3",
        name: "Blastoise",
        type: "Water",
        rarity: "Rare",
        price: 165.99,
        stock: 8,
        description: "A tartaruga gigante com canhões d'água poderosos",
        image: "https://images.pokemontcg.io/xy1/29_hires.png",
        category: undefined,
      },
      {
        id: "4",
        name: "Venusaur",
        type: "Grass",
        rarity: "Rare",
        price: 158.99,
        stock: 10,
        description: "O Pokémon planta com flor venenosa gigante",
        image: "https://images.pokemontcg.io/xy1/1_hires.png",
        category: undefined,
      },
      {
        id: "5",
        name: "Mewtwo-EX",
        type: "Psychic",
        rarity: "Ultra Rare",
        price: 299.99,
        stock: 2,
        description: "O Pokémon psíquico mais poderoso em forma EX",
        image: "https://images.pokemontcg.io/xy8/158_hires.png",
        category: undefined,
      },
      {
        id: "6",
        name: "M Rayquaza-EX",
        type: "Dragon",
        rarity: "Ultra Rare",
        price: 275.99,
        stock: 4,
        description: "Mega Rayquaza, o dragão dos céus em forma mega",
        image: "https://images.pokemontcg.io/xy6/75_hires.png",
        category: undefined,
      },
      {
        id: "7",
        name: "Gyarados",
        type: "Water",
        rarity: "Rare",
        price: 89.99,
        stock: 12,
        description: "A feroz serpente marinha com fúria devastadora",
        image:
          "https://repositorio.sbrauble.com/arquivos/in/pokemon_bkp/cd/411/47s_130.jpg",
        category: undefined,
      },
      {
        id: "8",
        name: "Gengar",
        type: "Ghost",
        rarity: "Rare",
        price: 95.99,
        stock: 11,
        description: "O Pokémon fantasma que se esconde nas sombras",
        image: "https://images.pokemontcg.io/xy4/35_hires.png",
        category: undefined,
      },
      {
        id: "9",
        name: "Lucario",
        type: "Fighting",
        rarity: "Rare",
        price: 78.99,
        stock: 15,
        description: "O mestre da aura com habilidades de combate superiores",
        image:
          "https://assets.pokemon.com/static-assets/content-assets/cms2-pt-br/img/cards/web/SM5/SM5_PT-BR_67.png",
        category: undefined,
      },
      {
        id: "10",
        name: "Umbreon",
        type: "Dark",
        rarity: "Rare",
        price: 92.99,
        stock: 13,
        description: "A evolução noturna de Eevee com anéis luminosos",
        image:
          "https://assets.pokemon.com/static-assets/content-assets/cms2-pt-br/img/cards/web/SV03/SV03_PT-BR_130.png",
        category: undefined,
      },
      {
        id: "11",
        name: "Snorlax",
        type: "Normal",
        rarity: "Uncommon",
        price: 52.99,
        stock: 20,
        description: "O gigante dorminhoco que bloqueia estradas",
        image:
          "https://assets.pokemon.com/static-assets/content-assets/cms2-pt-br/img/cards/web/SV3PT5/SV3PT5_PT-BR_143.png",
        category: undefined,
      },
      {
        id: "12",
        name: "Dragonite",
        type: "Dragon",
        rarity: "Ultra Rare",
        price: 145.99,
        stock: 7,
        description: "O gentil dragão",
        image: "https://images.pokemontcg.io/xy6/52_hires.png",
        category: undefined,
      },
      {
        id: "13",
        name: "Alakazam",
        type: "Psychic",
        rarity: "Rare",
        price: 82.99,
        stock: 14,
        description: "O gênio psíquico com QI extremamente alto",
        image: "https://images.pokemontcg.io/xy10/25_hires.png",
        category: undefined,
      },
      {
        id: "14",
        name: "Machamp",
        type: "Fighting",
        rarity: "Uncommon",
        price: 65.99,
        stock: 16,
        description: "O super lutador com quatro braços musculosos",
        image:
          "https://img.mypcards.com/img/2/1250/pokemon_swshp_swsh053/pokemon_swshp_swsh053_pt.jpg",
        category: undefined,
      },
      {
        id: "15",
        name: "Lapras-GX",
        type: "Water",
        rarity: "Ultra Rare",
        price: 88.99,
        stock: 12,
        description: "O gentil Pokémon aquático em sua forma GX",
        image: "https://images.pokemontcg.io/sm1/35_hires.png",
        category: undefined,
      },
      {
        id: "16",
        name: "Eevee V",
        type: "Normal",
        rarity: "Common",
        price: 38.99,
        stock: 30,
        description: "O Pokémon com DNA instável e múltiplas evoluções",
        image:
          "https://assets.pokemon.com/static-assets/content-assets/cms2-pt-br/img/cards/web/SWSHP/SWSHP_PT-BR_SWSH065.png",
        category: undefined,
      },
      {
        id: "17",
        name: "Zapdos",
        type: "Electric",
        rarity: "Rare",
        price: 125.99,
        stock: 6,
        description: "O pássaro lendário do trovão e da eletricidade",
        image:
          "https://cdn.awsli.com.br/800x800/792/792808/produto/189905268/zapdos-do-rev-rakvvhnui8.png",
        category: undefined,
      },
      {
        id: "18",
        name: "Articuno",
        type: "Water",
        rarity: "Rare",
        price: 122.99,
        stock: 6,
        description: "O pássaro lendário do gelo que congela o ar",
        image:
          "https://img.mypcards.com/img/2/2238/pokemon_jtg_032_159/pokemon_jtg_032_159_pt.jpg",
        category: undefined,
      },
      {
        id: "19",
        name: "Moltres",
        type: "Fire",
        rarity: "Rare",
        price: 124.99,
        stock: 6,
        description: "O pássaro lendário do fogo com chamas eternas",
        image:
          "https://assets.pokemon.com/static-assets/content-assets/cms2-pt-br/img/cards/web/SV3PT5/SV3PT5_PT-BR_146.png",
        category: undefined,
      },
      {
        id: "20",
        name: "Mew",
        type: "Psychic",
        rarity: "Ultra Rare",
        price: 285.99,
        stock: 3,
        description: "O Pokémon ancestral raro com DNA de todos os Pokémon",
        image:
          "https://assets.pokemon.com/static-assets/content-assets/cms2-pt-br/img/cards/web/SM10/SM10_PT-BR_76.png",
        category: undefined,
      },
    ];
    writeStore(STORE_KEYS.cards, sampleCards);
  }

  if (getCoupons().length === 0) {
    // Usar o serviço de cupons para criar cupons de exemplo
    CouponService.seedCoupons();
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
