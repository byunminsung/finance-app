import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

// Services bind to loopback only (project security rule: never 0.0.0.0).
export default defineConfig({
  plugins: [react()],
  server: {
    host: '127.0.0.1',
    port: 5173,
    // Used when VITE_MARKET_SOURCE=api. The proxy server is a later step.
    proxy: {
      '/api': 'http://127.0.0.1:8787',
    },
  },
  preview: {
    host: '127.0.0.1',
    port: 4173,
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
  },
});
