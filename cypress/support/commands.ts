/// <reference types="cypress" />

// ***********************************************
// Custom Commands for E-commerce Tests
// ***********************************************

/**
 * Login como cliente
 */
Cypress.Commands.add(
  "loginAsCustomer",
  (customerId: string, customerName: string, email: string) => {
    cy.window().then((win) => {
      win.localStorage.setItem(
        "session",
        JSON.stringify({
          userId: customerId,
          user: {
            id: customerId,
            name: customerName,
            email: email,
            phone: "(11) 99999-9999",
            createdAt: new Date().toISOString(),
          },
        })
      );
    });
  }
);

/**
 * Login como admin
 */
Cypress.Commands.add("loginAsAdmin", () => {
  cy.window().then((win) => {
    win.localStorage.setItem(
      "session",
      JSON.stringify({
        userId: "admin-test",
        user: {
          id: "admin-test",
          name: "Admin Test",
          email: "admin@test.com",
          role: "admin",
        },
      })
    );
  });
});

/**
 * Adicionar produto ao carrinho
 */
Cypress.Commands.add("addProductToCart", (productIndex: number = 0) => {
  cy.contains("Catálogo", { matchCase: false }).click();
  cy.wait(2000);

  cy.contains("button", "Adicionar ao Carrinho", { matchCase: false })
    .eq(productIndex)
    .click();
  cy.wait(2000);
});

/**
 * Ir para checkout preenchendo endereço
 */
Cypress.Commands.add("goToCheckoutWithAddress", () => {
  cy.contains("Carrinho", { matchCase: false }).click();
  cy.wait(1000);
  cy.contains("Finalizar Compra", { matchCase: false }).click();
  cy.wait(2000);

  // Preencher endereço padrão
  cy.get("input").eq(0).type("Teste");
  cy.get("input").eq(1).type("User");
  cy.get("input").eq(2).type("Rua Teste, 123");
  cy.get("input").eq(3).type("São Paulo");
  cy.get("input").eq(4).type("SP");
  cy.get("input").eq(5).type("01234-567");
  cy.get("input").eq(6).type("(11) 98765-4321");

  cy.contains("button", "Próximo", { matchCase: false }).click();
  cy.wait(1000);
});

/**
 * Preencher pagamento com cartão
 */
Cypress.Commands.add("fillPaymentWithCard", (cardNumber?: string) => {
  const number = cardNumber || "4111 1111 1111 1111";

  cy.get("input").eq(0).type(number);
  cy.get("input").eq(1).type("Teste User");
  cy.get("input").eq(2).type("12/27");
  cy.get("input").eq(3).type("123");

  cy.contains("button", "Próximo", { matchCase: false }).click();
  cy.wait(1000);
});

/**
 * Criar cupom no localStorage
 */
Cypress.Commands.add(
  "createCoupon",
  (
    code: string,
    discount: number,
    type: "percentage" | "fixed",
    category: "promotional" | "exchange",
    customerId?: string
  ) => {
    cy.window().then((win) => {
      const coupons = JSON.parse(win.localStorage.getItem("coupons") || "[]");

      const coupon = {
        id: `coupon-${Date.now()}`,
        code,
        discount,
        type,
        expiresAt: new Date(
          Date.now() + 30 * 24 * 60 * 60 * 1000
        ).toISOString(),
        isActive: true,
        category,
        customerId: customerId || undefined,
        minOrderValue: 0,
      };

      coupons.push(coupon);
      win.localStorage.setItem("coupons", JSON.stringify(coupons));
    });
  }
);

/**
 * Criar pedido de teste no localStorage
 */
Cypress.Commands.add(
  "createTestOrder",
  (customerId: string, status: string = "pending") => {
    cy.window().then((win) => {
      const orders = JSON.parse(win.localStorage.getItem("orders") || "[]");

      const order = {
        id: "ORD-" + Date.now().toString().slice(-6),
        customerId,
        items: [
          {
            id: "item-001",
            cardId: "1",
            card: {
              id: "1",
              name: "Test Card",
              type: "Test",
              rarity: "Common",
              price: 50.0,
              stock: 10,
            },
            quantity: 1,
          },
        ],
        subtotal: 50.0,
        discountAmount: 0,
        shippingCost: 8.5,
        total: 58.5,
        status,
        shippingAddress: {
          id: "addr-test",
          customerId,
          firstName: "Test",
          lastName: "User",
          address: "Test Address",
          city: "Test City",
          state: "TS",
          zipCode: "12345-678",
          phone: "(11) 99999-9999",
        },
        paymentInfo: {
          method: "credit",
          totalAmount: 58.5,
        },
        appliedCoupons: [],
        createdAt: new Date().toISOString(),
      };

      orders.push(order);
      win.localStorage.setItem("orders", JSON.stringify(orders));

      return cy.wrap(order.id);
    });
  }
);

/**
 * Navegar para admin panel
 */
Cypress.Commands.add("goToAdminPanel", (section: string) => {
  cy.get("header").within(() => {
    cy.get('button, [role="button"]').then(($buttons) => {
      cy.wrap($buttons).eq(-2).click();
    });
  });
  cy.wait(1000);

  cy.contains(section, { matchCase: false }).click();
  cy.wait(2000);
});

// Declaração de tipos TypeScript
declare global {
  namespace Cypress {
    interface Chainable {
      loginAsCustomer(
        customerId: string,
        customerName: string,
        email: string
      ): Chainable<void>;
      loginAsAdmin(): Chainable<void>;
      addProductToCart(productIndex?: number): Chainable<void>;
      goToCheckoutWithAddress(): Chainable<void>;
      fillPaymentWithCard(cardNumber?: string): Chainable<void>;
      createCoupon(
        code: string,
        discount: number,
        type: "percentage" | "fixed",
        category: "promotional" | "exchange",
        customerId?: string
      ): Chainable<void>;
      createTestOrder(customerId: string, status?: string): Chainable<string>;
      goToAdminPanel(section: string): Chainable<void>;
    }
  }
}

export {};
