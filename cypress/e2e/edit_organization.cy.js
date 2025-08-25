// cypress/e2e/edit_organization.cy.js
import { logTestResult } from '../support/utils/utils';
import { validationErrors, statusErrors } from '../support/utils/errorMessages';
import { successMessages } from '../support/utils/successMessages';

describe('Hydralytica v2 - Edit Organization Tests', () => {
  const timestamp = Date.now();
  const updatedNotes = `Updated via Cypress at ${timestamp}`;
  const updatedCity = `Toronto ${timestamp}`;
  const updatedZip = `M5H-${timestamp.toString().slice(-3)}`;
  const newEmail = `updated.${timestamp}@cypresstest.com`;

  beforeEach(() => {
    cy.loginHydralytica();
    cy.contains('Dashboard', { timeout: 2000 }).should('be.visible');
    cy.visit('/organizations');
    cy.contains('Organizations').should('be.visible');
  });

  // ✅ Helper: Click Edit (pencil) for the first organization in the list
  function clickEditFirstCard() {
    cy.get('tbody tr[data-slot="table-row"]').first().within(() => {
      cy.get('a[aria-label="Update"]', { timeout: 2000 })
        .should('be.visible')
        .then(($el) => {
          const href = $el.attr('href');
          expect(href).to.match(/\/organizations\/\d+$/); // validate href format
          cy.wrap($el).click({ force: true });
        });
    });
  }

  // ------------------ ✅ POSITIVE TEST CASES ------------------

  // it('UC-ORG-001: should navigate to organization edit page when clicking Edit', () => {
  //   clickEditFirstCard();
  //   cy.url().should('match', /\/organizations\/\d+$/);
  //   cy.get('textarea[name="notes"]').should('be.visible');
  // });

  // it('UC-ORG-002: should edit organization fields and save updated values', () => {
  //   clickEditFirstCard();
  //   cy.url().should('match', /\/organizations\/\d+$/);

  //   // Update fields
  //   cy.get('textarea[name="notes"]').clear().type(updatedNotes);
  //   cy.get('input[name="addressFields.city"]').clear().type(updatedCity);
  //   cy.get('input[name="addressFields.zipCode"]').clear().type(updatedZip);
  //   cy.get('input[name="contactFields.contact"]').clear().typeInstant(newEmail);

  //   cy.contains('button', 'Update').click();
  //   cy.contains(successMessages.update, { timeout: 2000 }).should('be.visible');
  // });


  // it('UC-ORG-003: should assign a different parent organization and save', () => {
  //   clickEditFirstCard();

  //   // Find the "Parent Organization" combobox via its label and alias the button
  //   cy.contains('label[data-slot="form-label"]', /^Parent Organization\b/, { timeout: 2000 })
  //     .parents('[data-slot="form-item"]')
  //     .find('button[role="combobox"]')
  //     .as('parentCombo')
  //     .should('be.visible');

  //   // Grab current value from the button, open the listbox, pick a different option
  //   cy.get('@parentCombo')
  //     .find('[data-slot="select-value"]')
  //     .invoke('text')
  //     .then((currentRaw) => {
  //       const current = currentRaw.trim();

  //       // Open the combobox
  //       cy.get('@parentCombo').click({ force: true });
  //       cy.get('div[role="listbox"]', { timeout: 2000 }).should('be.visible');

  //       // Choose an alternative option (avoid "None" and the current value)
  //       cy.get('div[role="listbox"] [role="option"]').then(($opts) => {
  //         const labels = [...$opts].map((el) => el.innerText.trim());
  //         const bad = new Set(['', 'None', '—', '-', 'Select...', current]);
  //         const newLabel = labels.find((l) => !bad.has(l));

  //         if (!newLabel) {
  //           // No alternative available — close and log (don’t fail the test)
  //           cy.get('body').type('{esc}');
  //           cy.log('No alternate parent organization available, skipping selection change');
  //           return;
  //         }

  //         // Click the new option
  //         cy.contains('div[role="listbox"] [role="option"]', newLabel).click({ force: true });

  //         // Verify the button text updated
  //         cy.get('@parentCombo')
  //           .find('[data-slot="select-value"]')
  //           .should('contain.text', newLabel);
  //       });
  //     });

  //   // Save the change
  //   cy.contains('button', 'Update').click();

  //   // Verify success toast/snackbar
  //   cy.contains(successMessages.update, { timeout: 2000 }).should('be.visible');
  // });


  it('UC-ORG-004: should add a new contact and save', () => {
    clickEditFirstCard();
    const email = `contact.${timestamp}@test.com`;

    // === Fill Contact Type (scoped by label) ===
    cy.contains('label', 'Contact Type')
      .parent('[data-slot="form-item"]')
      .find('select')
      .select('3', { force: true }); // value="3" → Business Email

    // === Fill Contact Info ===
    cy.get('input[name="contactFields.contact"]', { timeout: 2000 })
      .last()
      .clear({ force: true })
      .type(email, { delay: 50 })
      .invoke('val')
      .then((val) => {
        // Log what actually got typed for debugging
        cy.log(`Typed value: ${val}`);

        // === Optional: Fill Description ===
        cy.get('textarea[name="contactFields.description"]').last()
          .type('Automated test contact');

        // === Click Add ===
        cy.contains('button', /^Add$/, { timeout: 2000 })
          .should('be.visible')
          .click({ force: true });

        // Assert row was inserted into the table before saving
        cy.contains('td', val).should('be.visible');

        // === Click Update ===
        cy.contains('button', 'Update').click();

        // === Verify success ===
        cy.contains(successMessages.update, { timeout: 2000 }).should('be.visible');
      });
  });


  ////✅ UC-ORG-005 Fix
  it('UC-ORG-005: should update name, type, and address fields together', () => {
    clickEditFirstCard();
    cy.get('input[name="name"]').clear().type(`Updated Org ${timestamp}`);

    // Handle Organization Type dropdown (combobox)
cy.contains('label[data-slot="form-label"]', 'Organization Type')
  .parent('[data-slot="form-item"]')
  .find('select')           // target the hidden <select> inside the custom combo
  .select('3', { force: true }); // value="3" → Education



    // === Click pencil button for contact ===
    // === Click pencil button for the first contact row ===
cy.get('table[data-slot="table"] tbody tr')
  .first() // or use .contains('td', 'contact@example.com') if you know the value
  .find('button svg.lucide-pencil')
  .parents('button')
  .click({ force: true });

    const newContact = `contact.${timestamp}@test.com`;

    // === Fill Contact Info ===
    cy.get('input[name="contactFields.contact"]', { timeout: 2000 })
      .clear()
      .type(newContact, { delay: 50 })
      .should('have.value', newContact);

    // === Click the small Update button in Contact section ===
    cy.contains('button', /^Update$/).click({ force: true });

    cy.contains('button', 'Update').click();
    cy.contains(successMessages.update, { timeout: 2000 }).should('be.visible');
  });

  // ✅ UC-ORG-006 Fix
  it('UC-ORG-006: should remove a contact and save', () => {
  clickEditFirstCard();

  // Get the first contact row in the table
  cy.get('table[data-slot="table"] tbody tr')
    .first()
    .as('firstContactRow');

  // Capture the contact value for assertion
  cy.get('@firstContactRow').find('td').eq(1).invoke('text').as('contactValue');

  // Click the delete (trash) button in that row
  cy.get('@firstContactRow')
    .find('button svg.lucide-trash')
    .parents('button')
    .click({ force: true });

  // Click main Update button to save changes
  cy.contains('button', 'Update').click();

  // Verify success message
  cy.contains(successMessages.update, { timeout: 2000 }).should('be.visible');

});


  // // ------------------ ❌ NEGATIVE TEST CASES ------------------//

  it('UC-ORG-007: should disable update when Name is empty', () => {
    clickEditFirstCard();
    cy.get('input[name="name"]').clear();
    cy.contains('button', 'Update').click();
    cy.contains(validationErrors.required, { timeout: 2000 }).should('be.visible');
  });

  it('UC-ORG-008: should show validation error for invalid email', () => {
    clickEditFirstCard();
    cy.get('input[name="contactFields.contact"]').clear().type('invalid-email');
    cy.contains('button', 'Update').click();
    cy.contains(validationErrors.invalidEmail).should('be.visible');
  });

  it('UC-ORG-009: should show validation error for invalid zip code', () => {
    clickEditFirstCard();
    cy.get('input[name="addressFields.zipCode"]').clear().type('12');
    cy.contains('button', 'Update').click();
    cy.contains(validationErrors.invalidZip).should('be.visible');
  });

  it('UC-ORG-010: should handle duplicate organization name error', () => {
    cy.intercept('PUT', '/organizations/*', {
      statusCode: 400,
      body: { error: 'Organization name already exists' },
    }).as('updateFail');

    clickEditFirstCard();
    cy.get('input[name="name"]').clear().type('Existing Org');
    cy.contains('button', 'Update').click();

    cy.wait('@updateFail');
    cy.contains('Organization name already exists').should('be.visible');
  });

  it('UC-ORG-011: should cancel edit and return to organization list', () => {
    clickEditFirstCard();
    cy.get('input[name="addressFields.city"]').clear().type('TemporaryCity');
    cy.contains('button', 'Cancel').click();
    cy.url().should('include', '/organizations');
  });

  // ------------------ ⚠️ EDGE CASE TESTS ------------------//

  it('UC-ORG-012: should handle adding multiple contacts (stress test)', () => {
  clickEditFirstCard();

  const contactCount = 5; // Number of contacts to add

  for (let i = 0; i < contactCount; i++) {
    const email = `contact.${timestamp}-${i}@test.com`;

    // === Fill Contact Type (scoped by label) ===
    cy.contains('label', 'Contact Type')
      .parent('[data-slot="form-item"]')
      .find('select')
      .select('3', { force: true }); // value="3" → Business Email

    // === Fill Contact Info ===
    cy.get('input[name="contactFields.contact"]', { timeout: 2000 })
      .last()
      .clear({ force: true })
      .type(email, { delay: 50 })
      .invoke('val')
      .then((val) => {
        // Log what actually got typed
        cy.log(`Typed value: ${val}`);

        // === Optional: Fill Description ===
        cy.get('textarea[name="contactFields.description"]').last()
          .type('Automated test contact');

        // === Click Add ===
        cy.contains('button', /^Add$/, { timeout: 2000 })
          .should('be.visible')
          .click({ force: true });

        // Assert row was inserted into the table before saving
        cy.contains('td', val).should('be.visible');
      });
  }

  // === Click main Update button after adding all contacts ===
  cy.contains('button', 'Update').click();

  // === Verify success ===
  cy.contains(successMessages.update, { timeout: 2000 }).should('be.visible');
});


  // it('UC-ORG-013: should not handle very long Notes input (boundary test)', () => {
  //   clickEditFirstCard();
  //   const longNotes = 'A'.repeat(2000);
  //   cy.get('textarea[name="notes"]').clear().type(longNotes);
  //   cy.contains('button', 'Update').click();
  //   cy.contains(validationErrors.tooLong, { timeout: 2000 }).should('be.visible');
  // });

  // it('UC-ORG-014: should allow special characters in Name and Notes', () => {
  //   clickEditFirstCard();
  //   cy.get('input[name="name"]').clear().type(`Org @#$%^&*()_+`);
  //   cy.get('textarea[name="notes"]').clear().type(`Notes with symbols: @#$%^&*()`);
  //   cy.contains('button', 'Update').click();
  //   cy.contains(successMessages.update, { timeout: 2000 }).should('be.visible');
  // });

});
