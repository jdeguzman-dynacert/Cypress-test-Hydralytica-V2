// Main test suite for creating an organization with various input validations
describe('Hydralytica v2 - Create Organization with Extensive Validations', () => {
  // Generate a unique timestamp to ensure test data is unique each time the test runs
  const timestamp = Date.now();
  const uniqueOrgName = `My Cypress Organization ${timestamp}`;
  const uniqueEmail = `contact.${timestamp}@cypresstest.com`;

  // Runs before each individual test
  beforeEach(() => {
    // Log in to the application (uses custom Cypress command)
    cy.loginHydralytica();

    // Ensure we're on the dashboard page before proceeding
    cy.contains('Dashboard', { timeout: 10000 }).should('be.visible');

    // Navigate directly to the organization creation page
    cy.visit('https://hydralytica.com/organizations/create');
  });

  // ✅ Test: Create a new organization with valid inputs
  it('creates a new organization with valid inputs', () => {
    // Fill in the organization name
    cy.get('input[name="name"]').clear().type(uniqueOrgName);

    // Select organization type from the first dropdown
    cy.get('select[aria-hidden="true"]').eq(0).select('Corporate', { force: true });

    // Select the parent organization from the second dropdown
    cy.get('select[aria-hidden="true"]').eq(1)
      .find('option').contains('dynaCERT Inc.')
      .then($option => {
        cy.get('select[aria-hidden="true"]').eq(1).select($option.attr('value'), { force: true });
      });

    // Fill in optional notes
    cy.get('textarea[name="notes"]').clear().type('Test org created by Cypress.');

    // Fill in the main contact email
    cy.get('input[name="contactFields.contact"]').clear().type(uniqueEmail);

    // Fill in a description for the contact
    cy.get('textarea[name="contactFields.description"]').clear().type('Main contact email.');

    // Add contact information (clicks the first "Add" button in the section)
    cy.contains('button', 'Add').eq(0).should('be.visible').click({ force: true });

    // Fill in address fields
    cy.get('input[name="addressFields.country"]').clear().type('Canada');
    cy.get('input[name="addressFields.city"]').clear().type('Toronto');
    cy.get('input[name="addressFields.address"]').clear().type('123 Queen Street');
    cy.get('input[name="addressFields.zipCode"]').clear().type('M5H 2N2');
    cy.get('input[name="addressFields.reference"]').clear().type('Suite 500');
    cy.get('input[name="addressFields.description"]').clear().type('Head office location.');

    // Pause briefly to ensure UI is ready
    cy.wait(1000);

    // Add address to the organization record
    cy.contains('div[data-slot="card-title"]', 'Address')
      .parents('[data-slot="card"]')
      .within(() => {
        cy.contains('button', 'Add').click();
      });

    // Submit the form to create the organization
    cy.contains('button', 'Create', { timeout: 10000 }).click();

    // (Optional) Add assertions to verify successful creation
  });

  // ❌ Edge Case: Reject overly long organization name
  it('rejects overly long organization name', () => {
    const longName = 'A'.repeat(256); // Exceeds character limit
    cy.get('input[name="name"]').clear().type(longName);
    cy.contains('button', 'Create').should('be.disabled'); // Submission should be blocked
  });

  // ❌ Edge Case: Reject overly short organization name
  it('rejects overly short organization name', () => {
    cy.get('input[name="name"]').clear().type('A');
    cy.contains('button', 'Create').should('be.disabled');
  });

  // 🛡️ Security Edge Case: Reject SQL injection attempts
  it('rejects SQL injection attempt in organization name', () => {
    const maliciousInput = "' OR 1=1 --";
    cy.get('input[name="name"]').clear().type(maliciousInput);
    cy.contains('button', 'Create').should('be.disabled');
  });

  // 🛡️ Security Edge Case: Reject XSS attempts in the notes field
  it('rejects XSS attempt in notes field', () => {
    const xssInput = "<script>alert('xss')</script>";
    cy.get('textarea[name="notes"]').clear().type(xssInput);
    cy.contains('button', 'Create').should('be.disabled');
  });

  // ❌ Edge Case: Reject invalid email formats
  const invalidEmails = [
    'plainaddress',
    '@missingusername.com',
    'username@.com',
    'user name@example.com',
    'username@example..com'
  ];

  invalidEmails.forEach(email => {
    it(`rejects invalid email: ${email}`, () => {
      cy.get('input[name="contactFields.contact"]').clear().type(email);
      cy.contains('button', 'Create').should('be.disabled');
    });
  });

  // ❌ Edge Case: Ensure empty required fields block submission
  it('disables create button if required fields are empty', () => {
    // Clear required fields
    cy.get('input[name="name"]').clear();
    cy.get('input[name="contactFields.contact"]').clear();

    // Create button should be disabled
    cy.contains('button', 'Create').should('be.disabled');
  });

  // 🧪 Error Handling: Simulate server failure and check error display
  it('displays error message on server failure', () => {
    // Intercept the POST request to simulate server error
    cy.intercept('POST', '/organizations', {
      statusCode: 500,
      body: { error: 'Internal Server Error' }
    }).as('postOrgFail');

    // Fill in minimum required fields
    cy.get('input[name="name"]').clear().type(uniqueOrgName);
    cy.get('input[name="contactFields.contact"]').clear().type(uniqueEmail);
    cy.get('select[aria-hidden="true"]').eq(0).select('Corporate', { force: true });
    cy.get('select[aria-hidden="true"]').eq(1).find('option').contains('dynaCERT Inc.').then($option => {
      cy.get('select[aria-hidden="true"]').eq(1).select($option.attr('value'), { force: true });
    });

    // Click create to trigger the mock failure
    cy.contains('button', 'Create').click();
    cy.wait('@postOrgFail');

    // Verify error message is displayed
    cy.contains('An error occurred while creating organization').should('be.visible');
  });

  // 🧪 Accessibility: Check if required fields show aria-invalid on blur
  it('shows aria-invalid on empty required fields after blur', () => {
    // Clear and blur name input
    cy.get('input[name="name"]').clear().blur();
    cy.get('input[name="name"]').should('have.attr', 'aria-invalid', 'true');

    // Clear and blur contact email
    cy.get('input[name="contactFields.contact"]').clear().blur();
    cy.get('input[name="contactFields.contact"]').should('have.attr', 'aria-invalid', 'true');
  });

  // 🔁 Usability: Test if clicking Cancel resets the form
  it('resets form when clicking Cancel', () => {
    // Fill in some temporary values
    cy.get('input[name="name"]').clear().type('Temp Org');
    cy.get('input[name="contactFields.contact"]').clear().type('temp@example.com');

    // Click Cancel
    cy.contains('button', 'Cancel').click();

    // Fields should reset to empty
    cy.get('input[name="name"]').should('have.value', '');
    cy.get('input[name="contactFields.contact"]').should('have.value', '');
  });
});
