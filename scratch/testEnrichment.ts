import { generateDataTransparencySummary } from '../src/services/dataTransparencyEngine';
import type { WeatherData } from '../src/types';

async function runTests() {
  console.log('=== TEST 1: Backend Health Check ===');
  const healthRes = await fetch('http://localhost:5000/health');
  const health = await healthRes.json();
  console.log('Health status:', health.status);
  console.log('Enrichment:', health.enrichment);
  if (health.status !== 'ok') throw new Error('Health check failed');

  console.log('\n=== TEST 2: Live IMD Weather with Open-Meteo Enrichment ===');
  const weatherRes = await fetch('http://localhost:5000/api/imd/weather?city=Pune');
  const weatherPayload = await weatherRes.json();
  console.log('Success:', weatherPayload.success);
  console.log('City:', weatherPayload.city);
  console.log('Station:', weatherPayload.weather.stationName);
  console.log('Temperature (IMD):', weatherPayload.weather.temperature);
  console.log('UV Index (Open-Meteo):', weatherPayload.weather.uvIndex);
  console.log('Visibility (Open-Meteo):', weatherPayload.weather.visibility, 'km');
  console.log('External Data Open-Meteo Source:', weatherPayload.externalData?.openMeteo?.data?.source);
  console.log('Pollen Status:', weatherPayload.externalData?.pollen?.available, weatherPayload.externalData?.pollen?.error);

  if (typeof weatherPayload.weather.uvIndex !== 'number' || weatherPayload.weather.uvIndex < 0) {
    throw new Error('UV Index invalid');
  }
  if (typeof weatherPayload.weather.visibility !== 'number' || weatherPayload.weather.visibility <= 0) {
    throw new Error('Visibility invalid');
  }

  console.log('\n=== TEST 3: Standalone External Weather Endpoint ===');
  const extRes = await fetch('http://localhost:5000/api/external/weather?city=Pune');
  const extData = await extRes.json();
  console.log('External Weather Success:', extData.success);
  console.log('Open-Meteo Available:', extData.data?.openMeteo?.available);
  if (!extData.data?.openMeteo?.available) throw new Error('External endpoint failed');

  console.log('\n=== TEST 4: Standalone Pollen Endpoint (Key absent check) ===');
  const polRes = await fetch('http://localhost:5000/api/pollen/forecast?city=Pune');
  const polData = await polRes.json();
  console.log('Pollen Available:', polData.pollen?.available);
  console.log('Pollen Message/Error:', polData.pollen?.error);
  if (polData.pollen?.available !== false) throw new Error('Pollen should report false when key not configured');

  console.log('\n=== TEST 5: Data Transparency Attribution ===');
  const mockWeatherData: WeatherData = {
    location: 'Pune',
    timestamp: new Date().toISOString(),
    temperature: 31,
    feelsLike: 32,
    humidity: 45,
    rainfall: 0,
    rainProbability: 0,
    windSpeed: 10,
    windDirection: 'NE',
    uvIndex: 4.5,
    visibility: 10,
    weatherCondition: 'clear',
    sunrise: '06:20',
    sunset: '18:15',
    severity: 'normal',
    summary: 'Clear conditions',
    externalData: {
      openMeteo: {
        available: true,
        data: {
          uvIndex: 4.5,
          visibilityKm: 10,
          rawVisibilityMeters: 10000,
          timestamp: new Date().toISOString(),
          source: 'Open-Meteo API',
        },
      },
      pollen: {
        available: false,
        data: null,
        error: 'GOOGLE_POLLEN_API_KEY is not configured on backend environment',
      },
    },
  };

  const summary = generateDataTransparencySummary({
    weatherData: mockWeatherData,
    dataMode: 'live',
    selectedLocation: 'Pune',
    selectedActivities: ['running', 'cycling'],
  });

  console.log('Source Name:', summary.sourceName);
  const uvField = summary.availableFields.find((f) => f.label === 'Solar UV Index');
  const visField = summary.availableFields.find((f) => f.label === 'Atmospheric Visibility');
  const pollenField = summary.unavailableFields.find((f) => f.label === 'Pollen Index & Allergens');
  const tempField = summary.availableFields.find((f) => f.label === 'Temperature');

  console.log('Temperature Source:', tempField?.source);
  console.log('UV Source:', uvField?.source);
  console.log('Visibility Source:', visField?.source);
  console.log('Pollen Source & Reason:', pollenField?.source, '|', pollenField?.reason);

  if (tempField?.source !== 'live_imd') throw new Error('Temperature should be attributed to live_imd');
  if (uvField?.source !== 'open_meteo') throw new Error('UV should be attributed to open_meteo');
  if (visField?.source !== 'open_meteo') throw new Error('Visibility should be attributed to open_meteo');
  if (pollenField?.source !== 'google_pollen') throw new Error('Pollen should be attributed to google_pollen');

  console.log('\n>>> ALL 5 VERIFICATION SUITES PASSED CLEANLY! <<<');
}

runTests().catch((err) => {
  console.error('Test Suite Failed:', err);
  process.exit(1);
});
