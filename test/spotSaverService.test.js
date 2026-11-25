import test from 'node:test';
import assert from 'node:assert/strict';

import {
  clearSpot,
  getSavedSpot,
  getTimerStatus,
  saveSpot,
} from '../src/services/spotSaverService.js';
import { useLocalStorage } from './helpers/localStorage.js';

function mockNow(t, initial = 1_000_000_000) {
  let now = initial;
  t.mock.method(Date, 'now', () => now);
  return {
    advance(milliseconds) {
      now += milliseconds;
    },
  };
}

function spotData(overrides = {}) {
  return {
    facilityId: 'cg',
    floor: '3',
    row: 'b',
    spot: '12',
    notes: ' Near elevator ',
    startTimer: true,
    durationMinutes: 120,
    ...overrides,
  };
}

test('spot saver validates facility, notes, and timer duration', (t) => {
  useLocalStorage(t);
  mockNow(t);

  assert.throws(() => saveSpot(spotData({ facilityId: 'missing' })), /valid parking facility/);
  assert.throws(() => saveSpot(spotData({ notes: 'x'.repeat(141) })), /140 characters/);
  for (const durationMinutes of [Number.NaN, 14, 721, 1.5]) {
    assert.throws(() => saveSpot(spotData({ durationMinutes })), /15 and 720 minutes/);
  }
  assert.equal(getSavedSpot(), null);
});

test('saved spot values are normalized and timer status is derived from expiry', (t) => {
  useLocalStorage(t);
  const clock = mockNow(t);

  const saved = saveSpot(spotData());
  assert.equal(saved.row, 'B');
  assert.equal(saved.notes, 'Near elevator');
  assert.equal(saved.timer.duration, 120 * 60 * 1000);
  assert.deepEqual(getTimerStatus(), {
    expired: false,
    remaining: 120 * 60 * 1000,
    minutes: 120,
    formatted: '2h 0m',
    expiresAt: saved.timer.expiresAt,
  });

  clock.advance(120 * 60 * 1000 + 1);
  assert.deepEqual(getTimerStatus(), { expired: true, remaining: 0 });
});

test('editing details preserves an active timer at the same facility', (t) => {
  useLocalStorage(t);
  const clock = mockNow(t);

  const original = saveSpot(spotData());
  clock.advance(5 * 60 * 1000);
  const edited = saveSpot(spotData({ notes: 'Blue pillar', spot: '14' }));

  assert.equal(edited.notes, 'Blue pillar');
  assert.equal(edited.spot, '14');
  assert.equal(edited.timer.startedAt, original.timer.startedAt);
  assert.equal(edited.timer.expiresAt, original.timer.expiresAt);
  assert.equal(getTimerStatus().minutes, 115);
});

test('changing facility or duration intentionally starts a new timer', (t) => {
  useLocalStorage(t);
  const clock = mockNow(t);

  const original = saveSpot(spotData());
  clock.advance(5 * 60 * 1000);
  const moved = saveSpot(spotData({ facilityId: 'wg' }));
  assert.notEqual(moved.timer.expiresAt, original.timer.expiresAt);

  clock.advance(5 * 60 * 1000);
  const changedDuration = saveSpot(spotData({ facilityId: 'wg', durationMinutes: 60 }));
  assert.notEqual(changedDuration.timer.expiresAt, moved.timer.expiresAt);
  assert.equal(changedDuration.timer.duration, 60 * 60 * 1000);
});

test('clearSpot removes the saved spot and timer', (t) => {
  useLocalStorage(t);
  mockNow(t);
  saveSpot(spotData());

  clearSpot();
  assert.equal(getSavedSpot(), null);
  assert.equal(getTimerStatus(), null);
});

test('legacy timer-key failure does not undo a successful spot save', (t) => {
  const storage = useLocalStorage(t);
  mockNow(t);
  const originalSetItem = storage.setItem.bind(storage);
  storage.setItem = (key, value) => {
    if (key === 'csu-parking-timer') throw new Error('Legacy key unavailable');
    originalSetItem(key, value);
  };

  const saved = saveSpot(spotData());
  assert.equal(getSavedSpot().spot, saved.spot);
  assert.equal(getTimerStatus().expired, false);
});
