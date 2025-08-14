describe('UC-SLOG-006 – Sort Occurrences', () => {
  beforeEach(() => {
    cy.loginHydralytica();
    cy.visit('/units');
    cy.contains('Units', { timeout: 10000 }).should('be.visible');
  });

  it('should sort occurrences by each column', () => {
    cy.selectUnit(0);

    // Sort by Date
    cy.get('.occurrence-list-header .date-header').click();
    cy.get('.occurrence-item').first().should('contain.text', 'Expected First Date');

    // Sort by Technician
    cy.get('.occurrence-list-header .technician-header').click();
    cy.get('.occurrence-item').first().should('contain.text', 'Expected First Technician');

    // Sort by Service
    cy.get('.occurrence-list-header .service-header').click();
    cy.get('.occurrence-item').first().should('contain.text', 'Expected First Service');
  });
});
