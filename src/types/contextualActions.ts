/**
 * Phase 19 — Personalized Contextual Quick Actions Data Models
 * SIH26076 · PersonalizedMAUSAM
 *
 * Types for dynamic contextual action synthesis mapping existing state to screens.
 */

import type { UserPersonaType, WeatherPreferenceType, WeatherDataMode } from './index';
import type { RootStackParamList } from '../navigation/types';

export type ContextualActionType =
  | 'safety'
  | 'activity'
  | 'travel'
  | 'event'
  | 'forecast'
  | 'alerts'
  | 'ask_mausam'
  | 'locations'
  | 'insights'
  | 'profile'
  | 'daily_briefing';

export interface ContextualAction {
  id: string;
  type: ContextualActionType;
  title: string;
  subtitle: string;
  icon: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  reason: string;
  route: keyof RootStackParamList;
  critical: boolean;
  visible: boolean;
}

export interface ContextualActionInput {
  activeLocationName: string;
  selectedPersonas: UserPersonaType[];
  selectedPreferences?: WeatherPreferenceType[];
  weatherData: any; // WeatherData
  recommendations: any[]; // PersonalizedRecommendation[]
  alerts: any[]; // WeatherAlert[]
  isSafetyActive: boolean;
  dataMode: WeatherDataMode;
  forecastData?: any; // ForecastData
}
