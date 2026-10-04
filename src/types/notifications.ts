import type { AlertCategory, AlertSeverityLevel, WeatherAlert } from './alerts';

export interface NotificationPreferences {
  enabled: boolean;
  criticalSafetyEnabled: true; // Locked to true — safety override guarantee
  highSeverityEnabled: boolean;
  mediumSeverityEnabled: boolean;
  lowSeverityEnabled: boolean;
  categories: Record<AlertCategory, boolean>;
  quietHoursEnabled: boolean;
  quietHoursStart: string; // "HH:MM" e.g. "22:00"
  quietHoursEnd: string; // "HH:MM" e.g. "07:00"
}

export interface NotificationDeliveryDecision {
  alert: WeatherAlert;
  delivered: boolean;
  reason: string;
  rule: 'critical_safety_override' | 'global_disabled' | 'quiet_hours' | 'severity_filter' | 'category_filter' | 'approved';
}
