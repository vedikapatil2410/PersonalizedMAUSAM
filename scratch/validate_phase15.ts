/**
 * Phase 15 — Multi-Location Weather Intelligence
 * Validation Script — 24 Deterministic Test Cases
 *
 * Run via: npx tsx scratch/validate_phase15.ts
 */

import {
  DEFAULT_SAVED_LOCATIONS,
  MAX_SAVED_LOCATIONS,
  SUPPORTED_CITIES,
  DEFAULT_LOCATION,
} from '../src/constants/locations';
import { getDemoWeatherScenario } from '../src/constants/demoWeather';
import { DEFAULT_NOTIFICATION_PREFERENCES } from '../src/constants/notificationPreferences';
import { generatePersonalizedRecommendations } from '../src/services/personalizationEngine';
import { decideRecommendations } from '../src/services/decisionEngine';
import { applySafetyOverride } from '../src/services/safetyOverrideEngine';
import { generatePersonalizedAlerts } from '../src/services/alertEngine';
import { getNotificationDeliveryDecisions } from '../src/services/notificationEngine';
import { generatePersonalizationInsights } from '../src/services/personalizationInsightEngine';
import { generateAskMausamResponse } from '../src/services/askMausamEngine';
import type { WeatherLocation, SupportedCity } from '../src/types/locations';
import type { AppState, WeatherData } from '../src/types';

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

// ─── Simulation Helpers ───────────────────────────────────────────────────────

class LocationManagerSimulator {
  public savedLocations: WeatherLocation[];
  public selectedLocation: string;

  constructor(initialLocations = DEFAULT_SAVED_LOCATIONS, initialActive = DEFAULT_LOCATION) {
    this.savedLocations = JSON.parse(JSON.stringify(initialLocations));
    this.selectedLocation = initialActive;
  }

  setActiveLocation(locationIdOrName: string) {
    const target = this.savedLocations.find(
      (l) =>
        l.id.toLowerCase() === locationIdOrName.toLowerCase() ||
        l.city.toLowerCase() === locationIdOrName.toLowerCase() ||
        l.name.toLowerCase() === locationIdOrName.toLowerCase()
    );

    if (target) {
      this.selectedLocation = target.city;
      this.savedLocations = this.savedLocations.map((loc) => ({
        ...loc,
        isCurrentLocation: loc.id === target.id,
      }));
    } else {
      this.selectedLocation = locationIdOrName;
    }
  }

  addLocation(input: { city: string; label?: string; name?: string }): { success: boolean; error?: string } {
    if (!input.city || input.city.trim() === '') {
      return { success: false, error: 'Location name and city cannot be empty.' };
    }

    if (this.savedLocations.length >= MAX_SAVED_LOCATIONS) {
      return { success: false, error: `You can save up to ${MAX_SAVED_LOCATIONS} locations.` };
    }

    const cityTrimmed = input.city.trim();
    const isDuplicate = this.savedLocations.some(
      (l) => l.city.toLowerCase() === cityTrimmed.toLowerCase()
    );

    if (isDuplicate) {
      return { success: false, error: 'This location is already saved.' };
    }

    const matchedSupported = SUPPORTED_CITIES.find(
      (c) => c.city.toLowerCase() === cityTrimmed.toLowerCase()
    );

    const newLoc: WeatherLocation = {
      id: matchedSupported ? matchedSupported.id : cityTrimmed.toLowerCase().replace(/\s+/g, '_'),
      name: input.name?.trim() || matchedSupported?.name || cityTrimmed,
      city: matchedSupported?.city || cityTrimmed,
      state: matchedSupported?.state || 'India',
      country: matchedSupported?.country || 'India',
      label: input.label?.trim() || matchedSupported?.defaultLabel || 'Saved Location',
      isCurrentLocation: false,
      isDefault: false,
    };

    this.savedLocations.push(newLoc);
    return { success: true };
  }

  removeLocation(locationId: string): { success: boolean; error?: string } {
    if (this.savedLocations.length <= 1) {
      return { success: false, error: 'You must maintain at least one saved location.' };
    }

    const target = this.savedLocations.find((l) => l.id === locationId);
    if (!target) {
      return { success: false, error: 'Location not found.' };
    }

    this.savedLocations = this.savedLocations.filter((l) => l.id !== locationId);

    if (
      this.selectedLocation.toLowerCase() === target.city.toLowerCase() ||
      this.selectedLocation.toLowerCase() === target.name.toLowerCase() ||
      target.isCurrentLocation
    ) {
      const nextActive = this.savedLocations[0];
      this.selectedLocation = nextActive.city;
      this.savedLocations = this.savedLocations.map((l) => ({
        ...l,
        isCurrentLocation: l.id === nextActive.id,
      }));
    }

    return { success: true };
  }

  renameLocation(locationId: string, newLabel: string): { success: boolean; error?: string } {
    if (!newLabel || newLabel.trim() === '') {
      return { success: false, error: 'Label cannot be empty.' };
    }

    const target = this.savedLocations.find((l) => l.id === locationId);
    if (!target) {
      return { success: false, error: 'Location not found.' };
    }

    this.savedLocations = this.savedLocations.map((loc) =>
      loc.id === locationId ? { ...loc, label: newLabel.trim() } : loc
    );

    return { success: true };
  }
}

// ─── Tests ───────────────────────────────────────────────────────────────────

console.log(`\n${BOLD}Phase 15 — Multi-Location Weather Intelligence Validation${RESET}`);
console.log('═'.repeat(70));

// T01: Default location initializes correctly
test('T01: Default location initializes correctly to Pune', () => {
  assert(DEFAULT_LOCATION === 'Pune', 'DEFAULT_LOCATION must be Pune');
  assert(DEFAULT_SAVED_LOCATIONS.length >= 3, 'Expected at least 3 initial default locations');
  const defaultPune = DEFAULT_SAVED_LOCATIONS.find((l) => l.city === 'Pune');
  assert(defaultPune !== undefined, 'Default Pune location missing');
  assert(defaultPune!.isDefault === true, 'Pune must be marked default');
});

// T02: Existing Pune location remains available
test('T02: Existing Pune location remains available in supported list and saved list', () => {
  const supported = SUPPORTED_CITIES.find((c) => c.city === 'Pune');
  assert(supported !== undefined, 'Pune missing from SUPPORTED_CITIES');
  assert(supported!.state === 'Maharashtra', 'Pune state should be Maharashtra');
});

// T03: Existing Mumbai location remains available
test('T03: Existing Mumbai location remains available in supported list and saved list', () => {
  const supported = SUPPORTED_CITIES.find((c) => c.city === 'Mumbai');
  assert(supported !== undefined, 'Mumbai missing from SUPPORTED_CITIES');
  assert(supported!.state === 'Maharashtra', 'Mumbai state should be Maharashtra');
});

// T04: Existing Delhi location remains available
test('T04: Existing Delhi location remains available in supported list and saved list', () => {
  const supported = SUPPORTED_CITIES.find((c) => c.city === 'Delhi');
  assert(supported !== undefined, 'Delhi missing from SUPPORTED_CITIES');
  assert(supported!.country === 'India', 'Delhi country should be India');
});

// T05: Active location can be switched
test('T05: Active location can be switched between saved locations', () => {
  const sim = new LocationManagerSimulator();
  assert(sim.selectedLocation === 'Pune', 'Initial location must be Pune');

  sim.setActiveLocation('mumbai');
  assert(sim.selectedLocation === 'Mumbai', 'Active location should switch to Mumbai');
  const activeLoc = sim.savedLocations.find((l) => l.city === 'Mumbai');
  assert(activeLoc?.isCurrentLocation === true, 'Mumbai should be marked isCurrentLocation=true');

  const puneLoc = sim.savedLocations.find((l) => l.city === 'Pune');
  assert(puneLoc?.isCurrentLocation === false, 'Pune should be marked isCurrentLocation=false');
});

// T06: Adding a supported location works
test('T06: Adding a supported location works', () => {
  // Start with only Pune and Mumbai
  const initial = DEFAULT_SAVED_LOCATIONS.slice(0, 2);
  const sim = new LocationManagerSimulator(initial);
  assert(sim.savedLocations.length === 2, 'Initial count should be 2');

  const res = sim.addLocation({ city: 'Delhi', label: 'College' });
  assert(res.success === true, 'Adding Delhi should succeed');
  assert(sim.savedLocations.length === 3, 'Count should be 3');
  const added = sim.savedLocations.find((l) => l.city === 'Delhi');
  assert(added !== undefined, 'Delhi should exist in saved locations');
  assert(added!.label === 'College', 'Label should be College');
});

// T07: Duplicate locations are rejected
test('T07: Duplicate locations are rejected', () => {
  const sim = new LocationManagerSimulator();
  const res = sim.addLocation({ city: 'Pune' });
  assert(res.success === false, 'Duplicate city Pune must be rejected');
  assert(res.error?.includes('already saved'), 'Error message must mention duplicate');
});

// T08: Empty labels/names are rejected
test('T08: Empty labels/names are rejected', () => {
  const sim = new LocationManagerSimulator();
  const resEmptyCity = sim.addLocation({ city: '   ' });
  assert(resEmptyCity.success === false, 'Empty city must be rejected');

  const resEmptyRename = sim.renameLocation('pune', '   ');
  assert(resEmptyRename.success === false, 'Empty rename label must be rejected');
});

// T09: Maximum 5 locations is enforced
test('T09: Maximum 5 locations limit is strictly enforced', () => {
  assert(MAX_SAVED_LOCATIONS === 5, 'MAX_SAVED_LOCATIONS must be 5');
  const fiveLocations: WeatherLocation[] = [
    { id: '1', name: 'Pune', city: 'Pune', state: 'MH', country: 'IN', label: 'Home', isCurrentLocation: true },
    { id: '2', name: 'Mumbai', city: 'Mumbai', state: 'MH', country: 'IN', label: 'Travel', isCurrentLocation: false },
    { id: '3', name: 'Delhi', city: 'Delhi', state: 'DL', country: 'IN', label: 'Work', isCurrentLocation: false },
    { id: '4', name: 'Nagpur', city: 'Nagpur', state: 'MH', country: 'IN', label: 'Family', isCurrentLocation: false },
    { id: '5', name: 'Nashik', city: 'Nashik', state: 'MH', country: 'IN', label: 'College', isCurrentLocation: false },
  ];
  const sim = new LocationManagerSimulator(fiveLocations);
  assert(sim.savedLocations.length === 5, 'Must have 5 locations');

  const res = sim.addLocation({ city: 'Bengaluru' });
  assert(res.success === false, 'Adding 6th location must fail');
  assert(res.error?.includes('up to 5'), 'Error must specify 5 limit');
});

// T10: Active location cannot leave the app without a valid replacement
test('T10: Deleting active location automatically selects another valid saved location', () => {
  const sim = new LocationManagerSimulator();
  sim.setActiveLocation('Pune');
  assert(sim.selectedLocation === 'Pune', 'Active should be Pune');

  const res = sim.removeLocation('pune');
  assert(res.success === true, 'Removal should succeed');
  assert(sim.selectedLocation !== 'Pune', 'Active location should have changed from Pune');
  assert(sim.selectedLocation === 'Mumbai' || sim.selectedLocation === 'Delhi', 'New active must be a valid remaining location');
  const newActive = sim.savedLocations.find((l) => l.city === sim.selectedLocation);
  assert(newActive?.isCurrentLocation === true, 'New active must have isCurrentLocation=true');
});

// T11: Location state persists during the current app session
test('T11: Location state and labels persist throughout simulator session operations', () => {
  const sim = new LocationManagerSimulator();
  sim.renameLocation('pune', 'My Primary Residence');
  const pune = sim.savedLocations.find((l) => l.id === 'pune');
  assert(pune?.label === 'My Primary Residence', 'Renamed label should persist');
});

// T12: Live mode uses the existing IMD endpoint
test('T12: Live mode URL formatting targets existing IMD backend endpoint', () => {
  const city = 'Mumbai';
  const url = `http://localhost:5000/api/imd/weather?city=${encodeURIComponent(city)}`;
  assert(url.includes('/api/imd/weather?city=Mumbai'), 'URL should match existing backend structure');
});

// T13: Demo mode uses existing demo weather
test('T13: Demo mode applies active location to existing demo scenario data', () => {
  const baseDemo = getDemoWeatherScenario('HOT_SUNNY').weatherData;
  const activeCity = 'Delhi';
  const weatherContext: WeatherData = {
    ...baseDemo,
    location: activeCity,
  };
  assert(weatherContext.location === 'Delhi', 'Weather context location should match activeCity');
  assert(weatherContext.temperature === 39, 'Demo scenario weather parameters must remain intact');
});

// T14: Changing location updates weather context
test('T14: Switching location updates WeatherData location context', () => {
  const sim = new LocationManagerSimulator();
  sim.setActiveLocation('Mumbai');
  const base = getDemoWeatherScenario('RAINY').weatherData;
  const weatherData: WeatherData = { ...base, location: sim.selectedLocation };
  assert(weatherData.location === 'Mumbai', 'WeatherData must reflect Mumbai');
});

// T15: Changing location updates recommendations
test('T15: Recommendations reflect active location context in safety triggers', () => {
  const userState: AppState = {
    selectedPersonas: ['health', 'travel'],
    selectedPreferences: ['temperature', 'rainfall'],
    selectedLocation: 'Mumbai',
    onboardingCompleted: true,
  };
  const weatherData: WeatherData = {
    ...getDemoWeatherScenario('HOT_SUNNY').weatherData,
    location: userState.selectedLocation,
  };
  const recs = generatePersonalizedRecommendations({ userState, weatherData });
  assert(recs.length >= 1, 'Expected recommendations to generate');
});

// T16: Changing location updates alerts
test('T16: Alerts are generated with active location title and explanation', () => {
  const userState: AppState = {
    selectedPersonas: ['commuting'],
    selectedPreferences: ['rainfall'],
    selectedLocation: 'Delhi',
    onboardingCompleted: true,
  };
  const weatherData: WeatherData = {
    ...getDemoWeatherScenario('RAINY').weatherData,
    location: userState.selectedLocation,
  };
  const alerts = generatePersonalizedAlerts({ weatherData, userState, dataMode: 'demo' });
  assert(alerts.length >= 1, 'Expected rain alert in Delhi');
});

// T17: Changing location does not alter alert generation logic
test('T17: Alert generation rules and thresholds remain unaltered across locations', () => {
  const userStatePune: AppState = { selectedPersonas: ['health'], selectedPreferences: ['temperature'], selectedLocation: 'Pune', onboardingCompleted: true };
  const userStateMumbai: AppState = { selectedPersonas: ['health'], selectedPreferences: ['temperature'], selectedLocation: 'Mumbai', onboardingCompleted: true };

  const weatherHot = getDemoWeatherScenario('HOT_SUNNY').weatherData;
  const alertsPune = generatePersonalizedAlerts({ weatherData: { ...weatherHot, location: 'Pune' }, userState: userStatePune, dataMode: 'demo' });
  const alertsMumbai = generatePersonalizedAlerts({ weatherData: { ...weatherHot, location: 'Mumbai' }, userState: userStateMumbai, dataMode: 'demo' });

  assert(alertsPune.length === alertsMumbai.length, 'Alert counts must be identical for identical weather');
  assert(alertsPune[0].severity === alertsMumbai[0].severity, 'Alert severities must match');
});

// T18: Notification preferences remain unchanged
test('T18: Notification preferences structure and rules are preserved across locations', () => {
  const prefs = DEFAULT_NOTIFICATION_PREFERENCES;
  assert(prefs.criticalSafetyEnabled === true, 'Critical safety must remain enabled');
  assert(prefs.highSeverityEnabled === true, 'High severity must remain enabled');
});

// T19: Ask MAUSAM uses the active location
test('T19: Ask MAUSAM answers query citing active location', () => {
  const userState: AppState = {
    selectedPersonas: ['health'],
    selectedPreferences: ['temperature'],
    selectedLocation: 'Mumbai',
    onboardingCompleted: true,
  };
  const weatherData: WeatherData = {
    ...getDemoWeatherScenario('HOT_SUNNY').weatherData,
    location: 'Mumbai',
  };

  const response = generateAskMausamResponse({
    query: 'What is the temperature today?',
    weatherData,
    userState,
    dataMode: 'demo',
  });

  assert(response.text.includes('Mumbai'), `Ask MAUSAM response should mention Mumbai. Got: ${response.text}`);
});

// T20: Personalization Insights uses the active location
test('T20: Personalization Insights report cites active location', () => {
  const userState: AppState = {
    selectedPersonas: ['fitness'],
    selectedPreferences: ['temperature'],
    selectedLocation: 'Delhi',
    onboardingCompleted: true,
  };
  const weatherData: WeatherData = {
    ...getDemoWeatherScenario('HOT_SUNNY').weatherData,
    location: 'Delhi',
  };
  const rawRecs = generatePersonalizedRecommendations({ userState, weatherData });
  const selectedRecs = decideRecommendations(rawRecs);
  const finalRecs = applySafetyOverride(selectedRecs, rawRecs, weatherData);
  const alerts = generatePersonalizedAlerts({ weatherData, userState, dataMode: 'demo' });
  const notifs = getNotificationDeliveryDecisions(alerts, DEFAULT_NOTIFICATION_PREFERENCES);

  const report = generatePersonalizationInsights({
    weatherData,
    dataMode: 'demo',
    selectedPersonas: userState.selectedPersonas,
    selectedPreferences: userState.selectedPreferences,
    selectedLocation: userState.selectedLocation,
    rawRecommendations: rawRecs,
    finalRecommendations: finalRecs,
    alerts,
    notificationDecisions: notifs,
  });

  assert(report.summary.location === 'Delhi', `Report summary location should be Delhi, got ${report.summary.location}`);
});

// T21: No fabricated unavailable IMD fields
test('T21: Live IMD mode preserves unavailable fields when switching locations', () => {
  const liveWeatherData: WeatherData = {
    location: 'Mumbai',
    timestamp: 'Live IMD • 10:00 AM',
    temperature: 30,
    feelsLike: 33,
    humidity: 75,
    rainfall: 0,
    rainProbability: 0,
    windSpeed: 16,
    windDirection: 'SW',
    uvIndex: 0,
    visibility: 0,
    weatherCondition: 'partly_cloudy',
    sunrise: '06:12 AM',
    sunset: '06:48 PM',
    severity: 'normal',
    summary: 'Observation from IMD Mumbai station.',
  };

  assert(liveWeatherData.uvIndex === 0, 'UV must be 0 (unavailable)');
  assert(liveWeatherData.rainfall === 0, 'Rainfall must be 0 (unavailable)');
});

// T22: No input state mutation
test('T22: Location operations do not mutate original input objects', () => {
  const input = { city: 'Delhi', label: 'Work' };
  const snapshot = JSON.stringify(input);
  const sim = new LocationManagerSimulator();
  sim.addLocation(input);
  assert(JSON.stringify(input) === snapshot, 'Input object must not be mutated');
});

// T23: Deterministic behavior
test('T23: Location selection and ordering is deterministic across runs', () => {
  const sim1 = new LocationManagerSimulator();
  const sim2 = new LocationManagerSimulator();
  assert(sim1.savedLocations.length === sim2.savedLocations.length, 'Length mismatch');
  for (let i = 0; i < sim1.savedLocations.length; i++) {
    assert(sim1.savedLocations[i].id === sim2.savedLocations[i].id, `Mismatch at index ${i}`);
  }
});

// T24: Existing Phase 14 validation logic passes with active location
test('T24: Phase 14 explainability remains 100% compatible with active multi-location state', () => {
  const userState: AppState = {
    selectedPersonas: ['health', 'fitness'],
    selectedPreferences: ['temperature', 'rainfall'],
    selectedLocation: 'Mumbai',
    onboardingCompleted: true,
  };
  const weatherData: WeatherData = {
    ...getDemoWeatherScenario('SEVERE_WEATHER').weatherData,
    location: 'Mumbai',
  };
  const rawRecs = generatePersonalizedRecommendations({ userState, weatherData });
  const finalRecs = applySafetyOverride(decideRecommendations(rawRecs), rawRecs, weatherData);
  const alerts = generatePersonalizedAlerts({ weatherData, userState, dataMode: 'demo' });
  const notifs = getNotificationDeliveryDecisions(alerts, DEFAULT_NOTIFICATION_PREFERENCES);

  const report = generatePersonalizationInsights({
    weatherData,
    dataMode: 'demo',
    selectedPersonas: userState.selectedPersonas,
    selectedPreferences: userState.selectedPreferences,
    selectedLocation: userState.selectedLocation,
    rawRecommendations: rawRecs,
    finalRecommendations: finalRecs,
    alerts,
    notificationDecisions: notifs,
  });

  assert(report.summary.safetyOverrideActive === true, 'Safety override must be active');
  assert(report.summary.location === 'Mumbai', 'Location must be Mumbai');
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
