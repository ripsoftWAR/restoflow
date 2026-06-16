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
      port: 5173,
      proxy: {
        '/api': {
          target: 'http://127.0.0.1:3000', // Sesuaikan dengan port di server/.env (PORT=3000)
          changeOrigin: true,
          secure: false,
        },
      },
      hmr: !isHmrDisabled,
      watch: isHmrDisabled ? null : {
        ignored: [
          '**/database.db', 
          '**/database.db-journal', 
          '**/database.db-wal',
          '**/node_modules/**',
          '**/dist/**'
        ],
      },
    },
  };
});