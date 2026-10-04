/**
 * Phase 16 — Personalized Forecast & Weather Timeline
 * SIH26076 · PersonalizedMAUSAM
 *
 * Data models for time-based weather forecasts and activity guidance.
 */

import type { WeatherConditionType } from './index';

export interface ForecastPeriod {
  id: string;
  timestamp: string;
  displayTime: string; // e.g. "Now", "+3 hrs (2:00 PM)", "+6 hrs (5:00 PM)"
  temperature: number;
  feelsLike: number;
  condition: WeatherConditionType;
  humidity: number;
  windSpeed: number;
  windDirection: string;
  rainProbability: number | null; // Nullable when not available from feed
  rainfall: number | null;        // Nullable when not available from feed
  uvIndex: number | null;         // Nullable when not available from feed
  visibility: number | null;      // Nullable when not available from feed
  availableFields: string[];      // Array of actually available metric keys
  personalizedNote?: string;
  badge?: string;
}

export interface ForecastData {
  locationId: string;
  locationName: string;
  source: string;
  dataMode: 'live' | 'demo';
  updatedAt: string;
  isAvailable: boolean;
  unavailableReason?: string;
  periods: ForecastPeriod[];
}

export type ActivitySuitabilityLevel = 'optimal' | 'favorable' | 'caution' | 'hazardous';

export interface ActivityRating {
  id: string;
  name: string;
  icon: string;
  level: ActivitySuitabilityLevel;
  ratingLabel: string;
  bestWindow: string;
  summary: string;
  primaryMetrics: { label: string; value: string; isAvailable: boolean }[];
  relevantPersonas: string[];
}
