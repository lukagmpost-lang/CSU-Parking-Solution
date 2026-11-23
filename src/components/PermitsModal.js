/**
 * PermitsModal Component - Permits & Pricing info drawer
 */

import { PERMIT_TYPES, PERMIT_PRICING, EXTERNAL_LINKS } from '../data/csuParkingData.js';
import { escapeHtml } from '../utils/helpers.js';

export function PermitsModal({ onClose }) {
  return `
    <div class="modal-overlay" data-modal="permits" role="dialog" aria-modal="true" aria-labelledby="permits-title">
      <div class="modal-content animate-slide-up">
        <div class="modal-handle" aria-hidden="true"></div>
        
        <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 id="permits-title" class="text-lg font-semibold text-gray-900">Permits & Rates</h2>
          <button 
            type="button" 
            data-modal-close="permits"
            class="p-2 rounded-lg hover:bg-gray-100 text-gray-500"
            aria-label="Close"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
        
        <div class="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          <div>
            <h3 class="text-sm font-semibold text-gray-900 mb-4">Semester Permit Rates</h3>
            <div class="space-y-3">
              ${Object.entries(PERMIT_PRICING).filter(([key]) => key !== PERMIT_TYPES.VISITOR).map(([key, permit]) => `
                <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-lg flex items-center justify-center" style="background: ${getPermitColor(key)}20;">
                      <div class="w-5 h-5 rounded" style="background: ${getPermitColor(key)};"></div>
                    </div>
                    <div>
                      <p class="font-medium text-gray-900">${escapeHtml(permit.name)}</p>
                      <p class="text-xs text-gray-500">Per ${permit.period}</p>
                    </div>
                  </div>
                  <span class="text-lg font-bold text-csu-green">$${permit.price}</span>
                </div>
              `).join('')}
            </div>
          </div>
          
          <div class="border-t border-gray-200 pt-4">
            <h3 class="text-sm font-semibold text-gray-900 mb-4">Visitor & Hourly Parking</h3>
            <div class="p-4 bg-gray-50 rounded-lg">
              <div class="flex items-center justify-between">
                <div>
                  <p class="font-medium text-gray-900">${escapeHtml(PERMIT_PRICING[PERMIT_TYPES.VISITOR].name)}</p>
                  <p class="text-xs text-gray-500">Text2Park zones available at all surface lots</p>
                </div>
                <span class="text-lg font-bold text-csu-green">${escapeHtml(PERMIT_PRICING[PERMIT_TYPES.VISITOR].priceRange)}</span>
              </div>
            </div>
          </div>
          
          <div class="border-t border-gray-200 pt-4">
            <h3 class="text-sm font-semibold text-gray-900 mb-4">Official Resources</h3>
            <div class="space-y-2">
              <a 
                href="${EXTERNAL_LINKS.buyPermits}" 
                target="_blank" 
                rel="noopener noreferrer"
                class="btn-secondary text-sm py-2.5 flex items-center justify-center gap-2"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
                </svg>
                Buy / Manage Permits
              </a>
              <a 
                href="${EXTERNAL_LINKS.permitRules}" 
                target="_blank" 
                rel="noopener noreferrer"
                class="btn-secondary text-sm py-2.5 flex items-center justify-center gap-2"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                </svg>
                Commuter Permit Rules
              </a>
              <a 
                href="${EXTERNAL_LINKS.visitorInfo}" 
                target="_blank" 
                rel="noopener noreferrer"
                class="btn-secondary text-sm py-2.5 flex items-center justify-center gap-2"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"/>
                </svg>
                Visitor & Event Parking
              </a>
            </div>
          </div>
          
          <div class="bg-csu-green/5 border border-csu-green/20 rounded-lg p-4">
            <h4 class="font-medium text-csu-green mb-2 flex items-center gap-2">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              Important Notes
            </h4>
            <ul class="text-sm text-gray-700 space-y-1">
              <li class="flex items-start gap-2">\u2022 Green permits valid in all garages and surface lots</li>
              <li class="flex items-start gap-2">\u2022 White permits valid in Central, West, South, East garages</li>
              <li class="flex items-start gap-2">\u2022 Evening permits valid after 3:30 PM</li>
              <li class="flex items-start gap-2">\u2022 Night permits valid after 5:30 PM</li>
              <li class="flex items-start gap-2">\u2022 ADA spaces available in all facilities with valid placard</li>
              <li class="flex items-start gap-2">\u2022 Rates subject to change; check CSU website for current pricing</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  `;
}

function getPermitColor(permitType) {
  const colors = {
    Green: '#006A4E',
    White: '#6B7280',
    Evening: '#F59E0B',
    Night: '#8B5CF6',
    ADA: '#DC2626',
    Visitor: '#3B82F6',
  };
  return colors[permitType] || '#6B7280';
}
