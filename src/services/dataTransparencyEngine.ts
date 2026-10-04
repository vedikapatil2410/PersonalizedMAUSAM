import type { DataTransparencyInput, DataSourceSummary, DataSourceType, DataFieldStatus } from '../types/dataTransparency';

/**
 * Generate a transparency summary describing the origin of weather data,
 * the availability of each field, the source of personalization logic,
 * safety overrides, and alert pipeline.
 * Pure deterministic function – no side‑effects.
 */
export const generateDataTransparencySummary = (
  input: DataTransparencyInput,
): DataSourceSummary => {
  const { weatherData, dataMode, selectedLocation } = input;

  const availableFields: DataFieldStatus[] = [];
  const unavailableFields: DataFieldStatus[] = [];

  // 1. Core IMD Observation Metrics
  const coreFields: Array<{ key: keyof typeof weatherData; label: string; unit?: string }> = [
    { key: 'temperature', label: 'Temperature', unit: '°C' },
    { key: 'feelsLike', label: 'Feels Like', unit: '°C' },
    { key: 'humidity', label: 'Relative Humidity', unit: '%' },
    { key: 'windSpeed', label: 'Wind Speed', unit: ' km/h' },
    { key: 'windDirection', label: 'Wind Direction' },
    { key: 'weatherCondition', label: 'Weather Condition' },
    { key: 'sunrise', label: 'Sunrise' },
    { key: 'sunset', label: 'Sunset' },
  ];

  for (const item of coreFields) {
    const val = weatherData[item.key];
    if (val !== null && val !== undefined) {
      availableFields.push({
        label: item.label,
        available: true,
        source: dataMode === 'live' ? 'live_imd' : 'demo_scenario',
        reason: dataMode === 'live'
          ? 'Confirmed observation from official IMD automated station.'
          : 'Deterministic value from selected demo scenario.',
        value: item.unit ? `${val}${item.unit}` : val,
      });
    } else {
      unavailableFields.push({
        label: item.label,
        available: false,
        source: dataMode === 'live' ? 'live_imd' : 'demo_scenario',
        reason: 'Metric omitted or unrecorded.',
        value: null,
      });
    }
  }

  // 2. Solar UV Index (Enriched via Open-Meteo)
  if (dataMode === 'live') {
    if (weatherData.externalData?.openMeteo?.available && weatherData.externalData.openMeteo.data) {
      availableFields.push({
        label: 'Solar UV Index',
        available: true,
        source: 'open_meteo',
        reason: 'Real-time solar UV index enriched via Open-Meteo API.',
        value: `${weatherData.uvIndex} of 12`,
      });
    } else {
      unavailableFields.push({
        label: 'Solar UV Index',
        available: false,
        source: 'open_meteo',
        reason: 'Open-Meteo UV enrichment service temporarily unavailable.',
        value: null,
      });
    }
  } else {
    availableFields.push({
      label: 'Solar UV Index',
      available: true,
      source: 'demo_scenario',
      reason: 'Deterministic UV index from demo scenario.',
      value: `${weatherData.uvIndex} of 12`,
    });
  }

  // 3. Atmospheric Visibility (Enriched via Open-Meteo)
  if (dataMode === 'live') {
    if (weatherData.externalData?.openMeteo?.available && weatherData.externalData.openMeteo.data) {
      availableFields.push({
        label: 'Atmospheric Visibility',
        available: true,
        source: 'open_meteo',
        reason: 'Atmospheric visibility distance enriched via Open-Meteo API.',
        value: `${weatherData.visibility} km`,
      });
    } else {
      unavailableFields.push({
        label: 'Atmospheric Visibility',
        available: false,
        source: 'open_meteo',
        reason: 'Open-Meteo visibility enrichment service temporarily unavailable.',
        value: null,
      });
    }
  } else {
    availableFields.push({
      label: 'Atmospheric Visibility',
      available: true,
      source: 'demo_scenario',
      reason: 'Deterministic visibility from demo scenario.',
      value: `${weatherData.visibility} km`,
    });
  }

  // 4. Pollen Forecast & Allergens (Enriched via Google Pollen API)
  if (dataMode === 'live') {
    if (weatherData.externalData?.pollen?.available && weatherData.externalData.pollen.data) {
      availableFields.push({
        label: 'Pollen Index & Allergens',
        available: true,
        source: 'google_pollen',
        reason: 'Airborne pollen forecast enriched via Google Pollen API.',
        value: `${weatherData.externalData.pollen.data.dominantPollenType} (${weatherData.externalData.pollen.data.category}, Index ${weatherData.externalData.pollen.data.indexValue}/5)`,
      });
    } else {
      unavailableFields.push({
        label: 'Pollen Index & Allergens',
        available: false,
        source: 'google_pollen',
        reason: weatherData.externalData?.pollen?.error || 'GOOGLE_POLLEN_API_KEY is not configured on backend environment.',
        value: null,
      });
    }
  } else {
    unavailableFields.push({
      label: 'Pollen Index & Allergens',
      available: false,
      source: 'demo_scenario',
      reason: 'Pollen index not simulated in prototype demo scenarios.',
      value: null,
    });
  }

  // 5. Rainfall Accumulation & Probability (IMD Observation Constraints)
  if (dataMode === 'live') {
    unavailableFields.push({
      label: 'Rain Probability',
      available: false,
      source: 'live_imd',
      reason: 'Instantaneous IMD observations record current weather, not probabilistic forecasts.',
      value: null,
    });
  } else {
    availableFields.push({
      label: 'Rain Probability',
      available: true,
      source: 'demo_scenario',
      reason: 'Scenario modeled rain probability.',
      value: `${weatherData.rainProbability}%`,
    });
  }

  const safetyOverrideActive = weatherData.severity === 'severe';

  const summary: DataSourceSummary = {
    dataMode,
    sourceName: dataMode === 'live'
      ? weatherData.externalData?.openMeteo?.available
        ? 'Official IMD (Enriched via Open-Meteo)'
        : 'Official IMD Observation'
      : 'Demo Scenario',
    scenarioId: undefined,
    activeLocation: selectedLocation,
    isLiveAvailable: dataMode === 'live',
    availableFields,
    unavailableFields,
    personalizationEngineType: 'Rule‑Based Personalization',
    safetyOverrideActive,
    timestamp: weatherData.timestamp,
    selectedActivities: input.selectedActivities || [],
  };

  return summary;
};
