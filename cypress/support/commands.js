// --- Add typeInstant for typing without delays (useful for emails) ---
Cypress.Commands.add('typeInstant', { prevSubject: 'element' }, (subject, text) => {
  return cy.wrap(subject).type(text, { delay: 0 });
});
// Global login command (unchanged)
Cypress.Commands.add('loginHydralytica', () => {
  cy.visit('https://staging.hydralytica.dynacert.com/');
  cy.get('input[name="email"]').type('john.doe@dynacert.com');
  cy.get('input[name="password"]').type('123456');
  cy.get('button[type="submit"]').contains('Sign In').click();
  cy.url({ timeout: 10000 }).should('not.include', '/signin');

  cy.wait(3000);

  cy.get('body').then(($body) => {
    if ($body.text().includes('password') && $body.text().includes('data breach')) {
      cy.contains(/not now|dismiss|close|understand/i, { timeout: 5000 }).click({ force: true });
    }
  });

  cy.contains('Dashboard', { timeout: 10000 }).should('be.visible');
});

// --- Slow typing for all fields except emails ---
Cypress.Commands.overwrite('type', (originalFn, subject, text, options = {}) => {
  const nameAttr = subject.attr('name') || '';

  if (nameAttr.includes('contact') || nameAttr.includes('email')) {
    // Type instantly for emails/contacts to avoid truncation
    return originalFn(subject, text, { ...options, delay: 0 });
  }

  // Default: slow typing everywhere else (100ms per character)
  return originalFn(subject, text, { ...options, delay: 100 });
});

// --- Pause 3s after submit/update ---
Cypress.Commands.overwrite('click', (originalFn, subject, options = {}) => {
  const text = (subject.text() || '').toLowerCase();

  if (/(submit|create|update)/.test(text)) {
    return originalFn(subject, options).then(() => {
      return cy.wait(3000); // Properly chained wait
    });
  }

  return originalFn(subject, options);
});