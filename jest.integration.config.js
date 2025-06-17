module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/tests/integration/**/*.test.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/main.ts'
  ],
  coverageDirectory: 'coverage/integration',
  coverageReporters: ['text', 'lcov', 'html'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts']
};
