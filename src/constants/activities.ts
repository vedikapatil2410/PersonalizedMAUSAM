import type { ActivityMetadata, ActivityType } from '../types/activity';
import type { UserPersonaType } from '../types';

export const ACTIVITY_CATALOG: ActivityMetadata[] = [
  {
    id: 'running',
    title: 'Running',
    description: 'Find comfortable and safer times to run.',
    icon: '🏃',
    relevantPersonas: ['fitness'],
  },
  {
    id: 'cycling',
    title: 'Cycling',
    description: 'Check wind, rain and outdoor conditions.',
    icon: '🚴',
    relevantPersonas: ['fitness', 'commuting'],
  },
  {
    id: 'walking',
    title: 'Walking',
    description: 'Find comfortable times for outdoor walks.',
    icon: '🚶',
    relevantPersonas: ['fitness', 'travel', 'health', 'commuting', 'family'],
  },
  {
    id: 'outdoor_exercise',
    title: 'Outdoor Exercise',
    description: 'Check heat, UV, humidity and weather conditions.',
    icon: '💪',
    relevantPersonas: ['fitness', 'events', 'health', 'agriculture', 'outdoor'],
  },
  {
    id: 'travel',
    title: 'Travel',
    description: 'Plan trips around weather conditions.',
    icon: '✈️',
    relevantPersonas: ['travel'],
  },
  {
    id: 'beach_water',
    title: 'Beach & Water Activities',
    description: 'Check suitable weather and water-related conditions.',
    icon: '🏖️',
    relevantPersonas: ['outdoor', 'family'],
  },
  {
    id: 'photography',
    title: 'Photography',
    description: 'Find suitable outdoor conditions and lighting.',
    icon: '📸',
    relevantPersonas: ['travel', 'events'],
  },
  {
    id: 'gardening',
    title: 'Gardening',
    description: 'Track rain, temperature and conditions for plants.',
    icon: '🌱',
    relevantPersonas: ['agriculture'],
  },
  {
    id: 'events',
    title: 'Events & Functions',
    description: 'Plan outdoor events around weather conditions.',
    icon: '🎪',
    relevantPersonas: ['events'],
  },
  {
    id: 'commuting',
    title: 'Commuting',
    description: 'Get weather information relevant to your daily travel.',
    icon: '🚆',
    relevantPersonas: ['commuting', 'agriculture'],
  },
  {
    id: 'outdoor_sports',
    title: 'Outdoor Sports',
    description: 'Check weather conditions before playing outdoors.',
    icon: '⚽',
    relevantPersonas: ['fitness', 'outdoor'],
  },
  {
    id: 'family_outdoor',
    title: 'Family / Kids Outdoor Time',
    description: 'Find safer and more comfortable outdoor periods.',
    icon: '👨‍👩‍👧‍👦',
    relevantPersonas: ['family', 'health'],
  },
];

/**
 * Returns activities prioritized according to active personas.
 * Does NOT remove any activity — simply places relevant activities first.
 */
export const getPrioritizedActivities = (
  selectedPersonas: UserPersonaType[] = []
): { activity: ActivityMetadata; isRecommended: boolean }[] => {
  if (selectedPersonas.length === 0) {
    return ACTIVITY_CATALOG.map((activity) => ({
      activity,
      isRecommended: false,
    }));
  }

  const recommended: { activity: ActivityMetadata; isRecommended: boolean }[] = [];
  const others: { activity: ActivityMetadata; isRecommended: boolean }[] = [];

  for (const item of ACTIVITY_CATALOG) {
    const matchesPersona = item.relevantPersonas.some((p) =>
      selectedPersonas.includes(p)
    );
    if (matchesPersona) {
      recommended.push({ activity: item, isRecommended: true });
    } else {
      others.push({ activity: item, isRecommended: false });
    }
  }

  return [...recommended, ...others];
};
