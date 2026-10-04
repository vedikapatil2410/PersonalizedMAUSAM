import React from 'react';
import { View, Text } from 'react-native';
import { ScreenContainer } from '../components/ui/ScreenContainer';
import type { RootStackScreenProps } from '../navigation/types';

export const TravelerScreen: React.FC<RootStackScreenProps<'Traveler'>> = ({ navigation }) => {
  return (
    <ScreenContainer
      title="Traveler"
      subtitle="Transit route visibility and corridor weather"
      onBack={() => navigation.goBack()}
    >
      <View className="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-5 mb-4">
        <Text className="text-sm font-semibold text-white mb-2">
          Traveler Screen Placeholder
        </Text>
        <Text className="text-xs text-slate-400 leading-5">
          In subsequent phases, this screen will deliver highway visibility indicators, fog warnings, monsoon route delays, and departure suggestions.
        </Text>
      </View>
    </ScreenContainer>
  );
};
