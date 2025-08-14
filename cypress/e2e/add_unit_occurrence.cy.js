describe('UC-SLOG-004 – Add Occurrence', () => {
  beforeEach(() => {
    cy.loginHydralytica();
    cy.visit('/units');
    cy.contains('Units', { timeout: 10000 }).should('be.visible');
  });

  it('should allow adding a new occurrence', () => {
    cy.selectUnit(0);
    cy.addOccurrence({ service: 'Maintenance', resolved: true, summary: 'Test summary' });
    cy.contains('Occurrence added successfully').should('exist');
  });
});
