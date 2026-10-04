// src/screens/DemoPresentationScreen.tsx
import React, { useState, useCallback } from 'react';
import type { RootStackScreenProps } from '../navigation/types';
import { View, Text, ScrollView } from 'react-native';
import { ScreenContainer } from '../components/ui/ScreenContainer';
import { DemoPresentationStepCard } from '../components/presentation/DemoPresentationStepCard';
import { DemoPresentationControls } from '../components/presentation/DemoPresentationControls';
import { DEMO_PRESENTATION_SCENARIO } from '../constants/demoPresentation';
import { useApp } from '../context/AppContext';
import { useWeather } from '../context/WeatherContext';
// import { setDemoScenario } from '../services/weatherControlEngine'; // helper to set scenario (not needed)

/**
 * Guided demo presentation screen.
 * Orchestrates navigation through existing screens based on the demo presentation steps.
 */
export const DemoPresentationScreen: React.FC<RootStackScreenProps<'DemoPresentation'>> = ({ navigation }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const steps = DEMO_PRESENTATION_SCENARIO.steps;
  const currentStep = steps[currentIndex];

  const { setPersonas, setLocation } = useApp();
  const { setScenario } = useWeather(); // assume setter exists for demo scenario

  const applyStepContext = useCallback(() => {
    if (currentStep.persona) {
      setPersonas([currentStep.persona]);
    }
    if (currentStep.location) {
      setLocation(currentStep.location);
    }
    if (currentStep.weatherScenario) {
      setScenario(currentStep.weatherScenario);
    }
  }, [currentStep, setPersonas, setLocation, setScenario]);

  const handleNext = () => {
    applyStepContext();
    if (currentStep.destination !== 'None') {
      navigation.navigate(currentStep.destination as any);
    }
    if (currentIndex < steps.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const handleExit = () => {
    // Reset any demo state if needed (optional)
    navigation.goBack();
  };

  const handleFinish = () => {
    navigation.goBack();
  };

  const isLast = currentIndex === steps.length - 1;
  const isFirst = currentIndex === 0;

  return (
    <ScreenContainer title="SIH Demo Presentation" subtitle="Personalized MAUSAM — Guided Prototype Demonstration" onBack={handleExit}>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="p-4 mb-4 bg-yellow-900/30 border border-yellow-600 rounded-lg">
          <Text className="text-center text-sm font-bold text-yellow-300">CONTROLLED DEMONSTRATION</Text>
        </View>
        <DemoPresentationStepCard step={currentStep} totalSteps={steps.length} />
        <DemoPresentationControls
          onBack={handleBack}
          onNext={handleNext}
          onExit={handleExit}
          onFinish={handleFinish}
          disableBack={isFirst}
          disableNext={isLast}
          isLast={isLast}
        />
      </ScrollView>
    </ScreenContainer>
  );
};
