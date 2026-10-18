"""
Drivo Authoritative Supported Pickup & Return Stations
Exclusively Serving Kanniyakumari District, Tamil Nadu, India.
"""

SERVICE_DISTRICT = "Kanniyakumari"
SERVICE_STATE = "Tamil Nadu"

SUPPORTED_LOCALITIES = [
    "Nagercoil",
    "Kanyakumari",
    "Marthandam",
    "Thuckalay",
    "Kuzhithurai",
    "Colachel",
    "Padmanabhapuram",
    "Karungal",
    "Kulasekharam",
    "Suchindram",
    "Boothapandi",
    "Eraniel",
]

# Explicit outside districts/cities strictly rejected
OUTSIDE_LOCATIONS = {
    "chennai", "coimbatore", "bengaluru", "bangalore", "mumbai", "delhi", "hyderabad",
    "kochi", "cochin", "madurai", "tirunelveli", "trivandrum", "thiruvananthapuram",
    "salem", "trichy", "tiruchirappalli", "pune", "kolkata", "goa", "mysore", "mysuru"
}

SUPPORTED_LOCATIONS = [
    # --- Nagercoil (District Headquarters) ---
    {
        "id": "ncj-junction",
        "name": "Nagercoil Junction Railway Station",
        "city": "Nagercoil",
        "locality": "Nagercoil",
        "district": "Kanniyakumari",
        "type": "railway",
        "tag": "Railway Station",
        "address": "Railway Feeder Road, Kottar, Nagercoil, Kanniyakumari District, Tamil Nadu - 629002",
        "lat": 8.1754,
        "lng": 77.4395,
        "hours": "24 Hours / 7 Days",
        "phone": "+91 4652 240 231",
        "instructions": "Drivo Welcome Kiosk located at Main Concourse Commercial Valet Bay. Fast biometric check and vehicle handover.",
        "landmark": "Opposite Kottar Police Station / Main Concourse Entry",
    },
    {
        "id": "ncj-vadasery",
        "name": "Nagercoil Vadasery Central Hub",
        "city": "Nagercoil",
        "locality": "Nagercoil",
        "district": "Kanniyakumari",
        "type": "city",
        "tag": "Flagship District Hub",
        "address": "Christopher Bus Stand Road, Vadasery, Nagercoil, Kanniyakumari District, Tamil Nadu - 629001",
        "lat": 8.1925,
        "lng": 77.4287,
        "hours": "06:00 AM – 11:00 PM",
        "phone": "+91 4652 232 450",
        "instructions": "Drivo Central District Hub. Ground floor reception lounge with digital vehicle condition inspection bay.",
        "landmark": "Near Vadasery Central Clock Tower & Christopher Bus Stand",
    },
    {
        "id": "ncj-collectorate",
        "name": "Nagercoil Collectorate Hub",
        "city": "Nagercoil",
        "locality": "Nagercoil",
        "district": "Kanniyakumari",
        "type": "city",
        "tag": "Executive Hub",
        "address": "Court Road, Collectorate Junction, Nagercoil, Kanniyakumari District, Tamil Nadu - 629001",
        "lat": 8.1812,
        "lng": 77.4215,
        "hours": "07:00 AM – 10:00 PM",
        "phone": "+91 4652 230 112",
        "instructions": "Executive customer parking zone near District Court entrance.",
        "landmark": "Near District Court Complex & Collectorate Gate",
    },

    # --- Kanyakumari (Cape Comorin) ---
    {
        "id": "kny-beach",
        "name": "Kanyakumari Beach Hub",
        "city": "Kanyakumari",
        "locality": "Kanyakumari",
        "district": "Kanniyakumari",
        "type": "city",
        "tag": "Cape Coastal Hub",
        "address": "Main Beach Road, Near Sunset Point, Kanyakumari, Tamil Nadu - 629702",
        "lat": 8.0810,
        "lng": 77.5510,
        "hours": "24 Hours / 7 Days",
        "phone": "+91 4652 246 380",
        "instructions": "Coastal handover kiosk. Reserved ocean-view parking bay with express tourist car delivery.",
        "landmark": "500m from Vivekananda Rock Memorial Ferry Wharf",
    },
    {
        "id": "kny-railway",
        "name": "Kanyakumari Railway Station",
        "city": "Kanyakumari",
        "locality": "Kanyakumari",
        "district": "Kanniyakumari",
        "type": "railway",
        "tag": "Railway Terminal",
        "address": "Station Road, Cape Comorin, Kanyakumari, Tamil Nadu - 629702",
        "lat": 8.0875,
        "lng": 77.5452,
        "hours": "24 Hours / 7 Days",
        "phone": "+91 4652 246 224",
        "instructions": "Platform 1 Exit Forecourt. Representative waiting with digital vehicle inspection checklist.",
        "landmark": "Main Entrance Commercial Vehicle Parking",
    },

    # --- Marthandam ---
    {
        "id": "mar-flyover",
        "name": "Marthandam Flyover Hub",
        "city": "Marthandam",
        "locality": "Marthandam",
        "district": "Kanniyakumari",
        "type": "city",
        "tag": "Highway Transit Station",
        "address": "NH 66 Main Road, Near Marthandam Flyover, Marthandam, Kanniyakumari District, Tamil Nadu - 629165",
        "lat": 8.3040,
        "lng": 77.2205,
        "hours": "06:00 AM – 11:00 PM",
        "phone": "+91 4651 270 310",
        "instructions": "Drivo West District Transit Station. 24/7 key drop-box and vehicle inspection bay.",
        "landmark": "Below Marthandam Flyover Pillar 24, Near Bus Stand",
    },
    {
        "id": "mar-bus-stand",
        "name": "Marthandam Bus Terminal",
        "city": "Marthandam",
        "locality": "Marthandam",
        "district": "Kanniyakumari",
        "type": "city",
        "tag": "Bus Terminal Link",
        "address": "New Bus Stand Road, Marthandam, Kanniyakumari District, Tamil Nadu - 629165",
        "lat": 8.3065,
        "lng": 77.2230,
        "hours": "06:30 AM – 10:30 PM",
        "phone": "+91 4651 270 550",
        "instructions": "Dedicated commercial parking lane adjacent to passenger entrance.",
        "landmark": "Beside New Bus Stand Entry Arch",
    },

    # --- Thuckalay ---
    {
        "id": "tky-center",
        "name": "Thuckalay Town Center",
        "city": "Thuckalay",
        "locality": "Thuckalay",
        "district": "Kanniyakumari",
        "type": "city",
        "tag": "Heritage Route Station",
        "address": "Trivandrum-Nagercoil Highway, Thuckalay, Kanniyakumari District, Tamil Nadu - 629175",
        "lat": 8.2505,
        "lng": 77.3240,
        "hours": "06:30 AM – 10:30 PM",
        "phone": "+91 4651 252 890",
        "instructions": "Thuckalay Central Desk. Quick highway handover with vehicle pre-conditioned.",
        "landmark": "Near Thuckalay Old Bus Stand & Taluk Hospital",
    },

    # --- Kuzhithurai ---
    {
        "id": "kuz-railway",
        "name": "Kuzhithurai Railway Station",
        "city": "Kuzhithurai",
        "locality": "Kuzhithurai",
        "district": "Kanniyakumari",
        "type": "railway",
        "tag": "Railway Station",
        "address": "Station Road, Kuzhithurai, Kanniyakumari District, Tamil Nadu - 629163",
        "lat": 8.3180,
        "lng": 77.1950,
        "hours": "24 Hours / 7 Days",
        "phone": "+91 4651 260 210",
        "instructions": "Meet Drivo representative at Kuzhithurai Railway Station portico entrance.",
        "landmark": "Kuzhithurai Junction Parking Bay",
    },
    {
        "id": "kuz-town",
        "name": "Kuzhithurai Municipal Center",
        "city": "Kuzhithurai",
        "locality": "Kuzhithurai",
        "district": "Kanniyakumari",
        "type": "city",
        "tag": "Municipal Hub",
        "address": "Municipality Road, Kuzhithurai, Kanniyakumari District, Tamil Nadu - 629163",
        "lat": 8.3205,
        "lng": 77.1990,
        "hours": "07:00 AM – 09:30 PM",
        "phone": "+91 4651 260 440",
        "instructions": "Central municipal car stand with customer verification counter.",
        "landmark": "Opposite Kuzhithurai Post Office",
    },

    # --- Colachel ---
    {
        "id": "col-port",
        "name": "Colachel Port Hub",
        "city": "Colachel",
        "locality": "Colachel",
        "district": "Kanniyakumari",
        "type": "city",
        "tag": "Coastal Harbor Hub",
        "address": "Port Road, Colachel, Kanniyakumari District, Tamil Nadu - 629251",
        "lat": 8.1780,
        "lng": 77.2560,
        "hours": "07:00 AM – 09:00 PM",
        "phone": "+91 4651 227 410",
        "instructions": "Coastal hub serving western seaside belt and beach road travelers.",
        "landmark": "Near Colachel Fishing Harbour Gate & Police Station",
    },

    # --- Padmanabhapuram ---
    {
        "id": "pdm-palace",
        "name": "Padmanabhapuram Palace Hub",
        "city": "Padmanabhapuram",
        "locality": "Padmanabhapuram",
        "district": "Kanniyakumari",
        "type": "city",
        "tag": "Heritage Hub",
        "address": "Palace Road, Padmanabhapuram, Kanniyakumari District, Tamil Nadu - 629175",
        "lat": 8.2510,
        "lng": 77.3275,
        "hours": "08:00 AM – 07:00 PM",
        "phone": "+91 4651 250 144",
        "instructions": "Palace tourist circuit dispatch. Reserved heritage parking bay.",
        "landmark": "Opposite Padmanabhapuram Palace Tourist Parking",
    },

    # --- Karungal ---
    {
        "id": "kgl-town",
        "name": "Karungal Town Hub",
        "city": "Karungal",
        "locality": "Karungal",
        "district": "Kanniyakumari",
        "type": "city",
        "tag": "Midland Town Hub",
        "address": "Main Junction, Karungal, Kanniyakumari District, Tamil Nadu - 629157",
        "lat": 8.2320,
        "lng": 77.2340,
        "hours": "07:00 AM – 09:30 PM",
        "phone": "+91 4651 268 550",
        "instructions": "Midland junction dispatch point with full vehicle handover amenities.",
        "landmark": "Karungal Four Roads Junction",
    },

    # --- Kulasekharam ---
    {
        "id": "kul-hub",
        "name": "Kulasekharam Hub",
        "city": "Kulasekharam",
        "locality": "Kulasekharam",
        "district": "Kanniyakumari",
        "type": "city",
        "tag": "Highland Foothills Hub",
        "address": "Pechiparai Road, Kulasekharam, Kanniyakumari District, Tamil Nadu - 629161",
        "lat": 8.3610,
        "lng": 77.2940,
        "hours": "07:00 AM – 09:00 PM",
        "phone": "+91 4651 278 120",
        "instructions": "Foothills dispatch station for hill routes, Pechiparai dam, and eco-resorts.",
        "landmark": "Near Kulasekharam Market Junction",
    },

    # --- Suchindram ---
    {
        "id": "sch-hub",
        "name": "Suchindram Temple Hub",
        "city": "Suchindram",
        "locality": "Suchindram",
        "district": "Kanniyakumari",
        "type": "city",
        "tag": "Heritage Circuit Hub",
        "address": "Temple Car Street, Suchindram, Kanniyakumari District, Tamil Nadu - 629704",
        "lat": 8.1560,
        "lng": 77.4650,
        "hours": "06:00 AM – 10:00 PM",
        "phone": "+91 4652 241 190",
        "instructions": "Southern highway transfer station near Thanumalayan Temple.",
        "landmark": "Near Thanumalayan Temple North Car Street",
    },

    # --- Boothapandi ---
    {
        "id": "btp-hub",
        "name": "Boothapandi Town Hub",
        "city": "Boothapandi",
        "locality": "Boothapandi",
        "district": "Kanniyakumari",
        "type": "city",
        "tag": "Eastern Valley Hub",
        "address": "Thovalai Main Road, Boothapandi, Kanniyakumari District, Tamil Nadu - 629852",
        "lat": 8.2610,
        "lng": 77.4560,
        "hours": "07:00 AM – 09:00 PM",
        "phone": "+91 4652 281 330",
        "instructions": "Thovalai taluk valley dispatch point.",
        "landmark": "Near Thovalai Taluk Office & Bus Stop",
    },

    # --- Eraniel ---
    {
        "id": "ern-railway",
        "name": "Eraniel Railway Station Hub",
        "city": "Eraniel",
        "locality": "Eraniel",
        "district": "Kanniyakumari",
        "type": "railway",
        "tag": "Railway Station",
        "address": "Railway Station Road, Eraniel, Kanniyakumari District, Tamil Nadu - 629802",
        "lat": 8.2050,
        "lng": 77.3070,
        "hours": "24 Hours / 7 Days",
        "phone": "+91 4651 235 600",
        "instructions": "Direct station parking lot handover for train passengers.",
        "landmark": "Eraniel Railway Station Gate",
    },
]


def is_supported_kanniyakumari_location(name_or_locality: str) -> bool:
    """
    Authoritative check verifying that a location is strictly within Kanniyakumari District.
    Rejects any outside locations, cities, or arbitrary non-Kanniyakumari addresses.
    """
    if not name_or_locality or not isinstance(name_or_locality, str):
        return False

    clean = name_or_locality.strip().lower()
    if not clean:
        return False

    # 1. Reject explicit outside cities / districts immediately
    for out in OUTSIDE_LOCATIONS:
        if out in clean:
            return False

    # 2. Check if clean string equals or contains a supported locality
    for loc in SUPPORTED_LOCALITIES:
        l_lower = loc.lower()
        if l_lower == clean or l_lower in clean or clean in l_lower:
            return True

    # 3. Check exact or substring match in supported stations
    for s in SUPPORTED_LOCATIONS:
        s_name = s["name"].lower()
        if s_name == clean or clean in s_name or s_name in clean:
            return True
        if s["id"].lower() == clean:
            return True

    # 4. Check for "kanniyakumari" or "kanyakumari"
    if "kanniyakumari" in clean or "kanyakumari" in clean:
        return True

    return False


def get_locations_by_city(city: str = None):
    """Returns verified Kanniyakumari locations, optionally filtered by locality."""
    if not city:
        return SUPPORTED_LOCATIONS
    c_lower = city.strip().lower()
    filtered = [l for l in SUPPORTED_LOCATIONS if l["city"].lower() == c_lower or l["locality"].lower() == c_lower]
    return filtered if filtered else SUPPORTED_LOCATIONS


def get_locations_by_locality(locality: str = None):
    return get_locations_by_city(locality)


def get_location_by_name(name: str):
    """Finds authoritative location dictionary by exact or token match."""
    if not name:
        return None
    clean = name.strip().lower()

    # 1. Exact match
    for l in SUPPORTED_LOCATIONS:
        if l["name"].lower() == clean or l["id"].lower() == clean:
            return l

    # 2. Substring match
    for l in SUPPORTED_LOCATIONS:
        if clean in l["name"].lower() or l["name"].lower() in clean:
            return l

    # 3. Locality match
    for l in SUPPORTED_LOCATIONS:
        if l["locality"].lower() in clean or clean in l["locality"].lower():
            return l

    # Fallback default to Nagercoil Junction if within Kanniyakumari
    if "kanniyakumari" in clean or "kanyakumari" in clean:
        return SUPPORTED_LOCATIONS[0]

    return None
