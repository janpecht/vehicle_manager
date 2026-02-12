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
  },
});
