/**
 * BookingPage Component - Reserve a parking spot
 */

import { escapeHtml, formatDuration, formatTimeRemaining } from '../utils/helpers.js';
import { PERMIT_TYPES, PERMIT_PRICING, PERMIT_RULES } from '../data/csuParkingData.js';
import { validatePermitForFacility, calculatePrice } from '../services/bookingService.js';

export function BookingPage({ facility, onBack, onSubmit }) {
  let selectedDuration = 4;
  let selectedPermit = PERMIT_TYPES.VISITOR;
  let vehicleInfo = '';
  let isSubmitting = false;

  function getPermitWarning(permitType, facility) {
    const rules = PERMIT_RULES[permitType];
    if (!rules) return null;

    const warnings = [];

    if (rules.validFacilities === 'garages' && facility.type === 'surface') {
      warnings.push(rules.name + ' not valid for surface lots');
    }
    if (rules.validFacilities === 'surface' && facility.type === 'garage') {
      warnings.push(rules.name + ' only valid for surface lots');
    }

    if (rules.timeRestriction) {
      const now = new Date();
      const currentHour = now.getHours() + now.getMinutes() / 60;
      if (currentHour < rules.timeRestriction.start) {
        const startHour = Math.floor(rules.timeRestriction.start);
        const startMin = Math.round((rules.timeRestriction.start % 1) * 60);
        let startStr = startHour + ':' + startMin.toString().padStart(2, '0') + ' ' + (startHour >= 12 ? 'PM' : 'AM');
        startStr = startStr.replace('00 PM', 'PM').replace('00 AM', 'AM');
        warnings.push(rules.name + ' only valid after ' + startStr);
      }
    }

    return warnings.length > 0 ? warnings : null;
  }

  function isPermitCompatible(permitType, facility) {
    const rules = PERMIT_RULES[permitType];
    if (!rules) return false;
    if (rules.validFacilities === 'all') return true;
    if (rules.validFacilities === 'garages' && facility.type === 'garage') return true;
    if (rules.validFacilities === 'surface' && facility.type === 'surface') return true;
    return false;
  }

  function getPrice(hours) {
    return calculatePrice(facility, selectedPermit, hours);
  }

  function render() {
    const hourlyRate = facility.hourlyRate || (facility.type === 'garage' ? 4 : 3);
    const dailyMax = facility.dailyMax || (facility.type === 'garage' ? 24 : 18);
    const currentPrice = getPrice(selectedDuration);
    const permitWarnings = getPermitWarning(selectedPermit, facility);
    const permitRules = PERMIT_RULES[selectedPermit];

    let warningHtml = '';
    if (permitWarnings) {
      warningHtml = '<div class="mb-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">';
      warningHtml += '<div class="flex items-start gap-2">';
      warningHtml += '<svg class="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>';
      warningHtml += '<div class="flex-1 min-w-0">';
      permitWarnings.forEach(function(w) {
        warningHtml += '<p class="text-xs text-amber-800">' + escapeHtml(w) + '</p>';
      });
      warningHtml += '</div></div></div>';
    }

    let permitButtonsHtml = '';
    Object.entries(PERMIT_TYPES).filter(function(pair) {
      return facility.permits.includes(PERMIT_TYPES[pair[0]]);
    }).forEach(function(pair) {
      var key = pair[0];
      var value = pair[1];
      var rules = PERMIT_RULES[key];
      var isSelected = selectedPermit === PERMIT_TYPES[key];
      var compatible = isPermitCompatible(PERMIT_TYPES[key], facility);

      var btnClass = 'permit-btn px-3 py-3 rounded-xl border-2 text-center transition-all duration-200 ' +
        (isSelected ? 'border-csu-green bg-csu-green/5 text-csu-green' : 'border-gray-200 hover:border-gray-300') +
        (!compatible ? ' opacity-50 cursor-not-allowed' : '');

      var disabledAttr = !compatible ? 'disabled' : '';

      permitButtonsHtml += '<button type="button" class="' + btnClass + '" data-permit="' + PERMIT_TYPES[key] + '" ' + disabledAttr + ' title="' + escapeHtml(rules.description) + '">';
      permitButtonsHtml += '<p class="font-medium text-sm">' + value + '</p>';
      permitButtonsHtml += '<p class="text-xs text-gray-500 mt-0.5">' + escapeHtml(rules.description) + '</p>';
      permitButtonsHtml += '</button>';
    });

    let durationButtonsHtml = '';
    [1, 2, 4, 8, 12, 24].forEach(function(hours) {
      var isSelected = selectedDuration === hours;
      var price = getPrice(hours);
      var label = hours === 1 ? '1 Hour' : hours === 24 ? '24 Hours' : hours + ' Hours';
      durationButtonsHtml += '<button type="button" class="duration-btn px-3 py-3 rounded-xl border-2 text-center transition-all duration-200 ' + (isSelected ? 'border-csu-green bg-csu-green/5 text-csu-green' : 'border-gray-200 hover:border-gray-300') + '" data-duration="' + hours + '">';
      durationButtonsHtml += '<p class="font-medium text-sm">' + label + '</p>';
      durationButtonsHtml += '<p class="text-xs text-gray-500 mt-0.5">$' + price + '</p>';
      durationButtonsHtml += '</button>';
    });

    return '<div class="min-h-screen bg-gray-50 flex flex-col" data-booking-page>' +
      '<main class="flex-1 overflow-auto pb-24 max-w-md mx-auto w-full px-4 py-4">' +
        '<div class="facility-card mb-4">' +
          '<div class="flex items-center gap-3 mb-3">' +
            '<div class="w-12 h-12 bg-csu-green/10 rounded-xl flex items-center justify-center">' +
              '<svg class="w-6 h-6 text-csu-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">' +
                '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"/>' +
              '</svg>' +
            '</div>' +
            '<div>' +
              '<h2 class="font-semibold text-gray-900">' + escapeHtml(facility.name) + '</h2>' +
              '<p class="text-sm text-gray-500">' + escapeHtml(facility.address) + '</p>' +
            '</div>' +
          '</div>' +
          '<div class="grid grid-cols-3 gap-3 text-center">' +
            '<div class="p-3 bg-gray-50 rounded-xl">' +
              '<p class="text-2xl font-bold text-csu-green" id="price-display">' + currentPrice + '</p>' +
              '<p class="text-xs text-gray-500">Total</p>' +
            '</div>' +
            '<div class="p-3 bg-gray-50 rounded-xl">' +
              '<p class="text-2xl font-bold text-gray-900" id="duration-display">' + selectedDuration + 'h</p>' +
              '<p class="text-xs text-gray-500">Duration</p>' +
            '</div>' +
            '<div class="p-3 bg-gray-50 rounded-xl">' +
              '<p class="text-2xl font-bold text-gray-900" id="rate-display">$' + hourlyRate + '/hr</p>' +
              '<p class="text-xs text-gray-500">Rate</p>' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<div class="facility-card mb-4">' +
          '<h3 class="font-semibold text-gray-900 mb-3">Duration</h3>' +
          '<div class="grid grid-cols-3 gap-2" id="duration-buttons">' +
            durationButtonsHtml +
          '</div>' +
        '</div>' +
        '<div class="facility-card mb-4">' +
          '<h3 class="font-semibold text-gray-900 mb-3">Permit Type</h3>' +
          warningHtml +
          '<div class="grid grid-cols-2 gap-2" id="permit-buttons">' +
            permitButtonsHtml +
          '</div>' +
          (permitRules && permitRules.description ? '<p class="text-xs text-gray-500 mt-2 text-center">' + escapeHtml(permitRules.description) + '</p>' : '') +
        '</div>' +
        '<div class="facility-card mb-4">' +
          '<h3 class="font-semibold text-gray-900 mb-3">Vehicle Info (Optional)</h3>' +
          '<input type="text" id="vehicle-input" placeholder="License plate, color, make/model" value="" class="input-field" maxlength="50">' +
          '<p class="text-xs text-gray-500 mt-2">Helps enforcement identify your vehicle</p>' +
        '</div>' +
        '<div class="mx-4 mb-6">' +
          '<button type="button" id="confirm-booking" class="btn-primary w-full" ' + (isPermitCompatible(selectedPermit, facility) ? '' : 'disabled') + '>' +
            (selectedPermit === PERMIT_TYPES.VISITOR ? 'Reserve Spot for $' + currentPrice : 'Reserve Spot (Permit Holder)') +
          '</button>' +
        '</div>' +
      '</main>' +
    '</div>';
  }

  function init(container) {
    var self = this;

    function updateUI() {
      container.querySelectorAll('#duration-buttons button').forEach(function(btn) {
        var hours = parseInt(btn.dataset.duration, 10);
        var isSelected = hours === selectedDuration;
        btn.className = 'duration-btn px-3 py-3 rounded-xl border-2 text-center transition-all duration-200 ' + (isSelected ? 'border-csu-green bg-csu-green/5 text-csu-green' : 'border-gray-200 hover:border-gray-300');
      });

      container.querySelectorAll('#permit-buttons button').forEach(function(btn) {
        var isSelected = btn.dataset.permit === selectedPermit;
        var compatible = isPermitCompatible(btn.dataset.permit, facility);
        btn.className = 'permit-btn px-3 py-3 rounded-xl border-2 text-center transition-all duration-200 ' + (isSelected ? 'border-csu-green bg-csu-green/5 text-csu-green' : 'border-gray-200 hover:border-gray-300') + (!compatible ? ' opacity-50 cursor-not-allowed' : '');
      });

      var priceDisplay = container.querySelector('#price-display');
      var durationDisplay = container.querySelector('#duration-display');
      var submitBtn = container.querySelector('#confirm-booking');

      if (priceDisplay) priceDisplay.textContent = getPrice(selectedDuration);
      if (durationDisplay) durationDisplay.textContent = selectedDuration + 'h';
      if (submitBtn) {
        submitBtn.textContent = (selectedPermit === PERMIT_TYPES.VISITOR ? 'Reserve Spot for $' + getPrice(selectedDuration) : 'Reserve Spot (Permit Holder)');
        submitBtn.disabled = !isPermitCompatible(selectedPermit, facility) || isSubmitting;
      }
    }

    container.querySelectorAll('#duration-buttons button').forEach(function(btn) {
      btn.addEventListener('click', function() {
        selectedDuration = parseInt(btn.dataset.duration, 10);
        updateUI();
      });
    });

    container.querySelectorAll('#permit-buttons button').forEach(function(btn) {
      if (!btn.disabled) {
        btn.addEventListener('click', function() {
          selectedPermit = btn.dataset.permit;
          updateUI();
        });
      }
    });

    var submitBtn = container.querySelector('#confirm-booking');
    if (submitBtn) {
      submitBtn.addEventListener('click', function() {
        if (isSubmitting) return;
        var vehicleInput = container.querySelector('#vehicle-input');
        vehicleInfo = vehicleInput ? vehicleInput.value : '';

        isSubmitting = true;
        submitBtn.disabled = true;
        submitBtn.textContent = 'Reserving...';

        onSubmit({
          durationHours: selectedDuration,
          permitType: selectedPermit,
          vehicleInfo: vehicleInfo
        });
      });
    }

    var backBtn = container.querySelector('[data-action="back"]');
    if (backBtn) {
      backBtn.addEventListener('click', function() {
        window.dispatchEvent(new CustomEvent('booking-back'));
      });
    }

    updateUI();
  }

  return {
    render: render,
    init: init
  };
}