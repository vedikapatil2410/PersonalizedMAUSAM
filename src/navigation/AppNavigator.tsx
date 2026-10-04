import React from 'react';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { RootNavigator } from './RootNavigator';

const navigationTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: '#0f172a',
    card: '#1e293b',
    text: '#ffffff',
    border: '#334155',
    primary: '#38bdf8',
  },
};

export const AppNavigator: React.FC = () => {
  return (
    <NavigationContainer theme={navigationTheme}>
      <RootNavigator />
    </NavigationContainer>
  );
};
