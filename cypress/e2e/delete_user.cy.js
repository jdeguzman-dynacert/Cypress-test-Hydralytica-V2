// cypress/e2e/delete_user.cy.js

describe('Hydralytica - Delete Test User', () => {
  const testEmail = '@cypresstest.com'; // Looks for first matching test user

  beforeEach(() => {
    cy.loginHydralytica(); // Custom login command
    cy.visit('/users');
    cy.contains('Dashboard', { timeout: 10000 }).should('be.visible');
  });

  it('🗑️ Deletes the first user with @cypresstest.com', () => {
    // Find the first row containing a Cypress test email and delete it
    cy.contains('td', testEmail, { timeout: 10000 })
      .first()
      .parents('tr')
      .within(() => {
        cy.get('button svg.lucide-trash')
          .first()
          .parents('button')
          .click(); // Click the delete (trash) button
      });

    // Confirm deletion in the modal
  //  cy.contains('button', 'Confirm', { timeout: 5000 }).click();

     // Wait for the delete confirmation dialog to appear
    cy.get('div[role="dialog"][aria-describedby="Delete user modal"]', { timeout: 10000 })
      .should('be.visible')
      .within(() => {
        // Click the Delete button inside the dialog to confirm
        cy.contains('button', 'Delete').click();
      });

    // Verify user is gone
    cy.contains('td', testEmail).should('not.exist');
  });
});
