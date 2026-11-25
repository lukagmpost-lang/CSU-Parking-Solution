/**
 * Main App Component - Orchestrates the application and page routing
 */

import { ALL_FACILITIES } from '../data/csuParkingData.js';
import {
  subscribeToAvailability,
  formatAvailability,
  getStatusBadgeVariant,
  triggerRefresh,
} from '../services/availabilityService.js';
import {
  subscribeToReports,
  hasActiveReports,
  getLatestReportForFacility,
  formatTimeAgo,
} from '../services/reportingService.js';
import { subscribeToSpot, getTimerStatus } from '../services/spotSaverService.js';
import {
  createBooking,
  getBookingByCode,
  getUserBooking,
  subscribeToBookings,
  extendBooking,
  cancelBooking,
} from '../services/bookingService.js';
import {
  escapeHtml,
  openDirections,
  vibrate,
  debounce,
  copyToClipboard,
} from '../utils/helpers.js';
import { Header } from './Header.js';
import { FilterBar } from './FilterBar.js';
import { FacilityList } from './FacilityList.js';
import { MapView } from './MapView.js';
import { PermitsModal } from './PermitsModal.js';
import { ReportModal, initReportModal } from './ReportModal.js';
import { SpotSaverModal, initSpotSaverModal } from './SpotSaverModal.js';
import { ReservationLookupModal, initReservationLookupModal } from './ReservationLookupModal.js';
import { BookingPage } from './BookingPage.js';
import { ConfirmationPage } from './ConfirmationPage.js';

let currentView = 'list';
let currentPage = 'home';
let lastRenderedPage = 'home';

let selectedPermit = 'All';
let showOpenOnly = false;
let searchQuery = '';
let filteredFacilities = [...ALL_FACILITIES];

let availabilityData = {};
let activeReports = {};
let savedSpot = null;

let permitsModalOpen = false;
let reportModalOpen = false;
let reportModalFacilityId = null;
let spotSaverModalOpen = false;
let spotSaverModalFacilityId = null;
let reservationLookupOpen = false;

let bookingPage = null;
let confirmationPage = null;
let bookingFacilityId = null;
let confirmationCode = null;

let isInputFocused = false;
let isModalOpen = false;
let modalReturnFocusSelector = null;
let lastModalType = null;

const debouncedFilter = debounce(applyFilters, 120);

document.addEventListener('keydown', function (event) {
  if (event.key !== 'Escape' || !isModalOpen) return;
  event.preventDefault();
  closeCurrentModal();
});

function captureModalTrigger() {
  const activeElement = document.activeElement;
  if (!activeElement || activeElement === document.body) {
    modalReturnFocusSelector = null;
    return;
  }

  if (activeElement.id) {
    modalReturnFocusSelector = '#' + activeElement.id;
    return;
  }

  const attributes = ['data-report', 'data-pin-toggle', 'data-open-facility'];
  const attribute = attributes.find(function (name) { return activeElement.hasAttribute(name); });
  modalReturnFocusSelector = attribute
    ? '[' + attribute + '="' + activeElement.getAttribute(attribute) + '"]'
    : null;
}

function restoreModalTrigger() {
  const selector = modalReturnFocusSelector;
  modalReturnFocusSelector = null;
  if (!selector) return;

  setTimeout(function () {
    const trigger = document.querySelector(selector);
    if (trigger && !trigger.disabled) trigger.focus();
  }, 0);
}

function closeCurrentModal() {
  if (permitsModalOpen) onPermitsModalToggle();
  else if (reportModalOpen) onReportModalClose();
  else if (spotSaverModalOpen) onSpotSaverModalClose();
  else if (reservationLookupOpen) onReservationLookupClose();
}

function canAutoRenderHome() {
  return currentPage === 'home' && !isModalOpen && !isInputFocused && !document.hidden;
}

function getSavedSpotLabel() {
  if (!savedSpot) return '';

  const facility = ALL_FACILITIES.find(function (item) {
    return item.id === savedSpot.facilityId;
  });

  const parts = [];
  if (facility) parts.push(facility.name);
  if (savedSpot.floor) parts.push('Level ' + savedSpot.floor);
  if (savedSpot.row) parts.push('Row ' + savedSpot.row);
  if (savedSpot.spot) parts.push('Spot ' + savedSpot.spot);
  if (savedSpot.timer) {
    const timer = getTimerStatus();
    if (timer) parts.push(timer.expired ? 'Timer expired' : timer.formatted + ' left');
  }

  return parts.join(' \u2022 ');
}

function showToast(message) {
  const toast = document.createElement('div');
  toast.textContent = message;
  toast.setAttribute('role', 'status');
  toast.className = 'fixed bottom-24 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-4 py-2.5 rounded-xl shadow-lg text-sm z-[60] animate-slide-up max-w-[80vw] text-center';
  document.body.appendChild(toast);
  setTimeout(function () {
    toast.remove();
  }, 2400);
}

function applyFilters(shouldRender = true) {
  let facilities = [...ALL_FACILITIES];

  if (searchQuery.trim()) {
    const query = searchQuery.toLowerCase().trim();
    facilities = facilities.filter(function (facility) {
      return facility.name.toLowerCase().includes(query) ||
        facility.shortName.toLowerCase().includes(query) ||
        facility.address.toLowerCase().includes(query) ||
        facility.text2ParkZone.toLowerCase().includes(query);
    });
  }

  if (selectedPermit !== 'All') {
    facilities = facilities.filter(function (facility) {
      return facility.permits.includes(selectedPermit);
    });
  }

  if (showOpenOnly) {
    facilities = facilities.filter(function (facility) {
      const availability = availabilityData[facility.id];
      const hasClosure = (activeReports[facility.id] || []).some(function (report) {
        return report.issueType === 'event_closure';
      });
      if (hasClosure || !availability) return false;
      if (availability.reservationsRemaining === 0) return false;
      if (availability.type === 'garage') return availability.spacesAvailable > 0 && availability.status !== 'Closed';
      return availability.status !== 'Full' && availability.status !== 'Closed';
    });
  }

  filteredFacilities = facilities;

  if (shouldRender && currentPage === 'home') render();
}

function onPermitChange(permit) {
  selectedPermit = permit;
  debouncedFilter();
}

function onOpenOnlyChange(value) {
  showOpenOnly = value;
  debouncedFilter();
}

function onSearchChange(query) {
  searchQuery = query;
  debouncedFilter();
}

function onViewChange(view) {
  currentView = view;
  render();
}

function onDirectionsClick(facility) {
  if (!facility || !facility.coordinates) return;
  vibrate([40]);
  openDirections(facility.coordinates.lat, facility.coordinates.lng, facility.name);
}

function onReportClick(facilityId) {
  vibrate([40]);
  captureModalTrigger();
  reportModalFacilityId = facilityId;
  reportModalOpen = true;
  render();
}

function onReportModalClose() {
  reportModalOpen = false;
  reportModalFacilityId = null;
  render();
  restoreModalTrigger();
}

function onPermitsModalToggle() {
  if (!permitsModalOpen) captureModalTrigger();
  permitsModalOpen = !permitsModalOpen;
  render();
  if (!permitsModalOpen) restoreModalTrigger();
}

function onSpotSaverClick() {
  vibrate([40]);
  captureModalTrigger();
  spotSaverModalFacilityId = savedSpot ? savedSpot.facilityId : null;
  spotSaverModalOpen = true;
  render();
}

function onSpotSaverModalClose() {
  spotSaverModalOpen = false;
  spotSaverModalFacilityId = null;
  render();
  restoreModalTrigger();
}

function onSpotSaved() {
  spotSaverModalOpen = false;
  spotSaverModalFacilityId = null;
  render();
  restoreModalTrigger();
}

async function onRefreshClick() {
  vibrate([40]);
  await triggerRefresh();
  if (currentPage === 'home') render();
}

function onReservationLookupClick() {
  vibrate([40]);
  captureModalTrigger();
  reservationLookupOpen = true;
  render();
}

function onReservationLookupClose() {
  reservationLookupOpen = false;
  render();
  restoreModalTrigger();
}

function onOpenReservationFromCode(code) {
  const booking = getBookingByCode(code);

  if (!booking) {
    showToast('Reservation not found');
    return;
  }

  reservationLookupOpen = false;
  confirmationCode = booking.code;
  currentPage = 'confirmation';
  render();
}

function onOpenFacility(facilityId) {
  vibrate([40]);
  bookingFacilityId = facilityId;
  currentPage = 'booking';
  render();
}

function onBookingBack() {
  currentPage = 'home';
  bookingFacilityId = null;
  bookingPage = null;
  render();
}

function onBookingSubmit(data) {
  if (!bookingFacilityId) return;

  const availability = availabilityData[bookingFacilityId];
  const reports = activeReports[bookingFacilityId] || [];
  let validationError = '';

  if (!availability) validationError = 'Availability is still loading. Please try again in a moment.';
  else if (reports.some(function (report) { return report.issueType === 'event_closure'; })) {
    validationError = 'This facility is closed due to an active event report.';
  }

  if (validationError) {
    if (bookingPage && bookingPage.setSubmitError) bookingPage.setSubmitError(validationError);
    return;
  }

  let result;
  try {
    result = createBooking({
      facilityId: bookingFacilityId,
      permitType: data.permitType,
      durationHours: data.durationHours,
      vehicleInfo: data.vehicleInfo,
      availability: availability,
    });
  } catch (error) {
    result = { success: false, error: 'Could not create the reservation. Please try again.' };
  }

  if (!result.success) {
    if (bookingPage && bookingPage.setSubmitError) {
      bookingPage.setSubmitError(result.error || 'Could not create reservation');
    } else {
      if (bookingPage) bookingPage.resetSubmit();
      showToast(result.error || 'Could not create reservation');
    }
    return;
  }

  vibrate([50, 50]);
  if (confirmationPage) confirmationPage.stopCountdown();
  confirmationPage = null;
  bookingPage = null;
  confirmationCode = result.booking.code;
  currentPage = 'confirmation';
  render();
}

function stopConfirmation() {
  if (confirmationPage) confirmationPage.stopCountdown();
  confirmationPage = null;
}

function onConfirmationBack() {
  stopConfirmation();
  confirmationCode = null;
  currentPage = 'home';
  render();
}

function onCopyCode() {
  const code = confirmationPage && confirmationPage.getBooking()
    ? confirmationPage.getBooking().code
    : confirmationCode;

  if (!code) return;

  copyToClipboard(code).then(function (copied) {
    showToast(copied ? 'Booking code copied' : 'Could not copy the code');
  });
}

function onConfirmationExtend(hours) {
  if (!confirmationCode) return;

  stopConfirmation();
  const result = extendBooking(confirmationCode, hours);

  if (!result.success) {
    showToast(result.error || 'Could not extend reservation');
    render();
    return;
  }

  vibrate([50, 50]);
  const costMessage = result.additionalCost > 0 ? ' for $' + result.additionalCost : ' at no extra charge';
  showToast('Added ' + hours + ' hour' + (hours === 1 ? '' : 's') + costMessage);
  render();
}

function onConfirmationCancel() {
  if (!confirmationCode) return;
  if (!window.confirm('Cancel this reservation?')) return;

  stopConfirmation();
  const result = cancelBooking(confirmationCode);

  if (!result.success) {
    showToast(result.error || 'Could not cancel reservation');
    render();
    return;
  }

  vibrate([80, 40, 80]);
  render();
}

function onConfirmationRebook() {
  const booking = confirmationCode ? getBookingByCode(confirmationCode) : null;

  stopConfirmation();

  if (!booking) {
    confirmationCode = null;
    currentPage = 'home';
    render();
    return;
  }

  bookingFacilityId = booking.facilityId;
  confirmationCode = null;
  currentPage = 'booking';
  render();
}

function onLookupAnother() {
  stopConfirmation();
  confirmationCode = null;
  modalReturnFocusSelector = '#reservation-lookup-btn';
  reservationLookupOpen = true;
  currentPage = 'home';
  render();
}

function onConfirmationDone() {
  onConfirmationBack();
}

function setupSubscriptions() {
  subscribeToAvailability(function (data) {
    availabilityData = data;
    if (currentPage === 'home') applyFilters(false);
    if (canAutoRenderHome()) render();
  });

  subscribeToReports(function (reports) {
    activeReports = {};
    reports.forEach(function (report) {
      if (!activeReports[report.facilityId]) activeReports[report.facilityId] = [];
      activeReports[report.facilityId].push(report);
    });
    if (currentPage === 'home') applyFilters(false);
    if (canAutoRenderHome()) render();
  });

  subscribeToSpot(function (spot) {
    savedSpot = spot;
    if (canAutoRenderHome()) render();
  });

  subscribeToBookings(function () {
    triggerRefresh();
    if (currentPage === 'confirmation' && confirmationPage) {
      confirmationPage.loadBooking();
    }
  });
}

function render() {
  isModalOpen = permitsModalOpen || reportModalOpen || spotSaverModalOpen || reservationLookupOpen;
  document.body.classList.toggle('modal-open', isModalOpen);

  const app = document.getElementById('app');
  const samePage = lastRenderedPage === currentPage;
  const scrollY = samePage ? window.scrollY : 0;

  const activeElement = document.activeElement;
  const restoreSearch = samePage && currentPage === 'home' && activeElement && activeElement.id === 'search-input';
  const caretPosition = restoreSearch ? activeElement.selectionStart : null;

  let pageContent = '';
  let pageHeader = '';

  if (currentPage === 'booking') {
    const facility = ALL_FACILITIES.find(function (item) {
      return item.id === bookingFacilityId;
    });

    if (!facility) {
      currentPage = 'home';
      bookingFacilityId = null;
      render();
      return;
    }

    bookingPage = BookingPage({
      facility: facility,
      onSubmit: onBookingSubmit,
    });

    pageContent = bookingPage.render();
    pageHeader =
      '<header class="sticky-header">' +
        '<div class="max-w-md mx-auto px-4">' +
          '<div class="flex items-center justify-between h-16">' +
            '<button type="button" class="btn-ghost p-2" data-action="back" aria-label="Back to parking">' +
              '<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>' +
            '</button>' +
            '<div class="flex-1 text-center min-w-0 px-2">' +
              '<h1 class="text-lg font-semibold text-gray-900">Reserve Spot</h1>' +
              '<p class="text-xs text-gray-500 truncate">' + escapeHtml(facility.name) + '</p>' +
            '</div>' +
            '<div class="w-10"></div>' +
          '</div>' +
        '</div>' +
      '</header>';
  } else if (currentPage === 'confirmation') {
    stopConfirmation();

    confirmationPage = ConfirmationPage({
      code: confirmationCode,
      onExpire: function (expiredCode) {
        if (currentPage !== 'confirmation' || confirmationCode !== expiredCode) return;
        stopConfirmation();
        triggerRefresh();
        render();
      },
    });
    confirmationPage.loadBooking();
    pageContent = confirmationPage.render();

    const booking = confirmationPage.getBooking();

    pageHeader =
      '<header class="sticky-header">' +
        '<div class="max-w-md mx-auto px-4">' +
          '<div class="flex items-center justify-between h-16">' +
            '<button type="button" class="btn-ghost p-2" data-action="confirmation-back" aria-label="Back to parking">' +
              '<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>' +
            '</button>' +
            '<div class="flex-1 text-center min-w-0 px-2">' +
              '<h1 class="text-lg font-semibold text-gray-900">Your Reservation</h1>' +
              '<p class="text-xs text-gray-500 truncate">' + escapeHtml(booking ? booking.facilityName : '') + '</p>' +
            '</div>' +
            '<div class="w-10" aria-hidden="true"></div>' +
          '</div>' +
        '</div>' +
      '</header>';
  } else {
    const header = Header({
      onPermitsClick: onPermitsModalToggle,
      onRefreshClick: onRefreshClick,
      permitsOpen: permitsModalOpen,
      onReservationLookupClick: onReservationLookupClick,
      hasSavedBooking: !!getUserBooking(),
    });

    const filterBar = FilterBar({
      selectedPermit: selectedPermit,
      onPermitChange: onPermitChange,
      showOpenOnly: showOpenOnly,
      onOpenOnlyChange: onOpenOnlyChange,
      searchQuery: searchQuery,
      onSearchChange: onSearchChange,
      currentView: currentView,
      onViewChange: onViewChange,
      facilityCount: filteredFacilities.length,
      totalCount: ALL_FACILITIES.length,
      onSpotSaverClick: onSpotSaverClick,
      hasSavedSpot: !!savedSpot,
      savedSpotLabel: getSavedSpotLabel(),
    });

    let mainContent;
    if (currentView === 'map') {
      mainContent = MapView({
        facilities: filteredFacilities,
        availabilityData: availabilityData,
        activeReports: activeReports,
      });
    } else {
      mainContent = FacilityList({
        facilities: filteredFacilities,
        availabilityData: availabilityData,
        activeReports: activeReports,
        formatAvailability: formatAvailability,
        getStatusBadgeVariant: getStatusBadgeVariant,
        hasActiveReports: function (id) { return hasActiveReports(id); },
        getLatestReportForFacility: getLatestReportForFacility,
        formatTimeAgo: formatTimeAgo,
      });
    }

    pageHeader = header + filterBar;
    pageContent = mainContent;
  }

  const modalHtml =
    (currentPage === 'home' && permitsModalOpen ? PermitsModal() : '') +
    (currentPage === 'home' && reportModalOpen ? ReportModal({
      facilityId: reportModalFacilityId,
      onClose: onReportModalClose,
      onSubmit: onReportModalClose,
    }) : '') +
    (currentPage === 'home' && spotSaverModalOpen ? SpotSaverModal({
      facilityId: spotSaverModalFacilityId,
      onClose: onSpotSaverModalClose,
      onSave: onSpotSaved,
    }) : '') +
    (currentPage === 'home' && reservationLookupOpen ? ReservationLookupModal() : '');

  app.innerHTML =
    '<div class="min-h-screen bg-gray-50 flex flex-col">' +
      pageHeader +
      '<main class="flex-1 px-4 pb-[calc(2.5rem+env(safe-area-inset-bottom,0px))]">' + pageContent + '</main>' +
      modalHtml +
    '</div>';

  if (isModalOpen) {
    app.querySelectorAll('header, main, .filter-bar').forEach(function (element) {
      element.inert = true;
      element.setAttribute('aria-hidden', 'true');
    });
  }

  attachEventListeners(app);

  if (currentPage === 'booking' && bookingPage) {
    const bookingContainer = app.querySelector('[data-booking-page]');
    if (bookingContainer) bookingPage.init(bookingContainer);
  }

  if (currentPage === 'confirmation' && confirmationPage) {
    confirmationPage.startCountdown();
    confirmationPage.initQR();
  }

  initModals(app);
  initModalAccessibility(app);

  if (restoreSearch) {
    const searchInput = app.querySelector('#search-input');
    if (searchInput) {
      searchInput.focus();
      if (caretPosition !== null && caretPosition !== undefined) {
        try {
          searchInput.setSelectionRange(caretPosition, caretPosition);
        } catch (error) {
          // Search inputs in some browsers do not support selection ranges.
        }
      }
    }
  }

  window.scrollTo(0, samePage ? scrollY : 0);
  lastRenderedPage = currentPage;
}

function initModals(app) {
  if (permitsModalOpen) {
    const permitsModal = app.querySelector('[data-modal="permits"]');
    if (permitsModal) {
      permitsModal.querySelectorAll('[data-modal-close="permits"]').forEach(function (button) {
        button.addEventListener('click', onPermitsModalToggle);
      });
      permitsModal.addEventListener('click', function (event) {
        if (event.target === permitsModal) onPermitsModalToggle();
      });
    }
  }

  if (reportModalOpen) {
    initReportModal(app, {
      onClose: onReportModalClose,
      onSubmit: onReportModalClose,
    });
  }

  if (spotSaverModalOpen) {
    initSpotSaverModal(app, {
      onClose: onSpotSaverModalClose,
      onSave: onSpotSaved,
    });
  }

  if (reservationLookupOpen) {
    initReservationLookupModal(app, {
      onClose: onReservationLookupClose,
      onOpenBooking: onOpenReservationFromCode,
    });
  }
}

function initModalAccessibility(app) {
  const modal = app.querySelector('.modal-overlay');
  const modalType = modal ? modal.dataset.modal : null;
  const isNewModal = modalType && modalType !== lastModalType;
  lastModalType = modalType;

  if (!modal) return;

  function getFocusableElements() {
    return Array.from(modal.querySelectorAll(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )).filter(function (element) {
      return element.getAttribute('aria-hidden') !== 'true' && element.getClientRects().length > 0;
    });
  }

  modal.addEventListener('keydown', function (event) {
    if (event.key !== 'Tab') return;

    const focusableElements = getFocusableElements();
    if (focusableElements.length === 0) {
      event.preventDefault();
      return;
    }

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (event.shiftKey && document.activeElement === firstElement) {
      event.preventDefault();
      lastElement.focus();
    } else if (!event.shiftKey && document.activeElement === lastElement) {
      event.preventDefault();
      firstElement.focus();
    }
  });

  if (isNewModal) {
    setTimeout(function () {
      if (!modal.isConnected) return;
      const initialFocus = modal.querySelector('[data-initial-focus]') || getFocusableElements()[0];
      if (initialFocus) initialFocus.focus();
    }, 0);
  }
}

function attachEventListeners(app) {
  if (currentPage === 'home') {
    const permitsButton = app.querySelector('#permits-btn');
    if (permitsButton) permitsButton.addEventListener('click', onPermitsModalToggle);

    const refreshButton = app.querySelector('#refresh-btn');
    if (refreshButton) refreshButton.addEventListener('click', onRefreshClick);

    const lookupButton = app.querySelector('#reservation-lookup-btn');
    if (lookupButton) lookupButton.addEventListener('click', onReservationLookupClick);

    const spotButton = app.querySelector('#spot-saver-btn');
    if (spotButton) spotButton.addEventListener('click', onSpotSaverClick);

    app.querySelectorAll('[data-permit]').forEach(function (button) {
      button.addEventListener('click', function () {
        onPermitChange(button.dataset.permit);
      });
    });

    const openOnlyToggle = app.querySelector('#open-only-toggle');
    if (openOnlyToggle) {
      openOnlyToggle.addEventListener('change', function (event) {
        onOpenOnlyChange(event.target.checked);
      });
    }

    const searchInput = app.querySelector('#search-input');
    if (searchInput) {
      searchInput.addEventListener('input', function (event) {
        onSearchChange(event.target.value);
      });
      searchInput.addEventListener('focus', function () {
        isInputFocused = true;
      });
      searchInput.addEventListener('blur', function () {
        isInputFocused = false;
      });
    }

    app.querySelectorAll('[data-view]').forEach(function (button) {
      button.addEventListener('click', function () {
        onViewChange(button.dataset.view);
      });
    });

    const mapContainer = app.querySelector('#map-container');
    if (mapContainer) {
      function closePinTooltips() {
        app.querySelectorAll('.map-pin.pin-open').forEach(function (pin) {
          pin.classList.remove('pin-open');
          const toggle = pin.querySelector('[data-pin-toggle]');
          if (toggle) toggle.setAttribute('aria-expanded', 'false');
        });
      }

      app.querySelectorAll('[data-pin-toggle]').forEach(function (button) {
        button.addEventListener('click', function (event) {
          event.stopPropagation();
          const pin = button.closest('.map-pin');
          if (!pin) return;

          const wasOpen = pin.classList.contains('pin-open');
          closePinTooltips();

          if (!wasOpen) {
            pin.classList.add('pin-open');
            button.setAttribute('aria-expanded', 'true');
          }
        });
      });

      mapContainer.addEventListener('click', function (event) {
        if (event.target === mapContainer) closePinTooltips();
      });

      mapContainer.addEventListener('keydown', function (event) {
        if (event.key === 'Escape') closePinTooltips();
      });
    }

    app.querySelectorAll('[data-directions]').forEach(function (button) {
      button.addEventListener('click', function (event) {
        event.stopPropagation();
        const facility = ALL_FACILITIES.find(function (item) {
          return item.id === button.dataset.directions;
        });
        if (facility) onDirectionsClick(facility);
      });
    });

    app.querySelectorAll('[data-report]').forEach(function (button) {
      button.addEventListener('click', function (event) {
        event.stopPropagation();
        onReportClick(button.dataset.report);
      });
    });

    app.querySelectorAll('[data-open-facility]').forEach(function (button) {
      button.addEventListener('click', function (event) {
        event.stopPropagation();
        onOpenFacility(button.dataset.openFacility);
      });
    });
  }

  if (currentPage === 'booking') {
    app.querySelectorAll('[data-action="back"]').forEach(function (button) {
      button.addEventListener('click', onBookingBack);
    });
  }

  if (currentPage === 'confirmation') {
    app.querySelectorAll('[data-action="confirmation-back"]').forEach(function (button) {
      button.addEventListener('click', onConfirmationBack);
    });

    const copyButton = app.querySelector('[data-action="copy-code"]');
    if (copyButton) copyButton.addEventListener('click', onCopyCode);

    app.querySelectorAll('[data-action="extend"]').forEach(function (button) {
      button.addEventListener('click', function () {
        onConfirmationExtend(parseInt(button.dataset.hours, 10));
      });
    });

    const cancelButton = app.querySelector('[data-action="cancel-booking"]');
    if (cancelButton) cancelButton.addEventListener('click', onConfirmationCancel);

    const rebookButton = app.querySelector('[data-action="rebook"]');
    if (rebookButton) rebookButton.addEventListener('click', onConfirmationRebook);

    const doneButton = app.querySelector('[data-action="done"]');
    if (doneButton) doneButton.addEventListener('click', onConfirmationDone);

    const lookupAgainButton = app.querySelector('[data-action="lookup-again"]');
    if (lookupAgainButton) lookupAgainButton.addEventListener('click', onLookupAnother);
  }
}

export function renderApp() {
  const shortcutParams = new URLSearchParams(window.location.search);
  if (shortcutParams.get('report') === 'true') reportModalOpen = true;
  else if (shortcutParams.get('save-spot') === 'true') spotSaverModalOpen = true;

  if (reportModalOpen || spotSaverModalOpen) {
    window.history.replaceState({}, document.title, window.location.pathname + window.location.hash);
  }

  setupSubscriptions();
  applyFilters();

  setInterval(function () {
    if (savedSpot?.timer && canAutoRenderHome()) render();
  }, 30000);
}
