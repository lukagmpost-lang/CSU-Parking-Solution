/**
 * SpotSaverBar Component - Bottom bar showing saved parking spot
 */

import { escapeHtml } from '../utils/helpers.js';

export function SpotSaverBar({ savedSpot, onClearSpot, getTimerStatus, getDirectionsUrl }) {
  if (!savedSpot) {
    return `
      <div class="bottom-bar" id="spot-saver-bar">
        <div class="max-w-md mx-auto">
          <button
            type="button"
            class="w-full btn-primary flex items-center justify-center gap-2"
            onclick="document.dispatchEvent(new CustomEvent('open-spot-saver'))"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"/>
            </svg>
            <span>Save My Parking Spot</span>
          </button>
        </div>
      </div>
    `;
  }
  
  const timer = getTimerStatus();
  const directionsUrl = getDirectionsUrl(savedSpot);
  
  return `
    <div class="bottom-bar" id="spot-saver-bar">
      <div class="max-w-md mx-auto">
        <div class="bg-csu-green/5 border border-csu-green/20 rounded-lg p-4">
          <div class="flex items-start justify-between gap-3 mb-3">
            <div class="flex-1 min-w-0">
              <p class="font-semibold text-csu-green">${escapeHtml(savedSpot.facilityName)}</p>
              <p class="text-sm text-gray-600 mt-0.5">${escapeHtml(savedSpot.locationString)}</p>
              ${savedSpot.notes ? '<p class="text-xs text-gray-500 mt-1">' + escapeHtml(savedSpot.notes) + '</p>' : ''}
            </div>
            <button
              type="button"
              id="clear-spot-btn"
              class="p-2 rounded-lg hover:bg-gray-100 text-gray-500 flex-shrink-0"
              aria-label="Clear saved spot"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
          
          ${timer ? `
            <div class="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 mb-3">
              <div class="flex items-center gap-2">
                <svg class="w-5 h-5 ${timer.expired ? 'text-red-500' : 'text-csu-green'}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <span class="font-medium ${timer.expired ? 'text-red-600' : 'text-gray-900'}">
                  ${timer.expired ? 'Timer Expired' : timer.formatted}
                </span>
              </div>
              ${!timer.expired ? `
                <button
                  type="button"
                  class="btn-ghost text-xs px-3 py-1.5"
                  onclick="document.dispatchEvent(new CustomEvent('extend-timer', { detail: 60 }))"
                >
                  +1 Hour
                </button>
              ` : ''}
            </div>
          ` : ''}
          
          <div class="flex gap-2">
            ${directionsUrl ? `
              <a
                href="${directionsUrl}"
                target="_blank"
                rel="noopener noreferrer"
                class="flex-1 btn-secondary text-center"
              >
                <svg class="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z"/>
                </svg>
                Directions
              </a>
            ` : ''}
            <button
              type="button"
              class="flex-1 btn-primary"
              onclick="document.dispatchEvent(new CustomEvent('open-spot-saver'))"
            >
              Edit Spot
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}
