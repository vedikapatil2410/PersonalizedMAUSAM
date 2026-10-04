import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { WeatherContext } from './WeatherContext';
import { useApp } from './AppContext';
import { DEMO_SCENARIO_LIST, getDemoWeatherScenario } from '../constants/demoWeather';
import { API_CONFIG } from '../constants/config';
import type { DemoScenarioId, WeatherContextType, WeatherData, WeatherDataMode } from '../types';

interface WeatherProviderProps {
  children: React.ReactNode;
}

export const WeatherProvider: React.FC<WeatherProviderProps> = ({ children }) => {
  const { selectedLocation } = useApp();
  const [dataMode, setDataMode] = useState<WeatherDataMode>('live');
  const [currentScenarioId, setCurrentScenarioId] = useState<DemoScenarioId>('NORMAL');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [liveWeather, setLiveWeather] = useState<WeatherData | null>(null);

  const fetchLiveWeather = useCallback(async (city: string) => {
    setIsLoading(true);
    setError(null);

    const queryCity = city === 'Choose Later' ? API_CONFIG.defaultCity : (city || API_CONFIG.defaultCity);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.requestTimeoutMs);

      const url = `${API_CONFIG.backendUrl}/api/imd/weather?city=${encodeURIComponent(queryCity)}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Backend returned status ${response.status}`);
      }

      const payload = await response.json();
      const raw = payload.weather || payload.data;
      if ((payload.success || payload.status === 'success') && raw) {
        const mappedWeather: WeatherData = {
          location: city === 'Choose Later' ? 'Pune (Default Station)' : (raw.location || queryCity),
          timestamp: raw.timestamp || new Date().toISOString(),
          temperature: typeof raw.temperature === 'number' ? raw.temperature : 25.0,
          feelsLike: typeof raw.feelsLike === 'number' ? raw.feelsLike : (raw.temperature || 25.0),
          humidity: typeof raw.humidity === 'number' ? raw.humidity : 50,
          rainfall: typeof raw.rainfall === 'number' ? raw.rainfall : 0,
          rainProbability: typeof raw.rainProbability === 'number' ? raw.rainProbability : 0,
          windSpeed: typeof raw.windSpeed === 'number' ? raw.windSpeed : 0,
          windDirection: raw.windDirection || 'Calm',
          uvIndex: typeof raw.uvIndex === 'number' ? raw.uvIndex : 0,
          visibility: typeof raw.visibility === 'number' ? raw.visibility : 0,
          weatherCondition: raw.weatherCondition || 'clear',
          sunrise: raw.sunrise || '06:00 (IST)',
          sunset: raw.sunset || '18:30 (IST)',
          severity: raw.severity || 'normal',
          summary: raw.summary || 'Official IMD observation data.',
          externalData: payload.externalData || undefined,
          pollen: payload.externalData?.pollen?.available && payload.externalData.pollen.data
            ? {
                available: true,
                indexValue: payload.externalData.pollen.data.indexValue,
                category: payload.externalData.pollen.data.category,
                dominantPollenType: payload.externalData.pollen.data.dominantPollenType,
              }
            : null,
        };
        setLiveWeather(mappedWeather);
        setError(null);
      } else {
        throw new Error(payload.message || 'Invalid response from IMD service');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(`Unable to load live IMD weather data.`);
      console.warn(`[WeatherProvider] Live IMD weather fetch failed: ${message}`);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (dataMode === 'live') {
      fetchLiveWeather(selectedLocation);
    }
  }, [dataMode, selectedLocation, fetchLiveWeather]);

  const currentWeatherData: WeatherData = useMemo(() => {
    if (dataMode === 'live' && liveWeather) {
      return liveWeather;
    }
    // Fallback or demo mode: deterministic demo scenario
    const base = getDemoWeatherScenario(currentScenarioId).weatherData;
    return {
      ...base,
      location: selectedLocation === 'Choose Later' ? 'Unassigned Station' : (selectedLocation || 'Pune'),
    };
  }, [dataMode, liveWeather, currentScenarioId, selectedLocation]);

  const setScenario = (id: DemoScenarioId) => {
    setCurrentScenarioId(id);
  };

  const value: WeatherContextType = {
    currentScenarioId,
    availableScenarios: DEMO_SCENARIO_LIST,
    setScenario,
    dataMode,
    setDataMode,
    isLoading,
    error,
    liveWeather,
    currentWeatherData,
  };

  return <WeatherContext.Provider value={value}>{children}</WeatherContext.Provider>;
};
