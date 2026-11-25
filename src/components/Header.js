/**
 * Header Component - Top navigation bar
 */

export function Header({ onPermitsClick, permitsOpen, onReservationLookupClick, hasSavedBooking }) {
  return `
    <header class="sticky-header">
      <div class="max-w-md mx-auto px-4">
        <div class="flex items-center justify-between gap-2 h-16">
          <div class="flex items-center gap-3 min-w-0">
            <div class="w-9 h-9 bg-csu-green rounded-xl flex items-center justify-center flex-shrink-0">
              <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"/>
              </svg>
            </div>
            <div class="min-w-0">
              <h1 class="text-lg font-bold text-gray-900 leading-tight whitespace-nowrap">CSU Parking</h1>
              <p class="hidden min-[360px]:block text-[11px] text-gray-500 leading-tight whitespace-nowrap">Cleveland State University</p>
            </div>
          </div>

          <div class="flex items-center gap-1.5 flex-shrink-0">
            <button
              id="permits-btn"
              type="button"
              class="h-9 px-3 rounded-xl border-2 border-csu-green bg-white text-csu-green text-xs font-semibold hover:bg-csu-green/5 active:bg-csu-green/10"
              aria-label="View permits and rates"
              aria-expanded="${permitsOpen}"
            >
              Permits
            </button>
            <button
              id="reservation-lookup-btn"
              type="button"
              class="relative w-9 h-9 flex items-center justify-center rounded-xl border-2 ${hasSavedBooking ? 'border-csu-green text-csu-green' : 'border-gray-200 text-gray-600'} bg-white hover:bg-gray-50"
              aria-label="View my reservation"
              title="My reservation"
            >
              <svg class="w-4.5 h-4.5" style="width:18px;height:18px" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/>
              </svg>
              ${hasSavedBooking ? '<span class="absolute -top-1 -right-1 w-4 h-4 bg-csu-green text-white text-[10px] font-bold rounded-full flex items-center justify-center">✓</span>' : ''}
            </button>
          </div>
        </div>
      </div>
    </header>
  `;
}
