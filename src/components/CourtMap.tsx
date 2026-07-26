import React, { useState, useEffect, useRef, Component } from 'react';
import { APIProvider, Map, AdvancedMarker, Pin, InfoWindow, useMap } from '@vis.gl/react-google-maps';
import L from 'leaflet';
import { Court } from '../types';
import { MapPin, Sparkles, Navigation, Info, Layers, RefreshCw, AlertCircle } from 'lucide-react';

const API_KEY = (
  process.env.GOOGLE_MAPS_PLATFORM_KEY ||
  (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
  (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY ||
  ''
).trim();

// Real Google Maps Platform API keys start with 'AIzaSy' and are 39 characters long
const isGoogleApiKeyFormat = Boolean(
  API_KEY &&
  API_KEY !== 'YOUR_API_KEY' &&
  API_KEY.startsWith('AIzaSy') &&
  API_KEY.length === 39
);

interface CourtMapProps {
  courts: Court[];
  selectedCourt: Court | null;
  onSelectCourt: (court: Court) => void;
}

interface ErrorBoundaryProps {
  fallback: React.ReactNode;
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

// React Error Boundary for Google Maps component rendering
class MapErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };
  props: ErrorBoundaryProps;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.props = props;
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.warn("Google Maps error caught by Boundary, falling back to Leaflet:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

// Helper controller to pan Google Map smoothly when selected court changes
function MapCameraController({ selectedCourt }: { selectedCourt: Court | null }) {
  const map = useMap();

  useEffect(() => {
    if (map && selectedCourt?.coordinates) {
      try {
        map.panTo(selectedCourt.coordinates);
        map.setZoom(14);
      } catch (err) {
        console.warn("Map camera pan error:", err);
      }
    }
  }, [map, selectedCourt]);

  return null;
}

// OpenStreetMap / Leaflet Fallback Component
function LeafletCourtMap({ courts, selectedCourt, onSelectCourt }: CourtMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Record<string, L.Marker>>({});

  const defaultCenter: [number, number] = selectedCourt?.coordinates 
    ? [selectedCourt.coordinates.lat, selectedCourt.coordinates.lng]
    : courts.length > 0 
      ? [courts[0].coordinates.lat, courts[0].coordinates.lng]
      : [9.3090, 123.2933];

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Initialize Leaflet map if not already done
    if (!leafletMapRef.current) {
      const map = L.map(mapContainerRef.current, {
        zoomControl: true,
        scrollWheelZoom: true,
      }).setView(defaultCenter, 12);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      leafletMapRef.current = map;
    }

    const map = leafletMapRef.current;

    // Clear old markers
    (Object.values(markersRef.current) as L.Marker[]).forEach(marker => marker.remove());
    markersRef.current = {};

    // Add court markers
    courts.forEach(court => {
      const isSelected = selectedCourt?.id === court.id;
      const markerBg = isSelected ? '#059669' : (court.isPremium ? '#10b981' : '#2563eb');

      const customIcon = L.divIcon({
        className: 'custom-leaflet-pin',
        html: `
          <div style="
            background-color: ${markerBg};
            width: ${isSelected ? '34px' : '28px'};
            height: ${isSelected ? '34px' : '28px'};
            border-radius: 50%;
            border: 2.5px solid white;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 10px rgba(0,0,0,0.3);
            color: white;
            font-size: ${isSelected ? '14px' : '11px'};
            font-weight: bold;
            transition: all 0.2s ease;
            cursor: pointer;
          ">
            🎾
          </div>
        `,
        iconSize: [isSelected ? 34 : 28, isSelected ? 34 : 28],
        iconAnchor: [isSelected ? 17 : 14, isSelected ? 17 : 14],
      });

      const marker = L.marker([court.coordinates.lat, court.coordinates.lng], { icon: customIcon })
        .addTo(map);

      const popupContent = `
        <div class="leaflet-court-popup-card" style="
          font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          width: 230px;
          border-radius: 14px;
          overflow: hidden;
          background: #ffffff;
        ">
          <!-- Court Photo Cover Banner -->
          <div style="position: relative; height: 95px; background: #e2e8f0; overflow: hidden;">
            <img src="${court.image}" alt="${court.name}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.onerror=null; this.src='https://upload.wikimedia.org/wikipedia/commons/3/39/Outdoor_pickleball_courts.jpg';" />
            
            <div style="
              position: absolute;
              top: 8px;
              right: 8px;
              background: rgba(15, 23, 42, 0.85);
              backdrop-filter: blur(4px);
              color: white;
              padding: 2px 8px;
              border-radius: 20px;
              font-size: 10px;
              font-weight: 800;
              display: flex;
              align-items: center;
              gap: 3px;
              box-shadow: 0 2px 4px rgba(0,0,0,0.2);
            ">
              <span style="color: #fbbf24;">★</span> ${court.rating > 0 ? court.rating.toFixed(1) : 'New'}
            </div>

            ${court.isPremium ? `
              <div style="
                position: absolute;
                top: 8px;
                left: 8px;
                background: #059669;
                color: white;
                padding: 2px 8px;
                border-radius: 20px;
                font-size: 9px;
                font-weight: 800;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.2);
              ">
                Featured
              </div>
            ` : ''}
          </div>

          <!-- Body -->
          <div style="padding: 12px;">
            <!-- Court Name -->
            <h4 style="
              margin: 0 0 4px 0;
              font-size: 13px;
              font-weight: 800;
              color: #0f172a;
              line-height: 1.35;
            ">
              ${court.name}
            </h4>

            <!-- Location Address -->
            <div style="
              font-size: 10px;
              color: #64748b;
              margin-bottom: 8px;
              display: flex;
              align-items: center;
              gap: 4px;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
            ">
              <span style="color: #10b981;">📍</span> ${court.city} • ${court.address}
            </div>

            <!-- Rating & Attributes Summary -->
            <div style="
              background: #f8fafc;
              border: 1px solid #f1f5f9;
              border-radius: 8px;
              padding: 6px 8px;
              margin-bottom: 10px;
              display: flex;
              align-items: center;
              justify-content: space-between;
            ">
              <div>
                <span style="font-size: 11px; font-weight: 800; color: #059669;">★ ${court.rating > 0 ? court.rating.toFixed(1) : 'New'}</span>
                <span style="font-size: 10px; color: #64748b; margin-left: 2px;">(${court.reviewCount || 0} reviews)</span>
              </div>
              <div style="display: flex; gap: 4px;">
                <span style="background: #e2e8f0; color: #334155; font-size: 9px; font-weight: 700; padding: 2px 5px; border-radius: 4px;">
                  ${court.indoor ? 'Indoor' : 'Outdoor'}
                </span>
                <span style="background: #e2e8f0; color: #334155; font-size: 9px; font-weight: 700; padding: 2px 5px; border-radius: 4px;">
                  ${court.fee}
                </span>
              </div>
            </div>

            <!-- Quick-action View Details Link -->
            <button id="btn-court-${court.id}" style="
              width: 100%;
              background: #059669;
              color: #ffffff;
              border: none;
              padding: 7px 10px;
              border-radius: 8px;
              font-size: 11px;
              font-weight: 700;
              cursor: pointer;
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 6px;
              box-shadow: 0 2px 6px rgba(5, 150, 105, 0.25);
              transition: all 0.15s ease;
            ">
              <span>View Details & Reviews</span>
              <span style="font-size: 12px; font-weight: bold;">&rarr;</span>
            </button>
          </div>
        </div>
      `;

      const popup = L.popup({
        className: 'custom-court-popup',
        maxWidth: 250,
        minWidth: 220,
        closeButton: true,
        offset: [0, -12]
      }).setContent(popupContent);

      marker.bindPopup(popup);

      marker.on('click', () => {
        onSelectCourt(court);
      });

      marker.on('popupopen', () => {
        const btn = document.getElementById(`btn-court-${court.id}`);
        if (btn) {
          btn.onclick = (e) => {
            e.preventDefault();
            onSelectCourt(court);
            const detailsEl = document.getElementById('court-details-panel') || document.getElementById(`court-card-${court.id}`);
            if (detailsEl) {
              detailsEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
          };
        }
      });

      markersRef.current[court.id] = marker;
    });

    // Pan map & open popup if court selected
    if (selectedCourt) {
      map.panTo([selectedCourt.coordinates.lat, selectedCourt.coordinates.lng], { animate: true });
      if (markersRef.current[selectedCourt.id]) {
        markersRef.current[selectedCourt.id].openPopup();
      }
    }

    return () => {
      // Keep map initialized on rerenders
    };
  }, [courts, selectedCourt]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  }, []);

  return (
    <div className="w-full h-full relative min-h-[380px] z-0">
      <div ref={mapContainerRef} className="w-full h-full min-h-[380px] md:min-h-[420px] rounded-b-3xl overflow-hidden" />
    </div>
  );
}

export default function CourtMap({ courts, selectedCourt, onSelectCourt }: CourtMapProps) {
  const [activeInfoWindow, setActiveInfoWindow] = useState<Court | null>(selectedCourt);
  const [googleMapsError, setGoogleMapsError] = useState<boolean>(false);
  const [forceOpenStreetMap, setForceOpenStreetMap] = useState<boolean>(!isGoogleApiKeyFormat);

  // Catch Google Maps authentication failures globally
  useEffect(() => {
    const prevAuthFailure = (window as any).gm_authFailure;

    (window as any).gm_authFailure = () => {
      console.warn("Google Maps JavaScript API authentication error (InvalidKeyMapError). Switching to OpenStreetMap.");
      setGoogleMapsError(true);
      if (typeof prevAuthFailure === 'function') {
        prevAuthFailure();
      }
    };

    return () => {
      (window as any).gm_authFailure = prevAuthFailure;
    };
  }, []);

  useEffect(() => {
    if (selectedCourt) {
      setActiveInfoWindow(selectedCourt);
    }
  }, [selectedCourt]);

  const defaultCenter = selectedCourt?.coordinates || 
    (courts.length > 0 ? courts[0].coordinates : { lat: 9.3090, lng: 123.2933 });

  const renderGoogleMap = isGoogleApiKeyFormat && !googleMapsError && !forceOpenStreetMap;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm space-y-0">
      {/* Header controls */}
      <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
            <MapPin className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-display font-bold text-slate-900 dark:text-white text-sm">
              Interactive Court Map Navigator
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Showing {courts.length} verified courts on map
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {selectedCourt && (
            <div className="text-xs bg-emerald-50 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 font-medium px-3 py-1 rounded-full border border-emerald-200/50 flex items-center gap-1.5">
              <Navigation className="w-3 h-3 text-emerald-600" />
              Focused: <span className="font-bold truncate max-w-[140px]">{selectedCourt.name}</span>
            </div>
          )}

          {/* Toggle Provider */}
          {isGoogleApiKeyFormat && !googleMapsError && (
            <button
              onClick={() => setForceOpenStreetMap(!forceOpenStreetMap)}
              className="px-2.5 py-1 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-all bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
              title="Switch map engine"
            >
              <Layers className="w-3.5 h-3.5 text-emerald-500" />
              {forceOpenStreetMap ? 'Use Google Maps' : 'Use OpenStreetMap'}
            </button>
          )}
        </div>
      </div>

      {/* Banner if Google Maps key is missing or invalid */}
      {(!isGoogleApiKeyFormat || googleMapsError) && (
        <div className="bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-800/50 px-4 py-2.5 text-xs flex items-center justify-between gap-3 text-amber-900 dark:text-amber-200">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>Map Engine:</strong> Running on interactive OpenStreetMap. To enable Google Satellite & Vector maps, add a valid <code className="bg-amber-100 dark:bg-amber-900/80 px-1 py-0.5 rounded font-mono text-[10px]">GOOGLE_MAPS_PLATFORM_KEY</code> in Settings &rarr; Secrets.
            </span>
          </div>
          <a
            href="https://console.cloud.google.com/google/maps-apis/start?utm_campaign=gmp-code-assist-ais"
            target="_blank"
            rel="noopener noreferrer"
            className="text-amber-700 dark:text-amber-300 font-bold underline whitespace-nowrap shrink-0 hover:text-amber-900"
          >
            Get Key &rarr;
          </a>
        </div>
      )}

      {/* Map Body */}
      <div className="w-full h-[380px] md:h-[420px] relative">
        {renderGoogleMap ? (
          <MapErrorBoundary
            fallback={
              <LeafletCourtMap
                courts={courts}
                selectedCourt={selectedCourt}
                onSelectCourt={onSelectCourt}
              />
            }
          >
            <APIProvider apiKey={API_KEY} version="weekly">
              <Map
                defaultCenter={defaultCenter}
                defaultZoom={12}
                mapId="DEMO_MAP_ID"
                internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
                style={{ width: '100%', height: '100%' }}
                gestureHandling="greedy"
                disableDefaultUI={false}
              >
                <MapCameraController selectedCourt={selectedCourt} />

                {courts.map((court) => {
                  const isSelected = selectedCourt?.id === court.id;
                  return (
                    <AdvancedMarker
                      key={court.id}
                      position={court.coordinates}
                      title={court.name}
                      onClick={() => {
                        onSelectCourt(court);
                        setActiveInfoWindow(court);
                      }}
                    >
                      <Pin
                        background={isSelected ? '#059669' : (court.isPremium ? '#10b981' : '#2563eb')}
                        borderColor={isSelected ? '#047857' : '#1e40af'}
                        glyphColor="#ffffff"
                        scale={isSelected ? 1.25 : 1.0}
                      />
                    </AdvancedMarker>
                  );
                })}

                {activeInfoWindow && (
                  <InfoWindow
                    position={activeInfoWindow.coordinates}
                    onCloseClick={() => setActiveInfoWindow(null)}
                  >
                    <div className="p-1 max-w-[220px] text-slate-900 space-y-1.5">
                      <div className="font-bold text-xs flex items-center justify-between gap-1">
                        <span className="truncate">{activeInfoWindow.name}</span>
                        <span className="bg-emerald-100 text-emerald-800 text-[9px] px-1.5 py-0.5 rounded font-extrabold shrink-0">
                          ★ {activeInfoWindow.rating}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 line-clamp-2 leading-tight">
                        {activeInfoWindow.address}
                      </p>
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-500 pt-0.5">
                        <span className="bg-slate-100 px-1.5 py-0.5 rounded font-semibold">
                          {activeInfoWindow.indoor ? 'Indoor' : 'Outdoor'}
                        </span>
                        <span className="bg-slate-100 px-1.5 py-0.5 rounded font-semibold">
                          {activeInfoWindow.fee}
                        </span>
                      </div>
                      <button
                        onClick={() => onSelectCourt(activeInfoWindow)}
                        className="w-full mt-1 bg-emerald-600 text-white text-[10px] font-bold py-1 px-2 rounded hover:bg-emerald-500 transition-colors text-center block"
                      >
                        View Court Details & Reviews
                      </button>
                    </div>
                  </InfoWindow>
                )}
              </Map>
            </APIProvider>
          </MapErrorBoundary>
        ) : (
          <LeafletCourtMap
            courts={courts}
            selectedCourt={selectedCourt}
            onSelectCourt={onSelectCourt}
          />
        )}
      </div>
    </div>
  );
}

