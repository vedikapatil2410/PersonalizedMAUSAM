// src/services/demoReliabilityEngine.ts
/**
 * Phase 25 – Demo Reliability Engine
 * Provides helper functions to start a controlled demo and reset the demo environment.
 * These functions rely on the existing AppContext and WeatherContext setters.
 */
import type { WeatherDataMode, DemoScenarioId, UserPersonaType, WeatherPreferenceType, WeatherLocation } from '../types';

export interface StartControlledDemoParams {
  setDataMode: (mode: WeatherDataMode) => void;
  setScenario: (id: DemoScenarioId) => void;
  onNavigate?: () => void;
}

/**
 * Switches the app into controlled demo mode, sets the demo scenario to NORMAL
 * and triggers navigation to the DemoPresentation screen.
 * Strictly preserves user personas, preferences, and saved locations.
 */
export function startControlledDemo({
  setDataMode,
  setScenario,
  onNavigate,
}: StartControlledDemoParams) {
  // Explicitly set mode to demo
  setDataMode('demo');
  // Set scenario to NORMAL
  setScenario('NORMAL');

  if (onNavigate) {
    onNavigate();
  }
}

export interface ResetDemoEnvironmentParams {
  setScenario: (id: DemoScenarioId) => void;
  onResetStep?: () => void;
}

/**
 * Resets temporary demo state without touching user preferences, personas, or saved locations.
 * It resets the demo scenario to NORMAL and resets the presentation step if provided.
 */
export function resetDemoEnvironment({
  setScenario,
  onResetStep,
}: ResetDemoEnvironmentParams) {
  setScenario('NORMAL');
  if (onResetStep) {
    onResetStep();
  }
}
