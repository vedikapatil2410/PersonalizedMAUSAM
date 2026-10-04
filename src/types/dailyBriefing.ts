/**
 * Phase 17 — Personalized Daily Weather Briefing Data Models
 * SIH26076 · PersonalizedMAUSAM
 *
 * Deterministic types for daily weather briefing summarizing current meteorological state,
 * available forecast transitions, active alerts, and persona-driven guidance.
 */

import type { WeatherAlert, WeatherDataMode } from './index';

export interface BriefingMetric {
  label: string;
  value: string;
  unit: string;
  available: boolean;
}

export interface BriefingHighlight {
  id: string;
  category: string;
  title: string;
  description: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  icon: string;
  explanation: string;
  badge?: string;
  personaId?: string;
}

export interface DailyBriefingSafetyState {
  isOverrideActive: boolean;
  criticalWarning?: string;
  actionRequired?: string;
}

export interface DailyBriefing {
  id: string;
  locationName: string;
  locationLabel: string;
  dataMode: WeatherDataMode;
  source: string;
  generatedAt: string;
  headline: string;
  summary: string;
  keyMetrics: BriefingMetric[];
  timelineHighlights: string[];
  personalizedHighlights: BriefingHighlight[];
  activeAlerts: WeatherAlert[];
  safetyState: DailyBriefingSafetyState;
  availableData: string[];
  unavailableData: string[];
}
