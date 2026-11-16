import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.spec.js'],
    setupFiles: ['./src/testSetup.js'],
    fileParallelism: false,
    testTimeout: 20000,
  },
});
