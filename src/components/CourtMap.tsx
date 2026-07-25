import React, { useState, useEffect } from 'react';
import { APIProvider, Map, AdvancedMarker, Pin, InfoWindow, useMap } from '@vis.gl/react-google-maps';
import { Court } from '../types';
import { MapPin, Star, Sparkles, Navigation, Layers, Info } from 'lucide-react';

const API_KEY =
  process.env.GOOGLE_MAPS_PLATFORM_KEY ||
  (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
  (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY ||
  '';

const hasValidKey = Boolean(API_KEY) && API_KEY !== 'YOUR_API_KEY';

interface CourtMapProps {
  courts: Court[];
  selectedCourt: Court | null;
  onSelectCourt: (court: Court) => void;
}

// Controller to update map center smoothly when selected court changes
function MapCameraController({ selectedCourt }: { selectedCourt: Court | null }) {
  const map = useMap();

  useEffect(() => {
    if (map && selectedCourt?.coordinates) {
      map.panTo(selectedCourt.coordinates);
      map.setZoom(14);
    }
  }, [map, selectedCourt]);

  return null;
}

export default function CourtMap({ courts, selectedCourt, onSelectCourt }: CourtMapProps) {
  const [activeInfoWindow, setActiveInfoWindow] = useState<Court | null>(selectedCourt);

  useEffect(() => {
    if (selectedCourt) {
      setActiveInfoWindow(selectedCourt);
    }
  }, [selectedCourt]);

  const defaultCenter = selectedCourt?.coordinates || 
    (courts.length > 0 ? courts[0].coordinates : { lat: 9.3090, lng: 123.2933 });

  if (!hasValidKey) {
    return (
      <div className="bg-slate-900 text-white rounded-3xl p-6 md:p-8 border border-slate-800 shadow-xl overflow-hidden relative">
        <div className="absolute -right-10 -bottom-10 opacity-10 pointer-events-none">
          <MapPin className="w-64 h-64 text-emerald-400" />
        </div>

        <div className="max-w-xl space-y-4 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold border border-emerald-500/30">
            <Sparkles className="w-3.5 h-3.5" /> Google Maps API Key Setup
          </div>

          <h3 className="font-display font-black text-xl md:text-2xl text-white">
            Geographic Court Map Integration
          </h3>

          <p className="text-slate-300 text-xs md:text-sm leading-relaxed">
            To render live interactive satellite and vector maps with exact court coordinates across Negros Oriental, Cebu, and Manila, add your Google Maps Platform API key in AI Studio.
          </p>

          <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-4 text-xs space-y-2">
            <p className="font-bold text-slate-200 flex items-center gap-2">
              <Info className="w-4 h-4 text-emerald-400" /> How to enable Google Maps:
            </p>
            <ol className="list-decimal list-inside space-y-1 text-slate-300 pl-1">
              <li>Get an API key from <a href="https://console.cloud.google.com/google/maps-apis/start?utm_campaign=gmp-code-assist-ais" target="_blank" rel="noopener noreferrer" className="text-emerald-400 underline font-medium">Google Cloud Console</a>.</li>
              <li>Open <strong>Settings</strong> (⚙️ gear icon, top-right) → <strong>Secrets</strong>.</li>
              <li>Add key name: <code className="bg-slate-900 text-emerald-300 px-1.5 py-0.5 rounded border border-slate-700">GOOGLE_MAPS_PLATFORM_KEY</code></li>
              <li>Paste your key value and press Enter. The app updates automatically!</li>
            </ol>
          </div>

          {/* Interactive Fallback Grid of Courts with GPS coordinates */}
          <div className="pt-2 space-y-2">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Verified GPS Coordinates ({courts.length} Courts):
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {courts.slice(0, 4).map(court => (
                <button
                  key={court.id}
                  onClick={() => onSelectCourt(court)}
                  className={`p-2.5 rounded-xl text-left border text-xs transition-all flex items-center gap-2 ${
                    selectedCourt?.id === court.id
                      ? 'bg-emerald-600 text-white border-emerald-500 font-bold'
                      : 'bg-slate-800/60 text-slate-300 border-slate-700 hover:bg-slate-800'
                  }`}
                >
                  <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <div className="truncate">
                    <div className="truncate font-medium">{court.name}</div>
                    <div className="text-[10px] opacity-70">
                      {court.coordinates.lat.toFixed(4)}°N, {court.coordinates.lng.toFixed(4)}°E
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm space-y-0">
      <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
            <MapPin className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-display font-bold text-slate-900 dark:text-white text-sm">
              Court Map Navigator
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Showing {courts.length} verified courts on interactive map
            </p>
          </div>
        </div>

        {selectedCourt && (
          <div className="text-xs bg-emerald-50 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 font-medium px-3 py-1 rounded-full border border-emerald-200/50 flex items-center gap-1.5">
            <Navigation className="w-3 h-3 text-emerald-600" />
            Focused: <span className="font-bold truncate max-w-[150px]">{selectedCourt.name}</span>
          </div>
        )}
      </div>

      <div className="w-full h-[380px] md:h-[420px] relative">
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
      </div>
    </div>
  );
}
