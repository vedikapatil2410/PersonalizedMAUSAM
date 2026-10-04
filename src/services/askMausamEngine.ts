import type { AppState, WeatherData, WeatherDataMode, UserPersonaType } from '../types';
import type { AskMausamIntent, AskMausamMessage } from '../types/askMausam';
import { PERSONA_CATALOG } from '../constants/personas';

interface AskMausamInput {
  query: string;
  weatherData: WeatherData;
  userState: AppState;
  dataMode: WeatherDataMode;
}

/**
 * Helper to get readable persona titles.
 */
function getPersonaNames(personas: UserPersonaType[]): string {
  if (!personas || personas.length === 0) return 'General User';
  return personas
    .map((p) => {
      if (p === 'outdoor') return 'Beach & Outdoor';
      const match = PERSONA_CATALOG.find((item) => item.id === p);
      return match ? match.title : p;
    })
    .join(', ');
}

/**
 * Deterministic, rule-based intent detector for weather queries.
 */
export function detectIntent(rawQuery: string): AskMausamIntent {
  const q = rawQuery.toLowerCase().trim();

  // 1. Severe Weather / Alerts
  if (
    q.includes('severe') ||
    q.includes('warning') ||
    q.includes('danger') ||
    q.includes('cyclone') ||
    q.includes('storm') ||
    q.includes('emergency') ||
    q.includes('alert') ||
    q.includes('safe outside')
  ) {
    return 'severe_weather';
  }

  // 2. Rain & Precipitation
  if (
    q.includes('rain') ||
    q.includes('umbrella') ||
    q.includes('drizzle') ||
    q.includes('shower') ||
    q.includes('precipitation') ||
    q.includes('wet') ||
    q.includes('monsoon')
  ) {
    return 'rain';
  }

  // 3. Temperature & Thermal Comfort
  if (
    q.includes('temp') ||
    q.includes('hot') ||
    q.includes('cold') ||
    q.includes('warm') ||
    q.includes('heat') ||
    q.includes('degree') ||
    q.includes('feels like') ||
    q.includes('chilly')
  ) {
    return 'temperature';
  }

  // 4. Wind & Gusts
  if (
    q.includes('wind') ||
    q.includes('windy') ||
    q.includes('breeze') ||
    q.includes('gust') ||
    q.includes('gale') ||
    q.includes('air speed')
  ) {
    return 'wind';
  }

  // 5. Humidity & Moisture
  if (
    q.includes('humid') ||
    q.includes('humidity') ||
    q.includes('moisture') ||
    q.includes('muggy') ||
    q.includes('sweat') ||
    q.includes('dew')
  ) {
    return 'humidity';
  }

  // 6. Visibility & Fog
  if (
    q.includes('visibility') ||
    q.includes('fog') ||
    q.includes('foggy') ||
    q.includes('smog') ||
    q.includes('mist') ||
    q.includes('haze') ||
    q.includes('sight')
  ) {
    return 'visibility';
  }

  // 7. UV & Solar Radiation
  if (
    q.includes('uv') ||
    q.includes('sunburn') ||
    q.includes('sunscreen') ||
    q.includes('radiation') ||
    q.includes('sun exposure') ||
    q.includes('sunny')
  ) {
    return 'uv';
  }

  // 8. Fitness & Workouts
  if (
    q.includes('run') ||
    q.includes('running') ||
    q.includes('jog') ||
    q.includes('jogging') ||
    q.includes('workout') ||
    q.includes('exercise') ||
    q.includes('cycling') ||
    q.includes('gym') ||
    q.includes('cardio') ||
    q.includes('walk') ||
    q.includes('sports')
  ) {
    return 'fitness';
  }

  // 9. Travel & Commuting
  if (
    q.includes('travel') ||
    q.includes('commute') ||
    q.includes('commuting') ||
    q.includes('traffic') ||
    q.includes('drive') ||
    q.includes('driving') ||
    q.includes('highway') ||
    q.includes('road') ||
    q.includes('flyover') ||
    q.includes('train') ||
    q.includes('flight') ||
    q.includes('transit') ||
    q.includes('bus')
  ) {
    return 'travel_commute';
  }

  // 10. Agriculture & Farming
  if (
    q.includes('crop') ||
    q.includes('farm') ||
    q.includes('farming') ||
    q.includes('agriculture') ||
    q.includes('spray') ||
    q.includes('spraying') ||
    q.includes('harvest') ||
    q.includes('pesticide') ||
    q.includes('irrigation') ||
    q.includes('field')
  ) {
    return 'agriculture';
  }

  // 11. Events & Staging
  if (
    q.includes('event') ||
    q.includes('party') ||
    q.includes('wedding') ||
    q.includes('stage') ||
    q.includes('tent') ||
    q.includes('canopy') ||
    q.includes('celebration') ||
    q.includes('gathering')
  ) {
    return 'events';
  }

  // 12. Family & Dependents
  if (
    q.includes('child') ||
    q.includes('kid') ||
    q.includes('baby') ||
    q.includes('family') ||
    q.includes('senior') ||
    q.includes('elderly') ||
    q.includes('school') ||
    q.includes('park')
  ) {
    return 'family';
  }

  // 13. General / Current Weather
  if (
    q.includes('weather') ||
    q.includes('today') ||
    q.includes('now') ||
    q.includes('condition') ||
    q.includes('forecast') ||
    q.includes('how is it') ||
    q.includes('overview') ||
    q.includes('mausam')
  ) {
    return 'current_weather';
  }

  // 14. Help
  if (
    q.includes('help') ||
    q.includes('what can you do') ||
    q.includes('options') ||
    q.includes('menu') ||
    q.includes('command')
  ) {
    return 'help';
  }

  return 'unknown';
}

/**
 * Generates an explainable, transparent, rule-based response for Ask MAUSAM queries.
 */
export function generateAskMausamResponse({
  query,
  weatherData,
  userState,
  dataMode,
}: AskMausamInput): AskMausamMessage {
  const intent = detectIntent(query);
  const location = userState.selectedLocation === 'Choose Later' ? 'your location' : (userState.selectedLocation || weatherData.location);
  const personas = userState.selectedPersonas || [];
  const personaNames = getPersonaNames(personas);
  const isSevere = weatherData.severity === 'severe';

  const safetyNotice = isSevere
    ? '🚨 CRITICAL SAFETY OVERRIDE ACTIVE: Severe hazardous weather conditions are in effect. Follow civil defense instructions and postpone outdoor activities.'
    : undefined;

  let text = '';
  let explainability = '';

  switch (intent) {
    case 'severe_weather': {
      if (isSevere) {
        text = `Severe weather warning is ACTIVE for ${location}. Wind speed is ${weatherData.windSpeed} km/h (${weatherData.windDirection}) with ${weatherData.weatherCondition.replace('_', ' ')} conditions. Remain indoors and secure outdoor fixtures.`;
        explainability = `Safety Override triggered because district severity level is ${weatherData.severity.toUpperCase()}.`;
      } else if (weatherData.severity === 'warning') {
        text = `Weather warning is active for ${location} (${weatherData.summary}). Exercise caution for outdoor exposure.`;
        explainability = `Derived from warning severity state (${weatherData.severity}).`;
      } else {
        text = `No severe weather warnings are active for ${location}. Current conditions are ${weatherData.severity} (${weatherData.weatherCondition.replace('_', ' ')}, ${weatherData.temperature}°C).`;
        explainability = `Current meteorological severity is rated as ${weatherData.severity}.`;
      }
      break;
    }

    case 'current_weather': {
      if (dataMode === 'live') {
        text = `Official IMD observation for ${location}: ${weatherData.temperature}°C (Feels like ${weatherData.feelsLike}°C), ${weatherData.weatherCondition.replace('_', ' ')}. Humidity: ${weatherData.humidity}%, Wind: ${weatherData.windSpeed} km/h ${weatherData.windDirection}. Sunrise: ${weatherData.sunrise}, Sunset: ${weatherData.sunset}.`;
        explainability = `Retrieved from live IMD station observation. Tailored for ${personaNames}.`;
      } else {
        text = `Simulated weather for ${location}: ${weatherData.temperature}°C (Feels like ${weatherData.feelsLike}°C), ${weatherData.weatherCondition.replace('_', ' ')}. Humidity: ${weatherData.humidity}%, Wind: ${weatherData.windSpeed} km/h ${weatherData.windDirection}, Rain Chance: ${weatherData.rainProbability}%, UV Index: ${weatherData.uvIndex}.`;
        explainability = `Simulated prototype demo scenario. Tailored for ${personaNames}.`;
      }
      break;
    }

    case 'temperature': {
      const isHot = weatherData.temperature >= 35 || weatherData.feelsLike >= 38;
      const isCool = weatherData.temperature < 20;
      let thermalTag = 'comfortable and moderate';
      if (weatherData.temperature >= 40) thermalTag = 'intensely hot (heatwave conditions)';
      else if (isHot) thermalTag = 'hot and elevated';
      else if (isCool) thermalTag = 'cool';

      text = `The current temperature in ${location} is ${weatherData.temperature}°C (Feels like ${weatherData.feelsLike}°C), which is ${thermalTag}.`;

      if (personas.includes('health') && isHot) {
        text += ' For your Health focus: Drink plenty of water and avoid direct midday sun.';
      } else if (personas.includes('fitness') && isHot) {
        text += ' For your Fitness routine: Reschedule strenuous outdoor workouts to early morning.';
      } else if (personas.includes('agriculture') && isHot) {
        text += ' For Agriculture: Increase irrigation frequency and shade livestock.';
      }

      explainability = `Calculated from ambient temperature (${weatherData.temperature}°C) and apparent heat index (${weatherData.feelsLike}°C).`;
      break;
    }

    case 'rain': {
      if (dataMode === 'live') {
        if (weatherData.weatherCondition === 'rain' || weatherData.weatherCondition === 'thunderstorm') {
          text = `Current IMD observation reports active ${weatherData.weatherCondition.replace('_', ' ')} in ${location}. Carrying an umbrella or waterproof gear is strongly recommended. Note: Quantitative rain probability percentage is not provided in the live IMD observation snippet.`;
        } else {
          text = `Current IMD observation reports ${weatherData.weatherCondition.replace('_', ' ')} with no active precipitation observed at the station. Note: Rain probability percentage is not available in the current live IMD observation card.`;
        }
        explainability = `Based on live IMD weather condition '${weatherData.weatherCondition}'. Rain probability is explicitly marked unavailable.`;
      } else {
        const isRainy = weatherData.rainProbability >= 50 || weatherData.rainfall >= 15;
        text = `Simulated rain probability is ${weatherData.rainProbability}% with ${weatherData.rainfall} mm expected rainfall in ${location}. ${
          isRainy
            ? 'Yes, carrying an umbrella and planning for wet roads is strongly advised.'
            : 'Rain is unlikely under this demo scenario.'
        }`;
        explainability = `Based on demo scenario precipitation data (${weatherData.rainProbability}%, ${weatherData.rainfall} mm).`;
      }
      break;
    }

    case 'wind': {
      const isWindy = weatherData.windSpeed >= 35;
      text = `Wind speed in ${location} is ${weatherData.windSpeed} km/h coming from the ${weatherData.windDirection}. ${
        isWindy
          ? 'Conditions are quite gusty. Exercise care with temporary structures and two-wheeler travel.'
          : 'Wind conditions are gentle to moderate.'
      }`;

      if (personas.includes('events') && isWindy) {
        text += ' Event tip: Inspect outdoor marquee ballast weights and stage trusses.';
      } else if (personas.includes('outdoor') && isWindy) {
        text += ' Outdoor tip: Secure beach umbrellas and watch for choppy water.';
      }

      explainability = `Measured wind speed: ${weatherData.windSpeed} km/h (${weatherData.windDirection}).`;
      break;
    }

    case 'humidity': {
      const isHigh = weatherData.humidity >= 80;
      text = `Relative humidity in ${location} is ${weatherData.humidity}%. ${
        isHigh
          ? 'Atmospheric moisture is high, which may feel muggy and slow sweat evaporation.'
          : 'Humidity is within a comfortable range.'
      }`;

      if (personas.includes('agriculture') && isHigh) {
        text += ' Agri notice: High humidity increases vulnerability to foliar fungal diseases.';
      }

      explainability = `Recorded relative humidity: ${weatherData.humidity}%.`;
      break;
    }

    case 'visibility': {
      if (dataMode === 'live') {
        text = `Transmissometer sight distance is not provided in the standard live IMD observation snippet. Current atmospheric state is: ${weatherData.weatherCondition.replace('_', ' ')}.`;
        explainability = `Visibility metric is unavailable in live IMD observation card.`;
      } else {
        const isLow = weatherData.visibility <= 5;
        text = `Simulated visibility in ${location} is ${weatherData.visibility} km. ${
          isLow
            ? 'Visibility is reduced. Drive with low-beam fog lights and maintain double headway distance.'
            : 'Visibility is clear with unrestricted sight distance.'
        }`;
        explainability = `Based on simulated visibility of ${weatherData.visibility} km.`;
      }
      break;
    }

    case 'uv': {
      if (dataMode === 'live') {
        text = `Solar radiometer UV Index is not provided in the standard live IMD observation snippet. For daytime sun exposure, standard sun protection (sunscreen and sunglasses) is recommended.`;
        explainability = `UV Index is unavailable in live IMD observation card.`;
      } else {
        const isHigh = weatherData.uvIndex >= 8;
        text = `Simulated UV Index in ${location} is ${weatherData.uvIndex} of 12. ${
          isHigh
            ? 'UV radiation is elevated to extreme. Apply SPF 30+ sunscreen, wear UV eyewear, and seek shade between 11 AM - 3 PM.'
            : 'UV radiation level is moderate.'
        }`;
        explainability = `Based on demo UV index of ${weatherData.uvIndex}.`;
      }
      break;
    }

    case 'fitness': {
      if (isSevere) {
        text = `Outdoor workouts are NOT recommended due to active severe weather (${weatherData.summary}). Cancel outdoor training and stay safe indoors.`;
      } else if (weatherData.temperature >= 38) {
        text = `High heat (${weatherData.temperature}°C, feels like ${weatherData.feelsLike}°C) makes outdoor cardio hazardous right now. Reschedule workouts to early morning (before 7:30 AM) or train in an air-conditioned gym.`;
      } else if (weatherData.weatherCondition === 'rain' || weatherData.rainProbability >= 60) {
        text = `Wet and slippery surfaces detected. Outdoor running or cycling carries slip and braking hazards. Indoor cross-training is recommended.`;
      } else if (weatherData.windSpeed >= 40) {
        text = `Gusty winds (${weatherData.windSpeed} km/h) will create heavy resistance and crosswind instability for road cycling.`;
      } else {
        text = `Conditions in ${location} are favorable for outdoor exercise (${weatherData.temperature}°C, ${weatherData.weatherCondition.replace('_', ' ')}, wind ${weatherData.windSpeed} km/h). Maintain normal hydration.`;
      }
      explainability = `Evaluated against Fitness persona rules with current temperature (${weatherData.temperature}°C) and weather condition.`;
      break;
    }

    case 'travel_commute': {
      if (isSevere) {
        text = `Highway travel and non-essential commuting should be postponed due to severe storm hazards (${weatherData.summary}).`;
      } else if (weatherData.weatherCondition === 'rain' || weatherData.rainProbability >= 60) {
        text = `Expect wet roadways, waterlogging, and transit delays in ${location}. Add 20-30 minutes extra travel time and prefer metro rail if available.`;
      } else if (weatherData.weatherCondition === 'fog' || (weatherData.visibility > 0 && weatherData.visibility <= 5)) {
        text = `Foggy conditions and reduced sight distance may cause transit slowdowns and airport instrument holds. Verify travel status.`;
      } else if (weatherData.temperature >= 38) {
        text = `High temperatures (${weatherData.temperature}°C) elevate highway tire friction and engine cooling strain. Check vehicle coolant and tire pressure.`;
      } else {
        text = `Commuting and travel conditions in ${location} are smooth with dry roads and normal transit flow.`;
      }
      explainability = `Evaluated against Travel & Commuting rules under current meteorological parameters.`;
      break;
    }

    case 'agriculture': {
      if (isSevere) {
        text = `Severe storm alert: Secure farm equipment, tie down nursery structures, and protect livestock in covered shelters.`;
      } else if (weatherData.windSpeed >= 30) {
        text = `Elevated winds (${weatherData.windSpeed} km/h) cause chemical spray drift and lodging risks. Postpone pesticide/fertilizer spraying until winds drop below 15 km/h.`;
      } else if (weatherData.temperature >= 38) {
        text = `High thermal stress (${weatherData.temperature}°C) accelerates crop evapotranspiration. Ensure early morning micro-irrigation and provide shaded livestock ventilation.`;
      } else if (weatherData.humidity >= 85) {
        text = `High relative humidity (${weatherData.humidity}%) increases fungal disease risk. Inspect standing crops for blight and mildew.`;
      } else {
        text = `Favorable weather in ${location} for general field operations, harvesting, tillage, and spraying (${weatherData.temperature}°C, calm winds).`;
      }
      explainability = `Evaluated against Agriculture persona rules with current wind (${weatherData.windSpeed} km/h), temp (${weatherData.temperature}°C), and humidity (${weatherData.humidity}%).`;
      break;
    }

    case 'events': {
      if (isSevere) {
        text = `Outdoor events must be suspended or moved indoors immediately due to severe storm conditions.`;
      } else if (weatherData.windSpeed >= 35) {
        text = `Wind speeds of ${weatherData.windSpeed} km/h pose safety risks for temporary event canopies, banners, and stage trusses. Verify ballast weights.`;
      } else if (weatherData.weatherCondition === 'rain' || weatherData.rainProbability >= 50) {
        text = `Rain is expected. Ensure waterproof coverings for audio/electrical equipment and prepare covered guest walkways.`;
      } else if (weatherData.temperature >= 38) {
        text = `High temperatures (${weatherData.temperature}°C) require misting fans, shaded awnings, and ample drinking water stations for guests.`;
      } else {
        text = `Excellent weather for open-air events and staging in ${location} (${weatherData.temperature}°C, clear skies, gentle breeze).`;
      }
      explainability = `Evaluated against Event Planner rules using current meteorological conditions.`;
      break;
    }

    case 'family': {
      if (isSevere) {
        text = `Stay indoors with family members. Keep emergency flashlights, drinking water, and charged phones accessible.`;
      } else if (weatherData.temperature >= 38) {
        text = `High temperature (${weatherData.temperature}°C): Keep young children and seniors hydrated in air-conditioned or shaded rooms. Limit park trips to early morning.`;
      } else if (weatherData.weatherCondition === 'rain' || weatherData.rainProbability >= 60) {
        text = `Rainy conditions expected for school commutes. Equip children with rain gear and allow extra time for family transit.`;
      } else {
        text = `Great weather in ${location} for family outings, playground trips, and outdoor activities (${weatherData.temperature}°C, pleasant skies).`;
      }
      explainability = `Evaluated against Family persona rules under current weather parameters.`;
      break;
    }

    case 'help': {
      text = `You can ask me questions about:
• Current Weather ("What's the weather today?")
• Temperature ("How hot is it?")
• Rain & Umbrella ("Will it rain?", "Should I carry an umbrella?")
• Wind ("How strong is the wind?")
• Humidity ("What is the humidity?")
• Visibility & Fog ("How is visibility?")
• UV & Sun ("Is UV high?")
• Outdoor Workouts ("Can I go for a run?")
• Travel & Commuting ("How are commuting conditions?")
• Agriculture & Farming ("Can I spray pesticides?")
• Outdoor Events ("Is it good for an outdoor event?")
• Severe Weather ("Are there any warnings?")`;
      explainability = `Rule-based conversational assistant for PersonalizedMAUSAM (SIH26076).`;
      break;
    }

    case 'unknown':
    default: {
      text = `I can help with current weather, temperature, rain, wind, humidity, visibility, outdoor workouts, travel, commuting, agriculture, and severe-weather conditions. Try asking: "What's the weather now?", "Will it rain?", or "Can I exercise outside?".`;
      explainability = `Unrecognized query pattern. Showing standard capability list.`;
      break;
    }
  }

  return {
    id: `msg_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    sender: 'assistant',
    text,
    intent,
    explainability,
    safetyNotice,
    dataMode,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  };
}
