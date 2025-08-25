// cypress/e2e/users_search.cy.js
// Test flow: Users Table Search → Add filters → Set Start Date → Remove filters → Reset
// Author: Julia Park

describe('Users - Table Search (resilient waits) + Start Date = Aug 1 + Reset', () => {
  const baseUrl = 'https://staging.hydralytica.dynacert.com';

  // Login credentials from environment variables or defaults
  const EMAIL = Cypress.env('USER_EMAIL') || 'john.doe@dynacert.com';
  const PASSWORD = Cypress.env('USER_PASSWORD') || '123456';

  // Fields we want to test in the filter (skip "Type")
  const FIELDS_TO_TEST = ['Name', 'Last Name', 'Nickname', 'Contact'];

  // Timing constants for pauses to improve visual stability
  const AFTER_ADD_RENDER_DELAY_MS = 500;   // pause after adding a filter before pressing Search
  const BEFORE_REMOVE_DELAY_MS = 500;      // short pause before removing a filter
  const NO_REQUEST_VISUAL_DELAY_MS = 400;  // pause when no network request fires
  const SEARCH_WAIT_TIMEOUT = 20000;       // max wait for API search request

  // Counters to track API calls for /api/user/search
  let usersSearchCount = 0;
  let usersSearchWaited = 0;

  /* ------------------ helpers ------------------ */

  // Open the field dropdown to select which column to filter
  const openFieldDropdown = () => {
    cy.contains('button, [role="button"], [role="combobox"], *', /^Select field$/i)
      .filter(':visible')
      .first()
      .click({ force: true });
  };

  // Choose an option (column) from the dropdown
  const chooseFieldOption = (label) => {
    cy.contains(
      '[role="option"], .radix-select-item, .dropdown-menu *, .menu *',
      new RegExp(`^${label}$`, 'i'), // match the exact label (case-insensitive)
      { timeout: 6000 }
    )
      .filter(':visible')
      .first()
      .click({ force: true });
  };

  // Type the criteria text and press "Add filter"
  const typeCriteriaAndAdd = (text) => {
    cy.get('input[placeholder="Criteria"], textarea[placeholder="Criteria"]')
      .filter(':visible')
      .clear({ force: true })
      .type(text, { force: true });

    cy.contains('button, [role="button"]', /^Add filter$/i)
      .filter(':visible')
      .click({ force: true });
  };

  // Click "Search" button; only waits if a new /api/user/search request fires
  const clickSearchMaybeWait = () => {
    cy.then(() => null).then(() => {
      const before = usersSearchCount;

      cy.contains('button, [role="button"]', /^Search$/i)
        .filter(':visible')
        .click({ force: true });

      cy.wait(100); // short pause for click to register

      cy.then(() => {
        const newCount = usersSearchCount;
        const delta = newCount - usersSearchWaited;

        if (newCount > before && delta > 0) {
          // Wait for each new API request triggered by this search
          for (let i = 0; i < delta; i++) {
            cy.wait('@usersSearch', { timeout: SEARCH_WAIT_TIMEOUT })
              .its('response.statusCode')
              .should('be.oneOf', [200, 204]);
            usersSearchWaited++;
          }
        } else {
          // No request fired; just a small visual pause
          cy.wait(NO_REQUEST_VISUAL_DELAY_MS);
        }
      });
    });
  };

  // Same logic as above, for Reset button: wait if a search is triggered
  const clickResetMaybeWait = () => {
    cy.then(() => null).then(() => {
      const before = usersSearchCount;

      cy.contains('button, [role="button"]', /^Reset$/i)
        .filter(':visible')
        .click({ force: true });

      cy.wait(100);

      cy.then(() => {
        const newCount = usersSearchCount;
        const delta = newCount - usersSearchWaited;

        if (newCount > before && delta > 0) {
          for (let i = 0; i < delta; i++) {
            cy.wait('@usersSearch', { timeout: SEARCH_WAIT_TIMEOUT })
              .its('response.statusCode')
              .should('be.oneOf', [200, 204]);
            usersSearchWaited++;
          }
        } else {
          cy.wait(NO_REQUEST_VISUAL_DELAY_MS);
        }
      });
    });
  };

  // Open the Start Date calendar and pick "1" of the current month
  const setStartDateCurrentMonthDay1 = () => {
    cy.contains('button, [role="button"], input', /^Start Date$/i)
      .filter(':visible')
      .first()
      .click({ force: true });

    cy.get('.rdp', { timeout: 8000 }).should('be.visible');

    cy.get('.left-1').click({ force: true}) // optional navigation in calendar

    // Click day "1" (only valid days in current month)
    cy.get('.rdp')
      .find('button:not(.rdp-day_outside)')
      .contains(/^1$/)
      .click({ force: true });

    // Calendar should close automatically
    cy.get('.rdp').should('not.exist');
  };

  // Remove a filter chip by label if it exists (skip silently if missing)
  const removeFilterChipIfPresent = (label) => {
    const chipRe = new RegExp(`^${label}:\\s*a\\s*$`, 'i');

    cy.get('body').then(($body) => {
      const el = [...$body.find('div, span')].find((node) =>
        chipRe.test((node.textContent || '').trim())
      );

      if (el) {
        cy.wrap(el).scrollIntoView().should('be.visible');
        cy.wrap(el)
          .parent()
          .within(() => {
            cy.get('button').filter(':visible').last().click({ force: true });
          });
      } else {
        // Log silently if chip not present
        Cypress.log({ name: 'removeFilterChipIfPresent', message: `chip not present: ${label}` });
      }
    });
  };

  /* ------------------ test ------------------ */

  it('adds 4 filters (Search each time), sets Aug 1, removes filters (Search each time), then Reset', () => {
    // --- Login ---
    cy.visit(`${baseUrl}/signin`);
    cy.get('input[name="email"], input[placeholder="Enter email address"]').clear().type(EMAIL);
    cy.get('input[name="password"], input[placeholder="Enter password"]').clear().type(PASSWORD, { log: false });
    cy.contains('button', /sign in/i).click();

    // --- Dashboard visible ---
    cy.contains(/Dashboard|Units Overview|Units Map/i, { timeout: 15000 }).should('be.visible');

    // --- Navigate to Users page ---
    cy.get('a[href="/users"]').filter(':visible').first().click({ force: true });
    cy.url().should('include', '/users');
    cy.contains(/^Users$/i).should('be.visible');

    // Intercept & count API requests for search
    cy.intercept('POST', '**/api/user/search**', (req) => {
      usersSearchCount += 1;
      req.continue();
    }).as('usersSearch');

    // --- Add 4 filters (skip "Type") ---
    FIELDS_TO_TEST.forEach((label) => {
      openFieldDropdown();        // open column dropdown
      chooseFieldOption(label);   // select column
      typeCriteriaAndAdd('a');    // type "a" in criteria and add filter

      // Ensure filter chip is visible
      cy.contains(new RegExp(`^${label}:\\s*a$`, 'i')).should('be.visible');
      cy.wait(AFTER_ADD_RENDER_DELAY_MS);

      clickSearchMaybeWait(); // click search, wait only if API triggered
    });

    // --- Start Date: set Aug 1 (current month) and Search ---
    setStartDateCurrentMonthDay1();
    clickSearchMaybeWait();

    // --- Remove filters one by one and Search each time ---
    FIELDS_TO_TEST.forEach((label) => {
      cy.wait(BEFORE_REMOVE_DELAY_MS);
      removeFilterChipIfPresent(label);
      clickSearchMaybeWait();
    });

    // --- Reset all filters and wait if search triggered ---
    clickResetMaybeWait();

    // --- Sanity checks after Reset ---
    cy.contains('button, [role="button"]', /^Start Date$/i).should('be.visible'); // Start Date placeholder reset
    FIELDS_TO_TEST.forEach((label) => {
      cy.contains(new RegExp(`^${label}:\\s*a$`, 'i')).should('not.exist'); // no filter chips remain
    });

    cy.get('table, [role="table"]').should('exist'); // table still present
  });
});
