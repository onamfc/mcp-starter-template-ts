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

  // Coverage
  collectCoverageFrom: [
    'src/**/*.ts',

    // exclude tests, d.ts, and bootstrap
    '!src/**/*.d.ts',
    '!src/__tests__/**',
    '!src/start.ts',

    // exclude barrels & pure type exports
    '!src/**/index.ts',
    '!src/types/**',

    // exclude integration-heavy or env-coupled modules you’re not unit-testing now
    '!src/server-core.ts',
    '!src/utils/logger.ts',
    '!src/utils/health.ts',
    '!src/resources/**',
    '!src/tools/filesystem.ts',
    '!src/tools/weather.ts',
  ],
  coveragePathIgnorePatterns: [
    '<rootDir>/src/start.ts',
    '<rootDir>/src/server-core.ts',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html', 'json'],
  coverageThreshold: {
    global: { branches: 80, functions: 80, lines: 80, statements: 80 },
  },
  testTimeout: 10000,
  verbose: true,
  errorOnDeprecated: true,
  maxWorkers: '50%',
};
