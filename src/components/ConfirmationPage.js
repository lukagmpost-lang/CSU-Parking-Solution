/**
 * ConfirmationPage Component - View/manage booking by code (like s-eats kitchen dashboard)
 */

import { escapeHtml, formatTimeAgo, formatTimeRemaining } from '../utils/helpers.js';
import { getBookingStatus, formatTimeRemaining as svcFormatTimeRemaining, cancelBooking, extendBooking, getBookingByCode, clearUserBooking } from '../services/bookingService.js';

// Dynamic import to ensure QR code library is bundled
let QRCode = null;
async function loadQRCode() {
  if (!QRCode) {
    const module = await import('qrcode-generator');
    QRCode = module.default;
  }
  return QRCode;
}

export function ConfirmationPage({ code, onBack, onHome }) {
  let booking = null;
  let countdownInterval = null;

  function loadBooking() {
    booking = getBookingByCode(code);
    return booking;
  }

  function startCountdown() {
    if (countdownInterval) clearInterval(countdownInterval);
    countdownInterval = setInterval(() => {
      if (booking && document.getElementById('time-remaining')) {
        document.getElementById('time-remaining').textContent = formatTimeRemaining(booking.expiresAt);
        updateProgressBar();
      }
    }, 1000);
  }

  function stopCountdown() {
    if (countdownInterval) clearInterval(countdownInterval);
    countdownInterval = null;
  }

  function updateProgressBar() {
    if (!booking) return;
    const total = booking.durationHours * 60 * 60 * 1000;
    const elapsed = Date.now() - booking.createdAt;
    const progress = Math.min(100, Math.max(0, (elapsed / total) * 100));
    const bar = document.getElementById('progress-bar');
    if (bar) bar.style.width = progress + '%';
  }

  async function renderQRCode() {
    const container = document.getElementById('qr-code');
    if (!container || !booking) return;

    try {
      const QRCodeLib = await loadQRCode();
      const qr = QRCodeLib(0, 'M');
      qr.addData(booking.qrData || booking.code);
      qr.make();
      container.innerHTML = qr.createSvgTag(4, 0);
    } catch (e) {
      container.innerHTML = '<div class="w-full h-full flex items-center justify-center bg-gray-100 rounded"><p class="text-xs text-gray-500">QR unavailable</p></div>';
    }
  }

  function copyCode(code) {
    navigator.clipboard.writeText(code);
    const toast = document.createElement('div');
    toast.textContent = 'Code copied!';
    toast.className = 'fixed bottom-28 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-4 py-2 rounded-xl shadow-lg text-sm z-50 animate-slide-up';
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2000);
  }

  function render() {
    if (!booking) {
      return '<div class="min-h-screen bg-gray-50 flex items-center justify-center px-4"><div class="max-w-md w-full text-center py-12"><div class="animate-spin rounded-full h-12 w-12 border-4 border-csu-green border-t-transparent mx-auto mb-4"></div><p class="text-gray-600">Loading your booking...</p></div></div>';
    }

    const status = getBookingStatus(booking);
    const isActive = status === 'active';
    const isExpired = status === 'expired';
    const isCancelled = status === 'cancelled';

    let statusColor = 'emerald';
    let statusLabel = 'Active';
    if (isExpired) { statusColor = 'gray'; statusLabel = 'Expired'; }
    if (isCancelled) { statusColor = 'red'; statusLabel = 'Cancelled'; }

    const statusColors = {
      emerald: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      amber: 'bg-amber-100 text-amber-700 border-amber-200',
      red: 'bg-red-100 text-red-700 border-red-200',
      gray: 'bg-gray-100 text-gray-700 border-gray-200'
    };

    let timeRemainingHtml = '';
    if (isActive) {
      timeRemainingHtml = '<div class="bg-csu-green/5 border border-csu-green/20 rounded-xl p-4 mb-4">';
      timeRemainingHtml += '<div class="flex items-center justify-between mb-2">';
      timeRemainingHtml += '<span class="font-medium text-csu-green">Time Remaining</span>';
      timeRemainingHtml += '<span id="time-remaining" class="font-mono text-xl font-bold text-csu-green">' + formatTimeRemaining(booking.expiresAt) + '</span>';
      timeRemainingHtml += '</div>';
      timeRemainingHtml += '<div class="progress-bar" id="progress-container">';
      timeRemainingHtml += '<div id="progress-bar" class="progress-fill progress-emerald" style="width: 0%"></div>';
      timeRemainingHtml += '</div>';
      timeRemainingHtml += '<p class="text-xs text-gray-500 text-center mt-2">Expires ' + new Date(booking.expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + '</p>';
      timeRemainingHtml += '</div>';
    }

    let assignedSpotHtml = '';
    if (booking.assignedSpot) {
      assignedSpotHtml = '<div class="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-4">';
      assignedSpotHtml += '<div class="flex items-center gap-3">';
      assignedSpotHtml += '<div class="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">';
      assignedSpotHtml += '<svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"/></svg>';
      assignedSpotHtml += '</div>';
      assignedSpotHtml += '<div>';
      assignedSpotHtml += '<p class="text-sm font-medium text-gray-500">Assigned Spot</p>';
      assignedSpotHtml += '<p class="font-mono text-lg font-bold text-gray-900">' + escapeHtml(booking.assignedSpot) + '</p>';
      assignedSpotHtml += '</div>';
      assignedSpotHtml += '</div>';
    }

    let actionButtonsHtml = '';
    if (isActive) {
      const hourlyRate = booking.hourlyRate || (booking.facilityId.includes('lot') ? 3 : 4);
      actionButtonsHtml = '<div class="max-w-md mx-auto px-4 space-y-3 mb-6">';
      actionButtonsHtml += '<button type="button" class="btn-secondary w-full" onclick="window.dispatchEvent(new CustomEvent(\'confirmation-extend\', { detail: 1 }))">';
      actionButtonsHtml += '+1 Hour ($' + hourlyRate + ')';
      actionButtonsHtml += '</button>';
      actionButtonsHtml += '<button type="button" class="btn-secondary w-full" onclick="window.dispatchEvent(new CustomEvent(\'confirmation-extend\', { detail: 2 }))">';
      actionButtonsHtml += '+2 Hours ($' + (hourlyRate * 2) + ')';
      actionButtonsHtml += '</button>';
      actionButtonsHtml += '<button type="button" class="btn-danger w-full" onclick="window.dispatchEvent(new CustomEvent(\'confirmation-cancel\'))">';
      actionButtonsHtml += 'Cancel Reservation';
      actionButtonsHtml += '</button>';
      actionButtonsHtml += '</div>';
    } else if (isExpired) {
      actionButtonsHtml = '<div class="max-w-md mx-auto px-4 space-y-3 mb-6">';
      actionButtonsHtml += '<button type="button" class="btn-primary w-full" onclick="window.dispatchEvent(new CustomEvent(\'confirmation-rebook\'))">';
      actionButtonsHtml += 'Book Again';
      actionButtonsHtml += '</button>';
      actionButtonsHtml += '</div>';
    }

    let permitPriceHtml = '';
    if (booking.permitType !== 'Visitor') {
      permitPriceHtml = '<div class="flex justify-between text-sm">';
      permitPriceHtml += '<span class="text-gray-500">Permit Cost (Semester)</span>';
      permitPriceHtml += '<span class="font-medium">Prepaid</span>';
      permitPriceHtml += '</div>';
    } else {
      permitPriceHtml = '<div class="flex justify-between text-sm">';
      permitPriceHtml += '<span class="text-gray-500">Hourly Rate</span>';
      permitPriceHtml += '<span class="font-medium">$' + (booking.hourlyRate || 4) + '/hr</span>';
      permitPriceHtml += '</div>';
      if (booking.dailyMax) {
        permitPriceHtml += '<div class="flex justify-between text-sm">';
        permitPriceHtml += '<span class="text-gray-500">Daily Max</span>';
        permitPriceHtml += '<span class="font-medium">$' + booking.dailyMax + '</span>';
        permitPriceHtml += '</div>';
      }
    }

    return '<div class="min-h-screen bg-gray-50 flex flex-col">' +
      '<main class="flex-1 overflow-auto pb-24 max-w-md mx-auto w-full px-4 py-4">' +
        '<div class="facility-card mb-4">' +
          '<div class="flex items-center justify-between mb-4">' +
            '<div>' +
              '<h2 class="text-xl font-bold text-gray-900">' + escapeHtml(booking.facilityName) + '</h2>' +
              '<p class="text-sm text-gray-500">' + escapeHtml(booking.facilityAddress) + '</p>' +
            '</div>' +
            '<span class="status-badge ' + statusColors[statusColor] + '">' + statusLabel + '</span>' +
          '</div>' +
          '<div class="bg-gray-50 rounded-xl p-4 mb-4">' +
            '<div class="flex items-center justify-between mb-2">' +
              '<span class="text-sm font-medium text-gray-500">Booking Code</span>' +
              '<button type="button" class="btn-ghost text-xs" onclick="copyCode(\'' + booking.code + '\')">Copy</button>' +
            '</div>' +
            '<div class="font-mono text-3xl font-bold text-gray-900 text-center tracking-widest letter-spacing-[0.2em]">' + booking.code + '</div>' +
            '<p class="text-xs text-gray-500 text-center mt-1">Share this code or save for later</p>' +
          '</div>' +
          timeRemainingHtml +
          assignedSpotHtml +
          '<div class="space-y-3 mb-4">' +
            '<div class="flex justify-between text-sm"><span class="text-gray-500">Permit Type</span><span class="font-medium">' + escapeHtml(booking.permitType) + '</span></div>' +
            '<div class="flex justify-between text-sm"><span class="text-gray-500">Duration</span><span class="font-medium">' + booking.durationHours + ' hour' + (booking.durationHours !== 1 ? 's' : '') + '</span></div>' +
            (booking.vehicleInfo ? '<div class="flex justify-between text-sm"><span class="text-gray-500">Vehicle</span><span class="font-medium">' + escapeHtml(booking.vehicleInfo) + '</span></div>' : '') +
            '<div class="flex justify-between text-sm"><span class="text-gray-500">Reserved</span><span class="font-medium">' + formatTimeAgo(booking.createdAt) + '</span></div>' +
            '<div class="flex justify-between text-sm"><span class="text-gray-500">Expires</span><span class="font-medium">' + new Date(booking.expiresAt).toLocaleString() + '</span></div>' +
            permitPriceHtml +
            '<div class="flex justify-between text-sm pt-2 border-t border-gray-100"><span class="text-gray-500">Total Paid</span><span class="font-bold text-csu-green">$' + (booking.totalPrice || 0) + '</span></div>' +
          '</div>' +
        '</div>' +
        actionButtonsHtml +
        '<div class="max-w-md mx-auto px-4 mb-6">' +
          '<div class="facility-card text-center">' +
            '<h3 class="font-semibold text-gray-900 mb-3">Entry QR Code</h3>' +
            '<div class="bg-white p-4 rounded-xl inline-block">' +
              '<div id="qr-code" class="w-48 h-48 mx-auto"></div>' +
            '</div>' +
            '<p class="text-xs text-gray-500 mt-3">Show this at the gate for entry/exit</p>' +
          '</div>' +
        '</div>' +
      '</main>' +
    '</div>';
  }

  return {
    render: render,
    loadBooking: loadBooking,
    startCountdown: startCountdown,
    stopCountdown: stopCountdown,
    initQR: renderQRCode,
    getBooking: () => booking
  };
}