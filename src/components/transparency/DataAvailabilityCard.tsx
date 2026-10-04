import React from 'react';
import { View, Text } from 'react-native';
import type { DataFieldStatus, DataSourceType } from '../../types/dataTransparency';

const SOURCE_LABELS: Record<DataSourceType, string> = {
  live_imd: 'Official IMD Observation',
  open_meteo: 'Open-Meteo API (Enrichment)',
  google_pollen: 'Google Pollen API (Enrichment)',
  demo_scenario: 'Demo Weather Scenario',
  rule_personalization: 'Rule Personalization',
  safety_override: 'Safety Override',
  user_preferences: 'User Preferences',
};

/**
 * Card displaying the availability status of a single weather data field.
 */
export const DataAvailabilityCard: React.FC<{ field: DataFieldStatus }> = ({ field }) => {
  const { label, available, source, reason, value } = field;
  const statusColor = available ? 'bg-emerald-500/15 border-emerald-500/40' : 'bg-rose-500/15 border-rose-500/40';
  const statusText = available ? 'Available' : 'Missing';
  const friendlySource = SOURCE_LABELS[source] || source;

  return (
    <View
      className={`rounded-lg border p-3 mb-2 ${statusColor}`}
      accessible
      accessibilityLabel={`${label} field ${statusText}`}
    >
      <View className="flex-row justify-between items-center mb-1">
        <Text className="text-sm font-semibold text-slate-200">{label}</Text>
        <Text
          className={`text-xs font-bold uppercase ${
            available ? 'text-emerald-400' : 'text-rose-400'
          }`}
        >
          {statusText}
        </Text>
      </View>
      <Text className="text-xs text-sky-400 font-medium mb-1">Source: {friendlySource}</Text>
      {reason && <Text className="text-xs text-slate-400 mb-1">{reason}</Text>}
      {available && (
        <Text className="text-xs text-slate-200 font-medium mt-0.5">
          Value: {typeof value === 'object' ? JSON.stringify(value) : String(value)}
        </Text>
      )}
    </View>
  );
};
