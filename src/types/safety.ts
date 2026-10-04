import type { PersonalizedRecommendation } from './personalization';

export interface SafetyOverrideResult {
  finalRecommendations: PersonalizedRecommendation[];
  overrideApplied: boolean;
  overrideReason?: string;
}
