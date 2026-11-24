/// <reference types="vitest/config" />
import { defineConfig } from 'vite';

export default defineConfig({
  // Relative links: the build works under any address (GitHub Pages serves it in a folder).
  base: './',
  // Static app, no backend. Build targets modern Chrome/Edge only (Web MIDI requirement).
  build: {
    target: 'es2022',
  },
  test: {
    environment: 'node',
    include: ['src/tests/**/*.test.ts'],
  },
});
