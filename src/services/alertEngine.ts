import type { AppState, WeatherData, WeatherDataMode } from '../types';
import type { WeatherAlert, AlertSeverityLevel } from '../types/alerts';
import {
  HIGH_TEMPERATURE,
  VERY_HIGH_TEMPERATURE,
  HIGH_RAIN_PROBABILITY,
  HEAVY_RAINFALL,
  HIGH_WIND,
  HIGH_UV,
  VERY_HIGH_UV,
  LOW_VISIBILITY,
  HIGH_HUMIDITY,
} from '../constants/personalizationRules';

const ALERT_SEVERITY_WEIGHTS: Record<AlertSeverityLevel, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

interface GenerateAlertsInput {
  weatherData: WeatherData;
  userState: AppState;
  dataMode: WeatherDataMode;
  readAlertIds?: Set<string>;
}

/**
 * Pure, deterministic in-app Personalized Alert Engine for SIH26076.
 */
export function generatePersonalizedAlerts({
  weatherData,
  userState,
  dataMode,
  readAlertIds = new Set<string>(),
}: GenerateAlertsInput): WeatherAlert[] {
  const alerts: WeatherAlert[] = [];
  const selectedPersonas = userState.selectedPersonas || [];
  const location =
    userState.selectedLocation === 'Choose Later'
      ? 'your region'
      : userState.selectedLocation || weatherData.location;

  // =========================================================================
  // 1. CRITICAL SEVERE WEATHER SAFETY GUARANTEE (TASK 3)
  // Unconditionally generated whenever severity is 'severe', independent of
  // user personas or preference choices.
  // =========================================================================
  if (weatherData.severity === 'severe') {
    alerts.push({
      id: 'alert_critical_severe',
      title: 'Severe Weather Warning',
      message: `Hazardous storm conditions active in ${location}. Postpone non-essential travel, secure outdoor structures, and observe civil defense instructions.`,
      severity: 'critical',
      category: 'safety',
      timestamp: weatherData.timestamp || 'Active Now',
      source: 'Official IMD',
      explanation: 'Official IMD district severity rating is SEVERE. Unconditional public safety override.',
      isRead: readAlertIds.has('alert_critical_severe'),
    });
  }

  // =========================================================================
  // 2. CONDITION FLAGS (Grounded only in genuinely available metrics)
  // =========================================================================
  const isHeat = weatherData.temperature >= HIGH_TEMPERATURE || weatherData.feelsLike >= 38;
  const isExtremeHeat = weatherData.temperature >= VERY_HIGH_TEMPERATURE || weatherData.feelsLike >= 42;

  const isRain =
    weatherData.weatherCondition === 'rain' ||
    weatherData.weatherCondition === 'thunderstorm' ||
    (weatherData.rainProbability >= HIGH_RAIN_PROBABILITY && weatherData.rainProbability > 0) ||
    (weatherData.rainfall >= 15 && weatherData.rainfall > 0);
  const isHeavyRain =
    weatherData.rainfall >= HEAVY_RAINFALL || weatherData.weatherCondition === 'thunderstorm';

  const isHighUV = weatherData.uvIndex >= HIGH_UV && weatherData.uvIndex > 0;
  const isExtremeUV = weatherData.uvIndex >= VERY_HIGH_UV && weatherData.uvIndex > 0;

  const isHighWind = weatherData.windSpeed >= HIGH_WIND;
  const isSevereWind = weatherData.windSpeed >= 50;

  const isLowVisibility =
    weatherData.weatherCondition === 'fog' ||
    (weatherData.visibility <= LOW_VISIBILITY && weatherData.visibility > 0);

  const isHighHumidity =
    weatherData.humidity >= HIGH_HUMIDITY &&
    weatherData.temperature >= 26 &&
    !isRain &&
    weatherData.severity !== 'severe';

  // =========================================================================
  // 3. PERSONA-SPECIFIC PERSONALIZED ALERTS (TASK 4 & 6)
  // Source: 'Personalized MAUSAM'
  // =========================================================================

  // --- HEALTH ---
  if (selectedPersonas.includes('health')) {
    if (isHeat) {
      alerts.push({
        id: 'alert_health_heat',
        title: isExtremeHeat ? 'Heat Exhaustion & Dehydration Warning' : 'Elevated Heat Stress Advisory',
        message: `Ambient temperature reached ${weatherData.temperature}°C (Feels like ${weatherData.feelsLike}°C). Maintain frequent hydration and avoid peak sun hours.`,
        severity: isExtremeHeat ? 'high' : 'medium',
        category: 'health',
        timestamp: weatherData.timestamp || 'Current',
        source: 'Personalized MAUSAM',
        persona: 'Health',
        explanation: `Shown because you selected Health and ambient temperature is ${weatherData.temperature}°C.`,
        isRead: readAlertIds.has('alert_health_heat'),
      });
    }
    if (isHighUV && (dataMode === 'demo' || weatherData.uvIndex > 0)) {
      alerts.push({
        id: 'alert_health_uv',
        title: isExtremeUV ? 'Extreme Solar UV Radiation Alert' : 'Elevated UV Exposure Protection',
        message: `High UV index (${weatherData.uvIndex} of 12) increases sunburn and eye strain risk. Apply SPF 30+ sunscreen and wear UV sunglasses.`,
        severity: isExtremeUV ? 'high' : 'medium',
        category: 'health',
        timestamp: weatherData.timestamp || 'Current',
        source: 'Personalized MAUSAM',
        persona: 'Health',
        explanation: `Shown because you selected Health and UV Index is ${weatherData.uvIndex}.`,
        isRead: readAlertIds.has('alert_health_uv'),
      });
    }
    if (isHighHumidity) {
      alerts.push({
        id: 'alert_health_humidity',
        title: 'High Humidity Thermal Oppressiveness',
        message: `Relative humidity at ${weatherData.humidity}% reduces evaporative cooling efficiency. Stay in well-ventilated spaces.`,
        severity: 'medium',
        category: 'health',
        timestamp: weatherData.timestamp || 'Current',
        source: 'Personalized MAUSAM',
        persona: 'Health',
        explanation: `Shown because you selected Health and relative humidity is ${weatherData.humidity}%.`,
        isRead: readAlertIds.has('alert_health_humidity'),
      });
    }
  }

  // --- FITNESS ---
  if (selectedPersonas.includes('fitness')) {
    if (isHeat) {
      alerts.push({
        id: 'alert_fitness_heat',
        title: 'Outdoor Workout Thermal Hazard Alert',
        message: `High heat (${weatherData.temperature}°C) elevates cardiac workload. Shift endurance training to early morning before 7:30 AM or indoor gyms.`,
        severity: 'high',
        category: 'fitness',
        timestamp: weatherData.timestamp || 'Current',
        source: 'Personalized MAUSAM',
        persona: 'Fitness',
        explanation: `Shown because you selected Fitness and temperature is ${weatherData.temperature}°C.`,
        isRead: readAlertIds.has('alert_fitness_heat'),
      });
    }
    if (isRain) {
      alerts.push({
        id: 'alert_fitness_rain',
        title: 'Wet Pavement & Slip Hazard for Outdoor Workouts',
        message: 'Precipitation creates slick road surfaces and reduced driver visibility. Indoor cross-training is recommended.',
        severity: isHeavyRain ? 'high' : 'medium',
        category: 'fitness',
        timestamp: weatherData.timestamp || 'Current',
        source: 'Personalized MAUSAM',
        persona: 'Fitness',
        explanation: 'Shown because you selected Fitness and rainy conditions are active.',
        isRead: readAlertIds.has('alert_fitness_rain'),
      });
    }
    if (isHighWind) {
      alerts.push({
        id: 'alert_fitness_wind',
        title: 'Strong Gusts & Cycling Resistance Advisory',
        message: `Wind gusts of ${weatherData.windSpeed} km/h reduce bicycle stability on open routes. Exercise extra caution.`,
        severity: 'medium',
        category: 'fitness',
        timestamp: weatherData.timestamp || 'Current',
        source: 'Personalized MAUSAM',
        persona: 'Fitness',
        explanation: `Shown because you selected Fitness and wind speed is ${weatherData.windSpeed} km/h.`,
        isRead: readAlertIds.has('alert_fitness_wind'),
      });
    }
  }

  // --- COMMUTING ---
  if (selectedPersonas.includes('commuting')) {
    if (isRain) {
      alerts.push({
        id: 'alert_commute_rain',
        title: isHeavyRain ? 'Waterlogged Corridors & Severe Transit Delays' : 'Wet Roads & Commuting Delays Precaution',
        message: 'Precipitation increases vehicle braking distances and creates bottleneck congestion. Plan 20-30 minutes extra travel time.',
        severity: isHeavyRain ? 'high' : 'medium',
        category: 'commuting',
        timestamp: weatherData.timestamp || 'Current',
        source: 'Personalized MAUSAM',
        persona: 'Commuting',
        explanation: 'Shown because you selected Commuting and rain conditions are active.',
        isRead: readAlertIds.has('alert_commute_rain'),
      });
    }
    if (isLowVisibility) {
      alerts.push({
        id: 'alert_commute_fog',
        title: 'Reduced Sight Distance & Fog Headway Alert',
        message: `Foggy conditions restrict forward road visibility. Use low-beam fog lights and maintain double headway distance.`,
        severity: 'high',
        category: 'commuting',
        timestamp: weatherData.timestamp || 'Current',
        source: 'Personalized MAUSAM',
        persona: 'Commuting',
        explanation: 'Shown because you selected Commuting and visibility is restricted by fog.',
        isRead: readAlertIds.has('alert_commute_fog'),
      });
    }
    if (isHighWind) {
      alerts.push({
        id: 'alert_commute_wind',
        title: 'Elevated Flyover Crosswind Hazard',
        message: `Wind velocity of ${weatherData.windSpeed} km/h threatens two-wheeler balance on elevated bridges and expressways.`,
        severity: 'medium',
        category: 'commuting',
        timestamp: weatherData.timestamp || 'Current',
        source: 'Personalized MAUSAM',
        persona: 'Commuting',
        explanation: `Shown because you selected Commuting and wind speed is ${weatherData.windSpeed} km/h.`,
        isRead: readAlertIds.has('alert_commute_wind'),
      });
    }
  }

  // --- TRAVEL ---
  if (selectedPersonas.includes('travel')) {
    if (isRain || weatherData.weatherCondition === 'thunderstorm') {
      alerts.push({
        id: 'alert_travel_rain',
        title: 'Intercity Highway Hydroplaning & Flight Delays',
        message: 'Wet tarmac reduces traction at highway speeds (>80 km/h). Verify transit schedules and airport flight departure boards.',
        severity: isHeavyRain ? 'high' : 'medium',
        category: 'travel',
        timestamp: weatherData.timestamp || 'Current',
        source: 'Personalized MAUSAM',
        persona: 'Travel',
        explanation: 'Shown because you selected Travel and precipitation is active.',
        isRead: readAlertIds.has('alert_travel_rain'),
      });
    }
    if (isLowVisibility) {
      alerts.push({
        id: 'alert_travel_fog',
        title: 'Runway & Highway Reduced Sightlines',
        message: 'Fog conditions may trigger airport instrument holds and highway speed restrictions.',
        severity: 'high',
        category: 'travel',
        timestamp: weatherData.timestamp || 'Current',
        source: 'Personalized MAUSAM',
        persona: 'Travel',
        explanation: 'Shown because you selected Travel and visibility is reduced.',
        isRead: readAlertIds.has('alert_travel_fog'),
      });
    }
    if (isHighWind) {
      alerts.push({
        id: 'alert_travel_wind',
        title: 'Open Corridor Highway Crosswind Alert',
        message: `High-sided vehicles and roof-rack carriers should reduce highway speed due to ${weatherData.windSpeed} km/h crosswinds.`,
        severity: 'medium',
        category: 'travel',
        timestamp: weatherData.timestamp || 'Current',
        source: 'Personalized MAUSAM',
        persona: 'Travel',
        explanation: `Shown because you selected Travel and wind speed is ${weatherData.windSpeed} km/h.`,
        isRead: readAlertIds.has('alert_travel_wind'),
      });
    }
  }

  // --- AGRICULTURE ---
  if (selectedPersonas.includes('agriculture')) {
    if (isHeat) {
      alerts.push({
        id: 'alert_agri_heat',
        title: isExtremeHeat ? 'Crop Thermal Stress & Evapotranspiration Alert' : 'Irrigation & Crop Heat Precaution',
        message: `High heat (${weatherData.temperature}°C) depletes topsoil moisture. Implement early morning micro-irrigation and shade livestock.`,
        severity: isExtremeHeat ? 'high' : 'medium',
        category: 'agriculture',
        timestamp: weatherData.timestamp || 'Current',
        source: 'Personalized MAUSAM',
        persona: 'Agriculture',
        explanation: `Shown because you selected Agriculture and temperature is ${weatherData.temperature}°C.`,
        isRead: readAlertIds.has('alert_agri_heat'),
      });
    }
    if (isHighWind) {
      alerts.push({
        id: 'alert_agri_wind',
        title: 'Agrochemical Spray Drift & Wind Alert',
        message: `Wind speed of ${weatherData.windSpeed} km/h causes chemical drift and risks crop lodging. Postpone pesticide spraying until winds calm.`,
        severity: 'medium',
        category: 'agriculture',
        timestamp: weatherData.timestamp || 'Current',
        source: 'Personalized MAUSAM',
        persona: 'Agriculture',
        explanation: `Shown because you selected Agriculture and wind speed is ${weatherData.windSpeed} km/h.`,
        isRead: readAlertIds.has('alert_agri_wind'),
      });
    }
    if (isHighHumidity) {
      alerts.push({
        id: 'alert_agri_humidity',
        title: 'Foliar Fungal Disease & High Humidity Alert',
        message: `Relative humidity of ${weatherData.humidity}% encourages fungal spore germination. Inspect standing crops for blight.`,
        severity: 'medium',
        category: 'agriculture',
        timestamp: weatherData.timestamp || 'Current',
        source: 'Personalized MAUSAM',
        persona: 'Agriculture',
        explanation: `Shown because you selected Agriculture and relative humidity is ${weatherData.humidity}%.`,
        isRead: readAlertIds.has('alert_agri_humidity'),
      });
    }
  }

  // --- EVENTS ---
  if (selectedPersonas.includes('events')) {
    if (isHighWind) {
      alerts.push({
        id: 'alert_events_wind',
        title: 'Temporary Stage Truss & Canopy Wind Alert',
        message: `Strong winds of ${weatherData.windSpeed} km/h exert aerodynamic lift on marquee tents and video walls. Inspect anchor rigging.`,
        severity: 'high',
        category: 'events',
        timestamp: weatherData.timestamp || 'Current',
        source: 'Personalized MAUSAM',
        persona: 'Events',
        explanation: `Shown because you selected Events and wind speed is ${weatherData.windSpeed} km/h.`,
        isRead: readAlertIds.has('alert_events_wind'),
      });
    }
    if (isRain) {
      alerts.push({
        id: 'alert_events_rain',
        title: 'Outdoor Event Waterproofing & Contingency Alert',
        message: 'Precipitation detected. Cover open-air electrical sound gear and activate marquee sidewall rain protection.',
        severity: isHeavyRain ? 'high' : 'medium',
        category: 'events',
        timestamp: weatherData.timestamp || 'Current',
        source: 'Personalized MAUSAM',
        persona: 'Events',
        explanation: 'Shown because you selected Events and rain conditions are active.',
        isRead: readAlertIds.has('alert_events_rain'),
      });
    }
  }

  // --- BEACH & OUTDOOR ('outdoor') ---
  if (selectedPersonas.includes('outdoor')) {
    if (isHighUV && (dataMode === 'demo' || weatherData.uvIndex > 0)) {
      alerts.push({
        id: 'alert_outdoor_uv',
        title: isExtremeUV ? 'Severe Coastal UV Radiation Warning' : 'Beach & Outdoor Solar Radiation Advisory',
        message: `High UV radiation reflection off water/sand (${weatherData.uvIndex} of 12). Use polarized sunglasses and wide-brim hats.`,
        severity: isExtremeUV ? 'high' : 'medium',
        category: 'outdoor',
        timestamp: weatherData.timestamp || 'Current',
        source: 'Personalized MAUSAM',
        persona: 'Beach & Outdoor',
        explanation: `Shown because you selected Beach & Outdoor and UV Index is ${weatherData.uvIndex}.`,
        isRead: readAlertIds.has('alert_outdoor_uv'),
      });
    }
    if (isHighWind) {
      alerts.push({
        id: 'alert_outdoor_wind',
        title: 'Coastal Wind Gusts & Surf Precaution',
        message: `Gusty winds of ${weatherData.windSpeed} km/h create rough surf and loose umbrella hazards on open beaches.`,
        severity: isSevereWind ? 'high' : 'medium',
        category: 'outdoor',
        timestamp: weatherData.timestamp || 'Current',
        source: 'Personalized MAUSAM',
        persona: 'Beach & Outdoor',
        explanation: `Shown because you selected Beach & Outdoor and wind speed is ${weatherData.windSpeed} km/h.`,
        isRead: readAlertIds.has('alert_outdoor_wind'),
      });
    }
  }

  // --- FAMILY ('family') ---
  if (selectedPersonas.includes('family')) {
    if (isHeat) {
      alerts.push({
        id: 'alert_family_heat',
        title: isExtremeHeat ? 'Child & Senior Heatwave Protection' : 'Family Routine Heat Precaution',
        message: `Elevated heat (${weatherData.temperature}°C). Keep dependents in air-conditioned spaces and maintain hydration.`,
        severity: isExtremeHeat ? 'high' : 'medium',
        category: 'family',
        timestamp: weatherData.timestamp || 'Current',
        source: 'Personalized MAUSAM',
        persona: 'Family',
        explanation: `Shown because you selected Family and temperature is ${weatherData.temperature}°C.`,
        isRead: readAlertIds.has('alert_family_heat'),
      });
    }
    if (isRain) {
      alerts.push({
        id: 'alert_family_rain',
        title: 'School Transit & Rain Gear Precaution',
        message: 'Rainy conditions for household routines. Equip children with umbrellas and waterproof school bags.',
        severity: 'medium',
        category: 'family',
        timestamp: weatherData.timestamp || 'Current',
        source: 'Personalized MAUSAM',
        persona: 'Family',
        explanation: 'Shown because you selected Family and rain is active.',
        isRead: readAlertIds.has('alert_family_rain'),
      });
    }
  }

  // =========================================================================
  // 4. DEDUPLICATION (TASK 12)
  // =========================================================================
  const seenIds = new Set<string>();
  const uniqueAlerts: WeatherAlert[] = [];

  for (const item of alerts) {
    if (!seenIds.has(item.id)) {
      seenIds.add(item.id);
      uniqueAlerts.push(item);
    }
  }

  // =========================================================================
  // 5. DETERMINISTIC ORDERING (TASK 13)
  // Priority: critical (0) -> high (1) -> medium (2) -> low (3)
  // Secondary: Stable sort by ID
  // =========================================================================
  return uniqueAlerts.sort((a, b) => {
    const diff = ALERT_SEVERITY_WEIGHTS[a.severity] - ALERT_SEVERITY_WEIGHTS[b.severity];
    if (diff !== 0) return diff;
    return a.id.localeCompare(b.id);
  });
}
