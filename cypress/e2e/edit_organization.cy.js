// cypress/e2e/edit_organization.cy.js
import { logTestResult } from '../support/utils/utils';

describe('Hydralytica v2 - Edit Organization Tests', () => {
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

  // Helper to click edit (pencil) on the first card
  function clickEditFirstCard() {
    cy.get('[data-slot="card"]').first().within(() => {
      cy.get('a[aria-label="Update"]').click({ force: true });
    });
  }


  // ------------------ POSITIVE TESTS ------------------
it('should navigate to the organization edit page when clicking Edit', () => {
  // Get the first row
  cy.get('tbody tr[data-slot="table-row"]').first().within(() => {
    // Get the anchor element for Edit
    cy.get('a[aria-label="Update"]', { timeout: 10000 })
      .should('be.visible')       // ensure it's visible
      .and('have.attr', 'href')   // check that href exists
      .then(($el) => {
        // Optionally confirm href matches expected pattern
        const href = $el.attr('href');
        expect(href).to.match(/\/organizations\/\d+$/);

        // Click the actual element
        cy.wrap($el).click({ force: true });
      });
  });

  // Verify the URL contains the organization id
  cy.url({ timeout: 10000 }).should('match', /\/organizations\/\d+$/);

  // Optionally verify the edit page loaded
  cy.get('textarea[name="notes"]').should('be.visible');
});



/*
  it('UC-ORG-002: should edit first organization and save updated values', () => {
    clickEditFirstCard();

    // Assert URL includes organization ID
    cy.url().should('match', /\/organizations\/\d+$/);

    // Update fields
    cy.get('textarea[name="notes"]').clear().type(updatedNotes);
    cy.get('input[name="addressFields.city"]').clear().type(updatedCity);
    cy.get('input[name="addressFields.zipCode"]').clear().type(updatedZip);
    cy.get('input[name="contactFields.contact"]').clear().typeInstant(newEmail);

    cy.contains('button', 'Update').click();

    cy.contains('Organization updated successfully', { timeout: 10000 }).should('be.visible');

    // Return to list and assert updates visible
    cy.visit('/organizations');
    cy.get('[data-slot="card"]').first().within(() => {
      cy.contains(updatedCity).should('exist');
      cy.contains(newEmail).should('exist');
    });
  });

  it('UC-ORG-003: should assign a parent organization', () => {
    clickEditFirstCard();

    cy.get('select[name="parentOrganizationId"]').select('dynaCERT Inc');
    cy.contains('button', 'Update').click();
    cy.contains('Organization updated successfully', { timeout: 10000 }).should('be.visible');

    cy.visit('/organizations');
    cy.get('[data-slot="card"]').first().should('contain.text', 'dynaCERT Inc');
  });

  it('UC-ORG-005: should download CSV of organizations', () => {
    cy.contains('Download CSV').click();
    cy.readFile('cypress/downloads/organizations.csv').should('contain', 'Organization Name');
  });

  it('UC-ORG-004: should search organization by city or name', () => {
    const searchTerm = 'Toronto';
    cy.get('input[placeholder*="Search"]').type(`${searchTerm}{enter}`);
    cy.contains('[data-slot="card"]', searchTerm).should('exist');
  });

  it('UC-ORG-006: should sort organization list by name', () => {
    cy.get('[data-cy="sort-dropdown"]').click();
    cy.contains('Sort by Name').click();
    cy.get('[data-slot="card"]').first().should('exist');
  });

  it('UC-ORG-007: should highlight organizations with active units', () => {
    cy.get('[data-slot="card"]').each(($card) => {
      if ($card.text().includes('Active Units')) {
        cy.wrap($card).should('have.class', 'highlighted');
      }
    });
  });

  it('UC-ORG-008: should log changes in activity log', () => {
    cy.visit('/activity-log');
    cy.contains('Updated Organization').should('exist');
    cy.contains(newEmail).should('exist');
  });

  // ------------------ NEGATIVE TESTS ------------------
  it('should disable update if required fields are empty', () => {
    clickEditFirstCard();
    cy.get('input[name="contactFields.contact"]').clear();
    cy.contains('button', 'Update').should('be.disabled');
  });

  it('should show error on server failure during update', () => {
    cy.intercept('PUT', '/organizations/*', {
      statusCode: 500,
      body: { error: 'Update failed' },
    }).as('updateFail');

    clickEditFirstCard();
    cy.get('textarea[name="notes"]').clear().type('Testing server failure');
    cy.contains('button', 'Update').click();

    cy.wait('@updateFail');
    cy.contains('An error occurred while updating organization').should('be.visible');
  });

  it('should not break on invalid parent assignment', () => {
    clickEditFirstCard();
    cy.get('select[name="parentOrganizationId"]').select('---Invalid---', { force: true });
    cy.contains('button', 'Update').click();
    cy.contains('An error occurred while updating organization').should('be.visible');
  });

  it('should cancel edit and return to organization list', () => {
    clickEditFirstCard();
    cy.contains('button', 'Cancel').click();
    cy.url().should('include', '/organizations');
  });
  */
});
