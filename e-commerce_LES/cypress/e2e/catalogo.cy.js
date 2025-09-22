describe('Catalog Tests', () => {
    it('should display products correctly', () => {
        cy.visit('/catalogo');
        cy.get('.product').should('have.length.greaterThan', 0);
    });

    it('should filter products', () => {
        cy.visit('/catalogo');
        cy.get('.filter-button').click();
        cy.get('.filter-option').first().click();
        cy.get('.product').should('have.length.greaterThan', 0);
    });

    it('should access product details', () => {
        cy.visit('/catalogo');
        cy.get('.product').first().click();
        cy.url().should('include', '/produto/');
        cy.get('.product-details').should('be.visible');
    });
});