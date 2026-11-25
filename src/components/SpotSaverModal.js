/**
 * SpotSaverModal Component - Save/edit parking spot with timer
 */

import { ALL_FACILITIES, getFacilityById } from '../data/csuParkingData.js';
import { escapeHtml, formatDurationMinutes, vibrate } from '../utils/helpers.js';
import { saveSpot, getSavedSpot, clearSpot } from '../services/spotSaverService.js';

export function SpotSaverModal({ facilityId, onClose, onSave }) {
  const facility = facilityId ? getFacilityById(facilityId) : null;
  const existingSpot = getSavedSpot();
  const isEditing = !!existingSpot;

  const defaultFacility = facility || (existingSpot ? getFacilityById(existingSpot.facilityId) : ALL_FACILITIES[0]);
  const defaultFloor = existingSpot?.floor || '';
  const defaultRow = existingSpot?.row || '';
  const defaultSpot = existingSpot?.spot || '';
  const defaultNotes = existingSpot?.notes || '';
  const defaultTimer = existingSpot?.timer ? true : false;
  const defaultDuration = existingSpot?.timer ? Math.round(existingSpot.timer.duration / 60000) : 120;

  return `
    <div class="modal-overlay" data-modal="spot-saver" role="dialog" aria-modal="true" aria-labelledby="spot-saver-title">
      <div class="modal-content animate-slide-up max-w-md">
        <div class="modal-handle" aria-hidden="true"></div>
        
        <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 id="spot-saver-title" class="text-lg font-semibold text-gray-900">${isEditing ? 'Edit Parking Spot' : 'Save My Spot'}</h2>
          <button 
            type="button" 
            data-modal-close="spot-saver"
            class="p-2 rounded-lg hover:bg-gray-100 text-gray-500"
            aria-label="Close"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
        
        <form id="spot-saver-form" class="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          <div>
            <label class="input-label" for="spot-facility">Parking Facility *</label>
            <select name="facilityId" id="spot-facility" class="input-field" required>
              ${ALL_FACILITIES.map(f => `
                <option value="${f.id}" ${defaultFacility.id === f.id ? 'selected' : ''}>
                  ${escapeHtml(f.name)}
                </option>
              `).join('')}
            </select>
          </div>
          
          <div class="grid grid-cols-3 gap-3">
            <div>
              <label class="input-label">Floor/Level</label>
              <input
                type="text"
                name="floor"
                aria-label="Floor or level"
                value="${escapeHtml(defaultFloor)}"
                placeholder="e.g., 3"
                class="input-field"
                maxlength="10"
              >
            </div>
            <div>
              <label class="input-label">Row</label>
              <input
                type="text"
                name="row"
                aria-label="Parking row"
                value="${escapeHtml(defaultRow)}"
                placeholder="e.g., B"
                class="input-field"
                maxlength="5"
              >
            </div>
            <div>
              <label class="input-label">Spot #</label>
              <input
                type="text"
                name="spot"
                aria-label="Parking spot number"
                value="${escapeHtml(defaultSpot)}"
                placeholder="e.g., 12"
                class="input-field"
                maxlength="10"
              >
            </div>
          </div>
          
          <div>
            <label class="input-label">Notes (optional)</label>
            <input
              type="text"
              name="notes"
              aria-label="Parking spot notes"
              value="${escapeHtml(defaultNotes)}"
              placeholder="e.g., Near elevator, blue pillar"
              class="input-field"
              maxlength="140"
            >
          </div>
          
          <div class="border-t border-gray-200 pt-4">
            <div class="flex items-center justify-between mb-4">
              <div>
                <p class="font-medium text-gray-900">Parking Timer</p>
                <p class="text-sm text-gray-500">Track time left on your meter/Text2Park session</p>
              </div>
              <label class="toggle-switch">
                <input type="checkbox" name="startTimer" id="timer-toggle" aria-label="Track parking time" ${defaultTimer ? 'checked' : ''}>
                <span class="switch-track">
                  <span class="switch-thumb"></span>
                </span>
              </label>
            </div>
            
            <div id="timer-options" class="space-y-4 ${!defaultTimer ? 'hidden' : ''}">
              <div>
                <label class="input-label">Duration</label>
                <div class="flex items-center gap-3">
                  <button
                    type="button"
                    class="btn-ghost w-12 h-12 p-0"
                    data-timer-adjust="-30"
                    aria-label="Subtract 30 minutes"
                  >
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4"/>
                    </svg>
                  </button>
                  <input
                    type="number"
                    name="durationMinutes"
                    id="duration-input"
                    value="${defaultDuration}"
                    min="15"
                    max="720"
                    step="15"
                    class="input-field text-center flex-1"
                    aria-label="Timer duration in minutes"
                  >
                  <button
                    type="button"
                    class="btn-ghost w-12 h-12 p-0"
                    data-timer-adjust="30"
                    aria-label="Add 30 minutes"
                  >
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                    </svg>
                  </button>
                </div>
                <p class="text-xs text-gray-500 mt-1 text-center" id="duration-display">
                  ${formatDurationMinutes(defaultDuration)}
                </p>
              </div>
              
              <div class="grid grid-cols-3 gap-2">
                ${[30, 60, 120, 180, 240].map(min => `
                  <button
                    type="button"
                    class="filter-chip ${defaultDuration === min ? 'filter-chip-active' : ''}"
                    data-quick-duration="${min}"
                  >
                    ${formatDurationMinutes(min)}
                  </button>
                `).join('')}
              </div>
            </div>
          </div>
          
          <div class="pt-2 space-y-3">
            <p id="spot-saver-error" class="text-sm text-red-600 hidden" role="alert"></p>
            <button
              type="submit"
              class="btn-primary w-full"
            >
              ${isEditing ? 'Update Spot' : 'Save Spot'}
            </button>
            ${isEditing ? `
              <button
                type="button"
                id="clear-spot"
                class="btn-secondary w-full text-red-600 border-red-200 hover:bg-red-50"
              >
                Clear Saved Spot
              </button>
            ` : ''}
          </div>
        </form>
      </div>
    </div>
  `;
}

export function initSpotSaverModal(container, { onClose, onSave }) {
  const modal = container.querySelector('[data-modal="spot-saver"]');
  if (!modal) return;

  const editing = !!getSavedSpot();
  const form = modal.querySelector('#spot-saver-form');
  const timerToggle = modal.querySelector('#timer-toggle');
  const timerOptions = modal.querySelector('#timer-options');
  const durationInput = modal.querySelector('#duration-input');
  const durationDisplay = modal.querySelector('#duration-display');

  timerToggle.addEventListener('change', () => {
    timerOptions.classList.toggle('hidden', !timerToggle.checked);
  });

  modal.querySelectorAll('[data-timer-adjust]').forEach(btn => {
    btn.addEventListener('click', () => {
      const adjust = parseInt(btn.dataset.timerAdjust, 10);
      let newVal = (parseInt(durationInput.value, 10) || 120) + adjust;
      newVal = Math.max(15, Math.min(720, newVal));
      newVal = Math.round(newVal / 15) * 15;
      durationInput.value = newVal;
      updateDurationDisplay();
    });
  });

  modal.querySelectorAll('[data-quick-duration]').forEach(btn => {
    btn.addEventListener('click', () => {
      const val = parseInt(btn.dataset.quickDuration, 10);
      durationInput.value = val;
      updateDurationDisplay();
      modal.querySelectorAll('[data-quick-duration]').forEach(b => {
        b.classList.toggle('filter-chip-active', parseInt(b.dataset.quickDuration, 10) === val);
      });
    });
  });

  durationInput.addEventListener('input', updateDurationDisplay);

  function updateDurationDisplay() {
    const val = parseInt(durationInput.value, 10) || 0;
    durationDisplay.textContent = formatDurationMinutes(val);
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData(form);
    const facilityId = formData.get('facilityId');
    const floor = formData.get('floor') || null;
    const row = formData.get('row') || null;
    const spot = formData.get('spot') || null;
    const notes = formData.get('notes') || '';
    const startTimer = timerToggle.checked;
    const durationMinutes = startTimer ? parseInt(durationInput.value, 10) : 0;

    const submitBtn = form.querySelector('button[type="submit"]');
    const errorEl = modal.querySelector('#spot-saver-error');
    if (errorEl) errorEl.classList.add('hidden');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Saving...';

    try {
      saveSpot({ facilityId, floor, row, spot, notes, startTimer, durationMinutes });
      vibrate([50, 50]);
      onSave();
    } catch (error) {
      submitBtn.disabled = false;
      submitBtn.textContent = editing ? 'Update Spot' : 'Save Spot';
      if (errorEl) {
        errorEl.textContent = error.message || 'Failed to save spot. Please try again.';
        errorEl.classList.remove('hidden');
      }
    }
  });

  const clearBtn = modal.querySelector('#clear-spot');
  if (clearBtn) {
    clearBtn.addEventListener('click', function () {
      clearSpot();
      vibrate([40, 40]);
      onSave();
    });
  }

  modal.querySelectorAll('[data-modal-close="spot-saver"]').forEach(btn => {
    btn.addEventListener('click', onClose);
  });

  modal.addEventListener('click', (e) => {
    if (e.target === modal) onClose();
  });
}