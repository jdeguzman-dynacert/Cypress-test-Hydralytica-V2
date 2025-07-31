import { logTestResult, generateUniqueEmail } from '../support/utils/utils';
import { validationErrors, statusErrors } from '../support/utils/errorMessages';
import { successMessages } from '../support/utils/successMessages';

describe('Hydralytica v2 - Create User Validation Suite', () => {
  beforeEach(() => {
    cy.loginHydralytica();
    cy.visit('https://hydralytica.com/users/create');
    cy.contains('Dashboard', { timeout: 10000 }).should('be.visible');
  });

  const generateUniqueData = () => {
    const timestamp = Date.now();
    return {
      name: `CypressTest${timestamp}`,
      lastName: `Doe${timestamp}`,
      nickname: `JD${timestamp}`,
      email: `jane.doe.${timestamp}@cypresstest.com`,
    };
  };

  const duplicateEmail = 'jane.doe@cypresstest.com';

  const fillForm = (overrides = {}) => {
    const defaults = generateUniqueData();
    const data = {
      ...{
        city: 'Toronto',
        country: 'Canada',
        address: '123 Main St',
        zipCode: 'M1M1M1',
      },
      ...defaults,
      ...overrides,
    };

    cy.get('input[name="name"]').clear().type(data.name);
    cy.get('input[name="lastName"]').clear().type(data.lastName);
    cy.get('input[name="nickname"]').clear().type(data.nickname);

    cy.contains('label', 'Organization')
      .parent()
      .find('button[role="combobox"]')
      .click();
    cy.wait(500);
    cy.get('[role="option"]').contains(/^dynaCERT Inc\.$/).click();

    cy.contains('label', 'Type')
      .parent()
      .find('button[role="combobox"]')
      .click();
    cy.wait(500);
    cy.get('[role="option"]').contains(/^guest$/i).click();

    cy.contains('label', 'Contact Type')
      .parent()
      .find('button[role="combobox"]')
      .click();
    cy.wait(500);
    cy.get('[role="option"]').contains(/^Login Email \(Required\)$/).click();

    cy.get('input[name="contactFields.contact"]').clear().type(data.email);
    cy.get('textarea[name="contactFields.description"]').type('Primary login email');
    cy.wait(500);
        // Click "Add" for Contact
    cy.contains('div[data-slot="card-title"]', 'Contact')
      .parents('[data-slot="card"]')
      .within(() => {
        cy.contains('button', 'Add').should('be.visible').click();
      });

    cy.contains('label', 'Address Type')
      .parent()
      .find('button[role="combobox"]')
      .click();
    cy.wait(500);
    cy.get('[role="option"]').contains(/^Residential$/).click();

    cy.get('input[name="addressFields.country"]').clear().type(data.country);
    cy.get('input[name="addressFields.city"]').clear().type(data.city);
    cy.get('input[name="addressFields.address"]').clear().type(data.address);
    cy.get('input[name="addressFields.zipCode"]').clear().type(data.zipCode);
    cy.get('input[name="addressFields.reference"]').type('Near the park');
    cy.get('input[name="addressFields.description"]').type('Primary residence address');
    cy.wait(1000);
   cy.contains('div[data-slot="card-title"]', 'Address')
      .parents('[data-slot="card"]')
      .within(() => {
        cy.contains('button', 'Add').should('be.visible').click();
      });

    return data;
  };

  afterEach(function () {
    const testName = this.currentTest.title;
    const status = this.currentTest.state;

    if (status === 'failed') {
      const screenshotName = testName.replace(/[^a-zA-Z0-9]/g, '_');
      cy.screenshot(`failure-${screenshotName}`);
    }

    logTestResult(testName, status);
  });

it('✅ should create a user with valid data', () => {
  // Fix: Match the actual request path seen in devtools
  cy.intercept('POST', '/api/v2/users/create').as('createUser');

  const userData = fillForm();

  cy.contains('button', 'Create').click();

  // Wait for request to be triggered
  /*cy.wait('@createUser').then((interception) => {
    expect(interception.response.statusCode).to.eq(201);
    cy.log('User created:', interception.response.body);
  });*/

  cy.contains(successMessages.create, { timeout: 10000 }).should('be.visible');
  cy.screenshot(`user-created-${userData.email}`);
});


  /*it('❌ should reject duplicate email address', () => {
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
  });*/
  
  it('📧 should allow adding multiple contact methods', () => {
  const userData = fillForm();

  // Add second contact
  cy.contains('label', 'Contact Type')
    .parent()
    .find('button[role="combobox"]')
    .click();
  cy.wait(500);
  cy.get('[role="option"]').contains(/^Phone$/).click();

  cy.get('input[name="contactFields.contact"]').clear().type('+1-416-123-4567');
  cy.get('textarea[name="contactFields.description"]').type('Mobile number');

  cy.contains('div[data-slot="card-title"]', 'Contact')
    .parents('[data-slot="card"]')
    .within(() => {
      cy.contains('button', 'Add').should('be.visible').click();
    });

  cy.contains('button', 'Create').click();
  cy.contains(successMessages.create).should('exist');
});

it('⚠️ should reject invalid characters in address fields', () => {
  fillForm({
    address: '🏠<>/\\',
    city: '<Toronto>',
  });

  cy.contains('button', 'Create').click();
  cy.contains('Invalid characters').should('exist');
});

it('🚫 should not allow duplicate contact entry', () => {
  const data = fillForm();

  // Try to re-add the same email
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

  cy.contains('Duplicate contact entry').should('exist');
});

  it('🧪 should handle long input edge cases', () => {
    const longStr = 'A'.repeat(256);
    fillForm({ name: longStr, lastName: longStr, nickname: longStr });
    cy.wait(500);
    cy.contains('button', 'Create').click();

    // Temporary fallback for backend message
    cy.contains('forms.validations.fieldIsTooLong').should('exist');
    cy.contains(validationErrors.tooLong).should('exist');
  });

  it('❌ should show errors for missing required fields', () => {
    cy.wait(500);
    cy.contains('button', 'Create').click();

    cy.get('[data-slot="form-message"]')
      .should('have.length.at.least', 2)
      .each(($el) => {
        cy.wrap($el).should('contain.text', validationErrors.required);
      });

    logTestResult('Show errors for missing required fields', 'pass');
  });

  it('❌ should reject invalid email format', () => {
    fillForm({ email: 'invalidemail' });
    cy.wait(500);
    cy.contains('button', 'Create').click();
    cy.contains(validationErrors.email).should('exist');
  });

  it('❌ should reject SQL injection attempt in name field', () => {
    fillForm({ name: "'; DROP TABLE users; --" });
    cy.wait(500);
    cy.contains('button', 'Create').click();
    cy.contains('Invalid characters').should('exist');
  });

  it('❌ should reject XSS injection in nickname field', () => {
    fillForm({ nickname: '<script>alert(1)</script>' });
    cy.wait(500);
    cy.contains('button', 'Create').click();
    cy.contains('Invalid input').should('exist');
  });

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

  

  it('➕ should allow adding multiple addresses', () => {
  const userData = fillForm();

  // Add second address
  cy.contains('label', 'Address Type')
    .parent()
    .find('button[role="combobox"]')
    .click();
  cy.wait(500);
  cy.get('[role="option"]').contains(/^Business$/).click();

  cy.get('input[name="addressFields.country"]').clear().type('USA');
  cy.get('input[name="addressFields.city"]').clear().type('New York');
  cy.get('input[name="addressFields.address"]').clear().type('456 Wall St');
  cy.get('input[name="addressFields.zipCode"]').clear().type('10005');
  cy.get('input[name="addressFields.reference"]').type('HQ');
  cy.get('input[name="addressFields.description"]').type('Secondary address');

  // Click Add for second address
  cy.contains('div[data-slot="card-title"]', 'Address')
    .parents('[data-slot="card"]')
    .within(() => {
      cy.contains('button', 'Add').should('be.visible').click();
    });

  cy.contains('button', 'Create').click();
  cy.contains(successMessages.create).should('exist');
});



  it('🧱 should reject overly long address fields', () => {
  fillForm({
    address: 'A'.repeat(300),
    city: 'B'.repeat(300),
    zipCode: 'C'.repeat(100),
  });

  cy.contains('button', 'Create').click();
  cy.contains(validationErrors.tooLong).should('exist');
});



it('✅ should allow address creation without reference/description', () => {
  const data = generateUniqueData();

  // Fill only required address fields
  cy.get('input[name="addressFields.country"]').clear().type('Canada');
  cy.get('input[name="addressFields.city"]').clear().type('Toronto');
  cy.get('input[name="addressFields.address"]').clear().type('123 King St');
  cy.get('input[name="addressFields.zipCode"]').clear().type('M5V1K4');

  cy.contains('div[data-slot="card-title"]', 'Address')
    .parents('[data-slot="card"]')
    .within(() => {
      cy.contains('button', 'Add').should('be.visible').click();
    });

  cy.contains('button', 'Create').click();
  cy.contains(successMessages.create).should('exist');
});


});
