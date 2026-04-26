module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.ts', '**/*.test.ts'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { isolatedModules: true }],
  },
  moduleNameMapper: {
    '^@jaad-pos/shared$': '<rootDir>/../../packages/shared/src/index.ts',
  },
  collectCoverageFrom: ['src/**/*.ts', '!src/server.ts'],
};
