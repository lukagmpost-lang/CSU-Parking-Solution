/**
 * BookingPage Component - Reserve a parking spot
 */

import { escapeHtml } from '../utils/helpers.js';
import { PERMIT_TYPES, PERMIT_PRICING, PERMIT_RULES } from '../data/csuParkingData.js';
import { calculatePrice, validatePermitForFacility } from '../services/bookingService.js';

const DURATIONS = [1, 2, 4, 8, 12, 24];

export function BookingPage({ facility, onSubmit }) {
  let selectedDuration = 4;
  let selectedPermit = PERMIT_TYPES.VISITOR;
  let vehicleInfo = '';
  let isSubmitting = false;
  let container = null;

  function getRules(permitType) {
    return PERMIT_RULES[permitType] || null;
  }

  function isPermitCompatible(permitType) {
    const rules = getRules(permitType);
    if (!rules) return false;
    if (rules.validFacilities === 'all') return true;
    if (rules.validFacilities === 'garages') return facility.type === 'garage';
    if (rules.validFacilities === 'surface') return facility.type === 'surface';
    return false;
  }

  function getPermitWarnings(permitType) {
    if (!getRules(permitType)) return ['This permit is not recognized'];

    const validation = validatePermitForFacility(permitType, facility, selectedDuration);
    return validation.valid ? [] : [validation.reason];
  }

  function getPrice(hours) {
    return calculatePrice(facility, selectedPermit, hours);
  }

  function getRateLabel() {
    if (selectedPermit === PERMIT_TYPES.VISITOR) {
      return '$' + (facility.hourlyRate || (facility.type === 'garage' ? 4 : 3)) + '/hr';
    }
    return 'Prepaid';
  }

  function getPermitPricingNote() {
    const pricing = PERMIT_PRICING[selectedPermit];
    if (!pricing || selectedPermit === PERMIT_TYPES.VISITOR) {
      const dailyMax = facility.dailyMax || (facility.type === 'garage' ? 24 : 18);
      return 'Estimated visitor parking is capped at $' + dailyMax + ' per day. Pay on-site; no online payment is collected.';
    }
    if (pricing.price === 0) {
      return pricing.name + ' — no charge with a valid placard.';
    }
    return pricing.name + ' costs $' + pricing.price + ' per ' + pricing.period + ', already prepaid. $0 is due on-site.';
  }

  function getWarningsHtml() {
    const warnings = getPermitWarnings(selectedPermit);
    if (warnings.length === 0) return '';

    let html = '<div class="p-3 bg-amber-50 border border-amber-200 rounded-xl">';
    html += '<div class="flex items-start gap-2">';
    html += '<svg class="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>';
    html += '<div class="flex-1 min-w-0">';
    warnings.forEach(function (warning) {
      html += '<p class="text-xs text-amber-800">' + escapeHtml(warning) + '</p>';
    });
    html += '</div></div></div>';
    return html;
  }

  function getPermitButtonsHtml() {
    let html = '';

    Object.entries(PERMIT_TYPES).forEach(function (pair) {
      const name = pair[1];
      if (!facility.permits.includes(name)) return;

      const rules = getRules(name);
      const pricing = PERMIT_PRICING[name];
      const isSelected = selectedPermit === name;
      const compatible = isPermitCompatible(name);

      const btnClass = 'permit-btn px-3 py-3 rounded-xl border-2 text-left transition-all duration-200 ' +
        (isSelected ? 'border-csu-green bg-csu-green/5 text-csu-green' : 'border-gray-200 hover:border-gray-300') +
        (!compatible ? ' opacity-60' : '');

      let priceLine = '';
      if (pricing && pricing.price !== undefined) {
        priceLine = pricing.price === 0 ? '$0' : '$' + pricing.price + '/' + pricing.period;
      } else if (pricing && pricing.priceRange) {
        priceLine = pricing.priceRange;
      }

      html += '<button type="button" class="' + btnClass + '" data-permit="' + escapeHtml(name) + '" aria-pressed="' + isSelected + '">';
      html += '<p class="font-semibold text-sm">' + escapeHtml(name) + '</p>';
      html += '<p class="text-xs text-gray-500 mt-1">' + escapeHtml(rules ? rules.description : '') + '</p>';
      if (priceLine) {
        html += '<p class="text-xs font-medium mt-1 ' + (isSelected ? 'text-csu-green' : 'text-gray-700') + '">' + escapeHtml(priceLine) + '</p>';
      }
      html += '</button>';
    });

    return html;
  }

  function getDurationButtonsHtml() {
    let html = '';

    DURATIONS.forEach(function (hours) {
      const isSelected = selectedDuration === hours;
      const price = getPrice(hours);
      const priceLabel = selectedPermit === PERMIT_TYPES.VISITOR ? '$' + price : 'Covered';
      const label = hours === 1 ? '1 Hour' : hours === 24 ? '24 Hours' : hours + ' Hours';

      html += '<button type="button" class="duration-btn px-3 py-3 rounded-xl border-2 text-center transition-all duration-200 ' +
        (isSelected ? 'border-csu-green bg-csu-green/5 text-csu-green' : 'border-gray-200 hover:border-gray-300') +
        '" data-duration="' + hours + '" aria-pressed="' + isSelected + '">';
      html += '<p class="font-semibold text-sm">' + label + '</p>';
      html += '<p class="text-xs text-gray-500 mt-1">' + priceLabel + '</p>';
      html += '</button>';
    });

    return html;
  }

  function render() {
    return '<form class="max-w-md mx-auto py-4" data-booking-page id="booking-form" novalidate>' +
      '<div class="facility-card mb-4">' +
        '<div class="flex items-center gap-3 mb-4">' +
          '<div class="w-12 h-12 bg-csu-green/10 rounded-xl flex items-center justify-center flex-shrink-0">' +
            '<svg class="w-6 h-6 text-csu-green" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"/></svg>' +
          '</div>' +
          '<div class="min-w-0">' +
            '<h2 class="font-semibold text-gray-900">' + escapeHtml(facility.name) + '</h2>' +
            '<p class="text-sm text-gray-500">' + escapeHtml(facility.address) + '</p>' +
          '</div>' +
        '</div>' +
        '<div class="grid grid-cols-3 gap-3 text-center">' +
          '<div class="p-3 bg-gray-50 rounded-xl">' +
            '<p class="text-2xl font-bold text-csu-green">$<span id="price-display">' + getPrice(selectedDuration) + '</span></p>' +
            '<p class="text-xs text-gray-500 mt-1">Estimated cost</p>' +
          '</div>' +
          '<div class="p-3 bg-gray-50 rounded-xl">' +
            '<p class="text-2xl font-bold text-gray-900" id="duration-display">' + selectedDuration + 'h</p>' +
            '<p class="text-xs text-gray-500 mt-1">Duration</p>' +
          '</div>' +
          '<div class="p-3 bg-gray-50 rounded-xl">' +
            '<p class="text-lg font-bold text-gray-900 leading-8" id="rate-display">' + getRateLabel() + '</p>' +
            '<p class="text-xs text-gray-500 mt-1">Rate</p>' +
          '</div>' +
        '</div>' +
      '</div>' +

      '<div class="facility-card mb-4">' +
        '<h3 class="font-semibold text-gray-900 mb-3">Duration</h3>' +
        '<div class="grid grid-cols-3 gap-2" id="duration-buttons">' + getDurationButtonsHtml() + '</div>' +
      '</div>' +

      '<div class="facility-card mb-4">' +
        '<h3 class="font-semibold text-gray-900 mb-3">Permit Type</h3>' +
        '<div id="permit-warning" class="mb-3">' + getWarningsHtml() + '</div>' +
        '<div class="grid grid-cols-2 gap-2" id="permit-buttons">' + getPermitButtonsHtml() + '</div>' +
        '<p id="permit-note" class="text-xs text-gray-500 mt-3">' + escapeHtml(getPermitPricingNote()) + '</p>' +
      '</div>' +

      '<div class="facility-card mb-4">' +
        '<h3 class="font-semibold text-gray-900 mb-3" id="vehicle-label">Vehicle Info <span class="font-normal text-gray-400">(optional)</span></h3>' +
        '<input type="text" id="vehicle-input" aria-labelledby="vehicle-label" placeholder="License plate, color, make/model" value="' + escapeHtml(vehicleInfo) + '" class="input-field" maxlength="50">' +
        '<p class="text-xs text-gray-500 mt-2">Helps enforcement identify your vehicle.</p>' +
      '</div>' +

      '<p id="booking-error" class="text-sm text-red-600 mb-3 hidden" role="alert"></p>' +
      '<button type="submit" id="confirm-booking" class="btn-primary w-full">' +
        'Reserve Spot' +
      '</button>' +
    '</form>';
  }

  function updateUI() {
    if (!container) return;

    const warnings = getPermitWarnings(selectedPermit);
    const canSubmit = warnings.length === 0 && !isSubmitting;
    const price = getPrice(selectedDuration);

    container.querySelectorAll('#duration-buttons button').forEach(function (btn) {
      const hours = parseInt(btn.dataset.duration, 10);
      const isSelected = hours === selectedDuration;
      btn.className = 'duration-btn px-3 py-3 rounded-xl border-2 text-center transition-all duration-200 ' +
        (isSelected ? 'border-csu-green bg-csu-green/5 text-csu-green' : 'border-gray-200 hover:border-gray-300');
      btn.setAttribute('aria-pressed', String(isSelected));
      const priceEl = btn.querySelector('p:last-child');
      if (priceEl) priceEl.textContent = selectedPermit === PERMIT_TYPES.VISITOR ? '$' + getPrice(hours) : 'Covered';
    });

    container.querySelectorAll('#permit-buttons button').forEach(function (btn) {
      const name = btn.dataset.permit;
      const isSelected = name === selectedPermit;
      const compatible = isPermitCompatible(name);
      btn.className = 'permit-btn px-3 py-3 rounded-xl border-2 text-left transition-all duration-200 ' +
        (isSelected ? 'border-csu-green bg-csu-green/5 text-csu-green' : 'border-gray-200 hover:border-gray-300') +
        (!compatible ? ' opacity-60' : '');
      btn.setAttribute('aria-pressed', String(isSelected));

      const priceEl = btn.querySelector('p:last-child');
      if (priceEl) priceEl.className = 'text-xs font-medium mt-1 ' + (isSelected ? 'text-csu-green' : 'text-gray-700');
    });

    const priceDisplay = container.querySelector('#price-display');
    const durationDisplay = container.querySelector('#duration-display');
    const rateDisplay = container.querySelector('#rate-display');
    const warningDisplay = container.querySelector('#permit-warning');
    const noteDisplay = container.querySelector('#permit-note');
    const submitBtn = container.querySelector('#confirm-booking');

    if (priceDisplay) priceDisplay.textContent = String(price);
    if (durationDisplay) durationDisplay.textContent = selectedDuration + 'h';
    if (rateDisplay) rateDisplay.textContent = getRateLabel();
    if (warningDisplay) warningDisplay.innerHTML = getWarningsHtml();
    if (noteDisplay) noteDisplay.textContent = getPermitPricingNote();

    if (submitBtn) {
      submitBtn.disabled = !canSubmit;
      submitBtn.textContent = isSubmitting
        ? 'Reserving...'
        : selectedPermit === PERMIT_TYPES.VISITOR
          ? 'Reserve Spot • $' + price + ' on-site'
          : 'Reserve Spot ($0 on-site)';
    }
  }

  function clearSubmitError() {
    if (!container) return;
    const errorEl = container.querySelector('#booking-error');
    if (errorEl) {
      errorEl.textContent = '';
      errorEl.classList.add('hidden');
    }
  }

  function setSubmitError(message) {
    isSubmitting = false;
    updateUI();
    if (!container) return;
    const errorEl = container.querySelector('#booking-error');
    if (errorEl) {
      errorEl.textContent = message;
      errorEl.classList.remove('hidden');
      errorEl.setAttribute('tabindex', '-1');
      errorEl.focus();
    }
  }

  function init(el) {
    container = el;

    container.querySelectorAll('#duration-buttons button').forEach(function (btn) {
      btn.addEventListener('click', function () {
        selectedDuration = parseInt(btn.dataset.duration, 10);
        clearSubmitError();
        updateUI();
      });
    });

    container.querySelectorAll('#permit-buttons button').forEach(function (btn) {
      btn.addEventListener('click', function () {
        selectedPermit = btn.dataset.permit;
        clearSubmitError();
        updateUI();
      });
    });

    const vehicleInput = container.querySelector('#vehicle-input');
    if (vehicleInput) {
      vehicleInput.addEventListener('input', function () {
        vehicleInfo = vehicleInput.value;
        clearSubmitError();
      });
    }

    container.addEventListener('submit', function (event) {
      event.preventDefault();
      if (isSubmitting) return;
      if (getPermitWarnings(selectedPermit).length > 0) return;

      const input = container.querySelector('#vehicle-input');
      vehicleInfo = input ? input.value : '';

      clearSubmitError();
      isSubmitting = true;
      updateUI();

      onSubmit({
        durationHours: selectedDuration,
        permitType: selectedPermit,
        vehicleInfo: vehicleInfo,
      });
    });

    updateUI();
  }

  function resetSubmit() {
    isSubmitting = false;
    updateUI();
  }

  return {
    render: render,
    init: init,
    resetSubmit: resetSubmit,
    setSubmitError: setSubmitError,
  };
}
