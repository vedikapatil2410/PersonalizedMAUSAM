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

  // Determine source type based on mode
  const sourceType: DataSourceType = dataMode === 'live' ? 'live_imd' : 'demo_scenario';

  // Classify each field as available or missing
  const fieldKeys = Object.keys(weatherData) as (keyof typeof weatherData)[];
  const availableFields: DataFieldStatus[] = [];
  const unavailableFields: DataFieldStatus[] = [];

  fieldKeys.forEach((key) => {
    const value = weatherData[key];
    const label = String(key);
    if (value !== null && value !== undefined) {
      availableFields.push({
        label,
        available: true,
        source: sourceType,
        reason: 'Provided by current weather payload',
        value,
      });
    } else {
      unavailableFields.push({
        label,
        available: false,
        source: sourceType,
        reason: dataMode === 'live'
          ? 'Not supplied by the current live IMD observation.'
          : 'Field omitted in demo scenario payload.',
        value: null,
      });
    }
  });

  const safetyOverrideActive = weatherData.severity === 'severe';

  const summary: DataSourceSummary = {
    dataMode,
    sourceName: dataMode === 'live' ? 'Official IMD' : 'Demo Scenario',
    // scenarioId is optional; not available from current input
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
