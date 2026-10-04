import { generateAskMausamResponse, detectIntent } from '../src/services/askMausamEngine';
import { getDemoWeatherScenario } from '../src/constants/demoWeather';
import type { WeatherData, AppState } from '../src/types';

async function validatePhase11() {
  console.log('=== PHASE 11: ASK MAUSAM WEATHER-AWARE ASSISTANT VALIDATION ===\n');

  const hotSunny = getDemoWeatherScenario('HOT_SUNNY').weatherData;
  const rainy = getDemoWeatherScenario('RAINY').weatherData;
  const severe = getDemoWeatherScenario('SEVERE_WEATHER').weatherData;
  const normal = getDemoWeatherScenario('NORMAL').weatherData;

  const mockUser: AppState = {
    onboardingCompleted: true,
    selectedLocation: 'Pune',
    selectedPersonas: ['fitness', 'commuting'],
    selectedPreferences: [],
  };

  // 1. Intent Detection Verification
  console.log('1. Intent Detection Suite:');
  const testQueries = [
    { q: "What's the weather today?", expected: 'current_weather' },
    { q: 'Is it very hot outside?', expected: 'temperature' },
    { q: 'Should I carry an umbrella?', expected: 'rain' },
    { q: 'How strong is the wind right now?', expected: 'wind' },
    { q: 'What is the humidity level?', expected: 'humidity' },
    { q: 'How is the visibility on roads?', expected: 'visibility' },
    { q: 'Is the UV index high?', expected: 'uv' },
    { q: 'Can I go for an outdoor run?', expected: 'fitness' },
    { q: 'Is it safe to drive on the highway?', expected: 'travel_commute' },
    { q: 'Can I spray pesticide on crops?', expected: 'agriculture' },
    { q: 'Is it good for an outdoor event?', expected: 'events' },
    { q: 'Are there any severe weather warnings?', expected: 'severe_weather' },
    { q: 'What can you do?', expected: 'help' },
    { q: 'Tell me a joke about robots', expected: 'unknown' },
  ];

  for (const item of testQueries) {
    const detected = detectIntent(item.q);
    console.log(`   - "${item.q}" -> [${detected}] (expected: ${item.expected})`);
    if (detected !== item.expected) {
      throw new Error(`Intent mismatch: expected ${item.expected}, got ${detected}`);
    }
  }
  console.log('   Intent Detection Suite: PASS (14/14 correctly classified)\n');

  // 2. Current Weather Question
  console.log('2. Current Weather Query (Demo Mode):');
  const curRes = generateAskMausamResponse({
    query: "What's the weather?",
    weatherData: normal,
    userState: mockUser,
    dataMode: 'demo',
  });
  console.log(`   Text: "${curRes.text}"`);
  console.log(`   Explainability: "${curRes.explainability}"`);
  if (!curRes.text.includes(`${normal.temperature}°C`) || !curRes.text.includes('Pune')) {
    throw new Error('Current weather response must include real temperature and location');
  }

  // 3. Temperature Question (Hot & Sunny)
  console.log('\n3. Temperature Query (HOT_SUNNY):');
  const tempRes = generateAskMausamResponse({
    query: 'Is it hot outside?',
    weatherData: hotSunny,
    userState: mockUser,
    dataMode: 'demo',
  });
  console.log(`   Text: "${tempRes.text}"`);
  if (!tempRes.text.includes('39°C') || !tempRes.text.includes('Fitness')) {
    throw new Error('Temperature response should mention 39°C and Fitness persona guidance');
  }

  // 4. Wind Question
  console.log('\n4. Wind Query (Severe Weather):');
  const windRes = generateAskMausamResponse({
    query: 'How strong is the wind?',
    weatherData: severe,
    userState: mockUser,
    dataMode: 'demo',
  });
  console.log(`   Text: "${windRes.text}"`);
  console.log(`   Safety Notice: "${windRes.safetyNotice}"`);
  if (!windRes.text.includes(`${severe.windSpeed} km/h`) || !windRes.safetyNotice) {
    throw new Error('Wind query under severe weather must report severe wind speed and safety notice');
  }

  // 5. Rain Question (Rainy Demo vs Live IMD)
  console.log('\n5. Rain Query (RAINY Demo):');
  const rainDemo = generateAskMausamResponse({
    query: 'Will it rain?',
    weatherData: rainy,
    userState: mockUser,
    dataMode: 'demo',
  });
  console.log(`   Demo Rain: "${rainDemo.text}"`);
  if (!rainDemo.text.includes(`${rainy.rainProbability}%`) || !rainDemo.text.includes('umbrella')) {
    throw new Error('Rain query in demo mode must report demo rain probability');
  }

  console.log('\n6. Rain Query (Live IMD Mode - Unavailable Handling):');
  const liveMockDry: WeatherData = {
    ...normal,
    weatherCondition: 'clear',
    rainfall: 0,
    rainProbability: 0,
  };
  const rainLive = generateAskMausamResponse({
    query: 'Will it rain?',
    weatherData: liveMockDry,
    userState: mockUser,
    dataMode: 'live',
  });
  console.log(`   Live Rain: "${rainLive.text}"`);
  if (!rainLive.text.includes('not available in the current live IMD observation')) {
    throw new Error('Live IMD rain response must honestly state that rain probability is not available');
  }

  // 7. Fitness Question (Hot vs Normal)
  console.log('\n7. Fitness Query (HOT_SUNNY vs NORMAL):');
  const fitHot = generateAskMausamResponse({
    query: 'Can I go for a run?',
    weatherData: hotSunny,
    userState: mockUser,
    dataMode: 'demo',
  });
  console.log(`   Hot Weather Fitness: "${fitHot.text}"`);
  if (!fitHot.text.includes('hazardous') && !fitHot.text.includes('morning')) {
    throw new Error('Fitness query in hot weather should advise early morning or indoor');
  }

  const fitNorm = generateAskMausamResponse({
    query: 'Can I go for a run?',
    weatherData: normal,
    userState: mockUser,
    dataMode: 'demo',
  });
  console.log(`   Normal Weather Fitness: "${fitNorm.text}"`);
  if (!fitNorm.text.includes('favorable')) {
    throw new Error('Fitness query in normal weather should indicate favorable conditions');
  }

  // 8. Commute Question (Rainy)
  console.log('\n8. Commuting Query (RAINY):');
  const commuteRes = generateAskMausamResponse({
    query: 'How are conditions for commuting?',
    weatherData: rainy,
    userState: mockUser,
    dataMode: 'demo',
  });
  console.log(`   Commute Rain: "${commuteRes.text}"`);
  if (!commuteRes.text.includes('waterlogging') && !commuteRes.text.includes('delays')) {
    throw new Error('Commute query in rainy weather should mention wet roads/waterlogging');
  }

  // 9. Severe Weather Priority Guarantee
  console.log('\n9. Severe Weather Question & Safety Override:');
  const sevRes = generateAskMausamResponse({
    query: 'Is there any severe weather warning?',
    weatherData: severe,
    userState: mockUser,
    dataMode: 'demo',
  });
  console.log(`   Severe Response: "${sevRes.text}"`);
  console.log(`   Safety Header: "${sevRes.safetyNotice}"`);
  if (!sevRes.safetyNotice?.includes('CRITICAL SAFETY OVERRIDE ACTIVE')) {
    throw new Error('Severe weather query must include critical safety override header');
  }

  // 10. Live IMD Live API End-to-End Test
  console.log('\n10. Live IMD API Connectivity Test for Ask MAUSAM:');
  const liveRes = await fetch('http://localhost:5000/api/imd/weather?city=Pune');
  const liveJson = await liveRes.json();
  if (liveJson.success && liveJson.weather) {
    const liveAsk = generateAskMausamResponse({
      query: "What's the temperature today?",
      weatherData: liveJson.weather,
      userState: mockUser,
      dataMode: 'live',
    });
    console.log(`   Live IMD Pune Temp: "${liveAsk.text}"`);
    console.log(`   Live Explainability: "${liveAsk.explainability}"`);
    if (!liveAsk.text.includes(`${liveJson.weather.temperature}°C`)) {
      throw new Error('Live Ask MAUSAM must reflect actual IMD temperature');
    }
  }

  // 11. Unknown Fallback
  console.log('\n11. Unknown Question Fallback:');
  const unkRes = generateAskMausamResponse({
    query: 'Who won the 2022 cricket match?',
    weatherData: normal,
    userState: mockUser,
    dataMode: 'demo',
  });
  console.log(`   Fallback Text: "${unkRes.text}"`);
  if (!unkRes.text.includes('I can help with')) {
    throw new Error('Unknown query must provide helpful guidance without hallucinating answers');
  }

  console.log('\n=== ALL PHASE 11 VALIDATION CHECKS PASSED SUCCESSFULLY ===');
}

validatePhase11().catch((err) => {
  console.error('Validation failed:', err);
  process.exit(1);
});
