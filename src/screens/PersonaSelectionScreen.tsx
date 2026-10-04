import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ScreenContainer } from '../components/ui/ScreenContainer';
import { useApp } from '../context/AppContext';
import { PERSONA_CATALOG } from '../constants/personas';
import type { RootStackScreenProps } from '../navigation/types';
import type { UserPersonaType } from '../types';

export const PersonaSelectionScreen: React.FC<RootStackScreenProps<'PersonaSelection'>> = ({
  navigation,
}) => {
  const { selectedPersonas, togglePersona } = useApp();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleToggle = (personaId: UserPersonaType) => {
    if (errorMessage) {
      setErrorMessage(null);
    }
    togglePersona(personaId);
  };

  const handleContinue = () => {
    if (selectedPersonas.length === 0) {
      setErrorMessage('Please select at least one persona so MAUSAM can tailor your homepage.');
      return;
    }
    setErrorMessage(null);
    navigation.navigate('ActivitySelection');
  };

  return (
    <ScreenContainer
      title="Choose Your Interests (Step 2 of 5)"
      subtitle="Select one or more personas to customize weather priority on your homepage"
      onBack={() => navigation.goBack()}
    >
      <View className="flex-1 justify-between">
        <View>
          {/* Header Status & Validation Notice */}
          <View className="flex-row items-center justify-between mb-3 px-0.5">
            <View className="flex-row items-center">
              <View className="bg-sky-500/20 px-2 py-0.5 rounded border border-sky-400/30 mr-2">
                <Text className="text-[10px] font-bold text-sky-300 uppercase">Step 2 of 5</Text>
              </View>
              <Text className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                {selectedPersonas.length} of {PERSONA_CATALOG.length} Selected
              </Text>
            </View>
            {selectedPersonas.length > 0 && (
              <View className="bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-500/40">
                <Text className="text-[10px] font-semibold text-emerald-300">✓ Selections saved</Text>
              </View>
            )}
          </View>

          {/* Validation Banner */}
          {errorMessage && (
            <View className="bg-amber-500/15 border border-amber-500/30 rounded-xl p-3 mb-4">
              <Text className="text-xs font-semibold text-amber-300">
                ⚠️ {errorMessage}
              </Text>
            </View>
          )}

          {/* Persona Card Grid */}
          <View className="flex-row flex-wrap justify-between">
            {PERSONA_CATALOG.map((item) => {
              const isSelected = selectedPersonas.includes(item.id);

              return (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => handleToggle(item.id)}
                  activeOpacity={0.7}
                  accessibilityLabel={`Select ${item.title} persona, ${item.description}`}
                  accessibilityState={{ selected: isSelected }}
                  accessibilityRole="checkbox"
                  style={[
                    styles.cardBase,
                    isSelected ? styles.cardSelected : styles.cardUnselected,
                  ]}
                >
                  <View className="flex-row items-center justify-between mb-2">
                    <Text className="text-2xl">{item.icon}</Text>
                    <View
                      style={[
                        styles.indicatorBase,
                        isSelected ? styles.indicatorSelected : styles.indicatorUnselected,
                      ]}
                    >
                      {isSelected && (
                        <Text style={styles.checkmark}>✓</Text>
                      )}
                    </View>
                  </View>

                  <Text
                    className="text-sm font-bold mb-1"
                    style={isSelected ? styles.titleSelected : styles.titleUnselected}
                  >
                    {item.title}
                  </Text>

                  <Text
                    numberOfLines={3}
                    className="text-[11px] leading-4"
                    style={isSelected ? styles.descSelected : styles.descUnselected}
                  >
                    {item.description}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Continue Button */}
        <View className="pt-4 pb-4">
          <TouchableOpacity
            onPress={handleContinue}
            activeOpacity={0.8}
            accessibilityLabel={`Continue to Step 3 Activity Selection with ${selectedPersonas.length} personas selected`}
            accessibilityRole="button"
            className="w-full bg-sky-500 py-3.5 rounded-xl items-center justify-center shadow-lg shadow-sky-500/25"
          >
            <Text className="text-slate-950 font-bold text-base">
              Continue to Activity Selection (Step 3 of 5) →
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  cardBase: {
    width: '48%',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  cardSelected: {
    backgroundColor: 'rgba(8, 47, 73, 0.7)',
    borderColor: '#38bdf8',
    shadowColor: '#38bdf8',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  cardUnselected: {
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderColor: 'rgba(51, 65, 85, 0.6)',
  },
  indicatorBase: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  indicatorSelected: {
    backgroundColor: '#38bdf8',
    borderColor: '#7dd3fc',
  },
  indicatorUnselected: {
    backgroundColor: 'rgba(51, 65, 85, 0.6)',
    borderColor: '#475569',
  },
  checkmark: {
    fontSize: 10,
    fontWeight: '800',
    color: '#020617',
  },
  titleSelected: {
    color: '#ffffff',
  },
  titleUnselected: {
    color: '#e2e8f0',
  },
  descSelected: {
    color: '#bae6fd',
  },
  descUnselected: {
    color: '#94a3b8',
  },
});
