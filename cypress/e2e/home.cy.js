describe('Home to Admin - Simple Client CRUD Tests', () => {
  beforeEach(() => {
    cy.visit('http://localhost:3000') // Start from home page
    cy.wait(2000)
  })

  it('should perform complete client CRUD operations from home', () => {
    // Navigate from home to admin section
    cy.get('header').within(() => {
      cy.get('button, [role="button"], a').then($buttons => {
        cy.wrap($buttons).eq(-2).click() // Second icon from right
      })
    })

    // Click on "Gerenciar Clientes"
    cy.contains('Gerenciar Clientes', { matchCase: false }).click()
    cy.url().should('include', '/admin/clientes')
    cy.wait(3000)

    // CREATE - Add new client
    cy.contains('Adicionar Cliente').click()
    cy.wait(1000)

    cy.get('div[role="dialog"]').within(() => {
      cy.get('input').first().type('Teste Cliente', { force: true })
      cy.get('input[type="email"]').type('teste@email.com', { force: true })
      cy.get('input').eq(2).type('(11) 99999-9999', { force: true })
      cy.contains('Criar').click()
    })

    // Wait for dialog to close and table to update
    cy.wait(3000)

    // READ - Verify client appears in table
    cy.get('table').should('contain', 'Teste Cliente')
    cy.get('table').should('contain', 'teste@email.com')

    // UPDATE - Edit the client - usando seletor específico para a estrutura Material-UI
    cy.get('table').within(() => {
      cy.contains('Teste Cliente')
        .closest('tr') // Encontra a linha da tabela
        .find('button[color="secondary"], button')
        .then($buttons => {
          // Clica no segundo botão (Edit) - os botões são: View(primary), Edit(secondary), Delete(error)
          cy.wrap($buttons).eq(1).click()
        })
    })

    cy.wait(1000)
    cy.get('div[role="dialog"]').within(() => {
      cy.get('input').first().clear().type('Teste Cliente Editado', { force: true })
      cy.get('input').eq(2).clear().type('(11) 88888-8888', { force: true })
      cy.contains('Atualizar').click()
    })

    // Wait for update to complete
    cy.wait(3000)

    // Verify update in table
    cy.get('table').should('contain', 'Teste Cliente Editado')
    cy.get('table').should('contain', '(11) 88888-8888')

    // DELETE - Remove the client
    cy.get('table').within(() => {
      cy.contains('Teste Cliente Editado')
        .closest('tr')
        .find('button[color="error"], button')
        .then($buttons => {
          // Clica no botão de delete (último ou o que tem color="error")
          cy.wrap($buttons).last().click()
        })
    })

    cy.wait(1000)
    cy.contains('Excluir').click()

    // Wait for deletion to complete
    cy.wait(3000)

    // Verify deletion - client should not exist in table
    cy.get('table').should('not.contain', 'Teste Cliente Editado')
    cy.get('table').should('not.contain', 'teste@email.com')
  })

  it('should create client with minimum required fields', () => {
    // Navigate to admin
    cy.get('header').within(() => {
      cy.get('button, [role="button"], a').then($buttons => {
        cy.wrap($buttons).eq(-2).click()
      })
    })
    cy.contains('Gerenciar Clientes', { matchCase: false }).click()
    cy.wait(3000)

    // Create client with only name and email
    cy.contains('Adicionar Cliente').click()
    cy.wait(1000)

    cy.get('div[role="dialog"]').within(() => {
      cy.get('input').first().type('Cliente Mínimo', { force: true })
      cy.get('input[type="email"]').type('minimo@test.com', { force: true })
      cy.contains('Criar').click()
    })

    // Wait for creation
    cy.wait(3000)

    // Verify client appears in table
    cy.get('table').should('contain', 'Cliente Mínimo')

    // Clean up
    cy.get('table').within(() => {
      cy.contains('Cliente Mínimo')
        .closest('tr')
        .find('button')
        .then($buttons => {
          cy.wrap($buttons).last().click()
        })
    })
    cy.wait(1000)
    cy.contains('Excluir').click()
    cy.wait(3000)
  })

  it('should test search functionality', () => {
    // Navigate to admin
    cy.get('header').within(() => {
      cy.get('button, [role="button"], a').then($buttons => {
        cy.wrap($buttons).eq(-2).click()
      })
    })
    cy.contains('Gerenciar Clientes', { matchCase: false }).click()
    cy.wait(3000)

    // Create test client for search
    cy.contains('Adicionar Cliente').click()
    cy.wait(1000)

    cy.get('div[role="dialog"]').within(() => {
      cy.get('input').first().type('Busca Teste', { force: true })
      cy.get('input[type="email"]').type('busca@test.com', { force: true })
      cy.contains('Criar').click()
    })

    // Wait for creation
    cy.wait(3000)

    // Test search
    cy.get('input[placeholder="Nome, email, telefone ou CPF..."]').type('Busca', { force: true })
    cy.wait(1000)
    cy.get('table').should('contain', 'Busca Teste')

    // Clear search
    cy.get('input[placeholder="Nome, email, telefone ou CPF..."]').clear({ force: true })
    cy.wait(1000)

    // Clean up - delete the test client
    cy.get('table').within(() => {
      cy.contains('Busca Teste')
        .closest('tr')
        .find('button')
        .then($buttons => {
          cy.wrap($buttons).last().click()
        })
    })
    cy.wait(1000)
    cy.contains('Excluir').click()
    cy.wait(3000)
  })

  it('should view client details', () => {
    // Navigate to admin
    cy.get('header').within(() => {
      cy.get('button, [role="button"], a').then($buttons => {
        cy.wrap($buttons).eq(-2).click()
      })
    })
    cy.contains('Gerenciar Clientes', { matchCase: false }).click()
    cy.wait(3000)

    // Create test client for viewing details
    cy.contains('Adicionar Cliente').click()
    cy.wait(1000)

    cy.get('div[role="dialog"]').within(() => {
      cy.get('input').first().type('Pedro Detalhes', { force: true })
      cy.get('input[type="email"]').type('pedro.detalhes@test.com', { force: true })
      cy.get('input').eq(2).type('(11) 77777-7777', { force: true })
      cy.contains('Criar').click()
    })

    cy.wait(3000)

    // VIEW - Click on view details button (first button - Visibility icon)
    cy.get('table').within(() => {
      cy.contains('Pedro Detalhes')
        .closest('tr')
        .find('button[color="primary"], button')
        .then($buttons => {
          // Clica no primeiro botão (View)
          cy.wrap($buttons).first().click()
        })
    })

    cy.wait(1000)

    // Verify details dialog opens
    cy.contains('Detalhes do Cliente', { timeout: 5000 }).should('be.visible')
    cy.contains('Pedro Detalhes').should('be.visible')
    cy.contains('pedro.detalhes@test.com').should('be.visible')

    // Close details dialog
    cy.contains('Fechar').click()
    cy.wait(1000)

    // Clean up - delete the test client
    cy.get('table').within(() => {
      cy.contains('Pedro Detalhes')
        .closest('tr')
        .find('button')
        .then($buttons => {
          cy.wrap($buttons).last().click()
        })
    })
    cy.wait(1000)
    cy.contains('Excluir').click()
    cy.wait(3000)
  })

  it('should open and close client dialog without creating', () => {
    // Navigate to admin
    cy.get('header').within(() => {
      cy.get('button, [role="button"], a').then($buttons => {
        cy.wrap($buttons).eq(-2).click()
      })
    })
    cy.contains('Gerenciar Clientes', { matchCase: false }).click()
    cy.wait(3000)

    // Open dialog
    cy.contains('Adicionar Cliente').click()
    cy.wait(1000)

    // Verify dialog is open
    cy.get('div[role="dialog"]').should('be.visible')

    // Verify form fields are present (using more flexible selectors)
    cy.get('div[role="dialog"]').within(() => {
      cy.get('input').should('have.length.at.least', 3) // Should have at least 3 inputs
      cy.get('textarea').should('exist') // Endereço field
      cy.contains('Criar').should('be.disabled') // Should be disabled without required fields
      
      // Click the Cancel button specifically
      cy.contains('Cancelar').should('be.visible').click()
    })

    cy.wait(1000)

    // Verify dialog is closed
    cy.get('div[role="dialog"]').should('not.exist')
  })

  // Test form validation
  it('should validate required fields', () => {
    // Navigate to admin
    cy.get('header').within(() => {
      cy.get('button, [role="button"], a').then($buttons => {
        cy.wrap($buttons).eq(-2).click()
      })
    })
    cy.contains('Gerenciar Clientes', { matchCase: false }).click()
    cy.wait(3000)

    // Open dialog
    cy.contains('Adicionar Cliente').click()
    cy.wait(1000)

    cy.get('div[role="dialog"]').within(() => {
      // Initially, Create button should be disabled
      cy.contains('Criar').should('be.disabled')

      // Fill only name - button should still be disabled
      cy.get('input').first().type('Teste Validação', { force: true })
      cy.contains('Criar').should('be.disabled')

      // Fill email - now button should be enabled
      cy.get('input[type="email"]').type('validacao@test.com', { force: true })
      cy.wait(500)
      cy.contains('Criar').should('not.be.disabled')

      // Clear name - button should be disabled again
      cy.get('input').first().clear({ force: true })
      cy.wait(500)
      cy.contains('Criar').should('be.disabled')

      // Click Cancel to close
      cy.contains('Cancelar').click()
    })

    // Verify dialog is closed
    cy.get('div[role="dialog"]').should('not.exist')
  })
})