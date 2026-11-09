import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// ─── Global RBAC Fetch Interceptor ──────────────────────────────────────────
// Automatically attaches the authenticated role header to every API request
const originalFetch = window.fetch;
window.fetch = function (input: RequestInfo | URL, init?: RequestInit) {
  const role = sessionStorage.getItem('dairypulse_user_role') || 'admin';
  const customHeaders = new Headers(init?.headers || {});
  if (!customHeaders.has('x-user-role')) {
    customHeaders.set('x-user-role', role);
  }
  return originalFetch.call(this, input, {
    ...init,
    headers: customHeaders,
  });
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
