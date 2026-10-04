import { createContext, useContext } from 'react';
import type { WeatherContextType } from '../types';

export const WeatherContext = createContext<WeatherContextType | undefined>(undefined);

export const useWeather = (): WeatherContextType => {
  const context = useContext(WeatherContext);
  if (!context) {
    throw new Error('useWeather must be used within a WeatherProvider');
  }
  return context;
};
