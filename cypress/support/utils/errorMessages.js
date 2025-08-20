// cypress/support/utils/errorMessages.js

export const validationErrors = {
  required: 'This field is required',
  orgNameRequired: 'Organization name is required',
  emailRequired: 'Email is required',
  emailInvalid: 'Email is invalid',
  tooShort: 'Must be at least 2 characters',
  tooLong: 'Input is too long',   // ✅ confirmed from HTML
  postalCodeInvalid: 'Postal code is invalid',
  contactIsRequired: 'At least one contact is required',
  addressIsRequired: 'At least one address is required',
  cantRemoveLoginEmail: 'Login email cannot be removed',
  cantChangeLoginEmailType: 'Login email type cannot be changed',
  cantHaveMultipleLoginEmails: 'There can only be one login email',
  invalidCharacters: 'Contains invalid characters'
};

export const statusErrors = {
  create: 'Error creating organization. Please try again.',
  update: 'Error updating organization. Please try again.',
  delete: 'Error deleting organization. Please try again.'
};
