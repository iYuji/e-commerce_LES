export interface Card {
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

export interface Order {
  id: string;
  customerId: string;
  items: CartItem[];
  total: number;
  status: OrderStatus;
  shippingAddress: {
    firstName: string;
    lastName: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    phone: string;
  };
  paymentMethod: 'credit' | 'debit' | 'pix' | 'boleto';
  createdAt: string;
  estimatedDelivery?: string;
}

export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  cpf?: string;
  createdAt: string;
}

export interface Coupon {
  id: string;
  code: string;
  discount: number;
  type: 'percentage' | 'fixed';
  expiresAt: string;
  isActive: boolean;
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
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  createdAt: string;
}

export interface Session {
  userId: string | null;
  user?: Customer;
}
