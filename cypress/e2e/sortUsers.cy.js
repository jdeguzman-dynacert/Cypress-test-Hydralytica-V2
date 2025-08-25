// cypress/e2e/sortUsers.cy.js
// Test flow: Users Table Sorting → Ascending/Descending for each column
// Author: Julia Park

describe('Users sorting', () => {
  it('logs in and verifies sorting on Users table', () => {
    // ----------------------
    // 1) Login
    // ----------------------
    cy.visit('https://staging.hydralytica.dynacert.com/signin');

    // Enter email
    cy.get('input[name="email"], input[placeholder="Enter email address"]')
      .clear()
      .type('john.doe@dynacert.com');

    // Enter password (log: false hides it in Cypress logs)
    cy.get('input[name="password"], input[placeholder="Enter password"]')
      .clear()
      .type('123456', { log: false });

    // Click Sign In
    cy.contains('button', 'Sign In', { matchCase: false }).click();

    // Ensure we are no longer on the login page
    cy.location('pathname', { timeout: 20000 }).should('not.include', '/signin');

    // ----------------------
    // 2) Navigate to Users page
    // ----------------------
    cy.get('a[href="/users"]', { timeout: 15000 }).should('be.visible').click();
    cy.location('pathname', { timeout: 20000 }).should('eq', '/users');

    // Ensure the table header is visible before testing sorting
    cy.get('thead', { timeout: 20000 }).should('be.visible');

    // ----------------------
    // Helper: Compare function for sorting
    // ----------------------
    const cmp = (a, b) =>
      a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });

    // ----------------------
    // Helper: Sort a column and assert order
    // ----------------------
    function sortAndAssert(label, dir = 'asc', delay = 700) {
      // Find the table header cell by its label
      cy.get('thead').within(() => {
        cy.contains('th, [role="columnheader"]', new RegExp(`^${label}\\b`, 'i'), {
          timeout: 10000,
        }).as('hdr'); // alias for re-use
      });

      // Get the column index
      cy.get('@hdr').invoke('index').then((idx) => {
        expect(idx, `column index for "${label}"`).to.be.greaterThan(-1);

        // Capture the current values in the column
        cy.get(`tbody tr:visible td:nth-child(${idx + 1})`).then(($cells) => {
          const before = [...$cells].map((c) => c.textContent.trim());
          const distinct = new Set(before.map((v) => v.toLowerCase())).size;

          // Open the sort menu (Radix) by triggering hover and clicking menu button
          cy.get('@hdr')
            .trigger('mouseover')
            .within(() => {
              cy.get('button,[role="button"],[aria-haspopup="menu"]').first()
                .click({ force: true });
            });

          // Click the appropriate sort option: ascending or descending
          const target = dir === 'asc' ? /asc/i : /desc/i;
          cy.get('body', { timeout: 10000 })
            .contains('[role="menuitem"]', target, { timeout: 10000 })
            .click({ force: true });

          cy.wait(delay); // small pause to visually confirm sort

          // Assert the column is sorted correctly
          cy.get(`tbody tr:visible td:nth-child(${idx + 1})`).should(($cells2) => {
            const after = [...$cells2].map((c) => c.textContent.trim());
            const sorted = [...after].sort(cmp);
            if (dir === 'desc') sorted.reverse();

            expect(after, `${label} ${dir}`).to.deep.eq(sorted);

            // Only expect change if there were at least 2 distinct values
            if (distinct > 1) {
              expect(after.join('|')).not.eq(before.join('|'));
            }
          });
        });
      });
    }

    // ----------------------
    // 3) Test sorting for each column
    // ----------------------
    ['First Name', 'Last Name', 'Nickname', 'Contact'].forEach((h) => {
      sortAndAssert(h, 'asc');  // test ascending sort
      sortAndAssert(h, 'desc'); // test descending sort
    });
  });
});
