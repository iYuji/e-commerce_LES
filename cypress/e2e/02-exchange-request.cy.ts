/// <reference types="cypress" />

describe("UC02 - Cliente Solicitar Troca/Devolução", () => {
  const customerEmail = "cliente@test.com";
  const customerName = "Cliente Teste";

  beforeEach(() => {
    cy.clearLocalStorage();
    cy.visit("http://localhost:3000");
    cy.wait(1000);

    // Setup: Criar sessão de usuário
    cy.window().then((win) => {
      const session = {
        userId: "test-customer-001",
        user: {
          id: "test-customer-001",
          name: customerName,
          email: customerEmail,
          phone: "(11) 99999-9999",
          createdAt: new Date().toISOString(),
        },
      };
      win.localStorage.setItem("session", JSON.stringify(session));
    });
  });

  it("Fazer compra com PIX e solicitar troca", () => {
    // === PARTE 1: FAZER COMPRA RÁPIDA COM PIX ===

    // 1. Ir para o catálogo
    cy.contains("Catálogo", { matchCase: false }).click();
    cy.wait(2000);

    // 2. Adicionar um produto ao carrinho
    cy.contains("button", "Adicionar ao Carrinho", { matchCase: false })
      .first()
      .click();
    cy.wait(3500);

    // 3. Ir para o carrinho
    cy.contains("Carrinho", { matchCase: false }).click();
    cy.wait(1000);

    // 4. Finalizar compra
    cy.contains("Finalizar Compra", { matchCase: false }).click();
    cy.wait(2000);

    // 5. Preencher endereço
    cy.get("input").eq(0).type("João");
    cy.get("input").eq(1).type("Silva");
    cy.get("input").eq(2).type("Rua Teste, 123");
    cy.get("input").eq(3).type("São Paulo");
    cy.get("input").eq(4).type("SP");
    cy.get("input").eq(5).type("01234-567");
    cy.get("input").eq(6).type("(11) 98765-4321");

    // 6. Próximo
    cy.contains("button", "Próximo", { matchCase: false }).click();
    cy.wait(1000);

    // 7. Selecionar PIX como forma de pagamento
    cy.contains("PIX", { matchCase: false }).click();
    cy.wait(1000);

    // 8. Preencher CPF (buscar input visível após selecionar PIX)
    cy.get("input").filter(":visible").last().type("12345678900");
    cy.wait(500);

    // 9. Próximo
    cy.contains("button", "Próximo", { matchCase: false }).click();
    cy.wait(1000);

    // 10. Finalizar pedido
    cy.contains("button", "Finalizar Pedido", { matchCase: false }).click();
    cy.wait(3000);

    // 11. Capturar ID do pedido
    cy.contains("ORD-")
      .invoke("text")
      .then((orderId) => {
        const cleanOrderId = orderId.trim();
        cy.log("✓ Pedido criado:", cleanOrderId);

        // === PARTE 2: ALTERAR STATUS DO PEDIDO PARA ENTREGUE (ADMIN) ===

        // 12. Clicar no ícone de Admin (penúltimo ícone visível do header)
        cy.get("header button")
          .filter(":visible")
          .then(($buttons) => {
            const totalButtons = $buttons.length;
            cy.log(`Total de botões visíveis: ${totalButtons}`);
            cy.wrap($buttons)
              .eq(totalButtons - 2)
              .click();
          });
        cy.wait(1000);

        // 13. Selecionar "Pedidos"
        cy.contains("li", "Pedidos", { matchCase: false }).click();
        cy.wait(1000);
        cy.log("✓ Acessou página de Pedidos (Admin)");

        // 14. Clicar no primeiro ícone de lápis (Editar status) da primeira venda
        cy.get('svg[data-testid="EditIcon"]').first().click();
        cy.wait(1000);
        cy.log("✓ Clicou em Editar Status");

        // 15. No modal, selecionar "Entregue" no dropdown
        cy.get('[role="dialog"]').within(() => {
          cy.contains("Alterar Status do Pedido", { matchCase: false }).should(
            "be.visible"
          );

          // Clicar no campo "Pendente" para abrir o dropdown
          cy.contains("Pendente").click();
          cy.wait(500);
        });

        // Selecionar "Entregue" da lista que abriu (fora do dialog)
        cy.contains("li", "Entregue", { matchCase: false }).click();
        cy.wait(500);

        // 16. Clicar em "Atualizar" dentro do dialog
        cy.get('[role="dialog"]').within(() => {
          cy.contains("button", "Atualizar", { matchCase: false }).click();
        });
        cy.wait(1000);
        cy.log("✓ Status alterado para Entregue");

        // === PARTE 3: SOLICITAR TROCA DO PEDIDO ===

        // 17. Ir para Meus Pedidos
        cy.get("body").then(($body) => {
          if ($body.find('svg[data-testid="AccountCircleIcon"]').length > 0) {
            cy.get('svg[data-testid="AccountCircleIcon"]').first().click();
          } else {
            cy.get("header button, nav button").last().click();
          }
        });
        cy.wait(500);

        cy.contains("Meus Pedidos", { matchCase: false }).click();
        cy.wait(1000);

        // 18. Verificar que o pedido está na lista
        cy.contains("ORD-").should("be.visible");

        // 19. Clicar em "SOLICITAR" (terceiro ícone - solicitar troca/devolução)
        cy.contains("SOLICITAR", { matchCase: false }).click();
        cy.wait(1000);

        // 20. Selecionar o produto (Alakazam)
        cy.get('input[type="checkbox"], [role="checkbox"]').first().click();
        cy.wait(500);

        // 21. Clicar em "Próximo"
        cy.get('[role="dialog"]').within(() => {
          cy.contains("button", "Próximo", { matchCase: false }).click();
        });
        cy.wait(1000);

        // 22. Selecionar motivo - clicar no primeiro Select (Motivo)
        cy.get('[role="dialog"]')
          .last()
          .within(() => {
            cy.get(".MuiSelect-select").first().click();
          });
        cy.wait(500);

        // Selecionar "Outro motivo" da lista que abriu (fora do modal)
        cy.contains("li", "Outro motivo", { matchCase: false }).click();
        cy.wait(500);

        // 23. Selecionar condição do produto - clicar no segundo Select
        cy.get('[role="dialog"]')
          .last()
          .within(() => {
            cy.get(".MuiSelect-select").last().click();
          });
        cy.wait(500);

        // Selecionar "Lacrado/Sem uso" da lista que abriu (fora do modal)
        cy.contains("li", "Lacrado", { matchCase: false }).click();
        cy.wait(500);

        // 24. Clicar em "PRÓXIMO" para ir para a tela de confirmação
        cy.get('[role="dialog"]')
          .last()
          .within(() => {
            cy.contains("button", "Próximo", { matchCase: false }).click();
          });
        cy.wait(1000);

        // 25. Clicar em "ENVIAR SOLICITAÇÃO" no modal de confirmação
        cy.contains("button", "Enviar Solicitação", {
          matchCase: false,
        }).click();
        cy.wait(2000);
        cy.log("✓ Solicitação de troca enviada");

        // === PARTE 4: ADMIN - GERENCIAR TROCAS ===

        // 26. Clicar no penúltimo ícone (menu admin)
        cy.get("header button")
          .filter(":visible")
          .then(($buttons) => {
            const totalButtons = $buttons.length;
            cy.log(`Total de botões visíveis: ${totalButtons}`);
            cy.wrap($buttons)
              .eq(totalButtons - 2)
              .click();
          });
        cy.wait(1000);

        // 27. Selecionar "Trocas Admin"
        cy.contains("Trocas Admin", { matchCase: false }).click();
        cy.wait(1000);
        cy.log("✓ Acessou página de Trocas Admin");

        // 28. Verificar que a troca está na lista e clicar no ícone de olho
        cy.get('svg[data-testid="VisibilityIcon"]').first().click();
        cy.wait(1000);
        cy.log("✓ Abriu detalhes da troca");

        // 29. Clicar em "Aprovar Solicitação" no modal
        cy.get('[role="dialog"]').within(() => {
          cy.contains("button", "Aprovar Troca", {
            matchCase: false,
          }).click();
        });
        cy.wait(2000);
        cy.log(
          "✓ UC04: Teste completo - Troca solicitada, visualizada e aprovada"
        );
      });
  });
});
