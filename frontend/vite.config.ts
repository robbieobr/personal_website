/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

const apiProxy = {
  '/api': {
    target: process.env.VITE_API_BACKEND || 'http://localhost:5000',
    changeOrigin: true,
  },
};

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './test/setup.ts',
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/index.tsx', 'src/test/**', 'src/**/*.d.ts', 'src/i18n/config.ts', 'src/types/**'],
      thresholds: {
        lines: 90,
        functions: 90,
        branches: 90,
        statements: 90,
      },
    },
  },
  plugins: [react()],
  server: {
    port: parseInt(process.env.PORT || '5173'),
    host: '0.0.0.0',
    proxy: apiProxy,
  },
  preview: {
    port: parseInt(process.env.PORT || '4173'),
    host: '0.0.0.0',
    proxy: apiProxy,
  },
  build: {
    outDir: 'build',
    sourcemap: false,
  },
});
