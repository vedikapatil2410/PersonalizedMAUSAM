import type { NotificationPreferences } from '../types';

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  enabled: true,
  criticalSafetyEnabled: true,
  highSeverityEnabled: true,
  mediumSeverityEnabled: true,
  lowSeverityEnabled: false,
  categories: {
    safety: true,
    health: true,
    fitness: true,
    travel: true,
    agriculture: true,
    commuting: true,
    family: true,
    outdoor: true,
    events: true,
    general: true,
  },
  quietHoursEnabled: false,
  quietHoursStart: '22:00',
  quietHoursEnd: '07:00',
};
