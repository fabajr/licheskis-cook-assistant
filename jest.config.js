module.exports = {
  moduleNameMapper: {
    '^axios$': '<rootDir>/src/__mocks__/axios.js',
    '^\\./firebase$': '<rootDir>/src/__mocks__/firebase.js',
    '^\\.\\./firebase$': '<rootDir>/src/__mocks__/firebase.js',
    '^\\.\\./\\.\\./firebase$': '<rootDir>/src/__mocks__/firebase.js',
  },
  testEnvironment: 'jsdom',
};