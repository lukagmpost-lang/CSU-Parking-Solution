/**
 * CSU Parking - Main Application Entry Point
 */

import './styles.css';
import { renderApp } from './components/App.js';
import { startPolling } from './services/availabilityService.js';
import { cleanupExpiredReports } from './services/reportingService.js';
import { onOnlineStatusChange } from './utils/helpers.js';

startPolling(30000);

// Only one cleanup interval
setInterval(cleanupExpiredReports, 5 * 60 * 1000);

onOnlineStatusChange((online) => {
  console.log('App is now ' + (online ? 'online' : 'offline'));
  if (online) {
    import('./services/availabilityService.js').then(({ triggerRefresh }) => {
      triggerRefresh();
    });
  }
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