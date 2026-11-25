/**
 * Booking Service - Handles parking spot reservations with unique codes
 * Similar to s-eats order/kitchen key system
 */

import { getFacilityById, PERMIT_PRICING, PERMIT_RULES, STATUS_TYPES } from '../data/csuParkingData.js';

const STORAGE_KEY = 'csu-parking-bookings';
const USER_BOOKING_KEY = 'csu-parking-user-booking';
const MAX_DURATION_HOURS = 24;
const MAX_VEHICLE_INFO_LENGTH = 50;
const MAX_APP_RESERVATIONS = 20;

let bookingSubscribers = new Set();

function notifySubscribers() {
  const bookings = getAllBookings();
  bookingSubscribers.forEach(callback => {
    try {
      callback(bookings);
    } catch (error) {
      console.error('Booking subscriber failed:', error);
    }
  });
}

function saveBookings(bookings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(bookings));
}

function generateBookingCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

function generateBookingId() {
  return 'bk_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

function normalizeCode(code) {
  return typeof code === 'string' ? code.toUpperCase().trim() : '';
}

function hasBookingCode(bookings, code) {
  const normalizedCode = normalizeCode(code);
  return bookings.some(booking =>
    normalizeCode(booking.code) === normalizedCode ||
    normalizeCode(booking.adminCode) === normalizedCode
  );
}

function findBooking(bookings, code) {
  const normalizedCode = normalizeCode(code);
  if (!normalizedCode) return null;
  return bookings.find(booking =>
    booking.code === normalizedCode || booking.adminCode === normalizedCode.toLowerCase()
  ) || null;
}

export function getAllBookings() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    const bookings = JSON.parse(data);
    return Array.isArray(bookings)
      ? bookings.filter(booking => booking && typeof booking === 'object')
      : [];
  } catch {
    return [];
  }
}

export function subscribeToBookings(callback) {
  bookingSubscribers.add(callback);
  callback(getAllBookings());
  return () => bookingSubscribers.delete(callback);
}

export function getReservationLimit(facility) {
  if (!facility) return 0;
  const facilityLimit = facility.hasLiveCount
    ? facility.maxCapacity
    : Math.floor(facility.maxCapacity * 0.8);
  return Math.min(MAX_APP_RESERVATIONS, facilityLimit);
}

export function validatePermitForFacility(permitType, facility, durationHours = 1) {
  if (!facility || !Array.isArray(facility.permits) || !facility.permits.includes(permitType)) {
    return { valid: false, reason: 'Permit not accepted at this facility' };
  }

  const now = new Date();
  const currentHour = now.getHours() + now.getMinutes() / 60;

  switch (permitType) {
    case 'Evening':
      if (currentHour < 15.5) {
        return { valid: false, reason: 'Evening permits valid after 3:30 PM' };
      }
      if (facility.type === 'garage') {
        return { valid: false, reason: 'Evening permits only valid for surface lots' };
      }
      break;
    case 'Night':
      if (currentHour < 17.5) {
        return { valid: false, reason: 'Night permits valid after 5:30 PM' };
      }
      if (facility.type === 'garage') {
        return { valid: false, reason: 'Night permits only valid for surface lots' };
      }
      break;
    case 'White':
      if (facility.type === 'surface') {
        return { valid: false, reason: 'White permits only valid for garages' };
      }
      break;
  }

  const timeRestriction = PERMIT_RULES[permitType]?.timeRestriction;
  if (timeRestriction && currentHour >= timeRestriction.start && currentHour + durationHours > timeRestriction.end) {
    return { valid: false, reason: permitType + ' reservations must end by midnight' };
  }

  return { valid: true };
}

export function calculatePrice(facility, permitType, durationHours) {
  if (!facility || !Number.isFinite(durationHours) || durationHours < 0) return 0;

  if (permitType === 'Visitor') {
    const hourlyRate = facility.hourlyRate || (facility.type === 'garage' ? 4 : 3);
    const dailyMax = facility.dailyMax || (facility.type === 'garage' ? 24 : 18);
    const cost = durationHours * hourlyRate;
    return Math.min(cost, dailyMax);
  }
  return 0;
}

function validateAvailability(facility, availability, activeBookings) {
  if (!availability) return { valid: true };

  if (availability.status === STATUS_TYPES.CLOSED) {
    return { valid: false, reason: 'This facility is not accepting reservations right now' };
  }

  if (facility.type === 'garage' && Number.isFinite(availability.spacesAvailable)) {
    const cachedActiveBookings = Number(availability.activeReservations) || 0;
    const reconciledSpaces = availability.spacesAvailable + cachedActiveBookings - activeBookings;
    if (reconciledSpaces <= 0) {
      return { valid: false, reason: 'This garage is currently full' };
    }
  }

  if (facility.type === 'surface' && [STATUS_TYPES.FULL, STATUS_TYPES.CLOSED].includes(availability.status)) {
    return { valid: false, reason: 'This lot is not accepting reservations right now' };
  }

  return { valid: true };
}

export function createBooking({
  facilityId,
  permitType,
  durationHours = 4,
  vehicleInfo = '',
  availability = null,
}) {
  const bookings = getAllBookings();
  const facility = getFacilityById(facilityId);

  if (!facility) {
    return { success: false, error: 'Facility not found' };
  }

  if (!PERMIT_PRICING[permitType]) {
    return { success: false, error: 'Choose a valid permit type' };
  }

  if (!Number.isInteger(durationHours) || durationHours < 1 || durationHours > MAX_DURATION_HOURS) {
    return { success: false, error: 'Duration must be between 1 and 24 hours' };
  }

  if (typeof vehicleInfo !== 'string' || vehicleInfo.trim().length > MAX_VEHICLE_INFO_LENGTH) {
    return { success: false, error: 'Vehicle info must be 50 characters or less' };
  }

  const permitValidation = validatePermitForFacility(permitType, facility, durationHours);
  if (!permitValidation.valid) {
    return { success: false, error: permitValidation.reason };
  }

  const now = Date.now();
  const activeBookings = bookings.filter(booking =>
    booking.facilityId === facilityId &&
    booking.status === 'active' &&
    booking.expiresAt > now
  ).length;

  const availabilityValidation = validateAvailability(facility, availability, activeBookings);
  if (!availabilityValidation.valid) {
    return { success: false, error: availabilityValidation.reason };
  }

  if (activeBookings >= getReservationLimit(facility)) {
    return { success: false, error: 'No app reservations remain for this facility' };
  }

  let code;
  let attempts = 0;
  do {
    code = generateBookingCode();
    attempts++;
    if (attempts > 20) {
      return { success: false, error: 'Could not generate a unique code. Try again.' };
    }
  } while (hasBookingCode(bookings, code));

  let adminCode;
  attempts = 0;
  do {
    adminCode = generateBookingCode().toLowerCase();
    attempts++;
    if (attempts > 20) {
      return { success: false, error: 'Could not generate a unique code. Try again.' };
    }
  } while (adminCode === code.toLowerCase() || hasBookingCode(bookings, adminCode));

  const totalPrice = calculatePrice(facility, permitType, durationHours);
  const permitPricing = PERMIT_PRICING[permitType];
  const assignedSpot = facility.hasLiveCount
    ? generateAssignedSpot(facility, bookings, now)
    : null;

  if (facility.hasLiveCount && !assignedSpot) {
    return { success: false, error: 'No assignable spots remain for this facility' };
  }

  const booking = {
    id: generateBookingId(),
    code: code,
    adminCode: adminCode,
    facilityId,
    facilityName: facility.name,
    facilityShortName: facility.shortName,
    facilityAddress: facility.address,
    facilityType: facility.type,
    permitType,
    permitName: permitPricing.name,
    permitPrice: permitPricing.price !== undefined ? permitPricing.price : null,
    permitPriceRange: permitPricing.priceRange || null,
    permitPeriod: permitPricing.period || null,
    vehicleInfo: vehicleInfo.trim(),
    durationHours,
    totalPrice,
    hourlyRate: facility.hourlyRate || (facility.type === 'garage' ? 4 : 3),
    dailyMax: facility.dailyMax || (facility.type === 'garage' ? 24 : 18),
    status: 'active',
    createdAt: now,
    expiresAt: now + (durationHours * 60 * 60 * 1000),
    assignedSpot,
    qrData: JSON.stringify({
      code: code,
      facilityId,
      type: 'parking'
    })
  };

  bookings.push(booking);

  try {
    saveBookings(bookings);
  } catch {
    return { success: false, error: 'This browser could not save the reservation. Check storage settings and try again.' };
  }

  saveUserBooking(booking);
  notifySubscribers();

  return { success: true, booking };
}

export function getBookingByCode(code) {
  return findBooking(getAllBookings(), code);
}

export function getUserBooking() {
  try {
    const data = localStorage.getItem(USER_BOOKING_KEY);
    if (!data) return null;
    const cachedBooking = JSON.parse(data);
    const booking = getBookingByCode(cachedBooking.code);

    if (!booking || getBookingStatus(booking) !== 'active') {
      clearUserBooking();
      return null;
    }

    return booking;
  } catch {
    return null;
  }
}

function saveUserBooking(booking) {
  try {
    localStorage.setItem(USER_BOOKING_KEY, JSON.stringify(booking));
    return true;
  } catch {
    return false;
  }
}

export function clearUserBooking() {
  try {
    localStorage.removeItem(USER_BOOKING_KEY);
  } catch {
    // Storage can be unavailable in private browsing; the main booking is unaffected.
  }
}

export function cancelBooking(code) {
  const bookings = getAllBookings();
  const normalizedCode = normalizeCode(code);
  const booking = findBooking(bookings, normalizedCode);

  if (!booking || booking.code !== normalizedCode) {
    return { success: false, error: 'Booking not found' };
  }

  const status = getBookingStatus(booking);
  if (status !== 'active') {
    return { success: false, error: 'Only active reservations can be cancelled' };
  }

  booking.status = 'cancelled';
  booking.cancelledAt = Date.now();

  try {
    saveBookings(bookings);
  } catch {
    return { success: false, error: 'Could not save the cancellation. Try again.' };
  }

  const userBooking = getUserBooking();
  if (userBooking && userBooking.code === normalizedCode) clearUserBooking();
  notifySubscribers();

  return { success: true, booking };
}

function getExtensionQuoteForBooking(booking, additionalHours) {
  if (!booking) return { success: false, error: 'Booking not found' };

  if (!Number.isInteger(additionalHours) || additionalHours < 1) {
    return { success: false, error: 'Extension must be a whole number of hours' };
  }

  if (getBookingStatus(booking) !== 'active') {
    return { success: false, error: 'Only active, unexpired reservations can be extended' };
  }

  const currentDuration = Number(booking.durationHours);
  const newDuration = currentDuration + additionalHours;
  if (!Number.isFinite(currentDuration) || newDuration > MAX_DURATION_HOURS) {
    return { success: false, error: 'Reservations cannot exceed 24 hours' };
  }

  const facility = getFacilityById(booking.facilityId);
  if (!facility) return { success: false, error: 'Facility not found' };

  const newExpiresAt = booking.expiresAt + additionalHours * 60 * 60 * 1000;
  const remainingDurationHours = (newExpiresAt - Date.now()) / (60 * 60 * 1000);
  const permitValidation = validatePermitForFacility(booking.permitType, facility, remainingDurationHours);
  if (!permitValidation.valid) {
    return { success: false, error: permitValidation.reason };
  }

  const newPrice = calculatePrice(facility, booking.permitType, newDuration);
  const currentPrice = Number(booking.totalPrice) || 0;

  return {
    success: true,
    additionalCost: Math.max(0, newPrice - currentPrice),
    newDuration,
    newPrice,
    newExpiresAt,
  };
}

export function getExtensionQuote(code, additionalHours) {
  return getExtensionQuoteForBooking(getBookingByCode(code), additionalHours);
}

export function extendBooking(code, additionalHours) {
  const bookings = getAllBookings();
  const normalizedCode = normalizeCode(code);
  const booking = findBooking(bookings, normalizedCode);

  if (!booking || booking.code !== normalizedCode) {
    return { success: false, error: 'Booking not found' };
  }

  const quote = getExtensionQuoteForBooking(booking, additionalHours);
  if (!quote.success) return quote;

  booking.expiresAt = quote.newExpiresAt;
  booking.durationHours = quote.newDuration;
  booking.totalPrice = quote.newPrice;

  try {
    saveBookings(bookings);
  } catch {
    return { success: false, error: 'Could not save the extension. Try again.' };
  }

  const userBooking = getUserBooking();
  if (userBooking && userBooking.code === normalizedCode) saveUserBooking(booking);
  notifySubscribers();

  return { success: true, booking, additionalCost: quote.additionalCost };
}

export function getBookingStatus(booking) {
  if (!booking || typeof booking !== 'object') return 'unknown';

  const now = Date.now();

  if (booking.status === 'cancelled') return 'cancelled';
  if (booking.status === 'expired' || !Number.isFinite(booking.expiresAt) || booking.expiresAt <= now) return 'expired';
  if (booking.status === 'active') return 'active';

  return 'unknown';
}

export function formatTimeRemaining(expiresAt) {
  const remaining = expiresAt - Date.now();
  if (remaining <= 0) return 'Expired';
  if (remaining < 60 * 1000) return '<1m remaining';

  const hours = Math.floor(remaining / (60 * 60 * 1000));
  const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));

  if (hours > 0) return hours + 'h ' + minutes + 'm remaining';
  return minutes + 'm remaining';
}

function generateAssignedSpot(facility, bookings, now) {
  const occupiedSpots = new Set(
    bookings
      .filter(booking =>
        booking.facilityId === facility.id &&
        booking.status === 'active' &&
        booking.expiresAt > now &&
        booking.assignedSpot
      )
      .map(booking => booking.assignedSpot)
  );

  const floors = Math.max(1, facility.floors || 1);
  const rows = 8;
  const spotsPerRow = 20;
  const totalSpots = floors * rows * spotsPerRow;
  const startIndex = Math.floor(Math.random() * totalSpots);

  for (let offset = 0; offset < totalSpots; offset++) {
    const index = (startIndex + offset) % totalSpots;
    const floor = Math.floor(index / (rows * spotsPerRow)) + 1;
    const row = String.fromCharCode(65 + Math.floor((index % (rows * spotsPerRow)) / spotsPerRow));
    const spot = (index % spotsPerRow) + 1;
    const assignedSpot = facility.shortName + '-' + floor + row + '-' + spot.toString().padStart(2, '0');

    if (!occupiedSpots.has(assignedSpot)) return assignedSpot;
  }

  return null;
}

export default {
  createBooking,
  getBookingByCode,
  getUserBooking,
  cancelBooking,
  extendBooking,
  getExtensionQuote,
  getBookingStatus,
  formatTimeRemaining,
  subscribeToBookings,
  clearUserBooking,
  validatePermitForFacility,
  calculatePrice,
  getAllBookings,
  getReservationLimit,
};
