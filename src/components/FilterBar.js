/**
 * FilterBar Component - Sticky search and filter chips
 */

import { PERMIT_TYPES } from '../data/csuParkingData.js';
import { escapeHtml } from '../utils/helpers.js';

const PERMIT_OPTIONS = [
  { value: 'All', label: 'All Permits' },
  { value: PERMIT_TYPES.GREEN, label: 'Green' },
  { value: PERMIT_TYPES.WHITE, label: 'White' },
  { value: PERMIT_TYPES.EVENING, label: 'Evening' },
  { value: PERMIT_TYPES.NIGHT, label: 'Night' },
  { value: PERMIT_TYPES.ADA, label: 'ADA' },
  { value: PERMIT_TYPES.VISITOR, label: 'Visitor' },
];

export function FilterBar({ 
  selectedPermit, 
  onPermitChange, 
  showOpenOnly, 
  onOpenOnlyChange,
  searchQuery, 
  onSearchChange,
  currentView,
  onViewChange,
  facilityCount,
  totalCount,
  onSpotSaverClick,
  hasSavedSpot,
  savedSpotLabel,
}) {
  return `
    <div class="filter-bar sticky z-30 bg-white border-b border-gray-200">
      <div class="max-w-md mx-auto px-4 py-3">
        <div class="relative mb-3">
          <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          <input
            id="search-input"
            type="search"
            placeholder="Search garage, lot, or address..."
            value="${escapeHtml(searchQuery)}"
            class="input-field pl-10"
            aria-label="Search parking facilities"
          >
        </div>
        
        <div class="flex gap-2 overflow-x-auto pb-2 scrollbar-hide" role="group" aria-label="Filter by permit type">
          ${PERMIT_OPTIONS.map(opt => `
            <button
              type="button"
              data-permit="${opt.value}"
              class="filter-chip ${selectedPermit === opt.value ? 'filter-chip-active' : ''} whitespace-nowrap"
              aria-pressed="${selectedPermit === opt.value}"
            >
              ${escapeHtml(opt.label)}
            </button>
          `).join('')}
        </div>
        
        <div class="flex items-center justify-between mt-3 gap-2">
          <label class="flex items-center gap-2 cursor-pointer flex-shrink-0">
            <input
              id="open-only-toggle"
              type="checkbox"
              ${showOpenOnly ? 'checked' : ''}
              class="w-4 h-4 text-csu-green border-gray-300 rounded focus:ring-csu-green focus:ring-2"
              aria-label="Show open only"
            >
            <span class="text-sm font-medium text-gray-700">Open only</span>
          </label>
          <div class="flex items-center gap-2">
            <button
              type="button"
              id="spot-saver-btn"
              class="flex items-center gap-1.5 px-3 min-h-[36px] text-xs font-medium rounded-xl border border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
              aria-label="${hasSavedSpot ? 'Edit saved parking spot' : 'Save my parking spot'}"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
              </svg>
              <span class="max-[359px]:hidden">My Spot</span>
            </button>
            <div class="flex items-center gap-1 bg-gray-100 rounded-lg p-1" role="group" aria-label="Parking facility view">
              <button
                type="button"
                data-view="list"
                class="px-3 py-1.5 text-sm font-medium rounded-md ${currentView === 'list' ? 'bg-white text-csu-green shadow-sm' : 'text-gray-600 hover:text-gray-900'}"
                aria-pressed="${currentView === 'list'}"
                aria-label="List view"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
                </svg>
              </button>
              <button
                type="button"
                data-view="map"
                class="px-3 py-1.5 text-sm font-medium rounded-md ${currentView === 'map' ? 'bg-white text-csu-green shadow-sm' : 'text-gray-600 hover:text-gray-900'}"
                aria-pressed="${currentView === 'map'}"
                aria-label="Map view"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z"/>
                </svg>
              </button>
            </div>
          </div>
        </div>

        <div class="flex items-center justify-between gap-3 mt-2">
          <div class="flex items-center gap-1 flex-shrink-0">
            <p class="text-xs text-gray-500">
              Showing ${facilityCount} of ${totalCount} facilities
            </p>
            <button
              type="button"
              id="refresh-btn"
              class="p-1.5 rounded-lg text-gray-400 hover:text-csu-green hover:bg-csu-green/5"
              aria-label="Refresh availability"
              title="Refresh availability"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
              </svg>
            </button>
          </div>
          ${hasSavedSpot && savedSpotLabel ? `
            <p class="text-xs font-medium text-csu-green max-w-[60%] text-right leading-snug" title="${escapeHtml(savedSpotLabel)}">
              Saved: ${escapeHtml(savedSpotLabel)}
            </p>
          ` : ''}
        </div>
      </div>
    </div>
  `;
}
