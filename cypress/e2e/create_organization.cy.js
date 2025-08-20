// cypress/e2e/create_organization.cy.js
import { logTestResult, generateUniqueEmail } from '../support/utils/utils';
import { validationErrors, statusErrors } from '../support/utils/errorMessages';
import { successMessages } from '../support/utils/successMessages';

describe('Hydralytica v2 - Create Organization with Extensive Validations', () => {
  const timestamp = Date.now();
  const uniqueOrgName = `My Cypress Organization ${timestamp}`;
  const uniqueEmail = generateUniqueEmail();

  beforeEach(() => {
    cy.loginHydralytica();
    cy.contains('Dashboard', { timeout: 10000 }).should('be.visible');
    cy.visit('/organizations/create');
  });

  /**
   * Runs after each test case.
   * Takes screenshot on failure and logs the test result.
   */
  /*afterEach(function () {
  const testName = this.currentTest.title; // Current test name
  const status = this.currentTest.state;   // Test status: passed or failed

  if (Cypress.config('isInteractive')) {
    cy.wait(4000); // only pauses when running in headed/interactive mode
  }

  if (status === 'failed') {
    // Format filename safe for screenshots
    const screenshotName = testName.replace(/[^a-zA-Z0-9]/g, '_');

    // Attempt screenshot, but don't fail if it errors
    cy.screenshot(`failure-${screenshotName}`, { capture: 'runner' })
      .then(() => {
        Cypress.log({
          name: 'screenshot',
          message: `✅ Screenshot saved: failure-${screenshotName}.png`
        });
      })
      .catch((err) => {
        Cypress.log({
          name: 'screenshot',
          message: `⚠️ Screenshot failed: ${err.message}`
        });
      });
  }

  // Custom log of test results (console logging helper from utils.js)
  logTestResult(testName, status);
});
*/

  // ✅ Valid org creation
  it('creates a new organization with valid inputs', () => {
    try {
      cy.get('input[name="name"]').clear().type(uniqueOrgName);
      cy.get('select[aria-hidden="true"]').eq(0).select('Corporate', { force: true });

      cy.get('select[aria-hidden="true"]').eq(1)
        .find('option').contains('dynaCERT Inc.')
        .then($option => {
          cy.get('select[aria-hidden="true"]').eq(1).select($option.attr('value'), { force: true });
        });

      cy.get('textarea[name="notes"]').clear().type('Test org created by Cypress.');
      cy.get('input[name="contactFields.contact"]').clear().type(uniqueEmail);
      cy.get('textarea[name="contactFields.description"]').clear().type('Main contact email.');

      // ✅ First Add button → contact
      cy.contains('button', 'Add').eq(0).click({ force: true });

      // Address fields
      cy.get('input[name="addressFields.country"]').clear().type('Canada');
      cy.get('input[name="addressFields.city"]').clear().type('Toronto');
      cy.get('input[name="addressFields.address"]').clear().type('123 Queen Street');
      cy.get('input[name="addressFields.zipCode"]').clear().type('M5H 2N2');
      cy.get('input[name="addressFields.reference"]').clear().type('Suite 500');
      cy.get('input[name="addressFields.description"]').clear().type('Head office location.');

      // ✅ Last Add button → address
      cy.contains('div[data-slot="card-title"]', 'Address')
        .parents('[data-slot="card"]')
        .within(() => {
          cy.contains('button', 'Add').last().click();
        });

      cy.contains('button', 'Create', { timeout: 10000 }).click();
      cy.contains(successMessages.create, { timeout: 10000 }).should('be.visible');

      logTestResult('creates a new organization with valid inputs', 'pass');
    } catch (e) {
      logTestResult('creates a new organization with valid inputs', 'fail');
      throw e;
    }
  });

  // ❌ Too long name
  it('rejects overly long organization name', () => {
    try {
      const longName = 'A'.repeat(256);
      cy.get('input[name="name"]').clear().type(longName);
      cy.contains('button', 'Create', { timeout: 10000 }).click();
      cy.contains(validationErrors.tooLong).should('be.visible');
      logTestResult('rejects overly long organization name', 'pass');
    } catch (e) {
      logTestResult('rejects overly long organization name', 'fail');
      throw e;
    }
  });

  // ❌ Too short name
  it('rejects overly short organization name', () => {
    try {
      cy.get('input[name="name"]').clear().type('A');
      cy.contains('button', 'Create', { timeout: 10000 }).click();
      cy.contains(validationErrors.tooShort).should('be.visible');
      logTestResult('rejects overly short organization name', 'pass');
    } catch (e) {
      logTestResult('rejects overly short organization name', 'fail');
      throw e;
    }
  });

  // ❌ SQL Injection
  it('rejects SQL injection attempt in organization name', () => {
    try {
      const maliciousInput = "' OR 1=1 --";
      cy.get('input[name="name"]').clear().type(maliciousInput);
      cy.contains('button', 'Create', { timeout: 1000 }).click();
      cy.contains(validationErrors.invalidCharacters).should('be.visible');
      logTestResult('rejects SQL injection attempt in organization name', 'pass');
    } catch (e) {
      logTestResult('rejects SQL injection attempt in organization name', 'fail');
      throw e;
    }
  });

  // ❌ XSS
  it('rejects XSS attempt in notes field', () => {
    try {
      const xssInput = "<script>alert('xss')</script>";
      cy.get('textarea[name="notes"]').clear().type(xssInput);
      cy.contains('button', 'Create', { timeout: 1000 }).click();
      cy.contains(validationErrors.invalidCharacters).should('be.visible');
      logTestResult('rejects XSS attempt in notes field', 'pass');
    } catch (e) {
      logTestResult('rejects XSS attempt in notes field', 'fail');
      throw e;
    }
  });

  // ❌ Invalid emails
  const invalidEmails = [
    'plainaddress',
    '@missingusername.com',
    'username@.com',
    'user name@example.com',
    'username@example..com'
  ];

  invalidEmails.forEach(email => {
    it(`rejects invalid email: ${email}`, () => {
      try {
        cy.get('input[name="contactFields.contact"]').clear().type(email);
        cy.contains('button', 'Add').eq(0).click(); // trigger validation
        cy.contains(validationErrors.emailInvalid).should('be.visible');
        logTestResult(`rejects invalid email: ${email}`, 'pass');
      } catch (e) {
        logTestResult(`rejects invalid email: ${email}`, 'fail');
        throw e;
      }
    });
  });

  // ❌ Empty required fields
  it('displays validation errors for empty required fields', () => {
    try {
      cy.get('input[name="name"]').clear();
      cy.contains('button', 'Add').eq(0).click(); // trigger validation
      cy.contains(validationErrors.orgNameRequired).should('be.visible');

      cy.get('input[name="contactFields.contact"]').clear();
      cy.contains('button', 'Add').eq(0).click(); // trigger validation
      cy.contains(validationErrors.emailRequired).should('be.visible');

      logTestResult('displays validation errors for empty required fields', 'pass');
    } catch (e) {
      logTestResult('displays validation errors for empty required fields', 'fail');
      throw e;
    }
  });

  // ❌ Contact required
  it('shows error when no contact is added', () => {
    try {
      cy.contains('button', 'Add').eq(0).click(); // first Add button
      cy.contains(validationErrors.contactIsRequired).should('be.visible');
      logTestResult('shows error when no contact is added', 'pass');
    } catch (e) {
      logTestResult('shows error when no contact is added', 'fail');
      throw e;
    }
  });

  // ❌ Address required
  it('shows error when no address is added', () => {
    try {
      cy.contains('div[data-slot="card-title"]', 'Address')
        .parents('[data-slot="card"]')
        .within(() => {
          cy.contains('button', 'Add').last().click(); // last Add button
        });

      cy.contains(validationErrors.addressIsRequired).should('be.visible');
      logTestResult('shows error when no address is added', 'pass');
    } catch (e) {
      logTestResult('shows error when no address is added', 'fail');
      throw e;
    }
  });

  // 🧪 Server error handling
  it('displays error message on server failure', () => {
    try {
      cy.intercept('POST', '/organizations', {
        statusCode: 500,
        body: { error: 'Internal Server Error' }
      }).as('postOrgFail');

      cy.get('input[name="name"]').clear().type(uniqueOrgName);
      cy.get('input[name="contactFields.contact"]').clear().type(uniqueEmail);
      cy.get('select[aria-hidden="true"]').eq(0).select('Corporate', { force: true });
      cy.get('select[aria-hidden="true"]').eq(1)
        .find('option').contains('dynaCERT Inc.')
        .then($option => {
          cy.get('select[aria-hidden="true"]').eq(1).select($option.attr('value'), { force: true });
        });

      cy.contains('button', 'Create').click();
      cy.wait('@postOrgFail');
      cy.contains(statusErrors.create).should('be.visible');

      logTestResult('displays error message on server failure', 'pass');
    } catch (e) {
      logTestResult('displays error message on server failure', 'fail');
      throw e;
    }
  });

  // 🔁 Cancel resets form
  it('resets form when clicking Cancel', () => {
    try {
      cy.get('input[name="name"]').clear().type('Temp Org');
      cy.get('input[name="contactFields.contact"]').clear().type('temp@example.com');
      cy.contains('button', 'Cancel').click();
      cy.get('input[name="name"]').should('have.value', '');
      cy.get('input[name="contactFields.contact"]').should('have.value', '');
      logTestResult('resets form when clicking Cancel', 'pass');
    } catch (e) {
      logTestResult('resets form when clicking Cancel', 'fail');
      throw e;
    }
  });
});
