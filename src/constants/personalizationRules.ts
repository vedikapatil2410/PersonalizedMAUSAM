import type { RecommendationPriority } from '../types/personalization';

/**
 * Deterministic Weather Trigger Thresholds.
 * Centralized numerical boundaries used across rule evaluations.
 */
export const HIGH_TEMPERATURE = 35; // °C
export const VERY_HIGH_TEMPERATURE = 40; // °C
export const HIGH_RAIN_PROBABILITY = 60; // %
export const HEAVY_RAINFALL = 25; // mm
export const HIGH_WIND = 35; // km/h
export const HIGH_UV = 8; // UV Index
export const VERY_HIGH_UV = 11; // UV Index
export const LOW_VISIBILITY = 5; // km
export const HIGH_HUMIDITY = 85; // %

/**
 * Priority weights for deterministic sorting.
 * Critical (0) always sorts before High (1), Medium (2), Low (3).
 */
export const PRIORITY_WEIGHTS: Record<RecommendationPriority, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};
