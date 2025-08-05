// Main test suite for editing an organization with various input validations
describe('Hydralytica v2 - Organization Management Tests', () => {
  // Generate unique timestamp-based data to avoid conflicts and ensure fresh test values
  const timestamp = Date.now();
  const updatedNotes = `Updated via Cypress at ${timestamp}`;
  const updatedCity = `Toronto ${timestamp}`;
  const updatedZip = `M5H-${timestamp.toString().slice(-3)}`;
  const newEmail = `updated.${timestamp}@cypresstest.com`;

  // Runs before each test case: log in, verify dashboard loaded, then navigate to organizations page
  beforeEach(() => {
    cy.loginHydralytica(); // Custom login command
    cy.contains('Dashboard', { timeout: 10000 }).should('be.visible'); // Confirm Dashboard
    cy.visit('/organizations'); // Go to organizations list page
    cy.contains('Organizations').should('be.visible'); // Confirm page loaded
  });

  // Test: Edit the first organization card and verify updated values are saved and displayed
  it('UC-ORG-002: should edit the first organization and verify updated values', () => {
    // Find the first organization card and click its "Edit" button
    cy.get('[data-slot="card"]').first().within(() => {
      cy.contains('Edit').click();
    });

    // Ensure URL is now on edit page
    cy.url().should('include', '/organizations/edit');

    // Update fields with new data
    cy.get('textarea[name="notes"]').clear().type(updatedNotes);
    cy.get('input[name="addressFields.city"]').clear().type(updatedCity);
    cy.get('input[name="addressFields.zipCode"]').clear().type(updatedZip);
    // Use custom typeInstant command to speed typing email
    cy.get('input[name="contactFields.contact"]').clear().typeInstant(newEmail);

    // Click "Update" to save changes
    cy.contains('button', 'Update').click();

    // Confirm success notification appears
    cy.contains('Organization updated successfully', { timeout: 10000 }).should('be.visible');

    // Return to organizations list and verify updated city and email are displayed
    cy.visit('/organizations');
    cy.get('[data-slot="card"]').first().within(() => {
      cy.contains(updatedCity).should('exist');
      cy.contains(newEmail).should('exist');
    });
  });

  // Test: Disable update button if required contact field is empty (form validation)
  it('UC-ORG-002: should disable update button if required fields are empty', () => {
    // Edit the first organization card
    cy.get('[data-slot="card"]').first().within(() => {
      cy.contains('Edit').click();
    });

    // Clear the required contact field
    cy.get('input[name="contactFields.contact"]').clear();

    // The Update button should be disabled because required field is empty
    cy.contains('button', 'Update').should('be.disabled');
  });

  // Test: Simulate server failure on update and verify error message shown
  it('UC-ORG-002: should show error on server failure during update', () => {
    // Intercept PUT requests to organizations and force a 500 error response
    cy.intercept('PUT', '/organizations/*', {
      statusCode: 500,
      body: { error: 'Update failed' },
    }).as('updateFail');

    // Edit the first organization
    cy.get('[data-slot="card"]').first().within(() => {
      cy.contains('Edit').click();
    });

    // Change notes and attempt update
    cy.get('textarea[name="notes"]').clear().type('Testing server failure');
    cy.contains('button', 'Update').click();

    // Wait for intercepted request and verify error message is displayed
    cy.wait('@updateFail');
    cy.contains('An error occurred while updating organization').should('be.visible');
  });

  // Test: Search organizations by city or name
  it('UC-ORG-004: should search organization by city or name', () => {
    const searchTerm = 'Toronto'; // Known city expected to exist
    cy.get('input[placeholder*="Search"]').type(`${searchTerm}{enter}`); // Type search and submit
    // Verify organization card containing search term is visible
    cy.contains('[data-slot="card"]', searchTerm).should('exist');
  });

  // Test: Sort organization list by name
  it('UC-ORG-006: should sort organization list by name', () => {
    cy.get('[data-cy="sort-dropdown"]').click(); // Open sort dropdown
    cy.contains('Sort by Name').click(); // Choose "Sort by Name"
    cy.get('[data-slot="card"]').first().should('exist'); // Verify cards are shown (sort applied)
  });

  // Test: Organizations with active units should be visually highlighted
  it('UC-ORG-007: should visually highlight organizations with active units', () => {
    cy.get('[data-slot="card"]').each(($card) => {
      if ($card.text().includes('Active Units')) {
        // Expect the card to have 'highlighted' class for visual emphasis
        cy.wrap($card).should('have.class', 'highlighted');
      }
    });
  });

  // Test: Download organization list as CSV file and verify its content
  it('UC-ORG-005: should download organization list as CSV', () => {
    cy.contains('Download CSV').click(); // Click CSV download button
    // Read downloaded CSV file and verify it contains the header "Organization Name"
    cy.readFile('cypress/downloads/organizations.csv').should('contain', 'Organization Name');
  });

  // Test: Assign a parent organization to the first organization and verify update
  it('UC-ORG-003: should allow assigning a parent organization', () => {
    // Edit the first organization card
    cy.get('[data-slot="card"]').first().within(() => {
      cy.contains('Edit').click();
    });

    // Select 'dynaCERT Inc' as the parent organization from dropdown
    cy.get('select[name="parentOrganizationId"]').select('dynaCERT Inc');
    cy.contains('button', 'Update').click();

    // Confirm update success message
    cy.contains('Organization updated successfully', { timeout: 10000 }).should('be.visible');

    // Return to list and verify parent organization name is shown on card
    cy.visit('/organizations');
    cy.get('[data-slot="card"]').first().should('contain.text', 'dynaCERT Inc');
  });

  // Test: Verify activity log records changes made to organizations
  it('UC-ORG-008: should log changes in the activity log', () => {
    cy.visit('/activity-log'); // Navigate to Activity Log page

    // Check that the log contains an entry for updated organization with new email
    cy.contains('Updated Organization').should('exist');
    cy.contains(newEmail).should('exist');
  });
});
