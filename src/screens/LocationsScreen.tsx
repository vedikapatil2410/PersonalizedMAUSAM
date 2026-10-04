/**
 * Phase 15 — Locations Screen
 * SIH26076 · PersonalizedMAUSAM
 *
 * Dedicated screen for managing saved weather locations:
 * - Active Location Status
 * - Saved Locations List with rename and removal actions
 * - Add Location Form with supported IMD stations and label presets
 */

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, Alert } from 'react-native';
import { ScreenContainer } from '../components/ui/ScreenContainer';
import { useApp } from '../context/AppContext';
import { useWeather } from '../context/WeatherContext';
import {
  SUPPORTED_CITIES,
  MAX_SAVED_LOCATIONS,
  LOCATION_LABEL_OPTIONS,
} from '../constants/locations';
import type { WeatherLocation } from '../types/locations';
import type { RootStackScreenProps } from '../navigation/types';

export const LocationsScreen: React.FC<RootStackScreenProps<'Locations'>> = ({ navigation }) => {
  const {
    selectedLocation,
    savedLocations,
    setActiveLocation,
    addLocation,
    removeLocation,
    renameLocation,
  } = useApp();

  const { currentWeatherData, dataMode } = useWeather();

  // Add Location State
  const [selectedCityToAdd, setSelectedCityToAdd] = useState<string>(SUPPORTED_CITIES[0].city);
  const [selectedLabelToAdd, setSelectedLabelToAdd] = useState<string>('Home');
  const [customLabelInput, setCustomLabelInput] = useState<string>('');
  const [actionFeedback, setActionFeedback] = useState<{ msg: string; isError: boolean } | null>(null);

  // Edit / Rename Modal or Inline State
  const [editingLocId, setEditingLocId] = useState<string | null>(null);
  const [editingLabelText, setEditingLabelText] = useState<string>('');

  const activeLoc = savedLocations.find(
    (l) =>
      l.city.toLowerCase() === selectedLocation.toLowerCase() ||
      l.name.toLowerCase() === selectedLocation.toLowerCase()
  ) || {
    id: 'active',
    name: selectedLocation,
    city: selectedLocation,
    state: 'Maharashtra',
    country: 'India',
    label: 'Primary',
    isCurrentLocation: true,
  };

  const handleAddLocation = () => {
    setActionFeedback(null);
    const labelToUse = customLabelInput.trim() || selectedLabelToAdd;

    const result = addLocation({
      city: selectedCityToAdd,
      label: labelToUse,
    });

    if (result.success) {
      setActionFeedback({ msg: `Added ${selectedCityToAdd} (${labelToUse}) successfully.`, isError: false });
      setCustomLabelInput('');
    } else {
      setActionFeedback({ msg: result.error || 'Unable to add location.', isError: true });
    }
  };

  const handleRemove = (loc: WeatherLocation) => {
    setActionFeedback(null);
    const result = removeLocation(loc.id);
    if (result.success) {
      setActionFeedback({ msg: `Removed ${loc.name} from saved locations.`, isError: false });
    } else {
      setActionFeedback({ msg: result.error || 'Cannot remove location.', isError: true });
    }
  };

  const handleStartRename = (loc: WeatherLocation) => {
    setEditingLocId(loc.id);
    setEditingLabelText(loc.label);
  };

  const handleSaveRename = (locId: string) => {
    if (!editingLabelText.trim()) return;
    renameLocation(locId, editingLabelText.trim());
    setEditingLocId(null);
    setEditingLabelText('');
    setActionFeedback({ msg: 'Label updated.', isError: false });
  };

  return (
    <ScreenContainer
      title="Saved Locations"
      subtitle="Manage the places you want to check weather for."
      onBack={() => navigation.goBack()}
    >
      <ScrollView showsVerticalScrollIndicator={false} className="flex-1">

        {/* Feedback Alert Banner */}
        {actionFeedback && (
          <View
            className={`p-3 rounded-xl mb-3.5 border ${
              actionFeedback.isError
                ? 'bg-red-500/15 border-red-500/40 text-red-300'
                : 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
            }`}
          >
            <Text
              className={`text-xs font-semibold ${
                actionFeedback.isError ? 'text-red-300' : 'text-emerald-300'
              }`}
            >
              {actionFeedback.isError ? '⚠️ ' : '✓ '}
              {actionFeedback.msg}
            </Text>
          </View>
        )}

        {/* ── Section 1: Active Location ───────────────────────────────── */}
        <View className="bg-slate-800/90 border border-sky-500/40 rounded-2xl p-4 mb-4 shadow-md">
          <View className="flex-row items-center justify-between mb-2">
            <View className="flex-row items-center">
              <Text className="text-xs mr-1.5">📍</Text>
              <Text className="text-xs font-bold text-sky-400 uppercase tracking-wider">
                Active Location
              </Text>
            </View>
            <View className="bg-emerald-500/20 px-2 py-0.5 rounded border border-emerald-500/40">
              <Text className="text-[10px] font-bold text-emerald-300 uppercase">
                {dataMode === 'live' ? 'Live IMD' : 'Demo Mode'}
              </Text>
            </View>
          </View>

          <View className="flex-row items-baseline justify-between mb-1">
            <Text className="text-2xl font-extrabold text-white tracking-tight">
              {activeLoc.name}
            </Text>
            <Text className="text-xl font-bold text-sky-300">
              {currentWeatherData.temperature}°C
            </Text>
          </View>

          <Text className="text-xs text-slate-300 mb-2">
            {activeLoc.state} • {activeLoc.label}
          </Text>

          <Text className="text-[11px] text-slate-400 leading-4">
            This active location context powers your personalized recommendations, alert triggers,
            and Ask MAUSAM answers.
          </Text>
        </View>

        {/* ── Section 2: Saved Locations List ──────────────────────────── */}
        <View className="mb-4">
          <View className="flex-row items-center justify-between mb-2.5 px-1">
            <Text className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Saved Locations ({savedLocations.length}/{MAX_SAVED_LOCATIONS})
            </Text>
            <Text className="text-[11px] text-slate-500">Tap card to set active</Text>
          </View>

          <View className="space-y-2.5">
            {savedLocations.map((loc) => {
              const isActive =
                loc.city.toLowerCase() === selectedLocation.toLowerCase() ||
                loc.name.toLowerCase() === selectedLocation.toLowerCase();

              const isEditing = editingLocId === loc.id;

              return (
                <View
                  key={loc.id}
                  className={`rounded-2xl p-3.5 mb-2.5 border ${
                    isActive
                      ? 'bg-sky-950/60 border-sky-400/80 shadow-sm'
                      : 'bg-slate-800/80 border-slate-700/60'
                  }`}
                >
                  <TouchableOpacity
                    onPress={() => setActiveLocation(loc.city)}
                    activeOpacity={0.7}
                    className="flex-row items-center justify-between mb-2"
                  >
                    <View className="flex-row items-center flex-1 pr-2">
                      <View className="w-8 h-8 rounded-lg bg-slate-700/60 items-center justify-center mr-2.5">
                        <Text className="text-sm">
                          {loc.label === 'Home'
                            ? '🏠'
                            : loc.label === 'Travel'
                            ? '✈️'
                            : loc.label === 'College'
                            ? '🎓'
                            : loc.label === 'Work'
                            ? '💼'
                            : '📍'}
                        </Text>
                      </View>
                      <View className="flex-1">
                        <View className="flex-row items-center flex-wrap gap-1.5">
                          <Text
                            className={`text-sm font-bold ${
                              isActive ? 'text-white' : 'text-slate-200'
                            }`}
                          >
                            {loc.name}
                          </Text>
                          {isActive && (
                            <View className="bg-sky-500 px-1.5 py-0.5 rounded">
                              <Text className="text-[9px] font-black text-slate-950 uppercase">
                                Active
                              </Text>
                            </View>
                          )}
                          <View className="bg-slate-700/60 px-1.5 py-0.5 rounded border border-slate-600/40">
                            <Text className="text-[9px] font-medium text-slate-300">
                              {loc.label}
                            </Text>
                          </View>
                        </View>
                        <Text className="text-xs text-slate-400 mt-0.5">{loc.state}</Text>
                      </View>
                    </View>

                    <Text className="text-xs text-sky-400 font-semibold">
                      {isActive ? '● Selected' : 'Set Active →'}
                    </Text>
                  </TouchableOpacity>

                  {/* Inline Rename Form */}
                  {isEditing ? (
                    <View className="pt-2 border-t border-slate-700/50 flex-row items-center gap-2">
                      <TextInput
                        value={editingLabelText}
                        onChangeText={setEditingLabelText}
                        placeholder="New label..."
                        placeholderTextColor="#94a3b8"
                        className="flex-1 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-700 text-xs text-white"
                        autoFocus
                      />
                      <TouchableOpacity
                        onPress={() => handleSaveRename(loc.id)}
                        className="bg-sky-500 px-3 py-1.5 rounded-lg"
                      >
                        <Text className="text-xs font-bold text-slate-950">Save</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => setEditingLocId(null)}
                        className="bg-slate-700 px-2.5 py-1.5 rounded-lg"
                      >
                        <Text className="text-xs text-slate-300">Cancel</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    /* Action buttons: Edit Label & Remove */
                    <View className="pt-2 border-t border-slate-700/40 flex-row items-center justify-end gap-2">
                      <TouchableOpacity
                        onPress={() => handleStartRename(loc)}
                        activeOpacity={0.7}
                        className="bg-slate-700/50 px-2.5 py-1 rounded-lg border border-slate-600/40"
                      >
                        <Text className="text-[10px] font-semibold text-slate-300">
                          ✏️ Edit Label
                        </Text>
                      </TouchableOpacity>

                      {savedLocations.length > 1 && (
                        <TouchableOpacity
                          onPress={() => handleRemove(loc)}
                          activeOpacity={0.7}
                          className="bg-red-500/15 px-2.5 py-1 rounded-lg border border-red-500/30"
                        >
                          <Text className="text-[10px] font-semibold text-red-300">
                            🗑️ Remove
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        </View>

        {/* ── Section 3: Add Location Form ─────────────────────────────── */}
        <View className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-4 mb-6 shadow-sm">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-xs font-bold text-sky-400 uppercase tracking-wider">
              Add New Location
            </Text>
            <Text className="text-[10px] text-slate-400">
              {savedLocations.length < MAX_SAVED_LOCATIONS
                ? `${MAX_SAVED_LOCATIONS - savedLocations.length} slots remaining`
                : 'Limit reached (5/5)'}
            </Text>
          </View>

          {savedLocations.length >= MAX_SAVED_LOCATIONS ? (
            <View className="bg-slate-900/60 p-3 rounded-xl">
              <Text className="text-xs text-slate-400 text-center">
                You can save up to 5 locations. Remove an existing location to add a new one.
              </Text>
            </View>
          ) : (
            <View>
              {/* City Selection */}
              <Text className="text-[11px] font-semibold text-slate-300 mb-1.5">
                Select Supported IMD Station City:
              </Text>
              <View className="flex-row flex-wrap gap-2 mb-3">
                {SUPPORTED_CITIES.map((cityObj) => {
                  const isCitySelected = selectedCityToAdd === cityObj.city;
                  const alreadySaved = savedLocations.some(
                    (l) => l.city.toLowerCase() === cityObj.city.toLowerCase()
                  );

                  return (
                    <TouchableOpacity
                      key={cityObj.id}
                      onPress={() => setSelectedCityToAdd(cityObj.city)}
                      disabled={alreadySaved}
                      activeOpacity={0.7}
                      className={`px-3 py-2 rounded-xl border flex-row items-center ${
                        alreadySaved
                          ? 'bg-slate-900/40 border-slate-800 opacity-40'
                          : isCitySelected
                          ? 'bg-sky-500/25 border-sky-400'
                          : 'bg-slate-900/80 border-slate-700/60'
                      }`}
                    >
                      <Text className="text-xs mr-1">📍</Text>
                      <Text
                        className={`text-xs font-bold ${
                          alreadySaved
                            ? 'text-slate-500'
                            : isCitySelected
                            ? 'text-sky-200'
                            : 'text-slate-300'
                        }`}
                      >
                        {cityObj.name} {alreadySaved ? '(Saved)' : ''}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Label Selection Presets */}
              <Text className="text-[11px] font-semibold text-slate-300 mb-1.5">
                Location Label:
              </Text>
              <View className="flex-row flex-wrap gap-1.5 mb-3">
                {LOCATION_LABEL_OPTIONS.map((label) => {
                  const isLabelSelected = selectedLabelToAdd === label && !customLabelInput;
                  return (
                    <TouchableOpacity
                      key={label}
                      onPress={() => {
                        setSelectedLabelToAdd(label);
                        setCustomLabelInput('');
                      }}
                      activeOpacity={0.7}
                      className={`px-2.5 py-1 rounded-lg border ${
                        isLabelSelected
                          ? 'bg-teal-500/25 border-teal-400'
                          : 'bg-slate-900/60 border-slate-700/60'
                      }`}
                    >
                      <Text
                        className={`text-[11px] font-medium ${
                          isLabelSelected ? 'text-teal-200 font-bold' : 'text-slate-400'
                        }`}
                      >
                        {label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Custom Label Input */}
              <TextInput
                value={customLabelInput}
                onChangeText={setCustomLabelInput}
                placeholder="Or enter custom label (e.g. Grandma's House)..."
                placeholderTextColor="#64748b"
                className="bg-slate-900/90 px-3.5 py-2.5 rounded-xl border border-slate-700 text-xs text-white mb-3"
              />

              {/* Submit Button */}
              <TouchableOpacity
                onPress={handleAddLocation}
                activeOpacity={0.8}
                className="w-full bg-sky-500 py-3 rounded-xl items-center justify-center shadow-md shadow-sky-500/20"
              >
                <Text className="text-slate-950 font-bold text-xs">
                  + Add Location to Saved Places
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

      </ScrollView>
    </ScreenContainer>
  );
};
