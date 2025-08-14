describe('UC-SLOG-002 – List Occurrences', () => {
  beforeEach(() => {
    cy.loginHydralytica();
    cy.visit('/units');
    cy.contains('Units', { timeout: 10000 }).should('be.visible');
  });

  it('should list all occurrences of a selected unit', () => {
    cy.selectUnit(0);
    cy.get('.occurrence-list').should('exist');
    cy.get('.occurrence-list .occurrence-item').should('have.length.greaterThan', 0);
    cy.selectOccurrence(0);
    cy.get('.occurrence-details').should('exist');
  });
});