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
  userId: string;
  items: CartItem[];
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
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
  orderId: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  createdAt: string;
}

export interface Session {
  userId: string | null;
  user?: Customer;
}
