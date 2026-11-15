/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: { '/api': `http://localhost:${process.env.PORT ?? 8787}` },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    css: false,
    environmentMatchGlobs: [['server/**', 'node']],
    coverage: {
      provider: 'v8',
      include: ['src/**', 'server/**'],
      exclude: ['**/*.test.*', 'src/main.tsx', 'src/test/**', 'server/index.ts', '**/*.d.ts', 'src/domain/types.ts', 'src/services/marketData.ts'],
      reporter: ['text-summary', 'text'],
      // Floors, set just under current results so regressions fail but small edits do not.
      thresholds: { lines: 90, statements: 90, functions: 85, branches: 85 },
    },
  },
});
