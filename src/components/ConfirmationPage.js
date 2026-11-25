/**
 * ConfirmationPage Component - View and manage a reservation by code
 */

import { escapeHtml, formatTimeAgo, formatTimeRemaining } from '../utils/helpers.js';
import { getBookingStatus, getBookingByCode, getExtensionQuote } from '../services/bookingService.js';
import { PERMIT_PRICING } from '../data/csuParkingData.js';

let qrLibrary = null;
let qrLibraryPromise = null;

function formatRemainingShort(expiresAt) {
  return formatTimeRemaining(expiresAt).replace(' remaining', '');
}

async function loadQrLibrary() {
  if (qrLibrary) return qrLibrary;

  if (!qrLibraryPromise) {
    qrLibraryPromise = import('qrcode-generator')
      .then(function (module) {
        qrLibrary = module.default || module;
        return qrLibrary;
      })
      .catch(function (error) {
        qrLibraryPromise = null;
        throw error;
      });
  }

  return qrLibraryPromise;
}

export function ConfirmationPage({ code, onExpire }) {
  let booking = null;
  let countdownInterval = null;
  let expirationNotified = false;

  function loadBooking() {
    booking = getBookingByCode(code);
    return booking;
  }

  function stopCountdown() {
    if (countdownInterval) clearInterval(countdownInterval);
    countdownInterval = null;
  }

  function updateProgressBar() {
    if (!booking) return;

    const total = Math.max(1, booking.durationHours * 60 * 60 * 1000);
    const elapsed = Date.now() - booking.createdAt;
    const used = Math.min(100, Math.max(0, (elapsed / total) * 100));
    const bar = document.getElementById('progress-bar');

    if (bar) bar.style.width = used + '%';
  }

  function tickCountdown() {
    if (!booking) {
      stopCountdown();
      return;
    }

    const remaining = booking.expiresAt - Date.now();
    const label = document.getElementById('time-remaining');

    if (label) label.textContent = remaining > 0 ? formatRemainingShort(booking.expiresAt) : 'Expired';
    updateProgressBar();

    if (remaining <= 0) {
      stopCountdown();
      if (!expirationNotified && typeof onExpire === 'function') {
        expirationNotified = true;
        setTimeout(function () { onExpire(code); }, 0);
      }
    }
  }

  function startCountdown() {
    stopCountdown();
    if (!booking || getBookingStatus(booking) !== 'active') return;

    tickCountdown();
    if (expirationNotified || getBookingStatus(booking) !== 'active') return;
    countdownInterval = setInterval(tickCountdown, 1000);
  }

  async function renderQRCode() {
    if (!booking || getBookingStatus(booking) !== 'active') return;

    const container = document.getElementById('qr-code');
    if (!container) return;

    try {
      const QRCode = await loadQrLibrary();
      const qr = QRCode(0, 'M');
      qr.addData(booking.qrData || booking.code);
      qr.make();
      container.innerHTML = qr.createSvgTag({ cellSize: 4, margin: 0, scalable: true });
      container.classList.add('qr-ready');
    } catch (error) {
      container.innerHTML = '<div class="w-full h-full flex flex-col items-center justify-center bg-gray-50 rounded-xl border border-gray-200"><p class="text-xs font-medium text-gray-500">QR unavailable</p><p class="font-mono text-lg font-bold text-gray-900 mt-1">' + escapeHtml(booking.code) + '</p></div>';
    }
  }

  function renderNotFound() {
    const displayCode = code ? code.toUpperCase().trim() : '';

    return '<div class="max-w-md mx-auto py-4" data-confirmation-page>' +
      '<div class="facility-card text-center py-10">' +
        '<div class="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">' +
          '<svg class="w-7 h-7 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>' +
        '</div>' +
        '<h2 class="text-xl font-bold text-gray-900 mb-2">Reservation not found</h2>' +
        '<p class="text-sm text-gray-500 mb-1">We could not find a reservation for:</p>' +
        (displayCode ? '<p class="font-mono text-2xl font-bold tracking-widest text-gray-900 mb-5">' + escapeHtml(displayCode) + '</p>' : '<div class="mb-5"></div>') +
        '<p class="text-xs text-gray-500 mb-6">Check the code on your receipt, or look it up again.</p>' +
        '<button type="button" class="btn-primary w-full mb-3" data-action="lookup-again">Look Up Another Code</button>' +
        '<button type="button" class="btn-secondary w-full" data-action="done">Back to Parking</button>' +
      '</div>' +
    '</div>';
  }

  function render() {
    if (!booking) return renderNotFound();

    const status = getBookingStatus(booking);
    const isActive = status === 'active';
    const isExpired = status === 'expired';
    const isCancelled = status === 'cancelled';

    const statusClass = isActive
      ? 'status-badge status-badge-emerald'
      : isCancelled
        ? 'status-badge status-badge-crimson'
        : 'status-badge status-badge-gray';

    const statusLabel = isActive ? 'Active' : isCancelled ? 'Cancelled' : 'Expired';

    let timeRemainingHtml = '';
    if (isActive) {
      const total = Math.max(1, booking.durationHours * 60 * 60 * 1000);
      const elapsed = Date.now() - booking.createdAt;
      const used = Math.min(100, Math.max(0, (elapsed / total) * 100));

      timeRemainingHtml =
        '<div class="bg-csu-green/5 border border-csu-green/20 rounded-xl p-4 mb-4">' +
          '<div class="flex items-baseline justify-between gap-3 mb-2">' +
            '<span class="text-sm font-medium text-csu-green">Time remaining</span>' +
            '<span id="time-remaining" class="font-mono text-base font-bold text-csu-green whitespace-nowrap">' + formatRemainingShort(booking.expiresAt) + '</span>' +
          '</div>' +
          '<div class="progress-bar">' +
            '<div id="progress-bar" class="progress-fill progress-emerald h-full rounded-full" style="width: ' + used + '%"></div>' +
          '</div>' +
          '<p class="text-xs text-gray-500 mt-2">Expires at ' + new Date(booking.expiresAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) + '</p>' +
        '</div>';
    }

    let noticeHtml = '';
    if (isExpired) {
      noticeHtml = '<div class="p-4 bg-gray-100 border border-gray-200 rounded-xl mb-4"><p class="text-sm font-medium text-gray-900">This reservation has expired.</p><p class="text-xs text-gray-500 mt-1">Reserve again to get a new code.</p></div>';
    } else if (isCancelled) {
      noticeHtml = '<div class="p-4 bg-red-50 border border-red-100 rounded-xl mb-4"><p class="text-sm font-medium text-red-800">This reservation was cancelled.</p><p class="text-xs text-red-700 mt-1">This reservation code is no longer active.</p></div>';
    }

    let assignedSpotHtml = '';
    if (booking.assignedSpot && isActive) {
      assignedSpotHtml =
        '<div class="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-4">' +
          '<div class="flex items-center gap-3">' +
            '<div class="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">' +
              '<svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"/></svg>' +
            '</div>' +
            '<div>' +
              '<p class="text-xs font-medium text-gray-500 uppercase tracking-wide">Assigned Spot</p>' +
              '<p class="font-mono text-lg font-bold text-gray-900">' + escapeHtml(booking.assignedSpot) + '</p>' +
            '</div>' +
          '</div>' +
        '</div>';
    }

    const permitPricing = PERMIT_PRICING[booking.permitType];
    let priceRows = '';
    if (booking.permitType === 'Visitor') {
      priceRows += '<div class="flex justify-between gap-4 text-sm"><span class="text-gray-500">Hourly Rate</span><span class="font-medium text-gray-900">$' + (booking.hourlyRate || 4) + '/hr</span></div>';
      priceRows += '<div class="flex justify-between gap-4 text-sm"><span class="text-gray-500">Daily Maximum</span><span class="font-medium text-gray-900">$' + (booking.dailyMax || 24) + '</span></div>';
    } else {
      const permitName = permitPricing ? permitPricing.name : booking.permitType + ' Permit';
      const permitCost = permitPricing && permitPricing.price !== undefined ? '$' + permitPricing.price + '/' + permitPricing.period : 'Prepaid';
      priceRows += '<div class="flex justify-between gap-4 text-sm"><span class="text-gray-500">Permit</span><span class="font-medium text-gray-900 text-right">' + escapeHtml(permitName) + '</span></div>';
      priceRows += '<div class="flex justify-between gap-4 text-sm"><span class="text-gray-500">Permit Cost</span><span class="font-medium text-gray-900">' + escapeHtml(permitCost) + '</span></div>';
    }

    let actionsHtml = '';
    if (isActive) {
      const isVisitor = booking.permitType === 'Visitor';
      const oneHourQuote = getExtensionQuote(booking.code, 1);
      const twoHourQuote = getExtensionQuote(booking.code, 2);
      const extensionLimitReached = oneHourQuote.error === 'Reservations cannot exceed 24 hours' && twoHourQuote.error === 'Reservations cannot exceed 24 hours';
      const extensionMessage = !oneHourQuote.success && !twoHourQuote.success
        ? extensionLimitReached ? 'The 24-hour reservation limit has been reached.' : oneHourQuote.error
        : '';

      function extensionButton(hours, quote) {
        const costLabel = isVisitor && quote.success ? ' ($' + quote.additionalCost + ')' : '';
        const errorLabel = quote.success ? '' : ' title="' + escapeHtml(quote.error) + '"';
        return '<button type="button" class="btn-secondary w-full" data-action="extend" data-hours="' + hours + '"' + (quote.success ? '' : ' disabled') + errorLabel + '>+' + hours + ' Hour' + (hours === 1 ? '' : 's') + costLabel + '</button>';
      }

      actionsHtml =
        '<div class="space-y-3 mb-4">' +
          '<div class="grid grid-cols-2 gap-3">' +
            extensionButton(1, oneHourQuote) +
            extensionButton(2, twoHourQuote) +
          '</div>' +
          (extensionMessage ? '<p class="text-xs text-gray-500 text-center">' + escapeHtml(extensionMessage) + '</p>' : '') +
          '<button type="button" class="btn-danger-outline w-full" data-action="cancel-booking">Cancel Reservation</button>' +
        '</div>';
    } else {
      actionsHtml =
        '<div class="space-y-3 mb-4">' +
          '<button type="button" class="btn-primary w-full" data-action="rebook">Book Again</button>' +
          '<button type="button" class="btn-secondary w-full" data-action="done">Back to Parking</button>' +
        '</div>';
    }

    let qrHtml = '';
    if (isActive) {
      qrHtml =
        '<div class="facility-card text-center mb-4">' +
          '<h3 class="font-semibold text-gray-900 mb-3">Reservation QR Code</h3>' +
          '<div class="bg-white p-3 rounded-xl inline-block border border-gray-100">' +
            '<div id="qr-code" class="w-52 h-52 mx-auto"></div>' +
          '</div>' +
          '<p class="text-xs text-gray-500 mt-3">Contains your booking code for lookup on this device. It is not a payment or gate credential.</p>' +
        '</div>';
    }

    return '<div class="max-w-md mx-auto py-4" data-confirmation-page>' +
      '<div class="facility-card mb-4">' +
        '<div class="flex items-start justify-between gap-3 mb-4">' +
          '<div class="min-w-0">' +
            '<h2 class="text-xl font-bold text-gray-900">' + escapeHtml(booking.facilityName) + '</h2>' +
            '<p class="text-sm text-gray-500">' + escapeHtml(booking.facilityAddress) + '</p>' +
          '</div>' +
          '<span class="' + statusClass + ' flex-shrink-0">' + statusLabel + '</span>' +
        '</div>' +

        '<div class="bg-gray-50 rounded-xl p-4 mb-4">' +
          '<div class="flex items-center justify-between gap-3 mb-2">' +
            '<span class="text-sm font-medium text-gray-500">Booking Code</span>' +
            '<button type="button" class="btn-ghost text-xs py-1.5 px-3 border border-gray-200" data-action="copy-code">Copy</button>' +
          '</div>' +
          '<div class="font-mono text-3xl font-bold text-gray-900 text-center tracking-[0.2em]">' + escapeHtml(booking.code) + '</div>' +
          '<p class="text-xs text-gray-500 text-center mt-2">Save this code to view or manage your reservation later on this device.</p>' +
        '</div>' +

        timeRemainingHtml +
        noticeHtml +
        assignedSpotHtml +

        '<div class="space-y-3 mb-4">' +
          '<div class="flex justify-between gap-4 text-sm"><span class="text-gray-500">Permit Type</span><span class="font-medium text-gray-900 text-right">' + escapeHtml(booking.permitName || booking.permitType) + '</span></div>' +
          '<div class="flex justify-between gap-4 text-sm"><span class="text-gray-500">Duration</span><span class="font-medium text-gray-900">' + booking.durationHours + ' hour' + (booking.durationHours === 1 ? '' : 's') + '</span></div>' +
          (booking.vehicleInfo ? '<div class="flex justify-between gap-4 text-sm"><span class="text-gray-500">Vehicle</span><span class="font-medium text-gray-900 text-right">' + escapeHtml(booking.vehicleInfo) + '</span></div>' : '') +
          '<div class="flex justify-between gap-4 text-sm"><span class="text-gray-500">Reserved</span><span class="font-medium text-gray-900">' + formatTimeAgo(booking.createdAt) + '</span></div>' +
          '<div class="flex justify-between gap-4 text-sm"><span class="text-gray-500">Expires</span><span class="font-medium text-gray-900 text-right">' + new Date(booking.expiresAt).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) + '</span></div>' +
          priceRows +
          '<div class="flex justify-between gap-4 text-sm pt-3 border-t border-gray-100"><span class="text-gray-500">Estimated Cost</span><span class="font-bold text-csu-green">$' + (booking.totalPrice || 0) + '</span></div>' +
        '</div>' +
      '</div>' +

      actionsHtml +
      qrHtml +
    '</div>';
  }

  return {
    render: render,
    loadBooking: loadBooking,
    startCountdown: startCountdown,
    stopCountdown: stopCountdown,
    initQR: renderQRCode,
    getBooking: function () { return booking; },
  };
}
