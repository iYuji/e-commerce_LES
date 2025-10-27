import { Coupon } from "../types";
import * as Store from "../store/index";

const STORE_KEY = "coupons";

export interface CouponValidationResult {
  isValid: boolean;
  error?: string;
  coupon?: Coupon;
}

export class CouponService {
  /**
   * Obter todos os cupons
   */
  static getCoupons(): Coupon[] {
    try {
      return Store.readStore(STORE_KEY, []) as Coupon[];
    } catch {
      return [];
    }
  }

  /**
   * Obter cupons ativos (não expirados)
   */
  static getActiveCoupons(): Coupon[] {
    const allCoupons = this.getCoupons();
    const now = new Date();
    return allCoupons.filter((c) => c.isActive && new Date(c.expiresAt) > now);
  }

  /**
   * Obter cupom por código
   */
  static getCouponByCode(code: string): Coupon | null {
    const coupons = this.getCoupons();
    return (
      coupons.find((c) => c.code.toUpperCase() === code.toUpperCase()) || null
    );
  }

  /**
   * Validar cupom para uso
   */
  static validateCoupon(
    code: string,
    customerId?: string,
    orderValue?: number
  ): CouponValidationResult {
    const coupon = this.getCouponByCode(code);

    if (!coupon) {
      return { isValid: false, error: "Cupom não encontrado" };
    }

    if (!coupon.isActive) {
      return { isValid: false, error: "Cupom já foi utilizado" };
    }

    // Verificar expiração
    if (new Date(coupon.expiresAt) <= new Date()) {
      return { isValid: false, error: "Cupom expirado" };
    }

    // Verificar se é cupom de troca específico do cliente
    if (
      coupon.category === "exchange" &&
      coupon.customerId &&
      coupon.customerId !== customerId
    ) {
      return {
        isValid: false,
        error: "Este cupom não está disponível para você",
      };
    }

    // Verificar valor mínimo do pedido
    if (
      coupon.minOrderValue &&
      orderValue !== undefined &&
      orderValue < coupon.minOrderValue
    ) {
      return {
        isValid: false,
        error: `Valor mínimo do pedido deve ser R$ ${coupon.minOrderValue.toFixed(
          2
        )}`,
      };
    }

    return { isValid: true, coupon };
  }

  /**
   * Calcular desconto baseado no cupom
   */
  static calculateDiscount(coupon: Coupon, orderValue: number): number {
    if (coupon.type === "fixed") {
      return Math.min(coupon.discount, orderValue);
    }

    // Percentual
    let discount = (orderValue * coupon.discount) / 100;

    // Aplicar desconto máximo se definido
    if (coupon.maxDiscount) {
      discount = Math.min(discount, coupon.maxDiscount);
    }

    return discount;
  }

  /**
   * Marcar cupom como usado
   */
  static useCoupon(couponId: string): boolean {
    const coupons = this.getCoupons();
    const couponIndex = coupons.findIndex((c) => c.id === couponId);

    if (couponIndex === -1) return false;

    coupons[couponIndex].isActive = false;
    Store.writeStore(STORE_KEY, coupons);
    return true;
  }

  /**
   * Adicionar novo cupom
   */
  static addCoupon(coupon: Coupon): void {
    const coupons = this.getCoupons();
    coupons.push(coupon);
    Store.writeStore(STORE_KEY, coupons);
  }

  /**
   * Inicializar cupons de exemplo
   */
  static seedCoupons(): void {
    const existingCoupons = this.getCoupons();
    if (existingCoupons.length > 0) return;

    const sampleCoupons: Coupon[] = [
      {
        id: "promo_001",
        code: "BEMVINDO10",
        discount: 10,
        type: "percentage",
        category: "promotional",
        isActive: true,
        minOrderValue: 50,
        expiresAt: new Date(
          Date.now() + 30 * 24 * 60 * 60 * 1000
        ).toISOString(),
      },
      {
        id: "promo_002",
        code: "FRETEGRATIS",
        discount: 15,
        type: "fixed",
        category: "promotional",
        isActive: true,
        minOrderValue: 100,
        expiresAt: new Date(
          Date.now() + 15 * 24 * 60 * 60 * 1000
        ).toISOString(),
      },
    ];

    Store.writeStore(STORE_KEY, sampleCoupons);
  }
}
