import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig(() => {
  const isHmrDisabled = process.env.DISABLE_HMR === 'true';

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    build: {
      outDir: 'dist',
      emptyOutDir: true,
    },
    server: {
      host: true,
      port: 5173,
      allowedHosts: [],

      proxy: {
        '/api': {
          target: 'http://localhost:3000',
          changeOrigin: true,
          secure: false,
        },
      },

      hmr: !isHmrDisabled,

      watch: isHmrDisabled
        ? null
        : {
            ignored: [
              '**/database.db',
              '**/database.db-journal',
              '**/database.db-wal',
              '**/node_modules/**',
              '**/dist/**',
            ],
          },
    },
  };
});