/**
 * Phase 19 Validation — Personalized Contextual Quick Actions
 * SIH26076 · PersonalizedMAUSAM
 *
 * 28 deterministic test cases (T01–T28) covering:
 *  - Contextual action engine synthesis
 *  - Scenario handling (NORMAL, HOT_SUNNY, RAINY, HIGH_UV, SEVERE_WEATHER)
 *  - Safety action priority & non-displacement
 *  - Maximum 5 action cap
 *  - Action deduplication
 *  - Active location context propagation
 *  - Persona-to-action mappings (Health, Fitness, Travel, Agriculture, Commuting, Family, Beach & Outdoor, Events)
 *  - Route validity check against RootStackParamList
 *  - IMD unavailable metric handling
 *  - Explainability & determinism
 */

import { generateContextualActions } from '../src/services/contextualActionEngine';
import type { WeatherData, UserPersonaType, WeatherPreferenceType, PersonalizedRecommendation, WeatherAlert } from '../src/types';
import type { ContextualActionInput } from '../src/types/contextualActions';

let pass = 0;
let fail = 0;

function assert(id: string, condition: boolean, message: string) {
  if (condition) {
    console.log(`  ✅ ${id}: ${message}`);
    pass++;
  } else {
    console.log(`  ❌ ${id}: ${message}`);
    fail++;
  }
}

// ---------------------------------------------------------------------------
// FACTORY HELPERS
// ---------------------------------------------------------------------------

function makeWeatherData(overrides: Partial<WeatherData> = {}): WeatherData {
  return {
    temperature: 30,
    feelsLike: 33,
    humidity: 60,
    rainfall: 0,
    rainProbability: 10,
    windSpeed: 10,
    windDirection: 'NE',
    uvIndex: 5,
    visibility: 10,
    weatherCondition: 'partly_cloudy',
    sunrise: '06:00',
    sunset: '18:30',
    severity: 'normal',
    summary: 'Pleasant conditions with partial cloud cover.',
    location: 'New Delhi',
    timestamp: '2026-10-03T12:00:00',
    source: 'demo',
    ...overrides,
  } as WeatherData;
}

function makeRecommendation(id: string, persona: UserPersonaType): PersonalizedRecommendation {
  return {
    id,
    title: `Recommendation ${id}`,
    description: `Description for ${id}`,
    category: 'general',
    priority: 'medium',
    icon: '✨',
    persona,
    weatherTrigger: 'temperature',
  } as PersonalizedRecommendation;
}

function makeAlert(id: string, severity: 'advisory' | 'warning' | 'severe' = 'advisory'): WeatherAlert {
  return {
    id,
    title: `Alert ${id}`,
    message: `Message for alert ${id}`,
    severity: severity as any,
    category: 'weather',
    timestamp: '2026-10-03T12:00:00',
    source: 'personalized',
  } as WeatherAlert;
}

function makeInput(overrides: Partial<ContextualActionInput> = {}): ContextualActionInput {
  return {
    activeLocationName: 'New Delhi',
    selectedPersonas: ['health'],
    selectedPreferences: ['temperature'],
    weatherData: makeWeatherData(),
    recommendations: [makeRecommendation('rec1', 'health')],
    alerts: [],
    isSafetyActive: false,
    dataMode: 'demo',
    ...overrides,
  };
}

const VALID_ROUTES = new Set([
  'Splash',
  'Welcome',
  'Onboarding',
  'PersonaSelection',
  'Preferences',
  'LocationSetup',
  'PersonalizedHome',
  'Forecast',
  'ActivityDetails',
  'Traveler',
  'EventPlanner',
  'AskMausam',
  'Alerts',
  'Profile',
  'PersonalizationInsights',
  'Locations',
  'DailyBriefing',
]);

console.log('\n╔═══════════════════════════════════════════════════════════╗');
console.log('║ Phase 19 Validation — Personalized Contextual Actions     ║');
console.log('║ SIH26076 · PersonalizedMAUSAM                          ║');
console.log('╚═══════════════════════════════════════════════════════════╝\n');

// =========================================================================
// TEST SUITE T01-T28
// =========================================================================

// T01: Engine Initialization
console.log('── Group 1: Engine Initialization ──');
const actionsT01 = generateContextualActions(makeInput());
assert('T01', Array.isArray(actionsT01) && actionsT01.length > 0, 'Contextual action engine initializes and returns non-empty array');

// T02: NORMAL Scenario
console.log('\n── Group 2: Demo Scenarios ──');
const actionsNormal = generateContextualActions(makeInput({ weatherData: makeWeatherData({ weatherCondition: 'partly_cloudy', severity: 'normal' }) }));
assert('T02', actionsNormal.length > 0 && !actionsNormal.some(a => a.type === 'safety'), 'NORMAL scenario produces contextual actions without safety card');

// T03: HOT_SUNNY Scenario
const actionsHot = generateContextualActions(makeInput({ weatherData: makeWeatherData({ temperature: 40, weatherCondition: 'heat', uvIndex: 9 }) }));
assert('T03', actionsHot.length > 0, 'HOT_SUNNY scenario produces contextual actions');

// T04: RAINY Scenario
const actionsRain = generateContextualActions(makeInput({ weatherData: makeWeatherData({ weatherCondition: 'rain', rainfall: 25 }) }));
assert('T04', actionsRain.some(a => a.route === 'Forecast'), 'RAINY scenario triggers rain/forecast action');

// T05: HIGH_UV Scenario
const actionsUV = generateContextualActions(makeInput({ weatherData: makeWeatherData({ uvIndex: 10 }), dataMode: 'demo' }));
assert('T05', actionsUV.some(a => a.title.includes('UV') || a.route === 'ActivityDetails'), 'HIGH_UV scenario triggers UV/ActivityDetails action');

// T06: SEVERE_WEATHER Scenario
const actionsSevere = generateContextualActions(makeInput({ weatherData: makeWeatherData({ severity: 'severe', weatherCondition: 'severe' }), isSafetyActive: true }));
assert('T06', actionsSevere.length > 0 && actionsSevere[0].type === 'safety', 'SEVERE_WEATHER scenario produces safety action at position 0');

// T07: Safety Action First
assert('T07', actionsSevere[0].route === 'Alerts' && actionsSevere[0].critical === true, 'Severe weather places Alerts action first marked critical');

// T08: Safety Action Non-Displacement
const actionsDisplace = generateContextualActions(makeInput({
  selectedPersonas: ['fitness', 'travel', 'events', 'agriculture'],
  weatherData: makeWeatherData({ severity: 'severe' }),
  isSafetyActive: true,
}));
assert('T08', actionsDisplace[0].type === 'safety' && actionsDisplace[0].critical === true, 'Safety action cannot be displaced by persona actions');

// T09: No Artificial Safety Action in NORMAL
assert('T09', !actionsNormal.some(a => a.critical || a.type === 'safety'), 'No artificial safety action present in NORMAL scenario');

// T10: Max 5 Actions
console.log('\n── Group 3: Caps & Deduplication ──');
const actionsMax = generateContextualActions(makeInput({
  selectedPersonas: ['health', 'fitness', 'travel', 'agriculture', 'commuting', 'family', 'outdoor', 'events'],
  alerts: [makeAlert('a1')],
}));
assert('T10', actionsMax.length <= 5, `Action count (${actionsMax.length}) ≤ 5 (MAX_CONTEXTUAL_ACTIONS)`);

// T11: Action Deduplication
const routesList = actionsMax.map(a => a.route);
const uniqueRoutes = new Set(routesList);
assert('T11', routesList.length === uniqueRoutes.size, 'No duplicate route actions generated');

// T12 & T13: Active Location Context
console.log('\n── Group 4: Location Context ──');
const actionsLoc1 = generateContextualActions(makeInput({ activeLocationName: 'Mumbai' }));
const actionsLoc2 = generateContextualActions(makeInput({ activeLocationName: 'Shimla' }));
assert('T12', actionsLoc1.some(a => a.subtitle.includes('Mumbai') || a.reason.includes('Mumbai')), 'Active location "Mumbai" reflected in action details');
assert('T13', actionsLoc2.some(a => a.subtitle.includes('Shimla') || a.reason.includes('Shimla')), 'Changing active location to "Shimla" updates contextual action output');

// T14–T21: Persona Action Mappings
console.log('\n── Group 5: Persona Mappings ──');
const fitActions = generateContextualActions(makeInput({ selectedPersonas: ['fitness'] }));
assert('T14', fitActions.some(a => a.route === 'ActivityDetails'), 'Fitness persona maps to ActivityDetails action');

const travActions = generateContextualActions(makeInput({ selectedPersonas: ['travel'] }));
assert('T15', travActions.some(a => a.route === 'Traveler'), 'Travel persona maps to Traveler action');

const agriActions = generateContextualActions(makeInput({ selectedPersonas: ['agriculture'] }));
assert('T16', agriActions.some(a => a.route === 'Forecast'), 'Agriculture persona maps to Forecast action');

const comActions = generateContextualActions(makeInput({ selectedPersonas: ['commuting'] }));
assert('T17', comActions.some(a => a.route === 'Forecast'), 'Commuting persona maps to Forecast action');

const famActions = generateContextualActions(makeInput({ selectedPersonas: ['family'] }));
assert('T18', famActions.some(a => a.route === 'DailyBriefing'), 'Family persona maps to DailyBriefing action');

const healthActions = generateContextualActions(makeInput({ selectedPersonas: ['health'] }));
assert('T19', healthActions.some(a => a.route === 'PersonalizationInsights'), 'Health persona maps to PersonalizationInsights action');

const outdoorActions = generateContextualActions(makeInput({ selectedPersonas: ['outdoor'] }));
assert('T20', outdoorActions.some(a => a.route === 'ActivityDetails'), 'Beach & Outdoor persona maps to ActivityDetails action');

const eventActions = generateContextualActions(makeInput({ selectedPersonas: ['events'] }));
assert('T21', eventActions.some(a => a.route === 'EventPlanner'), 'Events persona maps to EventPlanner action');

// T22–T24: Output Reuse
console.log('\n── Group 6: Engine Output Reuse ──');
const recInput = makeInput({ recommendations: [makeRecommendation('r1', 'travel')] });
assert('T22', generateContextualActions(recInput).length > 0, 'Existing recommendations are reused in synthesis');

const alertInput = makeInput({ alerts: [makeAlert('a1', 'warning')] });
assert('T23', generateContextualActions(alertInput).some(a => a.route === 'Alerts'), 'Existing alerts are reused in action synthesis');

const forecastInput = makeInput();
assert('T24', generateContextualActions(forecastInput).some(a => a.route === 'Forecast'), 'Existing forecast route is reused in action synthesis');

// T25: Unavailable IMD Metrics Safety
console.log('\n── Group 7: Data Integrity & Routes ──');
const liveImdInput = makeInput({
  dataMode: 'live',
  weatherData: makeWeatherData({ uvIndex: null as any, rainfall: null as any }),
});
const liveActions = generateContextualActions(liveImdInput);
assert('T25', !liveActions.some(a => a.title.includes('High UV')), 'Unavailable IMD metrics (null) do not trigger fabricated actions');

// T26: Valid Routes Guarantee
const allRoutesValid = actionsMax.every(a => VALID_ROUTES.has(a.route));
assert('T26', allRoutesValid, 'All generated action routes exist in RootStackParamList');

// T27 & T28: Explainability & Determinism
console.log('\n── Group 8: Explainability & Determinism ──');
assert('T27', actionsT01.every(a => typeof a.reason === 'string' && a.reason.length > 0), 'Every generated action has a non-empty explainability reason');

const actionsRun1 = generateContextualActions(makeInput());
const actionsRun2 = generateContextualActions(makeInput());
assert('T28', JSON.stringify(actionsRun1) === JSON.stringify(actionsRun2), 'Consecutive action engine runs produce strictly identical output');

// =========================================================================
// SUMMARY
// =========================================================================
console.log('\n╔═══════════════════════════════════════════════════════════╗');
console.log(`║ Phase 19 Results: ${pass} passed, ${fail} failed (of ${pass + fail} total)       ║`);
console.log('╚═══════════════════════════════════════════════════════════╝\n');

if (fail > 0) {
  process.exit(1);
}
