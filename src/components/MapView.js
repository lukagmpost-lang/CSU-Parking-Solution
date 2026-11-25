/**
 * MapView Component - Interactive campus map with facility pins
 */

import { ALL_FACILITIES, STATUS_TYPES } from '../data/csuParkingData.js';
import { escapeHtml } from '../utils/helpers.js';

const PIN_MIN_X = 13;
const PIN_MIN_Y = 10;

export function MapView({
  facilities,
  availabilityData,
  activeReports,
}) {
  const pinPositions = calculatePinPositions(ALL_FACILITIES);

  return `
    <div class="max-w-md mx-auto py-4">
      <div class="flex flex-wrap items-center gap-x-3 gap-y-1.5 px-3 py-2 bg-white rounded-xl border border-gray-200 mb-2 text-[11px] text-gray-600">
        <span class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>Open</span>
        <span class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-amber-500"></span>Filling Fast</span>
        <span class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-red-500"></span>Full</span>
        <span class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-gray-400"></span>Unknown</span>
        <span class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-white border-2 border-amber-500"></span>Has Reports</span>
      </div>

      <div id="map-container" class="relative h-[440px] rounded-2xl border border-gray-200 overflow-hidden bg-[#EDF2EE]">
        ${facilities.length === 0 ? `
          <div class="absolute inset-0 z-20 flex items-center justify-center p-8 text-center bg-[#EDF2EE]">
            <div>
              <p class="font-medium text-gray-900">No facilities found</p>
              <p class="text-sm text-gray-500 mt-1">Try adjusting your filters or search terms.</p>
            </div>
          </div>
        ` : ''}
        <svg class="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 400 500" preserveAspectRatio="none" aria-hidden="true">
          <rect width="400" height="500" fill="#EDF2EE"></rect>
          <g fill="#E2EBE4">
            <rect x="18" y="18" width="74" height="104" rx="10"></rect>
            <rect x="142" y="18" width="126" height="104" rx="10"></rect>
            <rect x="326" y="18" width="58" height="104" rx="10"></rect>
            <rect x="18" y="186" width="74" height="140" rx="10"></rect>
            <rect x="142" y="186" width="126" height="140" rx="10"></rect>
            <rect x="326" y="186" width="58" height="140" rx="10"></rect>
            <rect x="18" y="396" width="74" height="86" rx="10"></rect>
            <rect x="142" y="396" width="126" height="86" rx="10"></rect>
            <rect x="326" y="396" width="58" height="86" rx="10"></rect>
          </g>
          <g stroke="#D9E2DB" stroke-width="28" fill="none">
            <path d="M-20 156 H420"></path>
            <path d="M-20 360 H420"></path>
            <path d="M119 -20 V520"></path>
            <path d="M300 -20 V520"></path>
          </g>
          <g stroke="#FFFFFF" stroke-width="16" fill="none">
            <path d="M-20 156 H420"></path>
            <path d="M-20 360 H420"></path>
            <path d="M119 -20 V520"></path>
            <path d="M300 -20 V520"></path>
          </g>
          <g fill="#A8B6AB" font-size="9" font-weight="600" font-family="Inter, sans-serif">
            <text x="206" y="149" text-anchor="middle">Euclid Ave</text>
            <text x="206" y="353" text-anchor="middle">Chester Ave</text>
            <text x="112" y="255" transform="rotate(-90 112 255)" text-anchor="middle">E 21st St</text>
            <text x="293" y="255" transform="rotate(-90 293 255)" text-anchor="middle">E 24th St</text>
          </g>
        </svg>

        <div class="absolute inset-0 pointer-events-none" id="pins-overlay">
          ${facilities.map((facility, index) => {
            const pos = pinPositions.get(facility.id) || { x: 50, y: 50 };
            const availability = availabilityData[facility.id];
            const pinStatus = getPinStatus(availability);
            const reports = activeReports[facility.id] || [];
            let canBook = availability
              ? availability.reservationsRemaining !== 0 && (availability.type === 'garage'
                ? availability.spacesAvailable > 0 && availability.status !== STATUS_TYPES.CLOSED
                : availability.status !== 'Full' && availability.status !== 'Closed')
              : false;
            const hasClosure = reports.some(report => report.issueType === 'event_closure');
            if (hasClosure) {
              canBook = false;
              pinStatus.variant = 'gray';
              pinStatus.text = 'Closed';
              pinStatus.textClass = 'text-gray-500';
            }
            const bookButtonLabel = !availability ? 'Loading' : (hasClosure ? 'Closed' : (canBook ? 'Reserve' : 'Full'));

            const verticalClass = pos.y < 32 ? ' tooltip-below' : '';
            const horizontalClass = pos.x < 24 ? ' tooltip-left' : (pos.x > 76 ? ' tooltip-right' : '');

            return `
              <div class="map-pin${verticalClass}${horizontalClass}" data-pin="${facility.id}" style="left: ${pos.x}%; top: ${pos.y}%; z-index: ${10 + index}">
                <button
                  type="button"
                  class="pin-marker pin-${pinStatus.variant} ${reports.length ? 'pin-has-report' : ''} ${!canBook ? 'pin-full' : ''}"
                  data-pin-toggle="${facility.id}"
                  aria-label="${escapeHtml(facility.name)} - ${escapeHtml(pinStatus.text)}"
                  aria-expanded="false"
                >
                  <span class="pin-label">${escapeHtml(facility.shortName)}</span>
                </button>

                <div class="pin-tooltip">
                  <div class="pin-tooltip-content">
                    <p class="font-semibold text-gray-900">${escapeHtml(facility.name)}</p>
                    <p class="text-xs text-gray-500 mt-0.5">${escapeHtml(facility.address)}</p>
                    <p class="text-xs font-medium mt-1 ${pinStatus.textClass}">${escapeHtml(pinStatus.text)}</p>
                    ${reports.length ? '<p class="text-xs text-amber-600 mt-1">' + reports.length + ' recent report' + (reports.length === 1 ? '' : 's') + '</p>' : ''}
                    <div class="grid grid-cols-3 gap-1.5 mt-2 pt-2 border-t border-gray-100">
                      <button type="button" data-directions="${facility.id}" class="pin-btn pin-btn-ghost">Directions</button>
                      <button type="button" data-report="${facility.id}" class="pin-btn pin-btn-warning">Report</button>
                      <button type="button" data-open-facility="${facility.id}" class="pin-btn pin-btn-primary" ${!canBook ? 'disabled' : ''}>
                        ${bookButtonLabel}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>

      <p class="text-xs text-gray-500 text-center mt-2">Tap a pin for directions, reports, and reservations.</p>
    </div>

    <style>
      .map-pin {
        position: absolute;
        transform: translate(-50%, -100%);
        pointer-events: auto;
      }

      .map-pin:hover,
      .map-pin:focus-within,
      .map-pin.pin-open {
        z-index: 45 !important;
      }

      .pin-marker {
        width: 38px;
        height: 38px;
        padding: 0;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 8px rgba(0,0,0,0.22);
        border: 2px solid white;
        position: relative;
        cursor: pointer;
      }

      .pin-marker:focus-visible {
        outline: 3px solid #006A4E;
        outline-offset: 2px;
      }

      .pin-marker::after {
        content: '';
        position: absolute;
        bottom: -4px;
        left: 50%;
        transform: translateX(-50%) rotate(45deg);
        width: 10px;
        height: 10px;
        background: inherit;
        border: 2px solid white;
        border-top: none;
        border-right: none;
      }

      .pin-emerald { background: #10B981; }
      .pin-amber { background: #F59E0B; }
      .pin-crimson { background: #DC2626; }
      .pin-gray { background: #9CA3AF; }
      .pin-full { opacity: 0.55; filter: grayscale(1); }

      .pin-label {
        transform: rotate(45deg);
        font-size: 8px;
        font-weight: 700;
        color: white;
        white-space: nowrap;
        pointer-events: none;
      }

      .pin-has-report::before {
        content: '';
        position: absolute;
        top: -3px;
        right: -3px;
        width: 10px;
        height: 10px;
        background: #F59E0B;
        border: 2px solid white;
        border-radius: 50%;
        transform: rotate(45deg);
      }

      .pin-tooltip {
        position: absolute;
        bottom: 100%;
        left: 50%;
        transform: translateX(-50%);
        padding-bottom: 8px;
        opacity: 0;
        visibility: hidden;
        pointer-events: none;
        transition: opacity 0.15s ease, visibility 0.15s ease;
        z-index: 50;
      }

      .map-pin:hover .pin-tooltip,
      .map-pin:focus-within .pin-tooltip,
      .map-pin.pin-open .pin-tooltip {
        opacity: 1;
        visibility: visible;
        pointer-events: auto;
      }

      .pin-tooltip-content {
        position: relative;
        width: 212px;
        background: white;
        border-radius: 12px;
        padding: 10px 12px;
        box-shadow: 0 6px 24px rgba(0,0,0,0.16);
        border: 1px solid #E5E7EB;
      }

      .pin-tooltip-content::after {
        content: '';
        position: absolute;
        bottom: -6px;
        left: 50%;
        transform: translateX(-50%);
        border-width: 6px 6px 0 6px;
        border-style: solid;
        border-color: white transparent transparent transparent;
      }

      .tooltip-below .pin-tooltip {
        bottom: auto;
        top: 100%;
        padding-top: 10px;
        padding-bottom: 0;
      }

      .tooltip-below .pin-tooltip-content::after {
        bottom: auto;
        top: -6px;
        border-width: 0 6px 6px 6px;
        border-color: transparent transparent white transparent;
      }

      .tooltip-left .pin-tooltip {
        left: -4px;
        transform: none;
      }

      .tooltip-left .pin-tooltip-content::after {
        left: 18px;
        transform: none;
      }

      .tooltip-right .pin-tooltip {
        left: auto;
        right: -4px;
        transform: none;
      }

      .tooltip-right .pin-tooltip-content::after {
        left: auto;
        right: 18px;
        transform: none;
      }

      .pin-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 30px;
        padding: 4px 6px;
        font-size: 10px;
        font-weight: 600;
        border-radius: 8px;
        text-align: center;
        border: 1px solid;
        transition: all 150ms ease;
      }

      .pin-btn-ghost {
        background: white;
        color: #374151;
        border-color: #D1D5DB;
      }

      .pin-btn-ghost:hover {
        background: #F3F4F6;
        border-color: #9CA3AF;
      }

      .pin-btn-warning {
        background: white;
        color: #B45309;
        border-color: #FCD34D;
      }

      .pin-btn-warning:hover {
        background: #FFFBEB;
      }

      .pin-btn-primary {
        background: #006A4E;
        color: white;
        border-color: #006A4E;
      }

      .pin-btn-primary:hover:not(:disabled) {
        background: #00523B;
      }

      .pin-btn-primary:disabled {
        opacity: 0.5;
        cursor: not-allowed;
        background: #9CA3AF;
        border-color: #D1D5DB;
      }
    </style>
  `;
}

function getPinStatus(availability) {
  if (!availability) {
    return { variant: 'gray', text: 'Checking availability', textClass: 'text-gray-500' };
  }

  if (availability.type === 'garage') {
    const percentage = (availability.spacesAvailable / Math.max(1, availability.maxCapacity)) * 100;
    const status = availability.status === STATUS_TYPES.CLOSED
      ? STATUS_TYPES.CLOSED
      : availability.spacesAvailable > 0 && percentage >= 20
        ? STATUS_TYPES.OPEN
        : availability.spacesAvailable > 0 ? STATUS_TYPES.FILLING_FAST : STATUS_TYPES.FULL;
    return {
      variant: getStatusBadgeVariant(status),
      text: status === STATUS_TYPES.CLOSED
        ? STATUS_TYPES.CLOSED
        : availability.spacesAvailable + ' of ' + availability.maxCapacity + ' spots open',
      textClass: status === STATUS_TYPES.OPEN
        ? 'text-emerald-600'
        : status === STATUS_TYPES.CLOSED
          ? 'text-gray-500'
          : status === STATUS_TYPES.FILLING_FAST ? 'text-amber-600' : 'text-red-600',
    };
  }

  const status = availability.status;
  const isOpen = status === STATUS_TYPES.OPEN || status === 'Open';
  const isClosed = status === STATUS_TYPES.CLOSED;
  return {
    variant: getStatusBadgeVariant(status),
    text: isOpen ? 'Reported open' : status,
    textClass: isOpen ? 'text-emerald-600' : (isClosed ? 'text-gray-500' : (status === STATUS_TYPES.FILLING_FAST ? 'text-amber-600' : 'text-red-600')),
  };
}

function getStatusBadgeVariant(status) {
  if (status === STATUS_TYPES.OPEN || status === 'Open') return 'emerald';
  if (status === STATUS_TYPES.FILLING_FAST) return 'amber';
  if (status === STATUS_TYPES.FULL) return 'crimson';
  return 'gray';
}

function calculatePinPositions(facilities) {
  const positioned = facilities
    .filter(facility => facility.coordinates)
    .map(facility => {
      const base = layoutForFacility(facility, ALL_FACILITIES);
      return { id: facility.id, x: base.x, y: base.y };
    });

  // Nudge overlapping pins apart so labels stay readable on a phone screen.
  for (let iteration = 0; iteration < 60; iteration++) {
    let moved = false;

    for (let i = 0; i < positioned.length; i++) {
      for (let j = i + 1; j < positioned.length; j++) {
        const a = positioned[i];
        const b = positioned[j];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const overlapX = PIN_MIN_X - Math.abs(dx);
        const overlapY = PIN_MIN_Y - Math.abs(dy);

        if (overlapX > 0 && overlapY > 0) {
          if (overlapX < overlapY) {
            const direction = dx >= 0 ? 1 : -1;
            a.x -= (direction * overlapX) / 2;
            b.x += (direction * overlapX) / 2;
          } else {
            const direction = dy >= 0 ? 1 : -1;
            a.y -= (direction * overlapY) / 2;
            b.y += (direction * overlapY) / 2;
          }
          moved = true;
        }
      }
    }

    positioned.forEach(pin => {
      pin.x = Math.min(90, Math.max(10, pin.x));
      pin.y = Math.min(88, Math.max(10, pin.y));
    });

    if (!moved) break;
  }

  const result = new Map();
  positioned.forEach(pin => result.set(pin.id, { x: pin.x, y: pin.y }));
  return result;
}

function layoutForFacility(facility, facilities) {
  const coords = facilities.map(item => item.coordinates).filter(Boolean);

  if (!coords.length || !facility.coordinates) return { x: 50, y: 50 };

  const lats = coords.map(coord => coord.lat);
  const lngs = coords.map(coord => coord.lng);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const latRange = maxLat - minLat || 0.01;
  const lngRange = maxLng - minLng || 0.01;

  return {
    x: ((facility.coordinates.lng - minLng) / lngRange) * 80 + 10,
    y: ((maxLat - facility.coordinates.lat) / latRange) * 80 + 10,
  };
}
