describe('Authentication Tests', () => {
    it('should register a new user', () => {
        cy.visit('/register');
        cy.get('input[name="username"]').type('testuser');
        cy.get('input[name="password"]').type('password123');
        cy.get('button[type="submit"]').click();
        cy.contains('Registration successful').should('be.visible');
    });

    it('should log in an existing user', () => {
        cy.visit('/login');
        cy.get('input[name="username"]').type('testuser');
        cy.get('input[name="password"]').type('password123');
        cy.get('button[type="submit"]').click();
        cy.contains('Welcome, testuser').should('be.visible');
    });

    it('should log out the user', () => {
        cy.visit('/dashboard');
        cy.get('button#logout').click();
        cy.contains('You have been logged out').should('be.visible');
    });
});