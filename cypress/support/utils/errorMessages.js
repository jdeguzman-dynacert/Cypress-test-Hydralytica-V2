// Validation error messages
export const validationErrors = {
  required: 'This field is required',
  tooLong: 'Input is too long',
  email: 'Please enter a valid email address',
  phone: 'Please enter a valid phone number',
  url: 'Please enter a valid website URL',
  postalCode: 'Please enter a valid postal code',
  passwordMatch: "Passwords don't match",
  contactIsRequired: 'At least one contact is required',
  addressIsRequired: 'At least one address is required',
  cantRemoveLoginEmail: 'Login email cannot be removed',
  cantChangeLoginEmailType: 'Login email type cannot be changed',
  cantHaveMultipleLoginEmails: 'There can only be one login email',
};

// Status error messages
export const statusErrors = {
  generic: 'An error occurred',
  create: 'Error creating resource',
  update: 'Error updating resource',
  delete: 'Error deleting resource',
  install: 'Error installing resource',
  load: 'Error loading data',
  auth: 'Authentication required',
  permission: "You don't have permission for this action",
  notFound: 'Resource not found',
  signin: 'Sign in failed. Please check your credentials.',
  preferenceId: 'Missing preference ID',
};
