/**
 * Phase 18 — Adaptive Personalized Homepage & Card Layout Data Models
 * SIH26076 · PersonalizedMAUSAM
 *
 * Types for dynamic homepage composition, card ordering, and layout explanation.
 */

import type { UserPersonaType, WeatherPreferenceType, WeatherDataMode } from './index';
import type { RootStackParamList } from '../navigation/types';

export type HomepageCardType =
  | 'safety'
  | 'weather_summary'
  | 'daily_briefing'
  | 'personalized_recommendations'
  | 'alerts'
  | 'forecast'
  | 'activity'
  | 'travel'
  | 'event'
  | 'notifications'
  | 'personalization_insights'
  | 'saved_locations'
  | 'quick_actions';

export interface HomepageCard {
  id: string;
  type: HomepageCardType;
  title: string;
  subtitle?: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  visible: boolean;
  position: number;
  reason: string;
  route?: keyof RootStackParamList;
  icon?: string;
  badge?: string;
}

export interface HomepageLayout {
  cards: HomepageCard[];
  generatedAt: string;
  activeLocation: string;
  activeLocationLabel?: string;
  activePersonas: UserPersonaType[];
  activePreferences: WeatherPreferenceType[];
  dataMode: WeatherDataMode;
  explanation: string;
  primaryPersona?: UserPersonaType;
}
