describe('UC-SLOG-001 – List Units', () => {
  beforeEach(() => {
    cy.loginHydralytica();
    cy.visit('/units');
    cy.contains('Units', { timeout: 10000 }).should('be.visible');
  });

  it('should list all units and navigate between them', () => {
    cy.get('.unit-list').should('exist').and('have.length.greaterThan', 0);
    cy.selectUnit(0);
    cy.url().should('include', '/unit/');
    cy.get('.unit-details').should('exist');
  });
});
