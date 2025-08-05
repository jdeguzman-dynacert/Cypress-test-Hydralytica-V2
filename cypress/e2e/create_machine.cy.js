describe('Machine Creation Form', () => {
  beforeEach(() => {
    cy.loginHydralytica();
    cy.contains('Dashboard', { timeout: 10000 }).should('be.visible');
    cy.visit('https://hydralytica.com/machines/create');
    cy.contains('Info').should('be.visible');
  });

  it('submits form with machine stationary - no VIN or odometer', () => {
    // Organization
    cy.contains('label', 'Organization')
      .parent()
      .find('button[role="combobox"]')
      .click({ force: true });
    cy.get('[role="option"]', { timeout: 10000 })
      .contains(/^dynaCERT Inc\.$/)
      .click({ force: true });

    // Customer Fleet ID
    cy.get('input[name="customerFleetId"]').type('FLEET-123');

    // Machine Type
    cy.contains('label', 'Machine Type')
      .parent()
      .find('button[role="combobox"]')
      .click({ force: true });
    cy.get('[role="option"]')
      .contains('Dump Truck')
      .click({ force: true });

    // Year
    cy.get('input[name="year"]').clear().type('2024');

    // Machine Manufacturer
    cy.contains('label', 'Machine Manufacturer')
      .parent()
      .find('button[role="combobox"]')
      .click({ force: true });
    cy.get('[role="option"]')
      .contains('CAT')
      .click({ force: true });

    // Engine Manufacturer
    cy.contains('label', 'Engine Manufacturer')
      .parent()
      .find('button[role="combobox"]')
      .click({ force: true });
    cy.get('[role="option"]')
      .contains('Cummins')
      .click({ force: true });

    // Engine Displacement
    cy.get('input[name="engineDisplacementInL"]').clear().type('6.7');

    // Toggle "Is the machine stationary?" ON
    cy.get('button[role="switch"]').click();

    // Submit without VIN or odometer
    cy.contains('button', 'Create').click();

    // Verify creation success
    cy.contains('Machine created').should('exist');
  });

  it('submits form with machine not stationary - fills VIN and odometer', () => {
    // Organization
    cy.contains('label', 'Organization')
      .parent()
      .find('button[role="combobox"]')
      .click({ force: true });
    cy.get('[role="option"]', { timeout: 10000 })
      .contains(/^dynaCERT Inc\.$/)
      .click({ force: true });

    // Customer Fleet ID
    cy.get('input[name="customerFleetId"]').type('FLEET-123');

    // Machine Type
    cy.contains('label', 'Machine Type')
      .parent()
      .find('button[role="combobox"]')
      .click({ force: true });
    cy.get('[role="option"]')
      .contains('Dump Truck')
      .click({ force: true });

    // Year
    cy.get('input[name="year"]').clear().type('2024');

    // Machine Manufacturer
    cy.contains('label', 'Machine Manufacturer')
      .parent()
      .find('button[role="combobox"]')
      .click({ force: true });
    cy.get('[role="option"]')
      .contains('CAT')
      .click({ force: true });

    // Engine Manufacturer
    cy.contains('label', 'Engine Manufacturer')
      .parent()
      .find('button[role="combobox"]')
      .click({ force: true });
    cy.get('[role="option"]')
      .contains('Cummins')
      .click({ force: true });

    // Engine Displacement
    cy.get('input[name="engineDisplacementInL"]').clear().type('6.7');

    // Make sure "Is the machine stationary?" is OFF (default)
    // so we do NOT click the toggle

    // Fill VIN
    cy.get('input[name="vin"]').type('1HGCM82633A004352');

    // Fill odometer
    cy.get('input[name="odometerInKm"]').clear().type('12345');

    // Submit form
    cy.contains('button', 'Create').click();

    // Verify creation success
    cy.contains('Machine created').should('exist');
  });
});
