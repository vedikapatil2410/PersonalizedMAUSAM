import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { ScreenContainer } from '../components/ui/ScreenContainer';
import { useApp } from '../context/AppContext';
import { LOCATION_OPTIONS } from '../constants/locations';
import { PersonalizationPreview } from '../components/onboarding/PersonalizationPreview';
import type { RootStackScreenProps } from '../navigation/types';

export const LocationSetupScreen: React.FC<RootStackScreenProps<'LocationSetup'>> = ({
  navigation,
}) => {
  const {
    selectedLocation,
    selectedPersonas,
    selectedPreferences,
    setLocation,
    setOnboardingCompleted,
  } = useApp();

  const handleSelectLocation = (locationName: string) => {
    setLocation(locationName);
  };

  const handleFinish = () => {
    setOnboardingCompleted(true);
    // Reset stack so that user enters PersonalizedHome cleanly
    navigation.reset({
      index: 0,
      routes: [{ name: 'PersonalizedHome' }],
    });
  };

  return (
    <ScreenContainer
      title="Location Setup & Preview (Step 5 of 5)"
      subtitle="Select your primary weather district and preview your personalized homepage"
      onBack={() => navigation.goBack()}
    >
      <View className="flex-1 justify-between">
        <View>
          {/* Header Step Badge & Notice */}
          <View className="flex-row items-center justify-between mb-3 px-0.5">
            <View className="flex-row items-center">
              <View className="bg-sky-500/20 px-2 py-0.5 rounded border border-sky-400/30 mr-2">
                <Text className="text-[10px] font-bold text-sky-300 uppercase">Step 5 of 5</Text>
              </View>
              <Text className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                District Selection
              </Text>
            </View>
            <Text className="text-xs text-slate-400">Determines homepage weather</Text>
          </View>

          {/* Explanation Banner */}
          <View className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-3 mb-4">
            <Text className="text-xs font-semibold text-slate-200 leading-5">
              📍 Your selected location determines which official IMD observation and district weather data appears on your personalized homepage.
            </Text>
          </View>

          {/* Active Selection Header */}
          <Text className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2.5 px-1">
            Available Observation Stations
          </Text>

          {/* Location Choices */}
          <View className="space-y-2.5">
            {LOCATION_OPTIONS.map((item) => {
              const isSelected = selectedLocation === item.name;

              return (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => handleSelectLocation(item.name)}
                  activeOpacity={0.7}
                  accessibilityLabel={`Select location ${item.name}, ${item.region}`}
                  accessibilityState={{ selected: isSelected }}
                  accessibilityRole="radio"
                  className={`rounded-2xl p-3.5 mb-2.5 border flex-row items-center justify-between ${
                    isSelected
                      ? 'bg-sky-950/70 border-sky-400 shadow-md shadow-sky-500/20'
                      : 'bg-slate-800/80 border-slate-700/60'
                  }`}
                >
                  <View className="flex-row items-center flex-1">
                    <View className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700/70 items-center justify-center mr-3">
                      <Text className="text-base">{item.isSpecial ? '⏳' : '📍'}</Text>
                    </View>
                    <View>
                      <View className="flex-row items-center">
                        <Text
                          className={`text-sm font-bold ${
                            isSelected ? 'text-white' : 'text-slate-200'
                          }`}
                        >
                          {item.name}
                        </Text>
                        {item.isDefault && (
                          <View className="bg-sky-500/20 px-2 py-0.5 rounded-full ml-2 border border-sky-400/30">
                            <Text className="text-[10px] font-semibold text-sky-300">Default</Text>
                          </View>
                        )}
                      </View>
                      <Text className="text-[11px] text-slate-400 mt-0.5">{item.region}</Text>
                    </View>
                  </View>

                  <View
                    className={`w-5 h-5 rounded-full items-center justify-center border ${
                      isSelected
                        ? 'bg-sky-400 border-sky-300'
                        : 'bg-slate-700/60 border-slate-600'
                    }`}
                  >
                    {isSelected && (
                      <View className="w-2 h-2 rounded-full bg-slate-950" />
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Phase 20: Personalization Preview Card (Dynamic Selections Summary) */}
          <PersonalizationPreview
            selectedLocation={selectedLocation}
            selectedPersonas={selectedPersonas}
            selectedPreferences={selectedPreferences}
          />

          {/* Completion Summary Card */}
          <View className="bg-emerald-950/30 border border-emerald-500/40 rounded-2xl p-4 my-2">
            <View className="flex-row items-center mb-1">
              <Text className="text-lg mr-2">✨</Text>
              <Text className="text-sm font-extrabold text-emerald-300">
                Your personalized MAUSAM is ready
              </Text>
            </View>
            <Text className="text-xs text-slate-300 leading-4">
              Configured for {selectedLocation} with {selectedPersonas.length} persona role{selectedPersonas.length !== 1 ? 's' : ''} and {selectedPreferences.length} preference parameter{selectedPreferences.length !== 1 ? 's' : ''}.
            </Text>
          </View>
        </View>

        {/* Action Button */}
        <View className="pt-4 pb-4">
          <TouchableOpacity
            onPress={handleFinish}
            activeOpacity={0.8}
            accessibilityLabel="Go to My Weather and enter Personalized Homepage"
            accessibilityRole="button"
            className="w-full bg-sky-500 py-3.5 rounded-xl items-center justify-center shadow-lg shadow-sky-500/25"
          >
            <Text className="text-slate-950 font-bold text-base">
              Go to My Weather →
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScreenContainer>
  );
};
