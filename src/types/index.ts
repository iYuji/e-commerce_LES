export interface Card {
  category: any;
  id: string;
  name: string;
  type: string;
  rarity: string;
  price: number;
  stock: number;
  image?: string;
  description?: string;
}

export interface CartItem {
  id: string;
  cardId: string;
  card: Card;
  quantity: number;
}

// Endereços salvos do usuário
export interface Address {
  id: string;
  customerId: string;
  firstName: string;
  lastName: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
  isDefault?: boolean;
  label?: string; // Ex: "Casa", "Trabalho", etc.
}

// Cartões de crédito salvos
export interface CreditCard {
  id: string;
  customerId: string;
  cardNumber: string; // Últimos 4 dígitos para exibição
  cardName: string;
  expiryDate: string;
  brand: "visa" | "mastercard" | "elo" | "amex";
  isDefault?: boolean;
  label?: string; // Ex: "Cartão Principal", "Cartão de Emergência"
}

// Informações de pagamento para um pedido específico
export interface PaymentInfo {
  method: "credit" | "debit" | "pix" | "boleto";
  creditCards?: CreditCardPayment[]; // Para suportar múltiplos cartões
  totalAmount: number;
}

// Pagamento com cartão específico (para múltiplos cartões)
export interface CreditCardPayment {
  cardId?: string; // Se for um cartão salvo
  cardNumber?: string; // Se for um novo cartão
  cardName?: string;
  expiryDate?: string;
  cvv?: string;
  brand?: string;
  amount: number; // Valor a ser cobrado neste cartão
}

// Cupons expandidos
export interface Coupon {
  id: string;
  code: string;
  discount: number;
  type: "percentage" | "fixed";
  expiresAt: string;
  isActive: boolean;
  category: "promotional" | "exchange"; // promocional (único) ou troca (múltiplos)
  minOrderValue?: number;
  maxDiscount?: number; // Para cupons percentuais
  customerId?: string; // Para cupons de troca específicos do cliente
}

// Cupons aplicados no pedido
export interface AppliedCoupon {
  couponId: string;
  code: string;
  discount: number;
  type: "percentage" | "fixed";
  category: "promotional" | "exchange";
}

export interface Order {
  id: string;
  customerId: string;
  items: CartItem[];
  subtotal: number;
  discountAmount: number;
  shippingCost: number;
  total: number;
  status: OrderStatus;
  shippingAddress: Address;
  paymentInfo: PaymentInfo;
  appliedCoupons: AppliedCoupon[];
  createdAt: string;
  estimatedDelivery?: string;
  notes?: string;
}

export type OrderStatus =
  | "pending"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled";

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  cpf?: string;
  createdAt: string;
}

export interface Exchange {
  id: string;
  userId: string;
  customerId: string;
  orderId: string;
  offeredCardId: string;
  requestedCardId: string;
  reason: string;
  notes?: string;
  status: "pending" | "approved" | "rejected" | "completed";
  createdAt: string;
}

export interface Session {
  userId: string | null;
  user?: Customer;
}

// Regras de negócio para validações
export interface BusinessRules {
  maxCardsPerCart: number;
  maxCouponsPerOrder: number;
  maxExchangeCouponsPerOrder: number;
  maxPromotionalCouponsPerOrder: number;
  maxCreditCardsPerOrder: number;
  minOrderValueForCoupons: number;
  stockReservationTimeMinutes: number;
}

// Validações de checkout
export interface CheckoutValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// Configurações de entrega
export interface ShippingOption {
  id: string;
  name: string;
  description: string;
  cost: number;
  estimatedDays: number;
}

// Histórico de transações de pagamento
export interface PaymentTransaction {
  id: string;
  orderId: string;
  cardId?: string;
  amount: number;
  method: "credit" | "debit" | "pix" | "boleto";
  status: "pending" | "approved" | "declined" | "refunded";
  transactionId?: string; // ID da operadora
  createdAt: string;
}

// Estoque e reservas
export interface StockReservation {
  id: string;
  cardId: string;
  quantity: number;
  customerId: string;
  expiresAt: string;
  orderId?: string;
  createdAt: string;
}
