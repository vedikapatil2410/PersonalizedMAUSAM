/**
 * Phase 14 — Personalization Insights & Explainability Dashboard
 * Validation Script — 20 Deterministic Test Cases
 *
 * Run via: npx tsx scratch/validate_phase14.ts
 */

import { getDemoWeatherScenario } from '../src/constants/demoWeather';
import { DEFAULT_NOTIFICATION_PREFERENCES } from '../src/constants/notificationPreferences';
import { generatePersonalizedRecommendations } from '../src/services/personalizationEngine';
import { decideRecommendations } from '../src/services/decisionEngine';
import { applySafetyOverride } from '../src/services/safetyOverrideEngine';
import { generatePersonalizedAlerts } from '../src/services/alertEngine';
import { getNotificationDeliveryDecisions } from '../src/services/notificationEngine';
import { generatePersonalizationInsights } from '../src/services/personalizationInsightEngine';
import type { AppState, WeatherData, UserPersonaType, WeatherPreferenceType } from '../src/types';

// ─── ANSI Colours ────────────────────────────────────────────────────────────
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';

// ─── Test Runner ─────────────────────────────────────────────────────────────
let passed = 0;
let failed = 0;

function test(description: string, fn: () => void): void {
  try {
    fn();
    console.log(`${GREEN}✔${RESET}  ${description}`);
    passed++;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.log(`${RED}✘${RESET}  ${description}`);
    console.log(`   ${RED}→ ${msg}${RESET}`);
    failed++;
  }
}

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

// ─── Shared Test Fixtures ─────────────────────────────────────────────────────

const BASE_USER_STATE: AppState = {
  selectedPersonas: ['health', 'fitness', 'commuting'],
  selectedPreferences: ['temperature', 'rainfall', 'severe_alerts'],
  selectedLocation: 'Pune',
  onboardingCompleted: true,
  notificationPreferences: DEFAULT_NOTIFICATION_PREFERENCES,
};

const ALL_PERSONAS_USER_STATE: AppState = {
  ...BASE_USER_STATE,
  selectedPersonas: ['health', 'fitness', 'travel', 'agriculture', 'commuting', 'family', 'outdoor', 'events'],
  selectedPreferences: ['temperature', 'rainfall', 'wind', 'humidity', 'uv_index', 'visibility', 'severe_alerts'],
};

const NORMAL_WEATHER = getDemoWeatherScenario('NORMAL').weatherData;
const HOT_SUNNY_WEATHER = getDemoWeatherScenario('HOT_SUNNY').weatherData;
const RAINY_WEATHER = getDemoWeatherScenario('RAINY').weatherData;
const HIGH_UV_WEATHER = getDemoWeatherScenario('HIGH_UV').weatherData;
const SEVERE_WEATHER = getDemoWeatherScenario('SEVERE_WEATHER').weatherData;

function runPipeline(weatherData: WeatherData, userState: AppState, dataMode: 'live' | 'demo' = 'demo') {
  const rawRecommendations = generatePersonalizedRecommendations({ userState, weatherData });
  const selectedRecs = decideRecommendations(rawRecommendations);
  const finalRecommendations = applySafetyOverride(selectedRecs, rawRecommendations, weatherData);
  const alerts = generatePersonalizedAlerts({ weatherData, userState, dataMode });
  const notificationDecisions = getNotificationDeliveryDecisions(alerts, userState.notificationPreferences || DEFAULT_NOTIFICATION_PREFERENCES);
  const report = generatePersonalizationInsights({
    weatherData,
    dataMode,
    selectedPersonas: userState.selectedPersonas,
    selectedPreferences: userState.selectedPreferences,
    selectedLocation: userState.selectedLocation,
    rawRecommendations,
    finalRecommendations,
    alerts,
    notificationDecisions,
  });

  return {
    rawRecommendations,
    finalRecommendations,
    alerts,
    notificationDecisions,
    report,
  };
}

// ─── Tests ───────────────────────────────────────────────────────────────────

console.log(`\n${BOLD}Phase 14 — Personalization Insights & Explainability Dashboard Validation${RESET}`);
console.log('═'.repeat(70));

// T01: Normal scenario generates valid insight summary
test('T01: Normal scenario generates valid insight summary without fabricated alerts/recs', () => {
  const { report, finalRecommendations, alerts } = runPipeline(NORMAL_WEATHER, BASE_USER_STATE);
  assert(report.summary.location === 'Pune', 'Summary location mismatch');
  assert(report.summary.temperature === NORMAL_WEATHER.temperature, 'Summary temperature mismatch');
  assert(report.summary.totalRecommendations === finalRecommendations.length, 'Recommendation count mismatch in summary');
  assert(report.summary.totalAlerts === alerts.length, 'Alert count mismatch in summary');
  assert(report.summary.safetyOverrideActive === false, 'Safety override should not be active in normal scenario');
  assert(report.insights.length >= 1, 'Expected insights array to be populated');
});

// T02: Hot scenario explains actual existing heat recommendations
test('T02: Hot scenario explains actual existing heat recommendations', () => {
  const { report, finalRecommendations } = runPipeline(HOT_SUNNY_WEATHER, BASE_USER_STATE);
  const heatTrigger = report.insights.find((i) => i.id === 'insight_trigger_temperature');
  assert(heatTrigger !== undefined, 'Expected temperature trigger insight');
  assert(heatTrigger!.triggeredBy?.includes('39°C'), 'Trigger should mention 39°C');

  const recInsights = report.insights.filter((i) => i.type === 'recommendation');
  assert(recInsights.length === finalRecommendations.length, 'Rec insights count must match finalRecommendations');
  for (const rec of finalRecommendations) {
    const found = recInsights.find((r) => r.title === rec.title);
    assert(found !== undefined, `Missing insight for recommendation "${rec.title}"`);
    assert(found!.explanation === rec.explanation, `Explanation mismatch for "${rec.title}"`);
  }
});

// T03: Rain scenario explains actual existing rain recommendations
test('T03: Rain scenario explains actual existing rain recommendations', () => {
  const { report, finalRecommendations } = runPipeline(RAINY_WEATHER, ALL_PERSONAS_USER_STATE);
  const rainTrigger = report.insights.find((i) => i.id === 'insight_trigger_rain');
  assert(rainTrigger !== undefined, 'Expected rain trigger insight');
  assert(rainTrigger!.description.toLowerCase().includes('rain') || rainTrigger!.description.toLowerCase().includes('precipitation'), 'Rain trigger description mismatch');

  const recInsights = report.insights.filter((i) => i.type === 'recommendation');
  assert(recInsights.length === finalRecommendations.length, 'Rec insights must match final recommendations count');
});

// T04: High UV scenario explains actual existing UV recommendations
test('T04: High UV scenario explains actual existing UV recommendations', () => {
  const { report, finalRecommendations } = runPipeline(HIGH_UV_WEATHER, ALL_PERSONAS_USER_STATE);
  const uvTrigger = report.insights.find((i) => i.id === 'insight_trigger_uv');
  assert(uvTrigger !== undefined, 'Expected UV trigger insight');
  assert(uvTrigger!.triggeredBy?.includes('11'), 'Trigger should mention UV index 11');

  const uvRecs = finalRecommendations.filter((r) => r.weatherTrigger.toLowerCase().includes('uv'));
  assert(uvRecs.length >= 1, 'Expected UV-related recommendations in HIGH_UV');
});

// T05: Severe scenario contains safety override insight
test('T05: Severe scenario contains prominent safety override insight', () => {
  const { report } = runPipeline(SEVERE_WEATHER, BASE_USER_STATE);
  assert(report.summary.safetyOverrideActive === true, 'Summary safetyOverrideActive must be true');
  const safetyInsight = report.insights.find((i) => i.type === 'safety_override');
  assert(safetyInsight !== undefined, 'Safety override insight must exist');
  assert(safetyInsight!.isCritical === true, 'Safety override must be marked isCritical');
  assert(safetyInsight!.displayOrder === 0, 'Safety override must have top display order');
});

// T06: Safety insight identifies Official IMD when applicable
test('T06: Safety insight identifies Official IMD source', () => {
  const { report } = runPipeline(SEVERE_WEATHER, BASE_USER_STATE);
  const safetyInsight = report.insights.find((i) => i.type === 'safety_override');
  assert(safetyInsight!.source === 'Official IMD', `Expected source 'Official IMD', got ${safetyInsight?.source}`);
});

// T07: Active personas are accurately represented
test('T07: Active personas are accurately represented in summary and insights', () => {
  const { report } = runPipeline(HOT_SUNNY_WEATHER, BASE_USER_STATE);
  assert(report.summary.activePersonas.length === 3, 'Expected 3 active personas');
  assert(report.summary.activePersonas.includes('health'), 'Expected health in activePersonas');
  assert(report.summary.activePersonas.includes('fitness'), 'Expected fitness in activePersonas');
  assert(report.summary.activePersonas.includes('commuting'), 'Expected commuting in activePersonas');

  const personaInsights = report.insights.filter((i) => i.type === 'persona_match');
  assert(personaInsights.length === 3, `Expected 3 persona insights, got ${personaInsights.length}`);
});

// T08: Inactive personas are not falsely claimed as influencing recommendations
test('T08: Inactive personas are not falsely claimed as influencing recommendations', () => {
  const singlePersonaState: AppState = {
    ...BASE_USER_STATE,
    selectedPersonas: ['agriculture'],
  };
  const { report } = runPipeline(HOT_SUNNY_WEATHER, singlePersonaState);
  const personaInsights = report.insights.filter((i) => i.type === 'persona_match');
  assert(personaInsights.length === 1, `Expected 1 persona insight, got ${personaInsights.length}`);
  assert(personaInsights[0].relatedPersona === 'agriculture', 'Only agriculture should be in persona insights');
  const otherPersonas: UserPersonaType[] = ['health', 'fitness', 'travel', 'commuting', 'family', 'outdoor', 'events'];
  for (const p of otherPersonas) {
    assert(!personaInsights.some((pi) => pi.relatedPersona === p), `Inactive persona ${p} found in insights`);
  }
});

// T09: Active preferences are accurately represented
test('T09: Active preferences are accurately represented in summary and insights', () => {
  const { report } = runPipeline(HOT_SUNNY_WEATHER, BASE_USER_STATE);
  assert(report.summary.activePreferences.length === 3, 'Expected 3 active preferences');
  const prefInsights = report.insights.filter((i) => i.type === 'preference_match');
  assert(prefInsights.length === 3, `Expected 3 preference insights, got ${prefInsights.length}`);
});

// T10: Recommendation insights correspond to actual recommendations
test('T10: Recommendation insights correspond 1-to-1 to final recommendations', () => {
  const { report, finalRecommendations } = runPipeline(HOT_SUNNY_WEATHER, ALL_PERSONAS_USER_STATE);
  const recInsights = report.insights.filter((i) => i.type === 'recommendation');
  assert(recInsights.length === finalRecommendations.length, 'Insight count must match final recommendation count');
  for (let i = 0; i < finalRecommendations.length; i++) {
    assert(recInsights[i].title === finalRecommendations[i].title, `Title mismatch at ${i}`);
    assert(recInsights[i].priority === finalRecommendations[i].priority, `Priority mismatch at ${i}`);
  }
});

// T11: No new recommendation is generated by insight engine
test('T11: No new recommendation is generated by insight engine', () => {
  const { rawRecommendations, finalRecommendations, report } = runPipeline(HOT_SUNNY_WEATHER, BASE_USER_STATE);
  const recInsights = report.insights.filter((i) => i.type === 'recommendation');
  assert(recInsights.length === finalRecommendations.length, 'Insight engine must not generate extra recommendations');
  // Verify all insight titles exist in finalRecommendations
  const finalTitles = new Set(finalRecommendations.map((r) => r.title));
  for (const r of recInsights) {
    assert(finalTitles.has(r.title), `Insight generated phantom recommendation: ${r.title}`);
  }
});

// T12: No new alert is generated by insight engine
test('T12: No new alert is generated by insight engine', () => {
  const { alerts, report } = runPipeline(SEVERE_WEATHER, BASE_USER_STATE);
  const alertInsights = report.insights.filter((i) => i.type === 'alert');
  assert(alertInsights.length === alerts.length, `Alert insights count (${alertInsights.length}) ≠ alerts count (${alerts.length})`);
});

// T13: Alert data remains unchanged
test('T13: Alert data is not mutated or altered', () => {
  const { alerts, report } = runPipeline(SEVERE_WEATHER, BASE_USER_STATE);
  const alertInsights = report.insights.filter((i) => i.type === 'alert');
  for (let i = 0; i < alerts.length; i++) {
    assert(alertInsights[i].description === alerts[i].message, `Alert message mismatch at ${i}`);
    assert(alertInsights[i].source === alerts[i].source, `Alert source mismatch at ${i}`);
  }
});

// T14: Notification decisions remain unchanged
test('T14: Notification decisions match Phase 13 delivery decisions', () => {
  const { notificationDecisions, report } = runPipeline(HOT_SUNNY_WEATHER, BASE_USER_STATE);
  const notifInsights = report.insights.filter((i) => i.type === 'notification');
  assert(notifInsights.length === notificationDecisions.length, 'Notification insights count must match decisions count');
  for (let i = 0; i < notificationDecisions.length; i++) {
    assert(notifInsights[i].description === notificationDecisions[i].reason, `Reason mismatch at ${i}`);
  }
});

// T15: Critical notification explanation remains correct
test('T15: Critical notification explanation explains safety override delivery', () => {
  const { report } = runPipeline(SEVERE_WEATHER, BASE_USER_STATE);
  const criticalNotifInsight = report.insights.find((i) => i.type === 'notification' && i.isCritical);
  assert(criticalNotifInsight !== undefined, 'Expected critical notification insight');
  assert(criticalNotifInsight!.explanation.toLowerCase().includes('critical safety'), 'Critical notification explanation must mention critical safety');
});

// T16: Live unavailable fields are never fabricated
test('T16: Live unavailable fields are never claimed as active triggers', () => {
  const liveWeatherData: WeatherData = {
    location: 'Pune',
    timestamp: 'Live IMD • 10:00 AM',
    temperature: 32,
    feelsLike: 34,
    humidity: 60,
    rainfall: 0,        // unavailable
    rainProbability: 0, // unavailable
    windSpeed: 14,
    windDirection: 'NW',
    uvIndex: 0,         // unavailable
    visibility: 0,      // unavailable
    weatherCondition: 'partly_cloudy',
    sunrise: '06:10 AM',
    sunset: '06:45 PM',
    severity: 'normal',
    summary: 'Partly cloudy observation from IMD station.',
  };

  const { report } = runPipeline(liveWeatherData, ALL_PERSONAS_USER_STATE, 'live');
  
  // Verify no UV trigger insight created
  const uvTrigger = report.insights.find((i) => i.id === 'insight_trigger_uv');
  assert(uvTrigger === undefined, 'UV trigger must NOT be created when uvIndex is 0 / unavailable');

  // Verify no rain trigger insight created
  const rainTrigger = report.insights.find((i) => i.id === 'insight_trigger_rain');
  assert(rainTrigger === undefined, 'Rain trigger must NOT be created when rainfall/probability is 0');

  // Verify UV preference notes unavailability
  const uvPref = report.insights.find((i) => i.id === 'insight_pref_uv_index');
  assert(uvPref !== undefined, 'UV preference insight should exist');
  assert(uvPref!.description.includes('unavailable'), 'UV preference must state field is unavailable');
});

// T17: Insight ordering is deterministic
test('T17: Insight ordering is strictly deterministic across repeated calls', () => {
  const res1 = runPipeline(SEVERE_WEATHER, ALL_PERSONAS_USER_STATE);
  const res2 = runPipeline(SEVERE_WEATHER, ALL_PERSONAS_USER_STATE);

  assert(res1.report.insights.length === res2.report.insights.length, 'Length mismatch across runs');
  for (let i = 0; i < res1.report.insights.length; i++) {
    assert(res1.report.insights[i].id === res2.report.insights[i].id, `ID mismatch at ${i}`);
    assert(res1.report.insights[i].displayOrder === res2.report.insights[i].displayOrder, `Order mismatch at ${i}`);
  }
});

// T18: Insight generation does not mutate input objects
test('T18: Insight generation does not mutate input weatherData or userState', () => {
  const weatherSnapshot = JSON.stringify(HOT_SUNNY_WEATHER);
  const userSnapshot = JSON.stringify(BASE_USER_STATE);

  runPipeline(HOT_SUNNY_WEATHER, BASE_USER_STATE);

  assert(JSON.stringify(HOT_SUNNY_WEATHER) === weatherSnapshot, 'HOT_SUNNY_WEATHER was mutated');
  assert(JSON.stringify(BASE_USER_STATE) === userSnapshot, 'BASE_USER_STATE was mutated');
});

// T19: Phase 12 alert count/content remains unchanged
test('T19: Phase 12 alert count and content are identical before and after insight generation', () => {
  const alertsBefore = generatePersonalizedAlerts({ weatherData: SEVERE_WEATHER, userState: ALL_PERSONAS_USER_STATE, dataMode: 'demo' });
  const { alerts, report } = runPipeline(SEVERE_WEATHER, ALL_PERSONAS_USER_STATE);
  const alertsAfter = generatePersonalizedAlerts({ weatherData: SEVERE_WEATHER, userState: ALL_PERSONAS_USER_STATE, dataMode: 'demo' });

  assert(alertsBefore.length === alertsAfter.length, 'Alerts count changed');
  for (let i = 0; i < alertsBefore.length; i++) {
    assert(alertsBefore[i].id === alertsAfter[i].id, `Alert ID changed at ${i}`);
    assert(alertsBefore[i].title === alertsAfter[i].title, `Alert title changed at ${i}`);
  }
});

// T20: Phase 13 notification delivery results remain unchanged
test('T20: Phase 13 notification delivery results are identical before and after insight generation', () => {
  const alerts = generatePersonalizedAlerts({ weatherData: HOT_SUNNY_WEATHER, userState: ALL_PERSONAS_USER_STATE, dataMode: 'demo' });
  const decisionsBefore = getNotificationDeliveryDecisions(alerts, DEFAULT_NOTIFICATION_PREFERENCES);
  const { notificationDecisions } = runPipeline(HOT_SUNNY_WEATHER, ALL_PERSONAS_USER_STATE);
  const decisionsAfter = getNotificationDeliveryDecisions(alerts, DEFAULT_NOTIFICATION_PREFERENCES);

  assert(decisionsBefore.length === decisionsAfter.length, 'Decisions count changed');
  for (let i = 0; i < decisionsBefore.length; i++) {
    assert(decisionsBefore[i].delivered === decisionsAfter[i].delivered, `Delivery decision changed at ${i}`);
    assert(decisionsBefore[i].rule === decisionsAfter[i].rule, `Rule changed at ${i}`);
  }
});

// ─── Summary ─────────────────────────────────────────────────────────────────

console.log('─'.repeat(70));
const total = passed + failed;
if (failed === 0) {
  console.log(`${GREEN}${BOLD}ALL ${total} TESTS PASSED${RESET}`);
} else {
  console.log(`${RED}${BOLD}${failed} of ${total} TESTS FAILED${RESET} (${GREEN}${passed} passed${RESET})`);
}
console.log('─'.repeat(70));

if (failed > 0) process.exit(1);
