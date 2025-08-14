describe('UC-SLOG-003 – Display Occurrence', () => {
  beforeEach(() => {
    cy.loginHydralytica();
    cy.visit('/units');
    cy.contains('Units', { timeout: 10000 }).should('be.visible');
  });

  it('should display occurrence content', () => {
    cy.selectUnit(0);
    cy.selectOccurrence(0);

    cy.get('.occurrence-details').within(() => {
      cy.get('.date').should('exist');
      cy.get('.created-by').should('exist');
      cy.get('.technician').should('exist');
      cy.get('.service').should('exist');
      cy.get('.summary').should('exist');
      cy.get('.resolved').should('exist');
      cy.get('.pictures').should('exist');
    });
  });
});