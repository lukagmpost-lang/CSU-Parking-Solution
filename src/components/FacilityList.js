/**
 * FacilityList Component - List view of parking facilities
 */

import { STATUS_TYPES } from '../data/csuParkingData.js';
import { escapeHtml, formatNumber, openDirections } from '../utils/helpers.js';

const STATUS_LABELS = {
  [STATUS_TYPES.OPEN]: 'Available',
  [STATUS_TYPES.FILLING_FAST]: 'Filling Fast',
  [STATUS_TYPES.FULL]: 'Full',
  [STATUS_TYPES.CLOSED]: 'Closed',
};

const ACTION_ICONS = {
  navigate: '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 11l19-9-9 19-2-8-8-2z"/></svg>',
  report: '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>',
  reserve: '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"/></svg>',
};

const STATUS_ICONS = {
  [STATUS_TYPES.OPEN]: '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>',
  [STATUS_TYPES.FILLING_FAST]: '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>',
  [STATUS_TYPES.FULL]: '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m-2 2l-2 2m-2-2l2-2"/></svg>',
  [STATUS_TYPES.CLOSED]: '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>',
};

const STATUS_COLORS = {
  [STATUS_TYPES.OPEN]: 'emerald',
  [STATUS_TYPES.FILLING_FAST]: 'amber',
  [STATUS_TYPES.FULL]: 'crimson',
  [STATUS_TYPES.CLOSED]: 'gray',
};

const STATUS_TEXT_CLASSES = {
  emerald: 'text-emerald-600',
  amber: 'text-amber-600',
  crimson: 'text-red-600',
  gray: 'text-gray-500',
};

const PERMIT_BADGE_CLASSES = {
  Green: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  White: 'bg-gray-50 text-gray-700 border-gray-200',
  Evening: 'bg-amber-50 text-amber-700 border-amber-200',
  Night: 'bg-violet-50 text-violet-700 border-violet-200',
  ADA: 'bg-red-50 text-red-700 border-red-200',
  Visitor: 'bg-blue-50 text-blue-700 border-blue-200',
};

const FACILITY_TYPE_CLASSES = {
  Garage: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  'Surface Lot': 'bg-teal-50 text-teal-700 border-teal-200',
};

const FACILITY_TYPE_LABELS = {
  garage: 'Garage',
  surface: 'Surface Lot',
};

const PROGRESS_COLOR_CLASSES = {
  emerald: 'progress-emerald',
  amber: 'progress-amber',
  crimson: 'progress-crimson',
  gray: 'bg-gray-400',
};

export function FacilityList({ 
  facilities, 
  availabilityData, 
  activeReports,
  onDirectionsClick,
  onReportClick,
  onOpenFacility,
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
          const reports = activeReports[facility.id] || [];
          const latestReport = getLatestReportForFacility ? getLatestReportForFacility(facility.id) : null;
          const hasReports = reports.length > 0;

          let statusText, statusDetail, statusType, statusIcon, statusColor, canBook, reservationInfo;

          if (formatted) {
            if (formatted.type === 'garage') {
              const available = formatted.spacesAvailable;
              const total = formatted.maxCapacity;
              const pct = formatted.percentage;
              const bookable = Math.min(available, formatted.reservationsRemaining ?? 20);
              statusText = available + ' of ' + formatNumber(total) + ' spots open';
              statusDetail = pct + '% open';
              statusType = formatted.status === STATUS_TYPES.CLOSED
                ? STATUS_TYPES.CLOSED
                : available > 0 && pct >= 20
                  ? STATUS_TYPES.OPEN
                  : available > 0 ? STATUS_TYPES.FILLING_FAST : STATUS_TYPES.FULL;
              statusIcon = STATUS_ICONS[statusType];
              statusColor = STATUS_COLORS[statusType];
              canBook = formatted.status !== STATUS_TYPES.CLOSED && available > 0 && bookable > 0;
              reservationInfo = formatted.activeReservations
                ? formatted.activeReservations + ' reserved in app • ' + bookable + ' bookable'
                : bookable + ' spots bookable in app';
            } else {
              statusType = formatted.status;
              statusText = STATUS_LABELS[formatted.status] || formatted.status;
              statusDetail = formatted.reportCount
                ? formatted.reportCount + ' recent user report' + (formatted.reportCount > 1 ? 's' : '')
                : 'Based on user reports';
              statusIcon = STATUS_ICONS[formatted.status] || STATUS_ICONS[STATUS_TYPES.OPEN];
              statusColor = STATUS_COLORS[formatted.status] || 'emerald';
              const bookable = formatted.reservationsRemaining ?? Math.min(20, Math.floor(facility.maxCapacity * 0.8));
              canBook = formatted.status !== 'Full' && formatted.status !== 'Closed' && bookable > 0;
              reservationInfo = canBook ? bookable + ' spots bookable in app' : 'No reservations available right now';
            }
          } else {
            statusText = 'Loading...';
            statusDetail = '';
            statusType = STATUS_TYPES.OPEN;
            statusIcon = STATUS_ICONS[STATUS_TYPES.OPEN];
            statusColor = 'emerald';
            canBook = false;
            reservationInfo = 'Checking availability';
          }

          const hasClosure = reports.some(report => report.issueType === 'event_closure');
          if (hasClosure) {
            canBook = false;
            statusText = 'Closed';
            statusDetail = 'Active event closure report';
            statusIcon = STATUS_ICONS[STATUS_TYPES.CLOSED];
            statusColor = 'gray';
            reservationInfo = 'No reservations available right now';
          }
          const bookButtonLabel = !formatted ? 'Loading' : (hasClosure ? 'Closed' : (canBook ? 'Reserve' : 'Full'));

          const facilityTypeLabel = FACILITY_TYPE_LABELS[facility.type];
          const facilityTypeClass = FACILITY_TYPE_CLASSES[facilityTypeLabel];

          const actionBtnClass = 'action-btn flex items-center justify-center gap-1.5 px-2 py-2 text-xs font-medium rounded-xl border transition-all duration-200 whitespace-nowrap min-h-[44px]';
          const primaryBtnClass = actionBtnClass + ' bg-csu-green text-white border-csu-green hover:bg-csu-dark-forest active:bg-csu-dark-forest/90 disabled:opacity-50 disabled:cursor-not-allowed';
          const ghostBtnClass = actionBtnClass + ' bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400';
          const warningBtnClass = actionBtnClass + ' bg-white text-amber-600 border-amber-300 hover:bg-amber-50 hover:border-amber-400';

          let permitBadgesHtml = '';
          facility.permits.forEach(permit => {
            const badgeClass = PERMIT_BADGE_CLASSES[permit] || 'bg-gray-50 text-gray-700 border-gray-200';
            permitBadgesHtml += '<span class="px-2.5 py-1 text-xs font-medium rounded-xl ' + badgeClass + '">' + escapeHtml(permit) + '</span>';
          });

          let liveIndicatorHtml = '';
          if (formatted && formatted.isLive) {
            liveIndicatorHtml = '<span class="flex items-center gap-1 text-xs text-gray-500 font-medium whitespace-nowrap" title="Availability is simulated for this prototype"><span class="w-1.5 h-1.5 rounded-full bg-amber-400"></span>Estimated</span>';
          }

          let progressBarHtml = '';
          if (formatted && formatted.type === 'garage') {
            const progressClass = PROGRESS_COLOR_CLASSES[getStatusBadgeVariant(formatted.status)] || 'progress-emerald';
            progressBarHtml = '<div class="mt-2 progress-bar"><div class="progress-fill ' + progressClass + '" style="width: ' + formatted.percentage + '%"></div></div>';
            if (formatted.lastUpdated) {
              progressBarHtml += '<p class="text-xs text-gray-400 mt-1">Updated ' + formatTimeAgo(new Date(formatted.lastUpdated).getTime()) + '</p>';
            }
          }

          let reportWarningHtml = '';
          if (hasReports && latestReport) {
            reportWarningHtml = '<div class="mt-2 p-2 bg-amber-50 border border-amber-200 rounded-lg"><div class="flex items-start gap-2"><svg class="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg><div class="flex-1 min-w-0"><p class="text-xs font-medium text-amber-800">' + escapeHtml(latestReport.issueType.replace('_', ' ')) + '</p>' + (latestReport.note ? '<p class="text-xs text-amber-700 mt-0.5">' + escapeHtml(latestReport.note) + '</p>' : '') + '<p class="text-xs text-amber-600 mt-1">' + formatTimeAgo(latestReport.timestamp) + '</p></div></div></div>';
          }

          return `
            <article class="list-item facility-card-compact" data-facility="${facility.id}">
              <div class="flex flex-wrap items-center gap-2">
                <h3 class="text-base font-semibold text-gray-900">${escapeHtml(facility.name)}</h3>
                <span class="px-2 py-0.5 text-xs font-semibold rounded-full ${facilityTypeClass}">
                  ${escapeHtml(facilityTypeLabel)}
                </span>
              </div>
              <p class="text-sm text-gray-500 mt-1 leading-snug">${escapeHtml(facility.address)}</p>

              <div class="flex flex-wrap gap-1.5 mt-2.5">
                ${permitBadgesHtml}
              </div>

              <div class="mt-3 pt-3 border-t border-gray-100">
                <div class="flex items-center gap-2">
                  <span class="${STATUS_TEXT_CLASSES[statusColor] || 'text-gray-500'} flex-shrink-0">${statusIcon}</span>
                  <span class="text-sm font-medium text-gray-900 flex-1 min-w-0">${escapeHtml(statusText)}</span>
                  ${liveIndicatorHtml}
                </div>
                <p class="text-xs text-gray-500 mt-1">
                  ${statusDetail ? escapeHtml(statusDetail) + '<span class="text-gray-300 mx-1">•</span>' : ''}${escapeHtml(reservationInfo)}
                </p>
                ${progressBarHtml}
                ${reportWarningHtml}
              </div>

              <div class="grid grid-cols-3 gap-2 mt-3">
                <button type="button" data-directions="${facility.id}" class="${ghostBtnClass}" aria-label="Get directions to ${escapeHtml(facility.name)}">${ACTION_ICONS.navigate}<span>Navigate</span></button>
                <button type="button" data-report="${facility.id}" class="${warningBtnClass}" aria-label="Report issue at ${escapeHtml(facility.name)}">${ACTION_ICONS.report}<span>Report</span></button>
                <button type="button" data-open-facility="${facility.id}" class="${canBook ? primaryBtnClass : actionBtnClass + ' bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'}" ${!canBook ? 'disabled' : ''} aria-label="Reserve spot at ${escapeHtml(facility.name)}">${ACTION_ICONS.reserve}<span>${bookButtonLabel}</span></button>
              </div>
            </article>
          `;
        }).join('')}
      </div>
    </div>
  `;
}