/**
 * MapView Component - Interactive map with facility pins
 */

import { escapeHtml } from '../utils/helpers.js';

export function MapView({ 
  facilities, 
  availabilityData, 
  activeReports,
  onDirectionsClick,
  onReportClick,
  onSaveSpotClick,
}) {
  const coords = facilities.map(f => f.coordinates).filter(Boolean);
  const hasCoords = coords.length > 0;
  
  return `
    <div class="h-[calc(100vh-280px)] min-h-[400px] relative">
      <div id="map-container" class="absolute inset-0 bg-gray-200 relative">
        ${hasCoords ? `
          <img 
            src="https://maps.googleapis.com/maps/api/staticmap?center=41.501,-81.674&zoom=16&size=640x640&maptype=roadmap&style=feature:poi|visibility:off&style=feature:transit|visibility:off&key=YOUR_API_KEY"
            alt="CSU Campus Parking Map"
            class="w-full h-full object-cover"
            onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"
          />
          <div class="w-full h-full flex items-center justify-center bg-gray-100 hidden" id="map-fallback">
            <div class="text-center p-4">
              <svg class="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z"/>
              </svg>
              <p class="text-gray-500">Map view requires API key</p>
              <p class="text-xs text-gray-400 mt-1">Showing facility pins below</p>
            </div>
          </div>
          
          <div class="absolute inset-0 pointer-events-none" id="pins-overlay">
            ${facilities.map((facility, index) => {
              const avail = availabilityData[facility.id];
              const formatted = avail ? formatAvailabilityForPin(avail) : null;
              const variant = formatted ? getStatusBadgeVariant(formatted.status) : 'gray';
              const hasReports = activeReports[facility.id]?.length > 0;
              
              const pos = calculatePinPosition(facility.coordinates, facilities);
              
              return `
                <button
                  type="button"
                  data-facility="${facility.id}"
                  class="map-pin pointer-events-auto animate-slide-up"
                  style="left: ${pos.x}%; top: ${pos.y}%; z-index: ${10 + index}"
                  aria-label="${escapeHtml(facility.name)} - ${formatted ? formatted.text : 'Loading'}"
                >
                  <div class="pin-marker pin-${variant} ${hasReports ? 'pin-has-report' : ''}">
                    <span class="pin-label">${escapeHtml(facility.shortName)}</span>
                    ${hasReports ? '<span class="pin-report-dot"></span>' : ''}
                  </div>
                  <div class="pin-tooltip">
                    <div class="pin-tooltip-content">
                      <p class="font-semibold text-gray-900">${escapeHtml(facility.name)}</p>
                      <p class="text-xs text-gray-500">${formatted ? formatted.text : 'Loading...'}</p>
                      <div class="flex gap-2 mt-2 pt-2 border-t border-gray-100">
                        <button data-directions="${facility.id}" class="pin-btn">Directions</button>
                        <button data-report="${facility.id}" class="pin-btn pin-btn-warning">Report</button>
                        <button data-save-spot="${facility.id}" class="pin-btn pin-btn-primary">Save Spot</button>
                      </div>
                    </div>
                  </div>
                </button>
              `;
            }).join('')}
          </div>
        ` : `
          <div class="w-full h-full flex items-center justify-center bg-gray-100">
            <p class="text-gray-500">No facilities to display on map</p>
          </div>
        `}
      </div>
      
      <div class="absolute bottom-4 left-4 right-4 md:left-auto md:right-4 md:bottom-4 md:w-48">
        <div class="bg-white rounded-lg shadow-lg p-3 border border-gray-200">
          <p class="text-xs font-semibold text-gray-900 mb-2">Availability</p>
          <div class="space-y-1.5">
            ${['emerald', 'amber', 'crimson', 'gray'].map(variant => {
              const labels = { emerald: 'Open', amber: 'Filling Fast', crimson: 'Full', gray: 'Unknown' };
              return `
                <div class="flex items-center gap-2">
                  <div class="w-3 h-3 rounded-full ${getPinColorClass(variant)}"></div>
                  <span class="text-xs text-gray-600">${labels[variant]}</span>
                </div>
              `;
            }).join('')}
          </div>
          <div class="border-t border-gray-200 mt-2 pt-2">
            <div class="flex items-center gap-2">
              <div class="w-3 h-3 rounded-full bg-white border-2 border-amber-500 relative">
                <div class="absolute inset-0 w-1.5 h-1.5 rounded-full bg-amber-500"></div>
              </div>
              <span class="text-xs text-gray-600">Has Reports</span>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <style>
      .map-pin {
        position: absolute;
        transform: translate(-50%, -100%);
      }
      
      .pin-marker {
        width: 36px;
        height: 36px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        border: 2px solid white;
        position: relative;
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
      
      .pin-label {
        transform: rotate(45deg);
        font-size: 8px;
        font-weight: 700;
        color: white;
        white-space: nowrap;
      }
      
      .pin-has-report::before {
        content: '';
        position: absolute;
        top: -2px;
        right: -2px;
        width: 10px;
        height: 10px;
        background: #F59E0B;
        border: 2px solid white;
        border-radius: 50%;
        transform: rotate(45deg);
      }
      
      .pin-report-dot {
        position: absolute;
        top: -2px;
        right: -2px;
        width: 8px;
        height: 8px;
        background: #F59E0B;
        border: 2px solid white;
        border-radius: 50%;
        transform: rotate(45deg);
      }
      
      .pin-tooltip {
        position: absolute;
        bottom: 100%;
        left: 50%;
        transform: translateX(-50%) translateY(-8px);
        opacity: 0;
        visibility: hidden;
        pointer-events: none;
        transition: all 0.2s ease;
        z-index: 20;
      }
      
      .map-pin:hover .pin-tooltip,
      .map-pin:focus .pin-tooltip {
        opacity: 1;
        visibility: visible;
        pointer-events: auto;
      }
      
      .pin-tooltip-content {
        background: white;
        border-radius: 8px;
        padding: 10px 12px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.15);
        border: 1px solid #E5E7EB;
        min-width: 160px;
        white-space: nowrap;
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
      
      .pin-btn {
        flex: 1;
        padding: 6px 8px;
        font-size: 11px;
        font-weight: 600;
        border-radius: 6px;
        text-align: center;
      }
      
      .pin-btn-warning {
        background: #FEF3C7;
        color: #92400E;
        border: 1px solid #FCD34D;
      }
      
      .pin-btn-primary {
        background: #006A4E;
        color: white;
        border: 1px solid #006A4E;
      }
      
      .pin-btn:not(.pin-btn-warning):not(.pin-btn-primary) {
        background: #F3F4F6;
        color: #374151;
        border: 1px solid #D1D5DB;
      }
    </style>
  `;
}

function formatAvailabilityForPin(avail) {
  if (avail.type === 'garage') {
    const percentage = Math.round((avail.spacesAvailable / avail.maxCapacity) * 100);
    let status;
    if (percentage >= 20) status = 'Open';
    else if (percentage > 0) status = 'Filling Fast';
    else status = 'Full';
    return { text: avail.spacesAvailable + '/' + avail.maxCapacity, status, percentage };
  } else {
    return { text: avail.status, status: avail.status };
  }
}

function getStatusBadgeVariant(status) {
  if (status === 'Open') return 'emerald';
  if (status === 'Filling Fast') return 'amber';
  if (status === 'Full' || status === 'Closed') return 'crimson';
  return 'gray';
}

function getPinColorClass(variant) {
  const colors = {
    emerald: 'bg-emerald-500',
    amber: 'bg-amber-500',
    crimson: 'bg-red-500',
    gray: 'bg-gray-400',
  };
  return colors[variant] || 'bg-gray-400';
}

function calculatePinPosition(coord, allFacilities) {
  if (!coord) return { x: 50, y: 50 };
  
  const coords = allFacilities.map(f => f.coordinates).filter(Boolean);
  const lats = coords.map(c => c.lat);
  const lngs = coords.map(c => c.lng);
  
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  
  const latRange = maxLat - minLat || 0.01;
  const lngRange = maxLng - minLng || 0.01;
  
  const x = ((coord.lng - minLng) / lngRange) * 80 + 10;
  const y = ((maxLat - coord.lat) / latRange) * 80 + 10;
  
  return { x, y };
}
