/**
 * Phase 21 — SIH Demonstration Scenarios Catalog
 * SIH26076 · PersonalizedMAUSAM
 *
 * Deterministic showcase scenarios mapping existing Phase 4 demo scenarios
 * and existing personas to demonstrate rule-based personalization capabilities.
 */

import type { ShowcaseScenario, ShowcaseComparisonItem } from '../types/showcase';

export const SHOWCASE_SCENARIOS: ShowcaseScenario[] = [
  {
    id: 'normal_personalized',
    name: 'Normal Weather Personalization',
    persona: 'health',
    personaTitle: 'Health',
    personaIcon: '🏥',
    scenarioId: 'NORMAL',
    weatherSummary: '26°C • Clear & Mild (Normal)',
    expectedChanges: 'Balanced meteorological observations & health comfort guidance.',
    reason: 'Rule-based personalization highlights thermal comfort & hydration rules for mild weather.',
    icon: '☀️',
  },
  {
    id: 'fitness_hot',
    name: 'Fitness User + Hot Weather',
    persona: 'fitness',
    personaTitle: 'Fitness',
    personaIcon: '🏃',
    scenarioId: 'HOT_SUNNY',
    weatherSummary: '39°C • Extreme Heatwave & High UV',
    expectedChanges: 'Outdoor activity ratings & evening cooling window advisories prioritized.',
    reason: 'Engine combines Fitness persona with extreme thermal threshold to advise safe workout windows.',
    icon: '🔥',
  },
  {
    id: 'traveler_rainy',
    name: 'Traveler + Rainy Weather',
    persona: 'travel',
    personaTitle: 'Travel',
    personaIcon: '✈️',
    scenarioId: 'RAINY',
    weatherSummary: '24°C • Heavy Downpour & Squall (18 mm)',
    expectedChanges: 'Transit corridor weather intelligence & rain packing suggestions prioritized.',
    reason: 'Engine combines Travel persona with precipitation data to assess transit delays.',
    icon: '🌧️',
  },
  {
    id: 'family_severe',
    name: 'Family + Severe Safety Override',
    persona: 'family',
    personaTitle: 'Family',
    personaIcon: '👨‍👩‍👧',
    scenarioId: 'SEVERE_WEATHER',
    weatherSummary: '18°C • Severe Cyclonic Storm Warning',
    expectedChanges: 'Critical safety warning pinned to Position 0, overriding routine filters.',
    reason: 'Safety override engine operates independently of persona filters during storm warnings.',
    icon: '🚨',
    isSevere: true,
  },
  {
    id: 'outdoor_high_uv',
    name: 'Beach & Outdoor + High UV',
    persona: 'outdoor',
    personaTitle: 'Beach & Outdoor',
    personaIcon: '🏖️',
    scenarioId: 'HIGH_UV',
    weatherSummary: '34°C • Extreme UV Index 11',
    expectedChanges: 'Sun exposure protection alerts & peak UV window warnings prioritized.',
    reason: 'Engine detects extreme solar radiation (UV 11) for outdoor recreational activities.',
    icon: '☀️',
  },
  {
    id: 'events_rain',
    name: 'Event Planner + Rain Risk',
    persona: 'events',
    personaTitle: 'Events',
    personaIcon: '🎪',
    scenarioId: 'RAINY',
    weatherSummary: '24°C • Thunderstorm & Rain (90% chance)',
    expectedChanges: 'Outdoor event feasibility rating & rain shelter advisories prioritized.',
    reason: 'Engine evaluates rain probability & wind gusts against outdoor gathering requirements.',
    icon: '⛈️',
  },
];

export const SHOWCASE_COMPARISON_ITEMS: ShowcaseComparisonItem[] = [
  {
    id: 'comp_fitness',
    genericText: 'Temperature: 39°C • Humidity: 35% • Wind: 18 km/h',
    personalizedTitle: 'Fitness & Workout Rating',
    personalizedText: '🏃 Caution: Extreme heat. Schedule workouts after 6:00 PM (Cooling window: 33°C).',
    persona: 'fitness',
    icon: '🏃',
  },
  {
    id: 'comp_travel',
    genericText: 'Rainfall: 18.5 mm • Rain Chance: 92% • Wind: 28 km/h',
    personalizedTitle: 'Traveler Corridor Intelligence',
    personalizedText: '✈️ High Transit Delay Risk: Highway visibility < 3 km. Pack waterproof gear.',
    persona: 'travel',
    icon: '✈️',
  },
  {
    id: 'comp_family',
    genericText: 'Severe Thunderstorm Warning Issued by IMD',
    personalizedTitle: 'Family Safety Priority',
    personalizedText: '🚨 Emergency Override: Pinned Critical Alert. Keep children indoors.',
    persona: 'family',
    icon: '👨‍👩‍👧',
  },
  {
    id: 'comp_outdoor',
    genericText: 'UV Index: 11 of 12 (Very High Solar Radiation)',
    personalizedTitle: 'Beach & Outdoor Sun Guidance',
    personalizedText: '🏖️ Sun Protection Advisory: Max UV exposure 15 mins between 11 AM - 3 PM.',
    persona: 'outdoor',
    icon: '🏖️',
  },
];
