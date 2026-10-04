import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useWeather } from '../../context/WeatherContext';

export const DemoWeatherSelector: React.FC = () => {
  const { currentScenarioId, availableScenarios, setScenario } = useWeather();

  return (
    <View className="mb-5">
      <View className="flex-row items-center justify-between mb-1 px-0.5">
        <View className="flex-row items-center">
          <View className="bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/40 mr-2">
            <Text className="text-[10px] font-bold text-amber-300 uppercase tracking-wider">
              Demo Mode
            </Text>
          </View>
          <Text className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Simulate Weather Scenario
          </Text>
        </View>
        <Text className="text-[10px] text-sky-400 font-medium">Deterministic Switcher</Text>
      </View>
      <Text className="text-[10px] text-slate-400 mb-2.5 px-0.5 italic">
        Prototype weather scenario — not live IMD data
      </Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingRight: 10 }}
        className="flex-row"
      >
        {availableScenarios.map((scenario) => {
          const isActive = scenario.id === currentScenarioId;

          return (
            <TouchableOpacity
              key={scenario.id}
              onPress={() => setScenario(scenario.id)}
              activeOpacity={0.7}
              className={`mr-2.5 px-3.5 py-2 rounded-xl border flex-row items-center ${
                isActive
                  ? 'bg-sky-500 border-sky-400 shadow-md shadow-sky-500/30'
                  : 'bg-slate-800/80 border-slate-700/60'
              }`}
            >
              <Text className="text-sm mr-1.5">{scenario.icon}</Text>
              <Text
                className={`text-xs font-bold ${
                  isActive ? 'text-slate-950' : 'text-slate-200'
                }`}
              >
                {scenario.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};
