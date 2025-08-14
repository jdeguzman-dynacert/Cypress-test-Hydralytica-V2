describe('UC-SLOG-005 – Edit Occurrence', () => {
  beforeEach(() => {
    cy.loginHydralytica();
    cy.visit('/units');
    cy.contains('Units', { timeout: 10000 }).should('be.visible');
  });

  it('should allow editing an existing occurrence', () => {
    cy.selectUnit(0);
    cy.selectOccurrence(0);
    cy.editOccurrence({ technician: 'John Doe', service: 'Replace ECU', resolved: true, summary: 'Updated summary' });
    cy.contains('Occurrence updated successfully').should('exist');
  });
});