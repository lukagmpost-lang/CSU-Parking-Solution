/**
 * ReservationLookupModal Component - Enter a code to view or manage a reservation
 */

import { escapeHtml, vibrate } from '../utils/helpers.js';
import { getBookingByCode, getUserBooking } from '../services/bookingService.js';

export function ReservationLookupModal() {
  const userBooking = getUserBooking();
  const savedCode = userBooking ? userBooking.code : '';

  return `
    <div class="modal-overlay" data-modal="reservation-lookup" role="dialog" aria-modal="true" aria-labelledby="lookup-title">
      <div class="modal-content animate-slide-up">
        <div class="modal-handle" aria-hidden="true"></div>

        <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 id="lookup-title" class="text-lg font-semibold text-gray-900">My Reservation</h2>
          <button
            type="button"
            data-modal-close="reservation-lookup"
            class="p-2 rounded-lg hover:bg-gray-100 text-gray-500"
            aria-label="Close"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <div class="p-6 space-y-5">
          ${savedCode ? `
            <div class="p-4 bg-csu-green/5 border border-csu-green/20 rounded-xl">
              <p class="text-sm font-medium text-csu-green mb-2">Current reservation</p>
              <div class="flex items-center justify-between gap-3">
                <div class="min-w-0">
                  <p class="font-mono text-lg font-bold text-gray-900">${escapeHtml(savedCode)}</p>
                  <p class="text-xs text-gray-500 truncate">${escapeHtml(userBooking.facilityName || '')}</p>
                </div>
                <button type="button" id="view-saved-booking" data-booking-code="${escapeHtml(savedCode)}" class="btn-secondary text-sm px-4 py-2 min-h-[40px] w-auto flex-shrink-0">
                  View
                </button>
              </div>
            </div>
          ` : ''}

          <div>
            <label class="input-label" for="code-input">Enter Booking Code</label>
            <div class="flex gap-2">
              <input
                type="text"
                id="code-input"
                placeholder="6-character code"
                value="${escapeHtml(savedCode)}"
                class="input-field flex-1 text-center text-2xl tracking-widest uppercase font-mono"
                maxlength="6"
                autocomplete="off"
                autocapitalize="characters"
                spellcheck="false"
                aria-label="Booking code"
              >
              <button
                type="button"
                id="paste-code"
                class="btn-ghost px-4 border border-gray-200"
                aria-label="Paste code from clipboard"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3"/>
                </svg>
              </button>
            </div>
            <p id="lookup-error" class="text-sm text-red-600 mt-2 hidden" role="alert"></p>
          </div>

          <button type="button" id="lookup-submit" class="btn-primary w-full">
            View Reservation
          </button>

          <p class="text-xs text-gray-500 text-center">
            Your code is on your confirmation screen or receipt.
          </p>
        </div>
      </div>
    </div>
  `;
}

export function initReservationLookupModal(container, { onClose, onOpenBooking }) {
  const modal = container.querySelector('[data-modal="reservation-lookup"]');
  if (!modal) return;

  const input = modal.querySelector('#code-input');
  const pasteBtn = modal.querySelector('#paste-code');
  const submitBtn = modal.querySelector('#lookup-submit');
  const viewSavedBtn = modal.querySelector('#view-saved-booking');
  const errorEl = modal.querySelector('#lookup-error');

  function showError(message) {
    if (!errorEl) return;
    errorEl.textContent = message;
    errorEl.classList.remove('hidden');
  }

  function clearError() {
    if (!errorEl) return;
    errorEl.textContent = '';
    errorEl.classList.add('hidden');
  }

  function normalizedValue() {
    return input.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
  }

  function syncInput() {
    input.value = normalizedValue();
    clearError();
    submitBtn.disabled = input.value.length !== 6;
  }

  function lookup() {
    const code = normalizedValue();

    if (code.length !== 6) {
      showError('Enter the 6-character booking code.');
      input.focus();
      vibrate([80]);
      return;
    }

    const booking = getBookingByCode(code);
    if (!booking) {
      showError('No reservation found for ' + code + '. Check the code and try again.');
      vibrate([80]);
      return;
    }

    onOpenBooking(booking.code);
  }

  input.addEventListener('input', syncInput);
  input.addEventListener('keydown', function (event) {
    if (event.key === 'Enter') {
      event.preventDefault();
      lookup();
    }
  });

  if (pasteBtn) {
    pasteBtn.addEventListener('click', async function () {
      try {
        const text = await navigator.clipboard.readText();
        input.value = text.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
        clearError();
        submitBtn.disabled = input.value.length !== 6;
        vibrate([40]);
      } catch (error) {
        showError('Clipboard access was denied. Type the code instead.');
      }
    });
  }

  if (viewSavedBtn) {
    viewSavedBtn.addEventListener('click', function () {
      const savedCode = viewSavedBtn.dataset.bookingCode;
      if (savedCode && savedCode.length === 6) onOpenBooking(savedCode);
    });
  }

  submitBtn.addEventListener('click', lookup);

  modal.querySelectorAll('[data-modal-close="reservation-lookup"]').forEach(function (button) {
    button.addEventListener('click', onClose);
  });

  modal.addEventListener('click', function (event) {
    if (event.target === modal) onClose();
  });

  syncInput();
  setTimeout(function () {
    input.focus();
    input.select();
  }, 60);
}
