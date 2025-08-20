/**
 * Edit Profile - Info Panel & Contact Info
 * This test logs into Hydralytica, navigates to the profile page,
 * edits the user's first name, last name, nickname, and contact information.
 *
 * Dynamic values use timestamps to avoid conflicts.
 */

import { logTestResult, generateUniqueEmail } from '../support/utils/utils';
import { validationErrors, statusErrors } from '../support/utils/errorMessages';
import { successMessages } from '../support/utils/successMessages';

describe('Edit Profile - Info Panel & Contacts (timestamped)', () => {
  const timestamp = Date.now();
  const newFirstName = `Janie${timestamp}`;
  const newLastName = `Smith${timestamp}`;
  const newNickname = `jsmith${timestamp}`;
  const newPersonalEmail = `cypress${timestamp}@email.com`;
  const newHomePhone = `+122587${Math.floor(1000000 + Math.random() * 9000000)}`;

  beforeEach(() => {
    cy.loginHydralytica();
    cy.visit('/system/profile');
  });


  it('Updates Info Panel fields', () => {
    // --- FIRST NAME ---
   cy.get('input[name="name"]')
      .should('be.visible')
      .type(`{selectall}${newFirstName}`, { delay: 50, force: true });
    cy.get('input[name="lastName"]').clear().type(newLastName);
    cy.get('input[name="nickname"]').clear().type(newNickname);
    cy.contains('button', 'Update').click({ force: true });
    //cy.waitForSuccessToast();
    cy.wait(2500);
  });

it('Updates Personal Email and saves all changes', () => {

  // Click pencil button for "Personal Email"
  cy.contains('td', 'Personal Email')
    .parent('tr')
    .find('button svg.lucide-pencil')
    .parents('button')
    .first()
    .click();

  // Edit the email in the contact panel
  cy.get('input[name="contactFields.contact"]')
    .should('be.visible')
    .clear()
    .type(newPersonalEmail);

  // Click the first "Update" (inside contact panel)
    cy.wait(3500);

    cy.contains('button', 'Update').click({ force: true });
    //cy.waitForSuccessToast();
    cy.wait(2500);

    
  //cy.contains('Updated Successfully!').should('be.visible');
    cy.wait(2500);
    cy.contains('button', 'Update').click({ force: true });
});






  it('Updates Home Phone', () => {
    cy.contains('td', 'Home Phone')
      .parent('tr')
      .find('button svg.lucide-pencil')
      .parents('button')
      .first()
      .click();

    cy.get('input[name="contactFields.contact"]')
      .clear()
      .type(newHomePhone);
    cy.wait(500);

    cy.contains('button', 'Update').click({ force: true });
    //cy.waitForSuccessToast();
    cy.wait(500);
    cy.contains('button', 'Update').click({ force: true });
  });


  it('Updates Address, then saves all changes', () => { 

  // Open Residential row
    cy.contains('td', 'Residential')
      .parent('tr')
      .find('button svg.lucide-pencil')
      .parents('button')
      .first()
      .click();

    // Change Address Type
  //  selectRadixOption('Residential', 'Business');

    // Update address fields
    cy.get('input[name="addressFields.address"]').clear().type('123 Test Street');
    cy.get('input[name="addressFields.city"]').clear().type('Toronto');
    cy.get('input[name="addressFields.zipCode"]').clear().type('M1A 1A1');
    cy.get('input[name="addressFields.country"]').clear().type('Canada');

   cy.contains('button', 'Update').click({ force: true });
    //cy.waitForSuccessToast();
    cy.wait(2500);
    cy.contains('button', 'Update').click({ force: true });
});


it('Adds a new Address successfully', () => {
  cy.contains('button', 'Add').last().click();
  cy.get('input[name="addressFields.country"]').type('Canada');
  cy.get('input[name="addressFields.city"]').type('Montreal');
  cy.get('input[name="addressFields.address"]').type('456 King Street');
  cy.get('input[name="addressFields.zipCode"]').type('H3A 1B9');
  cy.get('input[name="addressFields.reference"]').type('Ref002');
  cy.get('input[name="addressFields.description"]').type('Second Address');

  cy.contains('button', 'Add').last().click();
  //cy.contains('Address added successfully!', { timeout: 10000 }).should('be.visible');
    cy.contains('button', 'Update').last().click({ force: true });
});


});
