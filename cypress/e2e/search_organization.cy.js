// cypress/e2e/search_organization.cy.js
import { logTestResult } from '../support/utils/utils';

describe('Hydralytica v2 - Search Organization', () => {
    const timestamp = Date.now();
    const uniqueOrgName = `My Cypress Organization`;
    const existingOrg = 'My Cypress Organization'; // adjust if you know one exists
    const nonExistentOrg = `NotARealOrg-${timestamp}`; // guaranteed to not exist

    beforeEach(() => {
        cy.loginHydralytica();
        cy.contains('Dashboard', { timeout: 10000 }).should('be.visible');
        cy.visit('/organizations');
    });

    // ------------------ SEARCH -------------------
    it('should search for an organization by name (new org)', () => {
        // Open field dropdown
        cy.get('button[aria-label="Select field"]').eq(0).click({ force: true });

        // Select "Name" from the dropdown list inside the menu
        cy.get('div[role="listbox"]')       // target the actual dropdown
            .should('be.visible')
            .within(() => {
                cy.contains('Name').click({ force: true });
            });

        // Type the unique org name
        cy.get('input[name="value"]').clear().type(uniqueOrgName);

        // Click search
        cy.contains('button', 'Search').click();

        // Verify the org appears in results
        cy.contains(uniqueOrgName, { timeout: 5000 }).should('be.visible');
    });

    it('should reset filters', () => {
        cy.get('input[placeholder="Criteria"]').type(uniqueOrgName);
        cy.contains('button', 'Reset').click();
        cy.get('input[placeholder="Criteria"]').should('have.value', '');
    });

    it('should allow selecting a field from dropdown', () => {
        cy.get('button[aria-label="Select field"]').eq(0).click({ force: true });
        cy.get('[role="option"]').first().click({ force: true });
        cy.get('button[aria-label="Select field"]').eq(0).should('not.contain', 'Select field');
    });

    it('should find an existing organization by name', () => {
        cy.get('button[aria-label="Select field"]').eq(0).click({ force: true });
        cy.contains('Name').click({ force: true });

        cy.get('input[name="value"]').clear().type(existingOrg);
        cy.get('button[aria-label="Search"]').click();

        cy.contains(existingOrg, { timeout: 10000 }).should('be.visible');
    });

    it('should show no results for a non-existent organization', () => {
        cy.get('button[aria-label="Select field"]').eq(0).click({ force: true });

        // make sure we select Name from the dropdown menu
        cy.get('div[role="listbox"]').should('be.visible').within(() => {
            cy.contains('Name').click({ force: true });
        });

        // enter a fake org
        cy.get('input[name="value"]').clear().type(nonExistentOrg);
        cy.get('button[aria-label="Search"]').click();

        // assert the "No results." message is displayed inside the table body
        cy.get('table[data-slot="table"] tbody')
            .contains('td', 'No results.')
            .should('be.visible');
    });

    // ------------------ UI ELEMENTS ------------------
    it('should have the search criteria input with correct placeholder', () => {
        cy.get('input[placeholder="Criteria"]').should('exist').and('be.visible');
    });

    it('should have the Select field dropdown with aria-label', () => {
        cy.get('button[aria-label="Select field"]').should('exist').and('be.visible');
    });

    it('should have a Search button', () => {
        cy.contains('button', 'Search').should('exist').and('be.visible');
    });

    it('should have a Reset button', () => {
        cy.contains('button', 'Reset').should('exist').and('be.visible');
    });

    it('should render results table', () => {
        cy.get('table').should('exist');
    });

    // ------------------ SORTING ------------------
    it('should sort by Name column', () => {
        cy.get('table thead th').contains('Name').click({ force: true });
        cy.wait(500); // wait for table re-render
    });

    it('should sort by Created At column', () => {
        cy.get('table thead th').contains('Created').click({ force: true });
        cy.wait(500);
    });

    // ------------------ FILTERS ------------------
    it('should filter by Type (positive)', () => {
        // open filters dialog
        cy.contains('button', 'Filters').click({ force: true });

        cy.get('div[role="dialog"][data-state="open"]').should('exist');

        // open 3rd combobox (Type)
        cy.get('div[role="dialog"] button[role="combobox"]').eq(2).click({ force: true });

        // select "Corporate" from the dropdown list (rendered globally)
        cy.get('div[role="listbox"]')
            .should('be.visible')
            .contains('Corporate')
            .click({ force: true });

        // apply filters
        cy.contains('button', 'Done').click();

        // verify results in table
        cy.get('table[data-slot="table"] tbody tr')
            .should('contain.text', 'Corporate');
    });

    it('should show empty results for mismatched filter', () => {
        cy.contains('button', 'Filters').click({ force: true });
        cy.get('div[role="dialog"][data-state="open"]').should('exist');

        cy.get('div[role="dialog"] button[role="combobox"]').eq(2).click({ force: true });
        cy.get('div[role="dialog"] li').contains('Non-Profit').click({ force: true });
        cy.contains('button', 'Done').click();

        // assert the "No results." message is displayed inside the table body
        cy.get('table[data-slot="table"] tbody')
            .contains('td', 'No results.')
            .should('be.visible');
    });

    // ------------------ PAGINATION ------------------
    it('should navigate to next page first button', () => {
        // first "next page" button
        cy.get('button[aria-label="Go to next page"]').first().click({ force: true });
        cy.get('table tbody tr').should('exist');
    });
    it('should navigate to next page second button', () => {
        // second "next page" button
        cy.get('button[aria-label="Go to next page"]').eq(1).click({ force: true });
        cy.get('table tbody tr').should('exist');
    });
    
    it('should navigate to previous page first button', () => {
        // first "next page" button
        cy.get('button[aria-label="Go to next page"]').first().click({ force: true });
        cy.get('button[aria-label="Go to previous page"]').first().click({ force: true });
        cy.get('table tbody tr').should('exist');
    });
    
    it('should navigate to previous page second button', () => {
        // first "next page" button
        cy.get('button[aria-label="Go to next page"]').eq(1).click({ force: true });
        cy.get('button[aria-label="Go to previous page"]').eq(1).click({ force: true });
        cy.get('table tbody tr').should('exist');
    });

    it('should change rows per page', () => {
        cy.get('button[aria-label="Rows per page"]').first().click({ force: true });

        // Wait for listbox and select "50"
        cy.get('div[role="listbox"]')
            .should('be.visible')
            .contains('50')
            .click({ force: true });

        // Assert rows are <= 50
        cy.get('table tbody tr').its('length').should('be.lte', 50);
    });


    // ------------------ ACTIONS ------------------
    it('should confirm Delete Organization', () => {
        cy.get('table tbody tr:first-child').within(() => {
            cy.contains('Delete').click({ force: true });
        });
        cy.contains('Confirm Delete').should('be.visible');
    });

    // ------------------ NEGATIVE CASES ------------------
    it('should not allow empty search submission', () => {
        cy.get('input[placeholder="Criteria"]').clear();
        cy.contains('button', 'Search').click();
        cy.get('table tbody tr').should('exist'); // still shows results
    });

    it('should not break on invalid filter combination', () => {
        cy.contains('button', 'Filters').click({ force: true });
        cy.get('div[role="dialog"][data-state="open"]').should('exist');

        // open Created combobox
        cy.get('div[role="dialog"] button[role="combobox"]').eq(2).click({ force: true });

        // pick first and second created values
        cy.get('div[data-slot="command-item"]').eq(0).click({ force: true });
        cy.get('div[data-slot="command-item"]').eq(1).click({ force: true });

        // ensure dialog is still open before clicking Done
        cy.get('div[role="dialog"][data-state="open"]').should('exist');

        // click Done with force (but after ensuring dialog is interactable)
        cy.contains('button[aria-label="Done"]', 'Done').click({ force: true });

        // wait until dialog closes
        cy.get('div[role="dialog"][data-state="open"]').should('not.exist');

        // assert table shows "No results."
        cy.get('table[data-slot="table"] tbody')
            .contains('td', 'No results.')
            .should('be.visible');
    });

    // it('should download a CSV file when clicking Export', () => {
    //   // Intercept the export request (adjust URL if needed)
    //   cy.intercept('GET', '**/export*').as('exportCsv');

    //   // Click the Export button
    //   cy.contains('button[aria-label="Export"]', 'Export').click({ force: true });

    //   // Wait for request and validate response headers
    //   cy.wait('@exportCsv').then((interception) => {
    //     expect(interception.response.statusCode).to.eq(200);
    //     expect(interception.response.headers['content-type']).to.include('text/csv');
    //     expect(interception.response.headers['content-disposition']).to.include('attachment');
    //   });
    // });


});
