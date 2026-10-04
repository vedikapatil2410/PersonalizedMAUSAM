// src/navigation/RootNavigator.tsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { RootStackParamList } from './types';

// Screen imports
import { SplashScreen } from '../screens/SplashScreen';
import { WelcomeScreen } from '../screens/WelcomeScreen';
import { OnboardingScreen } from '../screens/OnboardingScreen';
import { PersonaSelectionScreen } from '../screens/PersonaSelectionScreen';
import { ActivitySelectionScreen } from '../screens/ActivitySelectionScreen';
import { PreferencesScreen } from '../screens/PreferencesScreen';
import { LocationSetupScreen } from '../screens/LocationSetupScreen';
import { PersonalizedHomeScreen } from '../screens/PersonalizedHomeScreen';
import { ForecastScreen } from '../screens/ForecastScreen';
import { ActivityDetailsScreen } from '../screens/ActivityDetailsScreen';
import { TravelerScreen } from '../screens/TravelerScreen';
import { EventPlannerScreen } from '../screens/EventPlannerScreen';
import { AskMausamScreen } from '../screens/AskMausamScreen';
import { AlertsScreen } from '../screens/AlertsScreen';
import { DataTransparencyScreen } from '../screens/DataTransparencyScreen';
import { JudgeEvaluationScreen } from '../screens/JudgeEvaluationScreen';
import { DemoPresentationScreen } from '../screens/DemoPresentationScreen';
import { DemoReadinessScreen } from '../screens/DemoReadinessScreen';
import { PersonalizationInsightsScreen } from '../screens/PersonalizationInsightsScreen';
import { LocationsScreen } from '../screens/LocationsScreen';
import { DailyBriefingScreen } from '../screens/DailyBriefingScreen';
import { ShowcaseModeScreen } from '../screens/ShowcaseModeScreen';
import { ProfileScreen } from '../screens/ProfileScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      initialRouteName="Splash"
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#0f172a' },
        animation: 'slide_from_right',
      }}
    >
      {/* Onboarding & Setup Flow */}
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      <Stack.Screen name="PersonaSelection" component={PersonaSelectionScreen} />
      <Stack.Screen name="ActivitySelection" component={ActivitySelectionScreen} />
      <Stack.Screen name="Preferences" component={PreferencesScreen} />
      <Stack.Screen name="LocationSetup" component={LocationSetupScreen} />

      {/* Main Personalized Dashboard */}
      <Stack.Screen name="PersonalizedHome" component={PersonalizedHomeScreen} />

      {/* Feature & Utility Screens */}
      <Stack.Screen name="Forecast" component={ForecastScreen} />
      <Stack.Screen name="ActivityDetails" component={ActivityDetailsScreen} />
      <Stack.Screen name="Traveler" component={TravelerScreen} />
      <Stack.Screen name="EventPlanner" component={EventPlannerScreen} />
      <Stack.Screen name="AskMausam" component={AskMausamScreen} />
      <Stack.Screen name="Alerts" component={AlertsScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="PersonalizationInsights" component={PersonalizationInsightsScreen} />
      <Stack.Screen name="Locations" component={LocationsScreen} />
      <Stack.Screen name="DailyBriefing" component={DailyBriefingScreen} />
      <Stack.Screen name="ShowcaseMode" component={ShowcaseModeScreen} />
      <Stack.Screen name="JudgeEvaluation" component={JudgeEvaluationScreen} />
      <Stack.Screen name="DemoPresentation" component={DemoPresentationScreen} />
      <Stack.Screen name="DemoReadiness" component={DemoReadinessScreen} />
    </Stack.Navigator>
  );
};
