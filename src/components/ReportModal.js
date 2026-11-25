/**
 * ReportModal Component - 3-tap anonymous issue reporting
 */

import { ISSUE_TYPES, ALL_FACILITIES, getFacilityById } from '../data/csuParkingData.js';
import { escapeHtml, vibrate } from '../utils/helpers.js';
import { isInCooldown, getCooldownRemaining, submitReport } from '../services/reportingService.js';

export function ReportModal({ facilityId, onClose, onSubmit }) {
  const facility = getFacilityById(facilityId);
  const cooldown = isInCooldown();
  const cooldownMs = getCooldownRemaining();
  const cooldownMinutes = Math.ceil(cooldownMs / 60000);

  return `
    <div class="modal-overlay" data-modal="report" role="dialog" aria-modal="true" aria-labelledby="report-title">
      <div class="modal-content animate-slide-up max-w-md">
        <div class="modal-handle" aria-hidden="true"></div>
        
        <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 id="report-title" class="text-lg font-semibold text-gray-900">Report Issue</h2>
          <button 
            type="button" 
            data-modal-close="report"
            class="p-2 rounded-lg hover:bg-gray-100 text-gray-500"
            aria-label="Close"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
        
        <form id="report-form" class="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          <div>
            <label class="input-label">Location</label>
            ${facility ? `
              <div class="p-4 bg-csu-green/5 border border-csu-green/20 rounded-lg">
                <p class="font-medium text-csu-green">${escapeHtml(facility.name)}</p>
                <p class="text-sm text-gray-500 mt-0.5">${escapeHtml(facility.address)}</p>
                <input type="hidden" name="facilityId" value="${facility.id}">
              </div>
            ` : `
              <select name="facilityId" id="report-facility" class="input-field" aria-label="Parking location" required>
                <option value="">Select garage or lot...</option>
                ${ALL_FACILITIES.map(f => `
                  <option value="${f.id}">${escapeHtml(f.name)}</option>
                `).join('')}
              </select>
            `}
          </div>
          
          <div>
            <label class="input-label">Issue Type</label>
            <div class="grid grid-cols-2 gap-2" role="group" aria-label="Select issue type">
              ${ISSUE_TYPES.map(type => `
                <button
                  type="button"
                  data-issue="${type.id}"
                  class="issue-option flex flex-col items-start gap-2 p-3 min-h-[104px] border-2 border-gray-200 rounded-xl text-left hover:border-csu-green/50 transition-colors"
                  aria-pressed="false"
                >
                  <span class="flex items-center gap-2">
                    <svg class="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${getIssueIcon(type.id)}"/>
                    </svg>
                    <span class="text-sm font-medium text-gray-900 leading-tight">${escapeHtml(type.label)}</span>
                  </span>
                  <span class="text-xs text-gray-500 leading-snug">${escapeHtml(getIssueDescription(type.id))}</span>
                </button>
              `).join('')}
            </div>
            <input type="hidden" name="issueType" id="selected-issue" required>
          </div>
          
          <div>
            <label class="input-label">Additional Details (optional)</label>
            <textarea
              name="note"
              id="report-note"
              maxlength="140"
              rows="3"
              class="input-field resize-none"
              placeholder="Brief description (max 140 characters)..."
              aria-label="Issue details"
            ></textarea>
            <div class="flex justify-end mt-1">
              <span id="char-count" class="text-xs text-gray-400">0/140</span>
            </div>
          </div>
          
          ${cooldown ? `
            <div id="report-cooldown-notice" class="p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <div class="flex items-center gap-2 text-amber-800">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <span class="text-sm">Please wait ${cooldownMinutes} minute${cooldownMinutes !== 1 ? 's' : ''} before submitting another report</span>
              </div>
            </div>
          ` : ''}
          
          <div class="pt-2">
            <p id="report-error" class="text-sm text-red-600 mb-3 hidden" role="alert"></p>
            <button
              type="submit"
              id="submit-report"
              class="btn-primary w-full"
              data-cooldown="${cooldown ? 'true' : 'false'}"
              ${cooldown ? 'disabled' : ''}
            >
              Submit Report
            </button>
            <p class="text-xs text-gray-500 text-center mt-2">
              Anonymous \u2022 No login required \u2022 Reports expire after 60 minutes
            </p>
          </div>
        </form>
      </div>
    </div>
  `;
}

export function initReportModal(container, { onClose, onSubmit }) {
  const modal = container.querySelector('[data-modal="report"]');
  if (!modal) return;

  let selectedIssue = null;
  let isSubmitting = false;
  const noteInput = modal.querySelector('#report-note');
  const charCount = modal.querySelector('#char-count');
  const submitBtn = modal.querySelector('#submit-report');
  const facilityInput = modal.querySelector('input[name="facilityId"], select[name="facilityId"]');
  const issueInput = modal.querySelector('#selected-issue');
  const errorEl = modal.querySelector('#report-error');

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

  modal.querySelectorAll('[data-issue]').forEach(btn => {
    btn.addEventListener('click', () => {
      selectedIssue = btn.dataset.issue;
      modal.querySelectorAll('[data-issue]').forEach(b => {
        b.classList.remove('border-csu-green', 'bg-csu-green/5');
        b.setAttribute('aria-pressed', 'false');
      });
      btn.classList.add('border-csu-green', 'bg-csu-green/5');
      btn.setAttribute('aria-pressed', 'true');
      issueInput.value = selectedIssue;
      clearError();
      updateSubmitButton();
    });
  });

  noteInput.addEventListener('input', () => {
    charCount.textContent = noteInput.value.length + '/140';
  });

  const form = modal.querySelector('#report-form');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!selectedIssue) {
      showError('Choose an issue type first.');
      return;
    }

    const facilityId = facilityInput.value;
    const note = noteInput.value.trim();

    if (!facilityId) {
      showError('Choose a parking location first.');
      return;
    }

    clearError();
    isSubmitting = true;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting...';

    try {
      const result = await submitReport({ facilityId, issueType: selectedIssue, note });

      if (result.success) {
        vibrate([50, 50, 50]);
        onSubmit();
      } else {
        showError(result.error || 'Could not submit your report. Try again.');
      }
    } catch (error) {
      showError('This browser could not save your report. Check storage settings and try again.');
    } finally {
      isSubmitting = false;
      if (modal.isConnected) {
        submitBtn.textContent = 'Submit Report';
        updateSubmitButton();
      }
    }
  });

  function updateSubmitButton() {
    submitBtn.disabled = isSubmitting || !selectedIssue || isInCooldown();
  }

  modal.querySelectorAll('[data-modal-close="report"]').forEach(btn => {
    btn.addEventListener('click', onClose);
  });

  modal.addEventListener('click', (e) => {
    if (e.target === modal) onClose();
  });

  updateSubmitButton();

  const cooldownRemaining = getCooldownRemaining();
  if (cooldownRemaining > 0) {
    setTimeout(function () {
      if (!modal.isConnected) return;
      submitBtn.dataset.cooldown = 'false';
      const cooldownNotice = modal.querySelector('#report-cooldown-notice');
      if (cooldownNotice) cooldownNotice.remove();
      updateSubmitButton();
    }, cooldownRemaining + 50);
  }
}

function getIssueIcon(issueId) {
  const icons = {
    lot_full: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
    gate_broken: 'M4 7h16M6 7v10M18 7v10M4 17h16',
    blocked_space: 'M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z',
    pay_station_down: 'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2h2',
    event_closure: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
  };
  return icons[issueId] || icons.lot_full;
}

function getIssueDescription(issueId) {
  const descriptions = {
    lot_full: 'No spaces available',
    gate_broken: 'Entry/exit gate malfunction',
    blocked_space: 'Vehicle or object blocking spot',
    pay_station_down: 'Payment kiosk not working',
    event_closure: 'Closed for special event',
  };
  return descriptions[issueId] || '';
}