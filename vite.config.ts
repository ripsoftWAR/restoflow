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
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      proxy: {
        '/api': {
          target: 'http://localhost:3000', // Pastikan ini sesuai dengan PORT backend Anda
          changeOrigin: true,
          secure: false,
        },
      },
      // Pengaturan HMR (Hot Module Replacement)
      hmr: !isHmrDisabled,
      
      // Pengaturan Watcher untuk mencegah error "Request Aborted"
      watch: isHmrDisabled ? null : {
        // MENGABAIKAN file database agar server tidak restart otomatis saat data bertambah
        ignored: [
          '**/database.db', 
          '**/database.db-journal', 
          '**/database.db-wal',
          '**/db/database.db',
          '**/node_modules/**',
          '**/dist/**'
        ],
      },
    },
  };
});