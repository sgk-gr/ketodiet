import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Register Service Worker for PWA (Mobile Installation & Offline support)
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('[PWA] ServiceWorker registered with scope:', registration.scope);
      })
      .catch((error) => {
        console.error('[PWA] ServiceWorker registration failed:', error);
      });
  });
} else if ('serviceWorker' in navigator) {
  // In development, also register so install prompts can be tested if needed
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
