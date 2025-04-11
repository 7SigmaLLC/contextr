// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  testPathIgnorePatterns: ['/node_modules/', '/.sandbox/'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  silent: true, // suppresses all console logs
};