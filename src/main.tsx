import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Registra Service Worker para suporte PWA instalável no celular
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
