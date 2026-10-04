// src/constants/demoPresentation.ts
/**
 * Definition of the guided demo presentation steps.
 * Reuses existing personas, locations, and demo weather scenarios.
 */
import type { DemoPresentationScenario } from '../types/demoPresentation';

export const DEMO_PRESENTATION_SCENARIO: DemoPresentationScenario = {
  id: 'sih_demo',
  steps: [
    {
      id: 'step1',
      title: 'Meet Personalized MAUSAM',
      description: "Instead of showing the same weather information to everyone, MAUSAM adapts the homepage to the user's interests and current weather conditions.",
      destination: 'None',
      stepNumber: 1,
      notice: 'Shows overall concept and personalization purpose.',
    },
    {
      id: 'step2',
      title: 'Choose Your Context',
      description: 'Select a persona, preferences, and location to personalize the experience.',
      destination: 'None',
      persona: 'fitness', // example default; will be set via UI later
      location: 'Pune',
      stepNumber: 2,
      notice: 'Demonstrates onboarding/context selection.',
    },
    {
      id: 'step3',
      title: 'Personalized Homepage',
      description: 'Show the personalized home screen with weather summary, recommendations, layout, contextual actions, and explanations.',
      destination: 'PersonalizedHome',
      stepNumber: 3,
      notice: 'Judge sees personalized view and why information is shown.',
    },
    {
      id: 'step4',
      title: 'Same Weather, Different User',
      description: 'With HOT_SUNNY weather, compare how Fitness and Family personas receive different recommendation priorities.',
      destination: 'PersonalizedHome',
      persona: 'family', // switching persona later
      weatherScenario: 'HOT_SUNNY',
      stepNumber: 4,
      notice: 'The same weather conditions produce different priorities for different personas.',
    },
    {
      id: 'step5',
      title: 'When Weather Changes',
      description: 'Switch through multiple weather scenarios (NORMAL, HOT_SUNNY, RAINY, HIGH_UV) and observe recommendation updates.',
      destination: 'PersonalizedHome',
      weatherScenario: 'NORMAL',
      stepNumber: 5,
      notice: 'Recommendations adapt to changing weather.',
    },
    {
      id: 'step6',
      title: 'Safety Comes First',
      description: 'Activate SEVERE_WEATHER scenario to show the critical safety alert overriding personalization.',
      destination: 'Alerts',
      weatherScenario: 'SEVERE_WEATHER',
      stepNumber: 6,
      notice: 'The critical safety warning appears before personalized recommendations.',
    },
    {
      id: 'step7',
      title: 'Why Can We Trust It?',
      description: 'Navigate to Data & Transparency to display source, live vs demo mode, and rule‑based personalization explanation.',
      destination: 'DataTransparency',
      stepNumber: 7,
      notice: 'The app clearly distinguishes official IMD information from controlled demo scenarios.',
    },
    {
      id: 'step8',
      title: 'Evidence',
      description: 'Open Judge Evaluation Mode to show persona/weather comparisons, safety evaluation, and deterministic evidence.',
      destination: 'JudgeEvaluation',
      stepNumber: 8,
      notice: 'Provides measurable proof of personalization and safety handling.',
    },
  ],
};
