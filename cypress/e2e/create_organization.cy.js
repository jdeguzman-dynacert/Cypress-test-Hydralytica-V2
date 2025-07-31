describe('Hydralytica v2 - Create Organization with Extensive Validations', () => {
  const timestamp = Date.now();
  const uniqueOrgName = `My Cypress Organization ${timestamp}`;
  const uniqueEmail = `contact.${timestamp}@cypresstest.com`;

  beforeEach(() => {
    cy.loginHydralytica();
    cy.contains('Dashboard', { timeout: 10000 }).should('be.visible');
    cy.visit('https://hydralytica.com/organizations/create');
  });

  it('creates a new organization with valid inputs', () => {
    cy.get('input[name="name"]').clear().type(uniqueOrgName);

    cy.get('select[aria-hidden="true"]').eq(0).select('Corporate', { force: true });

    cy.get('select[aria-hidden="true"]').eq(1)
      .find('option').contains('dynaCERT Inc.')
      .then($option => {
        cy.get('select[aria-hidden="true"]').eq(1).select($option.attr('value'), { force: true });
      });

    cy.get('textarea[name="notes"]').clear().type('Test org created by Cypress.');

    // Email field - types instantly due to global override (prevents truncation)
    cy.get('input[name="contactFields.contact"]').clear().type(uniqueEmail);

    cy.get('textarea[name="contactFields.description"]').clear().type('Main contact email.');

    cy.contains('button', 'Add').eq(0).should('be.visible').click({ force: true });

    cy.get('input[name="addressFields.country"]').clear().type('Canada');
    cy.get('input[name="addressFields.city"]').clear().type('Toronto');
    cy.get('input[name="addressFields.address"]').clear().type('123 Queen Street');
    cy.get('input[name="addressFields.zipCode"]').clear().type('M5H 2N2');
    cy.get('input[name="addressFields.reference"]').clear().type('Suite 500');
    cy.get('input[name="addressFields.description"]').clear().type('Head office location.');

    cy.wait(1000);

    cy.contains('div[data-slot="card-title"]', 'Address')
      .parents('[data-slot="card"]')
      .within(() => {
        cy.contains('button', 'Add').click();
      });

    // After clicking Create, global click override will pause 3s
    cy.contains('button', 'Create', { timeout: 10000 }).click();

    // Add assertions here (if any)
  });

  // Edge Case: Overly long org name
  it('rejects overly long organization name', () => {
    const longName = 'A'.repeat(256);
    cy.get('input[name="name"]').clear().type(longName);
    cy.contains('button', 'Create').should('be.disabled');
  });

  // Edge Case: Too short org name
  it('rejects overly short organization name', () => {
    cy.get('input[name="name"]').clear().type('A');
    cy.contains('button', 'Create').should('be.disabled');
  });

  // Edge Case: SQL Injection in org name
  it('rejects SQL injection attempt in organization name', () => {
    const maliciousInput = "' OR 1=1 --";
    cy.get('input[name="name"]').clear().type(maliciousInput);
    cy.contains('button', 'Create').should('be.disabled');
  });

  // Edge Case: XSS attempt in notes
  it('rejects XSS attempt in notes field', () => {
    const xssInput = "<script>alert('xss')</script>";
    cy.get('textarea[name="notes"]').clear().type(xssInput);
    cy.contains('button', 'Create').should('be.disabled');
  });

  // Edge Case: Invalid emails
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

  // Edge Case: Required fields empty should block submission
  it('disables create button if required fields are empty', () => {
    cy.get('input[name="name"]').clear();
    cy.get('input[name="contactFields.contact"]').clear();
    cy.contains('button', 'Create').should('be.disabled');
  });

  // Edge Case: Server error handling (mocked)
  it('displays error message on server failure', () => {
    cy.intercept('POST', '/organizations', {
      statusCode: 500,
      body: { error: 'Internal Server Error' }
    }).as('postOrgFail');

    cy.get('input[name="name"]').clear().type(uniqueOrgName);
    cy.get('input[name="contactFields.contact"]').clear().type(uniqueEmail);

    cy.get('select[aria-hidden="true"]').eq(0).select('Corporate', { force: true });
    cy.get('select[aria-hidden="true"]').eq(1).find('option').contains('dynaCERT Inc.').then($option => {
      cy.get('select[aria-hidden="true"]').eq(1).select($option.attr('value'), { force: true });
    });

    cy.contains('button', 'Create').click(); // 3s pause auto-applied
    cy.wait('@postOrgFail');
    cy.contains('An error occurred while creating organization').should('be.visible');
  });

  // Accessibility check: aria-invalid on empty required input
  it('shows aria-invalid on empty required fields after blur', () => {
    cy.get('input[name="name"]').clear().blur();
    cy.get('input[name="name"]').should('have.attr', 'aria-invalid', 'true');

    cy.get('input[name="contactFields.contact"]').clear().blur();
    cy.get('input[name="contactFields.contact"]').should('have.attr', 'aria-invalid', 'true');
  });

  // Cancel button resets form fields (if applicable)
  it('resets form when clicking Cancel', () => {
    cy.get('input[name="name"]').clear().type('Temp Org');
    cy.get('input[name="contactFields.contact"]').clear().type('temp@example.com');
    cy.contains('button', 'Cancel').click();
    cy.get('input[name="name"]').should('have.value', '');
    cy.get('input[name="contactFields.contact"]').should('have.value', '');
  });
});
