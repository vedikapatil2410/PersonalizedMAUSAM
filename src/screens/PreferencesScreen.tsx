import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { ScreenContainer } from '../components/ui/ScreenContainer';
import { useApp } from '../context/AppContext';
import { PREFERENCE_CATALOG } from '../constants/preferences';
import type { RootStackScreenProps } from '../navigation/types';

export const PreferencesScreen: React.FC<RootStackScreenProps<'Preferences'>> = ({
  navigation,
}) => {
  const { selectedPreferences, togglePreference } = useApp();

  const handleContinue = () => {
    navigation.navigate('LocationSetup');
  };

  return (
    <ScreenContainer
      title="Weather Preferences (Step 4 of 5)"
      subtitle="Select meteorological parameters to highlight on your homepage"
      onBack={() => navigation.goBack()}
    >
      <View className="flex-1 justify-between">
        <View>
          {/* Status Subheading */}
          <View className="flex-row items-center justify-between mb-3 px-0.5">
            <View className="flex-row items-center">
              <View className="bg-sky-500/20 px-2 py-0.5 rounded border border-sky-400/30 mr-2">
                <Text className="text-[10px] font-bold text-sky-300 uppercase">Step 4 of 5</Text>
              </View>
              <Text className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                {selectedPreferences.length} of {PREFERENCE_CATALOG.length} Selected
              </Text>
            </View>
            <Text className="text-xs text-sky-400 font-medium">Multiple choices allowed</Text>
          </View>

          {/* Preferences List */}
          <View className="space-y-2.5">
            {PREFERENCE_CATALOG.map((item) => {
              const isSelected = selectedPreferences.includes(item.id);

              return (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => togglePreference(item.id)}
                  activeOpacity={0.7}
                  accessibilityLabel={`Toggle ${item.title} preference, ${item.description}`}
                  accessibilityState={{ selected: isSelected }}
                  accessibilityRole="checkbox"
                  className={`rounded-2xl p-4 mb-2.5 flex-row items-center justify-between border ${
                    isSelected
                      ? 'bg-sky-950/60 border-sky-400/90'
                      : 'bg-slate-800/80 border-slate-700/60'
                  }`}
                >
                  <View className="flex-row items-center flex-1 pr-3">
                    <View className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700/70 items-center justify-center mr-3">
                      <Text className="text-lg">{item.icon}</Text>
                    </View>
                    <View className="flex-1">
                      <Text
                        className={`text-sm font-bold ${
                          isSelected ? 'text-white' : 'text-slate-200'
                        }`}
                      >
                        {item.title}
                      </Text>
                      <Text className="text-xs text-slate-400 mt-0.5">{item.description}</Text>
                    </View>
                  </View>

                  {/* Toggle Checkbox Circle */}
                  <View
                    className={`w-6 h-6 rounded-full items-center justify-center border ${
                      isSelected
                        ? 'bg-sky-400 border-sky-300'
                        : 'bg-slate-700/60 border-slate-600'
                    }`}
                  >
                    {isSelected && (
                      <Text className="text-xs font-extrabold text-slate-950">✓</Text>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Continue Button */}
        <View className="pt-4 pb-4">
          <TouchableOpacity
            onPress={handleContinue}
            activeOpacity={0.8}
            accessibilityLabel={`Continue to Step 4 Location Setup with ${selectedPreferences.length} preferences selected`}
            accessibilityRole="button"
            className="w-full bg-sky-500 py-3.5 rounded-xl items-center justify-center shadow-lg shadow-sky-500/25"
          >
            <Text className="text-slate-950 font-bold text-base">
              Continue to Location Setup (Step 5 of 5) →
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScreenContainer>
  );
};
