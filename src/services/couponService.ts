import { Coupon, AppliedCoupon } from "../types";
import * as Store from "../store/index";

export class CouponService {
  private static STORAGE_KEY = "coupons";

  // Obter todos os cupons
  static getCoupons(): Coupon[] {
    try {
      return Store.readStore<Coupon[]>(this.STORAGE_KEY, []);
    } catch {
      return [];
    }
  }

  // Obter cupons ativos
  static getActiveCoupons(): Coupon[] {
    return this.getCoupons().filter(
      (coupon) => coupon.isActive && new Date(coupon.expiresAt) > new Date()
    );
  }

  // Obter cupons por categoria
  static getCouponsByCategory(category: "promotional" | "exchange"): Coupon[] {
    return this.getActiveCoupons().filter(
      (coupon) => coupon.category === category
    );
  }

  // Obter cupons de troca de um cliente
  static getExchangeCouponsForCustomer(customerId: string): Coupon[] {
    return this.getActiveCoupons().filter(
      (coupon) =>
        coupon.category === "exchange" && coupon.customerId === customerId
    );
  }

  // Validar cupom por código
  static validateCoupon(
    code: string,
    customerId?: string,
    orderValue?: number
  ): {
    isValid: boolean;
    coupon?: Coupon;
    error?: string;
  } {
    const allCoupons = this.getCoupons();
    console.log("🔍 Validando cupom:", code);
    console.log("📦 Total de cupons no storage:", allCoupons.length);
    console.log("💰 Valor do pedido:", orderValue);
    console.log("👤 Customer ID:", customerId);

    const coupon = allCoupons.find(
      (c) => c.code.toLowerCase() === code.toLowerCase()
    );

    if (!coupon) {
      console.log("❌ Cupom não encontrado:", code);
      console.log(
        "📋 Cupons disponíveis:",
        allCoupons.map((c) => c.code).join(", ")
      );
      return { isValid: false, error: "Cupom não encontrado" };
    }

    console.log("✅ Cupom encontrado:", coupon);

    if (!coupon.isActive) {
      console.log("❌ Cupom inativo");
      return { isValid: false, error: "Cupom inativo" };
    }

    const expiryDate = new Date(coupon.expiresAt);
    const now = new Date();
    console.log("📅 Data de expiração:", expiryDate);
    console.log("📅 Data atual:", now);
    console.log("⏰ Expirado?", expiryDate <= now);

    if (expiryDate <= now) {
      console.log("❌ Cupom expirado");
      return { isValid: false, error: "Cupom expirado" };
    }

    if (coupon.category === "exchange" && coupon.customerId !== customerId) {
      console.log("❌ Cupom não pertence a este cliente");
      return { isValid: false, error: "Cupom não pertence a este cliente" };
    }

    if (
      coupon.minOrderValue &&
      orderValue &&
      orderValue < coupon.minOrderValue
    ) {
      console.log(
        "❌ Valor mínimo não atingido. Mínimo:",
        coupon.minOrderValue,
        "Atual:",
        orderValue
      );
      return {
        isValid: false,
        error: `Valor mínimo do pedido: R$ ${coupon.minOrderValue.toFixed(2)}`,
      };
    }

    console.log("✅ Cupom válido!");
    return { isValid: true, coupon };
  }

  // Calcular desconto de um cupom
  static calculateDiscount(coupon: Coupon, orderValue: number): number {
    if (coupon.type === "percentage") {
      const discount = orderValue * (coupon.discount / 100);
      return coupon.maxDiscount
        ? Math.min(discount, coupon.maxDiscount)
        : discount;
    } else {
      return coupon.discount;
    }
  }

  // Validar combinação de cupons
  static validateCouponCombination(
    coupons: Coupon[],
    customerId: string,
    orderValue: number
  ): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Verificar regras de negócio
    const promotionalCoupons = coupons.filter(
      (c) => c.category === "promotional"
    );
    const exchangeCoupons = coupons.filter((c) => c.category === "exchange");

    // Máximo 1 cupom promocional
    if (promotionalCoupons.length > 1) {
      errors.push("Apenas um cupom promocional pode ser usado por pedido");
    }

    // Máximo 5 cupons de troca
    if (exchangeCoupons.length > 5) {
      errors.push("Máximo de 5 cupons de troca por pedido");
    }

    // Verificar se cupons de troca pertencem ao cliente
    const invalidExchangeCoupons = exchangeCoupons.filter(
      (c) => c.customerId !== customerId
    );
    if (invalidExchangeCoupons.length > 0) {
      errors.push("Alguns cupons de troca não pertencem a este cliente");
    }

    // Verificar valor mínimo
    const couponsWithMinValue = coupons.filter(
      (c) => c.minOrderValue && c.minOrderValue > orderValue
    );
    if (couponsWithMinValue.length > 0) {
      const maxMinValue = Math.max(
        ...couponsWithMinValue.map((c) => c.minOrderValue!)
      );
      errors.push(`Valor mínimo necessário: R$ ${maxMinValue.toFixed(2)}`);
    }

    // Calcular desconto total
    const totalDiscount = coupons.reduce((total, coupon) => {
      return total + this.calculateDiscount(coupon, orderValue);
    }, 0);

    // Avisar se desconto é maior que valor do pedido
    if (totalDiscount >= orderValue) {
      warnings.push(
        "O desconto total não pode ser maior que o valor do pedido"
      );
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  // Aplicar cupons ao pedido
  static applyCoupons(
    coupons: Coupon[],
    orderValue: number
  ): {
    appliedCoupons: AppliedCoupon[];
    totalDiscount: number;
    adjustedDiscount: number;
  } {
    let totalDiscount = 0;
    const appliedCoupons: AppliedCoupon[] = [];

    // Aplicar cupons promocionais primeiro (geralmente têm desconto maior)
    const sortedCoupons = [...coupons].sort((a, b) => {
      if (a.category === "promotional" && b.category === "exchange") return -1;
      if (a.category === "exchange" && b.category === "promotional") return 1;
      return 0;
    });

    for (const coupon of sortedCoupons) {
      const discount = this.calculateDiscount(coupon, orderValue);
      totalDiscount += discount;

      appliedCoupons.push({
        couponId: coupon.id,
        code: coupon.code,
        discount,
        type: coupon.type,
        category: coupon.category,
      });
    }

    // Ajustar desconto se for maior que o valor do pedido
    const adjustedDiscount = Math.min(totalDiscount, orderValue - 0.01); // Deixar pelo menos R$ 0.01

    return {
      appliedCoupons,
      totalDiscount,
      adjustedDiscount,
    };
  }

  // Criar cupom de troca
  static createExchangeCoupon(customerId: string, amount: number): Coupon {
    const coupons = this.getCoupons();
    const newCoupon: Coupon = {
      id: `exc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      code: `TROCA${Date.now().toString().slice(-6)}`,
      discount: amount,
      type: "fixed",
      category: "exchange",
      customerId,
      isActive: true,
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 ano
      minOrderValue: 0,
    };

    coupons.push(newCoupon);
    Store.writeStore(this.STORAGE_KEY, coupons);
    return newCoupon;
  }

  // Usar cupom (marcar como usado/inativo)
  static useCoupon(couponId: string): boolean {
    const coupons = this.getCoupons();
    const couponIndex = coupons.findIndex((c) => c.id === couponId);

    if (couponIndex === -1) return false;

    // Para cupons de troca, marcar como inativo após uso
    if (coupons[couponIndex].category === "exchange") {
      coupons[couponIndex].isActive = false;
    }

    Store.writeStore(this.STORAGE_KEY, coupons);
    return true;
  }

  // Semear cupons de exemplo
  static seedCoupons(): void {
    const existingCoupons = this.getCoupons();
    if (existingCoupons.length > 0) return;

    const sampleCoupons: Coupon[] = [
      {
        id: "1",
        code: "WELCOME10",
        discount: 10,
        type: "percentage",
        category: "promotional",
        isActive: true,
        expiresAt: new Date(
          Date.now() + 30 * 24 * 60 * 60 * 1000
        ).toISOString(), // 30 dias
        minOrderValue: 50,
        maxDiscount: 20,
      },
      {
        id: "2",
        code: "SAVE15",
        discount: 15,
        type: "fixed",
        category: "promotional",
        isActive: true,
        expiresAt: new Date(
          Date.now() + 15 * 24 * 60 * 60 * 1000
        ).toISOString(), // 15 dias
        minOrderValue: 30,
      },
      {
        id: "3",
        code: "LEGENDARY20",
        discount: 20,
        type: "percentage",
        category: "promotional",
        isActive: true,
        expiresAt: new Date(
          Date.now() + 60 * 24 * 60 * 60 * 1000
        ).toISOString(), // 60 dias
        minOrderValue: 100,
        maxDiscount: 50,
      },
    ];

    Store.writeStore(this.STORAGE_KEY, sampleCoupons);
  }

  // Formatar desconto para exibição
  static formatDiscount(coupon: Coupon): string {
    if (coupon.type === "percentage") {
      const maxPart = coupon.maxDiscount
        ? ` (máx. R$ ${coupon.maxDiscount.toFixed(2)})`
        : "";
      return `${coupon.discount}%${maxPart}`;
    } else {
      return `R$ ${coupon.discount.toFixed(2)}`;
    }
  }

  // Obter descrição do cupom
  static getCouponDescription(coupon: Coupon): string {
    const discountText = this.formatDiscount(coupon);
    const categoryText =
      coupon.category === "promotional" ? "Promocional" : "Troca";
    const minValueText = coupon.minOrderValue
      ? ` (min. R$ ${coupon.minOrderValue.toFixed(2)})`
      : "";

    return `${categoryText}: ${discountText}${minValueText}`;
  }
}
