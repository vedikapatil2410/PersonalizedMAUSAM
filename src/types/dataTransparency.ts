import type { WeatherDataMode, WeatherData } from './index';

export type DataSourceType =
  | 'live_imd'
  | 'demo_scenario'
  | 'open_meteo'
  | 'google_pollen'
  | 'rule_personalization'
  | 'safety_override'
  | 'user_preferences';

export interface DataFieldStatus {
  /** Human‑readable label for the field */
  label: string;
  /** Whether the field is present in the payload */
  available: boolean;
  /** Source of this field's value */
  source: DataSourceType;
  /** Optional reason why the field is missing */
  reason?: string;
  /** Actual value (or null) */
  value: any;
}

export interface DataSourceSummary {
  /** Current mode – live or demo */
  dataMode: WeatherDataMode;
  /** Human readable name of the data source (e.g., "Official IMD" or "Demo Scenario") */
  sourceName: string;
  /** Scenario identifier when in demo mode */
  scenarioId?: string;
  /** Active location name */
  activeLocation: string;
  /** Whether live IMD is reachable */
  isLiveAvailable: boolean;
  /** Fields that are present */
  availableFields: DataFieldStatus[];
  /** Fields that are missing */
  unavailableFields: DataFieldStatus[];
  /** Type of personalization engine */
  personalizationEngineType: string;
  /** Safety override flag */
  safetyOverrideActive: boolean;
  /** Timestamp of data */
  timestamp: string;
  /** Selected user activities input for personalization */
  selectedActivities?: string[];
}

export interface DataTransparencyInput {
  weatherData: WeatherData;
  dataMode: WeatherDataMode;
  selectedLocation: string;
  selectedActivities?: string[];
}
