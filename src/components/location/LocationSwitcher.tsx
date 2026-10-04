/**
 * Phase 15 — Location Switcher Component
 * SIH26076 · PersonalizedMAUSAM
 *
 * Prominently displays the active weather location and provides a
 * fast, interactive switcher across saved locations.
 */

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal } from 'react-native';
import { useApp } from '../../context/AppContext';
import type { WeatherLocation } from '../../types/locations';

interface LocationSwitcherProps {
  onManageLocations?: () => void;
}

export const LocationSwitcher: React.FC<LocationSwitcherProps> = ({ onManageLocations }) => {
  const { selectedLocation, savedLocations, setActiveLocation } = useApp();
  const [modalVisible, setModalVisible] = useState<boolean>(false);

  const activeLocation = savedLocations.find(
    (loc) =>
      loc.city.toLowerCase() === selectedLocation.toLowerCase() ||
      loc.name.toLowerCase() === selectedLocation.toLowerCase() ||
      loc.isCurrentLocation
  ) || {
    id: 'active',
    name: selectedLocation,
    city: selectedLocation,
    state: selectedLocation === 'Choose Later' ? 'Unassigned' : 'Observation District',
    country: 'India',
    label: 'Primary',
    isCurrentLocation: true,
  };

  const handleSelect = (loc: WeatherLocation) => {
    setActiveLocation(loc.city);
    setModalVisible(false);
  };

  const handleManage = () => {
    setModalVisible(false);
    if (onManageLocations) {
      onManageLocations();
    }
  };

  return (
    <>
      {/* Prominent Active Location Header Banner */}
      <TouchableOpacity
        onPress={() => setModalVisible(true)}
        activeOpacity={0.7}
        className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-3.5 mb-3 flex-row items-center justify-between shadow-sm"
      >
        <View className="flex-row items-center flex-1 mr-2">
          <View className="w-10 h-10 rounded-xl bg-sky-500/20 border border-sky-400/30 items-center justify-center mr-3">
            <Text className="text-xl">📍</Text>
          </View>
          <View className="flex-1">
            <View className="flex-row items-center flex-wrap gap-1.5 mb-0.5">
              <Text className="text-base font-extrabold text-white tracking-tight">
                {activeLocation.city}
              </Text>
              {activeLocation.label ? (
                <View className="bg-sky-500/20 px-2 py-0.5 rounded border border-sky-400/30">
                  <Text className="text-[10px] font-bold text-sky-300">
                    {activeLocation.label}
                  </Text>
                </View>
              ) : null}
            </View>
            <Text className="text-xs text-slate-400">
              {activeLocation.state} • {savedLocations.length} saved
            </Text>
          </View>
        </View>

        <View className="bg-slate-700/60 px-2.5 py-1.5 rounded-xl border border-slate-600/50 flex-row items-center">
          <Text className="text-[11px] font-bold text-sky-300 mr-1">Switch</Text>
          <Text className="text-xs text-sky-300">▼</Text>
        </View>
      </TouchableOpacity>

      {/* Location Switcher Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
          className="flex-1 bg-black/70 justify-center px-4"
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
            className="bg-slate-900 border border-slate-700/80 rounded-3xl p-5 shadow-2xl shadow-black"
          >
            {/* Modal Header */}
            <View className="flex-row items-center justify-between pb-3 mb-3 border-b border-slate-800">
              <View>
                <Text className="text-base font-extrabold text-white tracking-tight">
                  Switch Weather District
                </Text>
                <Text className="text-xs text-slate-400 mt-0.5">
                  Select a saved location for homepage & alerts
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                activeOpacity={0.7}
                className="w-8 h-8 rounded-full bg-slate-800 items-center justify-center"
              >
                <Text className="text-slate-400 font-bold text-sm">✕</Text>
              </TouchableOpacity>
            </View>

            {/* Saved Locations List */}
            <View className="space-y-2 mb-4">
              {savedLocations.map((loc) => {
                const isSelected =
                  loc.city.toLowerCase() === selectedLocation.toLowerCase() ||
                  loc.name.toLowerCase() === selectedLocation.toLowerCase();

                return (
                  <TouchableOpacity
                    key={loc.id}
                    onPress={() => handleSelect(loc)}
                    activeOpacity={0.7}
                    className={`p-3.5 rounded-2xl border flex-row items-center justify-between mb-2 ${
                      isSelected
                        ? 'bg-sky-950/70 border-sky-400 shadow-sm'
                        : 'bg-slate-800/80 border-slate-700/60'
                    }`}
                  >
                    <View className="flex-row items-center flex-1 pr-2">
                      <Text className="text-xl mr-3">
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
                      <View className="flex-1">
                        <View className="flex-row items-center flex-wrap gap-1.5">
                          <Text
                            className={`text-sm font-bold ${
                              isSelected ? 'text-white' : 'text-slate-200'
                            }`}
                          >
                            {loc.name}
                          </Text>
                          {loc.label && (
                            <View className="bg-slate-700/60 px-2 py-0.5 rounded border border-slate-600/50">
                              <Text className="text-[9px] font-medium text-slate-300">
                                {loc.label}
                              </Text>
                            </View>
                          )}
                        </View>
                        <Text className="text-xs text-slate-400 mt-0.5">{loc.state}</Text>
                      </View>
                    </View>

                    <View
                      className={`w-5 h-5 rounded-full items-center justify-center border ${
                        isSelected
                          ? 'bg-sky-400 border-sky-300'
                          : 'bg-slate-700/60 border-slate-600'
                      }`}
                    >
                      {isSelected && <View className="w-2 h-2 rounded-full bg-slate-950" />}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Manage Saved Locations Button */}
            {onManageLocations && (
              <TouchableOpacity
                onPress={handleManage}
                activeOpacity={0.7}
                className="bg-slate-800/90 border border-slate-700/70 py-3 rounded-xl items-center justify-center flex-row"
              >
                <Text className="text-xs font-bold text-sky-400 mr-1.5">⚙️</Text>
                <Text className="text-xs font-bold text-sky-300">
                  Manage Saved Locations ({savedLocations.length}/5) →
                </Text>
              </TouchableOpacity>
            )}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </>
  );
};
