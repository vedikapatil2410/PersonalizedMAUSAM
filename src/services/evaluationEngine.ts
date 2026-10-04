// src/services/evaluationEngine.ts
/**
 * Pure deterministic evaluation service for Judge Evaluation Mode.
 * It consumes existing engines and returns deterministic metrics.
 */
import type { EvaluationScenario, EvaluationResult, EvaluationMetric } from '../types/evaluation';
import type { WeatherData, WeatherDataMode, AppState, DemoWeatherScenario } from '../types';
import { generatePersonalizedRecommendations } from './personalizationEngine';
import { decideRecommendations } from './decisionEngine';
import { isSafetyOverrideActive } from './safetyOverrideEngine';
import { generatePersonalizedAlerts } from './alertEngine';
import { generateContextualActions } from './contextualActionEngine';
import { generateHomepageLayout } from './homepageLayoutEngine';
import { demoWeatherScenarios } from '../constants/demoScenarios';

/**
 * Evaluate a single scenario and compute deterministic metrics.
 */
export const evaluateScenario = (scenario: EvaluationScenario): EvaluationResult => {
  // Resolve weather data from demo scenario ID
  const scenarioObj = (Object.values(demoWeatherScenarios) as DemoWeatherScenario[]).find(
    (s) => s.id === scenario.weatherScenario
  );
  const weatherData: WeatherData = scenarioObj
    ? scenarioObj.weatherData
    : Object.values(demoWeatherScenarios)[0].weatherData;

  // Build minimal app state needed for engines
  const appState: AppState = {
    selectedPersonas: [scenario.persona],
    selectedPreferences: scenario.preferences,
    selectedLocation: scenario.location,
    savedLocations: [],
    onboardingCompleted: true,
  };

  // Personalization recommendations (raw)
  const rawRecs = generatePersonalizedRecommendations({ userState: appState, weatherData });

  // Decision engine ranking (deterministic)
  const ranked = decideRecommendations(rawRecs);

  // Safety override detection (function signature accepts WeatherData)
  const safetyActive = isSafetyOverrideActive(weatherData);

  // Alerts (including safety alerts)
  const alerts = generatePersonalizedAlerts({
    weatherData,
    userState: appState,
    dataMode: 'demo' as WeatherDataMode,
  });

  // Contextual actions (existing engine consumes ContextualActionInput)
  const actions = generateContextualActions({
    activeLocationName: scenario.location,
    selectedPersonas: [scenario.persona],
    selectedPreferences: scenario.preferences,
    weatherData,
    recommendations: ranked,
    alerts,
    isSafetyActive: safetyActive,
    dataMode: 'demo' as WeatherDataMode,
  });

  // Homepage layout (cards) – we only need to know if ordering changed compared to baseline.
  // For deterministic baseline we use the same inputs but without persona (empty array).
  const baselineCards = generateHomepageLayout({
    activeLocationName: scenario.location,
    selectedPersonas: [],
    selectedPreferences: scenario.preferences,
    weatherData,
    recommendations: ranked,
    alerts,
    isSafetyActive: safetyActive,
    dataMode: 'demo' as WeatherDataMode,
  });

  const personaCards = generateHomepageLayout({
    activeLocationName: scenario.location,
    selectedPersonas: [scenario.persona],
    selectedPreferences: scenario.preferences,
    weatherData,
    recommendations: ranked,
    alerts,
    isSafetyActive: safetyActive,
    dataMode: 'demo' as WeatherDataMode,
  });

  const orderingChanged = JSON.stringify(baselineCards.cards) !== JSON.stringify(personaCards.cards);

  // Compute metrics
  const metrics: EvaluationMetric = {
    totalRecommendations: ranked.length,
    personaRecommendations: ranked.filter((r) => r.relevantPersonas?.includes(scenario.persona)).length,
    weatherRecommendations: ranked.filter((r) => !!r.weatherTrigger).length,
    criticalSafetyItems: alerts.filter((a) => a.severity === 'critical' || a.category === 'safety').length,
    contextualActions: actions.length,
    homepageOrderingChanged: orderingChanged,
    safetyOverrideActive: safetyActive,
  };

  const evidence: Record<string, 'YES' | 'NO'> = {
    personalizationDetected: metrics.totalRecommendations > 0 ? 'YES' : 'NO',
    personaSpecific: metrics.personaRecommendations > 0 ? 'YES' : 'NO',
    weatherTriggered: metrics.weatherRecommendations > 0 ? 'YES' : 'NO',
    safetyOverride: metrics.safetyOverrideActive ? 'YES' : 'NO',
    orderingChanged: metrics.homepageOrderingChanged ? 'YES' : 'NO',
  };

  return { scenario, metrics, evidence };
};

/**
 * Evaluate a list of scenarios and produce a summary.
 */
export const evaluateScenarios = (scenarios: EvaluationScenario[]) => {
  const results = scenarios.map(evaluateScenario);
  const totals: EvaluationMetric = results.reduce(
    (acc, cur) => {
      acc.totalRecommendations += cur.metrics.totalRecommendations;
      acc.personaRecommendations += cur.metrics.personaRecommendations;
      acc.weatherRecommendations += cur.metrics.weatherRecommendations;
      acc.criticalSafetyItems += cur.metrics.criticalSafetyItems;
      acc.contextualActions += cur.metrics.contextualActions;
      // Boolean aggregation: true if any true
      acc.homepageOrderingChanged = acc.homepageOrderingChanged || cur.metrics.homepageOrderingChanged;
      acc.safetyOverrideActive = acc.safetyOverrideActive || cur.metrics.safetyOverrideActive;
      return acc;
    },
    {
      totalRecommendations: 0,
      personaRecommendations: 0,
      weatherRecommendations: 0,
      criticalSafetyItems: 0,
      contextualActions: 0,
      homepageOrderingChanged: false,
      safetyOverrideActive: false,
    } as EvaluationMetric,
  );
  return { results, totals } as const;
};
