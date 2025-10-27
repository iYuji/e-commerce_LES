import { CartItem, Card } from "../types";
import * as Store from "../store/index";

const CARDS_KEY = "cards";

export interface StockValidationResult {
  success: boolean;
  errors?: string[];
  warnings?: string[];
}

export class StockService {
  /**
   * Obter todas as cartas
   */
  static getCards(): Card[] {
    try {
      return Store.readStore(CARDS_KEY, []) as Card[];
    } catch {
      return [];
    }
  }

  /**
   * Atualizar carta
   */
  static updateCard(card: Card): void {
    const cards = this.getCards();
    const index = cards.findIndex((c) => c.id === card.id);
    if (index !== -1) {
      cards[index] = card;
      Store.writeStore(CARDS_KEY, cards);
    }
  }

  /**
   * Diminuir estoque ao criar pedido
   */
  static decreaseStock(cartItems: CartItem[]): StockValidationResult {
    const cards = this.getCards();
    const errors: string[] = [];

    console.log("🔍 Iniciando baixa de estoque...");
    console.log("📦 Items no carrinho:", cartItems);

    // Validar se há estoque suficiente
    for (const item of cartItems) {
      // ✅ CORREÇÃO: usar item.card.id ao invés de item.cardId
      const card = cards.find((c) => c.id === item.card.id);

      if (!card) {
        console.error(`❌ Carta ${item.card.name} não encontrada no estoque`);
        errors.push(`Carta ${item.card.name} não encontrada`);
        continue;
      }

      console.log(
        `🎴 ${card.name}: Estoque atual = ${card.stock}, Solicitado = ${item.quantity}`
      );

      if (card.stock < item.quantity) {
        console.error(`❌ Estoque insuficiente para ${card.name}`);
        errors.push(
          `Estoque insuficiente para ${card.name}. Disponível: ${card.stock}`
        );
      }
    }

    if (errors.length > 0) {
      console.error("❌ Erros de validação:", errors);
      return { success: false, errors };
    }

    // Dar baixa no estoque
    for (const item of cartItems) {
      // ✅ CORREÇÃO: usar item.card.id ao invés de item.cardId
      const cardIndex = cards.findIndex((c) => c.id === item.card.id);

      if (cardIndex !== -1) {
        const oldStock = cards[cardIndex].stock;
        cards[cardIndex].stock -= item.quantity;
        console.log(
          `✅ ${cards[cardIndex].name}: ${oldStock} → ${cards[cardIndex].stock}`
        );
      }
    }

    // Salvar no localStorage
    Store.writeStore(CARDS_KEY, cards);
    console.log("✅ Estoque atualizado com sucesso!");

    // Disparar evento para atualizar a UI
    window.dispatchEvent(new CustomEvent("stock:updated"));

    return { success: true };
  }

  /**
   * Aumentar estoque (ao cancelar pedido ou devolver)
   */
  static increaseStock(cartItems: CartItem[]): void {
    const cards = this.getCards();

    for (const item of cartItems) {
      // ✅ CORREÇÃO: usar item.card.id ao invés de item.cardId
      const cardIndex = cards.findIndex((c) => c.id === item.card.id);

      if (cardIndex !== -1) {
        cards[cardIndex].stock += item.quantity;
      }
    }

    Store.writeStore(CARDS_KEY, cards);
    window.dispatchEvent(new CustomEvent("stock:updated"));
  }

  /**
   * Validar estoque do carrinho
   */
  static validateCartStock(cartItems: CartItem[]): StockValidationResult {
    const cards = this.getCards();
    const errors: string[] = [];
    const warnings: string[] = [];

    for (const item of cartItems) {
      // ✅ CORREÇÃO: usar item.card.id ao invés de item.cardId
      const card = cards.find((c) => c.id === item.card.id);

      if (!card) {
        errors.push(`Carta ${item.card.name} não encontrada`);
        continue;
      }

      if (card.stock === 0) {
        errors.push(`${card.name} está fora de estoque`);
      } else if (card.stock < item.quantity) {
        errors.push(
          `Estoque insuficiente para ${card.name}. Disponível: ${card.stock}, Solicitado: ${item.quantity}`
        );
      } else if (card.stock <= 3) {
        warnings.push(
          `Estoque baixo para ${card.name}: apenas ${card.stock} unidades disponíveis`
        );
      }
    }

    return {
      success: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  }
}
