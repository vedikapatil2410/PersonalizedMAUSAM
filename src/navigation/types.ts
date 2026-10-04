import type { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';

export type RootStackParamList = {
  Splash: undefined;
  Welcome: undefined;
  Onboarding: undefined;
  PersonaSelection: undefined;
  ActivitySelection: undefined;
  Preferences: undefined;
  LocationSetup: undefined;
  PersonalizedHome: undefined;
  Forecast: undefined;
  ActivityDetails: undefined;
  Traveler: undefined;
  EventPlanner: undefined;
  AskMausam: undefined;
  Alerts: undefined;
  Profile: undefined;
  PersonalizationInsights: undefined;
  Locations: undefined;
  DailyBriefing: undefined;
  ShowcaseMode: undefined;
  DataTransparency: undefined;
  DemoPresentation: undefined;
  JudgeEvaluation: undefined;
  DemoReadiness: undefined;
};

export type RootStackScreenProps<T extends keyof RootStackParamList> = NativeStackScreenProps<
  RootStackParamList,
  T
>;

export type RootStackNavigationProp<T extends keyof RootStackParamList> = NativeStackNavigationProp<
  RootStackParamList,
  T
>;
