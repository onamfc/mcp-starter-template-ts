module.exports = {
  parser: '@typescript-eslint/parser',
  extends: [
    'eslint:recommended',
    '@typescript-eslint/eslint-recommended',
    '@typescript-eslint/recommended',
  ],
  plugins: ['@typescript-eslint'],
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
  },
  env: {
    node: true,
    es2022: true,
    jest: true
  },
  rules: {
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-var-requires': 'off', // Allow require in test setup
    'no-console': ['warn', { allow: ['error'] }], // Allow console.error
    'no-debugger': 'error',
    'prefer-const': 'error',
    'no-var': 'error',
    'object-shorthand': 'error',
    'prefer-arrow-callback': 'error'
  },
  overrides: [
    {
      files: ['**/__tests__/**/*', '**/*.test.ts'],
      rules: {
        'no-console': 'off', // Allow console in tests
        '@typescript-eslint/no-explicit-any': 'off', // Allow any in tests
        '@typescript-eslint/no-var-requires': 'off', // Allow require in tests
      }
    }
  ],
  ignorePatterns: ['dist', 'node_modules', 'coverage', '*.js']
};