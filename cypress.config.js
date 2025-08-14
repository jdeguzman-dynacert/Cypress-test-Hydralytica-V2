const { defineConfig } = require('cypress');

module.exports = defineConfig({
  e2e: {
    baseUrl: 'https://staging.hydralytica.dynacert.com',
    screenshotOnRunFailure: true,
    video: false,
    setupNodeEvents(on, config) {
      // Required if you want to customize or hook into test reporting
    },
    specPattern: 'cypress/e2e/**/*.cy.js',
  },
  projectId: "x5b3rx",
  reporter: 'mochawesome',
  reporterOptions: {
    reportDir: 'cypress/reports',
    overwrite: false,
    html: true,
    json: true,
    reportPageTitle: 'User Form Test Report',
    timestamp: 'mmddyyyy_HHMMss',
  },
});
