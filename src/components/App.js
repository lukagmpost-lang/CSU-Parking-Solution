/**
 * Main App Component - Orchestrates the entire application with routing
 */

import { ALL_FACILITIES, GATED_GARAGES, SURFACE_LOTS, PERMIT_TYPES, PERMIT_COLORS } from '../data/csuParkingData.js';
import { 
  getAllAvailability, 
  subscribeToAvailability, 
  formatAvailability, 
  getStatusBadgeVariant,
  triggerRefresh 
} from '../services/availabilityService.js';
import { 
  subscribeToReports, 
  getActiveReportsForFacility, 
  hasActiveReports,
  getLatestReportForFacility,
  formatTimeAgo,
  isInCooldown,
  getCooldownRemaining
} from '../services/reportingService.js';
import { 
  subscribeToSpot, 
  getSavedSpot, 
  formatSpot, 
  clearSpot,
  getTimerStatus,
  getDirectionsUrl 
} from '../services/spotSaverService.js';
import { 
  createBooking,
  getBookingByCode,
  getUserBooking,
  subscribeToBookings,
  extendBooking,
  cancelBooking
} from '../services/bookingService.js';
import { 
  escapeHtml, 
  formatNumber, 
  openDirections,
  vibrate,
  debounce 
} from '../utils/helpers.js';
import { Header } from './Header.js';
import { FilterBar } from './FilterBar.js';
import { FacilityList } from './FacilityList.js';
import { MapView } from './MapView.js';
import { PermitsModal } from './PermitsModal.js';
import { ReportModal } from './ReportModal.js';
import { SpotSaverModal } from './SpotSaverModal.js';
import { ReservationLookupModal } from './ReservationLookupModal.js';
import { BookingPage } from './BookingPage.js';
import { ConfirmationPage } from './ConfirmationPage.js';

let currentView = 'list';
let currentPage = 'home';
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

const debouncedFilter = debounce(applyFilters, 100);

function applyFilters() {
  let facilities = [...ALL_FACILITIES];
  
  if (searchQuery.trim()) {
    const query = searchQuery.toLowerCase().trim();
    facilities = facilities.filter(f => 
      f.name.toLowerCase().includes(query) ||
      f.shortName.toLowerCase().includes(query) ||
      f.address.toLowerCase().includes(query) ||
      f.text2ParkZone.toLowerCase().includes(query)
    );
  }
  
  if (selectedPermit !== 'All') {
    facilities = facilities.filter(f => f.permits.includes(selectedPermit));
  }
  
  if (showOpenOnly) {
    facilities = facilities.filter(f => {
      const avail = availabilityData[f.id];
      if (!avail) return true;
      if (avail.type === 'garage') {
        return avail.spacesAvailable > 0;
      } else {
        return avail.status !== 'Full' && avail.status !== 'Closed';
      }
    });
  }
  
  filteredFacilities = facilities;
  if (currentPage === 'home') {
    render();
  }
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
  vibrate([50]);
  openDirections(facility.coordinates.lat, facility.coordinates.lng, facility.name);
}

function onReportClick(facilityId) {
  vibrate([50]);
  reportModalFacilityId = facilityId;
  reportModalOpen = true;
  render();
}

function onReportModalClose() {
  reportModalOpen = false;
  reportModalFacilityId = null;
  render();
}

function onReportModalSubmit() {
  onReportModalClose();
}

function onPermitsModalToggle() {
  permitsModalOpen = !permitsModalOpen;
  render();
}

function onSaveSpotClick(facilityId) {
  vibrate([50]);
  spotSaverModalFacilityId = facilityId;
  spotSaverModalOpen = true;
  render();
}

function onSpotSaverModalClose() {
  spotSaverModalOpen = false;
  spotSaverModalFacilityId = null;
  render();
}

function onSpotSaved() {
  spotSaverModalOpen = false;
  spotSaverModalFacilityId = null;
  render();
}

function onClearSpot() {
  clearSpot();
  render();
}

async function onRefreshClick() {
  vibrate([50]);
  await triggerRefresh();
}

function onReservationLookupClick() {
  vibrate([50]);
  reservationLookupOpen = true;
  render();
}

function onReservationLookupClose() {
  reservationLookupOpen = false;
  render();
}

function onOpenReservationFromCode(code) {
  reservationLookupOpen = false;
  confirmationCode = code.toUpperCase().trim();
  currentPage = 'confirmation';
  render();
}

// Booking flow handlers
function onOpenFacility(facilityId) {
  vibrate([50]);
  bookingFacilityId = facilityId;
  currentPage = 'booking';
  render();
}

function onBookingBack() {
  currentPage = 'home';
  bookingFacilityId = null;
  if (bookingPage) bookingPage = null;
  render();
}

async function onBookingSubmit(data) {
  if (!bookingFacilityId) return;
  
  const result = createBooking({
    facilityId: bookingFacilityId,
    permitType: data.permitType,
    durationHours: data.durationHours,
    vehicleInfo: data.vehicleInfo
  });
  
  if (result.success) {
    vibrate([50, 50]);
    confirmationCode = result.booking.code;
    currentPage = 'confirmation';
    render();
  } else {
    alert(result.error || 'Failed to create booking');
  }
}

function onConfirmationBack() {
  currentPage = 'home';
  confirmationCode = null;
  if (confirmationPage) {
    confirmationPage.stopCountdown();
    confirmationPage = null;
  }
  render();
}

function onConfirmationHome() {
  currentPage = 'home';
  confirmationCode = null;
  if (confirmationPage) {
    confirmationPage.stopCountdown();
    confirmationPage = null;
  }
  render();
}

function onConfirmationExtend(hours) {
  if (!confirmationCode) return;
  const result = extendBooking(confirmationCode, hours);
  if (result.success) {
    vibrate([50, 50]);
    confirmationCode = result.booking.code;
    if (confirmationPage) {
      confirmationPage.stopCountdown();
    }
    render();
  } else {
    alert(result.error || 'Failed to extend booking');
  }
}

function onConfirmationCancel() {
  if (!confirmationCode) return;
  if (confirm('Cancel this reservation?')) {
    const result = cancelBooking(confirmationCode);
    if (result.success) {
      vibrate([50, 50, 50]);
      currentPage = 'home';
      confirmationCode = null;
      if (confirmationPage) {
        confirmationPage.stopCountdown();
        confirmationPage = null;
      }
      render();
    }
  }
}

function onConfirmationRebook() {
  if (!confirmationCode) return;
  const booking = getBookingByCode(confirmationCode);
  if (booking) {
    bookingFacilityId = booking.facilityId;
    currentPage = 'booking';
    confirmationCode = null;
    if (confirmationPage) {
      confirmationPage.stopCountdown();
      confirmationPage = null;
    }
    render();
  }
}

function setupSubscriptions() {
  // Availability subscription - only re-render home page
  subscribeToAvailability((data) => {
    availabilityData = data;
    if (currentPage === 'home' && !isInputFocused && !isModalOpen) {
      render();
    }
  });
  
  subscribeToReports((reports) => {
    activeReports = {};
    reports.forEach(report => {
      if (!activeReports[report.facilityId]) {
        activeReports[report.facilityId] = [];
      }
      activeReports[report.facilityId].push(report);
    });
    if (currentPage === 'home' && !isInputFocused && !isModalOpen) {
      render();
    }
  });
  
  subscribeToSpot((spot) => {
    savedSpot = spot;
    if (currentPage === 'home' && !isInputFocused && !isModalOpen) {
      render();
    }
  });
  
  // Booking subscription - don't auto-render, we handle it explicitly
  subscribeToBookings(() => {
    if (currentPage === 'confirmation' && confirmationPage) {
      // Reload booking data but don't full re-render
      confirmationPage.loadBooking();
      if (confirmationPage.getBooking()) {
        // Update UI elements directly instead of full render
        const booking = confirmationPage.getBooking();
        const timeEl = document.getElementById('time-remaining');
        if (timeEl) timeEl.textContent = formatTimeAgo(booking.expiresAt);
      }
    }
  });
}

function render() {
  const app = document.getElementById('app');
  
  let pageContent = '';
  let pageHeader = '';
  
  if (currentPage === 'booking') {
    const facility = ALL_FACILITIES.find(f => f.id === bookingFacilityId);
    if (facility) {
      bookingPage = BookingPage({
        facility,
        onBack: onBookingBack,
        onSubmit: onBookingSubmit
      });
      pageContent = bookingPage.render();
      pageHeader = `
        <header class="sticky-header">
          <div class="max-w-md mx-auto px-4">
            <div class="flex items-center justify-between h-16">
              <button type="button" class="btn-ghost p-2" data-action="back" aria-label="Back">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
              </button>
              <div class="flex-1 text-center">
                <h1 class="text-lg font-semibold text-gray-900">Reserve Spot</h1>
                <p class="text-xs text-gray-500">${escapeHtml(facility.name)}</p>
              </div>
              <div class="w-10"></div>
            </div>
          </div>
        </header>
      `;
    } else {
      currentPage = 'home';
      bookingFacilityId = null;
    }
  } else if (currentPage === 'confirmation') {
    confirmationPage = ConfirmationPage({
      code: confirmationCode,
      onBack: onConfirmationBack,
      onHome: onConfirmationHome
    });
    if (confirmationPage.loadBooking()) {
      confirmationPage.startCountdown();
      setTimeout(() => confirmationPage.initQR(), 100);
    }
    pageContent = confirmationPage.render();
    pageHeader = `
      <header class="sticky-header">
        <div class="max-w-md mx-auto px-4">
          <div class="flex items-center justify-between h-16">
            <button type="button" class="btn-ghost p-2" data-action="confirmation-back" aria-label="Back">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
            </button>
            <div class="flex-1 text-center">
              <h1 class="text-lg font-semibold text-gray-900">Your Reservation</h1>
              <p class="text-xs text-gray-500">${confirmationPage.getBooking()?.facilityName || ''}</p>
            </div>
            <button type="button" class="btn-ghost p-2" data-action="confirmation-home" aria-label="Home">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 011-1v4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
            </button>
          </div>
        </div>
      </header>
    `;
  } else {
    // Home page
    const header = Header({
      onPermitsClick: onPermitsModalToggle,
      onRefreshClick,
      permitsOpen: permitsModalOpen,
      onReservationLookupClick,
      hasSavedBooking: !!getUserBooking(),
    });
    
    const filterBar = FilterBar({
      selectedPermit,
      onPermitChange,
      showOpenOnly,
      onOpenOnlyChange,
      searchQuery,
      onSearchChange,
      currentView,
      onViewChange,
      facilityCount: filteredFacilities.length,
      totalCount: ALL_FACILITIES.length,
    });
    
    let mainContent;
    if (currentView === 'map') {
      mainContent = MapView({
        facilities: filteredFacilities,
        availabilityData,
        activeReports,
        onDirectionsClick,
        onReportClick,
        onOpenFacility,
      });
    } else {
      mainContent = FacilityList({
        facilities: filteredFacilities,
        availabilityData,
        activeReports,
        onDirectionsClick,
        onReportClick,
        onOpenFacility,
        formatAvailability,
        getStatusBadgeVariant,
        hasActiveReports: (id) => hasActiveReports(id),
        getLatestReportForFacility,
        formatTimeAgo,
      });
    }
    
    pageHeader = header + filterBar;
    pageContent = mainContent;
  }
  
  isModalOpen = permitsModalOpen || reportModalOpen || spotSaverModalOpen || reservationLookupOpen;
  
  app.innerHTML = `
    <div class="min-h-screen bg-gray-50 flex flex-col">
      ${pageHeader}
      <main class="flex-1 overflow-auto ${currentPage === 'home' ? 'pb-24' : 'pb-8 px-4'}">
        ${pageContent}
      </main>
      ${currentPage === 'home' && permitsModalOpen ? PermitsModal({ onClose: onPermitsModalToggle }) : ''}
      ${currentPage === 'home' && reportModalOpen ? ReportModal({ 
        facilityId: reportModalFacilityId,
        onClose: onReportModalClose,
        onSubmit: onReportModalSubmit,
      }) : ''}
      ${currentPage === 'home' && spotSaverModalOpen ? SpotSaverModal({ 
        facilityId: spotSaverModalFacilityId,
        onClose: onSpotSaverModalClose,
        onSave: onSpotSaved,
      }) : ''}
      ${currentPage === 'home' && reservationLookupOpen ? ReservationLookupModal({ 
        onClose: onReservationLookupClose,
        onOpenBooking: onOpenReservationFromCode,
      }) : ''}
    </div>
  `;
  
  attachEventListeners();
  
  if (currentPage === 'booking' && bookingPage) {
    const container = document.querySelector('[data-booking-page]');
    if (container) bookingPage.init(container);
  }
  
  if (currentPage === 'confirmation' && confirmationPage) {
    setTimeout(() => confirmationPage.initQR(), 100);
  }
  
  // Initialize modals
  if (reportModalOpen) {
    const container = document.querySelector('[data-modal="report"]');
    if (container) {
      import('./ReportModal.js').then(module => {
        module.initReportModal(container, {
          onClose: onReportModalClose,
          onSubmit: onReportModalSubmit,
        });
      });
    }
  }
  
  if (spotSaverModalOpen) {
    const container = document.querySelector('[data-modal="spot-saver"]');
    if (container) {
      import('./SpotSaverModal.js').then(module => {
        module.initSpotSaverModal(container, {
          onClose: onSpotSaverModalClose,
          onSave: onSpotSaved,
        });
      });
    }
  }
}

function attachEventListeners() {
  if (currentPage === 'home') {
    const permitsBtn = document.getElementById('permits-btn');
    if (permitsBtn) permitsBtn.onclick = onPermitsModalToggle;
    
    const refreshBtn = document.getElementById('refresh-btn');
    if (refreshBtn) refreshBtn.onclick = onRefreshClick;
    
    const lookupBtn = document.getElementById('reservation-lookup-btn');
    if (lookupBtn) lookupBtn.onclick = onReservationLookupClick;
    
    document.querySelectorAll('[data-permit]').forEach(btn => {
      btn.onclick = () => onPermitChange(btn.dataset.permit);
    });
    
    const openOnlyToggle = document.getElementById('open-only-toggle');
    if (openOnlyToggle) openOnlyToggle.onchange = (e) => onOpenOnlyChange(e.target.checked);
    
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
      searchInput.oninput = (e) => onSearchChange(e.target.value);
      searchInput.onfocus = () => { isInputFocused = true; };
      searchInput.onblur = () => { isInputFocused = false; };
    }
    
    document.querySelectorAll('[data-view]').forEach(btn => {
      btn.onclick = () => onViewChange(btn.dataset.view);
    });
    
    document.querySelectorAll('[data-directions]').forEach(btn => {
      btn.onclick = () => {
        const facilityId = btn.dataset.directions;
        const facility = ALL_FACILITIES.find(f => f.id === facilityId);
        if (facility) onDirectionsClick(facility);
      };
    });
    
    document.querySelectorAll('[data-report]').forEach(btn => {
      btn.onclick = () => onReportClick(btn.dataset.report);
    });
    
    document.querySelectorAll('[data-open-facility]').forEach(btn => {
      btn.onclick = () => onOpenFacility(btn.dataset.openFacility);
    });
    
    const clearSpotBtn = document.getElementById('clear-spot-btn');
    if (clearSpotBtn) clearSpotBtn.onclick = onClearSpot;
    
    document.querySelectorAll('[data-modal-close]').forEach(btn => {
      btn.onclick = () => {
        const modal = btn.dataset.modalClose;
        if (modal === 'permits') onPermitsModalToggle();
        else if (modal === 'report') onReportModalClose();
        else if (modal === 'spot-saver') onSpotSaverModalClose();
        else if (modal === 'reservation-lookup') onReservationLookupClose();
      };
    });
    
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
      overlay.onclick = (e) => {
        if (e.target === overlay) {
          const modal = overlay.dataset.modal;
          if (modal === 'permits') onPermitsModalToggle();
          else if (modal === 'report') onReportModalClose();
          else if (modal === 'spot-saver') onSpotSaverModalClose();
          else if (modal === 'reservation-lookup') onReservationLookupClose();
        }
      };
    });
  }
  
  if (currentPage === 'booking') {
    document.querySelectorAll('[data-action="back"]').forEach(btn => {
      btn.onclick = onBookingBack;
    });
  }
  
  if (currentPage === 'confirmation') {
    document.querySelectorAll('[data-action="confirmation-back"]').forEach(btn => {
      btn.onclick = onConfirmationBack;
    });
    document.querySelectorAll('[data-action="confirmation-home"]').forEach(btn => {
      btn.onclick = onConfirmationHome;
    });
    
    window.addEventListener('confirmation-extend', (e) => onConfirmationExtend(e.detail), { once: true });
    window.addEventListener('confirmation-cancel', onConfirmationCancel, { once: true });
    window.addEventListener('confirmation-rebook', onConfirmationRebook, { once: true });
    
    window.addEventListener('beforeunload', () => {
      if (confirmationPage) confirmationPage.stopCountdown();
    }, { once: true });
  }
}

export function renderApp() {
  setupSubscriptions();
  applyFilters();
  render();
}