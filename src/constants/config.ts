/**
 * Application Constants and Metadata.
 */

export const APP_METADATA = {
  name: 'Personalized MAUSAM',
  tagline: 'Weather that matters to you.',
  sihProblemStatement: 'SIH26076',
  sihTitle: 'Development of personalized homepage for "Mausam" mobile application',
  version: '1.0.0-prototype',
  phase: 'Phase 9 - IMD Weather Integration',
} as const;

export const API_CONFIG = {
  // Configurable via EXPO_PUBLIC_BACKEND_URL (e.g. for physical devices or Android emulator)
  backendUrl: process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:5000',
  defaultCity: 'Pune',
  requestTimeoutMs: 8000,
} as const;

