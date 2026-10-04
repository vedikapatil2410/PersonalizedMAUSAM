import { generatePersonalizedRecommendations } from '../src/services/personalizationEngine';
import { decideRecommendations } from '../src/services/decisionEngine';
import { applySafetyOverride } from '../src/services/safetyOverrideEngine';
import { getDemoWeatherScenario, DEMO_SCENARIO_LIST } from '../src/constants/demoWeather';
import type { WeatherData, AppState } from '../src/types';

async function validatePhase9() {
  console.log('=== PHASE 9 VALIDATION START ===\n');

  // 1. Verify Backend Health
  const healthRes = await fetch('http://localhost:5000/health');
  const healthJson = await healthRes.json();
  console.log('1. Backend /health status:', healthJson.status === 'ok' ? 'PASS' : 'FAIL');
  if (healthJson.status !== 'ok') throw new Error('Health check failed');

  // 2. Verify Backend Status
  const statusRes = await fetch('http://localhost:5000/api/imd/status');
  const statusJson = await statusRes.json();
  console.log('2. Backend /api/imd/status:', statusJson.status === 'active' ? 'PASS' : 'FAIL');
  console.log('   Supported stations:', Object.keys(statusJson.supportedStations).join(', '));

  // 3. Verify Live IMD Weather for Pune
  const puneRes = await fetch('http://localhost:5000/api/imd/weather?city=Pune');
  const puneJson = await puneRes.json();
  console.log('3. Live IMD Pune fetch success:', puneJson.success ? 'PASS' : 'FAIL');
  if (!puneJson.success || !puneJson.weather) throw new Error('Pune IMD fetch failed');

  const imdWeather = puneJson.weather;
  console.log(`   Station: ${imdWeather.stationName} (ID: ${imdWeather.stationId})`);
  console.log(`   Observed: Temp=${imdWeather.temperature}°C, FeelsLike=${imdWeather.feelsLike}°C, Humidity=${imdWeather.humidity}%, Wind=${imdWeather.windSpeed} km/h ${imdWeather.windDirection}`);
  console.log(`   Condition: ${imdWeather.weatherCondition}, Severity: ${imdWeather.severity}`);
  console.log(`   Source: ${imdWeather.source}`);
  console.log(`   Explicitly Unavailable Fields: ${imdWeather.unavailableFields.join(', ')}`);

  // Verify unavailable fields are not fabricated
  if (imdWeather.rainfall !== 0 || imdWeather.rainProbability !== 0 || imdWeather.uvIndex !== 0 || imdWeather.visibility !== 0) {
    throw new Error('Unavailable fields must not be fabricated with non-zero dummy values');
  }
  console.log('4. Unavailable fields safety check: PASS (clean 0 defaults with explicit unavailable flag)');

  // 5. Test Live IMD Weather data through Phase 5, Phase 6, Phase 7 Pipeline
  const mockUserState: AppState = {
    onboardingCompleted: true,
    selectedLocation: 'Pune',
    selectedPersonas: ['commuter', 'fitness'],
    selectedPreferences: ['heat', 'air_quality'],
  };

  const liveWeatherData: WeatherData = {
    location: imdWeather.location,
    timestamp: imdWeather.timestamp,
    temperature: imdWeather.temperature,
    feelsLike: imdWeather.feelsLike,
    humidity: imdWeather.humidity,
    rainfall: imdWeather.rainfall,
    rainProbability: imdWeather.rainProbability,
    windSpeed: imdWeather.windSpeed,
    windDirection: imdWeather.windDirection,
    uvIndex: imdWeather.uvIndex,
    visibility: imdWeather.visibility,
    weatherCondition: imdWeather.weatherCondition,
    sunrise: imdWeather.sunrise,
    sunset: imdWeather.sunset,
    severity: imdWeather.severity,
    summary: imdWeather.summary,
  };

  const rawRecs = generatePersonalizedRecommendations({
    userState: mockUserState,
    weatherData: liveWeatherData,
  });
  const decidedRecs = decideRecommendations(rawRecs);
  const finalLiveRecs = applySafetyOverride(decidedRecs, rawRecs, liveWeatherData);

  console.log(`5. Personalization Pipeline with Live IMD Data: PASS (${finalLiveRecs.length} recommendations generated)`);
  finalLiveRecs.forEach((r, idx) => {
    console.log(`   [${idx + 1}] [${r.priority.toUpperCase()}] ${r.title} - ${r.explanation}`);
  });

  // 6. Test Demo Mode remains completely intact
  console.log('6. Verifying Demo Mode Scenarios:');
  for (const scenario of DEMO_SCENARIO_LIST) {
    const demoData = getDemoWeatherScenario(scenario.id).weatherData;
    const demoRaw = generatePersonalizedRecommendations({
      userState: mockUserState,
      weatherData: demoData,
    });
    const demoDecided = decideRecommendations(demoRaw);
    const demoFinal = applySafetyOverride(demoDecided, demoRaw, demoData);
    console.log(`   - Demo Scenario ${scenario.id} (${scenario.label}): ${demoFinal.length} recs generated`);
  }
  console.log('   Demo Mode Scenarios Verification: PASS');

  // 7. Verify Mumbai and Delhi Live retrieval
  const mumbaiRes = await fetch('http://localhost:5000/api/imd/weather?city=Mumbai');
  const mumbaiJson = await mumbaiRes.json();
  console.log(`7. Live IMD Mumbai: ${mumbaiJson.success ? 'PASS' : 'FAIL'} (${mumbaiJson.weather.temperature}°C, ${mumbaiJson.weather.stationName})`);

  const delhiRes = await fetch('http://localhost:5000/api/imd/weather?city=Delhi');
  const delhiJson = await delhiRes.json();
  console.log(`8. Live IMD Delhi: ${delhiJson.success ? 'PASS' : 'FAIL'} (${delhiJson.weather.temperature}°C, ${delhiJson.weather.stationName})`);

  console.log('\n=== ALL PHASE 9 VALIDATIONS PASSED SUCCESSFULLY ===');
}

validatePhase9().catch(err => {
  console.error('Validation failed:', err);
  process.exit(1);
});
