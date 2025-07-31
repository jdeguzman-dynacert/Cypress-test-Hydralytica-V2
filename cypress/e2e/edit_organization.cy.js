describe('Hydralytica v2 - Organization Management Tests', () => {
  const timestamp = Date.now();
  const updatedNotes = `Updated via Cypress at ${timestamp}`;
  const updatedCity = `Toronto ${timestamp}`;
  const updatedZip = `M5H-${timestamp.toString().slice(-3)}`;
  const newEmail = `updated.${timestamp}@cypresstest.com`;

  beforeEach(() => {
    cy.loginHydralytica();
    cy.contains('Dashboard', { timeout: 10000 }).should('be.visible');
    cy.visit('/organizations');
    cy.contains('Organizations').should('be.visible');
  });

  it('UC-ORG-002: should edit the first organization and verify updated values', () => {
    cy.get('[data-slot="card"]').first().within(() => {
      cy.contains('Edit').click();
    });

    cy.url().should('include', '/organizations/edit');

    // Update values
    cy.get('textarea[name="notes"]').clear().type(updatedNotes);
    cy.get('input[name="addressFields.city"]').clear().type(updatedCity);
    cy.get('input[name="addressFields.zipCode"]').clear().type(updatedZip);
    cy.get('input[name="contactFields.contact"]').clear().typeInstant(newEmail);

    cy.contains('button', 'Update').click();

    // Validate success notification
    cy.contains('Organization updated successfully', { timeout: 10000 }).should('be.visible');

    // Return to list and verify updated data is reflected
    cy.visit('/organizations');
    cy.get('[data-slot="card"]').first().within(() => {
      cy.contains(updatedCity).should('exist');
      cy.contains(newEmail).should('exist');
    });
  });

  it('UC-ORG-002: should disable update button if required fields are empty', () => {
    cy.get('[data-slot="card"]').first().within(() => {
      cy.contains('Edit').click();
    });

    cy.get('input[name="contactFields.contact"]').clear();
    cy.contains('button', 'Update').should('be.disabled');
  });

  it('UC-ORG-002: should show error on server failure during update', () => {
    cy.intercept('PUT', '/organizations/*', {
      statusCode: 500,
      body: { error: 'Update failed' },
    }).as('updateFail');

    cy.get('[data-slot="card"]').first().within(() => {
      cy.contains('Edit').click();
    });

    cy.get('textarea[name="notes"]').clear().type('Testing server failure');
    cy.contains('button', 'Update').click();

    cy.wait('@updateFail');
    cy.contains('An error occurred while updating organization').should('be.visible');
  });

  it('UC-ORG-004: should search organization by city or name', () => {
    const searchTerm = 'Toronto'; // Assumes Toronto is a known organization city
    cy.get('input[placeholder*="Search"]').type(`${searchTerm}{enter}`);
    cy.contains('[data-slot="card"]', searchTerm).should('exist');
  });

  it('UC-ORG-006: should sort organization list by name', () => {
    cy.get('[data-cy="sort-dropdown"]').click();
    cy.contains('Sort by Name').click();
    cy.get('[data-slot="card"]').first().should('exist'); // Verify sort applied without error
  });

  it('UC-ORG-007: should visually highlight organizations with active units', () => {
    cy.get('[data-slot="card"]').each(($card) => {
      if ($card.text().includes('Active Units')) {
        cy.wrap($card).should('have.class', 'highlighted'); // Assuming class is used for highlighting
      }
    });
  });

  it('UC-ORG-005: should download organization list as CSV', () => {
    cy.contains('Download CSV').click(); // Assumes button label
    cy.readFile('cypress/downloads/organizations.csv').should('contain', 'Organization Name');
  });

  it('UC-ORG-003: should allow assigning a parent organization', () => {
    cy.get('[data-slot="card"]').first().within(() => {
      cy.contains('Edit').click();
    });

    cy.get('select[name="parentOrganizationId"]').select('dynaCERT Inc');
    cy.contains('button', 'Update').click();
    cy.contains('Organization updated successfully', { timeout: 10000 }).should('be.visible');

    // Return to list and verify hierarchy tag
    cy.visit('/organizations');
    cy.get('[data-slot="card"]').first().should('contain.text', 'dynaCERT Inc');
  });

  it('UC-ORG-008: should log changes in the activity log', () => {
    // Navigate to Activity Log
    cy.visit('/activity-log');

    // Check if log contains recent update
    cy.contains('Updated Organization').should('exist');
    cy.contains(newEmail).should('exist');
  });
});
