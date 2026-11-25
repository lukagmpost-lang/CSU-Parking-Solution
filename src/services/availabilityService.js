/**
 * Hybrid Real-Time Parking Availability Engine
 */

import { GATED_GARAGES, SURFACE_LOTS, STATUS_TYPES } from '../data/csuParkingData.js';
import { getAllBookings, getReservationLimit } from './bookingService.js';
import { getFacilityReportSummary } from './reportStore.js';

let availabilityCache = new Map();
let subscribers = new Set();
let pollingInterval = null;
let simulatorInterval = null;

const simulatorState = new Map();

GATED_GARAGES.forEach(garage => {
  simulatorState.set(garage.id, {
    currentSpaces: Math.floor(garage.maxCapacity * (0.3 + Math.random() * 0.5)),
    trend: Math.random() > 0.5 ? 1 : -1,
    lastUpdate: Date.now(),
  });
});

SURFACE_LOTS.forEach(lot => {
  simulatorState.set(lot.id, {
    status: STATUS_TYPES.OPEN,
    lastUpdate: Date.now(),
    reportCount: 0,
  });
});

function notifySubscribers() {
  const result = {};
  availabilityCache.forEach((value, key) => {
    result[key] = value;
  });
  subscribers.forEach(callback => {
    try {
      callback(result);
    } catch (error) {
      console.error('Availability subscriber failed:', error);
    }
  });
}

export function getAllAvailability() {
  const result = {};
  availabilityCache.forEach((value, key) => {
    result[key] = value;
  });
  return result;
}

export function subscribeToAvailability(callback) {
  subscribers.add(callback);
  callback(getAllAvailability());
  return () => subscribers.delete(callback);
}

function simulateGarageAvailability(garage) {
  const state = simulatorState.get(garage.id);
  if (!state) return null;

  const now = Date.now();
  const timeSinceUpdate = now - state.lastUpdate;
  
  if (timeSinceUpdate < 30000) return state.currentSpaces;

  const fluctuation = Math.floor(Math.random() * 11) - 5;
  const trendChange = state.trend * Math.floor(Math.random() * 3);
  
  let newSpaces = state.currentSpaces + fluctuation + trendChange;
  newSpaces = Math.max(0, Math.min(garage.maxCapacity, newSpaces));
  
  if (Math.random() < 0.1) {
    state.trend *= -1;
  }
  
  if (newSpaces <= garage.maxCapacity * 0.1) state.trend = 1;
  if (newSpaces >= garage.maxCapacity * 0.9) state.trend = -1;
  
  state.currentSpaces = newSpaces;
  state.lastUpdate = now;
  
  return newSpaces;
}

function simulateSurfaceLotStatus(lot) {
  const state = simulatorState.get(lot.id);
  if (!state) return STATUS_TYPES.OPEN;

  const { reportCount, hasEventClosure } = getFacilityReportSummary(lot.id);
  state.reportCount = reportCount;

  if (hasEventClosure) {
    state.status = STATUS_TYPES.CLOSED;
  } else if (reportCount >= 2) {
    state.status = STATUS_TYPES.FULL;
  } else if (reportCount === 1) {
    state.status = STATUS_TYPES.FILLING_FAST;
  } else {
    const rand = Math.random();
    if (rand < 0.7) state.status = STATUS_TYPES.OPEN;
    else if (rand < 0.9) state.status = STATUS_TYPES.FILLING_FAST;
    else state.status = STATUS_TYPES.FULL;
  }

  state.lastUpdate = Date.now();
  return state.status;
}

function getActiveReservationsCount(facilityId) {
  const bookings = getAllBookings();
  const now = Date.now();
  return bookings.filter(b => 
    b.facilityId === facilityId && 
    b.status === 'active' && 
    b.expiresAt > now
  ).length;
}

async function fetchLiveGarageData() {
  const results = {};
  
  for (const garage of GATED_GARAGES) {
    try {
      const rawSpaces = simulateGarageAvailability(garage);
      const activeReservations = getActiveReservationsCount(garage.id);
      const availableSpaces = Math.max(0, rawSpaces - activeReservations);
      results[garage.id] = availableSpaces;
    } catch (error) {
      console.warn('Failed to fetch live data for ' + garage.id + ', using simulator:', error);
      const rawSpaces = simulateGarageAvailability(garage);
      const activeReservations = getActiveReservationsCount(garage.id);
      results[garage.id] = Math.max(0, rawSpaces - activeReservations);
    }
  }
  
  return results;
}

async function fetchSurfaceLotStatuses() {
  const results = {};
  
  for (const lot of SURFACE_LOTS) {
    results[lot.id] = simulateSurfaceLotStatus(lot);
  }
  
  return results;
}

async function refreshAvailability() {
  try {
    const [garageData, surfaceData] = await Promise.all([
      fetchLiveGarageData(),
      fetchSurfaceLotStatuses(),
    ]);
    
    const timestamp = new Date().toISOString();
    
    Object.entries(garageData).forEach(([id, spaces]) => {
      const garage = GATED_GARAGES.find(g => g.id === id);
      if (garage) {
        const activeReservations = getActiveReservationsCount(id);
        const percentage = Math.round((spaces / garage.maxCapacity) * 100);
        availabilityCache.set(id, {
          type: 'garage',
          facilityId: id,
          spacesAvailable: spaces,
          maxCapacity: garage.maxCapacity,
          percentage,
          status: percentage >= 20 ? STATUS_TYPES.OPEN :
                  spaces > 0 ? STATUS_TYPES.FILLING_FAST : STATUS_TYPES.FULL,
          lastUpdated: timestamp,
          isLive: true,
          activeReservations,
          reservationsRemaining: Math.max(0, getReservationLimit(garage) - activeReservations),
        });
      }
    });
    
    Object.entries(surfaceData).forEach(([id, status]) => {
      const lot = SURFACE_LOTS.find(l => l.id === id);
      if (lot) {
        const state = simulatorState.get(id);
        const reportCount = state ? state.reportCount : 0;
        const activeReservations = getActiveReservationsCount(id);
        availabilityCache.set(id, {
          type: 'surface',
          facilityId: id,
          status,
          lastUpdated: timestamp,
          isLive: false,
          reportCount,
          activeReservations,
          reservationsRemaining: Math.max(0, getReservationLimit(lot) - activeReservations),
        });
      }
    });
    
    notifySubscribers();
  } catch (error) {
    console.error('Failed to refresh availability:', error);
  }
}

export function startPolling(intervalMs = 30000) {
  if (pollingInterval) return;
  
  refreshAvailability();
  
  pollingInterval = setInterval(refreshAvailability, intervalMs);
  
  // Simulate quietly. The UI is notified by the 30-second refresh (or a manual refresh)
  // so the home screen does not get rebuilt every 5 seconds.
  simulatorInterval = setInterval(() => {
    GATED_GARAGES.forEach(garage => simulateGarageAvailability(garage));
    SURFACE_LOTS.forEach(lot => simulateSurfaceLotStatus(lot));
  }, 5000);
}

export function stopPolling() {
  if (pollingInterval) {
    clearInterval(pollingInterval);
    pollingInterval = null;
  }
  if (simulatorInterval) {
    clearInterval(simulatorInterval);
    simulatorInterval = null;
  }
}

export async function triggerRefresh() {
  await refreshAvailability();
}

export function updateSurfaceLotStatus(lotId, status, reportCount) {
  const lot = SURFACE_LOTS.find(l => l.id === lotId);
  if (!lot) return;
  
  const state = simulatorState.get(lotId) || { reportCount: 0 };
  state.reportCount = Number.isInteger(reportCount)
    ? Math.max(0, reportCount)
    : (state.reportCount || 0) + 1;
  state.status = status;
  state.lastUpdate = Date.now();
  simulatorState.set(lotId, state);

  const activeReservations = getActiveReservationsCount(lotId);
  availabilityCache.set(lotId, {
    type: 'surface',
    facilityId: lotId,
    status,
    lastUpdated: new Date().toISOString(),
    isLive: false,
    reportCount: state.reportCount,
    activeReservations,
    reservationsRemaining: Math.max(0, getReservationLimit(lot) - activeReservations),
  });
  
  notifySubscribers();
}

export function getFacilityAvailability(facilityId) {
  return availabilityCache.get(facilityId);
}

export function formatAvailability(availability) {
  if (!availability) return { 
    text: 'Unknown', 
    status: STATUS_TYPES.OPEN,
    type: 'unknown',
    spacesAvailable: 0,
    maxCapacity: 0,
    percentage: 0,
  };
  
  if (availability.type === 'garage') {
    const { spacesAvailable, maxCapacity, percentage } = availability;
    return {
      text: spacesAvailable + ' / ' + maxCapacity + ' spots',
      shortText: spacesAvailable + ' open',
      percentage,
      status: availability.status,
      isLive: availability.isLive,
      lastUpdated: availability.lastUpdated,
      type: 'garage',
      spacesAvailable,
      maxCapacity,
      activeReservations: availability.activeReservations || 0,
      reservationsRemaining: availability.reservationsRemaining,
    };
  } else {
    return {
      text: availability.status,
      status: availability.status,
      isLive: availability.isLive,
      lastUpdated: availability.lastUpdated,
      reportCount: availability.reportCount,
      activeReservations: availability.activeReservations || 0,
      reservationsRemaining: availability.reservationsRemaining,
      type: 'surface',
      spacesAvailable: 0,
      maxCapacity: 0,
      percentage: 0,
    };
  }
}

export function getStatusColorClass(status) {
  switch (status) {
    case STATUS_TYPES.OPEN:
      return 'bg-csu-emerald text-white';
    case STATUS_TYPES.FILLING_FAST:
      return 'bg-csu-amber text-white';
    case STATUS_TYPES.FULL:
    case STATUS_TYPES.CLOSED:
      return 'bg-csu-crimson text-white';
    default:
      return 'bg-gray-400 text-white';
  }
}

export function getStatusBadgeVariant(status) {
  switch (status) {
    case STATUS_TYPES.OPEN:
      return 'emerald';
    case STATUS_TYPES.FILLING_FAST:
      return 'amber';
    case STATUS_TYPES.FULL:
    case STATUS_TYPES.CLOSED:
      return 'crimson';
    default:
      return 'gray';
  }
}

GATED_GARAGES.forEach(garage => simulateGarageAvailability(garage));
SURFACE_LOTS.forEach(lot => simulateSurfaceLotStatus(lot));
refreshAvailability();

export default {
  getAllAvailability,
  subscribeToAvailability,
  startPolling,
  stopPolling,
  triggerRefresh,
  updateSurfaceLotStatus,
  getFacilityAvailability,
  formatAvailability,
  getStatusColorClass,
  getStatusBadgeVariant,
};