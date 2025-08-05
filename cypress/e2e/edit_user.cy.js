// cypress/e2e/edit_user_full.cy.js
// Main test suite for editing a user with various input validations and flows
describe('Hydralytica - Full Edit User Flow', () => {
  // Timestamp to generate unique data for each test run
  const timestamp = Date.now();
  const testEmail = '@cypresstest.com'; // Email fragment to find the test user row
  const newEmail = `updated.user.${timestamp}@cypresstest.com`; // New email for update tests

  // Custom Cypress command to wait for a success toast notification with default or custom text
  Cypress.Commands.add('waitForSuccessToast', (text = 'Updated Successfully!') => {
    // Wait for the toast message to appear somewhere in the body (case-insensitive)
    cy.contains(new RegExp(text, 'i'), { timeout: 10000 }).should('exist');
    cy.get('body').contains(new RegExp(text, 'i'), { timeout: 10000 }).should('exist');
    cy.get('body').then(($body) => {
      // Find last toast matching the text and verify visibility
      const $toast = $body.find(`:contains(${text})`).last();
      if ($toast.length) cy.wrap($toast).should('be.visible');
    });
  });

  // Runs before each test case: login, visit users page, locate the test user and open edit page
  beforeEach(() => {
    cy.loginHydralytica(); // Custom login command
    cy.visit('https://hydralytica.com/users');
    cy.contains('Dashboard', { timeout: 10000 }).should('be.visible'); // Verify page loaded

    // Find the table cell containing the test email fragment, then click the Update link in the same row
    cy.contains('td', testEmail, { timeout: 10000 })
      .parents('tr')
      .within(() => cy.get('a[aria-label="Update"]').click());

    // Confirm the URL pattern matches a user edit page with numeric user ID
    cy.url().should('match', /\/users\/\d+$/);
  });

  // Test case: Update the user's first and last name with unique timestamped values
  it('Updates First and Last Name (timestamped)', () => {
    cy.get('input[name="name"]').clear().type(`UpdatedFirst-${timestamp}`);
    cy.get('input[name="lastName"]').clear().type(`UpdatedLast-${timestamp}`);
    cy.contains('button', 'Update').click(); // Submit changes
    cy.waitForSuccessToast(); // Wait for success notification
  });

  // Test case: Update the user's login email with a new unique email
  it('Updates Login Email (timestamped)', () => {
    // Click the pencil icon button next to the email field to enable editing
    cy.get('button svg.lucide-pencil').first().parents('button').click();
    cy.get('input[name="contactFields.contact"]').clear().type(newEmail);
    cy.contains('button', 'Update').click();
    cy.waitForSuccessToast();
  });

  // Test case: Update the residential address fields with new unique timestamped data
  it('Updates Residential Address (timestamped)', () => {
    // Find the row labeled "Residential" and click the edit pencil button
    cy.contains('td', 'Residential').parent('tr').find('button svg.lucide-pencil').parents('button').click();

    // Fill out each address field with new timestamped values
    cy.get('input[name="addressFields.country"]').clear().type(`Canada-${timestamp}`);
    cy.get('input[name="addressFields.city"]').clear().type(`Vancouver-${timestamp}`);
    cy.get('input[name="addressFields.address"]').clear().type(`987 Updated Street ${timestamp}`);
    cy.get('input[name="addressFields.zipCode"]').clear().type('A1B2C3');

    // Submit changes and wait for confirmation
    cy.contains('button', 'Update').click();
    cy.waitForSuccessToast();

    // Verify that the updated values appear in the Residential row
    cy.contains('td', 'Residential').parent('tr').within(() => {
      cy.contains(`Canada-${timestamp}`);
      cy.contains(`Vancouver-${timestamp}`);
      cy.contains(`987 Updated Street ${timestamp}`);
    });
  });

  // Test case: Verify form validation blocks submission when required address fields are empty
  it('Blocks empty required fields', () => {
    cy.contains('td', 'Residential').parent('tr').find('button svg.lucide-pencil').parents('button').click();

    // Clear required address fields and trigger validation (blur)
    cy.get('input[name="addressFields.country"]').clear().blur();
    cy.get('input[name="addressFields.city"]').clear().blur();
    cy.get('input[name="addressFields.address"]').clear().blur();

    // Expect the inputs to have aria-invalid attribute set to true indicating validation errors
    cy.get('input[name="addressFields.country"]').should('have.attr', 'aria-invalid', 'true');
    cy.get('input[name="addressFields.city"]').should('have.attr', 'aria-invalid', 'true');
    cy.get('input[name="addressFields.address"]').should('have.attr', 'aria-invalid', 'true');

    // The Update button should be disabled because required fields are invalid
    cy.contains('button', 'Update').should('be.disabled');
  });

  // Test case: Invalid zip code input should trigger validation and disable update
  it('Blocks invalid Zip Code', () => {
    cy.contains('td', 'Residential').parent('tr').find('button svg.lucide-pencil').parents('button').click();

    // Enter invalid zip code and trigger validation
    cy.get('input[name="addressFields.zipCode"]').clear().type('###').blur();

    // Check aria-invalid attribute on zip code field
    cy.get('input[name="addressFields.zipCode"]').should('have.attr', 'aria-invalid', 'true');

    // Update button must be disabled
    cy.contains('button', 'Update').should('be.disabled');
  });

  // Test case: Change the address type from dropdown and verify update success
  it('Changes Address Type via dropdown', () => {
    cy.contains('td', 'Residential').parent('tr').find('button svg.lucide-pencil').parents('button').click();

    // Open combobox dropdown for address type
    cy.get('button[role="combobox"]').click();

    // Select the "Billing" option from the hidden select element
    cy.get('select[aria-hidden="true"] option').contains('Billing').then(option => {
      cy.wrap(option).then(opt => cy.get('select[aria-hidden="true"]').select(opt.val()));
    });

    cy.contains('button', 'Update').click(); // Submit changes
    cy.waitForSuccessToast();

    // Verify that the row now shows "Billing" as address type
    cy.contains('td', 'Billing').should('exist');
  });

  // Test case: Sequentially update the Residential and Business address rows with unique data
  it('Sequentially updates Residential & Business rows (timestamped)', () => {
    // Update Residential city
    cy.contains('td', 'Residential').parent('tr').find('button svg.lucide-pencil').parents('button').click();
    cy.get('input[name="addressFields.city"]').clear().type(`Toronto-${timestamp}`);
    cy.contains('button', 'Update').click();
    cy.waitForSuccessToast();

    // Update Business city
    cy.contains('td', 'Business').parent('tr').find('button svg.lucide-pencil').parents('button').click();
    cy.get('input[name="addressFields.city"]').clear().type(`New York-${timestamp}`);
    cy.contains('button', 'Update').click();
    cy.waitForSuccessToast();

    // Verify both updated cities appear correctly
    cy.contains('td', 'Residential').parent('tr').within(() => cy.contains(`Toronto-${timestamp}`));
    cy.contains('td', 'Business').parent('tr').within(() => cy.contains(`New York-${timestamp}`));
  });

  // Test case: Verify sorting of the user list by Country column ascending and descending
  it('Sorts by Country (ascending & descending)', () => {
    // Click Country column header to sort ascending
    cy.get('th').contains('Country').click();
    cy.get('tbody tr').then(rows => {
      const countries = [...rows].map(r => r.cells[1].innerText);
      // Check if countries are sorted ascending
      expect(countries).to.deep.equal([...countries].sort());
    });

    // Click Country header again to sort descending
    cy.get('th').contains('Country').click();
    cy.get('tbody tr').then(rows => {
      const countries = [...rows].map(r => r.cells[1].innerText);
      // Check if countries are sorted descending
      expect(countries).to.deep.equal([...countries].sort().reverse());
    });
  });

  // Test case: Delete the Business address row and confirm it's removed from the list
  it('Deletes Business row', () => {
    // Find Business row and click trash/delete button
    cy.contains('td', 'Business').parent('tr').find('button svg.lucide-trash').parents('button').click();

    // Confirm deletion in modal dialog
    cy.contains('button', 'Confirm').click();

    // Verify Business row no longer exists
    cy.contains('td', 'Business').should('not.exist');
  });

  // Test case: Cancel editing a row and verify no changes are saved
  it('Cancels edit without saving changes', () => {
    // Edit Residential row
    cy.contains('td', 'Residential').parent('tr').find('button svg.lucide-pencil').parents('button').click();

    // Change city input value
    cy.get('input[name="addressFields.city"]').clear().type(`ShouldNotSave-${timestamp}`);

    // Click Cancel button instead of Update
    cy.contains('button', 'Cancel').click();

    // Verify the change did NOT persist on the row after cancel
    cy.contains('td', 'Residential').parent('tr').within(() => {
      cy.contains(`ShouldNotSave-${timestamp}`).should('not.exist');
    });
  });
});
