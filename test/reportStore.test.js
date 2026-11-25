import test from 'node:test';
import assert from 'node:assert/strict';

import { getFacilityReportSummary, getStoredReports } from '../src/services/reportStore.js';
import { useLocalStorage } from './helpers/localStorage.js';

test('report storage safely handles missing and malformed data', (t) => {
  const storage = useLocalStorage(t);
  assert.deepEqual(getStoredReports(), []);

  storage.setItem('csu-parking-reports', '{not-json');
  assert.deepEqual(getStoredReports(), []);
  storage.setItem('csu-parking-reports', '{}');
  assert.deepEqual(getStoredReports(), []);
});

test('report summaries count only recent active full reports and closures', (t) => {
  const storage = useLocalStorage(t);
  const now = 1_000_000_000;
  t.mock.method(Date, 'now', () => now);
  const reports = [
    { id: 'one', facilityId: 'lot21', issueType: 'lot_full', timestamp: now - 1000, expiresAt: now + 1000 },
    { id: 'two', facilityId: 'lot21', issueType: 'lot_full', timestamp: now - 2000, expiresAt: now + 1000 },
    { id: 'expired', facilityId: 'lot21', issueType: 'lot_full', timestamp: now - 3000, expiresAt: now - 1 },
    { id: 'old', facilityId: 'lot21', issueType: 'lot_full', timestamp: now - 31 * 60 * 1000, expiresAt: now + 1000 },
    { id: 'other', facilityId: 'lot22', issueType: 'lot_full', timestamp: now - 1000, expiresAt: now + 1000 },
  ];
  storage.setItem('csu-parking-reports', JSON.stringify(reports));

  const summary = getFacilityReportSummary('lot21');
  assert.equal(summary.reportCount, 2);
  assert.equal(summary.activeReports.length, 3);
  assert.equal(summary.hasEventClosure, false);

  reports.push({ id: 'closure', facilityId: 'lot21', issueType: 'event_closure', timestamp: now, expiresAt: now + 1000 });
  storage.setItem('csu-parking-reports', JSON.stringify(reports));
  assert.equal(getFacilityReportSummary('lot21').hasEventClosure, true);
});
