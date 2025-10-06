import { Card, StockReservation, CartItem } from "../types";
import * as Store from "../store/index";

export class StockService {
  private static RESERVATION_KEY = "stock_reservations";

  // Obter todas as reservas de estoque
  static getStockReservations(): StockReservation[] {
    try {
      return Store.readStore<StockReservation[]>(this.RESERVATION_KEY, []);
    } catch {
      return [];
    }
  }

  // Obter reservas ativas (não expiradas)
  static getActiveReservations(): StockReservation[] {
    const now = new Date();
    return this.getStockReservations().filter(
      (reservation) => new Date(reservation.expiresAt) > now
    );
  }

  // Obter estoque disponível de um produto
  static getAvailableStock(cardId: string): number {
    const cards = Store.getCards();
    const card = cards.find((c) => c.id === cardId);

    if (!card) return 0;

    // Calcular quantidade reservada
    const activeReservations = this.getActiveReservations();
    const reservedQuantity = activeReservations
      .filter((r) => r.cardId === cardId)
      .reduce((total, reservation) => total + reservation.quantity, 0);

    return Math.max(0, card.stock - reservedQuantity);
  }

  // Verificar se uma quantidade está disponível
  static isQuantityAvailable(cardId: string, quantity: number): boolean {
    return this.getAvailableStock(cardId) >= quantity;
  }

  // Reservar estoque temporariamente
  static reserveStock(
    cartItems: CartItem[],
    customerId: string,
    durationMinutes: number = 30
  ): {
    success: boolean;
    reservations?: StockReservation[];
    errors?: string[];
  } {
    const errors: string[] = [];
    const reservations: StockReservation[] = [];

    // Verificar disponibilidade de todos os itens primeiro
    for (const item of cartItems) {
      if (!this.isQuantityAvailable(item.cardId, item.quantity)) {
        const available = this.getAvailableStock(item.cardId);
        errors.push(
          `${item.card.name}: apenas ${available} unidades disponíveis`
        );
      }
    }

    if (errors.length > 0) {
      return { success: false, errors };
    }

    // Criar reservas
    const existingReservations = this.getStockReservations();
    const expiresAt = new Date(
      Date.now() + durationMinutes * 60 * 1000
    ).toISOString();

    for (const item of cartItems) {
      const reservation: StockReservation = {
        id: `res_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        cardId: item.cardId,
        quantity: item.quantity,
        customerId,
        expiresAt,
        createdAt: new Date().toISOString(),
      };

      reservations.push(reservation);
      existingReservations.push(reservation);
    }

    Store.writeStore(this.RESERVATION_KEY, existingReservations);
    return { success: true, reservations };
  }

  // Confirmar reserva (converter para pedido)
  static confirmReservation(
    reservationIds: string[],
    orderId: string
  ): boolean {
    const reservations = this.getStockReservations();
    let updated = false;

    reservations.forEach((reservation) => {
      if (reservationIds.includes(reservation.id)) {
        reservation.orderId = orderId;
        updated = true;
      }
    });

    if (updated) {
      Store.writeStore(this.RESERVATION_KEY, reservations);
    }

    return updated;
  }

  // Cancelar reserva
  static cancelReservation(reservationIds: string[]): boolean {
    const reservations = this.getStockReservations();
    const filteredReservations = reservations.filter(
      (r) => !reservationIds.includes(r.id)
    );

    if (filteredReservations.length !== reservations.length) {
      Store.writeStore(this.RESERVATION_KEY, filteredReservations);
      return true;
    }

    return false;
  }

  // Dar baixa no estoque (definitiva)
  static decreaseStock(cartItems: CartItem[]): {
    success: boolean;
    updatedCards?: Card[];
    errors?: string[];
  } {
    const cards = Store.getCards();
    const errors: string[] = [];
    const updatedCards: Card[] = [];

    // Verificar disponibilidade primeiro
    for (const item of cartItems) {
      const card = cards.find((c) => c.id === item.cardId);
      if (!card) {
        errors.push(`Produto ${item.card.name} não encontrado`);
        continue;
      }

      if (card.stock < item.quantity) {
        errors.push(
          `${item.card.name}: estoque insuficiente (${card.stock} disponível)`
        );
      }
    }

    if (errors.length > 0) {
      return { success: false, errors };
    }

    // Decrementar estoque
    for (const item of cartItems) {
      const cardIndex = cards.findIndex((c) => c.id === item.cardId);
      if (cardIndex !== -1) {
        cards[cardIndex].stock -= item.quantity;
        updatedCards.push(cards[cardIndex]);
      }
    }

    // Salvar alterações
    Store.writeStore(Store.STORE_KEYS.cards, cards);
    window.dispatchEvent(new CustomEvent("stock:change"));

    return { success: true, updatedCards };
  }

  // Aumentar estoque (para cancelamentos/devoluções)
  static increaseStock(cartItems: CartItem[]): boolean {
    const cards = Store.getCards();
    let updated = false;

    for (const item of cartItems) {
      const cardIndex = cards.findIndex((c) => c.id === item.cardId);
      if (cardIndex !== -1) {
        cards[cardIndex].stock += item.quantity;
        updated = true;
      }
    }

    if (updated) {
      Store.writeStore(Store.STORE_KEYS.cards, cards);
      window.dispatchEvent(new CustomEvent("stock:change"));
    }

    return updated;
  }

  // Limpar reservas expiradas
  static cleanExpiredReservations(): number {
    const reservations = this.getStockReservations();
    const now = new Date();
    const activeReservations = reservations.filter(
      (r) => new Date(r.expiresAt) > now || r.orderId // Manter reservas confirmadas
    );

    const removedCount = reservations.length - activeReservations.length;

    if (removedCount > 0) {
      Store.writeStore(this.RESERVATION_KEY, activeReservations);
    }

    return removedCount;
  }

  // Obter produtos com baixo estoque
  static getLowStockProducts(threshold: number = 5): Card[] {
    const cards = Store.getCards();
    return cards.filter((card) => {
      const availableStock = this.getAvailableStock(card.id);
      return availableStock <= threshold && availableStock > 0;
    });
  }

  // Obter produtos sem estoque
  static getOutOfStockProducts(): Card[] {
    const cards = Store.getCards();
    return cards.filter((card) => {
      const availableStock = this.getAvailableStock(card.id);
      return availableStock <= 0;
    });
  }

  // Validar carrinho completo
  static validateCartStock(cartItems: CartItem[]): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    for (const item of cartItems) {
      const availableStock = this.getAvailableStock(item.cardId);

      if (availableStock <= 0) {
        errors.push(`${item.card.name}: produto sem estoque`);
      } else if (item.quantity > availableStock) {
        errors.push(
          `${item.card.name}: apenas ${availableStock} unidades disponíveis`
        );
      } else if (availableStock <= 3) {
        warnings.push(
          `${item.card.name}: poucas unidades restantes (${availableStock})`
        );
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  // Obter histórico de movimentação de estoque
  static getStockHistory(cardId?: string): {
    cardId: string;
    cardName: string;
    currentStock: number;
    availableStock: number;
    reservedStock: number;
  }[] {
    const cards = Store.getCards();
    const activeReservations = this.getActiveReservations();

    const targetCards = cardId ? cards.filter((c) => c.id === cardId) : cards;

    return targetCards.map((card) => {
      const reservedStock = activeReservations
        .filter((r) => r.cardId === card.id)
        .reduce((total, r) => total + r.quantity, 0);

      return {
        cardId: card.id,
        cardName: card.name,
        currentStock: card.stock,
        availableStock: this.getAvailableStock(card.id),
        reservedStock,
      };
    });
  }

  // Atualizar estoque de um produto
  static updateStock(cardId: string, newStock: number): boolean {
    const cards = Store.getCards();
    const cardIndex = cards.findIndex((c) => c.id === cardId);

    if (cardIndex === -1) return false;

    cards[cardIndex].stock = Math.max(0, newStock);
    Store.writeStore(Store.STORE_KEYS.cards, cards);
    window.dispatchEvent(new CustomEvent("stock:change"));

    return true;
  }
}
