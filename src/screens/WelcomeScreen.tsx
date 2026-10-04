import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { ScreenContainer } from '../components/ui/ScreenContainer';
import type { RootStackScreenProps } from '../navigation/types';

export const WelcomeScreen: React.FC<RootStackScreenProps<'Welcome'>> = ({ navigation }) => {
  return (
    <ScreenContainer scrollable={false}>
      <View className="flex-1 justify-between py-6">
        <View className="items-center mt-6">
          {/* Badge */}
          <View className="bg-sky-500/10 border border-sky-500/20 px-3.5 py-1.5 rounded-full mb-5">
            <Text className="text-sky-400 text-xs font-semibold tracking-wider uppercase">
              SIH 2026 Prototype • Rule-Based Personalization
            </Text>
          </View>

          <Text className="text-3xl font-extrabold text-white text-center tracking-tight mb-2">
            Welcome to Personalized MAUSAM
          </Text>

          <Text className="text-xl font-bold text-sky-300 text-center leading-7 mb-3">
            Your weather homepage, personalized for you.
          </Text>

          <Text className="text-xs text-slate-300 text-center max-w-sm leading-5 mb-6">
            Choose what matters to you and MAUSAM will prioritize relevant weather information, alerts and recommendations.
          </Text>

          {/* Quick Pillars Overview */}
          <View className="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-4 w-full space-y-3">
            <View className="flex-row items-center mb-2.5">
              <Text className="text-base mr-3">🎯</Text>
              <View className="flex-1">
                <Text className="text-sm font-bold text-white">Targeted Personas</Text>
                <Text className="text-xs text-slate-400">Tailored for farmers, commuters, travelers, and families</Text>
              </View>
            </View>

            <View className="flex-row items-center mb-2.5">
              <Text className="text-base mr-3">⚙️</Text>
              <View className="flex-1">
                <Text className="text-sm font-bold text-white">Custom Weather Preferences</Text>
                <Text className="text-xs text-slate-400">Track metrics like rainfall, UV index, wind, or visibility</Text>
              </View>
            </View>

            <View className="flex-row items-center">
              <Text className="text-base mr-3">🛡️</Text>
              <View className="flex-1">
                <Text className="text-sm font-bold text-white">Severe Safety Priority</Text>
                <Text className="text-xs text-slate-400">Official emergency warnings always take precedence</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Action Button */}
        <View className="pt-4">
          <TouchableOpacity
            onPress={() => navigation.navigate('Onboarding')}
            activeOpacity={0.8}
            accessibilityLabel="Get Started with Personalization Setup"
            accessibilityRole="button"
            className="w-full bg-sky-500 py-4 rounded-xl items-center justify-center shadow-lg shadow-sky-500/25"
          >
            <Text className="text-slate-950 font-bold text-base">
              Get Started →
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScreenContainer>
  );
};
