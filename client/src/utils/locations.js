/**
 * Drivo Supported Pickup & Return Stations
 * Exclusively Serving Kanniyakumari District, Tamil Nadu, India.
 */

export const SERVICE_DISTRICT = 'Kanniyakumari';
export const SERVICE_STATE = 'Tamil Nadu';
export const SERVICE_NOTICE = 'Currently serving Kanniyakumari district only.';
export const UNSUPPORTED_LOCATION_ERROR = 'Sorry, Drivo currently provides car rental services only within Kanniyakumari district.';

export const KANNIYAKUMARI_LOCALITIES = [
  'Nagercoil',
  'Kanyakumari',
  'Marthandam',
  'Thuckalay',
  'Kuzhithurai',
  'Colachel',
  'Padmanabhapuram',
  'Karungal',
  'Kulasekharam',
  'Suchindram',
  'Boothapandi',
  'Eraniel',
];

const OUTSIDE_LOCATIONS = new Set([
  'chennai', 'coimbatore', 'bengaluru', 'bangalore', 'mumbai', 'delhi', 'hyderabad',
  'kochi', 'cochin', 'madurai', 'tirunelveli', 'trivandrum', 'thiruvananthapuram',
  'salem', 'trichy', 'tiruchirappalli', 'pune', 'kolkata', 'goa', 'mysore', 'mysuru'
]);

export const CITY_COORDINATES = {
  Kanniyakumari: { lat: 8.1833, lng: 77.4119, zoom: 11 },
  Nagercoil: { lat: 8.1833, lng: 77.4119, zoom: 12 },
  Kanyakumari: { lat: 8.0810, lng: 77.5510, zoom: 13 },
  Marthandam: { lat: 8.3040, lng: 77.2205, zoom: 12 },
  Thuckalay: { lat: 8.2505, lng: 77.3240, zoom: 12 },
  Kuzhithurai: { lat: 8.3180, lng: 77.1950, zoom: 12 },
  Colachel: { lat: 8.1780, lng: 77.2560, zoom: 12 },
  Padmanabhapuram: { lat: 8.2510, lng: 77.3275, zoom: 13 },
  Karungal: { lat: 8.2320, lng: 77.2340, zoom: 12 },
  Kulasekharam: { lat: 8.3610, lng: 77.2940, zoom: 12 },
  Suchindram: { lat: 8.1560, lng: 77.4650, zoom: 13 },
  Boothapandi: { lat: 8.2610, lng: 77.4560, zoom: 12 },
  Eraniel: { lat: 8.2050, lng: 77.3070, zoom: 12 },
};

export const SUPPORTED_LOCATIONS = [
  // --- Nagercoil ---
  {
    id: 'ncj-junction',
    name: 'Nagercoil Junction Railway Station',
    city: 'Nagercoil',
    locality: 'Nagercoil',
    district: 'Kanniyakumari',
    type: 'railway',
    tag: 'Railway Station',
    address: 'Railway Feeder Road, Kottar, Nagercoil, Kanniyakumari District, Tamil Nadu - 629002',
    lat: 8.1754,
    lng: 77.4395,
    hours: '24 Hours / 7 Days',
    phone: '+91 4652 240 231',
    instructions: 'Drivo Welcome Kiosk located at Main Concourse Commercial Valet Bay. Fast biometric check and vehicle handover.',
    landmark: 'Opposite Kottar Police Station / Main Concourse Entry',
  },
  {
    id: 'ncj-vadasery',
    name: 'Nagercoil Vadasery Central Hub',
    city: 'Nagercoil',
    locality: 'Nagercoil',
    district: 'Kanniyakumari',
    type: 'city',
    tag: 'Flagship District Hub',
    address: 'Christopher Bus Stand Road, Vadasery, Nagercoil, Kanniyakumari District, Tamil Nadu - 629001',
    lat: 8.1925,
    lng: 77.4287,
    hours: '06:00 AM – 11:00 PM',
    phone: '+91 4652 232 450',
    instructions: 'Drivo Central District Hub. Ground floor reception lounge with digital vehicle condition inspection bay.',
    landmark: 'Near Vadasery Central Clock Tower & Christopher Bus Stand',
  },
  {
    id: 'ncj-collectorate',
    name: 'Nagercoil Collectorate Hub',
    city: 'Nagercoil',
    locality: 'Nagercoil',
    district: 'Kanniyakumari',
    type: 'city',
    tag: 'Executive Hub',
    address: 'Court Road, Collectorate Junction, Nagercoil, Kanniyakumari District, Tamil Nadu - 629001',
    lat: 8.1812,
    lng: 77.4215,
    hours: '07:00 AM – 10:00 PM',
    phone: '+91 4652 230 112',
    instructions: 'Executive customer parking zone near District Court entrance.',
    landmark: 'Near District Court Complex & Collectorate Gate',
  },

  // --- Kanyakumari ---
  {
    id: 'kny-beach',
    name: 'Kanyakumari Beach Hub',
    city: 'Kanyakumari',
    locality: 'Kanyakumari',
    district: 'Kanniyakumari',
    type: 'city',
    tag: 'Cape Coastal Hub',
    address: 'Main Beach Road, Near Sunset Point, Kanyakumari, Tamil Nadu - 629702',
    lat: 8.0810,
    lng: 77.5510,
    hours: '24 Hours / 7 Days',
    phone: '+91 4652 246 380',
    instructions: 'Coastal handover kiosk. Reserved ocean-view parking bay with express tourist car delivery.',
    landmark: '500m from Vivekananda Rock Memorial Ferry Wharf',
  },
  {
    id: 'kny-railway',
    name: 'Kanyakumari Railway Station',
    city: 'Kanyakumari',
    locality: 'Kanyakumari',
    district: 'Kanniyakumari',
    type: 'railway',
    tag: 'Railway Terminal',
    address: 'Station Road, Cape Comorin, Kanyakumari, Tamil Nadu - 629702',
    lat: 8.0875,
    lng: 77.5452,
    hours: '24 Hours / 7 Days',
    phone: '+91 4652 246 224',
    instructions: 'Platform 1 Exit Forecourt. Representative waiting with digital vehicle inspection checklist.',
    landmark: 'Main Entrance Commercial Vehicle Parking',
  },

  // --- Marthandam ---
  {
    id: 'mar-flyover',
    name: 'Marthandam Flyover Hub',
    city: 'Marthandam',
    locality: 'Marthandam',
    district: 'Kanniyakumari',
    type: 'city',
    tag: 'Highway Transit Station',
    address: 'NH 66 Main Road, Near Marthandam Flyover, Marthandam, Kanniyakumari District, Tamil Nadu - 629165',
    lat: 8.3040,
    lng: 77.2205,
    hours: '06:00 AM – 11:00 PM',
    phone: '+91 4651 270 310',
    instructions: 'Drivo West District Transit Station. 24/7 key drop-box and vehicle inspection bay.',
    landmark: 'Below Marthandam Flyover Pillar 24, Near Bus Stand',
  },
  {
    id: 'mar-bus-stand',
    name: 'Marthandam Bus Terminal',
    city: 'Marthandam',
    locality: 'Marthandam',
    district: 'Kanniyakumari',
    type: 'city',
    tag: 'Bus Terminal Link',
    address: 'New Bus Stand Road, Marthandam, Kanniyakumari District, Tamil Nadu - 629165',
    lat: 8.3065,
    lng: 77.2230,
    hours: '06:30 AM – 10:30 PM',
    phone: '+91 4651 270 550',
    instructions: 'Dedicated commercial parking lane adjacent to passenger entrance.',
    landmark: 'Beside New Bus Stand Entry Arch',
  },

  // --- Thuckalay ---
  {
    id: 'tky-center',
    name: 'Thuckalay Town Center',
    city: 'Thuckalay',
    locality: 'Thuckalay',
    district: 'Kanniyakumari',
    type: 'city',
    tag: 'Heritage Route Station',
    address: 'Trivandrum-Nagercoil Highway, Thuckalay, Kanniyakumari District, Tamil Nadu - 629175',
    lat: 8.2505,
    lng: 77.3240,
    hours: '06:30 AM – 10:30 PM',
    phone: '+91 4651 252 890',
    instructions: 'Thuckalay Central Desk. Quick highway handover with vehicle pre-conditioned.',
    landmark: 'Near Thuckalay Old Bus Stand & Taluk Hospital',
  },

  // --- Kuzhithurai ---
  {
    id: 'kuz-railway',
    name: 'Kuzhithurai Railway Station',
    city: 'Kuzhithurai',
    locality: 'Kuzhithurai',
    district: 'Kanniyakumari',
    type: 'railway',
    tag: 'Railway Station',
    address: 'Station Road, Kuzhithurai, Kanniyakumari District, Tamil Nadu - 629163',
    lat: 8.3180,
    lng: 77.1950,
    hours: '24 Hours / 7 Days',
    phone: '+91 4651 260 210',
    instructions: 'Meet Drivo representative at Kuzhithurai Railway Station portico entrance.',
    landmark: 'Kuzhithurai Junction Parking Bay',
  },
  {
    id: 'kuz-town',
    name: 'Kuzhithurai Municipal Center',
    city: 'Kuzhithurai',
    locality: 'Kuzhithurai',
    district: 'Kanniyakumari',
    type: 'city',
    tag: 'Municipal Hub',
    address: 'Municipality Road, Kuzhithurai, Kanniyakumari District, Tamil Nadu - 629163',
    lat: 8.3205,
    lng: 77.1990,
    hours: '07:00 AM – 09:30 PM',
    phone: '+91 4651 260 440',
    instructions: 'Central municipal car stand with customer verification counter.',
    landmark: 'Opposite Kuzhithurai Post Office',
  },

  // --- Colachel ---
  {
    id: 'col-port',
    name: 'Colachel Port Hub',
    city: 'Colachel',
    locality: 'Colachel',
    district: 'Kanniyakumari',
    type: 'city',
    tag: 'Coastal Harbor Hub',
    address: 'Port Road, Colachel, Kanniyakumari District, Tamil Nadu - 629251',
    lat: 8.1780,
    lng: 77.2560,
    hours: '07:00 AM – 09:00 PM',
    phone: '+91 4651 227 410',
    instructions: 'Coastal hub serving western seaside belt and beach road travelers.',
    landmark: 'Near Colachel Fishing Harbour Gate & Police Station',
  },

  // --- Padmanabhapuram ---
  {
    id: 'pdm-palace',
    name: 'Padmanabhapuram Palace Hub',
    city: 'Padmanabhapuram',
    locality: 'Padmanabhapuram',
    district: 'Kanniyakumari',
    type: 'city',
    tag: 'Heritage Hub',
    address: 'Palace Road, Padmanabhapuram, Kanniyakumari District, Tamil Nadu - 629175',
    lat: 8.2510,
    lng: 77.3275,
    hours: '08:00 AM – 07:00 PM',
    phone: '+91 4651 250 144',
    instructions: 'Palace tourist circuit dispatch. Reserved heritage parking bay.',
    landmark: 'Opposite Padmanabhapuram Palace Tourist Parking',
  },

  // --- Karungal ---
  {
    id: 'kgl-town',
    name: 'Karungal Town Hub',
    city: 'Karungal',
    locality: 'Karungal',
    district: 'Kanniyakumari',
    type: 'city',
    tag: 'Midland Town Hub',
    address: 'Main Junction, Karungal, Kanniyakumari District, Tamil Nadu - 629157',
    lat: 8.2320,
    lng: 77.2340,
    hours: '07:00 AM – 09:30 PM',
    phone: '+91 4651 268 550',
    instructions: 'Midland junction dispatch point with full vehicle handover amenities.',
    landmark: 'Karungal Four Roads Junction',
  },

  // --- Kulasekharam ---
  {
    id: 'kul-hub',
    name: 'Kulasekharam Hub',
    city: 'Kulasekharam',
    locality: 'Kulasekharam',
    district: 'Kanniyakumari',
    type: 'city',
    tag: 'Highland Foothills Hub',
    address: 'Pechiparai Road, Kulasekharam, Kanniyakumari District, Tamil Nadu - 629161',
    lat: 8.3610,
    lng: 77.2940,
    hours: '07:00 AM – 09:00 PM',
    phone: '+91 4651 278 120',
    instructions: 'Foothills dispatch station for hill routes, Pechiparai dam, and eco-resorts.',
    landmark: 'Near Kulasekharam Market Junction',
  },

  // --- Suchindram ---
  {
    id: 'sch-hub',
    name: 'Suchindram Temple Hub',
    city: 'Suchindram',
    locality: 'Suchindram',
    district: 'Kanniyakumari',
    type: 'city',
    tag: 'Heritage Circuit Hub',
    address: 'Temple Car Street, Suchindram, Kanniyakumari District, Tamil Nadu - 629704',
    lat: 8.1560,
    lng: 77.4650,
    hours: '06:00 AM – 10:00 PM',
    phone: '+91 4652 241 190',
    instructions: 'Southern highway transfer station near Thanumalayan Temple.',
    landmark: 'Near Thanumalayan Temple North Car Street',
  },

  // --- Boothapandi ---
  {
    id: 'btp-hub',
    name: 'Boothapandi Town Hub',
    city: 'Boothapandi',
    locality: 'Boothapandi',
    district: 'Kanniyakumari',
    type: 'city',
    tag: 'Eastern Valley Hub',
    address: 'Thovalai Main Road, Boothapandi, Kanniyakumari District, Tamil Nadu - 629852',
    lat: 8.2610,
    lng: 77.4560,
    hours: '07:00 AM – 09:00 PM',
    phone: '+91 4652 281 330',
    instructions: 'Thovalai taluk valley dispatch point.',
    landmark: 'Near Thovalai Taluk Office & Bus Stop',
  },

  // --- Eraniel ---
  {
    id: 'ern-railway',
    name: 'Eraniel Railway Station Hub',
    city: 'Eraniel',
    locality: 'Eraniel',
    district: 'Kanniyakumari',
    type: 'railway',
    tag: 'Railway Station',
    address: 'Railway Station Road, Eraniel, Kanniyakumari District, Tamil Nadu - 629802',
    lat: 8.2050,
    lng: 77.3070,
    hours: '24 Hours / 7 Days',
    phone: '+91 4651 235 600',
    instructions: 'Direct station parking lot handover for train passengers.',
    landmark: 'Eraniel Railway Station Gate',
  },
];

/**
 * Validates if location is strictly within Kanniyakumari District.
 */
export function isSupportedLocation(nameOrLocality) {
  if (!nameOrLocality || typeof nameOrLocality !== 'string') return false;
  const clean = nameOrLocality.trim().toLowerCase();
  if (!clean) return false;

  for (const out of OUTSIDE_LOCATIONS) {
    if (clean.includes(out)) return false;
  }

  for (const loc of KANNIYAKUMARI_LOCALITIES) {
    const lLower = loc.toLowerCase();
    if (lLower === clean || clean.includes(lLower) || lLower.includes(clean)) return true;
  }

  for (const s of SUPPORTED_LOCATIONS) {
    const sName = s.name.toLowerCase();
    if (sName === clean || clean.includes(sName) || sName.includes(clean)) return true;
    if (s.id.toLowerCase() === clean) return true;
  }

  if (clean.includes('kanniyakumari') || clean.includes('kanyakumari')) return true;
  return false;
}

/**
 * Returns error string if unsupported location, or null if valid.
 */
export function validateServiceLocation(nameOrLocality) {
  if (!isSupportedLocation(nameOrLocality)) {
    return UNSUPPORTED_LOCATION_ERROR;
  }
  return null;
}

/**
 * Returns supported pickup locations for a locality, or all if no locality given.
 */
export function getLocationsForCity(city) {
  if (!city) return SUPPORTED_LOCATIONS;
  const cClean = city.trim().toLowerCase();
  const filtered = SUPPORTED_LOCATIONS.filter(
    (l) => l.city.toLowerCase() === cClean || l.locality.toLowerCase() === cClean
  );
  return filtered.length > 0 ? filtered : SUPPORTED_LOCATIONS;
}

/**
 * Find location object by exact or fuzzy name match.
 */
export function getLocationByName(name) {
  if (!name) return null;
  const clean = name.trim().toLowerCase();

  // 1. Exact match
  const exact = SUPPORTED_LOCATIONS.find((l) => l.name.toLowerCase() === clean || l.id.toLowerCase() === clean);
  if (exact) return exact;

  // 2. Substring match
  const sub = SUPPORTED_LOCATIONS.find(
    (l) => clean.includes(l.name.toLowerCase()) || l.name.toLowerCase().includes(clean)
  );
  if (sub) return sub;

  // 3. Locality match
  const loc = SUPPORTED_LOCATIONS.find(
    (l) => l.locality.toLowerCase() === clean || clean.includes(l.locality.toLowerCase())
  );
  if (loc) return loc;

  // Fallback to primary hub
  if (clean.includes('kanniyakumari') || clean.includes('kanyakumari')) {
    return SUPPORTED_LOCATIONS[0];
  }
  return null;
}

/**
 * Helper returning location name strings for a locality / hub.
 */
export const pickupPoints = (locality) => {
  const locs = getLocationsForCity(locality);
  return locs.map((l) => l.name);
};
