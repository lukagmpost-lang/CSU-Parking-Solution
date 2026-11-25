/**
 * Booking Service - Handles parking spot reservations with unique codes
 * Similar to s-eats order/kitchen key system
 */

import { getFacilityById } from '../data/csuParkingData.js';

const STORAGE_KEY = 'csu-parking-bookings';
const USER_BOOKING_KEY = 'csu-parking-user-booking';

let bookingSubscribers = new Set();

function notifySubscribers() {
  const bookings = getAllBookings();
  bookingSubscribers.forEach(callback => callback(bookings));
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

export function getAllBookings() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function subscribeToBookings(callback) {
  bookingSubscribers.add(callback);
  callback(getAllBookings());
  return () => bookingSubscribers.delete(callback);
}

export function validatePermitForFacility(permitType, facility) {
  if (!facility.permits.includes(permitType)) {
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
  
  return { valid: true };
}

export function calculatePrice(facility, permitType, durationHours) {
  if (permitType === 'Visitor') {
    const hourlyRate = facility.hourlyRate || (facility.type === 'garage' ? 4 : 3);
    const dailyMax = facility.dailyMax || (facility.type === 'garage' ? 24 : 18);
    const cost = durationHours * hourlyRate;
    return Math.min(cost, dailyMax);
  }
  return 0;
}

export function createBooking({ facilityId, permitType, durationHours = 4, vehicleInfo = '' }) {
  const bookings = getAllBookings();
  const facility = getFacilityById(facilityId);
  
  if (!facility) {
    return { success: false, error: 'Facility not found' };
  }
  
  const permitValidation = validatePermitForFacility(permitType, facility);
  if (!permitValidation.valid) {
    return { success: false, error: permitValidation.reason };
  }
  
  const now = Date.now();
  const activeBookings = bookings.filter(b => 
    b.facilityId === facilityId && 
    b.status === 'active' && 
    b.expiresAt > now
  ).length;
  
  if (!facility.hasLiveCount) {
    const maxConcurrent = Math.floor(facility.maxCapacity * 0.8);
    if (activeBookings >= maxConcurrent) {
      return { success: false, error: 'This lot is currently full' };
    }
  } else {
    const avail = getFacilityAvailability(facilityId);
    if (avail && avail.spacesAvailable <= 0) {
      return { success: false, error: 'This garage is currently full' };
    }
  }
  
  let code;
  let attempts = 0;
  do {
    code = generateBookingCode();
    attempts++;
    if (attempts > 10) {
      return { success: false, error: 'Could not generate unique code' };
    }
  } while (bookings.some(b => b.code === code));
  
  const adminCode = generateBookingCode().toLowerCase();
  const totalPrice = calculatePrice(facility, permitType, durationHours);
  
  const booking = {
    id: generateBookingId(),
    code: code,
    adminCode: adminCode,
    facilityId,
    facilityName: facility.name,
    facilityShortName: facility.shortName,
    facilityAddress: facility.address,
    permitType,
    vehicleInfo,
    durationHours,
    totalPrice,
    hourlyRate: facility.hourlyRate || (facility.type === 'garage' ? 4 : 3),
    dailyMax: facility.dailyMax || (facility.type === 'garage' ? 24 : 18),
    status: 'active',
    createdAt: now,
    expiresAt: now + (durationHours * 60 * 60 * 1000),
    assignedSpot: facility.hasLiveCount ? generateAssignedSpot(facility) : null,
    qrData: JSON.stringify({
      code: code,
      facilityId,
      type: 'parking'
    })
  };
  
  bookings.push(booking);
  saveBookings(bookings);
  saveUserBooking(booking);
  notifySubscribers();
  
  return { success: true, booking };
}

function getFacilityAvailability(facilityId) {
  try {
    const data = localStorage.getItem('csu-parking-availability-cache');
    if (data) {
      const cache = JSON.parse(data);
      return cache[facilityId];
    }
  } catch {}
  return null;
}

export function getBookingByCode(code) {
  if (!code) return null;
  const bookings = getAllBookings();
  const normalizedCode = code.toUpperCase().trim();
  return bookings.find(b => b.code === normalizedCode || b.adminCode === normalizedCode.toLowerCase()) || null;
}

export function getUserBooking() {
  try {
    const data = localStorage.getItem(USER_BOOKING_KEY);
    if (!data) return null;
    const booking = JSON.parse(data);
    if (booking.expiresAt < Date.now()) {
      clearUserBooking();
      return null;
    }
    return booking;
  } catch {
    return null;
  }
}

function saveUserBooking(booking) {
  localStorage.setItem(USER_BOOKING_KEY, JSON.stringify({
    id: booking.id,
    code: booking.code,
    adminCode: booking.adminCode,
    facilityId: booking.facilityId,
    facilityName: booking.facilityName,
    facilityShortName: booking.facilityShortName,
    facilityAddress: booking.facilityAddress,
    permitType: booking.permitType,
    vehicleInfo: booking.vehicleInfo,
    durationHours: booking.durationHours,
    totalPrice: booking.totalPrice,
    hourlyRate: booking.hourlyRate,
    dailyMax: booking.dailyMax,
    status: booking.status,
    createdAt: booking.createdAt,
    expiresAt: booking.expiresAt,
    assignedSpot: booking.assignedSpot,
    qrData: booking.qrData
  }));
}

export function clearUserBooking() {
  localStorage.removeItem(USER_BOOKING_KEY);
}

export function cancelBooking(code) {
  const bookings = getAllBookings();
  const index = bookings.findIndex(b => b.code === code.toUpperCase());
  if (index === -1) return { success: false, error: 'Booking not found' };
  
  bookings[index].status = 'cancelled';
  saveBookings(bookings);
  notifySubscribers();
  
  const userBooking = getUserBooking();
  if (userBooking && userBooking.code === code.toUpperCase()) {
    clearUserBooking();
  }
  
  return { success: true };
}

export function extendBooking(code, additionalHours) {
  const bookings = getAllBookings();
  const booking = bookings.find(b => b.code === code.toUpperCase());
  if (!booking) return { success: false, error: 'Booking not found' };
  
  if (booking.status !== 'active') {
    return { success: false, error: 'Cannot extend inactive booking' };
  }
  
  const facility = getFacilityById(booking.facilityId);
  if (facility) {
    const permitValidation = validatePermitForFacility(booking.permitType, facility);
    if (!permitValidation.valid) {
      return { success: false, error: permitValidation.reason };
    }
    const newDuration = booking.durationHours + additionalHours;
    const newPrice = calculatePrice(facility, booking.permitType, newDuration);
    booking.totalPrice = newPrice;
  }
  
  booking.expiresAt += additionalHours * 60 * 60 * 1000;
  booking.durationHours += additionalHours;
  saveBookings(bookings);
  notifySubscribers();
  
  const userBooking = getUserBooking();
  if (userBooking && userBooking.code === code.toUpperCase()) {
    userBooking.expiresAt = booking.expiresAt;
    userBooking.durationHours = booking.durationHours;
    userBooking.totalPrice = booking.totalPrice;
    saveUserBooking(userBooking);
  }
  
  return { success: true, booking };
}

export function getBookingStatus(booking) {
  const now = Date.now();
  
  if (booking.status === 'cancelled') return 'cancelled';
  if (booking.status === 'expired' || booking.expiresAt < now) return 'expired';
  if (booking.status === 'active') return 'active';
  
  return 'unknown';
}

export function formatTimeRemaining(expiresAt) {
  const remaining = expiresAt - Date.now();
  if (remaining <= 0) return 'Expired';
  
  const hours = Math.floor(remaining / (60 * 60 * 1000));
  const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));
  
  if (hours > 0) return hours + 'h ' + minutes + 'm remaining';
  return minutes + 'm remaining';
}

function generateAssignedSpot(facility) {
  const floor = Math.floor(Math.random() * facility.floors) + 1;
  const row = String.fromCharCode(65 + Math.floor(Math.random() * 8));
  const spot = Math.floor(Math.random() * 20) + 1;
  return facility.shortName + '-' + floor + row + '-' + spot.toString().padStart(2, '0');
}

export default {
  createBooking,
  getBookingByCode,
  getUserBooking,
  cancelBooking,
  extendBooking,
  getBookingStatus,
  formatTimeRemaining,
  subscribeToBookings,
  clearUserBooking,
  validatePermitForFacility,
  calculatePrice,
  getAllBookings,
};