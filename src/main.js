/**
 * CSU Parking - Main Application Entry Point
 */

import './styles.css';
import { renderApp } from './components/App.js';
import { startPolling } from './services/availabilityService.js';
import { cleanupExpiredReports } from './services/reportingService.js';

startPolling(30000);

setInterval(cleanupExpiredReports, 5 * 60 * 1000);

import { onOnlineStatusChange } from './utils/helpers.js';
onOnlineStatusChange((online) => {
  console.log('App is now ' + (online ? 'online' : 'offline'));
  if (online) {
    import('./services/availabilityService.js').then(({ triggerRefresh }) => {
      triggerRefresh();
    });
  }
});

renderApp();

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}
