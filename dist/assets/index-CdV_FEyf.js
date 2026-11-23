(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const r of document.querySelectorAll('link[rel="modulepreload"]'))n(r);new MutationObserver(r=>{for(const o of r)if(o.type==="childList")for(const i of o.addedNodes)i.tagName==="LINK"&&i.rel==="modulepreload"&&n(i)}).observe(document,{childList:!0,subtree:!0});function a(r){const o={};return r.integrity&&(o.integrity=r.integrity),r.referrerPolicy&&(o.referrerPolicy=r.referrerPolicy),r.crossOrigin==="use-credentials"?o.credentials="include":r.crossOrigin==="anonymous"?o.credentials="omit":o.credentials="same-origin",o}function n(r){if(r.ep)return;r.ep=!0;const o=a(r);fetch(r.href,o)}})();const De="modulepreload",Be=function(e){return"/"+e},le={},je=function(t,a,n){let r=Promise.resolve();if(a&&a.length>0){document.getElementsByTagName("link");const i=document.querySelector("meta[property=csp-nonce]"),c=(i==null?void 0:i.nonce)||(i==null?void 0:i.getAttribute("nonce"));r=Promise.allSettled(a.map(u=>{if(u=Be(u),u in le)return;le[u]=!0;const g=u.endsWith(".css"),f=g?'[rel="stylesheet"]':"";if(document.querySelector(`link[href="${u}"]${f}`))return;const d=document.createElement("link");if(d.rel=g?"stylesheet":De,g||(d.as="script"),d.crossOrigin="",d.href=u,c&&d.setAttribute("nonce",c),document.head.appendChild(d),g)return new Promise((h,l)=>{d.addEventListener("load",h),d.addEventListener("error",()=>l(new Error(`Unable to preload CSS for ${u}`)))})}))}function o(i){const c=new Event("vite:preloadError",{cancelable:!0});if(c.payload=i,window.dispatchEvent(c),!c.defaultPrevented)throw i}return r.then(i=>{for(const c of i||[])c.status==="rejected"&&o(c.reason);return t().catch(o)})},s={GREEN:"Green",WHITE:"White",EVENING:"Evening",NIGHT:"Night",ADA:"ADA",VISITOR:"Visitor"},m={OPEN:"Open",FILLING_FAST:"Filling Fast",FULL:"Full",CLOSED:"Closed"},Fe=[{id:"lot_full",label:"Lot Full",icon:"alert-triangle"},{id:"gate_broken",label:"Gate Broken",icon:"gate"},{id:"blocked_space",label:"Blocked Space",icon:"car"},{id:"pay_station_down",label:"Pay Station Down",icon:"credit-card"},{id:"event_closure",label:"Event Closure",icon:"calendar-x"}],w=[{id:"cg",name:"Central Garage",shortName:"CG",type:"garage",maxCapacity:785,permits:[s.WHITE,s.GREEN,s.VISITOR],address:"2121 Euclid Ave, Cleveland, OH 44115",coordinates:{lat:41.5012,lng:-81.6745},text2ParkZone:"CSU-CG",hasLiveCount:!0,floors:8,hourlyRate:4,dailyMax:12},{id:"wg",name:"West Garage",shortName:"WG",type:"garage",maxCapacity:530,permits:[s.WHITE,s.GREEN,s.VISITOR],address:"1983 E 24th St, Cleveland, OH 44115",coordinates:{lat:41.5008,lng:-81.6782},text2ParkZone:"CSU-WG",hasLiveCount:!0,floors:6,hourlyRate:4,dailyMax:12},{id:"sg",name:"South Garage",shortName:"SG",type:"garage",maxCapacity:530,permits:[s.WHITE,s.GREEN,s.VISITOR],address:"2001 E 22nd St, Cleveland, OH 44115",coordinates:{lat:41.4985,lng:-81.676},text2ParkZone:"CSU-SG",hasLiveCount:!0,floors:6,hourlyRate:4,dailyMax:12},{id:"eg",name:"East Garage",shortName:"EG",type:"garage",maxCapacity:350,permits:[s.WHITE,s.GREEN,s.VISITOR],address:"2250 Euclid Ave, Cleveland, OH 44115",coordinates:{lat:41.502,lng:-81.671},text2ParkZone:"CSU-EG",hasLiveCount:!0,floors:5,hourlyRate:4,dailyMax:12},{id:"pg",name:"Prospect Garage",shortName:"PG",type:"garage",maxCapacity:230,permits:[s.GREEN,s.VISITOR],address:"1900 Prospect Ave, Cleveland, OH 44115",coordinates:{lat:41.5,lng:-81.6735},text2ParkZone:"CSU-PG",hasLiveCount:!0,floors:4,hourlyRate:4,dailyMax:12}],k=[{id:"lot21",name:"Lot 21",shortName:"Lot 21",type:"surface",maxCapacity:180,permits:[s.GREEN,s.WHITE,s.EVENING,s.NIGHT,s.ADA,s.VISITOR],address:"E 21st St & Chester Ave, Cleveland, OH 44115",coordinates:{lat:41.5015,lng:-81.677},text2ParkZone:"CSU21",hasLiveCount:!1,hourlyRate:3,dailyMax:10},{id:"lot22",name:"Lot 22 (CSU22)",shortName:"Lot 22",type:"surface",maxCapacity:150,permits:[s.GREEN,s.WHITE,s.EVENING,s.NIGHT,s.ADA,s.VISITOR],address:"E 22nd St & Chester Ave, Cleveland, OH 44115",coordinates:{lat:41.501,lng:-81.6755},text2ParkZone:"CSU22",hasLiveCount:!1,hourlyRate:3,dailyMax:10},{id:"lot40",name:"Lot 40",shortName:"Lot 40",type:"surface",maxCapacity:200,permits:[s.GREEN,s.WHITE,s.EVENING,s.NIGHT,s.ADA,s.VISITOR],address:"E 18th St & Euclid Ave, Cleveland, OH 44115",coordinates:{lat:41.503,lng:-81.674},text2ParkZone:"CSU40",hasLiveCount:!1,hourlyRate:3,dailyMax:10},{id:"lot54",name:"Lot 54 (CSU54)",shortName:"Lot 54",type:"surface",maxCapacity:120,permits:[s.GREEN,s.WHITE,s.EVENING,s.NIGHT,s.ADA,s.VISITOR],address:"E 24th St & Payne Ave, Cleveland, OH 44114",coordinates:{lat:41.5005,lng:-81.679},text2ParkZone:"CSU54",hasLiveCount:!1,hourlyRate:3,dailyMax:10},{id:"lot65",name:"Lot 65 / Rec Garage",shortName:"Lot 65",type:"surface",maxCapacity:300,permits:[s.GREEN,s.WHITE,s.EVENING,s.NIGHT,s.ADA,s.VISITOR],address:"2420 Chester Ave, Cleveland, OH 44115",coordinates:{lat:41.5025,lng:-81.672},text2ParkZone:"CSU65",hasLiveCount:!1,hourlyRate:3,dailyMax:10},{id:"lot66",name:"Lot 66",shortName:"Lot 66",type:"surface",maxCapacity:100,permits:[s.GREEN,s.WHITE,s.EVENING,s.NIGHT,s.ADA,s.VISITOR],address:"E 26th St & Chester Ave, Cleveland, OH 44115",coordinates:{lat:41.5022,lng:-81.6705},text2ParkZone:"CSU66",hasLiveCount:!1,hourlyRate:3,dailyMax:10},{id:"lot70",name:"Lot 70",shortName:"Lot 70",type:"surface",maxCapacity:80,permits:[s.GREEN,s.WHITE,s.EVENING,s.NIGHT,s.ADA,s.VISITOR],address:"E 17th St & Euclid Ave, Cleveland, OH 44115",coordinates:{lat:41.5035,lng:-81.675},text2ParkZone:"CSU70",hasLiveCount:!1,hourlyRate:3,dailyMax:10}],b=[...w,...k],H={[s.WHITE]:{name:"White Commuter Permit",price:192,period:"semester"},[s.GREEN]:{name:"Green Commuter Permit",price:278,period:"semester"},[s.EVENING]:{name:"Evening Permit (after 3:30 PM)",price:191,period:"semester"},[s.NIGHT]:{name:"Night Permit (after 5:30 PM)",price:174,period:"semester"},[s.VISITOR]:{name:"Visitor Pay-on-Exit / Text2Park",priceRange:"$4 – $12",period:"daily max"}},q={buyPermits:"https://csuohio.edu/parking/permits",permitRules:"https://csuohio.edu/parking/rules",visitorInfo:"https://csuohio.edu/parking/visitors"};function M(e){return b.find(t=>t.id===e)}let R=new Map,z=new Set,de=null;const F=new Map;w.forEach(e=>{F.set(e.id,{currentSpaces:Math.floor(e.maxCapacity*(.3+Math.random()*.5)),trend:Math.random()>.5?1:-1,lastUpdate:Date.now()})});k.forEach(e=>{F.set(e.id,{status:m.OPEN,lastUpdate:Date.now(),reportCount:0})});function me(){const e={};R.forEach((t,a)=>{e[a]=t}),z.forEach(t=>t(e))}function ge(){const e={};return R.forEach((t,a)=>{e[a]=t}),e}function fe(e){return z.add(e),e(ge()),()=>z.delete(e)}function N(e){const t=F.get(e.id);if(!t)return null;const a=Date.now();if(a-t.lastUpdate<3e4)return t.currentSpaces;const r=Math.floor(Math.random()*11)-5,o=t.trend*Math.floor(Math.random()*3);let i=t.currentSpaces+r+o;return i=Math.max(0,Math.min(e.maxCapacity,i)),Math.random()<.1&&(t.trend*=-1),i<=e.maxCapacity*.1&&(t.trend=1),i>=e.maxCapacity*.9&&(t.trend=-1),t.currentSpaces=i,t.lastUpdate=a,i}function te(e){const t=F.get(e.id);if(!t)return m.OPEN;if(t.reportCount>=2)t.status=m.FULL;else if(t.reportCount===1)t.status=m.FILLING_FAST;else{const a=Math.random();a<.7?t.status=m.OPEN:a<.9?t.status=m.FILLING_FAST:t.status=m.FULL}return t.lastUpdate=Date.now(),t.status}async function Ge(){const e={};for(const t of w)try{e[t.id]=N(t)}catch(a){console.warn("Failed to fetch live data for "+t.id+", using simulator:",a),e[t.id]=N(t)}return e}async function Ue(){const e={};for(const t of k)e[t.id]=te(t);return e}async function T(){try{const[e,t]=await Promise.all([Ge(),Ue()]),a=new Date().toISOString();Object.entries(e).forEach(([n,r])=>{const o=w.find(i=>i.id===n);o&&R.set(n,{type:"garage",facilityId:n,spacesAvailable:r,maxCapacity:o.maxCapacity,percentage:Math.round(r/o.maxCapacity*100),status:r>o.maxCapacity*.2?m.OPEN:r>0?m.FILLING_FAST:m.FULL,lastUpdated:a,isLive:!0})}),Object.entries(t).forEach(([n,r])=>{k.find(i=>i.id===n)&&R.set(n,{type:"surface",facilityId:n,status:r,lastUpdated:a,isLive:!1})}),me()}catch(e){console.error("Failed to refresh availability:",e)}}function ve(e=3e4){de||(T(),de=setInterval(T,e),setInterval(()=>{w.forEach(t=>N(t)),k.forEach(t=>te(t)),me()},5e3))}async function he(){await T()}function be(e){if(!e)return{text:"Unknown",status:m.OPEN};if(e.type==="garage"){const{spacesAvailable:t,maxCapacity:a,percentage:n}=e;return{text:t+" / "+a+" spots",shortText:t+" open",percentage:n,status:e.status,isLive:e.isLive,lastUpdated:e.lastUpdated}}else return{text:e.status,status:e.status,isLive:e.isLive,lastUpdated:e.lastUpdated,reportCount:e.reportCount}}function xe(e){switch(e){case m.OPEN:return"emerald";case m.FILLING_FAST:return"amber";case m.FULL:case m.CLOSED:return"crimson";default:return"gray"}}w.forEach(e=>N(e));k.forEach(e=>te(e));T();const _e=Object.freeze(Object.defineProperty({__proto__:null,formatAvailability:be,getAllAvailability:ge,getStatusBadgeVariant:xe,startPolling:ve,subscribeToAvailability:fe,triggerRefresh:he},Symbol.toStringTag,{value:"Module"})),ye="csu-parking-reports",we="csu-parking-report-cooldown",ke=10*60*1e3;let W=new Set;function Se(){try{const e=localStorage.getItem(ye);return e?JSON.parse(e):[]}catch{return[]}}function Ve(e){localStorage.setItem(ye,JSON.stringify(e))}function He(){const e=ae();W.forEach(t=>t(e))}function qe(e){return W.add(e),e(ae()),()=>W.delete(e)}function ze(){const e=localStorage.getItem(we);return e?Date.now()-parseInt(e,10)<ke:!1}function We(){const e=localStorage.getItem(we);if(!e)return 0;const t=ke-(Date.now()-parseInt(e,10));return Math.max(0,t)}function ae(){const e=Se(),t=Date.now();return e.filter(a=>a.expiresAt>t)}function Ce(e){return ae().filter(t=>t.facilityId===e)}function Ze(e){return Ce(e).length>0}function Ye(e){const t=Ce(e);return t.length===0?null:t.sort((a,n)=>n.timestamp-a.timestamp)[0]}function Ke(e){const t=Date.now()-e,a=Math.floor(t/6e4),n=Math.floor(t/36e5);return a<1?"Just now":a<60?a+"m ago":n<24?n+"h ago":Math.floor(n/24)+"d ago"}function re(){const e=Se(),t=Date.now(),a=e.filter(n=>n.expiresAt>t);return a.length!==e.length&&(Ve(a),He()),a.length}re();setInterval(re,5*60*1e3);const Ee="csu-parking-saved-spot",Je="csu-parking-timer";let Z=new Set;function Xe(){const e=G();Z.forEach(t=>t(e))}function Qe(e){return Z.add(e),e(G()),()=>Z.delete(e)}function G(){try{const e=localStorage.getItem(Ee);return e?JSON.parse(e):null}catch{return null}}function et(){localStorage.removeItem(Ee),localStorage.removeItem(Je),Xe()}function Ie(){const e=G();if(!(e!=null&&e.timer))return null;const t=Date.now(),{expiresAt:a}=e.timer,n=a-t;if(n<=0)return{expired:!0,remaining:0};const r=Math.ceil(n/6e4),o=Math.floor(r/60),i=r%60;return{expired:!1,remaining:n,minutes:r,formatted:o>0?o+"h "+i+"m":i+"m",expiresAt:a}}function tt(e,t){if(!e)return null;const a=t(e.facilityId),n=Ie(),r=[];return a&&r.push(a.name),e.floor&&r.push("Floor "+e.floor),e.row&&r.push("Row "+e.row),e.spot&&r.push("Spot "+e.spot),{facilityName:(a==null?void 0:a.name)||"Unknown",locationString:r.join(" • "),notes:e.notes,savedAt:e.savedAt,timer:n,facility:a}}function at(e){const t=e.facilityId?M(e.facilityId):null;if(!(t!=null&&t.coordinates))return null;const{lat:a,lng:n}=t.coordinates;return"https://maps.google.com/?q="+a+","+n}const rt="'#39;";function p(e){return String(e).replace(/&/g,"&").replace(/</g,"<").replace(/>/g,">").replace(/"/g,'"').replace(/'/g,rt)}function st(e,t,a="CSU Parking"){return"https://maps.google.com/?q="+e+","+t+"("+encodeURIComponent(a)+")"}function ot(e,t,a="CSU Parking"){return"https://maps.apple.com/?q="+encodeURIComponent(a)+"&ll="+e+","+t}function nt(e,t,a="CSU Parking"){const r=/iPad|iPhone|iPod/.test(navigator.userAgent)?ot(e,t,a):st(e,t,a);window.open(r,"_blank","noopener,noreferrer")}function it(e,t){let a;return(...n)=>{clearTimeout(a),a=setTimeout(()=>e(...n),t)}}function ce(e){return new Intl.NumberFormat().format(e)}function U(e=[50]){navigator.vibrate&&navigator.vibrate(e)}function lt(e){const t=()=>e(navigator.onLine);return window.addEventListener("online",t),window.addEventListener("offline",t),()=>{window.removeEventListener("online",t),window.removeEventListener("offline",t)}}function dt({onPermitsClick:e,onRefreshClick:t,permitsOpen:a}){return`
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
              aria-expanded="${a}"
            >
              Permits & Rates
            </button>
          </div>
        </div>
      </div>
    </header>
  `}const ct=[{value:"All",label:"All Permits"},{value:s.GREEN,label:"Green"},{value:s.WHITE,label:"White"},{value:s.EVENING,label:"Evening"},{value:s.NIGHT,label:"Night"},{value:s.ADA,label:"ADA"},{value:s.VISITOR,label:"Visitor"}];function ut({selectedPermit:e,onPermitChange:t,showOpenOnly:a,onOpenOnlyChange:n,searchQuery:r,onSearchChange:o,currentView:i,onViewChange:c,facilityCount:u,totalCount:g}){return`
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
            value="${p(r)}"
            class="input-field pl-10"
            aria-label="Search parking facilities"
          >
        </div>
        
        <div class="flex gap-2 overflow-x-auto pb-2 scrollbar-hide" role="group" aria-label="Filter by permit type">
          ${ct.map(f=>`
            <button
              type="button"
              data-permit="${f.value}"
              class="filter-chip ${e===f.value?"filter-chip-active":""} whitespace-nowrap"
              aria-pressed="${e===f.value}"
              role="tab"
            >
              ${p(f.label)}
            </button>
          `).join("")}
        </div>
        
        <div class="flex items-center justify-between mt-3">
          <div class="flex items-center gap-2">
            <label class="flex items-center gap-2 cursor-pointer">
              <input
                id="open-only-toggle"
                type="checkbox"
                ${a?"checked":""}
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
              class="px-3 py-1.5 text-sm font-medium rounded-md ${i==="list"?"bg-white text-csu-green shadow-sm":"text-gray-600 hover:text-gray-900"}"
              role="tab"
              aria-selected="${i==="list"}"
              aria-label="List view"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
              </svg>
            </button>
            <button
              type="button"
              data-view="map"
              class="px-3 py-1.5 text-sm font-medium rounded-md ${i==="map"?"bg-white text-csu-green shadow-sm":"text-gray-600 hover:text-gray-900"}"
              role="tab"
              aria-selected="${i==="map"}"
              aria-label="Map view"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z"/>
              </svg>
            </button>
          </div>
        </div>
        
        <p class="text-xs text-gray-500 mt-2 text-center">
          Showing ${u} of ${g} facilities
        </p>
      </div>
    </div>
  `}const pt={[m.OPEN]:"Open",[m.FILLING_FAST]:"Filling Fast",[m.FULL]:"Full",[m.CLOSED]:"Closed"};function mt({facilities:e,availabilityData:t,activeReports:a,onDirectionsClick:n,onReportClick:r,onSaveSpotClick:o,formatAvailability:i,getStatusBadgeVariant:c,hasActiveReports:u,getLatestReportForFacility:g,formatTimeAgo:f}){return e.length===0?`
      <div class="max-w-md mx-auto px-4 py-12">
        <div class="empty-state">
          <svg class="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          <h3 class="text-lg font-medium text-gray-900 mb-1">No facilities found</h3>
          <p class="text-gray-500">Try adjusting your filters or search terms</p>
        </div>
      </div>
    `:`
    <div class="max-w-md mx-auto">
      <div class="bg-white rounded-t-lg border border-gray-200 overflow-hidden">
        ${e.map(d=>{const h=t[d.id],l=h?i(h):null,x=l?c(l.status):"gray",I=a[d.id]||[],S=g?g(d.id):null,Pe=I.length>0;let L,C;l?l.type==="garage"?(L=ce(l.spacesAvailable)+" / "+ce(l.maxCapacity)+" spots",C=l.percentage+"% available"):(L=pt[l.status]||l.status,C=l.reportCount?l.reportCount+" report"+(l.reportCount>1?"s":""):""):(L="Loading...",C="");let $="status-badge status-badge-gray";return x==="emerald"?$="status-badge status-badge-emerald":x==="amber"?$="status-badge status-badge-amber":x==="crimson"&&($="status-badge status-badge-crimson"),d.type,`
            <article class="list-item facility-card-compact" data-facility="${d.id}">
              <div class="flex-1 min-w-0">
                <div class="flex items-start justify-between gap-3">
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2 mb-1">
                      <span class="text-sm font-semibold text-gray-900">${p(d.name)}</span>
                      <span class="${$}">${p(d.shortName)}</span>
                    </div>
                    <p class="text-sm text-gray-500 truncate">${p(d.address)}</p>
                  </div>
                  ${l&&l.isLive?`
                    <span class="flex items-center gap-1 text-xs text-emerald-600 font-medium whitespace-nowrap">
                      <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      Live
                    </span>
                  `:""}
                </div>
                
                <div class="flex flex-wrap gap-1.5 mt-2">
                  ${d.permits.map(Oe=>`
                    <span class="px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-700">${p(Oe)}</span>
                  `).join("")}
                </div>
                
                <div class="mt-3">
                  <div class="flex items-center justify-between mb-1">
                    <span class="text-sm font-medium text-gray-900">${p(L)}</span>
                    ${C?'<span class="text-xs text-gray-500">'+p(C)+"</span>":""}
                  </div>
                  ${l&&l.type==="garage"?`
                    <div class="progress-bar">
                      <div class="progress-fill progress-${x}" style="width: ${l.percentage}%"></div>
                    </div>
                    ${l.lastUpdated?'<p class="text-xs text-gray-400 mt-1">Updated '+f(new Date(l.lastUpdated).getTime())+"</p>":""}
                  `:""}
                </div>
                
                ${Pe&&S?`
                  <div class="mt-2 p-2 bg-amber-50 border border-amber-200 rounded-lg">
                    <div class="flex items-start gap-2">
                      <svg class="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                      </svg>
                      <div class="flex-1 min-w-0">
                        <p class="text-xs font-medium text-amber-800">${p(S.issueType.replace("_"," "))}</p>
                        ${S.note?'<p class="text-xs text-amber-700 mt-0.5">'+p(S.note)+"</p>":""}
                        <p class="text-xs text-amber-600 mt-1">${f(S.timestamp)}</p>
                      </div>
                    </div>
                  </div>
                `:""}
              </div>
              
              <div class="flex flex-col items-end gap-2 ml-4">
                <button
                  type="button"
                  data-directions="${d.id}"
                  class="btn-ghost text-xs px-3 py-1.5 whitespace-nowrap"
                  aria-label="Get directions to ${p(d.name)}"
                >
                  <svg class="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z"/>
                  </svg>
                  Directions
                </button>
                <button
                  type="button"
                  data-report="${d.id}"
                  class="btn-ghost text-xs px-3 py-1.5 whitespace-nowrap text-amber-600 hover:bg-amber-50"
                  aria-label="Report issue at ${p(d.name)}"
                >
                  <svg class="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                  </svg>
                  Report
                </button>
                <button
                  type="button"
                  data-save-spot="${d.id}"
                  class="btn-ghost text-xs px-3 py-1.5 whitespace-nowrap text-csu-green"
                  aria-label="Save parking spot at ${p(d.name)}"
                >
                  <svg class="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"/>
                  </svg>
                  Save Spot
                </button>
              </div>
            </article>
          `}).join("")}
      </div>
    </div>
  `}function gt({facilities:e,availabilityData:t,activeReports:a,onDirectionsClick:n,onReportClick:r,onSaveSpotClick:o}){return`
    <div class="h-[calc(100vh-280px)] min-h-[400px] relative">
      <div id="map-container" class="absolute inset-0 bg-gray-200 relative">
        ${e.map(u=>u.coordinates).filter(Boolean).length>0?`
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
            ${e.map((u,g)=>{var I;const f=t[u.id],d=f?ft(f):null,h=d?vt(d.status):"gray",l=((I=a[u.id])==null?void 0:I.length)>0,x=bt(u.coordinates,e);return`
                <button
                  type="button"
                  data-facility="${u.id}"
                  class="map-pin pointer-events-auto animate-slide-up"
                  style="left: ${x.x}%; top: ${x.y}%; z-index: ${10+g}"
                  aria-label="${p(u.name)} - ${d?d.text:"Loading"}"
                >
                  <div class="pin-marker pin-${h} ${l?"pin-has-report":""}">
                    <span class="pin-label">${p(u.shortName)}</span>
                    ${l?'<span class="pin-report-dot"></span>':""}
                  </div>
                  <div class="pin-tooltip">
                    <div class="pin-tooltip-content">
                      <p class="font-semibold text-gray-900">${p(u.name)}</p>
                      <p class="text-xs text-gray-500">${d?d.text:"Loading..."}</p>
                      <div class="flex gap-2 mt-2 pt-2 border-t border-gray-100">
                        <button data-directions="${u.id}" class="pin-btn">Directions</button>
                        <button data-report="${u.id}" class="pin-btn pin-btn-warning">Report</button>
                        <button data-save-spot="${u.id}" class="pin-btn pin-btn-primary">Save Spot</button>
                      </div>
                    </div>
                  </div>
                </button>
              `}).join("")}
          </div>
        `:`
          <div class="w-full h-full flex items-center justify-center bg-gray-100">
            <p class="text-gray-500">No facilities to display on map</p>
          </div>
        `}
      </div>
      
      <div class="absolute bottom-4 left-4 right-4 md:left-auto md:right-4 md:bottom-4 md:w-48">
        <div class="bg-white rounded-lg shadow-lg p-3 border border-gray-200">
          <p class="text-xs font-semibold text-gray-900 mb-2">Availability</p>
          <div class="space-y-1.5">
            ${["emerald","amber","crimson","gray"].map(u=>{const g={emerald:"Open",amber:"Filling Fast",crimson:"Full",gray:"Unknown"};return`
                <div class="flex items-center gap-2">
                  <div class="w-3 h-3 rounded-full ${ht(u)}"></div>
                  <span class="text-xs text-gray-600">${g[u]}</span>
                </div>
              `}).join("")}
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
  `}function ft(e){if(e.type==="garage"){const t=Math.round(e.spacesAvailable/e.maxCapacity*100);let a;return t>=20?a="Open":t>0?a="Filling Fast":a="Full",{text:e.spacesAvailable+"/"+e.maxCapacity,status:a,percentage:t}}else return{text:e.status,status:e.status}}function vt(e){return e==="Open"?"emerald":e==="Filling Fast"?"amber":e==="Full"||e==="Closed"?"crimson":"gray"}function ht(e){return{emerald:"bg-emerald-500",amber:"bg-amber-500",crimson:"bg-red-500",gray:"bg-gray-400"}[e]||"bg-gray-400"}function bt(e,t){if(!e)return{x:50,y:50};const a=t.map(l=>l.coordinates).filter(Boolean),n=a.map(l=>l.lat),r=a.map(l=>l.lng),o=Math.min(...n),i=Math.max(...n),c=Math.min(...r),u=Math.max(...r),g=i-o||.01,f=u-c||.01,d=(e.lng-c)/f*80+10,h=(i-e.lat)/g*80+10;return{x:d,y:h}}function xt({onClose:e}){return`
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
              ${Object.entries(H).filter(([t])=>t!==s.VISITOR).map(([t,a])=>`
                <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-lg flex items-center justify-center" style="background: ${ue(t)}20;">
                      <div class="w-5 h-5 rounded" style="background: ${ue(t)};"></div>
                    </div>
                    <div>
                      <p class="font-medium text-gray-900">${p(a.name)}</p>
                      <p class="text-xs text-gray-500">Per ${a.period}</p>
                    </div>
                  </div>
                  <span class="text-lg font-bold text-csu-green">$${a.price}</span>
                </div>
              `).join("")}
            </div>
          </div>
          
          <div class="border-t border-gray-200 pt-4">
            <h3 class="text-sm font-semibold text-gray-900 mb-4">Visitor & Hourly Parking</h3>
            <div class="p-4 bg-gray-50 rounded-lg">
              <div class="flex items-center justify-between">
                <div>
                  <p class="font-medium text-gray-900">${p(H[s.VISITOR].name)}</p>
                  <p class="text-xs text-gray-500">Text2Park zones available at all surface lots</p>
                </div>
                <span class="text-lg font-bold text-csu-green">${p(H[s.VISITOR].priceRange)}</span>
              </div>
            </div>
          </div>
          
          <div class="border-t border-gray-200 pt-4">
            <h3 class="text-sm font-semibold text-gray-900 mb-4">Official Resources</h3>
            <div class="space-y-2">
              <a 
                href="${q.buyPermits}" 
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
                href="${q.permitRules}" 
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
                href="${q.visitorInfo}" 
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
              <li class="flex items-start gap-2">• Green permits valid in all garages and surface lots</li>
              <li class="flex items-start gap-2">• White permits valid in Central, West, South, East garages</li>
              <li class="flex items-start gap-2">• Evening permits valid after 3:30 PM</li>
              <li class="flex items-start gap-2">• Night permits valid after 5:30 PM</li>
              <li class="flex items-start gap-2">• ADA spaces available in all facilities with valid placard</li>
              <li class="flex items-start gap-2">• Rates subject to change; check CSU website for current pricing</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  `}function ue(e){return{Green:"#006A4E",White:"#6B7280",Evening:"#F59E0B",Night:"#8B5CF6",ADA:"#DC2626",Visitor:"#3B82F6"}[e]||"#6B7280"}function yt({facilityId:e,onClose:t,onSubmit:a}){const n=M(e),r=ze(),o=We(),i=Math.ceil(o/6e4);return`
    <div class="modal-overlay" data-modal="report" role="dialog" aria-modal="true" aria-labelledby="report-title">
      <div class="modal-content animate-slide-up max-w-md">
        <div class="modal-handle" aria-hidden="true"></div>
        
        <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 id="report-title" class="text-lg font-semibold text-gray-900">Report Issue</h2>
          <button 
            type="button" 
            data-modal-close="report"
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
            <label class="input-label">Location</label>
            ${n?`
              <div class="p-4 bg-csu-green/5 border border-csu-green/20 rounded-lg">
                <p class="font-medium text-csu-green">${p(n.name)}</p>
                <p class="text-sm text-gray-500 mt-0.5">${p(n.address)}</p>
                <input type="hidden" name="facilityId" value="${n.id}">
              </div>
            `:`
              <select name="facilityId" class="input-field" required>
                <option value="">Select garage or lot...</option>
                ${b.map(c=>`
                  <option value="${c.id}">${p(c.name)} (${p(c.shortName)})</option>
                `).join("")}
              </select>
            `}
          </div>
          
          <div>
            <label class="input-label">Issue Type</label>
            <div class="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Select issue type">
              ${Fe.map(c=>`
                <button
                  type="button"
                  data-issue="${c.id}"
                  class="issue-option p-4 border-2 border-gray-200 rounded-lg text-left hover:border-csu-green/50 transition-colors"
                  role="radio"
                  aria-checked="false"
                >
                  <div class="flex items-center gap-2 mb-1">
                    <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${wt(c.id)}"/>
                    </svg>
                    <span class="font-medium text-gray-900">${p(c.label)}</span>
                  </div>
                  <p class="text-xs text-gray-500">${kt(c.id)}</p>
                </button>
              `).join("")}
            </div>
            <input type="hidden" name="issueType" id="selected-issue" required>
          </div>
          
          <div>
            <label class="input-label">Additional Details (optional)</label>
            <textarea
              name="note"
              id="report-note"
              maxlength="140"
              rows="3"
              class="input-field resize-none"
              placeholder="Brief description (max 140 characters)..."
              aria-label="Issue details"
            ></textarea>
            <div class="flex justify-end mt-1">
              <span id="char-count" class="text-xs text-gray-400">0/140</span>
            </div>
          </div>
          
          ${r?`
            <div class="p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <div class="flex items-center gap-2 text-amber-800">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <span class="text-sm">Please wait ${i} minute${i!==1?"s":""} before submitting another report</span>
              </div>
            </div>
          `:""}
          
          <div class="pt-2">
            <button
              type="button"
              id="submit-report"
              class="btn-primary"
              ${r?"disabled":""}
            >
              Submit Report
            </button>
            <p class="text-xs text-gray-500 text-center mt-2">
              Anonymous • No login required • Reports expire after 60 minutes
            </p>
          </div>
        </div>
      </div>
    </div>
    
    <script>
      (function() {
        const modal = document.querySelector('[data-modal="report"]');
        if (!modal) return;
        
        let selectedIssue = null;
        const noteInput = modal.querySelector('#report-note');
        const charCount = modal.querySelector('#char-count');
        const submitBtn = modal.querySelector('#submit-report');
        const facilityInput = modal.querySelector('input[name="facilityId"], select[name="facilityId"]');
        const issueInput = modal.querySelector('#selected-issue');
        
        modal.querySelectorAll('[data-issue]').forEach(btn => {
          btn.addEventListener('click', () => {
            selectedIssue = btn.dataset.issue;
            modal.querySelectorAll('[data-issue]').forEach(b => {
              b.classList.remove('border-csu-green', 'bg-csu-green/5');
              b.setAttribute('aria-checked', 'false');
            });
            btn.classList.add('border-csu-green', 'bg-csu-green/5');
            btn.setAttribute('aria-checked', 'true');
            issueInput.value = selectedIssue;
            updateSubmitButton();
          });
        });
        
        noteInput.addEventListener('input', () => {
          charCount.textContent = noteInput.value.length + '/140';
        });
        
        submitBtn.addEventListener('click', async () => {
          if (!selectedIssue) return;
          
          const facilityId = facilityInput.value;
          const note = noteInput.value.trim();
          
          submitBtn.disabled = true;
          submitBtn.textContent = 'Submitting...';
          
          const result = await submitReport({ facilityId, issueType: selectedIssue, note });
          
          if (result.success) {
            vibrate([50, 50, 50]);
            onSubmit();
          } else {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Submit Report';
            alert(result.error || 'Failed to submit report');
          }
        });
        
        function updateSubmitButton() {
          submitBtn.disabled = !selectedIssue || ${r};
        }
        
        updateSubmitButton();
      })();
    <\/script>
  `}function wt(e){const t={lot_full:"M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z",gate_broken:"M10 19l-7-7m0 0l7-7m-7 7h18",blocked_space:"M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z",pay_station_down:"M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2h2",event_closure:"M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"};return t[e]||t.lot_full}function kt(e){return{lot_full:"No spaces available",gate_broken:"Entry/exit gate malfunction",blocked_space:"Vehicle or object blocking spot",pay_station_down:"Payment kiosk not working",event_closure:"Closed for special event"}[e]||""}function St({savedSpot:e,onClearSpot:t,getTimerStatus:a,getDirectionsUrl:n}){if(!e)return`
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
    `;const r=a(),o=n(e);return`
    <div class="bottom-bar" id="spot-saver-bar">
      <div class="max-w-md mx-auto">
        <div class="bg-csu-green/5 border border-csu-green/20 rounded-lg p-4">
          <div class="flex items-start justify-between gap-3 mb-3">
            <div class="flex-1 min-w-0">
              <p class="font-semibold text-csu-green">${p(e.facilityName)}</p>
              <p class="text-sm text-gray-600 mt-0.5">${p(e.locationString)}</p>
              ${e.notes?'<p class="text-xs text-gray-500 mt-1">'+p(e.notes)+"</p>":""}
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
          
          ${r?`
            <div class="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 mb-3">
              <div class="flex items-center gap-2">
                <svg class="w-5 h-5 ${r.expired?"text-red-500":"text-csu-green"}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <span class="font-medium ${r.expired?"text-red-600":"text-gray-900"}">
                  ${r.expired?"Timer Expired":r.formatted}
                </span>
              </div>
              ${r.expired?"":`
                <button
                  type="button"
                  class="btn-ghost text-xs px-3 py-1.5"
                  onclick="document.dispatchEvent(new CustomEvent('extend-timer', { detail: 60 }))"
                >
                  +1 Hour
                </button>
              `}
            </div>
          `:""}
          
          <div class="flex gap-2">
            ${o?`
              <a
                href="${o}"
                target="_blank"
                rel="noopener noreferrer"
                class="flex-1 btn-secondary text-center"
              >
                <svg class="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z"/>
                </svg>
                Directions
              </a>
            `:""}
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
  `}function Ct({facilityId:e,onClose:t,onSave:a}){const n=e?M(e):null,r=G(),o=!!r,i=n||(r?M(r.facilityId):b[0]),c=(r==null?void 0:r.floor)||"",u=(r==null?void 0:r.row)||"",g=(r==null?void 0:r.spot)||"",f=(r==null?void 0:r.notes)||"",d=!!(r!=null&&r.timer),h=r!=null&&r.timer?Math.round(r.timer.duration/6e4):120;return`
    <div class="modal-overlay" data-modal="spot-saver" role="dialog" aria-modal="true" aria-labelledby="spot-saver-title">
      <div class="modal-content animate-slide-up max-w-md">
        <div class="modal-handle" aria-hidden="true"></div>
        
        <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 id="spot-saver-title" class="text-lg font-semibold text-gray-900">${o?"Edit Parking Spot":"Save My Spot"}</h2>
          <button 
            type="button" 
            data-modal-close="spot-saver"
            class="p-2 rounded-lg hover:bg-gray-100 text-gray-500"
            aria-label="Close"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
        
        <form id="spot-saver-form" class="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          <div>
            <label class="input-label">Parking Facility *</label>
            <select name="facilityId" class="input-field" required>
              ${b.map(l=>`
                <option value="${l.id}" ${i.id===l.id?"selected":""}>
                  ${p(l.name)} (${p(l.shortName)})
                </option>
              `).join("")}
            </select>
          </div>
          
          <div class="grid grid-cols-3 gap-3">
            <div>
              <label class="input-label">Floor/Level</label>
              <input
                type="text"
                name="floor"
                value="${p(c)}"
                placeholder="e.g., 3"
                class="input-field"
                maxlength="10"
              >
            </div>
            <div>
              <label class="input-label">Row</label>
              <input
                type="text"
                name="row"
                value="${p(u)}"
                placeholder="e.g., B"
                class="input-field"
                maxlength="5"
              >
            </div>
            <div>
              <label class="input-label">Spot #</label>
              <input
                type="text"
                name="spot"
                value="${p(g)}"
                placeholder="e.g., 12"
                class="input-field"
                maxlength="10"
              >
            </div>
          </div>
          
          <div>
            <label class="input-label">Notes (optional)</label>
            <input
              type="text"
              name="notes"
              value="${p(f)}"
              placeholder="e.g., Near elevator, blue pillar"
              class="input-field"
              maxlength="140"
            >
          </div>
          
          <div class="border-t border-gray-200 pt-4">
            <div class="flex items-center justify-between mb-4">
              <div>
                <p class="font-medium text-gray-900">Parking Timer</p>
                <p class="text-sm text-gray-500">Get reminded before your meter/Text2Park expires</p>
              </div>
              <label class="toggle-switch">
                <input type="checkbox" name="startTimer" id="timer-toggle" ${d?"checked":""}>
                <span class="switch-track">
                  <span class="switch-thumb"></span>
                </span>
              </label>
            </div>
            
            <div id="timer-options" class="space-y-4 ${d?"":"hidden"}">
              <div>
                <label class="input-label">Duration</label>
                <div class="flex items-center gap-3">
                  <button
                    type="button"
                    class="btn-ghost w-12 h-12 p-0"
                    data-timer-adjust="-30"
                    aria-label="Subtract 30 minutes"
                  >
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4"/>
                    </svg>
                  </button>
                  <input
                    type="number"
                    name="durationMinutes"
                    id="duration-input"
                    value="${h}"
                    min="15"
                    max="720"
                    step="15"
                    class="input-field text-center flex-1"
                    aria-label="Timer duration in minutes"
                  >
                  <button
                    type="button"
                    class="btn-ghost w-12 h-12 p-0"
                    data-timer-adjust="30"
                    aria-label="Add 30 minutes"
                  >
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                    </svg>
                  </button>
                </div>
                <p class="text-xs text-gray-500 mt-1 text-center" id="duration-display">
                  ${pe(h)}
                </p>
              </div>
              
              <div class="flex gap-2">
                ${[30,60,120,180,240].map(l=>`
                  <button
                    type="button"
                    class="filter-chip flex-1 ${h===l?"filter-chip-active":""}"
                    data-quick-duration="${l}"
                  >
                    ${pe(l)}
                  </button>
                `).join("")}
              </div>
            </div>
          </div>
          
          <div class="pt-2">
            <button
              type="submit"
              class="btn-primary"
            >
              ${o?"Update Spot":"Save Spot"}
            </button>
          </div>
        </form>
      </div>
    </div>
    
    <script>
      (function() {
        const modal = document.querySelector('[data-modal="spot-saver"]');
        if (!modal) return;
        
        const form = modal.querySelector('#spot-saver-form');
        const timerToggle = modal.querySelector('#timer-toggle');
        const timerOptions = modal.querySelector('#timer-options');
        const durationInput = modal.querySelector('#duration-input');
        const durationDisplay = modal.querySelector('#duration-display');
        
        timerToggle.addEventListener('change', () => {
          timerOptions.classList.toggle('hidden', !timerToggle.checked);
        });
        
        modal.querySelectorAll('[data-timer-adjust]').forEach(btn => {
          btn.addEventListener('click', () => {
            const adjust = parseInt(btn.dataset.timerAdjust, 10);
            let newVal = parseInt(durationInput.value, 10) + adjust;
            newVal = Math.max(15, Math.min(720, newVal));
            newVal = Math.round(newVal / 15) * 15;
            durationInput.value = newVal;
            updateDurationDisplay();
          });
        });
        
        modal.querySelectorAll('[data-quick-duration]').forEach(btn => {
          btn.addEventListener('click', () => {
            const val = parseInt(btn.dataset.quickDuration, 10);
            durationInput.value = val;
            updateDurationDisplay();
            modal.querySelectorAll('[data-quick-duration]').forEach(b => {
              b.classList.toggle('filter-chip-active', parseInt(b.dataset.quickDuration, 10) === val);
            });
          });
        });
        
        durationInput.addEventListener('input', updateDurationDisplay);
        
        function updateDurationDisplay() {
          const val = parseInt(durationInput.value, 10) || 0;
          durationDisplay.textContent = formatDuration(val);
        }
        
        function formatDuration(minutes) {
          const hours = Math.floor(minutes / 60);
          const mins = minutes % 60;
          if (hours > 0 && mins > 0) return hours + 'h ' + mins + 'm';
          if (hours > 0) return hours + 'h';
          return mins + 'm';
        }
        
        form.addEventListener('submit', async (e) => {
          e.preventDefault();
          
          const formData = new FormData(form);
          const facilityId = formData.get('facilityId');
          const floor = formData.get('floor') || null;
          const row = formData.get('row') || null;
          const spot = formData.get('spot') || null;
          const notes = formData.get('notes') || '';
          const startTimer = timerToggle.checked;
          const durationMinutes = startTimer ? parseInt(durationInput.value, 10) : 0;
          
          const submitBtn = form.querySelector('button[type="submit"]');
          submitBtn.disabled = true;
          submitBtn.textContent = 'Saving...';
          
          try {
            saveSpot({ facilityId, floor, row, spot, notes, startTimer, durationMinutes });
            vibrate([50, 50]);
            onSave();
          } catch (error) {
            submitBtn.disabled = false;
            submitBtn.textContent = isEditing ? 'Update Spot' : 'Save Spot';
            alert('Failed to save spot');
          }
        });
        
        modal.addEventListener('click', (e) => {
          if (e.target === modal) onClose();
        });
      })();
    <\/script>
  `}function pe(e){const t=Math.floor(e/60),a=e%60;return t>0&&a>0?t+"h "+a+"m":t>0?t+"h":a+"m"}let Y="list",P="All",se=!1,O="",A=[...b],D={},y={},K=null,B=!1,oe=!1,ne=null,_=!1,V=null;const ie=it(Le,100);function Le(){let e=[...b];if(O.trim()){const t=O.toLowerCase().trim();e=e.filter(a=>a.name.toLowerCase().includes(t)||a.shortName.toLowerCase().includes(t)||a.address.toLowerCase().includes(t)||a.text2ParkZone.toLowerCase().includes(t))}P!=="All"&&(e=e.filter(t=>t.permits.includes(P))),se&&(e=e.filter(t=>{const a=D[t.id];return a?a.type==="garage"?a.spacesAvailable>0:a.status!=="Full"&&a.status!=="Closed":!0})),A=e,v()}function $e(e){P=e,ie()}function Ae(e){se=e,ie()}function Me(e){O=e,ie()}function Re(e){Y=e,v()}function J(e){U([50]),nt(e.coordinates.lat,e.coordinates.lng,e.name)}function X(e){U([50]),ne=e,oe=!0,v()}function j(){oe=!1,ne=null,v()}function E(){B=!B,v()}function Q(e){U([50]),V=e,_=!0,v()}function ee(){_=!1,V=null,v()}function Et(){_=!1,V=null,v()}function Ne(){et(),v()}async function Te(){U([50]),await he()}function It(){fe(e=>{D=e,v()}),qe(e=>{y={},e.forEach(t=>{y[t.facilityId]||(y[t.facilityId]=[]),y[t.facilityId].push(t)}),v()}),Qe(e=>{K=e,v()})}function v(){const e=document.getElementById("app"),t=dt({onPermitsClick:E,onRefreshClick:Te,permitsOpen:B}),a=ut({selectedPermit:P,onPermitChange:$e,showOpenOnly:se,onOpenOnlyChange:Ae,searchQuery:O,onSearchChange:Me,currentView:Y,onViewChange:Re,facilityCount:A.length,totalCount:b.length});let n;Y==="map"?n=gt({facilities:A,availabilityData:D,activeReports:y,onDirectionsClick:J,onReportClick:X,onSaveSpotClick:Q}):n=mt({facilities:A,availabilityData:D,activeReports:y,onDirectionsClick:J,onReportClick:X,onSaveSpotClick:Q,formatAvailability:be,getStatusBadgeVariant:xe,hasActiveReports:o=>Ze(o),getLatestReportForFacility:Ye,formatTimeAgo:Ke});const r=St({savedSpot:K?tt(K,o=>b.find(i=>i.id===o)):null,onClearSpot:Ne,getTimerStatus:Ie,getDirectionsUrl:at});e.innerHTML=`
    <div class="min-h-screen bg-gray-50 flex flex-col">
      ${t}
      ${a}
      <main class="flex-1 overflow-auto pb-24">
        ${n}
      </main>
      ${r}
      ${B?xt({onClose:E}):""}
      ${oe?yt({facilityId:ne,onClose:j,onSubmit:()=>{j()}}):""}
      ${_?Ct({facilityId:V,onClose:ee,onSave:Et}):""}
    </div>
  `,Lt()}function Lt(){const e=document.getElementById("permits-btn");e&&(e.onclick=E);const t=document.getElementById("refresh-btn");t&&(t.onclick=Te),document.querySelectorAll("[data-permit]").forEach(o=>{o.onclick=()=>$e(o.dataset.permit)});const a=document.getElementById("open-only-toggle");a&&(a.onchange=o=>Ae(o.target.checked));const n=document.getElementById("search-input");n&&(n.oninput=o=>Me(o.target.value)),document.querySelectorAll("[data-view]").forEach(o=>{o.onclick=()=>Re(o.dataset.view)}),document.querySelectorAll("[data-directions]").forEach(o=>{o.onclick=()=>{const i=o.dataset.directions,c=b.find(u=>u.id===i);c&&J(c)}}),document.querySelectorAll("[data-report]").forEach(o=>{o.onclick=()=>X(o.dataset.report)}),document.querySelectorAll("[data-save-spot]").forEach(o=>{o.onclick=()=>Q(o.dataset.saveSpot)});const r=document.getElementById("clear-spot-btn");r&&(r.onclick=Ne),document.querySelectorAll("[data-modal-close]").forEach(o=>{o.onclick=()=>{const i=o.dataset.modalClose;i==="permits"?E():i==="report"?j():i==="spot-saver"&&ee()}}),document.querySelectorAll(".modal-overlay").forEach(o=>{o.onclick=i=>{if(i.target===o){const c=o.dataset.modal;c==="permits"?E():c==="report"?j():c==="spot-saver"&&ee()}}})}function $t(){It(),Le(),v()}ve(3e4);setInterval(re,5*60*1e3);lt(e=>{console.log("App is now "+(e?"online":"offline")),e&&je(async()=>{const{triggerRefresh:t}=await Promise.resolve().then(()=>_e);return{triggerRefresh:t}},void 0).then(({triggerRefresh:t})=>{t()})});$t();"serviceWorker"in navigator&&window.addEventListener("load",()=>{navigator.serviceWorker.register("/sw.js").catch(()=>{})});
