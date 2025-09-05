/** @type {import('jest').Config} */
module.exports = {
  // Run tests through ts-jest, compiling to CJS for Jest
  preset: 'ts-jest',
  testEnvironment: 'node',

  // Transform TS using our Jest-specific tsconfig (CJS)
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', { tsconfig: 'tsconfig.jest.json', useESM: false }],
  },

  // Make sure ".ts" setup is compiled by ts-jest
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],

  // Map NodeNext-style ".js" imports from TS to bare paths for Jest
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },

  // Roots & patterns
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts'],

  // Coverage (unchanged)
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/__tests__/**',
    '!src/server.ts',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html', 'json'],
  coverageThreshold: {
    global: { branches: 80, functions: 80, lines: 80, statements: 80 },
  },

  // Other knobs
  testTimeout: 10000,
  verbose: true,
  errorOnDeprecated: true,
  maxWorkers: '50%',
};
