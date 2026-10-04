export type AlertSeverityLevel = 'critical' | 'high' | 'medium' | 'low';

export type AlertCategory =
  | 'safety'
  | 'health'
  | 'fitness'
  | 'travel'
  | 'agriculture'
  | 'commuting'
  | 'family'
  | 'outdoor'
  | 'events'
  | 'general';

export type AlertSource = 'Official IMD' | 'Personalized MAUSAM';

export interface WeatherAlert {
  id: string;
  title: string;
  message: string;
  severity: AlertSeverityLevel;
  category: AlertCategory;
  timestamp: string;
  source: AlertSource;
  persona?: string;
  explanation: string;
  isRead: boolean;
}
