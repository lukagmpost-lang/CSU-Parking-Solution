/**
 * "Where Did I Park?" Personal Spot Saver
 */

const STORAGE_KEY = 'csu-parking-saved-spot';
const TIMER_KEY = 'csu-parking-timer';

let spotSubscribers = new Set();

function notifySubscribers() {
  const spot = getSavedSpot();
  spotSubscribers.forEach(callback => callback(spot));
}

export function subscribeToSpot(callback) {
  spotSubscribers.add(callback);
  callback(getSavedSpot());
  return () => spotSubscribers.delete(callback);
}

export function getSavedSpot() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

export function saveSpot(spotData) {
  const { facilityId, floor, row, spot, notes = '', startTimer = false, durationMinutes = 120 } = spotData;
  
  const savedSpot = {
    facilityId,
    floor: floor || null,
    row: row?.toUpperCase() || null,
    spot: spot || null,
    notes: notes.trim(),
    savedAt: Date.now(),
    timer: startTimer ? {
      duration: durationMinutes * 60 * 1000,
      startedAt: Date.now(),
      expiresAt: Date.now() + (durationMinutes * 60 * 1000),
    } : null,
  };
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(savedSpot));
  
  if (startTimer) {
    localStorage.setItem(TIMER_KEY, JSON.stringify(savedSpot.timer));
  } else {
    localStorage.removeItem(TIMER_KEY);
  }
  
  notifySubscribers();
  return savedSpot;
}

export function clearSpot() {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(TIMER_KEY);
  notifySubscribers();
}

export function getTimerStatus() {
  const spot = getSavedSpot();
  if (!spot?.timer) return null;
  
  const now = Date.now();
  const { expiresAt } = spot.timer;
  const remaining = expiresAt - now;
  
  if (remaining <= 0) {
    return { expired: true, remaining: 0 };
  }
  
  const minutes = Math.ceil(remaining / 60000);
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  return {
    expired: false,
    remaining,
    minutes,
    formatted: hours > 0 ? hours + 'h ' + mins + 'm' : mins + 'm',
    expiresAt,
  };
}

export function extendTimer(additionalMinutes) {
  const spot = getSavedSpot();
  if (!spot?.timer) return false;
  
  const now = Date.now();
  const newExpiresAt = Math.max(spot.timer.expiresAt, now) + (additionalMinutes * 60 * 1000);
  
  spot.timer.expiresAt = newExpiresAt;
  spot.timer.duration = newExpiresAt - spot.timer.startedAt;
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(spot));
  localStorage.setItem(TIMER_KEY, JSON.stringify(spot.timer));
  
  notifySubscribers();
  return true;
}

export function formatSpot(spot, getFacilityById) {
  if (!spot) return null;
  
  const facility = getFacilityById(spot.facilityId);
  const timer = getTimerStatus();
  
  const parts = [];
  if (facility) parts.push(facility.name);
  if (spot.floor) parts.push('Floor ' + spot.floor);
  if (spot.row) parts.push('Row ' + spot.row);
  if (spot.spot) parts.push('Spot ' + spot.spot);
  
  return {
    facilityName: facility?.name || 'Unknown',
    locationString: parts.join(' \u2022 '),
    notes: spot.notes,
    savedAt: spot.savedAt,
    timer,
    facility,
  };
}

export function getDirectionsUrl(spot) {
  const facility = spot.facilityId ? getFacilityById(spot.facilityId) : null;
  if (!facility?.coordinates) return null;
  
  const { lat, lng } = facility.coordinates;
  return 'https://maps.google.com/?q=' + lat + ',' + lng;
}

import { getFacilityById } from '../data/csuParkingData.js';

export default {
  getSavedSpot,
  saveSpot,
  clearSpot,
  getTimerStatus,
  extendTimer,
  formatSpot,
  getDirectionsUrl,
  subscribeToSpot,
};
