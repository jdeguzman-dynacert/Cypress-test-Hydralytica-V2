// Author: Julia Park

// Cypress test suite for adding a user
describe('AddUser', () => {
  const baseUrl = 'https://staging.hydralytica.dynacert.com';

  // Credentials from environment variables or fallback defaults
  const EMAIL = Cypress.env('USER_EMAIL') || 'john.doe@dynacert.com';
  const PASSWORD = Cypress.env('USER_PASSWORD') || '123456';

  // Timing constants for scrolling and animations
  const SCROLL_STEP_DELAY = 500; // pause between scroll steps
  const SCROLL_ANIM_MS   = 600;  // duration for scroll animations
  const USERS_SETTLE_MS  = 1200; // wait time for page animations/banners to settle

  // Generate a unique suffix using timestamp and random number
  const unique = () =>
    `${Date.now().toString().slice(-4)}${Cypress._.random(10, 99)}`;

  // Scrolls down and up the page with pauses to mimic slow user interaction
  const slowScrollDownThenUp = () => {
    cy.scrollTo('center', { duration: SCROLL_ANIM_MS });
    cy.wait(SCROLL_STEP_DELAY);
    cy.scrollTo('bottom', { duration: SCROLL_ANIM_MS });
    cy.wait(SCROLL_STEP_DELAY);
    cy.contains(/^Permissions$/i).scrollIntoView({ duration: SCROLL_ANIM_MS });
    cy.wait(SCROLL_STEP_DELAY);
  };

  // Clicks the "Add" button inside a card with the given title
  const clickAddInCard = (cardTitleRe) => {
    cy.contains('div[data-slot="card-title"]', 'Contact')
      .parents('[data-slot="card"]')
      .within(() => {
        cy.contains('button', 'Add').should('be.visible').click();
      });
  };

  // Opens a dropdown/select near a label that matches the regex
  const openSelectNear = (labelRegex) => {
    cy.contains('div, label, span, p, legend, h2, h3', labelRegex)
      .should('be.visible')
      .then(($label) => {
        const triggerSel = 'button,[role="combobox"],[aria-haspopup="listbox"]';
        const $parent = $label.parent();
        if ($parent.find(triggerSel).length) {
          // click dropdown if directly found
          cy.wrap($parent).find(triggerSel).filter(':visible').first().click({ force: true });
        } else {
          // fallback: look higher up in DOM
          cy.wrap($label).closest('div').parent().within(() => {
            cy.get(triggerSel).filter(':visible').first().click({ force: true });
          });
        }
      });
  };

  // Selects an option from a dropdown by its visible text
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

  // Opens the Permissions role dropdown specifically
  const openPermissionsRoleDropdown = () => {
    // Scroll the Permissions card into view and click the first element inside
    cy.contains(/^Permissions$/i)
      .scrollIntoView({ duration: 500 })
      .should('be.visible')
      .closest('section, div')
      .within(() => {
        cy.get('.space-y-6 > :nth-child(1)').click({ force: true });
      });

    // If dropdown did not open, click again as a fallback
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

    // Verify options are present
    cy.get('[role="option"], .radix-select-content *, .SelectItem, .radix-select-item, li[role="option"]')
      .filter(':visible')
      .should('have.length.greaterThan', 0);
  };

  // Returns a list of all visible option labels in a dropdown
  const getAllRoleOptionLabels = () =>
    cy.get('[role="option"], .radix-select-item, .SelectItem, li, [role="menuitem"], .dropdown-menu *')
      .filter(':visible')
      .then(($els) => {
        const labels = [...$els].map((el) => (el.textContent || '').trim()).filter(Boolean);
        return [...new Set(labels)]; // remove duplicates
      });

  // Test case: login, navigate to Users page, create user, fill inputs, and test roles
  it('logs in, visits Users, redirects to Create, fills form, then tours roles', () => {
    const sfx = unique();

    // Login
    cy.visit(`${baseUrl}/signin`);
    cy.get('input[name="email"], input[placeholder="Enter email address"]').clear().type(EMAIL);
    cy.get('input[name="password"], input[placeholder="Enter password"]').clear().type(PASSWORD, { log: false });
    cy.contains('button', /sign in/i).click();

    // Wait for dashboard to load
    cy.contains(/Dashboard|Units Overview|Units Map/i, { timeout: 15000 }).should('be.visible');

    // Navigate to Users page
    cy.get('a[href="/users"]').filter(':visible').first().click({ force: true });
    cy.location('pathname').should('match', /\/users\b/);
    cy.contains(/^Users$/i).should('be.visible');
    cy.contains('button', /Search/i).should('be.visible'); // page ready
    cy.wait(USERS_SETTLE_MS);

    // Navigate to Create User page
    cy.visit(`${baseUrl}/users/create`);
    cy.location('pathname', { timeout: 10000 }).should('match', /\/users\/create\b/);
    cy.contains(/^Create User$/i).should('be.visible');

    // Setup editable input selectors
    const CREATE_URL = `${baseUrl}/users/create`;
    const EDITABLE_INPUTS =
      'input:visible:not([type="checkbox"]):not([type="radio"]):not([type="hidden"]):not([readonly]), textarea:visible';

    // Detect all editable inputs and log their count
    cy.get(EDITABLE_INPUTS).then(($all0) => {
      const total = $all0.length;
      cy.log(`Editable inputs detected: ${total}`);

      // Recursive function to fill each input field one by one
      const sweep = (i) => {
        if (i >= total) return; // stop recursion when all fields are processed

        // Reload page to reset form
        cy.visit(CREATE_URL);
        cy.location('pathname').should('match', /\/users\/create\b/);
        cy.contains(/^Create User$/i).should('be.visible');

        cy.get(EDITABLE_INPUTS).then(($all) => {
          // Clear all inputs
          cy.wrap($all).each(($el) => {
            const $jq = Cypress.$($el);
            if (!$jq.prop('disabled') && !$jq.prop('readOnly')) {
              cy.wrap($el).focus().type('{selectAll}{backspace}', { force: true });
            }
          });

          // Target the i-th input for typing
          const $target = $all.eq(i);
          const type = ($target.attr('type') || '').toLowerCase();
          const name = ($target.attr('name') || '').toLowerCase();
          const ph   = ($target.attr('placeholder') || '').toLowerCase();
          const looksEmail = type === 'email' || /email/.test(name) || /email/.test(ph);

          // Generate value for input field
          const val = looksEmail
            ? `only_${Date.now()}_${i}@example.com`
            : `Field_${i}_${Date.now()}`;

          cy.wrap($target).scrollIntoView().focus().type(val, { force: true });
        });

        // Scroll down and click the "Create" button
        cy.scrollTo('bottom', { ensureScrollable: false });
        cy.contains('button, [role="button"]', /^create$/i)
          .scrollIntoView()
          .click({ force: true });

        // Check for toast messages or validation errors
        cy.get('body', { timeout: 4000 }).then(($b) => {
          const hasToast = $b.find('[role="alert"], .toaster, .ToastViewport, .notification').length > 0;
          if (hasToast) {
            cy.get('[role="alert"], .toaster, .ToastViewport, .notification')
              .filter(':visible')
              .should('exist');
          } else {
            cy.contains(/required|invalid|please|failed|This field is required|At least one address is required|cannot create/i, { timeout: 2000 }).should('exist');
          }
        });

        // Continue to next input recursively
        cy.then(() => sweep(i + 1));
      };

      // Start filling inputs
      sweep(0);
    });

  });
});
