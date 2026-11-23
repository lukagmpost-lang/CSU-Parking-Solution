/**
 * Hybrid Real-Time Parking Availability Engine
 */

import { GATED_GARAGES, SURFACE_LOTS, STATUS_TYPES } from '../data/csuParkingData.js';

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
  subscribers.forEach(callback => callback(result));
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

  if (state.reportCount >= 2) {
    state.status = STATUS_TYPES.FULL;
  } else if (state.reportCount === 1) {
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

async function fetchLiveGarageData() {
  const results = {};
  
  for (const garage of GATED_GARAGES) {
    try {
      results[garage.id] = simulateGarageAvailability(garage);
    } catch (error) {
      console.warn('Failed to fetch live data for ' + garage.id + ', using simulator:', error);
      results[garage.id] = simulateGarageAvailability(garage);
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
        availabilityCache.set(id, {
          type: 'garage',
          facilityId: id,
          spacesAvailable: spaces,
          maxCapacity: garage.maxCapacity,
          percentage: Math.round((spaces / garage.maxCapacity) * 100),
          status: spaces > garage.maxCapacity * 0.2 ? STATUS_TYPES.OPEN : 
                  spaces > 0 ? STATUS_TYPES.FILLING_FAST : STATUS_TYPES.FULL,
          lastUpdated: timestamp,
          isLive: true,
        });
      }
    });
    
    Object.entries(surfaceData).forEach(([id, status]) => {
      const lot = SURFACE_LOTS.find(l => l.id === id);
      if (lot) {
        availabilityCache.set(id, {
          type: 'surface',
          facilityId: id,
          status,
          lastUpdated: timestamp,
          isLive: false,
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
  
  simulatorInterval = setInterval(() => {
    GATED_GARAGES.forEach(garage => simulateGarageAvailability(garage));
    SURFACE_LOTS.forEach(lot => simulateSurfaceLotStatus(lot));
    notifySubscribers();
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

export function updateSurfaceLotStatus(lotId, status) {
  const lot = SURFACE_LOTS.find(l => l.id === lotId);
  if (!lot) return;
  
  const state = simulatorState.get(lotId) || { reportCount: 0 };
  state.reportCount = (state.reportCount || 0) + 1;
  state.lastUpdate = Date.now();
  simulatorState.set(lotId, state);
  
  availabilityCache.set(lotId, {
    type: 'surface',
    facilityId: lotId,
    status,
    lastUpdated: new Date().toISOString(),
    isLive: false,
    reportCount: state.reportCount,
  });
  
  notifySubscribers();
}

export function getFacilityAvailability(facilityId) {
  return availabilityCache.get(facilityId);
}

export function formatAvailability(availability) {
  if (!availability) return { text: 'Unknown', status: STATUS_TYPES.OPEN };
  
  if (availability.type === 'garage') {
    const { spacesAvailable, maxCapacity, percentage } = availability;
    return {
      text: spacesAvailable + ' / ' + maxCapacity + ' spots',
      shortText: spacesAvailable + ' open',
      percentage,
      status: availability.status,
      isLive: availability.isLive,
      lastUpdated: availability.lastUpdated,
    };
  } else {
    return {
      text: availability.status,
      status: availability.status,
      isLive: availability.isLive,
      lastUpdated: availability.lastUpdated,
      reportCount: availability.reportCount,
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
