/**
 * CSU Parking - Main Application Entry Point
 */

import './styles.css';
import { renderApp } from './components/App.js';
import { startPolling, triggerRefresh } from './services/availabilityService.js';
import { onOnlineStatusChange } from './utils/helpers.js';

startPolling(30000);

onOnlineStatusChange((online) => {
  if (online) triggerRefresh();
});

renderApp();

// Service Worker registration - only in production
if ('serviceWorker' in navigator && window.location.protocol === 'https:') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}

// Unregister SW in development
if ('serviceWorker' in navigator && window.location.hostname === 'localhost') {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    registrations.forEach(reg => reg.unregister());
  });
  caches.keys().then(names => {
    names.forEach(name => caches.delete(name));
  });
}