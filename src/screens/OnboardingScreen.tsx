import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { ScreenContainer } from '../components/ui/ScreenContainer';
import type { RootStackScreenProps } from '../navigation/types';

interface OnboardingStep {
  step: number;
  badge: string;
  icon: string;
  title: string;
  headline: string;
  description: string;
  highlights: string[];
}

const STEPS: OnboardingStep[] = [
  {
    step: 1,
    badge: 'Step 1 of 4 • About Personalization',
    icon: '🧭',
    title: 'Weather, personalized',
    headline: 'A homepage that adapts to your life',
    description:
      'Standard weather apps offer generic one-size-fits-all forecasts. Personalized MAUSAM reorganizes daily weather intelligence around the conditions that directly affect your routine.',
    highlights: [
      'Tailored daily forecast cards',
      'Dynamic priority based on conditions',
      'Explainable rule-based recommendations',
    ],
  },
  {
    step: 2,
    badge: 'Step 1 of 4 • Multi-Persona Relevance',
    icon: '🎯',
    title: 'Choose what matters',
    headline: 'Multi-persona weather relevance',
    description:
      "Select roles such as Health, Fitness, Travel, Agriculture, Commuting, Family, Beach & Outdoor, and Events. The system highlights the meteorological data each role requires.",
    highlights: [
      'Select single or multiple personas',
      'Specialized advisory indicators',
      'Adjustable anytime from your profile',
    ],
  },
  {
    step: 3,
    badge: 'Step 1 of 4 • Safety Priority',
    icon: '🛡️',
    title: 'Safety warnings first',
    headline: 'Severe warnings always take precedence',
    description:
      'Personalization never compromises safety. High-priority government and IMD meteorological warnings (heatwaves, flash floods, cyclones) override filters to keep you protected.',
    highlights: [
      'Universal safety override architecture',
      'Zero suppression of critical alerts',
      'Immediate district-level visibility',
    ],
  },
];

export const OnboardingScreen: React.FC<RootStackScreenProps<'Onboarding'>> = ({ navigation }) => {
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const currentStep = STEPS[currentStepIndex];

  const handleNext = () => {
    if (currentStepIndex < STEPS.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      navigation.navigate('PersonaSelection');
    }
  };

  const handleBack = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    } else {
      navigation.goBack();
    }
  };

  const handleSkip = () => {
    navigation.navigate('PersonaSelection');
  };

  return (
    <ScreenContainer scrollable={false}>
      <View className="flex-1 justify-between py-2">
        {/* Top Navigation Row: Back, Step Indicators, Skip */}
        <View className="flex-row items-center justify-between mb-4">
          <TouchableOpacity
            onPress={handleBack}
            activeOpacity={0.7}
            accessibilityLabel="Go back"
            accessibilityRole="button"
            className="flex-row items-center bg-slate-800/80 border border-slate-700/60 px-3 py-1.5 rounded-lg"
          >
            <Text className="text-sky-400 font-semibold text-xs mr-1">←</Text>
            <Text className="text-slate-300 font-medium text-xs">
              {currentStepIndex === 0 ? 'Welcome' : 'Previous'}
            </Text>
          </TouchableOpacity>

          {/* Progress Indicators */}
          <View className="flex-row items-center space-x-2">
            {STEPS.map((s, idx) => (
              <View
                key={s.step}
                className={`h-2 rounded-full mx-1 ${
                  idx === currentStepIndex
                    ? 'w-7 bg-sky-400'
                    : idx < currentStepIndex
                    ? 'w-2 bg-sky-600'
                    : 'w-2 bg-slate-700'
                }`}
              />
            ))}
          </View>

          {/* Skip Button */}
          <TouchableOpacity
            onPress={handleSkip}
            activeOpacity={0.7}
            accessibilityLabel="Skip onboarding explanation"
            accessibilityRole="button"
            className="px-2 py-1"
          >
            <Text className="text-xs font-semibold text-slate-400">Skip</Text>
          </TouchableOpacity>
        </View>

        {/* Step Content */}
        <View className="flex-1 justify-center py-2">
          {/* Step Badge */}
          <View className="self-start bg-sky-500/10 border border-sky-500/20 px-3 py-1 rounded-full mb-4">
            <Text className="text-sky-400 text-xs font-semibold uppercase tracking-wider">
              {currentStep.badge}
            </Text>
          </View>

          {/* Step Icon */}
          <View className="w-16 h-16 rounded-2xl bg-slate-800/90 border border-slate-700/70 items-center justify-center mb-5">
            <Text className="text-3xl">{currentStep.icon}</Text>
          </View>

          {/* Main Title & Headline */}
          <Text className="text-2xl font-extrabold text-white tracking-tight mb-2">
            {currentStep.title}
          </Text>
          <Text className="text-base font-semibold text-sky-200 mb-3 leading-6">
            {currentStep.headline}
          </Text>

          {/* Detailed Description */}
          <Text className="text-xs text-slate-300 leading-5 mb-5">
            {currentStep.description}
          </Text>

          {/* Highlights Card */}
          <View className="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-4">
            <Text className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">
              Key Mechanism
            </Text>
            {currentStep.highlights.map((h, i) => (
              <View key={i} className="flex-row items-center mb-1.5">
                <Text className="text-emerald-400 text-xs mr-2 font-bold">✓</Text>
                <Text className="text-xs text-slate-200 leading-4">{h}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Bottom Action Button */}
        <View className="pt-4 pb-2">
          <TouchableOpacity
            onPress={handleNext}
            activeOpacity={0.8}
            accessibilityLabel={currentStepIndex === STEPS.length - 1 ? 'Start Persona Selection' : 'Continue to next step'}
            accessibilityRole="button"
            className="w-full bg-sky-500 py-3.5 rounded-xl items-center justify-center shadow-lg shadow-sky-500/25"
          >
            <Text className="text-slate-950 font-bold text-base">
              {currentStepIndex === STEPS.length - 1 ? 'Start Persona Selection (Step 2 of 5) →' : 'Continue →'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScreenContainer>
  );
};
