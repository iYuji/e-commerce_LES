import {
  BusinessRules,
  CheckoutValidation,
  CartItem,
  PaymentInfo,
  AppliedCoupon,
} from "../types";

export class BusinessRulesService {
  private static readonly rules: BusinessRules = {
    maxCardsPerCart: 20,
    maxCouponsPerOrder: 6, // 1 promocional + 5 de troca
    maxExchangeCouponsPerOrder: 5,
    maxPromotionalCouponsPerOrder: 1,
    maxCreditCardsPerOrder: 3,
    minOrderValueForCoupons: 10,
    stockReservationTimeMinutes: 30,
  };

  // Obter regras de negócio
  static getBusinessRules(): BusinessRules {
    return this.rules;
  }

  // Validar carrinho de compras
  static validateCart(cartItems: CartItem[]): CheckoutValidation {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validar número máximo de itens
    if (cartItems.length > this.rules.maxCardsPerCart) {
      errors.push(`Máximo de ${this.rules.maxCardsPerCart} itens por pedido`);
    }

    // Validar quantidade individual
    cartItems.forEach((item) => {
      if (item.quantity <= 0) {
        errors.push(`Quantidade inválida para ${item.card.name}`);
      }
      if (item.quantity > 10) {
        warnings.push(
          `Quantidade alta para ${item.card.name}: ${item.quantity} unidades`
        );
      }
    });

    // Validar valores
    const totalValue = cartItems.reduce(
      (sum, item) => sum + item.card.price * item.quantity,
      0
    );
    if (totalValue <= 0) {
      errors.push("Valor total do pedido deve ser maior que zero");
    }
    if (totalValue > 10000) {
      warnings.push(`Valor alto do pedido: R$ ${totalValue.toFixed(2)}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  // Validar cupons aplicados
  static validateCoupons(
    appliedCoupons: AppliedCoupon[],
    orderValue: number
  ): CheckoutValidation {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validar número de cupons
    if (appliedCoupons.length > this.rules.maxCouponsPerOrder) {
      errors.push(
        `Máximo de ${this.rules.maxCouponsPerOrder} cupons por pedido`
      );
    }

    // Separar cupons por categoria
    const promotionalCoupons = appliedCoupons.filter(
      (c) => c.category === "promotional"
    );
    const exchangeCoupons = appliedCoupons.filter(
      (c) => c.category === "exchange"
    );

    // Validar cupons promocionais
    if (promotionalCoupons.length > this.rules.maxPromotionalCouponsPerOrder) {
      errors.push(
        `Máximo de ${this.rules.maxPromotionalCouponsPerOrder} cupom promocional por pedido`
      );
    }

    // Validar cupons de troca
    if (exchangeCoupons.length > this.rules.maxExchangeCouponsPerOrder) {
      errors.push(
        `Máximo de ${this.rules.maxExchangeCouponsPerOrder} cupons de troca por pedido`
      );
    }

    // Validar valor mínimo para cupons
    if (
      appliedCoupons.length > 0 &&
      orderValue < this.rules.minOrderValueForCoupons
    ) {
      errors.push(
        `Valor mínimo de R$ ${this.rules.minOrderValueForCoupons.toFixed(
          2
        )} para usar cupons`
      );
    }

    // Calcular desconto total
    const totalDiscount = appliedCoupons.reduce(
      (sum, coupon) => sum + coupon.discount,
      0
    );
    if (totalDiscount >= orderValue) {
      errors.push(
        "Desconto total não pode ser igual ou superior ao valor do pedido"
      );
    }

    // Avisos para descontos altos
    const discountPercentage = (totalDiscount / orderValue) * 100;
    if (discountPercentage > 50) {
      warnings.push(
        `Desconto alto: ${discountPercentage.toFixed(1)}% do valor total`
      );
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  // Validar informações de pagamento
  static validatePayment(paymentInfo: PaymentInfo): CheckoutValidation {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validar método de pagamento
    if (!paymentInfo.method) {
      errors.push("Método de pagamento é obrigatório");
    }

    // Validar cartões de crédito
    if (paymentInfo.method === "credit" && paymentInfo.creditCards) {
      const creditCards = paymentInfo.creditCards;

      // Validar número máximo de cartões
      if (creditCards.length > this.rules.maxCreditCardsPerOrder) {
        errors.push(
          `Máximo de ${this.rules.maxCreditCardsPerOrder} cartões por pedido`
        );
      }

      // Validar valores dos cartões
      const totalCardAmount = creditCards.reduce(
        (sum, card) => sum + card.amount,
        0
      );
      if (Math.abs(totalCardAmount - paymentInfo.totalAmount) > 0.01) {
        errors.push("Soma dos valores dos cartões não confere com o total");
      }

      // Validar cada cartão
      creditCards.forEach((card, index) => {
        if (card.amount <= 0) {
          errors.push(`Valor inválido no cartão ${index + 1}`);
        }
        if (card.amount < 5) {
          warnings.push(
            `Valor baixo no cartão ${index + 1}: R$ ${card.amount.toFixed(2)}`
          );
        }
      });

      // Validar distribuição de valores
      const minCardValue = Math.min(...creditCards.map((c) => c.amount));
      const maxCardValue = Math.max(...creditCards.map((c) => c.amount));
      if (creditCards.length > 1 && minCardValue < maxCardValue * 0.1) {
        warnings.push("Distribuição desigual entre cartões");
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  // Validar checkout completo
  static validateCheckout(
    cartItems: CartItem[],
    appliedCoupons: AppliedCoupon[],
    paymentInfo: PaymentInfo,
    customerId: string
  ): CheckoutValidation {
    const allErrors: string[] = [];
    const allWarnings: string[] = [];

    // Validar carrinho
    const cartValidation = this.validateCart(cartItems);
    allErrors.push(...cartValidation.errors);
    allWarnings.push(...cartValidation.warnings);

    // Calcular valor do pedido
    const subtotal = cartItems.reduce(
      (sum, item) => sum + item.card.price * item.quantity,
      0
    );

    // Validar cupons
    const couponValidation = this.validateCoupons(appliedCoupons, subtotal);
    allErrors.push(...couponValidation.errors);
    allWarnings.push(...couponValidation.warnings);

    // Validar pagamento
    const paymentValidation = this.validatePayment(paymentInfo);
    allErrors.push(...paymentValidation.errors);
    allWarnings.push(...paymentValidation.warnings);

    // Validar cliente
    if (!customerId?.trim()) {
      allErrors.push("Cliente é obrigatório");
    }

    return {
      isValid: allErrors.length === 0,
      errors: allErrors,
      warnings: allWarnings,
    };
  }

  // Calcular limites para o cliente
  static calculateCustomerLimits(
    customerOrderCount: number,
    customerTotalSpent: number
  ): {
    maxOrderValue: number;
    maxCartItems: number;
    maxCoupons: number;
    maxCreditCards: number;
  } {
    // Clientes novos têm limites menores
    const isNewCustomer = customerOrderCount < 3;
    const isVipCustomer = customerTotalSpent > 1000;

    return {
      maxOrderValue: isNewCustomer ? 500 : isVipCustomer ? 5000 : 2000,
      maxCartItems: isNewCustomer ? 10 : this.rules.maxCardsPerCart,
      maxCoupons: isNewCustomer ? 2 : this.rules.maxCouponsPerOrder,
      maxCreditCards: isNewCustomer ? 1 : this.rules.maxCreditCardsPerOrder,
    };
  }

  // Calcular taxa de frete baseada em regras
  static calculateShippingCost(
    subtotal: number,
    itemCount: number,
    shippingOption: string,
    customerLocation?: string
  ): number {
    let baseCost = 0;

    switch (shippingOption) {
      case "standard":
        baseCost = 8.5;
        break;
      case "express":
        baseCost = 15.0;
        break;
      case "premium":
        baseCost = 25.0;
        break;
      default:
        baseCost = 8.5;
    }

    // Frete grátis para pedidos acima de R$ 100
    if (subtotal >= 100) {
      return 0;
    }

    // Taxa adicional para muitos itens
    if (itemCount > 5) {
      baseCost += (itemCount - 5) * 2.0;
    }

    // Taxa adicional para regiões específicas (simulação)
    if (
      customerLocation?.includes("Norte") ||
      customerLocation?.includes("Nordeste")
    ) {
      baseCost += 5.0;
    }

    return Math.max(baseCost, 0);
  }

  // Determinar prazo de entrega
  static calculateDeliveryTime(
    shippingOption: string,
    customerLocation?: string
  ): { minDays: number; maxDays: number; estimatedDays: number } {
    let baseDays = 0;

    switch (shippingOption) {
      case "standard":
        baseDays = 5;
        break;
      case "express":
        baseDays = 2;
        break;
      case "premium":
        baseDays = 1;
        break;
      default:
        baseDays = 5;
    }

    // Adicionar dias para regiões distantes
    let additionalDays = 0;
    if (
      customerLocation?.includes("Norte") ||
      customerLocation?.includes("Nordeste")
    ) {
      additionalDays = 2;
    }

    const estimatedDays = baseDays + additionalDays;

    return {
      minDays: Math.max(1, estimatedDays - 1),
      maxDays: estimatedDays + 2,
      estimatedDays,
    };
  }

  // Verificar se é horário comercial para processamento
  static isBusinessHours(): boolean {
    const now = new Date();
    const hour = now.getHours();
    const day = now.getDay(); // 0 = domingo

    // Segunda a sexta, 8h às 18h
    return day >= 1 && day <= 5 && hour >= 8 && hour < 18;
  }

  // Calcular taxa de processamento
  static calculateProcessingFee(paymentMethod: string, amount: number): number {
    switch (paymentMethod) {
      case "credit":
        return amount * 0.03; // 3% para cartão de crédito
      case "debit":
        return amount * 0.015; // 1.5% para cartão de débito
      case "pix":
        return 0; // PIX gratuito
      case "boleto":
        return 2.5; // Taxa fixa para boleto
      default:
        return 0;
    }
  }
}
