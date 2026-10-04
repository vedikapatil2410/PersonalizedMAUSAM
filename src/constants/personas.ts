import type { PersonaMetadata } from '../types';

export const PERSONA_CATALOG: PersonaMetadata[] = [
  {
    id: 'health',
    title: 'Health',
    description: 'Air quality, UV, humidity and weather comfort',
    icon: '🏥',
  },
  {
    id: 'fitness',
    title: 'Fitness',
    description: 'Conditions for outdoor exercise and activity',
    icon: '🏃',
  },
  {
    id: 'travel',
    title: 'Travel',
    description: 'Weather at destinations and travel conditions',
    icon: '✈️',
  },
  {
    id: 'agriculture',
    title: 'Agriculture',
    description: 'Rain, temperature and conditions affecting crops',
    icon: '🌾',
  },
  {
    id: 'commuting',
    title: 'Commuting',
    description: 'Rain, visibility, wind and travel conditions',
    icon: '🚆',
  },
  {
    id: 'family',
    title: 'Family',
    description: 'Weather information useful for family routines',
    icon: '👨‍👩‍👧‍👦',
  },
  {
    id: 'outdoor',
    title: 'Beach & Outdoor',
    description: 'Outdoor conditions, wind and coastal information',
    icon: '🏖️',
  },
  {
    id: 'events',
    title: 'Events',
    description: 'Weather conditions that may affect events',
    icon: '🎪',
  },
];
