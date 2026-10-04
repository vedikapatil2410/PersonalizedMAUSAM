import { generatePersonalizedRecommendations } from '../src/services/personalizationEngine';
import { decideRecommendations } from '../src/services/decisionEngine';
import { applySafetyOverride } from '../src/services/safetyOverrideEngine';
import { getDemoWeatherScenario, DEMO_SCENARIO_LIST } from '../src/constants/demoWeather';
import type { WeatherData, AppState, UserPersonaType } from '../src/types';

function runPipeline(userState: AppState, weatherData: WeatherData) {
  const raw = generatePersonalizedRecommendations({ userState, weatherData });
  const decided = decideRecommendations(raw);
  const finalRecs = applySafetyOverride(decided, raw, weatherData);
  return { raw, decided, finalRecs };
}

async function validatePhase10() {
  console.log('=== PHASE 10: MULTI-PERSONA PERSONALIZATION VALIDATION ===\n');

  const hotSunnyWeather = getDemoWeatherScenario('HOT_SUNNY').weatherData;
  const rainyWeather = getDemoWeatherScenario('RAINY').weatherData;
  const highUvWeather = getDemoWeatherScenario('HIGH_UV').weatherData;
  const severeWeather = getDemoWeatherScenario('SEVERE_WEATHER').weatherData;
  const normalWeather = getDemoWeatherScenario('NORMAL').weatherData;

  // 1. Health persona validation in Hot & Sunny
  const healthUser: AppState = {
    onboardingCompleted: true,
    selectedLocation: 'Pune',
    selectedPersonas: ['health'],
    selectedPreferences: [],
  };
  const healthHot = runPipeline(healthUser, hotSunnyWeather);
  console.log('1. Health Persona in HOT_SUNNY:');
  console.log(`   Rec count: ${healthHot.finalRecs.length}, Top: "${healthHot.finalRecs[0]?.title}"`);
  console.log(`   Why this: "${healthHot.finalRecs[0]?.explanation}"`);
  if (!healthHot.finalRecs[0]?.title.includes('Heat') && !healthHot.finalRecs[0]?.title.includes('Thermal')) {
    throw new Error('Health persona should receive Heat/Thermal advisory in HOT_SUNNY');
  }

  // 2. Fitness persona validation in Hot & Sunny vs Rainy
  const fitnessUser: AppState = {
    onboardingCompleted: true,
    selectedLocation: 'Pune',
    selectedPersonas: ['fitness'],
    selectedPreferences: [],
  };
  const fitnessHot = runPipeline(fitnessUser, hotSunnyWeather);
  console.log('\n2. Fitness Persona in HOT_SUNNY:');
  console.log(`   Rec count: ${fitnessHot.finalRecs.length}, Top: "${fitnessHot.finalRecs[0]?.title}"`);
  console.log(`   Why this: "${fitnessHot.finalRecs[0]?.explanation}"`);
  if (!fitnessHot.finalRecs[0]?.title.includes('Workout') && !fitnessHot.finalRecs[0]?.title.includes('Thermal')) {
    throw new Error('Fitness persona should receive workout rescheduling advisory in HOT_SUNNY');
  }

  const fitnessRainy = runPipeline(fitnessUser, rainyWeather);
  console.log('   Fitness Persona in RAINY:');
  console.log(`   Rec count: ${fitnessRainy.finalRecs.length}, Top: "${fitnessRainy.finalRecs[0]?.title}"`);
  console.log(`   Why this: "${fitnessRainy.finalRecs[0]?.explanation}"`);
  if (!fitnessRainy.finalRecs[0]?.title.includes('Pavement') && !fitnessRainy.finalRecs[0]?.title.includes('Slip')) {
    throw new Error('Fitness persona should receive wet pavement advisory in RAINY');
  }

  // 3. Travel persona validation in Rainy vs Fog
  const travelUser: AppState = {
    onboardingCompleted: true,
    selectedLocation: 'Pune',
    selectedPersonas: ['travel'],
    selectedPreferences: [],
  };
  const travelRainy = runPipeline(travelUser, rainyWeather);
  console.log('\n3. Travel Persona in RAINY:');
  console.log(`   Rec count: ${travelRainy.finalRecs.length}, Top: "${travelRainy.finalRecs[0]?.title}"`);
  console.log(`   Why this: "${travelRainy.finalRecs[0]?.explanation}"`);
  if (!travelRainy.finalRecs[0]?.title.includes('Highway') && !travelRainy.finalRecs[0]?.title.includes('Travel')) {
    throw new Error('Travel persona should receive highway travel advisory in RAINY');
  }

  // 4. Commuting persona validation in Rainy
  const commuterUser: AppState = {
    onboardingCompleted: true,
    selectedLocation: 'Pune',
    selectedPersonas: ['commuting'],
    selectedPreferences: [],
  };
  const commuterRainy = runPipeline(commuterUser, rainyWeather);
  console.log('\n4. Commuting Persona in RAINY:');
  console.log(`   Rec count: ${commuterRainy.finalRecs.length}, Top: "${commuterRainy.finalRecs[0]?.title}"`);
  console.log(`   Why this: "${commuterRainy.finalRecs[0]?.explanation}"`);
  if (!commuterRainy.finalRecs[0]?.title.includes('Waterlogged') && !commuterRainy.finalRecs[0]?.title.includes('Roads')) {
    throw new Error('Commuting persona should receive waterlogged/transit delay advisory in RAINY');
  }

  // 5. Events persona validation in Rainy vs High UV
  const eventsUser: AppState = {
    onboardingCompleted: true,
    selectedLocation: 'Pune',
    selectedPersonas: ['events'],
    selectedPreferences: [],
  };
  const eventsRainy = runPipeline(eventsUser, rainyWeather);
  console.log('\n5. Events Persona in RAINY:');
  console.log(`   Rec count: ${eventsRainy.finalRecs.length}, Top: "${eventsRainy.finalRecs[0]?.title}"`);
  console.log(`   Why this: "${eventsRainy.finalRecs[0]?.explanation}"`);
  if (!eventsRainy.finalRecs[0]?.title.includes('Event') && !eventsRainy.finalRecs[0]?.title.includes('Waterproofing')) {
    throw new Error('Events persona should receive event waterproofing advisory in RAINY');
  }

  // 6. Agriculture persona validation in Hot & Sunny
  const agriUser: AppState = {
    onboardingCompleted: true,
    selectedLocation: 'Pune',
    selectedPersonas: ['agriculture'],
    selectedPreferences: [],
  };
  const agriHot = runPipeline(agriUser, hotSunnyWeather);
  console.log('\n6. Agriculture Persona in HOT_SUNNY:');
  console.log(`   Rec count: ${agriHot.finalRecs.length}, Top: "${agriHot.finalRecs[0]?.title}"`);
  console.log(`   Why this: "${agriHot.finalRecs[0]?.explanation}"`);
  if (!agriHot.finalRecs[0]?.title.includes('Crop') && !agriHot.finalRecs[0]?.title.includes('Irrigation')) {
    throw new Error('Agriculture persona should receive crop thermal/irrigation advisory in HOT_SUNNY');
  }

  // 7. Beach & Outdoor persona validation in High UV
  const outdoorUser: AppState = {
    onboardingCompleted: true,
    selectedLocation: 'Pune',
    selectedPersonas: ['outdoor'],
    selectedPreferences: [],
  };
  const outdoorUv = runPipeline(outdoorUser, highUvWeather);
  console.log('\n7. Beach & Outdoor Persona in HIGH_UV:');
  console.log(`   Rec count: ${outdoorUv.finalRecs.length}, Top: "${outdoorUv.finalRecs[0]?.title}"`);
  console.log(`   Why this: "${outdoorUv.finalRecs[0]?.explanation}"`);
  if (!outdoorUv.finalRecs[0]?.title.includes('UV') && !outdoorUv.finalRecs[0]?.title.includes('Solar')) {
    throw new Error('Beach & Outdoor persona should receive UV/solar protection advisory in HIGH_UV');
  }

  // 8. Family persona validation in Hot & Sunny
  const familyUser: AppState = {
    onboardingCompleted: true,
    selectedLocation: 'Pune',
    selectedPersonas: ['family'],
    selectedPreferences: [],
  };
  const familyHot = runPipeline(familyUser, hotSunnyWeather);
  console.log('\n8. Family Persona in HOT_SUNNY:');
  console.log(`   Rec count: ${familyHot.finalRecs.length}, Top: "${familyHot.finalRecs[0]?.title}"`);
  console.log(`   Why this: "${familyHot.finalRecs[0]?.explanation}"`);
  if (!familyHot.finalRecs[0]?.title.includes('Child') && !familyHot.finalRecs[0]?.title.includes('Family')) {
    throw new Error('Family persona should receive child/dependent heat advisory in HOT_SUNNY');
  }

  // 9. Persona Differentiation: Verify DIFFERENT personas in the SAME weather get DIFFERENT recommendations
  console.log('\n9. Cross-Persona Differentiation in HOT_SUNNY:');
  const allPersonas: UserPersonaType[] = [
    'health',
    'fitness',
    'travel',
    'agriculture',
    'commuting',
    'family',
    'outdoor',
    'events',
  ];
  const titlesSeen = new Set<string>();
  for (const p of allPersonas) {
    const res = runPipeline({ ...healthUser, selectedPersonas: [p] }, hotSunnyWeather);
    const topTitle = res.finalRecs[0]?.title;
    console.log(`   - Persona [${p.toUpperCase()}]: "${topTitle}"`);
    titlesSeen.add(topTitle);
  }
  console.log(`   Unique recommendation titles across 8 personas in same weather: ${titlesSeen.size}/8`);
  if (titlesSeen.size < 6) {
    throw new Error('Personas must produce clearly differentiated recommendations in the same weather condition');
  }

  // 10. SEVERE_WEATHER: Critical safety override must remain first for ALL personas
  console.log('\n10. SEVERE_WEATHER Critical Safety Override Guarantee:');
  for (const p of allPersonas) {
    const res = runPipeline({ ...healthUser, selectedPersonas: [p] }, severeWeather);
    if (res.finalRecs[0]?.priority !== 'critical' || res.finalRecs[0]?.id !== 'critical_severe_weather') {
      throw new Error(`Critical safety override failed at index 0 for persona ${p}`);
    }
  }
  console.log('   All 8 personas strictly retain Critical Safety Alert at index 0 in SEVERE_WEATHER: PASS');

  // 11. Live IMD Mode Integration Test
  console.log('\n11. Live IMD Integration with Multi-Persona Personalization:');
  const liveRes = await fetch('http://localhost:5000/api/imd/weather?city=Pune');
  const liveJson = await liveRes.json();
  if (liveJson.success && liveJson.weather) {
    const liveRecs = runPipeline(healthUser, liveJson.weather);
    console.log(`   Fetched live IMD Pune (${liveJson.weather.temperature}°C, ${liveJson.weather.weatherCondition})`);
    console.log(`   Live pipeline execution: PASS (${liveRecs.finalRecs.length} recommendations generated)`);
  } else {
    throw new Error('Live IMD weather fetch failed');
  }

  console.log('\n=== ALL PHASE 10 MULTI-PERSONA VALIDATION CHECKS PASSED ===');
}

validatePhase10().catch((err) => {
  console.error('Validation failed:', err);
  process.exit(1);
});
