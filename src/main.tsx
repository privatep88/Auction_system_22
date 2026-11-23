import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { AppErrorBoundary } from './components/AppErrorBoundary.tsx';
import './index.css';

const PRELOAD_RELOAD_KEY = 'saaed_preload_reload_at';

// Recover cleanly if a newly deployed GitHub Pages build replaces hashed asset chunks
window.addEventListener('vite:preloadError', (event) => {
  event.preventDefault();
  try {
    const lastReloadRaw = sessionStorage.getItem(PRELOAD_RELOAD_KEY);
    const lastReloadAt = lastReloadRaw ? Number(lastReloadRaw) : 0;
    const now = Date.now();
    if (!Number.isFinite(lastReloadAt) || now - lastReloadAt > 15000) {
      sessionStorage.setItem(PRELOAD_RELOAD_KEY, String(now));
      window.location.reload();
    }
  } catch {
    window.location.reload();
  }
});

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('لم يتم العثور على عنصر الجذر (root) لتشغيل نظام مزادات ساهر.');
}

createRoot(rootElement).render(
  <StrictMode>
    <AppErrorBoundary>
      <App />
    </AppErrorBoundary>
  </StrictMode>
);
