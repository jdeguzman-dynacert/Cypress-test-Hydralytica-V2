// cypress/support/utils.js

export const logTestResult = (testName, status) => {
  const symbol = status === 'pass' ? '✅' : '❌';
  const color = status === 'pass' ? 'color: green' : 'color: red';
  console.log(`%c${symbol} ${testName}`, color);
};

export const generateUniqueEmail = () => {
  return `user.${Date.now()}@example.com`;
};

