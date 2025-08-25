// cypress/e2e/list_users.cy.js
// Login -> Users -> cycle Rows-per-page with a visual pause
// -> Columns dialog: toggle one column OFF, click Done, repeat for all
// -> Pause to show empty table -> click Reset

describe('Users - Rows per page + Columns toggling', () => {
  const baseUrl = 'https://staging.hydralytica.dynacert.com';

  const EMAIL = Cypress.env('USER_EMAIL') || 'john.doe@dynacert.com';
  const PASSWORD = Cypress.env('USER_PASSWORD') || '123456';

  const RPP_OPTIONS = [10, 20, 30, 40, 50];
  const VIEW_DELAY_MS = 1000;         // pause after each rows-per-page change
  const EMPTY_VIEW_DELAY_MS = 1500;   // pause when all columns are hidden

  // Column toggle labels (as shown in the dialog) → table header text
  const COLUMNS_MAP = [
    { toggle: 'Name',      header: 'First Name' },
    { toggle: 'Last Name', header: 'Last Name' },
    { toggle: 'Nickname',  header: 'Nickname' },
    { toggle: 'Contact',   header: 'Contact' },
    { toggle: 'Type',      header: 'Type' },
    { toggle: 'Created',   header: 'Created' },
  ];

  /* ---------------- helpers ---------------- */

  const openRowsPerPage = () => {
    cy.contains('div, span, p, label', /^Rows per page$/i)
      .scrollIntoView()
      .should('be.visible')
      .then($label => {
        const triggerSel = 'button,[role="combobox"],[aria-haspopup="listbox"]';
        const $parent = $label.parent();
        if ($parent.find(triggerSel).length) {
          cy.wrap($parent).find(triggerSel).filter(':visible').first().click({ force: true });
          return;
        }
        cy.wrap($label).closest('div').parent().within(() => {
          cy.get(triggerSel).filter(':visible').first().click({ force: true });
        });
      });
  };

  const chooseRowsPerPage = (n) => {
    openRowsPerPage();
    cy.contains(
      '[role="option"], li, div[role="menuitem"], .radix-select-item, .SelectItem, .dropdown-menu *',
      new RegExp(`^\\s*${n}\\s*$`)
    )
      .filter(':visible')
      .first()
      .click({ force: true });

    // trigger shows the new value
    cy.contains('div, span, p, label', /^Rows per page$/i)
      .parent()
      .find('button,[role="combobox"],[aria-haspopup="listbox"]')
      .filter(':visible')
      .contains(new RegExp(`^\\s*${n}\\s*$`))
      .should('be.visible');

    // table should render <= n rows (best-effort visual check)
    cy.get('table tbody tr').then($rows => {
      expect($rows.length, 'rows visible <= page size').to.be.at.most(n);
    });

    cy.wait(VIEW_DELAY_MS);
  };

  const openColumnsDialog = () => {
    // Button shows tooltip aria-label="Columns" in your screenshot; fall back to text
    cy.get('button[aria-label="Columns"]')
      .filter(':visible')
      .click({ force: true })
      .then(null, () => {
        cy.contains('button, [role="button"]', /^Columns$/i).filter(':visible').click({ force: true });
      });

    cy.contains('[role="dialog"] *, .dialog, .modal', /^Visible Columns$/i, { timeout: 6000 })
      .should('be.visible');
  };

  const clickDoneInDialog = () => {
    cy.contains('[role="dialog"] button, [role="dialog"] [role="button"], .modal button', /^Done$/i)
      .filter(':visible')
      .click({ force: true });
    cy.get('[role="dialog"]').should('not.exist');
  };

  // Toggle a single column OFF (if it's on) by label inside the dialog
  const toggleColumnOff = (toggleLabel) => {
    openColumnsDialog();

    cy.contains('[role="dialog"] div, [role="dialog"] label, [role="dialog"] span', new RegExp(`^${toggleLabel}$`, 'i'))
      .should('be.visible')
      .then($label => {
        // Find a nearby switch/checkbox; shadcn uses role="switch" with aria-checked
        const root = cy.wrap($label).closest('[role="dialog"]');
        root.then(() => {
          cy.wrap($label)
            .parent() // assume row container
            .within(() => {
              cy.get('[role="switch"], input[type="checkbox"]')
                .filter(':visible')
                .first()
                .then($switch => {
                  const ariaChecked = $switch.attr('aria-checked');
                  const isChecked = ariaChecked === 'true' || ($switch.is(':checkbox') && $switch.is(':checked'));
                  if (isChecked) {
                    cy.wrap($switch).click({ force: true });
                  }
                });
            });
        });
      });

    clickDoneInDialog();
  };

  // Assert a given header text is not visible in the table header
  const assertHeaderHidden = (headerText) => {
    cy.get('table thead').within(() => {
      cy.contains('th, div, span', new RegExp(`^${headerText}$`, 'i')).should('not.exist');
    });
  };

  const resetFromToolbar = () => {
    cy.contains('button, [role="button"]', /^Reset$/i)
      .filter(':visible')
      .click({ force: true });
  };

  /* ---------------- test ---------------- */

  it('cycles page sizes, then hides columns one by one, then resets', () => {
    // Login
    cy.visit(`${baseUrl}/signin`);
    cy.get('input[name="email"], input[placeholder="Enter email address"]').clear().type(EMAIL);
    cy.get('input[name="password"], input[placeholder="Enter password"]').clear().type(PASSWORD, { log: false });
    cy.contains('button', /sign in/i).click();

    // Dashboard -> Users
    cy.contains(/Dashboard|Units Overview|Units Map/i, { timeout: 15000 }).should('be.visible');
    cy.get('a[href="/users"]').filter(':visible').first().click({ force: true });
    cy.url().should('include', '/users');
    cy.contains(/^Users$/i).should('be.visible');
    cy.get('table, [role="table"]').should('exist');

    // Rows per page: 10 → 20 → 30 → 40 → 50 (with pause)
    RPP_OPTIONS.forEach(n => chooseRowsPerPage(n));

    // Columns: toggle OFF one at a time, pressing Done each time
    COLUMNS_MAP.forEach(({ toggle, header }) => {
      toggleColumnOff(toggle);
      assertHeaderHidden(header);
    });

    // After all are off, give a moment to visually confirm "no columns"
    // (We assert that none of those known headers are present)
    COLUMNS_MAP.forEach(({ header }) => assertHeaderHidden(header));
    cy.wait(EMPTY_VIEW_DELAY_MS);

    // Reset to restore defaults
    resetFromToolbar();

    // Sanity: at least one known header should return (Name/First Name, etc.)
    cy.get('table thead th:visible').its('length').should('be.greaterThan', 0);
  });
});
