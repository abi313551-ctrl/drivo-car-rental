import { useEffect, useRef, useState } from 'react';
import {
  MapPin,
  Clock,
  Phone,
  Info,
  Navigation,
  CheckCircle2,
  Building,
  Plane,
  Train,
  Layers,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  SUPPORTED_LOCATIONS,
  getLocationsForCity,
  getLocationByName,
  CITY_COORDINATES,
} from '../utils/locations.js';

// Custom SVG icon generator for Leaflet pins
function createPinIcon(isSelected, type = 'city') {
  const bgColor = isSelected ? '#059669' : '#0f172a';
  const pulseHtml = isSelected
    ? `<span class="absolute -inset-1.5 animate-ping rounded-full bg-emerald-400 opacity-75"></span>`
    : '';

  let iconSvg = '';
  if (type === 'airport') {
    iconSvg = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.3c.4-.2.6-.6.5-1.1z"/></svg>`;
  } else if (type === 'railway') {
    iconSvg = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect width="16" height="16" x="4" y="3" rx="2"/><path d="M4 11h16"/><path d="M12 3v8"/><path d="m8 19-2 3"/><path d="m18 22-2-3"/><circle cx="8" cy="15" r="1"/><circle cx="16" cy="15" r="1"/></svg>`;
  } else {
    iconSvg = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/></svg>`;
  }

  const html = `
    <div class="relative flex items-center justify-center">
      ${pulseHtml}
      <div style="background-color: ${bgColor}; width: 34px; height: 34px;" class="relative z-10 flex items-center justify-center rounded-2xl shadow-lg border-2 border-white transition-transform hover:scale-110">
        ${iconSvg}
      </div>
      <div style="border-top-color: ${bgColor};" class="absolute -bottom-1.5 left-1/2 -translate-x-1/2 border-4 border-transparent border-t-solid"></div>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'drivo-map-pin',
    iconSize: [34, 40],
    iconAnchor: [17, 38],
    popupAnchor: [0, -38],
  });
}

export default function PickupLocationMap({
  city = 'Nagercoil',
  selectedLocationName,
  onSelectLocation,
  title = 'Kanniyakumari District Handover Station',
  subtitle = 'Choose a verified Drivo station across Kanniyakumari district.',
  compact = false,
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef({});
  const [mapError, setMapError] = useState(false);
  const [activeTab, setActiveTab] = useState('map'); // 'map' | 'list'

  const locations = getLocationsForCity(city);
  const selectedLocation =
    getLocationByName(selectedLocationName) || locations[0] || SUPPORTED_LOCATIONS[0];

  // Initialize or update map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Check if Leaflet map already exists
    if (!mapInstanceRef.current) {
      try {
        const cityMeta = CITY_COORDINATES[city] || {
          lat: selectedLocation?.lat || 11.0168,
          lng: selectedLocation?.lng || 76.9558,
          zoom: 12,
        };

        const map = L.map(mapContainerRef.current, {
          center: [cityMeta.lat, cityMeta.lng],
          zoom: cityMeta.zoom,
          zoomControl: true,
          scrollWheelZoom: false,
        });

        // OpenStreetMap tile layer (100% free, no API key required)
        const tileUrl =
          import.meta.env.VITE_MAP_TILE_URL ||
          'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
        const tileLayer = L.tileLayer(tileUrl, {
          maxZoom: 19,
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors',
        });

        tileLayer.on('tileerror', () => {
          // If network / tiles fail, inform without throwing
          setMapError(true);
        });

        tileLayer.addTo(map);
        mapInstanceRef.current = map;
      } catch (err) {
        console.warn('Map initialization failed, enabling fallback view:', err);
        setMapError(true);
        return;
      }
    }

    const map = mapInstanceRef.current;
    if (!map) return;

    // Invalidate size to ensure container renders crisply
    setTimeout(() => {
      try {
        map.invalidateSize();
      } catch (_) {}
    }, 150);

    // Clear old markers
    Object.values(markersRef.current).forEach((marker) => marker.remove());
    markersRef.current = {};

    const bounds = L.latLngBounds([]);

    // Add markers for current city locations
    locations.forEach((loc) => {
      const isSelected = selectedLocation && selectedLocation.id === loc.id;
      const marker = L.marker([loc.lat, loc.lng], {
        icon: createPinIcon(isSelected, loc.type),
        title: loc.name,
      });

      // Marker Popup
      const popupHtml = `
        <div style="font-family: inherit; font-size: 12px; line-height: 1.4; min-width: 190px;">
          <div style="font-size: 10px; font-weight: 700; text-transform: uppercase; color: #059669; margin-bottom: 2px;">
            ${loc.tag || 'Drivo Station'}
          </div>
          <div style="font-weight: 700; font-size: 13px; color: #0f172a; margin-bottom: 4px;">
            ${loc.name}
          </div>
          <div style="color: #64748b; font-size: 11px; margin-bottom: 6px;">
            ${loc.address}
          </div>
          <div style="font-size: 10px; color: #334155; margin-bottom: 8px;">
            <b>Hours:</b> ${loc.hours}
          </div>
          <button 
            id="popup-btn-${loc.id}" 
            style="width: 100%; background-color: #0f172a; color: white; border: none; padding: 6px 10px; border-radius: 8px; font-weight: 700; cursor: pointer; font-size: 11px;">
            ${isSelected ? '✓ Selected Station' : 'Select Station'}
          </button>
        </div>
      `;

      marker.bindPopup(popupHtml);

      marker.on('popupopen', () => {
        const btn = document.getElementById(`popup-btn-${loc.id}`);
        if (btn) {
          btn.onclick = () => {
            onSelectLocation?.(loc.name);
            marker.closePopup();
          };
        }
      });

      marker.on('click', () => {
        onSelectLocation?.(loc.name);
      });

      marker.addTo(map);
      markersRef.current[loc.id] = marker;
      bounds.extend([loc.lat, loc.lng]);
    });

    // Fit bounds to show all stations in the city
    if (locations.length > 0) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
    }
  }, [city, locations, selectedLocation?.id, onSelectLocation]);

  // Center on selected location when it changes
  useEffect(() => {
    if (mapInstanceRef.current && selectedLocation) {
      try {
        mapInstanceRef.current.panTo([selectedLocation.lat, selectedLocation.lng], {
          animate: true,
          duration: 0.6,
        });
      } catch (_) {}
    }
  }, [selectedLocation?.id]);

  // Cleanup map instance on unmount
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  const getTypeIcon = (type) => {
    if (type === 'airport') return <Plane size={14} className="text-blue-600" />;
    if (type === 'railway') return <Train size={14} className="text-amber-600" />;
    return <Building size={14} className="text-emerald-600" />;
  };

  return (
    <div className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-card transition">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-emerald-50 text-accent">
              <MapPin size={16} />
            </div>
            <h3 className="font-bold text-ink text-base">{title}</h3>
          </div>
          <p className="mt-0.5 text-xs text-neutral-500">{subtitle}</p>
        </div>

        {/* View Toggle */}
        <div className="flex items-center rounded-xl border border-neutral-200 bg-neutral-50 p-1 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('map')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-semibold transition ${
              activeTab === 'map'
                ? 'bg-white text-ink shadow-sm'
                : 'text-neutral-500 hover:text-ink'
            }`}
          >
            <Layers size={13} /> Map View
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('list')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-semibold transition ${
              activeTab === 'list'
                ? 'bg-white text-ink shadow-sm'
                : 'text-neutral-500 hover:text-ink'
            }`}
          >
            <Navigation size={13} /> Stations ({locations.length})
          </button>
        </div>
      </div>

      {/* Map View */}
      {activeTab === 'map' && (
        <div className="space-y-4">
          <div className="relative overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-100">
            <div
              ref={mapContainerRef}
              className={`w-full ${compact ? 'h-52' : 'h-72 sm:h-80'} z-0`}
              style={{ minHeight: compact ? '200px' : '280px' }}
            />

            {/* Offline / Map error fallback banner */}
            {mapError && (
              <div className="absolute top-3 left-3 right-3 z-10 flex items-center justify-between gap-2 rounded-xl bg-amber-500/90 backdrop-blur px-3 py-2 text-xs font-semibold text-white shadow-md">
                <span className="flex items-center gap-1.5">
                  <AlertTriangle size={14} /> Map service in offline mode · Select your station from the cards below.
                </span>
                <button
                  type="button"
                  onClick={() => setActiveTab('list')}
                  className="rounded-lg bg-white/20 px-2 py-0.5 hover:bg-white/30"
                >
                  View List
                </button>
              </div>
            )}

            {/* Floating Quick Legend */}
            <div className="absolute bottom-3 left-3 z-[400] flex flex-wrap items-center gap-1.5 rounded-xl bg-white/95 px-2.5 py-1.5 text-[11px] font-medium text-neutral-600 shadow-sm backdrop-blur border border-neutral-200">
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-emerald-600"></span> Selected Station
              </span>
              <span className="text-neutral-300">·</span>
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-ink"></span> Other Hubs
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Hub Grid (Always accessible or when list tab is active) */}
      <div className="mt-4 grid gap-2.5 sm:grid-cols-3">
        {locations.map((loc) => {
          const isSelected = selectedLocation?.id === loc.id;
          return (
            <button
              key={loc.id}
              type="button"
              onClick={() => onSelectLocation?.(loc.name)}
              className={`group flex flex-col justify-between rounded-2xl border p-3.5 text-left transition ${
                isSelected
                  ? 'border-accent bg-accent-soft ring-2 ring-accent/20 shadow-sm'
                  : 'border-neutral-200 bg-neutral-50/50 hover:border-neutral-300 hover:bg-neutral-50'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-neutral-500">
                    {getTypeIcon(loc.type)} {loc.tag}
                  </span>
                  {isSelected && (
                    <CheckCircle2 size={15} className="text-accent shrink-0" />
                  )}
                </div>
                <p className="font-bold text-ink text-sm group-hover:text-accent transition">
                  {loc.name}
                </p>
                <p className="mt-1 line-clamp-2 text-xs text-neutral-500">
                  {loc.address}
                </p>
              </div>

              <div className="mt-2.5 pt-2 border-t border-neutral-100 flex items-center justify-between text-[11px] text-neutral-500">
                <span className="flex items-center gap-1">
                  <Clock size={11} className="text-neutral-400" /> {loc.hours}
                </span>
                <span className="font-semibold text-accent text-xs">
                  {isSelected ? 'Active' : 'Select'}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Location Full Instructions & Landmark Card */}
      {selectedLocation && (
        <div className="mt-4 rounded-2xl bg-gradient-to-br from-neutral-50 to-emerald-50/30 p-4 border border-emerald-100 text-xs">
          <div className="flex flex-wrap items-start justify-between gap-3 pb-2 border-b border-emerald-100/60">
            <div>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100/80 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800 uppercase tracking-wide">
                Confirmed Handover Station
              </span>
              <h4 className="font-bold text-ink text-sm mt-1 flex items-center gap-1.5">
                {selectedLocation.name}
              </h4>
              <p className="text-neutral-600 mt-0.5">{selectedLocation.address}</p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <a
                href={`tel:${selectedLocation.phone.replace(/\s+/g, '')}`}
                className="btn-outline text-xs px-2.5 py-1.5 flex items-center gap-1 border-emerald-200 bg-white"
              >
                <Phone size={12} className="text-emerald-700" /> {selectedLocation.phone}
              </a>
            </div>
          </div>

          <div className="mt-3 grid gap-2 sm:grid-cols-2 text-neutral-600">
            <div className="flex items-start gap-2">
              <Info size={14} className="mt-0.5 text-accent shrink-0" />
              <div>
                <strong className="text-ink block">Handover Desk & Instructions:</strong>
                <p className="text-neutral-600 mt-0.5 leading-relaxed">
                  {selectedLocation.instructions}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <Clock size={14} className="mt-0.5 text-accent shrink-0" />
              <div>
                <strong className="text-ink block">Operating Timings & Landmark:</strong>
                <p className="text-neutral-600 mt-0.5">
                  {selectedLocation.hours} · Landmark: {selectedLocation.landmark}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
