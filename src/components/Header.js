/**
 * Header Component - Top navigation bar
 */

export function Header({ onPermitsClick, onRefreshClick, permitsOpen }) {
  return `
    <header class="sticky-header">
      <div class="max-w-md mx-auto px-4">
        <div class="flex items-center justify-between h-16">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 bg-csu-green rounded-lg flex items-center justify-center">
              <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"/>
              </svg>
            </div>
            <div>
              <h1 class="text-lg font-bold text-gray-900">CSU Parking</h1>
              <p class="text-xs text-gray-500">Cleveland State University</p>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <button 
              id="refresh-btn"
              class="btn-ghost p-2 rounded-lg"
              aria-label="Refresh availability"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
              </svg>
            </button>
            <button 
              id="permits-btn"
              class="btn-secondary text-sm px-4 py-2 min-h-[40px]"
              aria-label="Permits & Rates"
              aria-expanded="${permitsOpen}"
            >
              Permits & Rates
            </button>
          </div>
        </div>
      </div>
    </header>
  `;
}
