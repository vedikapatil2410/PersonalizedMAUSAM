/**
 * Domain types for PersonalizedMAUSAM.
 * Phase 4: Weather Data Model, Deterministic Demo Scenarios & Context.
 */

// Personas & User Preferences
export type UserPersonaType =
  | 'health'
  | 'fitness'
  | 'travel'
  | 'agriculture'
  | 'commuting'
  | 'family'
  | 'outdoor'
  | 'events';

export interface PersonaMetadata {
  id: UserPersonaType;
  title: string;
  description: string;
  icon: string;
}

export type WeatherPreferenceType =
  | 'temperature'
  | 'rainfall'
  | 'wind'
  | 'humidity'
  | 'uv_index'
  | 'air_quality'
  | 'visibility'
  | 'sun_times'
  | 'severe_alerts';

export interface PreferenceMetadata {
  id: WeatherPreferenceType;
  title: string;
  description: string;
  icon: string;
}

import type { NotificationPreferences } from './notifications';
import type { WeatherLocation } from './locations';
import type { ActivityType, ActivityMetadata } from './activity';

export * from './activity';

export interface AppState {
  selectedPersonas: UserPersonaType[];
  selectedPreferences: WeatherPreferenceType[];
  selectedActivities?: ActivityType[];
  selectedLocation: string;
  savedLocations?: WeatherLocation[];
  onboardingCompleted: boolean;
  notificationPreferences?: NotificationPreferences;
}

export interface AppContextType extends AppState {
  selectedActivities: ActivityType[];
  savedLocations: WeatherLocation[];
  notificationPreferences: NotificationPreferences;
  togglePersona: (persona: UserPersonaType) => void;
  setPersonas: (personas: UserPersonaType[]) => void;
  togglePreference: (pref: WeatherPreferenceType) => void;
  setPreferences: (preferences: WeatherPreferenceType[]) => void;
  toggleActivity: (activity: ActivityType) => void;
  setActivities: (activities: ActivityType[]) => void;
  setLocation: (location: string) => void;
  setActiveLocation: (locationIdOrName: string) => void;
  addLocation: (location: { city: string; label?: string; name?: string }) => { success: boolean; error?: string };
  removeLocation: (locationId: string) => { success: boolean; error?: string };
  renameLocation: (locationId: string, newLabel: string) => { success: boolean; error?: string };
  setOnboardingCompleted: (completed: boolean) => void;
  resetOnboarding: () => void;
  updateNotificationPreferences: (prefs: Partial<NotificationPreferences>) => void;
  resetNotificationPreferences: () => void;
}

// Weather Domain Model
export type WeatherConditionType =
  | 'clear'
  | 'partly_cloudy'
  | 'cloudy'
  | 'rain'
  | 'thunderstorm'
  | 'fog'
  | 'heat'
  | 'severe';

export type WeatherSeverityType =
  | 'normal'
  | 'advisory'
  | 'warning'
  | 'severe';

export type DemoScenarioId =
  | 'NORMAL'
  | 'HOT_SUNNY'
  | 'RAINY'
  | 'HIGH_UV'
  | 'SEVERE_WEATHER';

export interface ExternalWeatherEnrichment {
  openMeteo?: {
    available: boolean;
    data: {
      uvIndex: number;
      visibilityKm: number;
      rawVisibilityMeters: number;
      timestamp: string;
      source: string;
    } | null;
    error?: string;
  };
  pollen?: {
    available: boolean;
    data: {
      available: boolean;
      indexValue: number;
      category: string;
      dominantPollenType: string;
      types: Array<{
        code: string;
        displayName: string;
        inSeason: boolean;
        indexValue: number;
        category: string;
      }>;
      timestamp: string;
      source: string;
    } | null;
    error?: string;
  };
  enrichedAt?: string;
}

export interface PollenInfo {
  available: boolean;
  indexValue: number;
  category: string;
  dominantPollenType: string;
}

export interface WeatherData {
  location: string;
  timestamp: string;
  temperature: number; // in °C
  feelsLike: number; // in °C
  humidity: number; // in %
  rainfall: number; // in mm
  rainProbability: number; // in %
  windSpeed: number; // in km/h
  windDirection: string; // e.g. "NW", "SW", "NE"
  uvIndex: number;
  visibility: number; // in km
  weatherCondition: WeatherConditionType;
  sunrise: string;
  sunset: string;
  severity: WeatherSeverityType;
  summary: string;
  externalData?: ExternalWeatherEnrichment;
  pollen?: PollenInfo | null;
}

export interface DemoWeatherScenario {
  id: DemoScenarioId;
  label: string;
  badge: string;
  icon: string;
  description: string;
  weatherData: WeatherData;
}

export type WeatherDataMode = 'live' | 'demo';

export interface WeatherContextType {
  // Demo mode
  currentScenarioId: DemoScenarioId;
  availableScenarios: DemoWeatherScenario[];
  setScenario: (id: DemoScenarioId) => void;

  // Live / Demo toggle (Phase 9)
  dataMode: WeatherDataMode;
  setDataMode: (mode: WeatherDataMode) => void;
  isLoading: boolean;
  error: string | null;
  liveWeather: WeatherData | null;

  // Unified current weather (live in live-mode, demo in demo-mode)
  currentWeatherData: WeatherData;
}

// Retained interfaces for future phases
export interface UserPreferences {
  temperatureUnit: 'celsius' | 'fahrenheit';
  windSpeedUnit: 'kmh' | 'ms';
  enableCriticalAlertOverride: boolean;
  highContrastMode?: boolean;
}

export type AlertSeverity = 'advisory' | 'watch' | 'warning' | 'emergency';

export interface ExplainabilityTag {
  id: string;
  title: string;
  rationale: string;
}

export * from './safety';
export * from './askMausam';
export * from './alerts';
export * from './notifications';
export * from './personalization';
export * from './personalizationInsights';
export * from './locations';
export * from './forecast';
export * from './dailyBriefing';
export * from './homepageLayout';
export * from './contextualActions';
export * from './personalizationSetup';
export * from './showcase';
export * from './demoPresentation';
export * from './evaluation';

