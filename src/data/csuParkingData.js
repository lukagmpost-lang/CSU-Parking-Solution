/**
 * CSU Campus Parking Data - Single Source of Truth
 */

export const PERMIT_TYPES = {
  GREEN: 'Green',
  WHITE: 'White',
  EVENING: 'Evening',
  NIGHT: 'Night',
  ADA: 'ADA',
  VISITOR: 'Visitor',
};

export const PERMIT_COLORS = {
  [PERMIT_TYPES.GREEN]: '#006A4E',
  [PERMIT_TYPES.WHITE]: '#6B7280',
  [PERMIT_TYPES.EVENING]: '#F59E0B',
  [PERMIT_TYPES.NIGHT]: '#8B5CF6',
  [PERMIT_TYPES.ADA]: '#DC2626',
  [PERMIT_TYPES.VISITOR]: '#3B82F6',
};

export const STATUS_TYPES = {
  OPEN: 'Available',
  FILLING_FAST: 'Filling Fast',
  FULL: 'Full',
  CLOSED: 'Closed',
};

export const ISSUE_TYPES = [
  { id: 'lot_full', label: 'Lot Full', icon: 'alert-triangle' },
  { id: 'gate_broken', label: 'Gate Broken', icon: 'gate' },
  { id: 'blocked_space', label: 'Blocked Space', icon: 'car' },
  { id: 'pay_station_down', label: 'Pay Station Down', icon: 'credit-card' },
  { id: 'event_closure', label: 'Event Closure', icon: 'calendar-x' },
];

// Gated Garages with Live Space Count Support
export const GATED_GARAGES = [
  {
    id: 'cg',
    name: 'Central Garage',
    shortName: 'CG',
    type: 'garage',
    maxCapacity: 785,
    permits: [PERMIT_TYPES.WHITE, PERMIT_TYPES.GREEN, PERMIT_TYPES.VISITOR, PERMIT_TYPES.ADA],
    address: '2121 Euclid Ave, Cleveland, OH 44115',
    coordinates: { lat: 41.5012, lng: -81.6745 },
    text2ParkZone: 'CSU-CG',
    hasLiveCount: true,
    floors: 8,
    hourlyRate: 4,
    dailyMax: 24,
  },
  {
    id: 'wg',
    name: 'West Garage',
    shortName: 'WG',
    type: 'garage',
    maxCapacity: 530,
    permits: [PERMIT_TYPES.WHITE, PERMIT_TYPES.GREEN, PERMIT_TYPES.VISITOR, PERMIT_TYPES.ADA],
    address: '1983 E 24th St, Cleveland, OH 44115',
    coordinates: { lat: 41.5008, lng: -81.6782 },
    text2ParkZone: 'CSU-WG',
    hasLiveCount: true,
    floors: 6,
    hourlyRate: 4,
    dailyMax: 24,
  },
  {
    id: 'sg',
    name: 'South Garage',
    shortName: 'SG',
    type: 'garage',
    maxCapacity: 530,
    permits: [PERMIT_TYPES.WHITE, PERMIT_TYPES.GREEN, PERMIT_TYPES.VISITOR, PERMIT_TYPES.ADA],
    address: '2001 E 22nd St, Cleveland, OH 44115',
    coordinates: { lat: 41.4985, lng: -81.6760 },
    text2ParkZone: 'CSU-SG',
    hasLiveCount: true,
    floors: 6,
    hourlyRate: 4,
    dailyMax: 24,
  },
  {
    id: 'eg',
    name: 'East Garage',
    shortName: 'EG',
    type: 'garage',
    maxCapacity: 350,
    permits: [PERMIT_TYPES.WHITE, PERMIT_TYPES.GREEN, PERMIT_TYPES.VISITOR, PERMIT_TYPES.ADA],
    address: '2250 Euclid Ave, Cleveland, OH 44115',
    coordinates: { lat: 41.5020, lng: -81.6710 },
    text2ParkZone: 'CSU-EG',
    hasLiveCount: true,
    floors: 5,
    hourlyRate: 4,
    dailyMax: 24,
  },
  {
    id: 'pg',
    name: 'Prospect Garage',
    shortName: 'PG',
    type: 'garage',
    maxCapacity: 230,
    permits: [PERMIT_TYPES.GREEN, PERMIT_TYPES.VISITOR, PERMIT_TYPES.ADA],
    address: '1900 Prospect Ave, Cleveland, OH 44115',
    coordinates: { lat: 41.5000, lng: -81.6735 },
    text2ParkZone: 'CSU-PG',
    hasLiveCount: true,
    floors: 4,
    hourlyRate: 4,
    dailyMax: 24,
  },
];

// Surface Lots (Status & Text2Park Enabled)
export const SURFACE_LOTS = [
  {
    id: 'lot21',
    name: 'Lot 21',
    shortName: 'Lot 21',
    type: 'surface',
    maxCapacity: 180,
    permits: [PERMIT_TYPES.GREEN, PERMIT_TYPES.EVENING, PERMIT_TYPES.NIGHT, PERMIT_TYPES.ADA, PERMIT_TYPES.VISITOR],
    address: 'E 21st St & Chester Ave, Cleveland, OH 44115',
    coordinates: { lat: 41.5015, lng: -81.6770 },
    text2ParkZone: 'CSU21',
    hasLiveCount: false,
    hourlyRate: 3,
    dailyMax: 18,
  },
  {
    id: 'lot22',
    name: 'Lot 22',
    shortName: 'Lot 22',
    type: 'surface',
    maxCapacity: 150,
    permits: [PERMIT_TYPES.GREEN, PERMIT_TYPES.EVENING, PERMIT_TYPES.NIGHT, PERMIT_TYPES.ADA, PERMIT_TYPES.VISITOR],
    address: 'E 22nd St & Chester Ave, Cleveland, OH 44115',
    coordinates: { lat: 41.5010, lng: -81.6755 },
    text2ParkZone: 'CSU22',
    hasLiveCount: false,
    hourlyRate: 3,
    dailyMax: 18,
  },
  {
    id: 'lot40',
    name: 'Lot 40',
    shortName: 'Lot 40',
    type: 'surface',
    maxCapacity: 200,
    permits: [PERMIT_TYPES.GREEN, PERMIT_TYPES.EVENING, PERMIT_TYPES.NIGHT, PERMIT_TYPES.ADA, PERMIT_TYPES.VISITOR],
    address: 'E 18th St & Euclid Ave, Cleveland, OH 44115',
    coordinates: { lat: 41.5030, lng: -81.6740 },
    text2ParkZone: 'CSU40',
    hasLiveCount: false,
    hourlyRate: 3,
    dailyMax: 18,
  },
  {
    id: 'lot54',
    name: 'Lot 54',
    shortName: 'Lot 54',
    type: 'surface',
    maxCapacity: 120,
    permits: [PERMIT_TYPES.GREEN, PERMIT_TYPES.EVENING, PERMIT_TYPES.NIGHT, PERMIT_TYPES.ADA, PERMIT_TYPES.VISITOR],
    address: 'E 24th St & Payne Ave, Cleveland, OH 44114',
    coordinates: { lat: 41.5005, lng: -81.6790 },
    text2ParkZone: 'CSU54',
    hasLiveCount: false,
    hourlyRate: 3,
    dailyMax: 18,
  },
  {
    id: 'lot65',
    name: 'Lot 65 / Rec Garage',
    shortName: 'Lot 65',
    type: 'surface',
    maxCapacity: 300,
    permits: [PERMIT_TYPES.GREEN, PERMIT_TYPES.EVENING, PERMIT_TYPES.NIGHT, PERMIT_TYPES.ADA, PERMIT_TYPES.VISITOR],
    address: '2420 Chester Ave, Cleveland, OH 44115',
    coordinates: { lat: 41.5025, lng: -81.6720 },
    text2ParkZone: 'CSU65',
    hasLiveCount: false,
    hourlyRate: 3,
    dailyMax: 18,
  },
  {
    id: 'lot66',
    name: 'Lot 66',
    shortName: 'Lot 66',
    type: 'surface',
    maxCapacity: 100,
    permits: [PERMIT_TYPES.GREEN, PERMIT_TYPES.EVENING, PERMIT_TYPES.NIGHT, PERMIT_TYPES.ADA, PERMIT_TYPES.VISITOR],
    address: 'E 26th St & Chester Ave, Cleveland, OH 44115',
    coordinates: { lat: 41.5022, lng: -81.6705 },
    text2ParkZone: 'CSU66',
    hasLiveCount: false,
    hourlyRate: 3,
    dailyMax: 18,
  },
  {
    id: 'lot70',
    name: 'Lot 70',
    shortName: 'Lot 70',
    type: 'surface',
    maxCapacity: 80,
    permits: [PERMIT_TYPES.GREEN, PERMIT_TYPES.EVENING, PERMIT_TYPES.NIGHT, PERMIT_TYPES.ADA, PERMIT_TYPES.VISITOR],
    address: 'E 17th St & Euclid Ave, Cleveland, OH 44115',
    coordinates: { lat: 41.5035, lng: -81.6750 },
    text2ParkZone: 'CSU70',
    hasLiveCount: false,
    hourlyRate: 3,
    dailyMax: 18,
  },
];

export const ALL_FACILITIES = [...GATED_GARAGES, ...SURFACE_LOTS];

export const PERMIT_PRICING = {
  [PERMIT_TYPES.WHITE]: { name: 'White Commuter Permit', price: 192, period: 'semester' },
  [PERMIT_TYPES.GREEN]: { name: 'Green Commuter Permit', price: 278, period: 'semester' },
  [PERMIT_TYPES.EVENING]: { name: 'Evening Permit (after 3:30 PM)', price: 191, period: 'semester' },
  [PERMIT_TYPES.NIGHT]: { name: 'Night Permit (after 5:30 PM)', price: 174, period: 'semester' },
  [PERMIT_TYPES.ADA]: { name: 'ADA Accessible Permit', price: 0, period: 'semester' },
  [PERMIT_TYPES.VISITOR]: { name: 'Visitor Pay-on-Exit / Text2Park', priceRange: '$3–$4/hr', period: 'hourly' },
};

export const EXTERNAL_LINKS = {
  buyPermits: 'https://csuohio.edu/parking/permits',
  permitRules: 'https://csuohio.edu/parking/rules',
  visitorInfo: 'https://csuohio.edu/parking/visitors',
};

export function getFacilityById(id) {
  return ALL_FACILITIES.find(f => f.id === id);
}

export function getFacilitiesByPermit(permitType) {
  if (permitType === 'All') return ALL_FACILITIES;
  return ALL_FACILITIES.filter(f => f.permits.includes(permitType));
}

export function getFacilitiesByType(type) {
  return ALL_FACILITIES.filter(f => f.type === type);
}

export function getGarages() {
  return GATED_GARAGES;
}

export function getSurfaceLots() {
  return SURFACE_LOTS;
}

export const PERMIT_RULES = {
  [PERMIT_TYPES.GREEN]: {
    name: 'Green Commuter',
    timeRestriction: null,
    validFacilities: 'all',
    description: 'All garages & surface lots, anytime',
  },
  [PERMIT_TYPES.WHITE]: {
    name: 'White Commuter',
    timeRestriction: null,
    validFacilities: 'garages',
    description: 'Garages only, anytime',
  },
  [PERMIT_TYPES.EVENING]: {
    name: 'Evening Permit',
    timeRestriction: { start: 15.5, end: 24 },
    validFacilities: 'surface',
    description: 'Surface lots only, after 3:30 PM',
  },
  [PERMIT_TYPES.NIGHT]: {
    name: 'Night Permit',
    timeRestriction: { start: 17.5, end: 24 },
    validFacilities: 'surface',
    description: 'Surface lots only, after 5:30 PM',
  },
  [PERMIT_TYPES.ADA]: {
    name: 'ADA Permit',
    timeRestriction: null,
    validFacilities: 'all',
    description: 'All facilities with valid ADA placard',
  },
  [PERMIT_TYPES.VISITOR]: {
    name: 'Visitor / Hourly',
    timeRestriction: null,
    validFacilities: 'all',
    description: 'Hourly rate, all facilities',
  },
};