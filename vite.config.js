import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  publicDir: 'public',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: false,
    commonjsOptions: {
      include: [/qrcode-generator/, /node_modules/],
    },
  },
  server: {
    port: 3000,
    host: true,
    hmr: false,
  },
  optimizeDeps: {
    include: ['qrcode-generator'],
  },
});