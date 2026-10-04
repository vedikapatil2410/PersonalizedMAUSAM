import { generatePersonalizedAlerts } from '../src/services/alertEngine';
import { generateAskMausamResponse } from '../src/services/askMausamEngine';
import { getDemoWeatherScenario } from '../src/constants/demoWeather';
import type { WeatherData, AppState } from '../src/types';

async function validatePhase12() {
  console.log('=== PHASE 12: PERSONALIZED ALERTS & ALERT CENTER VALIDATION ===\n');

  const normal = getDemoWeatherScenario('NORMAL').weatherData;
  const hotSunny = getDemoWeatherScenario('HOT_SUNNY').weatherData;
  const rainy = getDemoWeatherScenario('RAINY').weatherData;
  const highUv = getDemoWeatherScenario('HIGH_UV').weatherData;
  const severe = getDemoWeatherScenario('SEVERE_WEATHER').weatherData;

  const mockUserAll: AppState = {
    onboardingCompleted: true,
    selectedLocation: 'Pune',
    selectedPersonas: ['health', 'fitness', 'commuting', 'events', 'agriculture', 'travel', 'outdoor', 'family'],
    selectedPreferences: ['severe_alerts', 'heat', 'rainfall', 'wind'],
  };

  // 1. NORMAL scenario (Empty state test)
  console.log('1. NORMAL Scenario Alerts Generation:');
  const normalAlerts = generatePersonalizedAlerts({
    weatherData: normal,
    userState: mockUserAll,
    dataMode: 'demo',
  });
  console.log(`   Alert count in NORMAL: ${normalAlerts.length}`);
  if (normalAlerts.length !== 0) {
    throw new Error('Normal weather must produce 0 artificial alerts (clean empty state)');
  }
  console.log('   NORMAL Scenario (Clean Baseline / Empty State): PASS\n');

  // 2. HOT_SUNNY scenario (Health, Fitness, Agriculture, Family)
  console.log('2. HOT_SUNNY Scenario Alerts:');
  const hotAlerts = generatePersonalizedAlerts({
    weatherData: hotSunny,
    userState: mockUserAll,
    dataMode: 'demo',
  });
  console.log(`   Alert count in HOT_SUNNY: ${hotAlerts.length}`);
  hotAlerts.forEach((a) => {
    console.log(`   - [${a.severity.toUpperCase()}] [${a.source}] ${a.title} (${a.persona || a.category})`);
  });
  const hasHealthHeat = hotAlerts.some((a) => a.id === 'alert_health_heat');
  const hasFitnessHeat = hotAlerts.some((a) => a.id === 'alert_fitness_heat');
  if (!hasHealthHeat || !hasFitnessHeat) {
    throw new Error('HOT_SUNNY must generate heat alerts for Health and Fitness');
  }
  console.log('   HOT_SUNNY Scenario: PASS\n');

  // 3. RAINY scenario (Commuting, Travel, Events, Fitness)
  console.log('3. RAINY Scenario Alerts:');
  const rainAlerts = generatePersonalizedAlerts({
    weatherData: rainy,
    userState: mockUserAll,
    dataMode: 'demo',
  });
  console.log(`   Alert count in RAINY: ${rainAlerts.length}`);
  rainAlerts.forEach((a) => {
    console.log(`   - [${a.severity.toUpperCase()}] [${a.source}] ${a.title} (${a.persona || a.category})`);
  });
  const hasCommuteRain = rainAlerts.some((a) => a.id === 'alert_commute_rain');
  const hasTravelRain = rainAlerts.some((a) => a.id === 'alert_travel_rain');
  if (!hasCommuteRain || !hasTravelRain) {
    throw new Error('RAINY scenario must generate rain alerts for Commuting and Travel');
  }
  console.log('   RAINY Scenario: PASS\n');

  // 4. HIGH_UV scenario (Health, Outdoor)
  console.log('4. HIGH_UV Scenario Alerts:');
  const uvAlerts = generatePersonalizedAlerts({
    weatherData: highUv,
    userState: mockUserAll,
    dataMode: 'demo',
  });
  console.log(`   Alert count in HIGH_UV: ${uvAlerts.length}`);
  uvAlerts.forEach((a) => {
    console.log(`   - [${a.severity.toUpperCase()}] [${a.source}] ${a.title} (${a.persona || a.category})`);
  });
  const hasUvAlert = uvAlerts.some((a) => a.id === 'alert_health_uv' || a.id === 'alert_outdoor_uv');
  if (!hasUvAlert) {
    throw new Error('HIGH_UV scenario must generate UV alerts for Health/Outdoor');
  }
  console.log('   HIGH_UV Scenario: PASS\n');

  // 5. SEVERE_WEATHER scenario (Critical Safety Override at index 0)
  console.log('5. SEVERE_WEATHER Scenario Critical Safety Override:');
  const severeAlerts = generatePersonalizedAlerts({
    weatherData: severe,
    userState: { ...mockUserAll, selectedPersonas: [] }, // Even with 0 personas!
    dataMode: 'demo',
  });
  console.log(`   Top Alert in SEVERE_WEATHER (0 Personas selected):`);
  console.log(`   - Title: "${severeAlerts[0]?.title}"`);
  console.log(`   - Severity: ${severeAlerts[0]?.severity}`);
  console.log(`   - Source: "${severeAlerts[0]?.source}"`);
  console.log(`   - Explanation: "${severeAlerts[0]?.explanation}"`);
  if (severeAlerts[0]?.severity !== 'critical' || severeAlerts[0]?.source !== 'Official IMD') {
    throw new Error('Critical severe safety alert MUST be index 0, severity critical, source Official IMD');
  }
  console.log('   SEVERE_WEATHER Critical Safety Override: PASS\n');

  // 6. Ordering and Deduplication
  console.log('6. Alert Ordering and Deduplication Verification:');
  const allSevereAlerts = generatePersonalizedAlerts({
    weatherData: severe,
    userState: mockUserAll,
    dataMode: 'demo',
  });
  const ids = allSevereAlerts.map((a) => a.id);
  const uniqueIds = new Set(ids);
  if (ids.length !== uniqueIds.size) {
    throw new Error('Alert list must not contain duplicate IDs');
  }
  // Check ordering: critical (0) must precede high (1), medium (2)
  for (let i = 1; i < allSevereAlerts.length; i++) {
    const prevSev = allSevereAlerts[i - 1].severity;
    const curSev = allSevereAlerts[i].severity;
    const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    if (severityOrder[prevSev] > severityOrder[curSev]) {
      throw new Error(`Ordering violation: ${prevSev} appeared after ${curSev}`);
    }
  }
  console.log('   Ordering & Deduplication: PASS\n');

  // 7. Live IMD Unavailable Field Handling
  console.log('7. Live IMD Mode Unavailable Field Handling:');
  const liveMock: WeatherData = {
    ...normal,
    temperature: 30.4,
    humidity: 59,
    windSpeed: 2,
    rainfall: 0,
    rainProbability: 0,
    uvIndex: 0,
    visibility: 0,
    weatherCondition: 'clear',
    severity: 'normal',
  };
  const liveAlerts = generatePersonalizedAlerts({
    weatherData: liveMock,
    userState: mockUserAll,
    dataMode: 'live',
  });
  console.log(`   Live IMD Alert count under 30.4°C normal clear: ${liveAlerts.length}`);
  const hasFakeRainAlert = liveAlerts.some((a) => a.id.includes('rain'));
  const hasFakeUvAlert = liveAlerts.some((a) => a.id.includes('uv'));
  if (hasFakeRainAlert || hasFakeUvAlert) {
    throw new Error('Live IMD mode must not generate alerts for unavailable rainfall or UV metrics');
  }
  console.log('   Live IMD Unavailable Field Handling: PASS\n');

  // 8. Read / Unread State Persistence Simulation
  console.log('8. Read / Unread State Handling:');
  const readSet = new Set(['alert_health_heat']);
  const alertsWithRead = generatePersonalizedAlerts({
    weatherData: hotSunny,
    userState: mockUserAll,
    dataMode: 'demo',
    readAlertIds: readSet,
  });
  const healthAlert = alertsWithRead.find((a) => a.id === 'alert_health_heat');
  const fitnessAlert = alertsWithRead.find((a) => a.id === 'alert_fitness_heat');
  if (healthAlert?.isRead !== true || fitnessAlert?.isRead !== false) {
    throw new Error('Read/unread state must accurately reflect readAlertIds');
  }
  console.log('   Read/Unread Tracking: PASS\n');

  // 9. Ask MAUSAM Compatibility
  console.log('9. Ask MAUSAM Cross-Compatibility:');
  const askMausamSev = generateAskMausamResponse({
    query: 'Are there any alerts right now?',
    weatherData: severe,
    userState: mockUserAll,
    dataMode: 'demo',
  });
  console.log(`   Ask MAUSAM Severe Query: "${askMausamSev.text}"`);
  if (!askMausamSev.text.includes('warning') || !askMausamSev.safetyNotice) {
    throw new Error('Ask MAUSAM must report active severe weather warnings and safety notice');
  }
  console.log('   Ask MAUSAM Compatibility: PASS\n');

  console.log('=== ALL PHASE 12 VALIDATION CHECKS PASSED SUCCESSFULLY ===');
}

validatePhase12().catch((err) => {
  console.error('Validation failed:', err);
  process.exit(1);
});
