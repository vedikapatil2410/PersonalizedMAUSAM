import type { UserPersonaType } from './index';

export type RecommendationPriority = 'critical' | 'high' | 'medium' | 'low';

export type RecommendationCategory =
  | 'safety_alert'
  | 'health_comfort'
  | 'fitness_window'
  | 'travel_visibility'
  | 'agri_advisory'
  | 'commute_impact'
  | 'family_routine'
  | 'outdoor_advisory'
  | 'event_risk'
  | 'general_info';

export interface PersonalizedRecommendation {
  id: string;
  category: RecommendationCategory;
  title: string;
  description: string;
  priority: RecommendationPriority;
  explanation: string;
  relevantPersonas: UserPersonaType[];
  relevantPersonaLabels: string[];
  weatherTrigger: string;
  icon: string;
  badge?: string;
}
