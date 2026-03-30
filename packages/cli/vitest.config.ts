import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    silent: true,
    setupFiles: ['./tests/test-setup.ts'],
    clearMocks: true,
    globals: true, // Used to make global matchers work easily if needed, but we'll import where necessary
  },
});
