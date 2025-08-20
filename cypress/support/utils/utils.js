// cypress/support/utils.js

export const logTestResult = (testName, status) => {
  const symbol = status === 'pass' ? '✅' : '❌';
  const color = status === 'pass' ? 'color: green' : 'color: red';
  console.log(`%c${symbol} ${testName}`, color);
};

export const generateUniqueEmail = () => {
  return `user.${Date.now()}@example.com`;
};

export const registerAfterEachHook = (logTestResult) => {
  afterEach(function () {
    const testName = this.currentTest.title; // Current test name
    const status = this.currentTest.state;   // Test status: passed or failed

    if (Cypress.config('isInteractive')) {
      cy.wait(4000); // pause effect in interactive mode
    }

    if (status === 'failed') {
      const screenshotName = testName.replace(/[^a-zA-Z0-9]/g, '_');

      cy.screenshot(`failure-${screenshotName}`, { capture: 'runner' })
        .then(() => {
          Cypress.log({
            name: 'screenshot',
            message: `✅ Screenshot saved: failure-${screenshotName}.png`
          });
        })
        .catch((err) => {
          Cypress.log({
            name: 'screenshot',
            message: `⚠️ Screenshot failed: ${err.message}`
          });
        });
    }

    // Log result (console, dashboard, etc.)
    logTestResult(testName, status);
  });
};