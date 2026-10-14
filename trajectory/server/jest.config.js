/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.ts'],
  moduleNameMapper: {
    '^@trajectory/shared$': '<rootDir>/../shared/src/index.ts',
    '^@trajectory/shared/(.*)$': '<rootDir>/../shared/src/$1',
    // Strip .js extensions for ts-jest (TypeScript uses .js imports for ESM compatibility)
    '^(\\./|\\.\\./)(.*)\\.js$': '$1$2',
  },
  setupFiles: ['<rootDir>/tests/setup/setupEnv.ts'],
  testTimeout: 30000,
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      tsconfig: {
        paths: {
          '@trajectory/shared': ['../shared/src/index.ts'],
        },
      },
    }],
  },
};
