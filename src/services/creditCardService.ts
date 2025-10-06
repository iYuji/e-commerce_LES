import { CreditCard } from "../types";
import * as Store from "../store/index";

export class CreditCardService {
  private static STORAGE_KEY = "customer_credit_cards";

  // Obter todos os cartões de um cliente
  static getCreditCards(customerId: string): CreditCard[] {
    try {
      const cards = Store.readStore<CreditCard[]>(this.STORAGE_KEY, []);
      return cards.filter((card) => card.customerId === customerId);
    } catch {
      return [];
    }
  }

  // Adicionar novo cartão
  static addCreditCard(cardData: Omit<CreditCard, "id">): CreditCard {
    const cards = Store.readStore<CreditCard[]>(this.STORAGE_KEY, []);

    // Apenas últimos 4 dígitos são salvos para segurança
    const maskedCardNumber = this.maskCardNumber(cardData.cardNumber);

    const newCard: CreditCard = {
      ...cardData,
      id: `card_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      cardNumber: maskedCardNumber,
      brand: this.detectCardBrand(cardData.cardNumber),
    };

    // Se for o primeiro cartão ou marcado como padrão, definir como padrão
    if (
      cards.filter((c) => c.customerId === cardData.customerId).length === 0
    ) {
      newCard.isDefault = true;
    }

    // Se este cartão for marcado como padrão, remover padrão dos outros
    if (newCard.isDefault) {
      cards.forEach((card) => {
        if (card.customerId === cardData.customerId) {
          card.isDefault = false;
        }
      });
    }

    cards.push(newCard);
    Store.writeStore(this.STORAGE_KEY, cards);
    return newCard;
  }

  // Atualizar cartão existente (apenas dados não sensíveis)
  static updateCreditCard(
    cardId: string,
    updates: Partial<Pick<CreditCard, "cardName" | "isDefault" | "label">>
  ): boolean {
    const cards = Store.readStore<CreditCard[]>(this.STORAGE_KEY, []);
    const cardIndex = cards.findIndex((card) => card.id === cardId);

    if (cardIndex === -1) return false;

    const card = cards[cardIndex];

    // Se está definindo como padrão, remover padrão dos outros
    if (updates.isDefault) {
      cards.forEach((c) => {
        if (c.customerId === card.customerId) {
          c.isDefault = false;
        }
      });
    }

    cards[cardIndex] = { ...card, ...updates };
    Store.writeStore(this.STORAGE_KEY, cards);
    return true;
  }

  // Remover cartão
  static removeCreditCard(cardId: string): boolean {
    const cards = Store.readStore<CreditCard[]>(this.STORAGE_KEY, []);
    const cardIndex = cards.findIndex((card) => card.id === cardId);

    if (cardIndex === -1) return false;

    const removedCard = cards[cardIndex];
    cards.splice(cardIndex, 1);

    // Se removeu o cartão padrão, definir outro como padrão
    if (removedCard.isDefault) {
      const customerCards = cards.filter(
        (c) => c.customerId === removedCard.customerId
      );
      if (customerCards.length > 0) {
        customerCards[0].isDefault = true;
      }
    }

    Store.writeStore(this.STORAGE_KEY, cards);
    return true;
  }

  // Obter cartão padrão
  static getDefaultCreditCard(customerId: string): CreditCard | null {
    const cards = this.getCreditCards(customerId);
    return cards.find((card) => card.isDefault) || cards[0] || null;
  }

  // Definir cartão como padrão
  static setDefaultCreditCard(cardId: string): boolean {
    const cards = Store.readStore<CreditCard[]>(this.STORAGE_KEY, []);
    const card = cards.find((c) => c.id === cardId);

    if (!card) return false;

    // Remover padrão dos outros cartões do mesmo cliente
    cards.forEach((c) => {
      if (c.customerId === card.customerId) {
        c.isDefault = c.id === cardId;
      }
    });

    Store.writeStore(this.STORAGE_KEY, cards);
    return true;
  }

  // Mascarar número do cartão (manter apenas últimos 4 dígitos)
  static maskCardNumber(cardNumber: string): string {
    const cleaned = cardNumber.replace(/\D/g, "");
    return `**** **** **** ${cleaned.slice(-4)}`;
  }

  // Detectar bandeira do cartão
  static detectCardBrand(
    cardNumber: string
  ): "visa" | "mastercard" | "elo" | "amex" {
    const cleaned = cardNumber.replace(/\D/g, "");

    if (cleaned.match(/^4/)) return "visa";
    if (cleaned.match(/^5[1-5]/) || cleaned.match(/^2[2-7]/))
      return "mastercard";
    if (cleaned.match(/^3[47]/)) return "amex";
    if (
      cleaned.match(
        /^(4011|4312|4389|4514|4573|5041|5066|5067|6277|6363|6504|6516)/
      )
    )
      return "elo";

    return "visa"; // fallback
  }

  // Validar número do cartão (Algoritmo de Luhn simplificado)
  static validateCardNumber(cardNumber: string): boolean {
    const cleaned = cardNumber.replace(/\D/g, "");

    if (cleaned.length < 13 || cleaned.length > 19) return false;

    let sum = 0;
    let isEven = false;

    for (let i = cleaned.length - 1; i >= 0; i--) {
      let digit = parseInt(cleaned.charAt(i), 10);

      if (isEven) {
        digit *= 2;
        if (digit > 9) {
          digit = (digit % 10) + 1;
        }
      }

      sum += digit;
      isEven = !isEven;
    }

    return sum % 10 === 0;
  }

  // Validar data de validade
  static validateExpiryDate(expiryDate: string): boolean {
    if (!/^\d{2}\/\d{4}$/.test(expiryDate)) return false;

    const [month, year] = expiryDate.split("/");
    const monthNum = parseInt(month, 10);
    const yearNum = parseInt(year, 10);

    if (monthNum < 1 || monthNum > 12) return false;

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    if (
      yearNum < currentYear ||
      (yearNum === currentYear && monthNum < currentMonth)
    ) {
      return false;
    }

    return true;
  }

  // Validar CVV
  static validateCVV(cvv: string, brand: string): boolean {
    const cleaned = cvv.replace(/\D/g, "");

    if (brand === "amex") {
      return cleaned.length === 4;
    } else {
      return cleaned.length === 3;
    }
  }

  // Validar cartão completo
  static validateCreditCard(cardData: {
    cardNumber: string;
    cardName: string;
    expiryDate: string;
    cvv: string;
  }): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!cardData.cardNumber?.trim()) {
      errors.push("Número do cartão é obrigatório");
    } else if (!this.validateCardNumber(cardData.cardNumber)) {
      errors.push("Número do cartão inválido");
    }

    if (!cardData.cardName?.trim()) {
      errors.push("Nome no cartão é obrigatório");
    } else if (cardData.cardName.length < 3) {
      errors.push("Nome no cartão deve ter pelo menos 3 caracteres");
    }

    if (!cardData.expiryDate?.trim()) {
      errors.push("Data de validade é obrigatória");
    } else if (!this.validateExpiryDate(cardData.expiryDate)) {
      errors.push("Data de validade inválida");
    }

    if (!cardData.cvv?.trim()) {
      errors.push("CVV é obrigatório");
    } else {
      const brand = this.detectCardBrand(cardData.cardNumber);
      if (!this.validateCVV(cardData.cvv, brand)) {
        errors.push(`CVV deve ter ${brand === "amex" ? "4" : "3"} dígitos`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // Formatar número do cartão para exibição
  static formatCardNumber(cardNumber: string): string {
    const cleaned = cardNumber.replace(/\D/g, "");
    return cleaned.replace(/(\d{4})(?=\d)/g, "$1 ");
  }

  // Formatar data de validade
  static formatExpiryDate(value: string): string {
    const cleaned = value.replace(/\D/g, "");
    if (cleaned.length >= 2) {
      return `${cleaned.slice(0, 2)}/${cleaned.slice(2, 6)}`;
    }
    return cleaned;
  }

  // Obter ícone da bandeira do cartão
  static getCardBrandIcon(brand: string): string {
    const icons: Record<string, string> = {
      visa: "💳", // Pode ser substituído por ícones reais
      mastercard: "💳",
      elo: "💳",
      amex: "💳",
    };
    return icons[brand] || "💳";
  }
}
