/**
 * Phase 15 — Multi-Location Weather Intelligence
 * SIH26076 · PersonalizedMAUSAM
 *
 * Data models for deterministic multi-location management.
 */

export interface WeatherLocation {
  /** Unique stable identifier for this saved location (e.g. "pune", "mumbai", "delhi", "loc_home"). */
  id: string;

  /** Human-readable location display name (e.g. "Pune"). */
  name: string;

  /** City name for weather queries (e.g. "Pune"). */
  city: string;

  /** State / Province / Territory (e.g. "Maharashtra"). */
  state: string;

  /** Country name (e.g. "India"). */
  country: string;

  /** User label or purpose (e.g. "Home", "College", "Travel", "Work", "Family", "Saved Location"). */
  label: string;

  /** Whether this represents the user's primary/current location. */
  isCurrentLocation: boolean;

  /** Whether this is a default initial system location. */
  isDefault?: boolean;
}

export interface SupportedCity {
  id: string;
  city: string;
  name: string;
  state: string;
  country: string;
  defaultLabel: string;
}
