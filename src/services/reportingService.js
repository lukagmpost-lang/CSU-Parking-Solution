/**
 * Anonymous Crowdsourced Issue Reporting Service
 */

import { ISSUE_TYPES, STATUS_TYPES } from '../data/csuParkingData.js';
import { updateSurfaceLotStatus } from './availabilityService.js';
import { getGarages, getSurfaceLots } from '../data/csuParkingData.js';
import { getFacilityReportSummary, getStoredReports, saveReports } from './reportStore.js';

const COOLDOWN_KEY = 'csu-parking-report-cooldown';
const COOLDOWN_MS = 10 * 60 * 1000;
const REPORT_EXPIRY_MS = 60 * 60 * 1000;
const AUTO_FULL_THRESHOLD = 2;

let reportSubscribers = new Set();

function notifySubscribers() {
  const reports = getActiveReports();
  reportSubscribers.forEach(callback => {
    try {
      callback(reports);
    } catch (error) {
      console.error('Report subscriber failed:', error);
    }
  });
}

export function subscribeToReports(callback) {
  reportSubscribers.add(callback);
  callback(getActiveReports());
  return () => reportSubscribers.delete(callback);
}

export function isInCooldown() {
  return getCooldownRemaining() > 0;
}

export function getCooldownRemaining() {
  try {
    const lastReport = Number.parseInt(localStorage.getItem(COOLDOWN_KEY), 10);
    if (!Number.isFinite(lastReport)) return 0;
    return Math.max(0, COOLDOWN_MS - (Date.now() - lastReport));
  } catch {
    return 0;
  }
}

function setCooldown() {
  try {
    localStorage.setItem(COOLDOWN_KEY, Date.now().toString());
  } catch {
    // A successfully saved report should not appear to fail if cooldown storage is unavailable.
  }
}

function generateReportId() {
  return 'rpt_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

export function submitReport(reportData) {
  if (isInCooldown()) {
    return {
      success: false,
      error: 'Please wait before submitting another report',
      cooldownRemaining: getCooldownRemaining(),
    };
  }
  
  const { facilityId, issueType, note = '' } = reportData;
  
  const validFacility = [...getGarages(), ...getSurfaceLots()].find(f => f.id === facilityId);
  if (!validFacility) {
    return { success: false, error: 'Invalid facility' };
  }
  
  const validIssue = ISSUE_TYPES.find(i => i.id === issueType);
  if (!validIssue) {
    return { success: false, error: 'Invalid issue type' };
  }
  
  if (typeof note !== 'string') {
    return { success: false, error: 'Note must be text' };
  }

  if (note.length > 140) {
    return { success: false, error: 'Note must be 140 characters or less' };
  }
  
  const report = {
    id: generateReportId(),
    facilityId,
    issueType,
    note: note.trim(),
    timestamp: Date.now(),
    expiresAt: Date.now() + REPORT_EXPIRY_MS,
    deviceId: getDeviceId(),
  };
  
  const reports = getStoredReports();
  reports.push(report);
  saveReports(reports);
  
  setCooldown();
  
  if (validFacility.type === 'surface' && ['lot_full', 'event_closure'].includes(issueType)) {
    checkAutoFull(facilityId);
  }
  
  notifySubscribers();
  
  return { success: true, report };
}

function getDeviceId() {
  try {
    let deviceId = localStorage.getItem('csu-parking-device-id');
    if (!deviceId) {
      deviceId = 'dev_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('csu-parking-device-id', deviceId);
    }
    return deviceId;
  } catch {
    return 'dev_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
  }
}

function checkAutoFull(facilityId) {
  const { reportCount, hasEventClosure } = getFacilityReportSummary(facilityId);

  let status = reportCount >= AUTO_FULL_THRESHOLD
    ? STATUS_TYPES.FULL
    : reportCount === 1
      ? STATUS_TYPES.FILLING_FAST
      : STATUS_TYPES.OPEN;
  if (hasEventClosure) status = STATUS_TYPES.CLOSED;

  updateSurfaceLotStatus(facilityId, status, reportCount);
}

export function getActiveReports() {
  const reports = getStoredReports();
  const now = Date.now();
  return reports.filter(r => r.expiresAt > now);
}

export function getActiveReportsForFacility(facilityId) {
  return getActiveReports().filter(r => r.facilityId === facilityId);
}

export function getReportCountsByType(facilityId) {
  const reports = getActiveReportsForFacility(facilityId);
  const counts = {};
  ISSUE_TYPES.forEach(type => counts[type.id] = 0);
  reports.forEach(r => counts[r.issueType] = (counts[r.issueType] || 0) + 1);
  return counts;
}

export function hasActiveReports(facilityId) {
  return getActiveReportsForFacility(facilityId).length > 0;
}

export function getLatestReportForFacility(facilityId) {
  const reports = getActiveReportsForFacility(facilityId);
  if (reports.length === 0) return null;
  return reports.sort((a, b) => b.timestamp - a.timestamp)[0];
}

export function formatTimeAgo(timestamp) {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return minutes + 'm ago';
  if (hours < 24) return hours + 'h ago';
  return Math.floor(hours / 24) + 'd ago';
}

export function cleanupExpiredReports() {
  const reports = getStoredReports();
  const now = Date.now();
  const active = reports.filter(r => r.expiresAt > now);
  if (active.length !== reports.length) {
    const expiredSurfaceLots = new Set(
      reports
        .filter(r => r.expiresAt <= now && ['lot_full', 'event_closure'].includes(r.issueType))
        .map(r => r.facilityId)
        .filter(facilityId => getSurfaceLots().some(lot => lot.id === facilityId))
    );
    try {
      saveReports(active);
    } catch {
      return reports.length;
    }
    expiredSurfaceLots.forEach(checkAutoFull);
    notifySubscribers();
  }
  return active.length;
}

cleanupExpiredReports();

setInterval(cleanupExpiredReports, 5 * 60 * 1000);

export default {
  submitReport,
  getActiveReports,
  getActiveReportsForFacility,
  getReportCountsByType,
  hasActiveReports,
  getLatestReportForFacility,
  isInCooldown,
  getCooldownRemaining,
  formatTimeAgo,
  cleanupExpiredReports,
  subscribeToReports,
};
