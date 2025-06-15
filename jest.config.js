module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/main.ts'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  // fix for the error: Cannot find module '@/domain/value-objects/Email'
  // moduleNameMapping: {
  //   '^@/(.*)$': '<rootDir>/src/$1'
  // },
  // to fix the error: Cannot find module '@/domain/value-objects/Email'
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts']
};
