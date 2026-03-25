import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    ...defineConfig({}).test,
    include: ['tests/api/**/*.test.ts', 'tests/api/**/*.test.tsx'],
    environment: 'node',
  },
});
