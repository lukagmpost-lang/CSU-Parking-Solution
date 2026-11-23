/**
 * Utility helpers for the CSU Parking App
 */

const APOSTROPHE_ENTITY = String.fromCharCode(39) + '#39;';

export function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&')
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/"/g, '"')
    .replace(/'/g, APOSTROPHE_ENTITY);
}

export function formatTimeAgo(timestamp) {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return minutes + 'm ago';
  if (hours < 24) return hours + 'h ago';
  return days + 'd ago';
}

export function formatTimestamp(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function formatDate(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export function getDirectionsUrl(lat, lng, label = 'CSU Parking') {
  return 'https://maps.google.com/?q=' + lat + ',' + lng + '(' + encodeURIComponent(label) + ')';
}

export function getAppleMapsUrl(lat, lng, label = 'CSU Parking') {
  return 'https://maps.apple.com/?q=' + encodeURIComponent(label) + '&ll=' + lat + ',' + lng;
}

export function openDirections(lat, lng, label = 'CSU Parking') {
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const url = isIOS ? getAppleMapsUrl(lat, lng, label) : getDirectionsUrl(lat, lng, label);
  window.open(url, '_blank', 'noopener,noreferrer');
}

export function debounce(fn, delay) {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

export function throttle(fn, limit) {
  let inThrottle;
  return (...args) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

export function createElement(html) {
  const template = document.createElement('template');
  template.innerHTML = html.trim();
  return template.content.firstElementChild;
}

export function formatNumber(num) {
  return new Intl.NumberFormat().format(num);
}

export function calculatePercentage(value, max) {
  if (max === 0) return 0;
  return Math.round((value / max) * 100);
}

export function getAvailabilityColor(percentage) {
  if (percentage >= 20) return 'emerald';
  if (percentage > 0) return 'amber';
  return 'crimson';
}

export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    return true;
  }
}

export function vibrate(pattern = [50]) {
  if (navigator.vibrate) {
    navigator.vibrate(pattern);
  }
}

export function isOnline() {
  return navigator.onLine;
}

export function onOnlineStatusChange(callback) {
  const handler = () => callback(navigator.onLine);
  window.addEventListener('online', handler);
  window.addEventListener('offline', handler);
  return () => {
    window.removeEventListener('online', handler);
    window.removeEventListener('offline', handler);
  };
}
