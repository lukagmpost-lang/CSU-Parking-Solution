/**
 * ReservationLookupModal Component - Enter code to view/manage reservation
 */

import { escapeHtml } from '../utils/helpers.js';
import { getBookingByCode, getUserBooking } from '../services/bookingService.js';
import { vibrate } from '../utils/helpers.js';

export function ReservationLookupModal({ onClose, onOpenBooking }) {
  const userBooking = getUserBooking();
  const savedCode = userBooking ? userBooking.code : '';

  return `
    <div class="modal-overlay" data-modal="reservation-lookup" role="dialog" aria-modal="true" aria-labelledby="lookup-title">
      <div class="modal-content animate-slide-up max-w-md">
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
            <div class="p-4 bg-csu-green/5 border border-csu-green/20 rounded-lg">
              <p class="text-sm font-medium text-csu-green mb-2">You have an active reservation</p>
              <div class="flex items-center justify-between">
                <div>
                  <p class="font-mono text-lg font-bold text-gray-900">${savedCode}</p>
                  <p class="text-xs text-gray-500">${escapeHtml(userBooking.facilityName)}</p>
                </div>
                <button
                  type="button"
                  id="view-saved-booking"
                  class="btn-primary text-sm px-4 py-2"
                >
                  View
                </button>
              </div>
            </div>
          ` : ''}
          
          <div>
            <label class="input-label">Enter Booking Code</label>
            <div class="flex gap-2">
              <input
                type="text"
                id="code-input"
                placeholder="6-character code"
                value="${escapeHtml(savedCode)}"
                class="input-field flex-1 text-center text-2xl tracking-widest uppercase"
                maxlength="6"
                aria-label="Booking code"
                ${savedCode ? 'readonly' : ''}
              >
              <button
                type="button"
                id="paste-code"
                class="btn-ghost px-4"
                ${savedCode ? 'disabled' : ''}
                aria-label="Paste from clipboard"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 012 2v2h2a2 2 0 012 2v2M8 5a2 2 0 002 2v2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2M8 5v14"/>
                </svg>
              </button>
            </div>
          </div>
          
          <div class="pt-2">
            <button
              type="button"
              id="lookup-submit"
              class="btn-primary w-full"
              ${!savedCode ? '' : ''}
            >
              ${savedCode ? 'View Reservation' : 'Look Up'}
            </button>
          </div>
          
          <p class="text-xs text-gray-500 text-center">
            Your code is on your confirmation screen or receipt
          </p>
        </div>
      </div>
    </div>

    <script>
      (function() {
        const modal = document.querySelector('[data-modal="reservation-lookup"]');
        if (!modal) return;
        
        const codeInput = modal.querySelector('#code-input');
        const pasteBtn = modal.querySelector('#paste-code');
        const submitBtn = modal.querySelector('#lookup-submit');
        const viewSavedBtn = modal.querySelector('#view-saved-booking');
        let submitted = false;
        
        function submit() {
          if (submitted) return;
          const code = codeInput.value.trim().toUpperCase();
          if (!code || code.length !== 6) {
            codeInput.focus();
            vibrate([100]);
            return;
          }
          submitted = true;
          submitBtn.disabled = true;
          submitBtn.textContent = 'Looking up...';
          onOpenBooking(code);
        }
        
        codeInput.addEventListener('input', () => {
          codeInput.value = codeInput.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
          submitBtn.disabled = codeInput.value.length !== 6;
        });
        
        pasteBtn?.addEventListener('click', async () => {
          try {
            const text = await navigator.clipboard.readText();
            const cleaned = text.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
            if (cleaned.length === 6) {
              codeInput.value = cleaned;
              submitBtn.disabled = false;
              vibrate([50]);
            }
          } catch (e) {
            // Clipboard permission denied
          }
        });
        
        viewSavedBtn?.addEventListener('click', () => {
          const code = codeInput.value.trim().toUpperCase();
          onOpenBooking(code);
        });
        
        submitBtn.addEventListener('click', submit);
        
        codeInput.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' && !submitBtn.disabled) {
            submit();
          }
        });
        
        modal.querySelectorAll('[data-modal-close="reservation-lookup"]').forEach(btn => {
          btn.addEventListener('click', onClose);
        });
        
        modal.addEventListener('click', (e) => {
          if (e.target === modal) onClose();
        });
        
        codeInput.focus();
      })();
    </script>
  `;
}