import { CONFIG } from '../config';

export interface IMDWeatherData {
  location: string;
  stationName: string;
  stationId: string;
  timestamp: string;
  temperature: number;
  feelsLike: number;
  humidity: number;
  rainfall: number;
  rainProbability: number;
  windSpeed: number;
  windDirection: string;
  uvIndex: number;
  visibility: number;
  weatherCondition: 'clear' | 'partly_cloudy' | 'cloudy' | 'rain' | 'thunderstorm' | 'fog' | 'heat' | 'severe';
  sunrise: string;
  sunset: string;
  severity: 'normal' | 'advisory' | 'warning' | 'severe';
  summary: string;
  source: 'Official IMD Observation';
  unavailableFields: string[];
}

/**
 * Normalizes verbose wind direction string from IMD into standard compass abbreviation.
 */
function normalizeWindDirection(rawDir: string): string {
  const dirMap: Record<string, string> = {
    calm: 'Calm',
    northeasterly: 'NE',
    northwesterly: 'NW',
    southeasterly: 'SE',
    southwesterly: 'SW',
    'west-southwesterly': 'WSW',
    'west-northwesterly': 'WNW',
    'east-northeasterly': 'ENE',
    'east-southeasterly': 'ESE',
    northerly: 'N',
    southerly: 'S',
    easterly: 'E',
    westerly: 'W',
  };
  return dirMap[rawDir.toLowerCase()] || rawDir;
}

/**
 * Maps raw IMD condition text into domain WeatherConditionType.
 */
function mapWeatherCondition(
  rawCondition: string
): 'clear' | 'partly_cloudy' | 'cloudy' | 'rain' | 'thunderstorm' | 'fog' | 'heat' | 'severe' {
  const c = rawCondition.toLowerCase();
  if (c.includes('severe') || c.includes('cyclon') || c.includes('squall') || c.includes('gale')) {
    return 'severe';
  }
  if (c.includes('thunder') || c.includes('storm')) {
    return 'thunderstorm';
  }
  if (c.includes('rain') || c.includes('drizzle') || c.includes('shower')) {
    return 'rain';
  }
  if (c.includes('fog') || c.includes('mist') || c.includes('haze') || c.includes('smoke')) {
    return 'fog';
  }
  if (c.includes('heat') || c.includes('hot')) {
    return 'heat';
  }
  if (c.includes('cloud') || c.includes('overcast')) {
    return c.includes('partly') ? 'partly_cloudy' : 'cloudy';
  }
  return 'clear';
}

/**
 * Parses official IMD observation HTML into typed IMDWeatherData.
 */
export function parseIMDResponse(html: string, requestedCity: string, stationId: string): IMDWeatherData {
  // 1. Station Name
  const stationMatch = html.match(/<h3>(.*?)<\/h3>/i);
  const stationName = stationMatch ? stationMatch[1].trim() : `${requestedCity} Station`;

  // 2. Weather condition
  const condMatch = html.match(/<div class="weather">\s*<span>(.*?)<\/span>/i);
  const rawCondition = condMatch ? condMatch[1].trim() : 'Clear Sky';
  const weatherCondition = mapWeatherCondition(rawCondition);

  // 3. Temperature
  const tempMatch = html.match(/<div[^>]*id="temperature"[^>]*>\s*<i[^>]*><\/i>\s*([\d\.\-]+)\s*<sup>/i);
  const temperature = tempMatch ? parseFloat(tempMatch[1]) : 25.0;

  // 4. Feels like
  const feelMatch = html.match(/Feel\s*Like\s*([\d\.\-]+)\s*<sup>/i);
  const feelsLike = feelMatch ? parseFloat(feelMatch[1]) : temperature;

  // 5. Humidity
  const humMatch = html.match(/<i class="fa fa-tint"><\/i>\s*([\d\.\-]+)%/i);
  const humidity = humMatch ? Math.round(parseFloat(humMatch[1])) : 50;

  // 6. Wind speed & direction
  const windMatch = html.match(/<i class="fa fa-wind"><\/i>\s*(.*?)\s*([\d\.]+)\s*Km\/h/i);
  let windSpeed = 0;
  let windDirection = 'Calm';
  if (windMatch) {
    windDirection = normalizeWindDirection(windMatch[1].trim() || 'Calm');
    windSpeed = Math.round(parseFloat(windMatch[2]));
  }

  // 7. Timestamp
  const obsMatch = html.match(/Observation\s*time\s*:\s*([\d\-]+\s+[\d:]+\s*(?:IST)?)/i);
  const timestamp = obsMatch ? obsMatch[1].trim() : new Date().toISOString();

  // 8. Sunrise and Sunset
  const sunriseMatch = html.match(/<span>\s*Sunrise\s*<\/span>\s*([\d:]+(?:\s*\([A-Z]+\))?)/i);
  const sunsetMatch = html.match(/<span>\s*Sunset\s*<\/span>\s*([\d:]+(?:\s*\([A-Z]+\))?)/i);
  const sunrise = sunriseMatch ? sunriseMatch[1].trim() : '06:00 (IST)';
  const sunset = sunsetMatch ? sunsetMatch[1].trim() : '18:30 (IST)';

  // 9. Severity assessment based on confirmed observations
  let severity: 'normal' | 'advisory' | 'warning' | 'severe' = 'normal';
  if (weatherCondition === 'severe' || windSpeed >= 50 || temperature >= 42) {
    severity = 'severe';
  } else if (weatherCondition === 'thunderstorm' || windSpeed >= 40 || temperature >= 39) {
    severity = 'warning';
  } else if (temperature >= 35 || humidity >= 85 || windSpeed >= 25 || weatherCondition === 'fog') {
    severity = 'advisory';
  }

  // 10. Summary description
  const summary = `${rawCondition} observed at ${stationName} (${temperature}°C, humidity ${humidity}%, wind ${windSpeed} km/h). Official IMD observation.`;

  return {
    location: requestedCity,
    stationName,
    stationId,
    timestamp,
    temperature,
    feelsLike,
    humidity,
    rainfall: 0, // Not provided in real-time city snippet if dry
    rainProbability: 0, // Forecast metric, unavailable in instantaneous observation
    windSpeed,
    windDirection,
    uvIndex: 0, // Radiometer metric, unavailable in standard city card
    visibility: 0, // Transmissometer metric, unavailable in standard city card
    weatherCondition,
    sunrise,
    sunset,
    severity,
    summary,
    source: 'Official IMD Observation',
    unavailableFields: ['rainfall', 'rainProbability', 'uvIndex', 'visibility'],
  };
}

/**
 * Dedicated backend service to fetch real-time weather observation from IMD.
 */
export async function getLiveIMDWeather(city: string = 'Pune'): Promise<IMDWeatherData> {
  const normalizedCity = city === 'Choose Later' ? CONFIG.defaultCity : (city || CONFIG.defaultCity);
  const station = CONFIG.stationMapping[normalizedCity] || CONFIG.stationMapping[CONFIG.defaultCity];

  const targetUrl = `${CONFIG.imdBaseUrl}${CONFIG.imdEndpoint}?id=${station.id}`;

  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Referer': `${CONFIG.imdBaseUrl}/`,
    'Origin': CONFIG.imdBaseUrl,
    'Accept': '*/*',
  };

  const response = await fetch(targetUrl, {
    method: 'GET',
    headers,
    signal: AbortSignal.timeout(8000), // 8s timeout
  });

  if (!response.ok) {
    throw new Error(`IMD endpoint responded with HTTP ${response.status}`);
  }

  const html = await response.text();
  if (!html || !html.includes('<h3>')) {
    throw new Error('Received unexpected or empty response payload from IMD portal');
  }

  return parseIMDResponse(html, normalizedCity, station.id);
}
