/**
 * Phase 18 Validation — Adaptive Personalized Homepage & Card Layout
 * SIH26076 · PersonalizedMAUSAM
 *
 * 30 deterministic test cases (T01–T30) covering:
 *  - Layout engine output structure
 *  - Safety-first guarantee
 *  - Persona-weighted ordering
 *  - Preference boosting
 *  - Semantic deduplication
 *  - 6-card cap enforcement
 *  - Explainability text generation
 *  - Card type coverage
 */

import { generateHomepageLayout, type HomepageLayoutInput } from '../src/services/homepageLayoutEngine';
import type { WeatherData, UserPersonaType, WeatherPreferenceType, PersonalizedRecommendation, WeatherAlert } from '../src/types';

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
// SHARED TEST DATA FACTORIES
// ---------------------------------------------------------------------------

function makeWeatherData(overrides: Partial<WeatherData> = {}): WeatherData {
  return {
    temperature: 32,
    feelsLike: 35,
    humidity: 65,
    rainfall: 0,
    rainProbability: 10,
    windSpeed: 12,
    windDirection: 'NW',
    uvIndex: 6,
    visibility: 8,
    weatherCondition: 'partly_cloudy',
    sunrise: '06:15',
    sunset: '18:32',
    severity: 'normal',
    summary: 'Partly cloudy conditions with moderate humidity.',
    location: 'New Delhi',
    timestamp: '2026-10-03T12:00:00',
    source: 'demo',
    ...overrides,
  } as WeatherData;
}

function makeRecommendation(id: string, priority: string = 'medium'): PersonalizedRecommendation {
  return {
    id,
    title: `Recommendation ${id}`,
    description: `Description for ${id}`,
    category: 'general',
    priority: priority as any,
    icon: '✨',
    persona: 'health',
    weatherTrigger: 'temperature',
  } as PersonalizedRecommendation;
}

function makeAlert(id: string, severity: string = 'medium'): WeatherAlert {
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

function makeInput(overrides: Partial<HomepageLayoutInput> = {}): HomepageLayoutInput {
  return {
    activeLocationName: 'New Delhi',
    activeLocationLabel: 'New Delhi • Home',
    selectedPersonas: ['health'] as UserPersonaType[],
    selectedPreferences: ['temperature'] as WeatherPreferenceType[],
    weatherData: makeWeatherData(),
    recommendations: [makeRecommendation('rec1'), makeRecommendation('rec2')],
    alerts: [],
    dailyBriefing: null,
    forecastData: null,
    isSafetyActive: false,
    dataMode: 'demo',
    ...overrides,
  };
}

console.log('\n╔═══════════════════════════════════════════════════════════╗');
console.log('║ Phase 18 Validation — Adaptive Homepage & Card Layout   ║');
console.log('║ SIH26076 · PersonalizedMAUSAM                          ║');
console.log('╚═══════════════════════════════════════════════════════════╝\n');

// =========================================================================
// GROUP 1: Layout Engine Output Structure
// =========================================================================
console.log('── Group 1: Layout Engine Output Structure ──');

const layout1 = generateHomepageLayout(makeInput());

assert('T01', typeof layout1 === 'object' && layout1 !== null, 'generateHomepageLayout returns an object');
assert('T02', Array.isArray(layout1.cards), 'layout.cards is an array');
assert('T03', typeof layout1.explanation === 'string' && layout1.explanation.length > 0, 'layout.explanation is a non-empty string');
assert('T04', layout1.activeLocation === 'New Delhi', 'layout.activeLocation matches input');
assert('T05', layout1.dataMode === 'demo', 'layout.dataMode matches input');
assert('T06', Array.isArray(layout1.activePersonas) && layout1.activePersonas.includes('health'), 'layout.activePersonas contains input persona');

// =========================================================================
// GROUP 2: Card Structure Integrity
// =========================================================================
console.log('\n── Group 2: Card Structure Integrity ──');

const firstCard = layout1.cards[0];
assert('T07', firstCard !== undefined && typeof firstCard.id === 'string', 'First card has an id');
assert('T08', typeof firstCard.type === 'string', 'First card has a type');
assert('T09', typeof firstCard.title === 'string' && firstCard.title.length > 0, 'First card has a non-empty title');
assert('T10', typeof firstCard.priority === 'string', 'First card has a priority field');
assert('T11', typeof firstCard.position === 'number', 'First card has a numeric position');
assert('T12', typeof firstCard.reason === 'string' && firstCard.reason.length > 0, 'First card has a non-empty reason');

// =========================================================================
// GROUP 3: Safety-First Guarantee
// =========================================================================
console.log('\n── Group 3: Safety-First Guarantee ──');

const severeLayout = generateHomepageLayout(makeInput({
  weatherData: makeWeatherData({ severity: 'severe' }),
  isSafetyActive: true,
}));

assert('T13', severeLayout.cards[0]?.type === 'safety', 'Severe weather → safety card is at position 0');
assert('T14', severeLayout.cards[0]?.priority === 'critical', 'Safety card has critical priority');
assert('T15', severeLayout.explanation.toLowerCase().includes('safety') || severeLayout.explanation.toLowerCase().includes('severe'), 'Severe layout explanation mentions safety/severe');

// =========================================================================
// GROUP 4: 6-Card Cap Enforcement
// =========================================================================
console.log('\n── Group 4: 6-Card Cap Enforcement ──');

const manyPersonasLayout = generateHomepageLayout(makeInput({
  selectedPersonas: ['health', 'fitness', 'travel', 'agriculture', 'commuting', 'family', 'outdoor', 'events'],
  recommendations: [makeRecommendation('r1'), makeRecommendation('r2'), makeRecommendation('r3')],
  alerts: [makeAlert('a1'), makeAlert('a2')],
}));

assert('T16', manyPersonasLayout.cards.length <= 6, `Card count (${manyPersonasLayout.cards.length}) ≤ 6 (MAX_PRIMARY_CARDS)`);

// =========================================================================
// GROUP 5: Semantic Deduplication
// =========================================================================
console.log('\n── Group 5: Semantic Deduplication ──');

const types = layout1.cards.map((c) => c.type);
const uniqueTypes = new Set(types);
assert('T17', types.length === uniqueTypes.size, 'No duplicate card types in layout');

// =========================================================================
// GROUP 6: Persona-Weighted Ordering
// =========================================================================
console.log('\n── Group 6: Persona-Weighted Ordering ──');

const fitnessLayout = generateHomepageLayout(makeInput({
  selectedPersonas: ['fitness'],
  recommendations: [makeRecommendation('r1')],
}));
const fitnessTypes = fitnessLayout.cards.map((c) => c.type);
assert('T18', fitnessTypes.includes('weather_summary'), 'Fitness layout includes weather_summary');
assert('T19', fitnessTypes.includes('daily_briefing'), 'Fitness layout includes daily_briefing');

const travelLayout = generateHomepageLayout(makeInput({
  selectedPersonas: ['travel'],
  recommendations: [makeRecommendation('r1')],
}));
const travelTypes = travelLayout.cards.map((c) => c.type);
assert('T20', travelTypes.includes('travel'), 'Travel persona layout includes travel card');

const eventsLayout = generateHomepageLayout(makeInput({
  selectedPersonas: ['events'],
  recommendations: [makeRecommendation('r1')],
}));
const eventsTypes = eventsLayout.cards.map((c) => c.type);
assert('T21', eventsTypes.includes('event'), 'Events persona layout includes event card');

// =========================================================================
// GROUP 7: Preference Boosts
// =========================================================================
console.log('\n── Group 7: Preference Boosts ──');

const withTempPref = generateHomepageLayout(makeInput({
  selectedPersonas: [],
  selectedPreferences: ['temperature', 'rainfall'],
  recommendations: [],
  alerts: [],
}));
const forecastInLayout = withTempPref.cards.find((c) => c.type === 'forecast');
assert('T22', forecastInLayout !== undefined, 'temperature + rainfall preferences include forecast card');

// =========================================================================
// GROUP 8: Explainability
// =========================================================================
console.log('\n── Group 8: Explainability ──');

const healthExpl = generateHomepageLayout(makeInput({
  selectedPersonas: ['health'],
}));
assert('T23', healthExpl.explanation.toLowerCase().includes('health'), 'Health persona explanation mentions health');

const travelExpl = generateHomepageLayout(makeInput({
  selectedPersonas: ['travel'],
}));
assert('T24', travelExpl.explanation.toLowerCase().includes('travel'), 'Travel persona explanation mentions travel');

const noPersonaExpl = generateHomepageLayout(makeInput({
  selectedPersonas: [],
  recommendations: [],
  alerts: [],
}));
assert('T25', noPersonaExpl.explanation.toLowerCase().includes('balanced') || noPersonaExpl.explanation.toLowerCase().includes('selected'), 'No-persona explanation mentions balanced/selected');

// =========================================================================
// GROUP 9: Position Assignment
// =========================================================================
console.log('\n── Group 9: Position Assignment ──');

const posLayout = generateHomepageLayout(makeInput());
posLayout.cards.forEach((card, idx) => {
  assert(`T26-${idx}`, card.position === idx, `Card "${card.type}" position (${card.position}) matches index (${idx})`);
});

// =========================================================================
// GROUP 10: Edge Cases
// =========================================================================
console.log('\n── Group 10: Edge Cases ──');

const emptyLayout = generateHomepageLayout(makeInput({
  selectedPersonas: [],
  selectedPreferences: [],
  recommendations: [],
  alerts: [],
}));
assert('T27', emptyLayout.cards.length > 0, 'Empty user state still produces cards (weather_summary, daily_briefing, forecast)');

const noRecsLayout = generateHomepageLayout(makeInput({
  recommendations: [],
}));
const hasRecsCard = noRecsLayout.cards.some((c) => c.type === 'personalized_recommendations');
assert('T28', !hasRecsCard, 'No recommendations → no personalized_recommendations card');

const severeNoAlerts = generateHomepageLayout(makeInput({
  weatherData: makeWeatherData({ severity: 'severe' }),
  isSafetyActive: true,
  alerts: [],
}));
assert('T29', severeNoAlerts.cards[0]?.type === 'safety', 'Severe weather with no alerts → safety card still at position 0');

const liveLayout = generateHomepageLayout(makeInput({
  dataMode: 'live',
}));
assert('T30', liveLayout.dataMode === 'live', 'Live data mode reflected in layout output');

// =========================================================================
// SUMMARY
// =========================================================================
console.log('\n╔═══════════════════════════════════════════════════════════╗');
console.log(`║ Phase 18 Results: ${pass} passed, ${fail} failed (of ${pass + fail} total)       ║`);
console.log('╚═══════════════════════════════════════════════════════════╝\n');

if (fail > 0) {
  process.exit(1);
}
