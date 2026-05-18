import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Build-time flag: setting VITE_INCLUDE_ADMIN=true (locally) keeps the admin
// route. When unset (Render's prod build), __INCLUDE_ADMIN__ becomes literal
// `false` and esbuild / Rollup tree-shake the admin chunk and its CSS out of
// the bundle entirely.
const INCLUDE_ADMIN = process.env.VITE_INCLUDE_ADMIN === 'true';

export default defineConfig({
  plugins: [react()],
  define: {
    __INCLUDE_ADMIN__: JSON.stringify(INCLUDE_ADMIN),
  },
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});
