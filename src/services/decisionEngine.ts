import type { PersonalizedRecommendation } from '../types/personalization';
import {
  MAX_VISIBLE_RECOMMENDATIONS,
  DECISION_PRIORITY_WEIGHTS,
  CATEGORY_RANKS,
} from '../constants/decisionRules';

/**
 * Pure, deterministic Decision & Priority Engine.
 *
 * Responsibilities:
 * - Does NOT invent or generate new weather recommendations.
 * - Receives candidate recommendations already produced by the Personalization Engine.
 * - Deterministically ranks recommendations by priority, category impact, and stable identifiers.
 * - Performs defensive deduplication on recommendation IDs.
 * - Enforces the homepage feed capacity (MAX_VISIBLE_RECOMMENDATIONS = 4).
 * - Preserves critical safety recommendations at the head of the feed.
 */
export const decideRecommendations = (
  recommendations: PersonalizedRecommendation[]
): PersonalizedRecommendation[] => {
  if (!recommendations || recommendations.length === 0) {
    return [];
  }

  // 1. Defensive Deduplication by recommendation ID (retaining first occurrence)
  const seenIds = new Set<string>();
  const uniqueRecommendations: PersonalizedRecommendation[] = [];

  for (const item of recommendations) {
    if (!seenIds.has(item.id)) {
      seenIds.add(item.id);
      uniqueRecommendations.push(item);
    }
  }

  // 2. Deterministic Ranking
  // Primary: Priority Weight (critical: 0 -> high: 1 -> medium: 2 -> low: 3)
  // Secondary: Category Rank Weight (safety_alert -> health_comfort -> ...)
  // Tie-breaker: Lexicographical order of recommendation id
  const ranked = [...uniqueRecommendations].sort((a, b) => {
    // Primary: Priority
    const priorityDiff =
      DECISION_PRIORITY_WEIGHTS[a.priority] - DECISION_PRIORITY_WEIGHTS[b.priority];
    if (priorityDiff !== 0) {
      return priorityDiff;
    }

    // Secondary: Category Impact Rank
    const categoryRankA = CATEGORY_RANKS[a.category] ?? 99;
    const categoryRankB = CATEGORY_RANKS[b.category] ?? 99;
    const categoryDiff = categoryRankA - categoryRankB;
    if (categoryDiff !== 0) {
      return categoryDiff;
    }

    // Tertiary: Stable tie-breaker by ID
    return a.id.localeCompare(b.id);
  });

  // 3. Selection & Homepage Feed Capping (at most MAX_VISIBLE_RECOMMENDATIONS = 4)
  return ranked.slice(0, MAX_VISIBLE_RECOMMENDATIONS);
};
