/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.ts'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  modulePaths: ['<rootDir>/tests/node_modules'],
  transform: {
    '^.+\\.tsx?$': [require.resolve('./tests/node_modules/ts-jest'), {
      tsconfig: 'tests/tsconfig.json',
      isolatedModules: true,
    }],
  },
  collectCoverageFrom: [
    'services/*/src/**/*.ts',
    '!services/*/src/main.ts',
    '!services/*/src/**/*.module.ts',
    '!services/*/src/**/*.dto.ts',
    '!services/*/src/**/*.schema.ts',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'text-summary', 'lcov'],
  verbose: true,
};
