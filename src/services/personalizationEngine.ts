import type { AppState, UserPersonaType, WeatherData } from '../types';
import type { PersonalizedRecommendation } from '../types/personalization';
import { PERSONA_CATALOG } from '../constants/personas';
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
  PRIORITY_WEIGHTS,
} from '../constants/personalizationRules';

interface EngineInput {
  userState: AppState;
  weatherData: WeatherData;
}

/**
 * Helper to retrieve official human-readable label for a persona ID.
 * Strictly guarantees that 'outdoor' displays as 'Beach & Outdoor'.
 */
export const getPersonaLabel = (personaId: UserPersonaType): string => {
  if (personaId === 'outdoor') {
    return 'Beach & Outdoor';
  }
  const match = PERSONA_CATALOG.find((p) => p.id === personaId);
  return match ? match.title : personaId;
};

/**
 * Pure, deterministic rule-based Personalization Engine.
 * Evaluates user profile state against meteorological conditions.
 */
export const generatePersonalizedRecommendations = ({
  userState,
  weatherData,
}: EngineInput): PersonalizedRecommendation[] => {
  const recommendations: PersonalizedRecommendation[] = [];
  const selectedPersonas = userState.selectedPersonas || [];
  const selectedPreferences = userState.selectedPreferences || [];
  const selectedActivities = userState.selectedActivities || [];

  // =========================================================================
  // 1. CRITICAL SEVERE WEATHER SAFETY GUARANTEE
  // Must appear unconditionally whenever severity is 'severe', independent
  // of user persona choices or preferences.
  // =========================================================================
  if (weatherData.severity === 'severe') {
    recommendations.push({
      id: 'critical_severe_weather',
      category: 'safety_alert',
      title: 'Severe Weather Warning',
      description:
        'Hazardous storm conditions active in your district. Postpone non-essential travel, secure outdoor assets, and observe civil defense instructions.',
      priority: 'critical',
      explanation: 'Shown because severe weather conditions are currently active in your region.',
      relevantPersonas: [],
      relevantPersonaLabels: ['Public Safety Priority'],
      weatherTrigger: `Severe Warning • Wind ${weatherData.windSpeed} km/h • Precip ${weatherData.rainfall} mm`,
      icon: '🚨',
      badge: 'Safety Alert',
    });
  }

  // =========================================================================
  // 2. CONDITION FLAGS (Derived from genuinely available data)
  // =========================================================================
  const isHeat = weatherData.temperature >= HIGH_TEMPERATURE || weatherData.feelsLike >= 38;
  const isExtremeHeat = weatherData.temperature >= VERY_HIGH_TEMPERATURE || weatherData.feelsLike >= 42;

  const isRain =
    weatherData.weatherCondition === 'rain' ||
    weatherData.weatherCondition === 'thunderstorm' ||
    (weatherData.rainProbability >= HIGH_RAIN_PROBABILITY && weatherData.rainProbability > 0) ||
    (weatherData.rainfall >= 15 && weatherData.rainfall > 0);
  const isHeavyRain = weatherData.rainfall >= HEAVY_RAINFALL || weatherData.weatherCondition === 'thunderstorm';

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

  const isComfortableBaseline =
    weatherData.severity === 'normal' &&
    weatherData.temperature >= 18 &&
    weatherData.temperature <= 32 &&
    weatherData.windSpeed < 30 &&
    !isRain &&
    !isHighUV &&
    !isLowVisibility &&
    weatherData.weatherCondition !== 'fog';

  // =========================================================================
  // 3. PERSONA-SPECIFIC DIFFERENTIATED RECOMMENDATIONS
  // =========================================================================

  // -------------------------------------------------------------------------
  // A. HEALTH PERSONA
  // -------------------------------------------------------------------------
  if (selectedPersonas.includes('health')) {
    if (isHeat) {
      recommendations.push({
        id: 'health_heat_advisory',
        category: 'health_comfort',
        title: isExtremeHeat ? 'Heat Exhaustion & Dehydration Alert' : 'Hydration & Thermal Comfort Advisory',
        description:
          'High ambient temperature increases physiological heat stress. Maintain frequent electrolyte hydration, avoid direct sun between 12 PM - 3 PM, and monitor vulnerable family members.',
        priority: isExtremeHeat ? 'high' : 'medium',
        explanation: `High temperature detected (${weatherData.temperature}°C). Shown because you selected Health.`,
        relevantPersonas: ['health'],
        relevantPersonaLabels: ['Health'],
        weatherTrigger: `Temperature ${weatherData.temperature}°C (Feels like ${weatherData.feelsLike}°C)`,
        icon: '🏥',
        badge: 'Health Advisory',
      });
    } else if (isHighUV) {
      recommendations.push({
        id: 'health_uv_advisory',
        category: 'health_comfort',
        title: isExtremeUV ? 'Extreme Solar Radiation Alert' : 'Elevated UV Exposure Protection',
        description:
          'Elevated ultraviolet radiation poses skin and eye strain hazards. Apply broad-spectrum SPF 30+ sunscreen, wear UV-rated eyewear, and seek shade during peak midday hours.',
        priority: isExtremeUV ? 'high' : 'medium',
        explanation: `High UV Index detected (${weatherData.uvIndex} of 12). Shown because you selected Health.`,
        relevantPersonas: ['health'],
        relevantPersonaLabels: ['Health'],
        weatherTrigger: `UV Index: ${weatherData.uvIndex}`,
        icon: '☀️',
        badge: 'UV Health Warning',
      });
    } else if (isHighHumidity) {
      recommendations.push({
        id: 'health_humidity_advisory',
        category: 'health_comfort',
        title: 'High Humidity Thermal Oppressiveness',
        description:
          'Elevated atmospheric moisture impairs evaporative sweat cooling. Keep indoor spaces well-ventilated, wear breathable cotton fabrics, and stay hydrated.',
        priority: 'medium',
        explanation: `High humidity detected (${weatherData.humidity}%). Shown because you selected Health.`,
        relevantPersonas: ['health'],
        relevantPersonaLabels: ['Health'],
        weatherTrigger: `Relative Humidity: ${weatherData.humidity}%`,
        icon: '💧',
        badge: 'Humidity Advisory',
      });
    } else if (isLowVisibility) {
      recommendations.push({
        id: 'health_fog_advisory',
        category: 'health_comfort',
        title: 'Dense Fog & Particulate Precaution',
        description:
          'Foggy conditions trap ground-level particulates and damp aerosols. Individuals with sensitive respiratory tracts should consider wearing a protective mask outdoors.',
        priority: 'medium',
        explanation: `Reduced visibility/fog detected (${weatherData.visibility > 0 ? weatherData.visibility + ' km' : 'Fog'}). Shown because you selected Health.`,
        relevantPersonas: ['health'],
        relevantPersonaLabels: ['Health'],
        weatherTrigger: `Visibility: ${weatherData.visibility} km • Condition: ${weatherData.weatherCondition}`,
        icon: '🌫️',
        badge: 'Air & Fog Precaution',
      });
    } else if (isComfortableBaseline) {
      recommendations.push({
        id: 'health_comfortable_baseline',
        category: 'health_comfort',
        title: 'Comfortable Environmental Baseline',
        description:
          'Pleasant temperature and moderate humidity provide ideal biometeorological comfort and natural indoor ventilation.',
        priority: 'low',
        explanation: `Comfortable weather detected (${weatherData.temperature}°C, ${weatherData.humidity}% humidity). Shown because you selected Health.`,
        relevantPersonas: ['health'],
        relevantPersonaLabels: ['Health'],
        weatherTrigger: `Temperature ${weatherData.temperature}°C • Humidity ${weatherData.humidity}%`,
        icon: '🏥',
        badge: 'Comfort Favorable',
      });
    }
  }

  // -------------------------------------------------------------------------
  // B. FITNESS PERSONA
  // -------------------------------------------------------------------------
  if (selectedPersonas.includes('fitness')) {
    if (isHeat) {
      recommendations.push({
        id: 'fitness_heat_reschedule',
        category: 'outdoor_advisory',
        title: 'Outdoor Workout Thermal Rescheduling',
        description:
          'High thermal index increases cardiac strain during intense workouts. Reschedule endurance runs and cycling to early morning before 7:30 AM or utilize climate-controlled indoor gyms.',
        priority: isExtremeHeat ? 'high' : 'medium',
        explanation: `High temperature detected (${weatherData.temperature}°C). Shown because you selected Fitness.`,
        relevantPersonas: ['fitness'],
        relevantPersonaLabels: ['Fitness'],
        weatherTrigger: `Temperature ${weatherData.temperature}°C (Feels like ${weatherData.feelsLike}°C)`,
        icon: '🏃',
        badge: 'Training Advisory',
      });
    } else if (isRain) {
      recommendations.push({
        id: 'fitness_rain_indoor_shift',
        category: 'outdoor_advisory',
        title: 'Wet Pavement & Slip Hazard for Outdoor Workouts',
        description:
          'Rain and standing water create slick road surfaces and reduced runner visibility. Shift to indoor treadmill, bodyweight training, or strength circuits.',
        priority: isHeavyRain ? 'high' : 'medium',
        explanation: `Precipitation/rain detected (${weatherData.rainProbability > 0 ? weatherData.rainProbability + '%' : 'Rain'}). Shown because you selected Fitness.`,
        relevantPersonas: ['fitness'],
        relevantPersonaLabels: ['Fitness'],
        weatherTrigger: `Rain ${weatherData.rainProbability}% (${weatherData.rainfall} mm)`,
        icon: '🌧️',
        badge: 'Training Shift',
      });
    } else if (isHighWind) {
      recommendations.push({
        id: 'fitness_wind_cycling_hazard',
        category: 'outdoor_advisory',
        title: 'Strong Gusts & Cycling Resistance Advisory',
        description:
          'Crosswinds and gusts reduce stability for road cycling and track training. Avoid open bridge corridors and exercise extra caution on two wheels.',
        priority: 'medium',
        explanation: `Strong wind detected (${weatherData.windSpeed} km/h). Shown because you selected Fitness.`,
        relevantPersonas: ['fitness'],
        relevantPersonaLabels: ['Fitness'],
        weatherTrigger: `Wind Speed: ${weatherData.windSpeed} km/h ${weatherData.windDirection}`,
        icon: '💨',
        badge: 'Wind & Cycling',
      });
    } else if (isHighUV && !isHeat) {
      recommendations.push({
        id: 'fitness_uv_workout_window',
        category: 'outdoor_advisory',
        title: 'Midday UV Peak Workout Avoidance',
        description:
          'Intense solar radiation between 11 AM and 3 PM accelerates fatigue and sunburn. Plan outdoor cardio during lower sun-angle morning hours.',
        priority: 'medium',
        explanation: `High UV Index detected (${weatherData.uvIndex}). Shown because you selected Fitness.`,
        relevantPersonas: ['fitness'],
        relevantPersonaLabels: ['Fitness'],
        weatherTrigger: `UV Index: ${weatherData.uvIndex}`,
        icon: '🏃',
        badge: 'Solar Advisory',
      });
    } else if (isComfortableBaseline) {
      recommendations.push({
        id: 'fitness_optimal_window',
        category: 'outdoor_advisory',
        title: 'Optimal Outdoor Training Window',
        description:
          'Moderate temperature (25°C), clear skies, and light breeze create ideal meteorological conditions for outdoor running, cycling, and sports training.',
        priority: 'low',
        explanation: `Optimal weather detected (${weatherData.temperature}°C, clear skies). Shown because you selected Fitness.`,
        relevantPersonas: ['fitness'],
        relevantPersonaLabels: ['Fitness'],
        weatherTrigger: `Temperature ${weatherData.temperature}°C • Wind ${weatherData.windSpeed} km/h`,
        icon: '🏃',
        badge: 'Ideal Training',
      });
    }
  }

  // -------------------------------------------------------------------------
  // C. COMMUTING PERSONA
  // -------------------------------------------------------------------------
  if (selectedPersonas.includes('commuting')) {
    if (isRain) {
      recommendations.push({
        id: 'commuting_rain_transit_delay',
        category: 'commute_impact',
        title: isHeavyRain ? 'Waterlogged Corridors & Heavy Transit Delay' : 'Wet Roads & Commute Delay Precaution',
        description:
          'Water accumulation on arterial roadways increases stopping distance and creates bottleneck congestion. Factor 20-30 minutes extra travel time and prefer metro transit.',
        priority: isHeavyRain ? 'high' : 'medium',
        explanation: `Precipitation detected (${weatherData.rainProbability > 0 ? weatherData.rainProbability + '%' : 'Rain'}). Shown because you selected Commuting.`,
        relevantPersonas: ['commuting'],
        relevantPersonaLabels: ['Commuting'],
        weatherTrigger: `Rain ${weatherData.rainProbability}% (${weatherData.rainfall} mm)`,
        icon: '🚆',
        badge: 'Commute Advisory',
      });
    } else if (isLowVisibility) {
      recommendations.push({
        id: 'commuting_fog_headway',
        category: 'commute_impact',
        title: 'Reduced Road Sight Distance & Fog Headway',
        description:
          'Dense fog reduces forward sightlines on highways and expressways. Turn on low-beam fog lights, maintain double headway distance, and expect slower bus schedules.',
        priority: 'high',
        explanation: `Low visibility/fog detected (${weatherData.visibility > 0 ? weatherData.visibility + ' km' : 'Fog'}). Shown because you selected Commuting.`,
        relevantPersonas: ['commuting'],
        relevantPersonaLabels: ['Commuting'],
        weatherTrigger: `Visibility: ${weatherData.visibility} km`,
        icon: '🌫️',
        badge: 'Traffic Precaution',
      });
    } else if (isHighWind) {
      recommendations.push({
        id: 'commuting_wind_two_wheeler',
        category: 'commute_impact',
        title: 'Crosswind & Debris Hazard on Elevated Flyovers',
        description:
          'Gusty winds impact two-wheeler stability on elevated flyovers and bypass roads. Reduce vehicle speed and be vigilant for loose debris and branches.',
        priority: 'medium',
        explanation: `Strong wind detected (${weatherData.windSpeed} km/h). Shown because you selected Commuting.`,
        relevantPersonas: ['commuting'],
        relevantPersonaLabels: ['Commuting'],
        weatherTrigger: `Wind Speed: ${weatherData.windSpeed} km/h ${weatherData.windDirection}`,
        icon: '💨',
        badge: 'Flyover Advisory',
      });
    } else if (isHeat) {
      recommendations.push({
        id: 'commuting_heat_vehicle_care',
        category: 'commute_impact',
        title: 'AC Commute Planning & Vehicle Coolant Precaution',
        description:
          'High ambient heat increases vehicle engine overheating risks in stop-and-go traffic. Verify coolant levels, carry drinking water, and utilize AC transit options.',
        priority: 'medium',
        explanation: `High temperature detected (${weatherData.temperature}°C). Shown because you selected Commuting.`,
        relevantPersonas: ['commuting'],
        relevantPersonaLabels: ['Commuting'],
        weatherTrigger: `Temperature ${weatherData.temperature}°C (Feels like ${weatherData.feelsLike}°C)`,
        icon: '🚆',
        badge: 'Transit Heat',
      });
    } else if (isComfortableBaseline) {
      recommendations.push({
        id: 'commuting_smooth_transit',
        category: 'commute_impact',
        title: 'Smooth Transit & Clear Road Conditions',
        description:
          'Clear visibility and dry roadways indicate optimal commuting conditions with minimal weather-induced corridor delays.',
        priority: 'low',
        explanation: `Favorable clear road conditions detected. Shown because you selected Commuting.`,
        relevantPersonas: ['commuting'],
        relevantPersonaLabels: ['Commuting'],
        weatherTrigger: `Visibility: ${weatherData.visibility} km • Dry Roads`,
        icon: '🚆',
        badge: 'Transit Favorable',
      });
    }
  }

  // -------------------------------------------------------------------------
  // D. TRAVEL PERSONA
  // -------------------------------------------------------------------------
  if (selectedPersonas.includes('travel')) {
    if (isRain || weatherData.weatherCondition === 'thunderstorm') {
      recommendations.push({
        id: 'travel_rain_hydroplaning',
        category: 'travel_visibility',
        title: isHeavyRain ? 'Intercity Highway Hydroplaning & Delays' : 'Wet Corridor Highway Travel Precaution',
        description:
          'Rainfall reduces tire grip and creates hydroplaning hazards at highway speeds (>80 km/h). Check flight and intercity rail delay schedules before departing.',
        priority: isHeavyRain ? 'high' : 'medium',
        explanation: `Rain/storm conditions detected. Shown because you selected Travel.`,
        relevantPersonas: ['travel'],
        relevantPersonaLabels: ['Travel'],
        weatherTrigger: `Precipitation: ${weatherData.rainProbability}% (${weatherData.rainfall} mm)`,
        icon: '✈️',
        badge: 'Travel Advisory',
      });
    } else if (isLowVisibility) {
      recommendations.push({
        id: 'travel_visibility_flight_delay',
        category: 'travel_visibility',
        title: 'Reduced Runway & Highway Sight Distance',
        description:
          'Low visibility and fog may trigger CAT-III airport instrument holds and intercity expressway speed restrictions. Confirm transit status in advance.',
        priority: 'high',
        explanation: `Reduced visibility detected (${weatherData.visibility > 0 ? weatherData.visibility + ' km' : 'Fog'}). Shown because you selected Travel.`,
        relevantPersonas: ['travel'],
        relevantPersonaLabels: ['Travel'],
        weatherTrigger: `Sight Distance: ${weatherData.visibility} km`,
        icon: '🌫️',
        badge: 'Transit Visibility',
      });
    } else if (isHighWind) {
      recommendations.push({
        id: 'travel_wind_crosswind',
        category: 'travel_visibility',
        title: 'Open Corridor Highway Crosswind Advisory',
        description:
          'Elevated crosswinds detected across highway corridors. High-sided vehicles and roof-luggage carriers should reduce cruising speed.',
        priority: 'medium',
        explanation: `Strong wind detected (${weatherData.windSpeed} km/h). Shown because you selected Travel.`,
        relevantPersonas: ['travel'],
        relevantPersonaLabels: ['Travel'],
        weatherTrigger: `Wind: ${weatherData.windSpeed} km/h ${weatherData.windDirection}`,
        icon: '✈️',
        badge: 'Corridor Advisory',
      });
    } else if (isHeat) {
      recommendations.push({
        id: 'travel_heat_highway_cooling',
        category: 'travel_visibility',
        title: 'Long-Distance Highway Thermal & Tire Advisory',
        description:
          'High ambient temperatures elevate tarmac friction heat and air-conditioning load. Verify tire pressures before long highway runs and schedule daytime rest stops.',
        priority: 'medium',
        explanation: `High temperature detected (${weatherData.temperature}°C). Shown because you selected Travel.`,
        relevantPersonas: ['travel'],
        relevantPersonaLabels: ['Travel'],
        weatherTrigger: `Temperature ${weatherData.temperature}°C (Feels like ${weatherData.feelsLike}°C)`,
        icon: '✈️',
        badge: 'Highway Heat',
      });
    } else if (isComfortableBaseline) {
      recommendations.push({
        id: 'travel_favorable_corridor',
        category: 'travel_visibility',
        title: 'Favorable Highway & Transit Corridors',
        description:
          'Dry pavement and unrestricted atmospheric visibility offer optimal driving conditions for intercity journeys and flight schedules.',
        priority: 'low',
        explanation: `Clear skies and dry roads detected. Shown because you selected Travel.`,
        relevantPersonas: ['travel'],
        relevantPersonaLabels: ['Travel'],
        weatherTrigger: `Clear Skies • Visibility ${weatherData.visibility} km`,
        icon: '✈️',
        badge: 'Travel Favorable',
      });
    }
  }

  // -------------------------------------------------------------------------
  // E. AGRICULTURE PERSONA
  // -------------------------------------------------------------------------
  if (selectedPersonas.includes('agriculture')) {
    if (isHeat) {
      recommendations.push({
        id: 'agri_heat_transpiration',
        category: 'outdoor_advisory',
        title: isExtremeHeat ? 'Crop Thermal Stress & Evapotranspiration Alert' : 'Irrigation & Crop Heat Precaution',
        description:
          'High temperatures accelerate soil moisture depletion. Provide early morning or nocturnal micro-irrigation, ensure shaded ventilation for dairy livestock, and avoid noon chemical spraying.',
        priority: isExtremeHeat ? 'high' : 'medium',
        explanation: `High temperature detected (${weatherData.temperature}°C). Shown because you selected Agriculture.`,
        relevantPersonas: ['agriculture'],
        relevantPersonaLabels: ['Agriculture'],
        weatherTrigger: `Temperature ${weatherData.temperature}°C (Feels like ${weatherData.feelsLike}°C)`,
        icon: '🌾',
        badge: 'Agri Advisory',
      });
    } else if (isRain) {
      recommendations.push({
        id: 'agri_rain_field_drainage',
        category: 'outdoor_advisory',
        title: isHeavyRain ? 'Field Waterlogging & Drainage Alert' : 'Rainfall & Spraying Postponement Advisory',
        description:
          'Precipitation detected. Ensure adequate drainage channels to prevent root asphyxiation, postpone foliar pesticide/fertilizer applications, and safeguard harvested produce.',
        priority: isHeavyRain ? 'high' : 'medium',
        explanation: `Rainfall detected (${weatherData.rainProbability > 0 ? weatherData.rainProbability + '%' : 'Rain'}). Shown because you selected Agriculture.`,
        relevantPersonas: ['agriculture'],
        relevantPersonaLabels: ['Agriculture'],
        weatherTrigger: `Rain ${weatherData.rainProbability}% (${weatherData.rainfall} mm)`,
        icon: '🌾',
        badge: 'Field Advisory',
      });
    } else if (isHighHumidity) {
      recommendations.push({
        id: 'agri_humidity_fungal_risk',
        category: 'outdoor_advisory',
        title: 'Fungal Spore Proliferation & Foliage Moisture Risk',
        description:
          'High relative humidity combined with warm air creates favorable conditions for fungal blight and mildew. Inspect horticultural crops and maintain canopy airflow.',
        priority: 'medium',
        explanation: `High humidity detected (${weatherData.humidity}%). Shown because you selected Agriculture.`,
        relevantPersonas: ['agriculture'],
        relevantPersonaLabels: ['Agriculture'],
        weatherTrigger: `Humidity: ${weatherData.humidity}%`,
        icon: '💧',
        badge: 'Crop Protection',
      });
    } else if (isHighWind) {
      recommendations.push({
        id: 'agri_wind_lodging_alert',
        category: 'outdoor_advisory',
        title: 'Crop Lodging & Chemical Spray Drift Hazard',
        description:
          'High wind speeds cause droplet drift during agrochemical spraying and risk lodging in tall standing crops. Postpone spray operations until wind subsides.',
        priority: 'medium',
        explanation: `Elevated wind speed detected (${weatherData.windSpeed} km/h). Shown because you selected Agriculture.`,
        relevantPersonas: ['agriculture'],
        relevantPersonaLabels: ['Agriculture'],
        weatherTrigger: `Wind: ${weatherData.windSpeed} km/h`,
        icon: '💨',
        badge: 'Spraying Advisory',
      });
    } else if (isComfortableBaseline) {
      recommendations.push({
        id: 'agri_favorable_operations',
        category: 'outdoor_advisory',
        title: 'Favorable Field Operations & Tillage Weather',
        description:
          'Stable temperatures and gentle breeze provide an optimal window for field spraying, harvesting, intercultural operations, and crop drying.',
        priority: 'low',
        explanation: `Calm, dry weather detected. Shown because you selected Agriculture.`,
        relevantPersonas: ['agriculture'],
        relevantPersonaLabels: ['Agriculture'],
        weatherTrigger: `Temp ${weatherData.temperature}°C • Wind ${weatherData.windSpeed} km/h`,
        icon: '🌾',
        badge: 'Agri Favorable',
      });
    }
  }

  // -------------------------------------------------------------------------
  // F. EVENTS PERSONA
  // -------------------------------------------------------------------------
  if (selectedPersonas.includes('events')) {
    if (isRain || weatherData.weatherCondition === 'thunderstorm') {
      recommendations.push({
        id: 'events_rain_waterproofing',
        category: 'outdoor_advisory',
        title: isHeavyRain ? 'Outdoor Event Waterproofing & Contingency Alert' : 'Rain Contingency & Audio-Visual Protection',
        description:
          'Rain forecasted for event venues. Protect outdoor electrical cabling, sound consoles, and stage gear. Ready waterproof marquee sidewalls and covered guest walkthroughs.',
        priority: isHeavyRain ? 'high' : 'medium',
        explanation: `Precipitation detected (${weatherData.rainProbability > 0 ? weatherData.rainProbability + '%' : 'Rain'}). Shown because you selected Events.`,
        relevantPersonas: ['events'],
        relevantPersonaLabels: ['Events'],
        weatherTrigger: `Rain ${weatherData.rainProbability}% (${weatherData.rainfall} mm)`,
        icon: '🎪',
        badge: 'Event Contingency',
      });
    } else if (isHighWind) {
      recommendations.push({
        id: 'events_wind_canopy_safety',
        category: 'outdoor_advisory',
        title: 'Canopy Anchoring & Stage Truss Wind Safety',
        description:
          'High wind velocity exerts substantial aerodynamic lift on temporary event tents, LED video walls, and backdrop banners. Inspect ballast weights and anchor rigging.',
        priority: 'high',
        explanation: `Strong wind detected (${weatherData.windSpeed} km/h). Shown because you selected Events.`,
        relevantPersonas: ['events'],
        relevantPersonaLabels: ['Events'],
        weatherTrigger: `Wind: ${weatherData.windSpeed} km/h ${weatherData.windDirection}`,
        icon: '💨',
        badge: 'Structure Safety',
      });
    } else if (isHeat) {
      recommendations.push({
        id: 'events_heat_guest_comfort',
        category: 'outdoor_advisory',
        title: 'Open-Air Event Shading & Hydration Stations',
        description:
          'High temperatures require adequate guest cooling measures. Deploy misting fans, covered shade awnings, and accessible drinking water stations.',
        priority: 'medium',
        explanation: `High temperature detected (${weatherData.temperature}°C). Shown because you selected Events.`,
        relevantPersonas: ['events'],
        relevantPersonaLabels: ['Events'],
        weatherTrigger: `Temperature ${weatherData.temperature}°C (Feels like ${weatherData.feelsLike}°C)`,
        icon: '🎪',
        badge: 'Guest Comfort',
      });
    } else if (isHighUV && !isHeat) {
      recommendations.push({
        id: 'events_uv_shade_deployment',
        category: 'outdoor_advisory',
        title: 'Sunshade Canopy Deployment for Outdoor Gatherings',
        description:
          'Elevated UV index detected during daylight hours. Ensure open-air guest seating areas are equipped with adequate overhead UV blocking canopies.',
        priority: 'medium',
        explanation: `High UV Index detected (${weatherData.uvIndex}). Shown because you selected Events.`,
        relevantPersonas: ['events'],
        relevantPersonaLabels: ['Events'],
        weatherTrigger: `UV Index: ${weatherData.uvIndex}`,
        icon: '☀️',
        badge: 'Sunshade Advisory',
      });
    } else if (isComfortableBaseline) {
      recommendations.push({
        id: 'events_favorable_staging',
        category: 'outdoor_advisory',
        title: 'Excellent Open-Air Event Staging Weather',
        description:
          'Calm winds, pleasant ambient temperature, and zero precipitation probability create ideal circumstances for outdoor celebrations, exhibitions, and sports meets.',
        priority: 'low',
        explanation: `Favorable calm and dry conditions detected. Shown because you selected Events.`,
        relevantPersonas: ['events'],
        relevantPersonaLabels: ['Events'],
        weatherTrigger: `Temp ${weatherData.temperature}°C • Wind ${weatherData.windSpeed} km/h`,
        icon: '🎪',
        badge: 'Event Favorable',
      });
    }
  }

  // -------------------------------------------------------------------------
  // G. BEACH & OUTDOOR PERSONA ('outdoor')
  // -------------------------------------------------------------------------
  if (selectedPersonas.includes('outdoor')) {
    if (isHighUV) {
      recommendations.push({
        id: 'outdoor_uv_sun_protection',
        category: 'outdoor_advisory',
        title: isExtremeUV ? 'Severe Coastal UV Radiation Warning' : 'Beach & Outdoor Solar Radiation Advisory',
        description:
          'High UV reflection off sand and water intensifies solar radiation exposure. Use broad-spectrum sunscreen, wide-brim hats, polarized eyewear, and beach umbrellas.',
        priority: isExtremeUV ? 'high' : 'medium',
        explanation: `High UV Index detected (${weatherData.uvIndex} of 12). Shown because you selected Beach & Outdoor.`,
        relevantPersonas: ['outdoor'],
        relevantPersonaLabels: ['Beach & Outdoor'],
        weatherTrigger: `UV Index: ${weatherData.uvIndex} (Scale 0-12)`,
        icon: '🏖️',
        badge: 'Beach Solar Alert',
      });
    } else if (isHighWind) {
      recommendations.push({
        id: 'outdoor_wind_surf_hazard',
        category: 'outdoor_advisory',
        title: 'Coastal Wind Gusts & Water Activity Precaution',
        description:
          'Strong wind conditions generate choppy surf, rip currents, and high spray. Exercise vigilance with beach umbrellas, paddleboards, and small watercraft.',
        priority: isSevereWind ? 'high' : 'medium',
        explanation: `Strong wind detected (${weatherData.windSpeed} km/h). Shown because you selected Beach & Outdoor.`,
        relevantPersonas: ['outdoor'],
        relevantPersonaLabels: ['Beach & Outdoor'],
        weatherTrigger: `Wind Speed: ${weatherData.windSpeed} km/h ${weatherData.windDirection}`,
        icon: '💨',
        badge: 'Surf & Wind',
      });
    } else if (isHeat) {
      recommendations.push({
        id: 'outdoor_heat_sunstroke_precaution',
        category: 'outdoor_advisory',
        title: 'Open Recreation Sunstroke & Heat Precaution',
        description:
          'High ambient heat increases sunstroke vulnerability during open-air recreation. Limit peak-hour exposure and replenish fluids frequently.',
        priority: 'medium',
        explanation: `High temperature detected (${weatherData.temperature}°C). Shown because you selected Beach & Outdoor.`,
        relevantPersonas: ['outdoor'],
        relevantPersonaLabels: ['Beach & Outdoor'],
        weatherTrigger: `Temperature ${weatherData.temperature}°C (Feels like ${weatherData.feelsLike}°C)`,
        icon: '🏖️',
        badge: 'Thermal Alert',
      });
    } else if (isRain) {
      recommendations.push({
        id: 'outdoor_rain_postponement',
        category: 'outdoor_advisory',
        title: 'Outdoor Recreation & Beach Outing Postponement',
        description:
          'Rain and squally conditions degrade trail traction and beach comfort. Postpone watersports and coastal excursions until weather clears.',
        priority: 'medium',
        explanation: `Precipitation detected. Shown because you selected Beach & Outdoor.`,
        relevantPersonas: ['outdoor'],
        relevantPersonaLabels: ['Beach & Outdoor'],
        weatherTrigger: `Rain ${weatherData.rainProbability}% (${weatherData.rainfall} mm)`,
        icon: '🏖️',
        badge: 'Recreation Notice',
      });
    } else if (isComfortableBaseline) {
      recommendations.push({
        id: 'outdoor_ideal_recreation',
        category: 'outdoor_advisory',
        title: 'Ideal Conditions for Beach & Outdoor Excursions',
        description:
          'Gentle breeze, comfortable temperature, and clear skies offer prime weather for beach outings, nature trails, picnics, and outdoor photography.',
        priority: 'low',
        explanation: `Pleasant clear conditions detected (${weatherData.temperature}°C). Shown because you selected Beach & Outdoor.`,
        relevantPersonas: ['outdoor'],
        relevantPersonaLabels: ['Beach & Outdoor'],
        weatherTrigger: `Temp ${weatherData.temperature}°C • Clear Skies`,
        icon: '🏖️',
        badge: 'Outdoor Favorable',
      });
    }
  }

  // -------------------------------------------------------------------------
  // H. FAMILY PERSONA ('family')
  // -------------------------------------------------------------------------
  if (selectedPersonas.includes('family')) {
    if (isHeat) {
      recommendations.push({
        id: 'family_heat_dependent_care',
        category: 'health_comfort',
        title: isExtremeHeat ? 'Child & Senior Heatwave Protection' : 'Family Routine Thermal Precaution',
        description:
          'Young children and elder dependents regulate thermal stress less effectively. Keep kids shaded during park play, ensure air-conditioned rooms, and carry cold water.',
        priority: isExtremeHeat ? 'high' : 'medium',
        explanation: `High temperature detected (${weatherData.temperature}°C). Shown because you selected Family.`,
        relevantPersonas: ['family'],
        relevantPersonaLabels: ['Family'],
        weatherTrigger: `Temperature ${weatherData.temperature}°C (Feels like ${weatherData.feelsLike}°C)`,
        icon: '👨‍👩‍👧‍👦',
        badge: 'Family Safety',
      });
    } else if (isRain) {
      recommendations.push({
        id: 'family_rain_school_transit',
        category: 'commute_impact',
        title: 'School Transit & Family Rainwear Precaution',
        description:
          'Wet roadways and rain showers anticipated. Equip children with rain gear, waterproof footwear, and allow extra time for school and household transit.',
        priority: 'medium',
        explanation: `Rainfall detected. Shown because you selected Family.`,
        relevantPersonas: ['family'],
        relevantPersonaLabels: ['Family'],
        weatherTrigger: `Rain ${weatherData.rainProbability}% (${weatherData.rainfall} mm)`,
        icon: '👨‍👩‍👧‍👦',
        badge: 'Family Routine',
      });
    } else if (isHighUV && !isHeat) {
      recommendations.push({
        id: 'family_uv_child_protection',
        category: 'health_comfort',
        title: 'Child Sunscreen & Sun Hat Advisory',
        description:
          'High UV index requires sensitive skin protection for toddlers and children. Apply kid-safe mineral sunscreen and provide shade during playground trips.',
        priority: 'medium',
        explanation: `High UV Index detected (${weatherData.uvIndex}). Shown because you selected Family.`,
        relevantPersonas: ['family'],
        relevantPersonaLabels: ['Family'],
        weatherTrigger: `UV Index: ${weatherData.uvIndex}`,
        icon: '👨‍👩‍👧‍👦',
        badge: 'Child UV Care',
      });
    } else if (isLowVisibility) {
      recommendations.push({
        id: 'family_fog_school_transit',
        category: 'commute_impact',
        title: 'Morning School Transit Fog Precaution',
        description:
          'Reduced road sightlines during morning hours. Exercise extra caution during family drop-offs and ensure school bus safety lights are active.',
        priority: 'medium',
        explanation: `Reduced visibility/fog detected. Shown because you selected Family.`,
        relevantPersonas: ['family'],
        relevantPersonaLabels: ['Family'],
        weatherTrigger: `Visibility: ${weatherData.visibility} km`,
        icon: '👨‍👩‍👧‍👦',
        badge: 'School Transit',
      });
    } else if (isComfortableBaseline) {
      recommendations.push({
        id: 'family_ideal_outing_weather',
        category: 'health_comfort',
        title: 'Great Weather for Outdoor Family Activities',
        description:
          'Comfortable temperatures and clear skies create perfect conditions for weekend park visits, playground trips, and family picnics.',
        priority: 'low',
        explanation: `Comfortable pleasant weather detected. Shown because you selected Family.`,
        relevantPersonas: ['family'],
        relevantPersonaLabels: ['Family'],
        weatherTrigger: `Temp ${weatherData.temperature}°C • Pleasant`,
        icon: '👨‍👩‍👧‍👦',
        badge: 'Family Favorable',
      });
    }
  }

  // =========================================================================
  // 4. PREFERENCE INFORMATIONAL CHECKS
  // Emits genuine informational cards when user monitors specific optional
  // parameters (e.g. Solar schedule).
  // =========================================================================
  if (selectedPreferences.includes('sun_times')) {
    recommendations.push({
      id: 'info_sun_times_schedule',
      category: 'general_info',
      title: 'Solar & Daylight Schedule',
      description: `First light / sunrise at ${weatherData.sunrise}, evening civil twilight sunset at ${weatherData.sunset}. Plan outdoor lighting accordingly.`,
      priority: 'low',
      explanation: 'Shown because you monitor Sunrise & Sunset preferences.',
      relevantPersonas: [],
      relevantPersonaLabels: ['Preference Tracked'],
      weatherTrigger: `Sunrise: ${weatherData.sunrise} • Sunset: ${weatherData.sunset}`,
      icon: '🌅',
      badge: 'Daylight Schedule',
    });
  }

  // =========================================================================
  // 5. ACTIVITY-SPECIFIC RECOMMENDATIONS (Phase 26)
  // Transparent, explainable rule-based recommendations matching the user's
  // selected activities against meteorological triggers.
  // Critical severe weather safety always maintains higher priority (critical).
  // =========================================================================

  // A. Running
  if (selectedActivities.includes('running')) {
    if (isHeat) {
      recommendations.push({
        id: 'activity_running_heat',
        category: 'fitness_window',
        title: 'Running Thermal Precaution',
        description: 'High temperatures detected. Schedule outdoor runs during early morning or evening hours, and maintain electrolyte hydration.',
        priority: 'medium',
        explanation: 'You selected Running, so running-related weather information is prioritized on your homepage.',
        relevantPersonas: [],
        relevantPersonaLabels: ['Activity: Running'],
        weatherTrigger: `Temperature ${weatherData.temperature}°C (Feels like ${weatherData.feelsLike}°C)`,
        icon: '🏃',
        badge: 'Running Window',
      });
    } else if (isRain) {
      recommendations.push({
        id: 'activity_running_rain',
        category: 'fitness_window',
        title: 'Wet Surface Precaution for Running',
        description: 'Rain showers and slick pavements detected. Consider water-resistant footwear or an indoor treadmill session.',
        priority: 'medium',
        explanation: 'You selected Running, so running-related weather information is prioritized on your homepage.',
        relevantPersonas: [],
        relevantPersonaLabels: ['Activity: Running'],
        weatherTrigger: `Precipitation Active • Rain Probability ${weatherData.rainProbability}%`,
        icon: '🏃',
        badge: 'Running Advisory',
      });
    } else if (isComfortableBaseline) {
      recommendations.push({
        id: 'activity_running_optimal',
        category: 'fitness_window',
        title: 'Optimal Running Conditions',
        description: 'Pleasant temperatures and clear outdoor conditions provide an excellent window for running and jogging.',
        priority: 'low',
        explanation: 'You selected Running, so running-related weather information is prioritized on your homepage.',
        relevantPersonas: [],
        relevantPersonaLabels: ['Activity: Running'],
        weatherTrigger: `Comfortable Temp ${weatherData.temperature}°C • Clear`,
        icon: '🏃',
        badge: 'Running Favorable',
      });
    }
  }

  // B. Cycling
  if (selectedActivities.includes('cycling')) {
    if (isHighWind) {
      recommendations.push({
        id: 'activity_cycling_wind',
        category: 'outdoor_advisory',
        title: 'Crosswind Precaution for Cycling',
        description: `Elevated wind gusts (${weatherData.windSpeed} km/h) can cause instability on open roadways and bridges.`,
        priority: 'medium',
        explanation: 'You selected Cycling, so cycling-related weather information is prioritized on your homepage.',
        relevantPersonas: [],
        relevantPersonaLabels: ['Activity: Cycling'],
        weatherTrigger: `Wind Speed: ${weatherData.windSpeed} km/h`,
        icon: '🚴',
        badge: 'Cycling Wind',
      });
    } else if (isRain) {
      recommendations.push({
        id: 'activity_cycling_rain',
        category: 'outdoor_advisory',
        title: 'Reduced Road Traction for Cycling',
        description: 'Wet surfaces increase braking distances and decrease road grip. Use proper bike illumination and ride with caution.',
        priority: 'medium',
        explanation: 'You selected Cycling, so cycling-related weather information is prioritized on your homepage.',
        relevantPersonas: [],
        relevantPersonaLabels: ['Activity: Cycling'],
        weatherTrigger: `Rainfall: ${weatherData.rainfall} mm`,
        icon: '🚴',
        badge: 'Cycling Advisory',
      });
    } else if (isComfortableBaseline) {
      recommendations.push({
        id: 'activity_cycling_optimal',
        category: 'outdoor_advisory',
        title: 'Great Cycling Weather',
        description: 'Gentle winds and clear skies offer pleasant conditions for road and recreational cycling.',
        priority: 'low',
        explanation: 'You selected Cycling, so cycling-related weather information is prioritized on your homepage.',
        relevantPersonas: [],
        relevantPersonaLabels: ['Activity: Cycling'],
        weatherTrigger: `Wind ${weatherData.windSpeed} km/h • Mild ${weatherData.temperature}°C`,
        icon: '🚴',
        badge: 'Cycling Favorable',
      });
    }
  }

  // C. Walking
  if (selectedActivities.includes('walking')) {
    if (isHeat) {
      recommendations.push({
        id: 'activity_walking_heat',
        category: 'health_comfort',
        title: 'Walking Midday Sun Advisory',
        description: 'Warm conditions during peak midday hours. Choose shaded walking routes and carry water.',
        priority: 'medium',
        explanation: 'You selected Walking, so walking-related weather information is prioritized on your homepage.',
        relevantPersonas: [],
        relevantPersonaLabels: ['Activity: Walking'],
        weatherTrigger: `Temp ${weatherData.temperature}°C`,
        icon: '🚶',
        badge: 'Walking Advisory',
      });
    } else if (isRain) {
      recommendations.push({
        id: 'activity_walking_rain',
        category: 'health_comfort',
        title: 'Rain Gear Advisory for Walks',
        description: 'Precipitation active. Carry an umbrella or rain jacket for outdoor walking commutes.',
        priority: 'medium',
        explanation: 'You selected Walking, so walking-related weather information is prioritized on your homepage.',
        relevantPersonas: [],
        relevantPersonaLabels: ['Activity: Walking'],
        weatherTrigger: `Rainfall ${weatherData.rainfall} mm`,
        icon: '🚶',
        badge: 'Walking Advisory',
      });
    } else if (isComfortableBaseline) {
      recommendations.push({
        id: 'activity_walking_optimal',
        category: 'health_comfort',
        title: 'Ideal Weather for Outdoor Walks',
        description: 'Comfortable temperature and clear skies make this a great time for daily walks in the park.',
        priority: 'low',
        explanation: 'You selected Walking, so walking-related weather information is prioritized on your homepage.',
        relevantPersonas: [],
        relevantPersonaLabels: ['Activity: Walking'],
        weatherTrigger: `Temp ${weatherData.temperature}°C • Pleasant`,
        icon: '🚶',
        badge: 'Walking Favorable',
      });
    }
  }

  // D. Outdoor Exercise
  if (selectedActivities.includes('outdoor_exercise')) {
    if (isHighUV) {
      recommendations.push({
        id: 'activity_exercise_uv',
        category: 'fitness_window',
        title: 'UV Protection for Outdoor Exercise',
        description: `High solar UV index (${weatherData.uvIndex}). Apply sunscreen and seek shade during workout intervals.`,
        priority: 'medium',
        explanation: 'You selected Outdoor Exercise, so outdoor exercise weather information is prioritized on your homepage.',
        relevantPersonas: [],
        relevantPersonaLabels: ['Activity: Outdoor Exercise'],
        weatherTrigger: `UV Index: ${weatherData.uvIndex}`,
        icon: '💪',
        badge: 'Exercise UV',
      });
    }
  }

  // E. Gardening
  if (selectedActivities.includes('gardening')) {
    if (isRain) {
      recommendations.push({
        id: 'activity_gardening_rain',
        category: 'agri_advisory',
        title: 'Rainfall & Soil Moisture for Gardening',
        description: 'Natural rainfall active. Pause automated irrigation and inspect outdoor container drainage.',
        priority: 'medium',
        explanation: 'You selected Gardening, so gardening-related weather information is prioritized on your homepage.',
        relevantPersonas: [],
        relevantPersonaLabels: ['Activity: Gardening'],
        weatherTrigger: `Rainfall: ${weatherData.rainfall} mm`,
        icon: '🌱',
        badge: 'Garden Advisory',
      });
    } else if (isHeat) {
      recommendations.push({
        id: 'activity_gardening_heat',
        category: 'agri_advisory',
        title: 'Soil Evaporation & Plant Hydration',
        description: 'High heat accelerates soil drying. Deep-water sensitive potted plants in early morning or late evening.',
        priority: 'medium',
        explanation: 'You selected Gardening, so gardening-related weather information is prioritized on your homepage.',
        relevantPersonas: [],
        relevantPersonaLabels: ['Activity: Gardening'],
        weatherTrigger: `Temp ${weatherData.temperature}°C`,
        icon: '🌱',
        badge: 'Plant Care',
      });
    }
  }

  // F. Beach & Water Activities
  if (selectedActivities.includes('beach_water')) {
    if (isHighWind || isRain) {
      recommendations.push({
        id: 'activity_beach_caution',
        category: 'outdoor_advisory',
        title: 'Rough Water & Coastal Precaution',
        description: 'Elevated winds or rainfall present. Observe lifeguard beach flags and exercise caution near open water.',
        priority: 'medium',
        explanation: 'You selected Beach & Water Activities, so water-related weather information is prioritized on your homepage.',
        relevantPersonas: [],
        relevantPersonaLabels: ['Activity: Beach & Water'],
        weatherTrigger: `Wind ${weatherData.windSpeed} km/h • Condition: ${weatherData.weatherCondition}`,
        icon: '🏖️',
        badge: 'Coastal Advisory',
      });
    } else if (isHighUV) {
      recommendations.push({
        id: 'activity_beach_uv',
        category: 'outdoor_advisory',
        title: 'Water Surface UV Reflection Precaution',
        description: 'Water and sand reflect intense UV rays. Wear SPF 50+ sunscreen, UV sunglasses, and protective rash guards.',
        priority: 'medium',
        explanation: 'You selected Beach & Water Activities, so water-related weather information is prioritized on your homepage.',
        relevantPersonas: [],
        relevantPersonaLabels: ['Activity: Beach & Water'],
        weatherTrigger: `UV Index: ${weatherData.uvIndex}`,
        icon: '🏖️',
        badge: 'Beach UV',
      });
    }
  }

  // G. Photography
  if (selectedActivities.includes('photography')) {
    if (isLowVisibility) {
      recommendations.push({
        id: 'activity_photography_fog',
        category: 'general_info',
        title: 'Atmospheric Fog Photography Window',
        description: 'Dense mist and fog create moody, dramatic diffused lighting for landscape and architectural photography.',
        priority: 'low',
        explanation: 'You selected Photography, so photography lighting information is prioritized on your homepage.',
        relevantPersonas: [],
        relevantPersonaLabels: ['Activity: Photography'],
        weatherTrigger: `Visibility: ${weatherData.visibility} km • Fog`,
        icon: '📸',
        badge: 'Photo Lighting',
      });
    } else if (isRain) {
      recommendations.push({
        id: 'activity_photography_rain',
        category: 'general_info',
        title: 'Moisture Protection for Camera Gear',
        description: 'Active precipitation. Protect cameras and lenses with waterproof covers or capture from sheltered vantage points.',
        priority: 'medium',
        explanation: 'You selected Photography, so photography weather information is prioritized on your homepage.',
        relevantPersonas: [],
        relevantPersonaLabels: ['Activity: Photography'],
        weatherTrigger: `Rain ${weatherData.rainfall} mm`,
        icon: '📸',
        badge: 'Gear Protection',
      });
    }
  }

  // H. Events & Functions
  if (selectedActivities.includes('events')) {
    if (isRain) {
      recommendations.push({
        id: 'activity_events_rain',
        category: 'event_risk',
        title: 'Outdoor Event Rain Contingency Notice',
        description: 'Precipitation active. Confirm waterproof canopies and check electrical equipment shelter for planned functions.',
        priority: isHeavyRain ? 'high' : 'medium',
        explanation: 'You selected Events & Functions, so event weather planning information is prioritized on your homepage.',
        relevantPersonas: [],
        relevantPersonaLabels: ['Activity: Events & Functions'],
        weatherTrigger: `Rainfall: ${weatherData.rainfall} mm`,
        icon: '🎪',
        badge: 'Event Risk',
      });
    }
  }

  // I. Commuting
  if (selectedActivities.includes('commuting')) {
    if (isRain || isLowVisibility) {
      recommendations.push({
        id: 'activity_commuting_transit',
        category: 'commute_impact',
        title: 'Daily Commute Transit Advisory',
        description: 'Wet roadways and reduced sightlines can add delay to daily transit schedules. Plan additional travel buffer.',
        priority: 'medium',
        explanation: 'You selected Commuting, so commuter weather information is prioritized on your homepage.',
        relevantPersonas: [],
        relevantPersonaLabels: ['Activity: Commuting'],
        weatherTrigger: `Rain: ${weatherData.rainfall} mm • Vis: ${weatherData.visibility} km`,
        icon: '🚆',
        badge: 'Commute Impact',
      });
    }
  }

  // J. Outdoor Sports
  if (selectedActivities.includes('outdoor_sports')) {
    if (isHeat) {
      recommendations.push({
        id: 'activity_sports_heat',
        category: 'outdoor_advisory',
        title: 'Sports Hydration & Cramp Precaution',
        description: 'High temperatures increase dehydration and cramping risk during field sports. Institute mandatory water breaks.',
        priority: 'medium',
        explanation: 'You selected Outdoor Sports, so sports weather information is prioritized on your homepage.',
        relevantPersonas: [],
        relevantPersonaLabels: ['Activity: Outdoor Sports'],
        weatherTrigger: `Temperature ${weatherData.temperature}°C`,
        icon: '⚽',
        badge: 'Sports Advisory',
      });
    } else if (isRain) {
      recommendations.push({
        id: 'activity_sports_turf',
        category: 'outdoor_advisory',
        title: 'Turf & Court Playability Notice',
        description: 'Active precipitation may cause muddy pitch conditions or slippery court surfaces.',
        priority: 'medium',
        explanation: 'You selected Outdoor Sports, so sports weather information is prioritized on your homepage.',
        relevantPersonas: [],
        relevantPersonaLabels: ['Activity: Outdoor Sports'],
        weatherTrigger: `Rainfall ${weatherData.rainfall} mm`,
        icon: '⚽',
        badge: 'Court Surface',
      });
    }
  }

  // K. Family / Kids Outdoor Time
  if (selectedActivities.includes('family_outdoor')) {
    if (isHighUV) {
      recommendations.push({
        id: 'activity_family_uv',
        category: 'family_routine',
        title: 'Child UV Protection for Outdoor Play',
        description: 'Young skin is especially susceptible to solar radiation. Apply child-safe sunscreen and choose shaded playgrounds.',
        priority: 'medium',
        explanation: 'You selected Family / Kids Outdoor Time, so family weather recommendations are prioritized on your homepage.',
        relevantPersonas: [],
        relevantPersonaLabels: ['Activity: Family Outdoor Time'],
        weatherTrigger: `UV Index: ${weatherData.uvIndex}`,
        icon: '👨‍👩‍👧‍👦',
        badge: 'Child Sun Care',
      });
    } else if (isComfortableBaseline) {
      recommendations.push({
        id: 'activity_family_optimal',
        category: 'family_routine',
        title: 'Favorable Window for Family Park Outings',
        description: 'Pleasant temperatures and clear skies create great conditions for family playground time and outdoor walks.',
        priority: 'low',
        explanation: 'You selected Family / Kids Outdoor Time, so family outdoor timing is prioritized on your homepage.',
        relevantPersonas: [],
        relevantPersonaLabels: ['Activity: Family Outdoor Time'],
        weatherTrigger: `Temp ${weatherData.temperature}°C • Pleasant`,
        icon: '👨‍👩‍👧‍👦',
        badge: 'Family Window',
      });
    }
  }

  // L. Travel
  if (selectedActivities.includes('travel')) {
    if (isLowVisibility || isHeavyRain) {
      recommendations.push({
        id: 'activity_travel_visibility',
        category: 'travel_visibility',
        title: 'Travel Corridor Weather Precaution',
        description: 'Sub-optimal visibility and heavy showers along travel corridors. Check flight and transit advisories.',
        priority: 'medium',
        explanation: 'You selected Travel, so travel weather conditions are prioritized on your homepage.',
        relevantPersonas: [],
        relevantPersonaLabels: ['Activity: Travel'],
        weatherTrigger: `Visibility: ${weatherData.visibility} km • Rain: ${weatherData.rainfall} mm`,
        icon: '✈️',
        badge: 'Travel Corridor',
      });
    }
  }

  // =========================================================================
  // 6. DETERMINISTIC SORTING
  // 1. Critical safety (0)
  // 2. High priority impact (1)
  // 3. Medium persona/activity condition (2)
  // 4. Low informational (3)
  // Secondary sort by ID for absolute determinism.
  // =========================================================================
  return recommendations.sort((a, b) => {
    const weightDiff = PRIORITY_WEIGHTS[a.priority] - PRIORITY_WEIGHTS[b.priority];
    if (weightDiff !== 0) {
      return weightDiff;
    }
    return a.id.localeCompare(b.id);
  });
};
