import type { UserPersonaType } from './index';

export type ActivityType =
  | 'running'
  | 'cycling'
  | 'walking'
  | 'outdoor_exercise'
  | 'travel'
  | 'beach_water'
  | 'photography'
  | 'gardening'
  | 'events'
  | 'commuting'
  | 'outdoor_sports'
  | 'family_outdoor';

export interface ActivityMetadata {
  id: ActivityType;
  title: string;
  description: string;
  icon: string;
  relevantPersonas: UserPersonaType[];
}
