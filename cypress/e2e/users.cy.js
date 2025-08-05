import { logTestResult, generateUniqueEmail } from '../support/utils/utils';
import { validationErrors, statusErrors } from '../support/utils/errorMessages';
import { successMessages } from '../support/utils/successMessages';

// Main test suite for creating users in Hydralytica v2 with validations
describe('Hydralytica v2 - Create User Validation Suite', () => {
  // Runs before each test case to perform login and navigate to user creation page
  beforeEach(() => {
    cy.loginHydralytica(); // Custom command to login
    cy.visit('https://hydralytica.com/users/create'); // Visit user creation page
    // Confirm Dashboard is visible (page loaded successfully)
    cy.contains('Dashboard', { timeout: 10000 }).should('be.visible');
  });

  // Generates unique user data using current timestamp to avoid conflicts
  const generateUniqueData = () => {
    const timestamp = Date.now();
    return {
      name: `CypressTest${timestamp}`,
      lastName: `Doe${timestamp}`,
      nickname: `JD${timestamp}`,
      email: `jane.doe.${timestamp}@cypresstest.com`,
    };
  };

  // A static duplicate email to test duplicate email validation
  const duplicateEmail = 'jane.doe@cypresstest.com';

  /**
   * Fills the user creation form with either default unique data or
   * overridden values passed via `overrides`.
   * Returns the data used to fill the form for later assertions.
   */
  const fillForm = (overrides = {}) => {
    // Default address and user info
    const defaults = generateUniqueData();
    const data = {
      ...{
        city: 'Toronto',
        country: 'Canada',
        address: '123 Main St',
        zipCode: 'M1M1M1',
      },
      ...defaults,
      ...overrides, // Override defaults if provided
    };

    // Fill user personal details
    cy.get('input[name="name"]').clear().type(data.name);
    cy.get('input[name="lastName"]').clear().type(data.lastName);
    cy.get('input[name="nickname"]').clear().type(data.nickname);

    // Select 'Organization' dropdown and choose "dynaCERT Inc."
    cy.contains('label', 'Organization')
      .parent()
      .find('button[role="combobox"]')
      .click();
    cy.wait(500); // Small wait for dropdown options to appear
    cy.get('[role="option"]').contains(/^dynaCERT Inc\.$/).click();

    // Select 'Type' dropdown and choose "guest"
    cy.contains('label', 'Type')
      .parent()
      .find('button[role="combobox"]')
      .click();
    cy.wait(500);
    cy.get('[role="option"]').contains(/^guest$/i).click();

    // Select 'Contact Type' dropdown and choose "Login Email (Required)"
    cy.contains('label', 'Contact Type')
      .parent()
      .find('button[role="combobox"]')
      .click();
    cy.wait(500);
    cy.get('[role="option"]').contains(/^Login Email \(Required\)$/).click();

    // Fill contact email and description
    cy.get('input[name="contactFields.contact"]').clear().type(data.email);
    cy.get('textarea[name="contactFields.description"]').type('Primary login email');
    cy.wait(500);

    // Click "Add" button to add the contact info to the form
    cy.contains('div[data-slot="card-title"]', 'Contact')
      .parents('[data-slot="card"]')
      .within(() => {
        cy.contains('button', 'Add').should('be.visible').click();
      });

    // Select 'Address Type' dropdown and choose "Residential"
    cy.contains('label', 'Address Type')
      .parent()
      .find('button[role="combobox"]')
      .click();
    cy.wait(500);
    cy.get('[role="option"]').contains(/^Residential$/).click();

    // Fill address details
    cy.get('input[name="addressFields.country"]').clear().type(data.country);
    cy.get('input[name="addressFields.city"]').clear().type(data.city);
    cy.get('input[name="addressFields.address"]').clear().type(data.address);
    cy.get('input[name="addressFields.zipCode"]').clear().type(data.zipCode);
    cy.get('input[name="addressFields.reference"]').type('Near the park');
    cy.get('input[name="addressFields.description"]').type('Primary residence address');
    cy.wait(1000);

    // Click "Add" button to add the address info to the form
    cy.contains('div[data-slot="card-title"]', 'Address')
      .parents('[data-slot="card"]')
      .within(() => {
        cy.contains('button', 'Add').should('be.visible').click();
      });

    // Return data used to fill the form for validation or logging
    return data;
  };

  /**
   * Runs after each test case.
   * Takes screenshot on failure and logs the test result.
   */
  afterEach(function () {
    const testName = this.currentTest.title; // Current test name
    const status = this.currentTest.state;   // Test status: passed or failed

    if (status === 'failed') {
      // Format filename safe for screenshots
      const screenshotName = testName.replace(/[^a-zA-Z0-9]/g, '_');
      // Take screenshot of failure
      cy.screenshot(`failure-${screenshotName}`);
    }

    // Custom log of test results (can be to file, dashboard, etc)
    logTestResult(testName, status);
  });

  // Test case: Successfully create a user with valid inputs
  it('✅ should create a user with valid data', () => {
    // Intercept the API request to track it (optional assertion commented out)
    cy.intercept('POST', '/api/v2/users/create').as('createUser');

    const userData = fillForm(); // Fill form with unique valid data

    cy.contains('button', 'Create').click(); // Submit form

    // Wait for success message to appear
    cy.contains(successMessages.create, { timeout: 10000 }).should('be.visible');

    // Take a screenshot after successful user creation
    cy.screenshot(`user-created-${userData.email}`);
  });

  /*
  // Disabled test: Checks duplicate email rejection flow
  it('❌ should reject duplicate email address', () => {
    fillForm({ email: duplicateEmail });
    cy.wait(500);
    cy.contains('button', 'Create').click();
    cy.contains(successMessages.create).should('exist');
    cy.wait(2000);

    cy.visit('/users/create');
    fillForm({ email: duplicateEmail });
    cy.wait(500);
    cy.contains('button', 'Create').click();
    cy.contains('Error creating resource').should('exist');
  });
  */

  // Test case: Allows adding multiple contact methods for a user
  it('📧 should allow adding multiple contact methods', () => {
    const userData = fillForm();

    // Add second contact method
    cy.contains('label', 'Contact Type')
      .parent()
      .find('button[role="combobox"]')
      .click();
    cy.wait(500);
    cy.get('[role="option"]').contains(/^Phone$/).click();

    // Fill second contact info: phone number and description
    cy.get('input[name="contactFields.contact"]').clear().type('+1-416-123-4567');
    cy.get('textarea[name="contactFields.description"]').type('Mobile number');

    // Click "Add" button to add second contact
    cy.contains('div[data-slot="card-title"]', 'Contact')
      .parents('[data-slot="card"]')
      .within(() => {
        cy.contains('button', 'Add').should('be.visible').click();
      });

    // Submit form and expect success message
    cy.contains('button', 'Create').click();
    cy.contains(successMessages.create).should('exist');
  });

  // Test case: Rejects invalid characters in address fields (input validation)
  it('⚠️ should reject invalid characters in address fields', () => {
    fillForm({
      address: '🏠<>/\\',
      city: '<Toronto>',
    });

    cy.contains('button', 'Create').click();

    // Expect error message about invalid characters
    cy.contains('Invalid characters').should('exist');
  });

  // Test case: Prevents duplicate contact entry (same email twice)
  it('🚫 should not allow duplicate contact entry', () => {
    const data = fillForm();

    // Try to add the same email contact again
    cy.contains('label', 'Contact Type')
      .parent()
      .find('button[role="combobox"]')
      .click();
    cy.wait(500);
    cy.get('[role="option"]').contains(/^Login Email \(Required\)$/).click();

    cy.get('input[name="contactFields.contact"]').clear().type(data.email);
    cy.get('textarea[name="contactFields.description"]').type('Duplicate email');

    cy.contains('div[data-slot="card-title"]', 'Contact')
      .parents('[data-slot="card"]')
      .within(() => {
        cy.contains('button', 'Add').should('be.visible').click();
      });

    // Expect duplicate contact error message
    cy.contains('Duplicate contact entry').should('exist');
  });

  // Test case: Handles very long input strings (boundary testing)
  it('🧪 should handle long input edge cases', () => {
    const longStr = 'A'.repeat(256); // String with 256 'A's
    fillForm({ name: longStr, lastName: longStr, nickname: longStr });
    cy.wait(500);
    cy.contains('button', 'Create').click();

    // Expect backend validation error for too long fields
    cy.contains('forms.validations.fieldIsTooLong').should('exist');
    cy.contains(validationErrors.tooLong).should('exist');
  });

  // Test case: Shows validation errors when required fields are missing
  it('❌ should show errors for missing required fields', () => {
    cy.wait(500);
    cy.contains('button', 'Create').click();

    // Expect at least two form error messages showing "required" text
    cy.get('[data-slot="form-message"]')
      .should('have.length.at.least', 2)
      .each(($el) => {
        cy.wrap($el).should('contain.text', validationErrors.required);
      });

    // Log test result as passed
    logTestResult('Show errors for missing required fields', 'pass');
  });

  // Test case: Rejects invalid email formats during user creation
  it('❌ should reject invalid email format', () => {
    fillForm({ email: 'invalidemail' }); // Invalid email
    cy.wait(500);
    cy.contains('button', 'Create').click();

    // Expect email format validation error
    cy.contains(validationErrors.email).should('exist');
  });

  // Test case: Rejects SQL injection attempts in the name field
  it('❌ should reject SQL injection attempt in name field', () => {
    fillForm({ name: "'; DROP TABLE users; --" }); // SQL injection string
    cy.wait(500);
    cy.contains('button', 'Create').click();

    // Expect invalid character error message
    cy.contains('Invalid characters').should('exist');
  });

  // Test case: Rejects XSS injection attempts in the nickname field
  it('❌ should reject XSS injection in nickname field', () => {
    fillForm({ nickname: '<script>alert(1)</script>' }); // XSS script injection
    cy.wait(500);
    cy.contains('button', 'Create').click();

    // Expect invalid input error message
    cy.contains('Invalid input').should('exist');
  });

  // Test case: Rejects duplicate email addresses (twice submitting same email)
  it('❌ should reject duplicate email address', () => {
    fillForm({ email: duplicateEmail });
    cy.wait(500);
    cy.contains('button', 'Create').click();
    cy.contains(successMessages.create).should('exist'); // First create passes
    cy.wait(2000);

    // Try creating again with the same email - should fail
    cy.visit('/users/create');
    fillForm({ email: duplicateEmail });
    cy.wait(500);
    cy.contains('button', 'Create').click();

    // Expect error message about duplicate resource
    cy.contains('Error creating resource').should('exist');
  });

  // Test case: Allows adding multiple addresses to a user
  it('➕ should allow adding multiple addresses', () => {
    const userData = fillForm();

    // Add second address type selection
    cy.contains('label', 'Address Type')
      .parent()
      .find('button[role="combobox"]')
      .click();
    cy.wait(500);
    cy.get('[role="option"]').contains(/^Business$/).click();

    // Fill second address details
    cy.get('input[name="addressFields.country"]').clear().type('USA');
    cy.get('input[name="addressFields.city"]').clear().type('New York');
    cy.get('input[name="addressFields.address"]').clear().type('456 Wall St');
    cy.get('input[name="addressFields.zipCode"]').clear().type('10005');
    cy.get('input[name="addressFields.reference"]').type('HQ');
    cy.get('input[name="addressFields.description"]').type('Secondary address');

    // Click "Add" button to add the second address
    cy.contains('div[data-slot="card-title"]', 'Address')
      .parents('[data-slot="card"]')
      .within(() => {
        cy.contains('button', 'Add').should('be.visible').click();
      });

    // Submit form and expect success
    cy.contains('button', 'Create').click();
    cy.contains(successMessages.create).should('exist');
  });

  // Test case: Rejects overly long address field inputs
  it('🧱 should reject overly long address fields', () => {
    fillForm({
      address: 'A'.repeat(300),
      city: 'B'.repeat(300),
      zipCode: 'C'.repeat(100),
    });

    cy.contains('button', 'Create').click();

    // Expect validation error for fields being too long
    cy.contains(validationErrors.tooLong).should('exist');
  });

  // Test case: Allows creating address without optional reference and description
  it('✅ should allow address creation without reference/description', () => {
    const data = generateUniqueData();

    // Fill only required address fields
    cy.get('input[name="addressFields.country"]').clear().type('Canada');
    cy.get('input[name="addressFields.city"]').clear().type('Toronto');
    cy.get('input[name="addressFields.address"]').clear().type('123 King St');
    cy.get('input[name="addressFields.zipCode"]').clear().type('M5V1K4');

    // Add the address info to the form
    cy.contains('div[data-slot="card-title"]', 'Address')
      .parents('[data-slot="card"]')
      .within(() => {
        cy.contains('button', 'Add').should('be.visible').click();
      });

    // Submit form and expect success message
    cy.contains('button', 'Create').click();
    cy.contains(successMessages.create).should('exist');
  });
});
