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

  if (!getFacilityById(facilityId)) throw new Error('Choose a valid parking facility.');
  if (typeof notes !== 'string' || notes.trim().length > 140) throw new Error('Notes must be 140 characters or less.');
  if (startTimer && (!Number.isInteger(durationMinutes) || durationMinutes < 15 || durationMinutes > 720)) {
    throw new Error('Timer duration must be between 15 and 720 minutes.');
  }

  const now = Date.now();
  const duration = startTimer ? durationMinutes * 60 * 1000 : 0;
  const previousSpot = getSavedSpot();
  const canPreserveTimer = startTimer && previousSpot?.timer &&
    previousSpot.facilityId === facilityId &&
    previousSpot.timer.duration === duration && previousSpot.timer.expiresAt > now;

  const savedSpot = {
    facilityId,
    floor: floor || null,
    row: row?.toUpperCase() || null,
    spot: spot || null,
    notes: notes.trim(),
    savedAt: now,
    timer: startTimer ? (canPreserveTimer ? previousSpot.timer : {
      duration,
      startedAt: now,
      expiresAt: now + duration,
    }) : null,
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(savedSpot));
  
  try {
    if (startTimer) {
      localStorage.setItem(TIMER_KEY, JSON.stringify(savedSpot.timer));
    } else {
      localStorage.removeItem(TIMER_KEY);
    }
  } catch {
    // The saved spot is the source of truth; the legacy timer key is best-effort.
  }

  notifySubscribers();
  return savedSpot;
}

export function clearSpot() {
  localStorage.removeItem(STORAGE_KEY);
  try {
    localStorage.removeItem(TIMER_KEY);
  } catch {
    // The legacy timer key is best-effort; the saved spot has already cleared.
  }
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
