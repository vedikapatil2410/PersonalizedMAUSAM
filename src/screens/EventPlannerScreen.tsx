import React from 'react';
import { View, Text } from 'react-native';
import { ScreenContainer } from '../components/ui/ScreenContainer';
import type { RootStackScreenProps } from '../navigation/types';

export const EventPlannerScreen: React.FC<RootStackScreenProps<'EventPlanner'>> = ({ navigation }) => {
  return (
    <ScreenContainer
      title="Event Planner"
      subtitle="Weather feasibility for outdoor gatherings and ceremonies"
      onBack={() => navigation.goBack()}
    >
      <View className="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-5 mb-4">
        <Text className="text-sm font-semibold text-white mb-2">
          Event Planner Screen Placeholder
        </Text>
        <Text className="text-xs text-slate-400 leading-5">
          In subsequent phases, this screen will calculate event risk indices, rainfall probabilities, gust warnings, and indoor-backup recommendations for upcoming events.
        </Text>
      </View>
    </ScreenContainer>
  );
};
