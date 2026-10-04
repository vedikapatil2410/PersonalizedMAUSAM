import React from 'react';
import { View, Text } from 'react-native';
import type { DataFieldStatus } from '../../types/dataTransparency';

/**
 * Card displaying the availability status of a single weather data field.
 */
export const DataAvailabilityCard: React.FC<{ field: DataFieldStatus }> = ({ field }) => {
  const { label, available, source, reason, value } = field;
  const statusColor = available ? 'bg-green-500/20 border-green-500/40' : 'bg-red-500/20 border-red-500/40';
  const statusText = available ? 'Available' : 'Missing';

  return (
    <View className={`rounded-lg border p-3 mb-2 ${statusColor}`} accessible accessibilityLabel={`${label} field ${statusText}`}> 
      <View className="flex-row justify-between items-center mb-1">
        <Text className="text-sm font-medium text-slate-200">{label}</Text>
        <Text className={`text-xs font-semibold uppercase ${available ? 'text-green-300' : 'text-red-300'}`}>{statusText}</Text>
      </View>
      <Text className="text-xs text-slate-400 mb-1">Source: {source}</Text>
      {reason && <Text className="text-xs text-slate-400">{reason}</Text>}
      {available && (
        <Text className="text-xs text-slate-300 mt-1">Value: {JSON.stringify(value)}</Text>
      )}
    </View>
  );
};
