describe('Shopping Cart Functionality', () => {
    beforeEach(() => {
        cy.visit('/'); // Visit the base URL of your application
    });

    it('should add an item to the cart', () => {
        cy.get('.product').first().click(); // Click on the first product
        cy.get('.add-to-cart').click(); // Click on the add to cart button
        cy.get('.cart').click(); // Open the cart
        cy.get('.cart-item').should('have.length', 1); // Check if the cart has one item
    });

    it('should remove an item from the cart', () => {
        cy.get('.product').first().click();
        cy.get('.add-to-cart').click();
        cy.get('.cart').click();
        cy.get('.remove-from-cart').click(); // Click to remove the item
        cy.get('.cart-item').should('have.length', 0); // Check if the cart is empty
    });

    it('should update the total price correctly', () => {
        cy.get('.product').first().click();
        cy.get('.add-to-cart').click();
        cy.get('.cart').click();
        cy.get('.total-price').should('contain', 'Expected Price'); // Replace with expected price
    });
});