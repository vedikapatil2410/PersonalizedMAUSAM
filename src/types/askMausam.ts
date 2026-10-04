import type { WeatherDataMode } from './index';

export type AskMausamIntent =
  | 'current_weather'
  | 'temperature'
  | 'rain'
  | 'wind'
  | 'humidity'
  | 'visibility'
  | 'uv'
  | 'fitness'
  | 'travel_commute'
  | 'agriculture'
  | 'events'
  | 'family'
  | 'severe_weather'
  | 'help'
  | 'unknown';

export interface AskMausamMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  intent?: AskMausamIntent;
  explainability?: string;
  safetyNotice?: string;
  dataMode?: WeatherDataMode;
  timestamp: string;
}
