import type { PreferenceMetadata, WeatherPreferenceType } from '../types';

export const PREFERENCE_CATALOG: PreferenceMetadata[] = [
  {
    id: 'temperature',
    title: 'Temperature',
    description: 'Current real-feel, highs & lows',
    icon: '🌡️',
  },
  {
    id: 'rainfall',
    title: 'Rainfall',
    description: 'Precipitation chance & volume',
    icon: '🌧️',
  },
  {
    id: 'wind',
    title: 'Wind',
    description: 'Wind speed, gusts & direction',
    icon: '💨',
  },
  {
    id: 'humidity',
    title: 'Humidity',
    description: 'Moisture levels & dew point',
    icon: '💧',
  },
  {
    id: 'uv_index',
    title: 'UV Index',
    description: 'Sun exposure & protection levels',
    icon: '☀️',
  },
  {
    id: 'air_quality',
    title: 'Air Quality',
    description: 'AQI score and particulate matter',
    icon: '🍃',
  },
  {
    id: 'visibility',
    title: 'Visibility',
    description: 'Fog levels & road/sky distance',
    icon: '🌫️',
  },
  {
    id: 'sun_times',
    title: 'Sunrise & Sunset',
    description: 'Daylight hours & twilight times',
    icon: '🌅',
  },
  {
    id: 'severe_alerts',
    title: 'Severe Weather Alerts',
    description: 'Critical warnings & meteorological safety',
    icon: '⚠️',
  },
];

export const DEFAULT_PREFERENCES: WeatherPreferenceType[] = [
  'temperature',
  'rainfall',
  'severe_alerts',
];
