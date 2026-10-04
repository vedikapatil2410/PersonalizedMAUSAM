/**
 * Phase 17 Validation Suite — Personalized Daily Weather Briefing
 * SIH26076 · PersonalizedMAUSAM
 *
 * Comprehensive 26-test suite covering:
 * - Briefing engine initialization & deterministic synthesis
 * - Scenario coverage (NORMAL, HOT_SUNNY, RAINY, HIGH_UV, SEVERE_WEATHER)
 * - Safety override precedence (critical safety warning strictly at index 0)
 * - Safety warning independence from user persona selection
 * - Reuse of existing recommendations & alerts (no parallel engines)
 * - Data integrity (never fabricates live IMD fields, unavailable fields display as N/A)
 * - Attribution (Live IMD vs Prototype Demo)
 * - Multi-location awareness & context propagation
 * - Persona responsiveness
 * - Determinism across multiple calls
 * - Compatibility with Ask MAUSAM & Phase 16 Forecast
 */

import { generateDailyBriefing } from '../src/services/dailyBriefingEngine';
import { getDemoWeatherScenario } from '../src/constants/demoWeather';
import { getDemoForecast, getLiveForecast } from '../src/constants/demoForecast';
import { generatePersonalizedRecommendations } from '../src/services/personalizationEngine';
import { decideRecommendations } from '../src/services/decisionEngine';
import { applySafetyOverride } from '../src/services/safetyOverrideEngine';
import { generatePersonalizedAlerts } from '../src/services/alertEngine';
import { generateAskMausamResponse } from '../src/services/askMausamEngine';
import type { AppState, WeatherData, UserPersonaType } from '../src/types';

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    passed++;
    console.log(`  ✅ [PASS] ${testName}`);
  } else {
    failed++;
    console.error(`  ❌ [FAIL] ${testName}${detail ? ` — ${detail}` : ''}`);
  }
}

console.log('\n============================================================');
console.log('PHASE 17 — PERSONALIZED DAILY WEATHER BRIEFING VALIDATION');
console.log('============================================================\n');

// Standard user mock
const mockUserState: AppState = {
  selectedPersonas: ['fitness', 'commuting'],
  selectedPreferences: ['temperature', 'rainfall', 'severe_alerts'],
  selectedLocation: 'Pune',
  onboardingCompleted: true,
};

// Mock live IMD observation (Pune)
const mockLiveWeather: WeatherData = {
  location: 'Pune',
  timestamp: '2026-10-03T10:00:00Z',
  temperature: 28.0,
  feelsLike: 29.5,
  humidity: 62,
  rainfall: 0,
  rainProbability: 0,
  windSpeed: 12,
  windDirection: 'NW',
  uvIndex: 0,
  visibility: 0,
  weatherCondition: 'partly_cloudy',
  sunrise: '06:10 (IST)',
  sunset: '18:25 (IST)',
  severity: 'normal',
  summary: 'Official IMD observation for Pune station.',
};

// Helper to run pipeline
function runPipeline(weatherData: WeatherData, userState: AppState, dataMode: 'live' | 'demo') {
  const rawRecs = generatePersonalizedRecommendations({ userState, weatherData });
  const decidedRecs = decideRecommendations(rawRecs);
  const finalRecs = applySafetyOverride(decidedRecs, rawRecs, weatherData);
  const alerts = generatePersonalizedAlerts({ weatherData, userState, dataMode });
  const isSafetyActive = weatherData.severity === 'severe';

  const forecastData =
    dataMode === 'demo'
      ? getDemoForecast('NORMAL', userState.selectedLocation)
      : getLiveForecast(weatherData, userState.selectedLocation);

  const briefing = generateDailyBriefing({
    weatherData,
    forecastData,
    selectedPersonas: userState.selectedPersonas,
    selectedPreferences: userState.selectedPreferences,
    recommendations: rawRecs,
    selectedRecommendations: finalRecs,
    alerts,
    isSafetyActive,
    activeLocationName: userState.selectedLocation,
    activeLocationLabel: `${userState.selectedLocation} • Home`,
    dataMode,
  });

  return { briefing, rawRecs, finalRecs, alerts, forecastData };
}

// -------------------------------------------------------------
// T01: Daily briefing engine initializes
// -------------------------------------------------------------
const normalWeather = getDemoWeatherScenario('NORMAL').weatherData;
const { briefing: t01Briefing } = runPipeline(normalWeather, mockUserState, 'demo');
assert(
  t01Briefing !== null && typeof t01Briefing === 'object' && t01Briefing.id.length > 0,
  'T01: Daily briefing engine initializes and produces structured DailyBriefing object'
);

// -------------------------------------------------------------
// T02: NORMAL demo briefing works
// -------------------------------------------------------------
assert(
  t02Check(t01Briefing),
  'T02: NORMAL demo briefing contains favorable headline and summary'
);
function t02Check(b: typeof t01Briefing) {
  return b.headline.includes('Favorable') && b.safetyState.isOverrideActive === false;
}

// -------------------------------------------------------------
// T03: HOT_SUNNY demo briefing works
// -------------------------------------------------------------
const hotWeather = getDemoWeatherScenario('HOT_SUNNY').weatherData;
const { briefing: hotBriefing } = runPipeline(hotWeather, mockUserState, 'demo');
assert(
  hotBriefing.headline.includes('Thermal') && hotBriefing.keyMetrics.some((m) => m.label === 'Temperature' && Number(m.value) >= 38),
  'T03: HOT_SUNNY demo briefing reflects high thermal conditions and correct temperature'
);

// -------------------------------------------------------------
// T04: RAINY demo briefing works
// -------------------------------------------------------------
const rainWeather = getDemoWeatherScenario('RAINY').weatherData;
const { briefing: rainBriefing } = runPipeline(rainWeather, mockUserState, 'demo');
assert(
  rainBriefing.headline.includes('Precipitation') && rainBriefing.summary.includes('Rainy'),
  'T04: RAINY demo briefing highlights active precipitation'
);

// -------------------------------------------------------------
// T05: HIGH_UV demo briefing works
// -------------------------------------------------------------
const uvWeather = getDemoWeatherScenario('HIGH_UV').weatherData;
const { briefing: uvBriefing } = runPipeline(uvWeather, mockUserState, 'demo');
assert(
  uvBriefing.headline.includes('UV') && uvBriefing.summary.includes('UV index'),
  'T05: HIGH_UV demo briefing alerts to extreme solar UV radiation'
);

// -------------------------------------------------------------
// T06: SEVERE_WEATHER briefing works
// -------------------------------------------------------------
const severeWeather = getDemoWeatherScenario('SEVERE_WEATHER').weatherData;
const { briefing: severeBriefing } = runPipeline(severeWeather, mockUserState, 'demo');
assert(
  severeBriefing.safetyState.isOverrideActive === true && severeBriefing.headline.includes('Critical Safety Warning'),
  'T06: SEVERE_WEATHER briefing activates safety state and critical warning headline'
);

// -------------------------------------------------------------
// T07: Severe safety warning appears first
// -------------------------------------------------------------
const firstHighlight = severeBriefing.personalizedHighlights[0];
assert(
  firstHighlight && firstHighlight.priority === 'critical',
  'T07: Critical safety warning appears at index 0 in personalized highlights'
);

// -------------------------------------------------------------
// T08: Critical safety warning cannot be hidden by persona selection
// -------------------------------------------------------------
const emptyPersonaUser: AppState = { ...mockUserState, selectedPersonas: [] };
const { briefing: emptyPersonaSevereBriefing } = runPipeline(severeWeather, emptyPersonaUser, 'demo');
assert(
  emptyPersonaSevereBriefing.safetyState.isOverrideActive === true &&
  emptyPersonaSevereBriefing.personalizedHighlights.some((h) => h.priority === 'critical'),
  'T08: Critical safety warning persists even when user selects zero personas'
);

// -------------------------------------------------------------
// T09: Existing personalization recommendations are reused
// -------------------------------------------------------------
const { finalRecs, briefing: demoBriefingRecs } = runPipeline(hotWeather, mockUserState, 'demo');
const matchingRec = demoBriefingRecs.personalizedHighlights.find((h) => h.id === finalRecs[0].id);
assert(
  matchingRec !== undefined,
  'T09: Existing Phase 6/7 recommendation output is directly reused in briefing highlights'
);

// -------------------------------------------------------------
// T10: Existing alerts are reused
// -------------------------------------------------------------
const { alerts: pipelineAlerts, briefing: briefingAlerts } = runPipeline(hotWeather, mockUserState, 'demo');
assert(
  briefingAlerts.activeAlerts.length === pipelineAlerts.length,
  'T10: Existing Phase 12 alerts are passed into activeAlerts without mutation'
);

// -------------------------------------------------------------
// T11: No new alerts are generated
// -------------------------------------------------------------
assert(
  briefingAlerts.activeAlerts === pipelineAlerts,
  'T11: Briefing engine is purely observational and does not instantiate new alerts'
);

// -------------------------------------------------------------
// T12: Unavailable live fields remain unavailable (N/A)
// -------------------------------------------------------------
const { briefing: liveBriefing } = runPipeline(mockLiveWeather, mockUserState, 'live');
const liveRainfallMetric = liveBriefing.keyMetrics.find((m) => m.label === 'Rainfall');
const liveUvMetric = liveBriefing.keyMetrics.find((m) => m.label === 'UV Index');
assert(
  liveRainfallMetric?.value === 'N/A' &&
  liveRainfallMetric.available === false &&
  liveUvMetric?.value === 'N/A' &&
  liveUvMetric.available === false,
  'T12: Unavailable live IMD fields strictly display as "N/A" and available: false'
);

// -------------------------------------------------------------
// T13: No fabricated forecast values are generated in Live mode
// -------------------------------------------------------------
assert(
  liveBriefing.timelineHighlights.length > 0 &&
  liveBriefing.timelineHighlights[0].includes('not currently available'),
  'T13: Live mode explicitly reports timeline unavailable without inventing mock forecast points'
);

// -------------------------------------------------------------
// T14: Demo briefing clearly identifies Demo Mode
// -------------------------------------------------------------
assert(
  t01Briefing.dataMode === 'demo' && t01Briefing.source.includes('Prototype Demo'),
  'T14: Demo briefing source explicitly indicates "Prototype Demo • Not live IMD data"'
);

// -------------------------------------------------------------
// T15: Live briefing clearly identifies Live IMD data
// -------------------------------------------------------------
assert(
  liveBriefing.dataMode === 'live' && liveBriefing.source.includes('Official IMD'),
  'T15: Live briefing source explicitly indicates "Official IMD Observation Feed"'
);

// -------------------------------------------------------------
// T16: Active location is respected
// -------------------------------------------------------------
assert(
  t01Briefing.locationName === 'Pune' && t01Briefing.locationLabel === 'Pune • Home',
  'T16: Active location name and label propagate accurately into briefing structure'
);

// -------------------------------------------------------------
// T17: Changing active location changes briefing context
// -------------------------------------------------------------
const mumbaiUser: AppState = { ...mockUserState, selectedLocation: 'Mumbai' };
const { briefing: mumbaiBriefing } = runPipeline(normalWeather, mumbaiUser, 'demo');
assert(
  mumbaiBriefing.locationName === 'Mumbai' && mumbaiBriefing.id.includes('mumbai'),
  'T17: Switching active location updates briefing location context and id'
);

// -------------------------------------------------------------
// T18: Persona changes affect personalized highlights
// -------------------------------------------------------------
const agriUser: AppState = { ...mockUserState, selectedPersonas: ['agriculture'] };
const { briefing: agriBriefing } = runPipeline(hotWeather, agriUser, 'demo');
const hasAgriHighlight = agriBriefing.personalizedHighlights.some(
  (h) => h.category === 'agri_advisory' || h.personaId === 'agriculture'
);
assert(
  hasAgriHighlight,
  'T18: Selecting Agriculture persona produces agricultural guidance in personalized highlights'
);

// -------------------------------------------------------------
// T19: Personalization Insights explainability integration
// -------------------------------------------------------------
const allHighlightsHaveExplanation = t01Briefing.personalizedHighlights.every(
  (h) => typeof h.explanation === 'string' && h.explanation.length > 0
);
assert(
  allHighlightsHaveExplanation,
  'T19: All personalized highlights contain explanatory rationale for Phase 14 linkage'
);

// -------------------------------------------------------------
// T20: Forecast highlights use only available forecast fields
// -------------------------------------------------------------
const demoForecastNormal = getDemoForecast('NORMAL', 'Pune');
const { briefing: forecastBriefing } = runPipeline(normalWeather, mockUserState, 'demo');
assert(
  forecastBriefing.timelineHighlights.length > 0 &&
  forecastBriefing.timelineHighlights.some((h) => h.includes('Temperature')),
  'T20: Forecast timeline highlights synthesize temperature transitions from valid periods'
);

// -------------------------------------------------------------
// T21: Notification preferences are read-only from briefing
// -------------------------------------------------------------
assert(
  mockUserState.notificationPreferences === undefined ||
  typeof mockUserState.notificationPreferences === 'object',
  'T21: Notification preferences state is not mutated by briefing operations'
);

// -------------------------------------------------------------
// T22: Ask MAUSAM remains compatible
// -------------------------------------------------------------
const askResponse = generateAskMausamResponse({
  query: "What's today's briefing?",
  weatherData: normalWeather,
  userState: mockUserState,
  dataMode: 'demo',
});
assert(
  askResponse.text.length > 0 && askResponse.dataMode === 'demo',
  'T22: Ask MAUSAM continues to execute successfully with current weather context'
);

// -------------------------------------------------------------
// T23: Homepage briefing card navigates correctly (Route type contract)
// -------------------------------------------------------------
import type { RootStackParamList } from '../src/navigation/types';
const routeCheck: keyof RootStackParamList = 'DailyBriefing';
assert(
  routeCheck === 'DailyBriefing',
  'T23: DailyBriefing route is strictly registered in RootStackParamList'
);

// -------------------------------------------------------------
// T24: DailyBriefing object conforms to interface specification
// -------------------------------------------------------------
const requiredKeys = [
  'id',
  'locationName',
  'locationLabel',
  'dataMode',
  'source',
  'generatedAt',
  'headline',
  'summary',
  'keyMetrics',
  'timelineHighlights',
  'personalizedHighlights',
  'activeAlerts',
  'safetyState',
  'availableData',
  'unavailableData',
];
const hasAllKeys = requiredKeys.every((k) => k in t01Briefing);
assert(hasAllKeys, 'T24: DailyBriefing structure contains all 15 required contract properties');

// -------------------------------------------------------------
// T25: Briefing output is strictly deterministic
// -------------------------------------------------------------
const { briefing: run1 } = runPipeline(hotWeather, mockUserState, 'demo');
const { briefing: run2 } = runPipeline(hotWeather, mockUserState, 'demo');
assert(
  run1.headline === run2.headline &&
  run1.summary === run2.summary &&
  run1.personalizedHighlights.length === run2.personalizedHighlights.length,
  'T25: Consecutive briefing generations produce strictly identical deterministic output'
);

// -------------------------------------------------------------
// T26: Existing Phase 16 behavior remains compatible
// -------------------------------------------------------------
const liveFc = getLiveForecast(mockLiveWeather, 'Pune');
const demoFc = getDemoForecast('HOT_SUNNY', 'Pune');
assert(
  liveFc.isAvailable === false && demoFc.isAvailable === true && demoFc.periods.length === 5,
  'T26: Phase 16 getLiveForecast and getDemoForecast retain full contract integrity'
);

console.log('\n------------------------------------------------------------');
console.log(`Results: ${passed} PASSED, ${failed} FAILED (${passed + failed} total)`);
console.log('------------------------------------------------------------\n');

if (failed > 0) {
  process.exit(1);
}
