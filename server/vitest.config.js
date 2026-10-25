import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    testTimeout: 20000,
    hookTimeout: 20000,
    globalSetup: './tests/globalSetup.js',
    fileParallelism: false,
    maxConcurrency: 1,
  },
});
