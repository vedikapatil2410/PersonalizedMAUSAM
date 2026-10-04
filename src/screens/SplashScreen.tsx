import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { RootStackScreenProps } from '../navigation/types';
import { APP_METADATA } from '../constants/config';

export const SplashScreen: React.FC<RootStackScreenProps<'Splash'>> = ({ navigation }) => {
  return (
    <SafeAreaView className="flex-1 bg-slate-900 justify-between p-6">
      {/* Top Header Badge */}
      <View className="items-center pt-4">
        <View className="bg-sky-500/10 border border-sky-500/20 px-3.5 py-1.5 rounded-full">
          <Text className="text-sky-400 text-xs font-semibold tracking-widest uppercase">
            SIH 2026 • {APP_METADATA.sihProblemStatement}
          </Text>
        </View>
      </View>

      {/* Center Brand Identity */}
      <View className="items-center justify-center">
        {/* Modern Meteorological Emblem */}
        <View className="w-24 h-24 rounded-3xl bg-sky-500/15 items-center justify-center border border-sky-400/30 mb-8 shadow-lg shadow-sky-500/20">
          <View className="w-14 h-14 rounded-2xl bg-sky-400/25 items-center justify-center border border-sky-300/40">
            <Text className="text-3xl">🌤️</Text>
          </View>
        </View>

        <Text className="text-3xl font-extrabold text-white text-center tracking-tight mb-3">
          {APP_METADATA.name}
        </Text>

        <Text className="text-lg font-medium text-sky-200 text-center leading-7 max-w-xs mb-4">
          Weather that matters to you.
        </Text>

        <View className="bg-slate-800/60 border border-slate-700/50 px-4 py-2 rounded-xl">
          <Text className="text-xs text-slate-400 text-center font-medium">
            Ministry-Grade Weather Personalization Prototype
          </Text>
        </View>
      </View>

      {/* Bottom Action */}
      <View className="w-full pb-6">
        <TouchableOpacity
          onPress={() => navigation.navigate('Welcome')}
          activeOpacity={0.8}
          className="w-full bg-sky-500 py-4 rounded-xl items-center justify-center shadow-lg shadow-sky-500/30"
        >
          <Text className="text-slate-950 font-bold text-base tracking-wide">
            Enter Application →
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};
