/**
 * Phase 16 Validation Suite
 * SIH26076 · PersonalizedMAUSAM
 *
 * 24 comprehensive test cases covering:
 * - Demo forecast data coverage and period structure
 * - Live forecast data integrity (never fabricated, graceful unavailability)
 * - Nullable fields handling (no fabricated zeros)
 * - Multi-scenario forecast timelines (NORMAL, HOT_SUNNY, RAINY, HIGH_UV, SEVERE_WEATHER)
 * - Best time window calculation across scenarios
 * - Location context propagation
 * - Forecast data models and export validation
 */

import { DEMO_FORECAST_MAP, getDemoForecast, getLiveForecast, getBestTimeWindow } from '../src/constants/demoForecast';
import type { DemoScenarioId, WeatherData } from '../src/types';
import type { ForecastData, ForecastPeriod } from '../src/types/forecast';

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
console.log('PHASE 16 — PERSONALIZED FORECAST & TIMELINE VALIDATION');
console.log('============================================================\n');

// Mock live weather observation
const mockLiveWeather: WeatherData = {
  location: 'New Delhi',
  timestamp: '2026-10-03T10:00:00Z',
  temperature: 31.0,
  feelsLike: 34.0,
  humidity: 55,
  rainfall: 0,
  rainProbability: 0,
  windSpeed: 14,
  windDirection: 'NW',
  uvIndex: 0,
  visibility: 0,
  weatherCondition: 'clear',
  sunrise: '06:15 (IST)',
  sunset: '18:10 (IST)',
  severity: 'normal',
  summary: 'Official IMD observation for New Delhi.',
};

// -------------------------------------------------------------
// T01: DEMO_FORECAST_MAP contains all 5 scenarios
// -------------------------------------------------------------
const scenarios: DemoScenarioId[] = ['NORMAL', 'HOT_SUNNY', 'RAINY', 'HIGH_UV', 'SEVERE_WEATHER'];
const hasAllScenarios = scenarios.every((s) => DEMO_FORECAST_MAP[s] !== undefined);
assert(hasAllScenarios, 'T01: DEMO_FORECAST_MAP contains all 5 core scenarios');

// -------------------------------------------------------------
// T02: Each demo scenario has exactly 5 forecast periods
// -------------------------------------------------------------
const allHave5Periods = scenarios.every((s) => DEMO_FORECAST_MAP[s].length === 5);
assert(allHave5Periods, 'T02: Each demo scenario contains exactly 5 timeline periods');

// -------------------------------------------------------------
// T03: Every demo period has valid non-empty core fields
// -------------------------------------------------------------
let allPeriodsValid = true;
for (const s of scenarios) {
  for (const p of DEMO_FORECAST_MAP[s]) {
    if (!p.id || !p.timestamp || !p.displayTime || !p.condition || typeof p.temperature !== 'number') {
      allPeriodsValid = false;
    }
  }
}
assert(allPeriodsValid, 'T03: Every demo period has complete id, timestamp, displayTime, condition, temp');

// -------------------------------------------------------------
// T04: getDemoForecast returns isAvailable: true and dataMode: demo
// -------------------------------------------------------------
const demoNorm = getDemoForecast('NORMAL', 'Pune');
assert(
  demoNorm.isAvailable === true && demoNorm.dataMode === 'demo',
  'T04: getDemoForecast returns isAvailable: true and dataMode: demo'
);

// -------------------------------------------------------------
// T05: getDemoForecast sets source indicating prototype data
// -------------------------------------------------------------
assert(
  demoNorm.source.includes('Prototype Demo') && demoNorm.source.includes('Not live IMD'),
  'T05: Demo forecast source explicitly indicates prototype non-live status'
);

// -------------------------------------------------------------
// T06: getDemoForecast sets correct locationId and locationName
// -------------------------------------------------------------
assert(
  demoNorm.locationName === 'Pune' && demoNorm.locationId === 'pune',
  'T06: getDemoForecast maps location name and generates locationId slug'
);

// -------------------------------------------------------------
// T07: getLiveForecast returns isAvailable: false and dataMode: live
// -------------------------------------------------------------
const liveForecast = getLiveForecast(mockLiveWeather, 'New Delhi');
assert(
  liveForecast.isAvailable === false && liveForecast.dataMode === 'live',
  'T07: getLiveForecast returns isAvailable: false and dataMode: live'
);

// -------------------------------------------------------------
// T08: getLiveForecast sets unavailableReason explaining feed status
// -------------------------------------------------------------
assert(
  typeof liveForecast.unavailableReason === 'string' &&
  liveForecast.unavailableReason.includes('not currently available'),
  'T08: getLiveForecast provides descriptive unavailableReason'
);

// -------------------------------------------------------------
// T09: getLiveForecast periods array is strictly empty
// -------------------------------------------------------------
assert(
  liveForecast.periods.length === 0,
  'T09: getLiveForecast periods array is strictly empty (never fabricates live forecast)'
);

// -------------------------------------------------------------
// T10: Available fields array correctly indicates accessible metrics
// -------------------------------------------------------------
const normPeriod0 = DEMO_FORECAST_MAP.NORMAL[0];
assert(
  Array.isArray(normPeriod0.availableFields) &&
  normPeriod0.availableFields.includes('temperature') &&
  normPeriod0.availableFields.includes('humidity'),
  'T10: ForecastPeriod availableFields lists active metrics'
);

// -------------------------------------------------------------
// T11: NORMAL forecast provides comfortable periods and notes
// -------------------------------------------------------------
const normalP0 = DEMO_FORECAST_MAP.NORMAL[0];
assert(
  normalP0.temperature === 26 && normalP0.badge === 'Comfortable',
  'T11: NORMAL scenario period 0 is 26°C with Comfortable badge'
);

// -------------------------------------------------------------
// T12: HOT_SUNNY forecast reflects extreme heat and cooling window
// -------------------------------------------------------------
const hotP0 = DEMO_FORECAST_MAP.HOT_SUNNY[0];
const hotP3 = DEMO_FORECAST_MAP.HOT_SUNNY[3];
assert(
  hotP0.temperature === 39 && hotP3.temperature === 33 && hotP3.badge === 'Cooling Window',
  'T12: HOT_SUNNY starts at 39°C and transitions to cooling window (33°C)'
);

// -------------------------------------------------------------
// T13: RAINY forecast reflects precipitation and thunderstorm
// -------------------------------------------------------------
const rainP1 = DEMO_FORECAST_MAP.RAINY[1];
assert(
  rainP1.condition === 'thunderstorm' && (rainP1.rainProbability ?? 0) >= 90,
  'T13: RAINY scenario period 1 shows thunderstorm with ≥90% rain probability'
);

// -------------------------------------------------------------
// T14: HIGH_UV forecast has peak UV 11 dropping to 0 at night
// -------------------------------------------------------------
const uvP0 = DEMO_FORECAST_MAP.HIGH_UV[0];
const uvP4 = DEMO_FORECAST_MAP.HIGH_UV[4];
assert(
  uvP0.uvIndex === 11 && uvP4.uvIndex === 0,
  'T14: HIGH_UV scenario period 0 has UV 11 dropping to 0 at night (+12 hrs)'
);

// -------------------------------------------------------------
// T15: SEVERE_WEATHER forecast periods reflect severe conditions and high wind
// -------------------------------------------------------------
const sevP0 = DEMO_FORECAST_MAP.SEVERE_WEATHER[0];
const sevP1 = DEMO_FORECAST_MAP.SEVERE_WEATHER[1];
assert(
  sevP0.condition === 'severe' && sevP1.windSpeed === 65,
  'T15: SEVERE_WEATHER scenario shows severe condition with peak wind 65 km/h'
);

// -------------------------------------------------------------
// T16: getBestTimeWindow for NORMAL returns favorable window
// -------------------------------------------------------------
const bestNorm = getBestTimeWindow(demoNorm, 'NORMAL');
assert(
  bestNorm.isAvailable === true && bestNorm.window.includes('All Day Favorable'),
  'T16: Best time for NORMAL scenario is all day favorable'
);

// -------------------------------------------------------------
// T17: getBestTimeWindow for HOT_SUNNY recommends evening/early morning
// -------------------------------------------------------------
const demoHot = getDemoForecast('HOT_SUNNY', 'Jaipur');
const bestHot = getBestTimeWindow(demoHot, 'HOT_SUNNY');
assert(
  bestHot.isAvailable === true && bestHot.window.includes('Evening'),
  'T17: Best time for HOT_SUNNY recommends Evening / Early Morning'
);

// -------------------------------------------------------------
// T18: getBestTimeWindow for HIGH_UV recommends late afternoon
// -------------------------------------------------------------
const demoUv = getDemoForecast('HIGH_UV', 'Bengaluru');
const bestUv = getBestTimeWindow(demoUv, 'HIGH_UV');
assert(
  bestUv.isAvailable === true && bestUv.window.includes('Late Afternoon'),
  'T18: Best time for HIGH_UV recommends Late Afternoon after UV declines'
);

// -------------------------------------------------------------
// T19: getBestTimeWindow for RAINY recommends precipitation low
// -------------------------------------------------------------
const demoRain = getDemoForecast('RAINY', 'Mumbai');
const bestRain = getBestTimeWindow(demoRain, 'RAINY');
assert(
  bestRain.isAvailable === true && bestRain.window.includes('Late Night'),
  'T19: Best time for RAINY recommends Late Night or Post-Squall'
);

// -------------------------------------------------------------
// T20: getBestTimeWindow for SEVERE_WEATHER indicates no safe window
// -------------------------------------------------------------
const demoSev = getDemoForecast('SEVERE_WEATHER', 'Kolkata');
const bestSev = getBestTimeWindow(demoSev, 'SEVERE_WEATHER');
assert(
  bestSev.isAvailable === true && bestSev.window.includes('No Safe Window'),
  'T20: Best time for SEVERE_WEATHER indicates No Safe Window Currently'
);

// -------------------------------------------------------------
// T21: getBestTimeWindow for unavailable forecast returns isAvailable: false
// -------------------------------------------------------------
const bestLive = getBestTimeWindow(liveForecast);
assert(
  bestLive.isAvailable === false && bestLive.window === 'Unavailable',
  'T21: getBestTimeWindow for live/unavailable forecast returns isAvailable: false'
);

// -------------------------------------------------------------
// T22: Nullable fields are properly supported without crashing
// -------------------------------------------------------------
const customPeriod: ForecastPeriod = {
  id: 'custom_1',
  timestamp: 'Now',
  displayTime: 'Now',
  temperature: 28,
  feelsLike: 30,
  condition: 'partly_cloudy',
  humidity: 60,
  windSpeed: 10,
  windDirection: 'N',
  rainProbability: null,
  rainfall: null,
  uvIndex: null,
  visibility: null,
  availableFields: ['temperature', 'feelsLike', 'condition', 'humidity', 'windSpeed', 'windDirection'],
};
assert(
  customPeriod.rainProbability === null &&
  customPeriod.uvIndex === null &&
  customPeriod.availableFields.length === 6,
  'T22: ForecastPeriod correctly models nullable fields when feed lacks specific metrics'
);

// -------------------------------------------------------------
// T23: ForecastData structure matches contract
// -------------------------------------------------------------
const forecastKeys: (keyof ForecastData)[] = [
  'locationId',
  'locationName',
  'source',
  'dataMode',
  'updatedAt',
  'isAvailable',
  'periods',
];
const hasAllKeys = forecastKeys.every((k) => k in demoNorm);
assert(hasAllKeys, 'T23: ForecastData structure contains all mandatory contract keys');

// -------------------------------------------------------------
// T24: Location context correctly propagates to forecast output
// -------------------------------------------------------------
const locDemo = getDemoForecast('NORMAL', 'Shimla (Hill Station)');
assert(
  locDemo.locationName === 'Shimla (Hill Station)' &&
  locDemo.locationId === 'shimla_(hill_station)',
  'T24: Location context properly propagates to forecast metadata'
);

console.log('\n------------------------------------------------------------');
console.log(`Results: ${passed} PASSED, ${failed} FAILED (${passed + failed} total)`);
console.log('------------------------------------------------------------\n');

if (failed > 0) {
  process.exit(1);
}
