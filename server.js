/**
 * CSU Parking - Backend Server
 */

import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { dirname, join, resolve, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createStore } from './src/services/store.js';
import { ALL_FACILITIES, GATED_GARAGES, SURFACE_LOTS, STATUS_TYPES, PERMIT_TYPES } from './src/data/csuParkingData.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, 'dist');

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

const dataStore = createStore(join(__dirname, 'data', 'parking-data.json'));

async function initializeStore() {
  await dataStore.update(state => {
    if (!state.reports) state.reports = [];
    if (!state.availability) state.availability = {};
    return state;
  });
}

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

function simulateGarageAvailability(garage) {
  const state = simulatorState.get(garage.id);
  if (!state) return Math.floor(garage.maxCapacity * 0.5);
  
  const now = Date.now();
  if (now - state.lastUpdate < 30000) return state.currentSpaces;
  
  const fluctuation = Math.floor(Math.random() * 11) - 5;
  const trendChange = state.trend * Math.floor(Math.random() * 3);
  let newSpaces = state.currentSpaces + fluctuation + trendChange;
  newSpaces = Math.max(0, Math.min(garage.maxCapacity, newSpaces));
  
  if (Math.random() < 0.1) state.trend *= -1;
  if (newSpaces <= garage.maxCapacity * 0.1) state.trend = 1;
  if (newSpaces >= garage.maxCapacity * 0.9) state.trend = -1;
  
  state.currentSpaces = newSpaces;
  state.lastUpdate = now;
  return newSpaces;
}

function simulateSurfaceLotStatus(lot) {
  const state = simulatorState.get(lot.id);
  if (!state) return STATUS_TYPES.OPEN;
  
  if (state.reportCount >= 2) state.status = STATUS_TYPES.FULL;
  else if (state.reportCount === 1) state.status = STATUS_TYPES.FILLING_FAST;
  else {
    const rand = Math.random();
    if (rand < 0.7) state.status = STATUS_TYPES.OPEN;
    else if (rand < 0.9) state.status = STATUS_TYPES.FILLING_FAST;
    else state.status = STATUS_TYPES.FULL;
  }
  
  state.lastUpdate = Date.now();
  return state.status;
}

function json(res, status, body) {
  const payload = JSON.stringify(body);
  res.writeHead(status, { 
    'Content-Type': 'application/json; charset=utf-8', 
    'Cache-Control': 'no-store',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  res.end(payload);
}

function errorResponse(res, error) {
  json(res, error.status || 500, { error: error.message || 'Request failed' });
}

async function readBody(req, limit = 1000000) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > limit) throw Object.assign(new Error('Request too large.'), { status: 413 });
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://' + req.headers.host);
    const path = url.pathname;
    const method = req.method || 'GET';
    
    if (method === 'OPTIONS') {
      res.writeHead(204, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '86400',
      });
      res.end();
      return;
    }
    
    if (path.startsWith('/api/')) {
      if (method === 'GET' && path === '/api/facilities') {
        const state = await dataStore.read();
        const availability = state.availability || {};
        const reports = state.reports || [];
        
        const facilitiesWithData = ALL_FACILITIES.map(facility => {
          const avail = availability[facility.id];
          const facilityReports = reports.filter(r => r.facilityId === facility.id && r.expiresAt > Date.now());
          
          let availabilityData = null;
          if (avail) {
            availabilityData = avail;
          } else if (facility.hasLiveCount) {
            const spaces = simulateGarageAvailability(facility);
            const percentage = Math.round((spaces / facility.maxCapacity) * 100);
            let status;
            if (percentage >= 20) status = STATUS_TYPES.OPEN;
            else if (percentage > 0) status = STATUS_TYPES.FILLING_FAST;
            else status = STATUS_TYPES.FULL;
            
            availabilityData = {
              type: 'garage',
              facilityId: facility.id,
              spacesAvailable: spaces,
              maxCapacity: facility.maxCapacity,
              percentage,
              status,
              lastUpdated: new Date().toISOString(),
              isLive: true,
            };
          } else {
            const status = simulateSurfaceLotStatus(facility);
            availabilityData = {
              type: 'surface',
              facilityId: facility.id,
              status,
              lastUpdated: new Date().toISOString(),
              isLive: false,
              reportCount: facilityReports.filter(r => r.issueType === 'lot_full').length,
            };
          }
          
          return {
            ...facility,
            availability: availabilityData,
            activeReports: facilityReports,
            hasActiveReports: facilityReports.length > 0,
          };
        });
        
        json(res, 200, { facilities: facilitiesWithData });
        return;
      }
      
      if (method === 'GET' && path.match(/^\/api\/facilities\/[^/]+$/)) {
        const id = path.split('/')[3];
        const facility = ALL_FACILITIES.find(f => f.id === id);
        if (!facility) {
          json(res, 404, { error: 'Facility not found' });
          return;
        }
        
        const state = await dataStore.read();
        const availability = state.availability || {};
        const reports = state.reports || [];
        const avail = availability[id];
        const facilityReports = reports.filter(r => r.facilityId === id && r.expiresAt > Date.now());
        
        let availabilityData = avail;
        if (!availabilityData) {
          if (facility.hasLiveCount) {
            const spaces = simulateGarageAvailability(facility);
            const percentage = Math.round((spaces / facility.maxCapacity) * 100);
            let status;
            if (percentage >= 20) status = STATUS_TYPES.OPEN;
            else if (percentage > 0) status = STATUS_TYPES.FILLING_FAST;
            else status = STATUS_TYPES.FULL;
            
            availabilityData = {
              type: 'garage',
              facilityId: facility.id,
              spacesAvailable: spaces,
              maxCapacity: facility.maxCapacity,
              percentage,
              status,
              lastUpdated: new Date().toISOString(),
              isLive: true,
            };
          } else {
            const status = simulateSurfaceLotStatus(facility);
            availabilityData = {
              type: 'surface',
              facilityId: facility.id,
              status,
              lastUpdated: new Date().toISOString(),
              isLive: false,
              reportCount: facilityReports.filter(r => r.issueType === 'lot_full').length,
            };
          }
        }
        
        json(res, 200, { 
          ...facility, 
          availability: availabilityData,
          activeReports: facilityReports,
          hasActiveReports: facilityReports.length > 0,
        });
        return;
      }
      
      if (method === 'POST' && path === '/api/reports') {
        const body = JSON.parse((await readBody(req)).toString('utf8') || '{}');
        const { facilityId, issueType, note = '' } = body;
        
        const facility = ALL_FACILITIES.find(f => f.id === facilityId);
        if (!facility) {
          json(res, 400, { error: 'Invalid facility' });
          return;
        }
        
        const validIssue = ['lot_full', 'gate_broken', 'blocked_space', 'pay_station_down', 'event_closure'].includes(issueType);
        if (!validIssue) {
          json(res, 400, { error: 'Invalid issue type' });
          return;
        }
        
        if (note.length > 140) {
          json(res, 400, { error: 'Note must be 140 characters or less' });
          return;
        }
        
        const state = await dataStore.read();
        const recentReports = state.reports.filter(r => 
          Date.now() - r.timestamp < 10 * 60 * 1000
        );
        
        const report = {
          id: 'rpt_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 9),
          facilityId,
          issueType,
          note: note.trim(),
          timestamp: Date.now(),
          expiresAt: Date.now() + 60 * 60 * 1000,
        };
        
        await dataStore.update(state => {
          state.reports = state.reports || [];
          state.reports.push(report);
        });
        
        if (facility.type === 'surface' && issueType === 'lot_full') {
          const recentFullReports = state.reports.filter(r => 
            r.facilityId === facilityId &&
            r.issueType === 'lot_full' &&
            Date.now() - r.timestamp < 30 * 60 * 1000
          ).length;
          
          if (recentFullReports >= 2) {
            const avail = state.availability || {};
            avail[facilityId] = {
              type: 'surface',
              facilityId,
              status: STATUS_TYPES.FULL,
              lastUpdated: new Date().toISOString(),
              isLive: false,
              reportCount: recentFullReports,
            };
            state.availability = avail;
          }
        }
        
        json(res, 201, { success: true, report });
        return;
      }
      
      if (method === 'GET' && path === '/api/reports') {
        const state = await dataStore.read();
        const reports = state.reports || [];
        const active = reports.filter(r => r.expiresAt > Date.now());
        json(res, 200, { reports: active });
        return;
      }
      
      if (method === 'GET' && path.match(/^\/api\/reports\/[^/]+$/)) {
        const facilityId = path.split('/')[3];
        const state = await dataStore.read();
        const reports = state.reports || [];
        const facilityReports = reports.filter(r => r.facilityId === facilityId && r.expiresAt > Date.now());
        json(res, 200, { reports: facilityReports });
        return;
      }
      
      if (method === 'POST' && path === '/api/availability/refresh') {
        const state = await dataStore.read();
        const availability = state.availability || {};
        
        for (const garage of GATED_GARAGES) {
          const spaces = simulateGarageAvailability(garage);
          const percentage = Math.round((spaces / garage.maxCapacity) * 100);
          let status;
          if (percentage >= 20) status = STATUS_TYPES.OPEN;
          else if (percentage > 0) status = STATUS_TYPES.FILLING_FAST;
          else status = STATUS_TYPES.FULL;
          
          availability[garage.id] = {
            type: 'garage',
            facilityId: garage.id,
            spacesAvailable: spaces,
            maxCapacity: garage.maxCapacity,
            percentage,
            status,
            lastUpdated: new Date().toISOString(),
            isLive: true,
          };
        }
        
        for (const lot of SURFACE_LOTS) {
          const status = simulateSurfaceLotStatus(lot);
          availability[lot.id] = {
            type: 'surface',
            facilityId: lot.id,
            status,
            lastUpdated: new Date().toISOString(),
            isLive: false,
          };
        }
        
        await dataStore.update(state => { state.availability = availability; });
        
        json(res, 200, { success: true, timestamp: new Date().toISOString() });
        return;
      }
      
      json(res, 404, { error: 'API endpoint not found' });
      return;
    }
    
    let filePath = join(root, path === '/' ? 'index.html' : path);
    
    if (!filePath.startsWith(root)) {
      res.writeHead(403);
      res.end('Forbidden');
      return;
    }
    
    try {
      const content = await readFile(filePath);
      const ext = extname(filePath);
      const mime = mimeTypes[ext] || 'application/octet-stream';
      res.writeHead(200, { 
        'Content-Type': mime + '; charset=utf-8',
        'Cache-Control': 'no-store',
      });
      res.end(content);
    } catch (error) {
      if (error.code === 'ENOENT') {
        if (!path.startsWith('/api/') && !path.includes('.')) {
          try {
            const content = await readFile(join(root, 'index.html'));
            res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(content);
            return;
          } catch {}
        }
        res.writeHead(404);
        res.end('Not found');
      } else {
        res.writeHead(500);
        res.end('Internal server error');
      }
    }
  } catch (error) {
    console.error('Server error:', error);
    errorResponse(res, error);
  }
});

await initializeStore();

const port = Number(process.env.PORT || 3000);
server.listen(port, '0.0.0.0', () => {
  console.log('CSU Parking server running at http://localhost:' + port);
  console.log('API available at http://localhost:' + port + '/api/');
});

setInterval(async () => {
  const state = await dataStore.read();
  const availability = state.availability || {};
  
  for (const garage of GATED_GARAGES) {
    const spaces = simulateGarageAvailability(garage);
    const percentage = Math.round((spaces / garage.maxCapacity) * 100);
    let status;
    if (percentage >= 20) status = STATUS_TYPES.OPEN;
    else if (percentage > 0) status = STATUS_TYPES.FILLING_FAST;
    else status = STATUS_TYPES.FULL;
    
    availability[garage.id] = {
      type: 'garage',
      facilityId: garage.id,
      spacesAvailable: spaces,
      maxCapacity: garage.maxCapacity,
      percentage,
      status,
      lastUpdated: new Date().toISOString(),
      isLive: true,
    };
  }
  
  for (const lot of SURFACE_LOTS) {
    const status = simulateSurfaceLotStatus(lot);
    availability[lot.id] = {
      type: 'surface',
      facilityId: lot.id,
      status,
      lastUpdated: new Date().toISOString(),
      isLive: false,
    };
  }
  
  await dataStore.update(state => { state.availability = availability; });
}, 30000);

setInterval(async () => {
  const state = await dataStore.read();
  const now = Date.now();
  const active = (state.reports || []).filter(r => r.expiresAt > now);
  if (active.length !== (state.reports || []).length) {
    await dataStore.update(state => { state.reports = active; });
  }
}, 5 * 60 * 1000);
