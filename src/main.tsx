import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// ── Global deferred PWA install prompt ──────────────────────────────────────
// Ditangkap DI SINI (sebelum React mount) agar tidak kehilangan event
// yang fire saat halaman pertama kali load.
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

declare global {
  interface Window {
    __deferredPWAInstall: BeforeInstallPromptEvent | null;
    __pwaInstalled: boolean;
  }
}

window.__deferredPWAInstall = null;
window.__pwaInstalled = false;

window.addEventListener('beforeinstallprompt', (e: Event) => {
  e.preventDefault();
  window.__deferredPWAInstall = e as BeforeInstallPromptEvent;
  console.log('[PWA] beforeinstallprompt captured — install ready');
});

window.addEventListener('appinstalled', () => {
  window.__pwaInstalled = true;
  window.__deferredPWAInstall = null;
  console.log('[PWA] App installed successfully');
});

// ── PWA: Register Service Worker ────────────────────────────────────────────
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then((registration) => {
        console.log('[PWA] SW registered:', registration.scope);

        // Auto-update: jika ada SW baru waiting, beri tahu via postMessage
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (!newWorker) return;
          newWorker.addEventListener('statechange', () => {
            if (
              newWorker.state === 'installed' &&
              navigator.serviceWorker.controller
            ) {
              // SW baru sudah siap — trigger skipWaiting
              newWorker.postMessage({ type: 'SKIP_WAITING' });
              console.log('[PWA] New SW ready — reload untuk update');
            }
          });
        });
      })
      .catch((err) => {
        console.warn('[PWA] SW registration failed:', err.message);
      });
  });

  // Reload halaman saat SW baru mengambil alih
  let refreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (refreshing) return;
    refreshing = true;
    window.location.reload();
  });
}

// ── Mount App ───────────────────────────────────────────────────────────────
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
