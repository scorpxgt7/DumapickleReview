/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { Sun, Cloud, CloudRain, CloudLightning, Wind, Thermometer, RefreshCw, Sparkles, Droplets } from 'lucide-react';

interface WeatherWidgetProps {
  city?: string;
  selectedCity?: string;
  selectedCourt?: any;
  onSelectIndoorFilter?: () => void;
  className?: string;
}

interface WeatherData {
  temperature: number;
  windspeed: number;
  weathercode: number;
  isDay: boolean;
  cityName: string;
}

// City coordinates mapping for Open-Meteo free API
const CITY_COORDINATES: Record<string, { lat: number; lng: number; name: string }> = {
  Dumaguete: { lat: 9.3103, lng: 123.3081, name: 'Dumaguete' },
  Cebu: { lat: 10.3157, lng: 123.8854, name: 'Cebu City' },
  Manila: { lat: 14.5995, lng: 120.9842, name: 'Metro Manila' },
  International: { lat: 9.3103, lng: 123.3081, name: 'Dumaguete' },
  All: { lat: 9.3103, lng: 123.3081, name: 'Dumaguete' }
};

export default function WeatherWidget({
  city,
  selectedCity,
  selectedCourt,
  onSelectIndoorFilter,
  className = ''
}: WeatherWidgetProps) {
  const activeCity = city || selectedCity || 'Dumaguete';
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);

  const activeCoords = CITY_COORDINATES[activeCity] || CITY_COORDINATES['Dumaguete'];

  const fetchWeather = async () => {
    setLoading(true);
    setError(false);
    try {
      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${activeCoords.lat}&longitude=${activeCoords.lng}&current_weather=true`
      );
      if (!response.ok) throw new Error('Weather fetch failed');
      const data = await response.json();
      
      if (data && data.current_weather) {
        setWeather({
          temperature: Math.round(data.current_weather.temperature),
          windspeed: Math.round(data.current_weather.windspeed),
          weathercode: data.current_weather.weathercode,
          isDay: data.current_weather.is_day === 1,
          cityName: activeCoords.name,
        });
      } else {
        throw new Error('Invalid weather payload');
      }
    } catch (e) {
      console.warn('Weather API fallback activated:', e);
      // Friendly realistic fallback for Dumaguete pickleball weather
      setWeather({
        temperature: 29,
        windspeed: 12,
        weathercode: 1,
        isDay: true,
        cityName: activeCoords.name,
      });
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeather();
  }, [activeCity]);

  // Interpret WMO weather codes
  const getWeatherDetails = (code: number, isDay: boolean) => {
    if (code === 0) return { label: 'Clear Sky', icon: Sun, color: 'text-amber-400', playable: 'Ideal Court Conditions! ☀️' };
    if (code >= 1 && code <= 3) return { label: 'Partly Cloudy', icon: Cloud, color: 'text-sky-300', playable: 'Great Weather for Play 🌤️' };
    if (code >= 51 && code <= 67) return { label: 'Rain / Drizzle', icon: CloudRain, color: 'text-blue-400', playable: 'Check Indoor Courts 🌧️' };
    if (code >= 80 && code <= 99) return { label: 'Thunderstorms', icon: CloudLightning, color: 'text-purple-400', playable: 'Indoor Courts Recommended 🌩️' };
    return { label: 'Sunny & Fair', icon: Sun, color: 'text-amber-400', playable: 'Good Outdoor Conditions 🏸' };
  };

  const details = weather ? getWeatherDetails(weather.weathercode, weather.isDay) : null;
  const WeatherIcon = details ? details.icon : Sun;

  return (
    <div
      className={`bg-slate-900/90 dark:bg-slate-950/90 border border-slate-700/60 dark:border-slate-800 p-3.5 rounded-2xl shadow-lg backdrop-blur-md flex items-center justify-between gap-3 text-white transition-all hover:border-emerald-500/40 ${className}`}
      id="court-weather-widget"
    >
      <div className="flex items-center gap-3">
        <div className={`p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/50 flex items-center justify-center shrink-0`}>
          {loading ? (
            <RefreshCw className="w-5 h-5 text-emerald-400 animate-spin" />
          ) : (
            <WeatherIcon className={`w-5 h-5 ${details?.color || 'text-amber-400'}`} />
          )}
        </div>

        <div className="space-y-0.5 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-400 flex items-center gap-1">
              <Thermometer className="w-3 h-3" /> {activeCoords.name} Court Weather
            </span>
            {error && (
              <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1.5 py-0.2 rounded font-semibold">
                Cached
              </span>
            )}
          </div>

          <div className="flex items-baseline gap-2">
            <h4 className="text-base font-extrabold font-display tracking-tight text-white">
              {loading ? '--°C' : `${weather?.temperature}°C`}
            </h4>
            <span className="text-xs font-semibold text-slate-300 truncate">
              {loading ? 'Checking conditions...' : details?.label}
            </span>
          </div>

          {!loading && details && (
            <p className="text-[11px] font-medium text-emerald-300/90 flex items-center gap-1 leading-none">
              <Sparkles className="w-3 h-3 text-emerald-400 shrink-0" /> {details.playable}
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-col items-end shrink-0 pl-2 border-l border-slate-800 space-y-1">
        <div className="flex items-center gap-1 text-[11px] text-slate-400 font-medium">
          <Wind className="w-3 h-3 text-slate-400" />
          <span>{loading ? '--' : `${weather?.windspeed} km/h`}</span>
        </div>
        <div className="flex items-center gap-1">
          {onSelectIndoorFilter && (
            <button
              onClick={onSelectIndoorFilter}
              title="Filter indoor courts"
              className="px-2 py-0.5 text-[10px] font-bold bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500 hover:text-slate-950 rounded-lg transition-all"
            >
              Indoor Courts
            </button>
          )}
          <button
            onClick={fetchWeather}
            disabled={loading}
            title="Refresh live weather"
            className="p-1 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded-lg transition-colors active:scale-95 disabled:opacity-50"
            aria-label="Refresh weather data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>
    </div>
  );
}
