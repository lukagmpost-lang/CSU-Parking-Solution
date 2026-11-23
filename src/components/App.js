/**
 * Main App Component - Orchestrates the entire application
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
import { SpotSaverBar } from './SpotSaverBar.js';
import { SpotSaverModal } from './SpotSaverModal.js';

let currentView = 'list';
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
  render();
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

function setupSubscriptions() {
  subscribeToAvailability((data) => {
    availabilityData = data;
    render();
  });
  
  subscribeToReports((reports) => {
    activeReports = {};
    reports.forEach(report => {
      if (!activeReports[report.facilityId]) {
        activeReports[report.facilityId] = [];
      }
      activeReports[report.facilityId].push(report);
    });
    render();
  });
  
  subscribeToSpot((spot) => {
    savedSpot = spot;
    render();
  });
}

function render() {
  const app = document.getElementById('app');
  
  const header = Header({
    onPermitsClick: onPermitsModalToggle,
    onRefreshClick,
    permitsOpen: permitsModalOpen,
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
      onSaveSpotClick,
    });
  } else {
    mainContent = FacilityList({
      facilities: filteredFacilities,
      availabilityData,
      activeReports,
      onDirectionsClick,
      onReportClick,
      onSaveSpotClick,
      formatAvailability,
      getStatusBadgeVariant,
      hasActiveReports: (id) => hasActiveReports(id),
      getLatestReportForFacility,
      formatTimeAgo,
    });
  }
  
  const bottomBar = SpotSaverBar({
    savedSpot: savedSpot ? formatSpot(savedSpot, (id) => ALL_FACILITIES.find(f => f.id === id)) : null,
    onClearSpot,
    getTimerStatus,
    getDirectionsUrl,
  });
  
  app.innerHTML = `
    <div class="min-h-screen bg-gray-50 flex flex-col">
      ${header}
      ${filterBar}
      <main class="flex-1 overflow-auto pb-24">
        ${mainContent}
      </main>
      ${bottomBar}
      ${permitsModalOpen ? PermitsModal({ onClose: onPermitsModalToggle }) : ''}
      ${reportModalOpen ? ReportModal({ 
        facilityId: reportModalFacilityId,
        onClose: onReportModalClose,
        onSubmit: () => { onReportModalClose(); },
      }) : ''}
      ${spotSaverModalOpen ? SpotSaverModal({ 
        facilityId: spotSaverModalFacilityId,
        onClose: onSpotSaverModalClose,
        onSave: onSpotSaved,
      }) : ''}
    </div>
  `;
  
  attachEventListeners();
}

function attachEventListeners() {
  const permitsBtn = document.getElementById('permits-btn');
  if (permitsBtn) {
    permitsBtn.onclick = onPermitsModalToggle;
  }
  
  const refreshBtn = document.getElementById('refresh-btn');
  if (refreshBtn) {
    refreshBtn.onclick = onRefreshClick;
  }
  
  document.querySelectorAll('[data-permit]').forEach(btn => {
    btn.onclick = () => onPermitChange(btn.dataset.permit);
  });
  
  const openOnlyToggle = document.getElementById('open-only-toggle');
  if (openOnlyToggle) {
    openOnlyToggle.onchange = (e) => onOpenOnlyChange(e.target.checked);
  }
  
  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    searchInput.oninput = (e) => onSearchChange(e.target.value);
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
  
  document.querySelectorAll('[data-save-spot]').forEach(btn => {
    btn.onclick = () => onSaveSpotClick(btn.dataset.saveSpot);
  });
  
  const clearSpotBtn = document.getElementById('clear-spot-btn');
  if (clearSpotBtn) {
    clearSpotBtn.onclick = onClearSpot;
  }
  
  document.querySelectorAll('[data-modal-close]').forEach(btn => {
    btn.onclick = () => {
      const modal = btn.dataset.modalClose;
      if (modal === 'permits') onPermitsModalToggle();
      else if (modal === 'report') onReportModalClose();
      else if (modal === 'spot-saver') onSpotSaverModalClose();
    };
  });
  
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.onclick = (e) => {
      if (e.target === overlay) {
        const modal = overlay.dataset.modal;
        if (modal === 'permits') onPermitsModalToggle();
        else if (modal === 'report') onReportModalClose();
        else if (modal === 'spot-saver') onSpotSaverModalClose();
      }
    };
  });
}

export function renderApp() {
  setupSubscriptions();
  applyFilters();
  render();
}
