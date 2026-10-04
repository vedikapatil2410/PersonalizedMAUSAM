import './global.css';
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppProvider } from './src/context/AppProvider';
import { WeatherProvider } from './src/context/WeatherProvider';
import { AppNavigator } from './src/navigation/AppNavigator';

export default function App() {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <WeatherProvider>
          <StatusBar style="light" />
          <AppNavigator />
        </WeatherProvider>
      </AppProvider>
    </SafeAreaProvider>
  );
}
