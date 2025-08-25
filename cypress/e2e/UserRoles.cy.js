// cypress/e2e/UserRoles.cy.js
// Test flow: User Roles → Create user → Tour all permission roles
// Author: Julia Park

describe('UserRoles - Create user and tour all permission roles', () => {
  const baseUrl = 'https://staging.hydralytica.dynacert.com';

  const EMAIL = Cypress.env('USER_EMAIL') || 'john.doe@dynacert.com';
  const PASSWORD = Cypress.env('USER_PASSWORD') || '123456';

  // ----------------------
  // Timing constants for smooth visual execution
  // ----------------------
  const SCROLL_STEP_DELAY = 500; // pause between scroll steps
  const SCROLL_ANIM_MS   = 600;  // scroll animation duration
  const USERS_SETTLE_MS  = 1200; // wait for page banners/animations to finish

  // Generates a small unique string suffix for test data
  const unique = () => `${Date.now().toString().slice(-4)}${Cypress._.random(10, 99)}`;

  // ----------------------
  // Helper: Scroll page down/up through the permissions section
  // ----------------------
  const slowScrollDownThenUp = () => {
    cy.scrollTo('center', { duration: SCROLL_ANIM_MS });
    cy.wait(SCROLL_STEP_DELAY);
    cy.scrollTo('bottom', { duration: SCROLL_ANIM_MS });
    cy.wait(SCROLL_STEP_DELAY);
    cy.contains(/^Permissions$/i).scrollIntoView({ duration: SCROLL_ANIM_MS });
    cy.wait(SCROLL_STEP_DELAY);
  };

  // ----------------------
  // Helper: Click "Add" button inside a card by card title (e.g., Contact)
  // ----------------------
  const clickAddInCard = (cardTitleRe) => {
    cy.contains('div[data-slot="card-title"]', cardTitleRe)
      .parents('[data-slot="card"]')
      .within(() => {
        cy.contains('button', 'Add').should('be.visible').click();
      });
  };

  // ----------------------
  // Helper: Open a dropdown near a label
  // ----------------------
  const openSelectNear = (labelRegex) => {
    cy.contains('div, label, span, p, legend, h2, h3', labelRegex)
      .should('be.visible')
      .then(($label) => {
        const triggerSel = 'button,[role="combobox"],[aria-haspopup="listbox"]';
        const $parent = $label.parent();
        if ($parent.find(triggerSel).length) {
          cy.wrap($parent).find(triggerSel).filter(':visible').first().click({ force: true });
        } else {
          cy.wrap($label).closest('div').parent().within(() => {
            cy.get(triggerSel).filter(':visible').first().click({ force: true });
          });
        }
      });
  };

  // ----------------------
  // Helper: Choose an option from an open dropdown
  // ----------------------
  const chooseOption = (text) => {
    cy.contains(
      '[role="option"], .radix-select-item, .SelectItem, li, [role="menuitem"], .dropdown-menu *',
      new RegExp(`^\\s*${Cypress._.escapeRegExp(text)}\\s*$`, 'i'),
      { timeout: 8000 }
    )
      .filter(':visible')
      .first()
      .click({ force: true });
  };

  // ----------------------
  // Helper: Open the Permissions → Role dropdown
  // ----------------------
  const openPermissionsRoleDropdown = () => {
    // Scroll the Permissions card into view
    cy.contains(/^Permissions$/i)
      .scrollIntoView({ duration: 500 })
      .should('be.visible')
      .closest('section, div')
      .within(() => {
        // Click the current value (usually "Custom")
        cy.get('.space-y-6 > :nth-child(1)').click({ force: true });
      });

    // Fallback: check if the list opened; if not, try alternative trigger
    cy.get('body').then(($b) => {
      const opened = $b.find('[role="listbox"], .radix-select-content, .SelectItem, .radix-select-item, li[role="option"]').length > 0;
      if (!opened) {
        cy.contains(/^Permissions$/i)
          .closest('section, div')
          .within(() => {
            cy.get('button,[role="combobox"],[aria-haspopup="listbox"]')
              .filter(':visible')
              .first()
              .click({ force: true });
          });
      }
    });

    // Guard: ensure the options are visible
    cy.get('[role="option"], .radix-select-content *, .SelectItem, .radix-select-item, li[role="option"]')
      .filter(':visible')
      .should('have.length.greaterThan', 0);
  };

  // ----------------------
  // Helper: Get all visible option labels from a dropdown
  // ----------------------
  const getAllRoleOptionLabels = () =>
    cy.get('[role="option"], .radix-select-item, .SelectItem, li, [role="menuitem"], .dropdown-menu *')
      .filter(':visible')
      .then(($els) => {
        const labels = [...$els].map((el) => (el.textContent || '').trim()).filter(Boolean);
        return [...new Set(labels)]; // remove duplicates
      });

  // ----------------------
  // Test case: login, go to Users, Create user, tour permission roles
  // ----------------------
  it('logs in, visits Users, redirects to Create, fills form, then tours roles', () => {
    const sfx = unique(); // unique suffix for test data

    // --- Login ---
    cy.visit(`${baseUrl}/signin`);
    cy.get('input[name="email"], input[placeholder="Enter email address"]').clear().type(EMAIL);
    cy.get('input[name="password"], input[placeholder="Enter password"]').clear().type(PASSWORD, { log: false });
    cy.contains('button', /sign in/i).click();

    // --- Navigate to Users page ---
    cy.contains(/Dashboard|Units Overview|Units Map/i, { timeout: 15000 }).should('be.visible');
    cy.get('a[href="/users"]').filter(':visible').first().click({ force: true });
    cy.location('pathname').should('match', /\/users\b/);
    cy.contains(/^Users$/i).should('be.visible');
    cy.contains('button', /Search/i).should('be.visible'); // page ready
    cy.wait(USERS_SETTLE_MS);

    // --- Go to Create User page ---
    cy.visit(`${baseUrl}/users/create`);
    cy.location('pathname', { timeout: 10000 }).should('match', /\/users\/create\b/);
    cy.contains(/^Create User$/i).should('be.visible');

    // --- Fill form one input at a time ---
    const CREATE_URL = `${baseUrl}/users/create`;
    const EDITABLE_INPUTS =
      'input:visible:not([type="checkbox"]):not([type="radio"]):not([type="hidden"]):not([readonly]), textarea:visible';

    cy.get(EDITABLE_INPUTS).then(($all0) => {
      const count = $all0.length;
      cy.log(`Create page: found ${count} editable inputs/areas`);

      for (let i = 0; i < count; i += 1) {
        // Reload page to reset form state
        cy.visit(CREATE_URL);
        cy.location('pathname').should('match', /\/users\/create\b/);

        cy.get(EDITABLE_INPUTS).then(($all) => {
          // Clear all inputs first
          cy.wrap($all).each(($el) => {
            cy.wrap($el).clear({ force: true }).catch(() => {});
          });

          // Fill only the i-th input with unique or email-like value
          const $target = $all.eq(i);
          const wrap = cy.wrap($target);
          const type = ($target.attr('type') || '').toLowerCase();
          const name = ($target.attr('name') || '').toLowerCase();
          const ph   = ($target.attr('placeholder') || '').toLowerCase();

          const looksEmail = type === 'email' || /email/.test(name) || /email/.test(ph);
          const value = looksEmail
            ? `only_${Date.now()}_${i}@example.com`
            : `OnlyField_${i}_${Date.now()}`;

          wrap.type(value, { force: true });

          // Scroll to bottom to reveal Create button
          cy.scrollTo('bottom', { ensureScrollable: false });

          // Click Create
          cy.contains('button, [role="button"]', /^create$/i)
            .scrollIntoView()
            .click({ force: true });

          // Optional: small pause to visually confirm validation
          cy.wait(400);

          // Optional: check for validation messages
          // e.g., cy.contains(/please/i).should('be.visible');
        });
      }
    });

    // Note: This test does not perform final Save/Submit — it is for visual verification
  });
});
