import { defineConfig } from 'vitest/config';

// base './' permite publicar em subpastas (GitHub Pages, homologação).
export default defineConfig({
  base: './',
  build: {
    target: 'es2022',
    chunkSizeWarningLimit: 2000,
  },
  test: {
    include: ['tests/unit/**/*.test.ts'],
    environment: 'node',
  },
});
