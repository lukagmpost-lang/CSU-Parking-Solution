/**
 * FacilityList Component - List view of parking facilities
 */

import { STATUS_TYPES } from '../data/csuParkingData.js';
import { escapeHtml, formatNumber, openDirections } from '../utils/helpers.js';

const STATUS_LABELS = {
  [STATUS_TYPES.OPEN]: 'Open',
  [STATUS_TYPES.FILLING_FAST]: 'Filling Fast',
  [STATUS_TYPES.FULL]: 'Full',
  [STATUS_TYPES.CLOSED]: 'Closed',
};

export function FacilityList({ 
  facilities, 
  availabilityData, 
  activeReports,
  onDirectionsClick,
  onReportClick,
  onSaveSpotClick,
  formatAvailability,
  getStatusBadgeVariant,
  hasActiveReports,
  getLatestReportForFacility,
  formatTimeAgo,
}) {
  if (facilities.length === 0) {
    return `
      <div class="max-w-md mx-auto px-4 py-12">
        <div class="empty-state">
          <svg class="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          <h3 class="text-lg font-medium text-gray-900 mb-1">No facilities found</h3>
          <p class="text-gray-500">Try adjusting your filters or search terms</p>
        </div>
      </div>
    `;
  }
  
  return `
    <div class="max-w-md mx-auto">
      <div class="bg-white rounded-t-lg border border-gray-200 overflow-hidden">
        ${facilities.map(facility => {
          const avail = availabilityData[facility.id];
          const formatted = avail ? formatAvailability(avail) : null;
          const variant = formatted ? getStatusBadgeVariant(formatted.status) : 'gray';
          const reports = activeReports[facility.id] || [];
          const latestReport = getLatestReportForFacility ? getLatestReportForFacility(facility.id) : null;
          const hasReports = reports.length > 0;
          
          let statusText, statusDetail;
          if (formatted) {
            if (formatted.type === 'garage') {
              statusText = formatNumber(formatted.spacesAvailable) + ' / ' + formatNumber(formatted.maxCapacity) + ' spots';
              statusDetail = formatted.percentage + '% available';
            } else {
              statusText = STATUS_LABELS[formatted.status] || formatted.status;
              statusDetail = formatted.reportCount ? formatted.reportCount + ' report' + (formatted.reportCount > 1 ? 's' : '') : '';
            }
          } else {
            statusText = 'Loading...';
            statusDetail = '';
          }
          
          let badgeClass = 'status-badge status-badge-gray';
          if (variant === 'emerald') badgeClass = 'status-badge status-badge-emerald';
          else if (variant === 'amber') badgeClass = 'status-badge status-badge-amber';
          else if (variant === 'crimson') badgeClass = 'status-badge status-badge-crimson';
          
          const isGarage = facility.type === 'garage';
          
          return `
            <article class="list-item facility-card-compact" data-facility="${facility.id}">
              <div class="flex-1 min-w-0">
                <div class="flex items-start justify-between gap-3">
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2 mb-1">
                      <span class="text-sm font-semibold text-gray-900">${escapeHtml(facility.name)}</span>
                      <span class="${badgeClass}">${escapeHtml(facility.shortName)}</span>
                    </div>
                    <p class="text-sm text-gray-500 truncate">${escapeHtml(facility.address)}</p>
                  </div>
                  ${formatted && formatted.isLive ? `
                    <span class="flex items-center gap-1 text-xs text-emerald-600 font-medium whitespace-nowrap">
                      <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      Live
                    </span>
                  ` : ''}
                </div>
                
                <div class="flex flex-wrap gap-1.5 mt-2">
                  ${facility.permits.map(permit => `
                    <span class="px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-700">${escapeHtml(permit)}</span>
                  `).join('')}
                </div>
                
                <div class="mt-3">
                  <div class="flex items-center justify-between mb-1">
                    <span class="text-sm font-medium text-gray-900">${escapeHtml(statusText)}</span>
                    ${statusDetail ? '<span class="text-xs text-gray-500">' + escapeHtml(statusDetail) + '</span>' : ''}
                  </div>
                  ${formatted && formatted.type === 'garage' ? `
                    <div class="progress-bar">
                      <div class="progress-fill progress-${variant}" style="width: ${formatted.percentage}%"></div>
                    </div>
                    ${formatted.lastUpdated ? '<p class="text-xs text-gray-400 mt-1">Updated ' + formatTimeAgo(new Date(formatted.lastUpdated).getTime()) + '</p>' : ''}
                  ` : ''}
                </div>
                
                ${hasReports && latestReport ? `
                  <div class="mt-2 p-2 bg-amber-50 border border-amber-200 rounded-lg">
                    <div class="flex items-start gap-2">
                      <svg class="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                      </svg>
                      <div class="flex-1 min-w-0">
                        <p class="text-xs font-medium text-amber-800">${escapeHtml(latestReport.issueType.replace('_', ' '))}</p>
                        ${latestReport.note ? '<p class="text-xs text-amber-700 mt-0.5">' + escapeHtml(latestReport.note) + '</p>' : ''}
                        <p class="text-xs text-amber-600 mt-1">${formatTimeAgo(latestReport.timestamp)}</p>
                      </div>
                    </div>
                  </div>
                ` : ''}
              </div>
              
              <div class="flex flex-col items-end gap-2 ml-4">
                <button
                  type="button"
                  data-directions="${facility.id}"
                  class="btn-ghost text-xs px-3 py-1.5 whitespace-nowrap"
                  aria-label="Get directions to ${escapeHtml(facility.name)}"
                >
                  <svg class="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z"/>
                  </svg>
                  Directions
                </button>
                <button
                  type="button"
                  data-report="${facility.id}"
                  class="btn-ghost text-xs px-3 py-1.5 whitespace-nowrap text-amber-600 hover:bg-amber-50"
                  aria-label="Report issue at ${escapeHtml(facility.name)}"
                >
                  <svg class="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                  </svg>
                  Report
                </button>
                <button
                  type="button"
                  data-save-spot="${facility.id}"
                  class="btn-ghost text-xs px-3 py-1.5 whitespace-nowrap text-csu-green"
                  aria-label="Save parking spot at ${escapeHtml(facility.name)}"
                >
                  <svg class="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"/>
                  </svg>
                  Save Spot
                </button>
              </div>
            </article>
          `;
        }).join('')}
      </div>
    </div>
  `;
}
