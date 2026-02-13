import { defineConfig } from 'vitest/config';
import { config } from 'dotenv';

// Load test env vars before anything else
config({ path: '.env.test' });

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    testTimeout: 15000,
    fileParallelism: false,
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['src/server.ts', 'src/openapi.ts'],
      thresholds: {
        lines: 80,
        functions: 80,
        statements: 80,
        branches: 70,
      },
    },
  },
});
