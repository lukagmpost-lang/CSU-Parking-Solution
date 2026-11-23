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
}) {
  return `
    <div class="sticky top-16 z-30 bg-white border-b border-gray-200">
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
              role="tab"
            >
              ${escapeHtml(opt.label)}
            </button>
          `).join('')}
        </div>
        
        <div class="flex items-center justify-between mt-3">
          <div class="flex items-center gap-2">
            <label class="flex items-center gap-2 cursor-pointer">
              <input
                id="open-only-toggle"
                type="checkbox"
                ${showOpenOnly ? 'checked' : ''}
                class="w-4 h-4 text-csu-green border-gray-300 rounded focus:ring-csu-green focus:ring-2"
                aria-label="Show open only"
              >
              <span class="text-sm font-medium text-gray-700">Open only</span>
            </label>
          </div>
          <div class="flex items-center gap-1 bg-gray-100 rounded-lg p-1" role="tablist">
            <button
              type="button"
              data-view="list"
              class="px-3 py-1.5 text-sm font-medium rounded-md ${currentView === 'list' ? 'bg-white text-csu-green shadow-sm' : 'text-gray-600 hover:text-gray-900'}"
              role="tab"
              aria-selected="${currentView === 'list'}"
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
              role="tab"
              aria-selected="${currentView === 'map'}"
              aria-label="Map view"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z"/>
              </svg>
            </button>
          </div>
        </div>
        
        <p class="text-xs text-gray-500 mt-2 text-center">
          Showing ${facilityCount} of ${totalCount} facilities
        </p>
      </div>
    </div>
  `;
}
