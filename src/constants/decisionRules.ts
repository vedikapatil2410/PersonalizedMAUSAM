import type { RecommendationCategory, RecommendationPriority } from '../types/personalization';

/**
 * Maximum number of personalized recommendations displayed on the homepage feed.
 * Keeps the mobile interface clean, digestible, and focused on high-impact insights.
 */
export const MAX_VISIBLE_RECOMMENDATIONS = 4;

/**
 * Numerical weights for primary priority ranking.
 * Lower value indicates higher priority (critical sorts first).
 */
export const DECISION_PRIORITY_WEIGHTS: Record<RecommendationPriority, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

/**
 * Secondary category rank weights for deterministic tie-breaking.
 * Ensures consistent ordering among recommendations with identical priority.
 */
export const CATEGORY_RANKS: Record<RecommendationCategory, number> = {
  safety_alert: 0,
  health_comfort: 1,
  fitness_window: 2,
  travel_visibility: 3,
  agri_advisory: 4,
  commute_impact: 5,
  family_routine: 6,
  outdoor_advisory: 7,
  event_risk: 8,
  general_info: 9,
};
