// cypress/e2e/edit_user_full.cy.js

describe('Hydralytica - Full Edit User Flow', () => {
  const timestamp = Date.now();
  const testEmail = '@cypresstest.com';
  const newEmail = `updated.user.${timestamp}@cypresstest.com`;

  Cypress.Commands.add('waitForSuccessToast', (text = 'Updated Successfully!') => {
    cy.contains(new RegExp(text, 'i'), { timeout: 10000 }).should('exist');
    cy.get('body').contains(new RegExp(text, 'i'), { timeout: 10000 }).should('exist');
    cy.get('body').then(($body) => {
      const $toast = $body.find(`:contains(${text})`).last();
      if ($toast.length) cy.wrap($toast).should('be.visible');
    });
  });

  beforeEach(() => {
    cy.loginHydralytica();
    cy.visit('https://hydralytica.com/users');
    cy.contains('Dashboard', { timeout: 10000 }).should('be.visible');

    // Locate and open the user
    cy.contains('td', testEmail, { timeout: 10000 })
      .parents('tr')
      .within(() => cy.get('a[aria-label="Update"]').click());

    cy.url().should('match', /\/users\/\d+$/);
  });

  it('Updates First and Last Name (timestamped)', () => {
    cy.get('input[name="name"]').clear().type(`UpdatedFirst-${timestamp}`);
    cy.get('input[name="lastName"]').clear().type(`UpdatedLast-${timestamp}`);
    cy.contains('button', 'Update').click();
    cy.waitForSuccessToast();
  });

  it('Updates Login Email (timestamped)', () => {
    cy.get('button svg.lucide-pencil').first().parents('button').click();
    cy.get('input[name="contactFields.contact"]').clear().type(newEmail);
    cy.contains('button', 'Update').click();
    cy.waitForSuccessToast();
  });

  it('Updates Residential Address (timestamped)', () => {
    cy.contains('td', 'Residential').parent('tr').find('button svg.lucide-pencil').parents('button').click();
    cy.get('input[name="addressFields.country"]').clear().type(`Canada-${timestamp}`);
    cy.get('input[name="addressFields.city"]').clear().type(`Vancouver-${timestamp}`);
    cy.get('input[name="addressFields.address"]').clear().type(`987 Updated Street ${timestamp}`);
    cy.get('input[name="addressFields.zipCode"]').clear().type('A1B2C3');
    cy.contains('button', 'Update').click();
    cy.waitForSuccessToast();

    cy.contains('td', 'Residential').parent('tr').within(() => {
      cy.contains(`Canada-${timestamp}`);
      cy.contains(`Vancouver-${timestamp}`);
      cy.contains(`987 Updated Street ${timestamp}`);
    });
  });

  it('Blocks empty required fields', () => {
    cy.contains('td', 'Residential').parent('tr').find('button svg.lucide-pencil').parents('button').click();
    cy.get('input[name="addressFields.country"]').clear().blur();
    cy.get('input[name="addressFields.city"]').clear().blur();
    cy.get('input[name="addressFields.address"]').clear().blur();

    cy.get('input[name="addressFields.country"]').should('have.attr', 'aria-invalid', 'true');
    cy.get('input[name="addressFields.city"]').should('have.attr', 'aria-invalid', 'true');
    cy.get('input[name="addressFields.address"]').should('have.attr', 'aria-invalid', 'true');

    cy.contains('button', 'Update').should('be.disabled');
  });

  it('Blocks invalid Zip Code', () => {
    cy.contains('td', 'Residential').parent('tr').find('button svg.lucide-pencil').parents('button').click();
    cy.get('input[name="addressFields.zipCode"]').clear().type('###').blur();
    cy.get('input[name="addressFields.zipCode"]').should('have.attr', 'aria-invalid', 'true');
    cy.contains('button', 'Update').should('be.disabled');
  });

  it('Changes Address Type via dropdown', () => {
    cy.contains('td', 'Residential').parent('tr').find('button svg.lucide-pencil').parents('button').click();

    cy.get('button[role="combobox"]').click();
    cy.get('select[aria-hidden="true"] option').contains('Billing').then(option => {
      cy.wrap(option).then(opt => cy.get('select[aria-hidden="true"]').select(opt.val()));
    });

    cy.contains('button', 'Update').click();
    cy.waitForSuccessToast();
    cy.contains('td', 'Billing').should('exist');
  });

  it('Sequentially updates Residential & Business rows (timestamped)', () => {
    cy.contains('td', 'Residential').parent('tr').find('button svg.lucide-pencil').parents('button').click();
    cy.get('input[name="addressFields.city"]').clear().type(`Toronto-${timestamp}`);
    cy.contains('button', 'Update').click();
    cy.waitForSuccessToast();

    cy.contains('td', 'Business').parent('tr').find('button svg.lucide-pencil').parents('button').click();
    cy.get('input[name="addressFields.city"]').clear().type(`New York-${timestamp}`);
    cy.contains('button', 'Update').click();
    cy.waitForSuccessToast();

    cy.contains('td', 'Residential').parent('tr').within(() => cy.contains(`Toronto-${timestamp}`));
    cy.contains('td', 'Business').parent('tr').within(() => cy.contains(`New York-${timestamp}`));
  });

  it('Sorts by Country (ascending & descending)', () => {
    cy.get('th').contains('Country').click();
    cy.get('tbody tr').then(rows => {
      const countries = [...rows].map(r => r.cells[1].innerText);
      expect(countries).to.deep.equal([...countries].sort());
    });

    cy.get('th').contains('Country').click();
    cy.get('tbody tr').then(rows => {
      const countries = [...rows].map(r => r.cells[1].innerText);
      expect(countries).to.deep.equal([...countries].sort().reverse());
    });
  });

  it('Deletes Business row', () => {
    cy.contains('td', 'Business').parent('tr').find('button svg.lucide-trash').parents('button').click();
    cy.contains('button', 'Confirm').click();
    cy.contains('td', 'Business').should('not.exist');
  });

  it('Cancels edit without saving changes', () => {
    cy.contains('td', 'Residential').parent('tr').find('button svg.lucide-pencil').parents('button').click();
    cy.get('input[name="addressFields.city"]').clear().type(`ShouldNotSave-${timestamp}`);
    cy.contains('button', 'Cancel').click();
    cy.contains('td', 'Residential').parent('tr').within(() => {
      cy.contains(`ShouldNotSave-${timestamp}`).should('not.exist');
    });
  });
});
