import React, { useState } from 'react';
import { AppContext } from './AppContext';
import type {
  AppContextType,
  UserPersonaType,
  WeatherPreferenceType,
  ActivityType,
  NotificationPreferences,
  WeatherLocation,
} from '../types';
import { DEFAULT_PREFERENCES } from '../constants/preferences';
import {
  DEFAULT_LOCATION,
  DEFAULT_SAVED_LOCATIONS,
  MAX_SAVED_LOCATIONS,
  SUPPORTED_CITIES,
} from '../constants/locations';
import { DEFAULT_NOTIFICATION_PREFERENCES } from '../constants/notificationPreferences';

interface AppProviderProps {
  children: React.ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [selectedPersonas, setSelectedPersonas] = useState<UserPersonaType[]>([]);
  const [selectedPreferences, setSelectedPreferences] = useState<WeatherPreferenceType[]>(DEFAULT_PREFERENCES);
  const [selectedActivities, setSelectedActivities] = useState<ActivityType[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<string>(DEFAULT_LOCATION);
  const [savedLocations, setSavedLocations] = useState<WeatherLocation[]>(DEFAULT_SAVED_LOCATIONS);
  const [onboardingCompleted, setOnboardingCompleted] = useState<boolean>(false);
  const [notificationPreferences, setNotificationPreferences] = useState<NotificationPreferences>(
    DEFAULT_NOTIFICATION_PREFERENCES
  );

  const togglePersona = (persona: UserPersonaType) => {
    setSelectedPersonas((prev) =>
      prev.includes(persona) ? prev.filter((p) => p !== persona) : [...prev, persona]
    );
  };

  const setPersonas = (personas: UserPersonaType[]) => {
    setSelectedPersonas(personas);
  };

  const togglePreference = (pref: WeatherPreferenceType) => {
    setSelectedPreferences((prev) =>
      prev.includes(pref) ? prev.filter((p) => p !== pref) : [...prev, pref]
    );
  };

  const setPreferences = (preferences: WeatherPreferenceType[]) => {
    setSelectedPreferences(preferences);
  };

  const toggleActivity = (activity: ActivityType) => {
    setSelectedActivities((prev) =>
      prev.includes(activity) ? prev.filter((a) => a !== activity) : [...prev, activity]
    );
  };

  const setActivities = (activities: ActivityType[]) => {
    setSelectedActivities(activities);
  };

  const setLocation = (location: string) => {
    setSelectedLocation(location);
    // Sync active flag in savedLocations if present
    setSavedLocations((prev) =>
      prev.map((loc) => ({
        ...loc,
        isCurrentLocation:
          loc.city.toLowerCase() === location.toLowerCase() ||
          loc.name.toLowerCase() === location.toLowerCase() ||
          loc.id.toLowerCase() === location.toLowerCase(),
      }))
    );
  };

  const setActiveLocation = (locationIdOrName: string) => {
    const target = savedLocations.find(
      (l) =>
        l.id.toLowerCase() === locationIdOrName.toLowerCase() ||
        l.city.toLowerCase() === locationIdOrName.toLowerCase() ||
        l.name.toLowerCase() === locationIdOrName.toLowerCase()
    );

    if (target) {
      setSelectedLocation(target.city);
      setSavedLocations((prev) =>
        prev.map((loc) => ({
          ...loc,
          isCurrentLocation: loc.id === target.id,
        }))
      );
    } else {
      setSelectedLocation(locationIdOrName);
    }
  };

  const addLocation = (input: { city: string; label?: string; name?: string }): { success: boolean; error?: string } => {
    if (!input.city || input.city.trim() === '') {
      return { success: false, error: 'Location name and city cannot be empty.' };
    }

    if (savedLocations.length >= MAX_SAVED_LOCATIONS) {
      return { success: false, error: `You can save up to ${MAX_SAVED_LOCATIONS} locations.` };
    }

    const cityTrimmed = input.city.trim();
    const isDuplicate = savedLocations.some(
      (l) => l.city.toLowerCase() === cityTrimmed.toLowerCase()
    );

    if (isDuplicate) {
      return { success: false, error: 'This location is already saved.' };
    }

    const matchedSupported = SUPPORTED_CITIES.find(
      (c) => c.city.toLowerCase() === cityTrimmed.toLowerCase()
    );

    const newLoc: WeatherLocation = {
      id: matchedSupported ? matchedSupported.id : cityTrimmed.toLowerCase().replace(/\s+/g, '_'),
      name: input.name?.trim() || matchedSupported?.name || cityTrimmed,
      city: matchedSupported?.city || cityTrimmed,
      state: matchedSupported?.state || 'India',
      country: matchedSupported?.country || 'India',
      label: input.label?.trim() || matchedSupported?.defaultLabel || 'Saved Location',
      isCurrentLocation: false,
      isDefault: false,
    };

    setSavedLocations((prev) => [...prev, newLoc]);
    return { success: true };
  };

  const removeLocation = (locationId: string): { success: boolean; error?: string } => {
    if (savedLocations.length <= 1) {
      return { success: false, error: 'You must maintain at least one saved location.' };
    }

    const target = savedLocations.find((l) => l.id === locationId);
    if (!target) {
      return { success: false, error: 'Location not found.' };
    }

    const remaining = savedLocations.filter((l) => l.id !== locationId);
    setSavedLocations(remaining);

    // If the removed location was active, automatically switch to the first remaining location
    if (
      selectedLocation.toLowerCase() === target.city.toLowerCase() ||
      selectedLocation.toLowerCase() === target.name.toLowerCase() ||
      target.isCurrentLocation
    ) {
      const nextActive = remaining[0];
      setSelectedLocation(nextActive.city);
      setSavedLocations((prev) =>
        prev.map((l) => ({
          ...l,
          isCurrentLocation: l.id === nextActive.id,
        }))
      );
    }

    return { success: true };
  };

  const renameLocation = (locationId: string, newLabel: string): { success: boolean; error?: string } => {
    if (!newLabel || newLabel.trim() === '') {
      return { success: false, error: 'Label cannot be empty.' };
    }

    const target = savedLocations.find((l) => l.id === locationId);
    if (!target) {
      return { success: false, error: 'Location not found.' };
    }

    setSavedLocations((prev) =>
      prev.map((loc) =>
        loc.id === locationId ? { ...loc, label: newLabel.trim() } : loc
      )
    );

    return { success: true };
  };

  const updateNotificationPreferences = (prefs: Partial<NotificationPreferences>) => {
    setNotificationPreferences((prev) => ({
      ...prev,
      ...prefs,
      criticalSafetyEnabled: true, // Safety guarantee: always locked to true
      categories: prefs.categories ? { ...prev.categories, ...prefs.categories } : prev.categories,
    }));
  };

  const resetNotificationPreferences = () => {
    setNotificationPreferences(DEFAULT_NOTIFICATION_PREFERENCES);
  };

  const resetOnboarding = () => {
    setSelectedPersonas([]);
    setSelectedPreferences(DEFAULT_PREFERENCES);
    setSelectedActivities([]);
    setSelectedLocation(DEFAULT_LOCATION);
    setSavedLocations(DEFAULT_SAVED_LOCATIONS);
    setOnboardingCompleted(false);
    setNotificationPreferences(DEFAULT_NOTIFICATION_PREFERENCES);
  };

  const value: AppContextType = {
    selectedPersonas,
    selectedPreferences,
    selectedActivities,
    selectedLocation,
    savedLocations,
    onboardingCompleted,
    notificationPreferences,
    togglePersona,
    setPersonas,
    togglePreference,
    setPreferences,
    toggleActivity,
    setActivities,
    setLocation,
    setActiveLocation,
    addLocation,
    removeLocation,
    renameLocation,
    setOnboardingCompleted,
    resetOnboarding,
    updateNotificationPreferences,
    resetNotificationPreferences,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
