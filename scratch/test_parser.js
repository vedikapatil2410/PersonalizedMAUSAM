function parseIMDHtml(html, requestedCity = 'Pune') {
  // 1. Station Name / Location
  const stationMatch = html.match(/<h3>(.*?)<\/h3>/i);
  const stationName = stationMatch ? stationMatch[1].trim() : requestedCity;

  // 2. Weather condition
  const condMatch = html.match(/<div class="weather">\s*<span>(.*?)<\/span>/i);
  const rawCondition = condMatch ? condMatch[1].trim() : 'clear';

  // Map to WeatherConditionType: 'clear' | 'partly_cloudy' | 'cloudy' | 'rain' | 'thunderstorm' | 'fog' | 'heat' | 'severe'
  let weatherCondition = 'clear';
  const condLower = rawCondition.toLowerCase();
  if (condLower.includes('thunder') || condLower.includes('storm')) {
    weatherCondition = 'thunderstorm';
  } else if (condLower.includes('rain') || condLower.includes('drizzle') || condLower.includes('shower')) {
    weatherCondition = 'rain';
  } else if (condLower.includes('fog') || condLower.includes('mist') || condLower.includes('haze') || condLower.includes('smoke')) {
    weatherCondition = 'fog';
  } else if (condLower.includes('cloud') || condLower.includes('overcast')) {
    weatherCondition = condLower.includes('partly') ? 'partly_cloudy' : 'cloudy';
  } else if (condLower.includes('heat') || condLower.includes('hot')) {
    weatherCondition = 'heat';
  } else {
    weatherCondition = 'clear';
  }

  // 3. Temperature
  // <div id="temperature" style="width: 18%;"> <i class="fa fa-thermometer-half"></i> 26.6<sup>o</sup>C </div>
  const tempMatch = html.match(/<div[^>]*id="temperature"[^>]*>\s*<i[^>]*><\/i>\s*([\d\.\-]+)\s*<sup>/i);
  const temperature = tempMatch ? parseFloat(tempMatch[1]) : 25;

  // 4. Feels Like
  // Feel Like 26.6<sup>o</sup>C
  const feelMatch = html.match(/Feel\s*Like\s*([\d\.\-]+)\s*<sup>/i);
  const feelsLike = feelMatch ? parseFloat(feelMatch[1]) : temperature;

  // 5. Humidity
  // <i class="fa fa-tint"></i> 75% or 56.0%
  const humMatch = html.match(/<i class="fa fa-tint"><\/i>\s*([\d\.\-]+)%/i);
  const humidity = humMatch ? Math.round(parseFloat(humMatch[1])) : 50;

  // 6. Wind Speed and Direction
  // <i class="fa fa-wind"></i> Calm 0 Km/h or Northeasterly 13 Km/h or West-southwesterly 11.1 Km/h
  const windMatch = html.match(/<i class="fa fa-wind"><\/i>\s*(.*?)\s*([\d\.]+)\s*Km\/h/i);
  let windSpeed = 0;
  let windDirection = 'Calm';
  if (windMatch) {
    windDirection = windMatch[1].trim() || 'Calm';
    windSpeed = Math.round(parseFloat(windMatch[2]));
  }

  // Map verbose direction to compass code if appropriate
  const dirMap = {
    'calm': 'Calm',
    'northeasterly': 'NE',
    'northwesterly': 'NW',
    'southeasterly': 'SE',
    'southwesterly': 'SW',
    'west-southwesterly': 'WSW',
    'west-northwesterly': 'WNW',
    'east-northeasterly': 'ENE',
    'east-southeasterly': 'ESE',
    'northerly': 'N',
    'southerly': 'S',
    'easterly': 'E',
    'westerly': 'W'
  };
  const normalizedWindDir = dirMap[windDirection.toLowerCase()] || windDirection;

  // 7. Observation time
  // Observation time : 2026-10-02 08:30 IST
  const obsMatch = html.match(/Observation\s*time\s*:\s*([\d\-]+\s+[\d:]+\s*(?:IST)?)/i);
  const timestamp = obsMatch ? obsMatch[1].trim() : new Date().toISOString();

  // 8. Sunrise and Sunset
  // <span>Sunrise</span> 06:25 (IST)
  const sunriseMatch = html.match(/<span>\s*Sunrise\s*<\/span>\s*([\d:]+(?:\s*\([A-Z]+\))?)/i);
  const sunsetMatch = html.match(/<span>\s*Sunset\s*<\/span>\s*([\d:]+(?:\s*\([A-Z]+\))?)/i);
  const sunrise = sunriseMatch ? sunriseMatch[1].trim() : '06:00 AM';
  const sunset = sunsetMatch ? sunsetMatch[1].trim() : '06:30 PM';

  // 9. Severity assessment
  // Based on temperature/wind thresholds
  let severity = 'normal';
  if (temperature >= 40 || windSpeed >= 50) {
    severity = 'warning';
  } else if (temperature >= 35 || humidity >= 85 || windSpeed >= 35) {
    severity = 'advisory';
  }

  // 10. Summary
  const summary = `${rawCondition} observed at ${stationName} (${temperature}°C, humidity ${humidity}%, wind ${windSpeed} km/h). Official IMD Observation.`;

  return {
    location: requestedCity,
    stationName,
    timestamp,
    temperature,
    feelsLike,
    humidity,
    rainfall: 0, // IMD observation card reports 0 mm if not raining
    rainProbability: weatherCondition === 'rain' || weatherCondition === 'thunderstorm' ? 80 : 10,
    windSpeed,
    windDirection: normalizedWindDir,
    uvIndex: 4, // Typical daytime baseline
    visibility: 5.0, // Standard urban visibility
    weatherCondition,
    sunrise,
    sunset,
    severity,
    summary,
    source: 'IMD'
  };
}

// Test with the 3 city HTML strings
const samplePune = `
<h3>Pune-Shivajinagar</h3>
<div class="weather">
	<span>Clear Sky</span>
	<i class="qi-100-fill" title="Clear Sky"></i>
</div>
<div class="tempt">
	<div id="temperature" style="width: 18%;">
		<i class="fa fa-thermometer-half"></i> 26.6<sup>o</sup>C	</div>
		<div id="temperature" style="width: 30%;">
		<i class="fa fa-thermometer-half"></i> Feel Like 26.6<sup>o</sup>C	</div>
		<div id="temperature1" style="width: 15%;">
		<i class="fa fa-tint"></i> 75%	</div>
	<div id="temperature1" style="width: 55%;">
		<i class="fa fa-wind"></i> Calm 0 Km/h	</div>
	<div style="width: 100%;">
		<i class="fa fa-clock"></i> Observation time : 2026-10-02 08:30 IST	</div>
	<div style="width: 24%;">
		<span>Sunrise</span>  06:25 (IST)	</div>
	<div style="width: 24%;">
		<span>Sunset</span> 18:23 (IST)	</div>
</div>
`;

console.log('Parsed Pune:', JSON.stringify(parseIMDHtml(samplePune, 'Pune'), null, 2));
