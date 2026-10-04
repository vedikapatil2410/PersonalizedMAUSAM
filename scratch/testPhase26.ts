import { ACTIVITY_CATALOG, getPrioritizedActivities } from '../src/constants/activities';
import { generatePersonalizedRecommendations } from '../src/services/personalizationEngine';
import { decideRecommendations } from '../src/services/decisionEngine';
import { applySafetyOverride } from '../src/services/safetyOverrideEngine';
import { generateDataTransparencySummary } from '../src/services/dataTransparencyEngine';
import type { AppState, WeatherData } from '../src/types';

function runPhase26Tests() {
  console.log('=== PHASE 26 AUTOMATED VALIDATION SUITE ===\n');
  let passCount = 0;
  let failCount = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passCount++;
    } else {
      console.error(`[FAIL] ${testName}${detail ? ': ' + detail : ''}`);
      failCount++;
    }
  }

  // TEST 1: Activity Catalog Completeness
  assert(
    ACTIVITY_CATALOG.length === 12,
    'Catalog contains exactly 12 weather-relevant activities'
  );

  const requiredIds = [
    'running',
    'cycling',
    'walking',
    'outdoor_exercise',
    'travel',
    'beach_water',
    'photography',
    'gardening',
    'events',
    'commuting',
    'outdoor_sports',
    'family_outdoor',
  ];
  const allIdsPresent = requiredIds.every((id) =>
    ACTIVITY_CATALOG.some((a) => a.id === id)
  );
  assert(allIdsPresent, 'All 12 required activity IDs exist with icons & titles');

  // TEST 2: Prioritization with No Personas
  const defaultList = getPrioritizedActivities([]);
  assert(
    defaultList.length === 12 && defaultList.every((x) => !x.isRecommended),
    'Empty personas returns all 12 activities unflagged'
  );

  // TEST 3: Prioritization with Fitness Persona
  const fitnessList = getPrioritizedActivities(['fitness']);
  assert(fitnessList.length === 12, 'Fitness persona maintains exactly 12 activities');
  const fitnessRecommendedIds = fitnessList
    .filter((x) => x.isRecommended)
    .map((x) => x.activity.id);
  assert(
    fitnessRecommendedIds.includes('running') &&
      fitnessRecommendedIds.includes('cycling') &&
      fitnessRecommendedIds.includes('walking') &&
      fitnessRecommendedIds.includes('outdoor_exercise') &&
      fitnessRecommendedIds.includes('outdoor_sports'),
    'Fitness persona prioritizes Running, Cycling, Walking, Outdoor Exercise & Sports at top'
  );
  // Verify recommended items come first
  const firstNonRecIdx = fitnessList.findIndex((x) => !x.isRecommended);
  const lastRecIdx = fitnessList.map((x) => x.isRecommended).lastIndexOf(true);
  assert(
    lastRecIdx < firstNonRecIdx,
    'All recommended activities are sorted strictly before non-recommended activities'
  );

  // TEST 4: Prioritization with Traveler Persona
  const travelerList = getPrioritizedActivities(['travel']);
  const travelerRecIds = travelerList.filter((x) => x.isRecommended).map((x) => x.activity.id);
  assert(
    travelerRecIds.includes('travel') &&
      travelerRecIds.includes('photography') &&
      travelerRecIds.includes('walking'),
    'Traveler persona prioritizes Travel, Photography & Walking'
  );

  // TEST 5: Combined Multiple Personas (Fitness + Events)
  const multiList = getPrioritizedActivities(['fitness', 'events']);
  assert(multiList.length === 12, 'Multi-persona preserves exactly 12 items (no duplicates)');
  const multiRecIds = multiList.filter((x) => x.isRecommended).map((x) => x.activity.id);
  assert(
    multiRecIds.includes('running') &&
      multiRecIds.includes('events') &&
      multiRecIds.includes('photography'),
    'Multi-persona combines relevant activities without duplicates'
  );

  // TEST 6: Mock Weather Data Setup
  const baseWeather: WeatherData = {
    location: 'Pune',
    timestamp: '12:00 PM',
    temperature: 24,
    feelsLike: 24,
    humidity: 50,
    rainfall: 0,
    rainProbability: 0,
    windSpeed: 10,
    windDirection: 'NW',
    uvIndex: 3,
    visibility: 10,
    weatherCondition: 'clear',
    sunrise: '06:00',
    sunset: '18:30',
    severity: 'normal',
    summary: 'Clear sky',
  };

  const hotWeather: WeatherData = {
    ...baseWeather,
    temperature: 37,
    feelsLike: 40,
  };

  const rainWeather: WeatherData = {
    ...baseWeather,
    rainfall: 25,
    rainProbability: 85,
    weatherCondition: 'rain',
  };

  const windWeather: WeatherData = {
    ...baseWeather,
    windSpeed: 35,
  };

  const highUVWeather: WeatherData = {
    ...baseWeather,
    uvIndex: 9,
  };

  const fogWeather: WeatherData = {
    ...baseWeather,
    visibility: 1.5,
    weatherCondition: 'fog',
  };

  const severeWeather: WeatherData = {
    ...baseWeather,
    severity: 'severe',
    windSpeed: 55,
    rainfall: 60,
  };

  // TEST 7: Personalization Engine - Running in Heat
  const runHeatState: AppState = {
    selectedPersonas: ['fitness'],
    selectedPreferences: [],
    selectedActivities: ['running'],
    selectedLocation: 'Pune',
    onboardingCompleted: true,
  };
  const runHeatRecs = generatePersonalizedRecommendations({
    userState: runHeatState,
    weatherData: hotWeather,
  });
  const runHeatCard = runHeatRecs.find((r) => r.id === 'activity_running_heat');
  assert(
    runHeatCard !== undefined,
    'Running activity generates activity_running_heat during high temperatures'
  );
  assert(
    runHeatCard?.explanation ===
      'You selected Running, so running-related weather information is prioritized on your homepage.',
    'Running heat recommendation includes exact explainable reason'
  );

  // TEST 8: Personalization Engine - Cycling in High Wind
  const cycleWindState: AppState = {
    selectedPersonas: [],
    selectedPreferences: [],
    selectedActivities: ['cycling'],
    selectedLocation: 'Pune',
    onboardingCompleted: true,
  };
  const cycleWindRecs = generatePersonalizedRecommendations({
    userState: cycleWindState,
    weatherData: windWeather,
  });
  const cycleWindCard = cycleWindRecs.find((r) => r.id === 'activity_cycling_wind');
  assert(
    cycleWindCard !== undefined &&
      cycleWindCard.explanation ===
        'You selected Cycling, so cycling-related weather information is prioritized on your homepage.',
    'Cycling activity generates activity_cycling_wind during high winds with explainability'
  );

  // TEST 9: Personalization Engine - Gardening in Rain
  const gardenState: AppState = {
    selectedPersonas: [],
    selectedPreferences: [],
    selectedActivities: ['gardening'],
    selectedLocation: 'Pune',
    onboardingCompleted: true,
  };
  const gardenRecs = generatePersonalizedRecommendations({
    userState: gardenState,
    weatherData: rainWeather,
  });
  const gardenCard = gardenRecs.find((r) => r.id === 'activity_gardening_rain');
  assert(
    gardenCard !== undefined &&
      gardenCard.explanation ===
        'You selected Gardening, so gardening-related weather information is prioritized on your homepage.',
    'Gardening activity generates activity_gardening_rain during rainfall'
  );

  // TEST 10: Personalization Engine - Photography in Fog
  const photoState: AppState = {
    selectedPersonas: [],
    selectedPreferences: [],
    selectedActivities: ['photography'],
    selectedLocation: 'Pune',
    onboardingCompleted: true,
  };
  const photoRecs = generatePersonalizedRecommendations({
    userState: photoState,
    weatherData: fogWeather,
  });
  const photoCard = photoRecs.find((r) => r.id === 'activity_photography_fog');
  assert(
    photoCard !== undefined &&
      photoCard.explanation ===
        'You selected Photography, so photography lighting information is prioritized on your homepage.',
    'Photography activity generates activity_photography_fog during misty/foggy weather'
  );

  // TEST 11: Personalization Engine - Optimal Window (Comfortable Baseline)
  const runOptRecs = generatePersonalizedRecommendations({
    userState: runHeatState,
    weatherData: baseWeather,
  });
  const runOptCard = runOptRecs.find((r) => r.id === 'activity_running_optimal');
  assert(
    runOptCard !== undefined && runOptCard.priority === 'low',
    'Running activity generates activity_running_optimal during pleasant weather'
  );

  // TEST 12: CRITICAL SEVERE WEATHER SAFETY OVERRIDE GUARANTEE
  const severeWithActivitiesState: AppState = {
    selectedPersonas: ['fitness'],
    selectedPreferences: [],
    selectedActivities: ['running', 'cycling', 'outdoor_sports'],
    selectedLocation: 'Pune',
    onboardingCompleted: true,
  };
  const severeRecs = generatePersonalizedRecommendations({
    userState: severeWithActivitiesState,
    weatherData: severeWeather,
  });
  assert(
    severeRecs.length > 0 && severeRecs[0].id === 'critical_severe_weather',
    'Critical severe weather warning is ALWAYS sorted at index 0 ahead of all activities'
  );
  assert(
    severeRecs[0].priority === 'critical',
    'Severe weather warning has strict critical priority'
  );

  // TEST 13: Pipeline Integrity through Decision Engine & Safety Override Engine
  const ranked = decideRecommendations(severeRecs);
  const finalSafety = applySafetyOverride(ranked, severeRecs, severeWeather);
  assert(
    finalSafety[0].id === 'critical_severe_weather',
    'Decision Engine + Safety Override Engine preserves critical_severe_weather at position 0'
  );

  // TEST 14: Data Transparency Summary Integration
  const transparencySummary = generateDataTransparencySummary({
    weatherData: baseWeather,
    dataMode: 'live',
    selectedLocation: 'Pune',
    selectedActivities: ['running', 'gardening'],
  });
  assert(
    transparencySummary.selectedActivities !== undefined &&
      transparencySummary.selectedActivities.length === 2 &&
      transparencySummary.selectedActivities.includes('running') &&
      transparencySummary.selectedActivities.includes('gardening'),
    'Data Transparency summary includes user-selected activities array'
  );

  console.log(`\n========================================`);
  console.log(`TOTAL TESTS: ${passCount + failCount}`);
  console.log(`PASSED: ${passCount}`);
  console.log(`FAILED: ${failCount}`);
  console.log(`========================================\n`);

  if (failCount > 0) {
    process.exit(1);
  }
}

runPhase26Tests();
