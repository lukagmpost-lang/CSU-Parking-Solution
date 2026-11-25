import test from 'node:test';
import assert from 'node:assert/strict';

import {
  calculatePrice,
  cancelBooking,
  createBooking,
  extendBooking,
  getAllBookings,
  getBookingByCode,
  getBookingStatus,
  getExtensionQuote,
} from '../src/services/bookingService.js';
import { getFacilityById, STATUS_TYPES } from '../src/data/csuParkingData.js';
import { useLocalStorage } from './helpers/localStorage.js';

const garage = getFacilityById('cg');
const surfaceLot = getFacilityById('lot21');

function availableGarage(overrides = {}) {
  return {
    type: 'garage',
    status: STATUS_TYPES.OPEN,
    spacesAvailable: 100,
    activeReservations: 0,
    reservationsRemaining: 20,
    ...overrides,
  };
}

function availableSurface(overrides = {}) {
  return {
    type: 'surface',
    status: STATUS_TYPES.OPEN,
    activeReservations: 0,
    reservationsRemaining: 20,
    ...overrides,
  };
}

function mockDate(t, date = new Date(2026, 0, 15, 12, 0, 0)) {
  t.mock.timers.enable({ apis: ['Date'], now: date });
}

function createVisitor(overrides = {}) {
  return createBooking({
    facilityId: 'cg',
    permitType: 'Visitor',
    durationHours: 4,
    vehicleInfo: 'TEST-123',
    availability: availableGarage(),
    ...overrides,
  });
}

test('visitor pricing applies hourly rates and the daily cap safely', () => {
  assert.equal(calculatePrice(garage, 'Visitor', 4), 16);
  assert.equal(calculatePrice(garage, 'Visitor', 8), 24);
  assert.equal(calculatePrice(surfaceLot, 'Visitor', 8), 18);
  assert.equal(calculatePrice(garage, 'Green', 8), 0);
  assert.equal(calculatePrice(garage, 'Visitor', -1), 0);
  assert.equal(calculatePrice(garage, 'Visitor', Number.NaN), 0);
});

test('booking validates facility, permit, duration, and vehicle input', (t) => {
  useLocalStorage(t);
  mockDate(t);

  assert.equal(createVisitor({ facilityId: 'missing' }).error, 'Facility not found');
  assert.equal(createVisitor({ permitType: 'invalid' }).error, 'Choose a valid permit type');
  assert.equal(createVisitor({ permitType: 'Evening' }).error, 'Permit not accepted at this facility');

  for (const durationHours of [0, 25, 1.5, Number.NaN]) {
    assert.match(createVisitor({ durationHours }).error, /between 1 and 24 hours/);
  }

  assert.match(createVisitor({ vehicleInfo: 'x'.repeat(51) }).error, /50 characters/);
  assert.equal(getAllBookings().length, 0);
});

test('booking rejects full or closed facilities', (t) => {
  useLocalStorage(t);
  mockDate(t);

  assert.match(createVisitor({ availability: availableGarage({ spacesAvailable: 0 }) }).error, /currently full/);
  assert.match(createVisitor({ availability: availableGarage({ status: STATUS_TYPES.CLOSED }) }).error, /not accepting reservations/);
  assert.match(createVisitor({ facilityId: 'lot21', availability: availableSurface({ status: STATUS_TYPES.FULL }) }).error, /not accepting reservations/);
});

test('active bookings get unique codes and garage spot assignments', (t) => {
  useLocalStorage(t);
  mockDate(t);

  const first = createVisitor();
  const second = createVisitor();

  assert.equal(first.success, true);
  assert.equal(second.success, true);
  assert.match(first.booking.code, /^[A-Z2-9]{6}$/);
  assert.notEqual(first.booking.code, second.booking.code);
  assert.ok(first.booking.assignedSpot);
  assert.ok(second.booking.assignedSpot);
  assert.notEqual(first.booking.assignedSpot, second.booking.assignedSpot);
  assert.equal(first.booking.totalPrice, 16);
  assert.equal(getBookingByCode(first.booking.code.toLowerCase()).id, first.booking.id);
});

test('new booking codes cannot collide with an existing admin code', (t) => {
  const storage = useLocalStorage(t);
  mockDate(t);
  storage.setItem('csu-parking-bookings', JSON.stringify([{
    id: 'existing',
    code: 'ZZZZZZ',
    adminCode: 'aaaaaa',
    facilityId: 'cg',
    status: 'cancelled',
  }]));

  const randomValues = [
    ...Array(6).fill(0),
    ...Array(6).fill(1 / 32),
  ];
  t.mock.method(Math, 'random', () => randomValues.length ? randomValues.shift() : 0.5);

  const result = createVisitor();
  assert.equal(result.success, true);
  assert.equal(result.booking.code, 'BBBBBB');
  assert.equal(getBookingByCode('BBBBBB').id, result.booking.id);
});

test('the app reservation limit is enforced independently of cached availability', (t) => {
  const storage = useLocalStorage(t);
  mockDate(t);
  const now = Date.now();
  const bookings = Array.from({ length: 20 }, (_, index) => ({
    id: 'existing-' + index,
    code: 'CODE' + String(index).padStart(2, '0'),
    facilityId: 'cg',
    status: 'active',
    expiresAt: now + 60 * 60 * 1000,
  }));
  storage.setItem('csu-parking-bookings', JSON.stringify(bookings));

  const result = createVisitor({
    availability: availableGarage({ activeReservations: 20, reservationsRemaining: 0 }),
  });
  assert.equal(result.success, false);
  assert.match(result.error, /No app reservations remain/);
});

test('cancellation reconciles stale cached capacity and allows an immediate rebook', (t) => {
  useLocalStorage(t);
  mockDate(t);

  const first = createVisitor({ availability: availableGarage({ spacesAvailable: 1 }) });
  assert.equal(first.success, true);
  assert.equal(cancelBooking(first.booking.code).success, true);
  assert.equal(getBookingStatus(getBookingByCode(first.booking.code)), 'cancelled');

  const rebooked = createVisitor({
    availability: availableGarage({ spacesAvailable: 0, activeReservations: 1 }),
  });
  assert.equal(rebooked.success, true);
});

test('extension quotes enforce integer hours, expiration, and the 24-hour limit', (t) => {
  useLocalStorage(t);
  mockDate(t);

  const created = createVisitor();
  const originalExpiry = created.booking.expiresAt;
  assert.equal(extendBooking(created.booking.code, 0).success, false);
  assert.equal(extendBooking(created.booking.code, 1.5).success, false);

  const quote = getExtensionQuote(created.booking.code, 1);
  assert.equal(quote.success, true);
  assert.equal(quote.additionalCost, 4);
  const extended = extendBooking(created.booking.code, 1);
  assert.equal(extended.success, true);
  assert.equal(extended.booking.durationHours, 5);
  assert.equal(extended.booking.totalPrice, 20);
  assert.equal(extended.booking.expiresAt, originalExpiry + 60 * 60 * 1000);

  const allDay = createVisitor({ durationHours: 24 });
  assert.equal(allDay.success, true);
  assert.match(getExtensionQuote(allDay.booking.code, 1).error, /cannot exceed 24 hours/);
});

test('extension cost is zero after the visitor daily cap is reached', (t) => {
  useLocalStorage(t);
  mockDate(t);

  const created = createVisitor({ durationHours: 8 });
  const quote = getExtensionQuote(created.booking.code, 2);
  assert.equal(created.booking.totalPrice, 24);
  assert.equal(quote.success, true);
  assert.equal(quote.additionalCost, 0);
  assert.equal(quote.newPrice, 24);
});

test('expired reservations cannot be extended or cancelled', (t) => {
  const storage = useLocalStorage(t);
  mockDate(t);

  const created = createVisitor({ durationHours: 1 });
  const bookings = getAllBookings();
  bookings[0].expiresAt = Date.now() - 1;
  storage.setItem('csu-parking-bookings', JSON.stringify(bookings));

  assert.equal(getBookingStatus(bookings[0]), 'expired');
  assert.match(extendBooking(created.booking.code, 1).error, /active, unexpired/);
  assert.match(cancelBooking(created.booking.code).error, /Only active reservations/);
});

test('Evening reservations and extensions cannot run past midnight', (t) => {
  useLocalStorage(t);
  mockDate(t, new Date(2026, 0, 15, 16, 0, 0));

  const invalid = createBooking({
    facilityId: 'lot21',
    permitType: 'Evening',
    durationHours: 9,
    availability: availableSurface(),
  });
  assert.match(invalid.error, /end by midnight/);

  const created = createBooking({
    facilityId: 'lot21',
    permitType: 'Evening',
    durationHours: 7,
    availability: availableSurface(),
  });
  assert.equal(created.success, true);

  t.mock.timers.setTime(new Date(2026, 0, 15, 16, 30, 0).getTime());
  assert.match(getExtensionQuote(created.booking.code, 2).error, /end by midnight/);
});

test('a failed storage write does not report a successful reservation', (t) => {
  const storage = useLocalStorage(t);
  mockDate(t);
  const originalSetItem = storage.setItem.bind(storage);
  storage.setItem = (key, value) => {
    if (key === 'csu-parking-bookings') throw new Error('Storage denied');
    originalSetItem(key, value);
  };

  const result = createVisitor();
  assert.equal(result.success, false);
  assert.match(result.error, /could not save the reservation/);
  assert.equal(storage.getItem('csu-parking-bookings'), null);
});
