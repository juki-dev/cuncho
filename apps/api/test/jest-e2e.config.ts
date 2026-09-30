import type { Config } from 'jest';

const config: Config = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testRegex: '.*\\.e2e-spec\\.ts$',
  transform: { '^.+\\.ts$': ['ts-jest', { tsconfig: '<rootDir>/../tsconfig.json' }] },
  testEnvironment: 'node',
  setupFiles: ['reflect-metadata'],
  globalSetup: '<rootDir>/utils/global-setup.ts',
  globalTeardown: '<rootDir>/utils/global-teardown.ts',
  testTimeout: 30_000,
};

export default config;
