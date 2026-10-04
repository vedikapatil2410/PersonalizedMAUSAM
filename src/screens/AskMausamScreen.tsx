import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { ScreenContainer } from '../components/ui/ScreenContainer';
import { useApp } from '../context/AppContext';
import { useWeather } from '../context/WeatherContext';
import { generateAskMausamResponse } from '../services/askMausamEngine';
import type { AskMausamMessage } from '../types/askMausam';
import type { RootStackScreenProps } from '../navigation/types';
import { PERSONA_CATALOG } from '../constants/personas';

const QUICK_QUESTIONS = [
  "What's the weather now?",
  'Should I carry an umbrella?',
  'Can I go for a run?',
  'How are commuting conditions?',
  'How strong is the wind?',
  'Is there any severe weather?',
  'Is it good for crops?',
];

export const AskMausamScreen: React.FC<RootStackScreenProps<'AskMausam'>> = ({ navigation }) => {
  const userState = useApp();
  const { currentWeatherData, dataMode, currentScenarioId, availableScenarios } = useWeather();
  const [inputText, setInputText] = useState('');
  const scrollViewRef = useRef<ScrollView>(null);

  const activeScenario = availableScenarios.find((s) => s.id === currentScenarioId);
  const location =
    userState.selectedLocation === 'Choose Later'
      ? 'your location'
      : userState.selectedLocation || currentWeatherData.location;

  const personaTitles = userState.selectedPersonas
    .map((pId) => {
      if (pId === 'outdoor') return 'Beach & Outdoor';
      const match = PERSONA_CATALOG.find((p) => p.id === pId);
      return match ? match.title : pId;
    })
    .join(', ');

  const [messages, setMessages] = useState<AskMausamMessage[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: `Hello! I am Ask MAUSAM, your weather-aware assistant for ${location}. You can ask about current conditions, rain probability, outdoor workouts, travel safety, or farming guidance.`,
      explainability: `Rule-based assistant • Personalized for: ${personaTitles || 'General User'}.`,
      dataMode,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const handleSend = (textToSend?: string) => {
    const query = (textToSend || inputText).trim();
    if (!query) return;

    const userMessage: AskMausamMessage = {
      id: `user_${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const assistantMessage = generateAskMausamResponse({
      query,
      weatherData: currentWeatherData,
      userState,
      dataMode,
    });

    setMessages((prev) => [...prev, userMessage, assistantMessage]);
    setInputText('');

    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const handleClear = () => {
    setMessages([
      {
        id: `welcome_${Date.now()}`,
        sender: 'assistant',
        text: `Conversation cleared. Ask me another question about ${location}.`,
        explainability: `Rule-based assistant • Personalized for: ${personaTitles || 'General User'}.`,
        dataMode,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  return (
    <ScreenContainer
      title="Ask MAUSAM"
      subtitle="Weather-aware conversational assistant"
      onBack={() => navigation.goBack()}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        {/* Status Bar: Live IMD vs Demo Indicator */}
        <View className="bg-slate-800/80 border border-slate-700/60 rounded-xl px-3.5 py-2 mb-3 flex-row items-center justify-between">
          <View className="flex-row items-center flex-1 mr-2">
            <View
              className={`w-2 h-2 rounded-full mr-2 ${
                dataMode === 'live' ? 'bg-emerald-400' : 'bg-amber-400'
              }`}
            />
            <Text className="text-[11px] font-semibold text-slate-300">
              {dataMode === 'live'
                ? `Live IMD: 📍 ${location}`
                : `Demo Mode: ${activeScenario?.label || 'Simulated'}`}
            </Text>
          </View>
          <TouchableOpacity onPress={handleClear} activeOpacity={0.7}>
            <Text className="text-[10px] font-bold text-sky-400">Clear Chat</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Suggestion Chips */}
        <View className="mb-3">
          <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 px-0.5">
            Quick Questions
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="flex-row"
            contentContainerStyle={{ paddingRight: 10 }}
          >
            {QUICK_QUESTIONS.map((q, idx) => (
              <TouchableOpacity
                key={idx}
                onPress={() => handleSend(q)}
                activeOpacity={0.7}
                className="bg-slate-800/90 border border-slate-700/70 mr-2 px-3 py-1.5 rounded-lg"
              >
                <Text className="text-[11px] font-medium text-sky-300">{q}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Chat Messages List */}
        <ScrollView
          ref={scrollViewRef}
          showsVerticalScrollIndicator={false}
          className="flex-1 mb-3"
          contentContainerStyle={{ paddingBottom: 10 }}
        >
          {messages.map((msg) => {
            const isUser = msg.sender === 'user';

            return (
              <View
                key={msg.id}
                className={`mb-3 flex-row ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <View className="w-7 h-7 rounded-lg bg-sky-500/20 border border-sky-400/30 items-center justify-center mr-2 mt-0.5">
                    <Text className="text-xs">🌦️</Text>
                  </View>
                )}

                <View
                  className={`max-w-[85%] rounded-2xl p-3.5 ${
                    isUser
                      ? 'bg-sky-600 rounded-tr-sm'
                      : 'bg-slate-800/90 border border-slate-700/80 rounded-tl-sm shadow-md'
                  }`}
                >
                  {/* Safety Warning Header if present */}
                  {msg.safetyNotice && (
                    <View className="bg-red-500/25 border border-red-500/40 rounded-lg p-2 mb-2 flex-row items-center">
                      <Text className="text-xs mr-1.5">🚨</Text>
                      <Text className="text-[10px] font-extrabold text-red-200 flex-1 leading-3">
                        {msg.safetyNotice}
                      </Text>
                    </View>
                  )}

                  {/* Message Body */}
                  <Text
                    className={`text-xs leading-5 font-normal ${
                      isUser ? 'text-white font-medium' : 'text-slate-100'
                    }`}
                  >
                    {msg.text}
                  </Text>

                  {/* Explainability Footer for Assistant */}
                  {msg.explainability && (
                    <View className="mt-2.5 pt-2 border-t border-slate-700/50">
                      <Text className="text-[10px] text-sky-300 font-medium leading-3">
                        💡 {msg.explainability}
                      </Text>
                    </View>
                  )}

                  {/* Timestamp */}
                  <Text
                    className={`text-[9px] mt-1.5 self-end ${
                      isUser ? 'text-sky-200' : 'text-slate-400'
                    }`}
                  >
                    {msg.timestamp}
                  </Text>
                </View>
              </View>
            );
          })}
        </ScrollView>

        {/* Input Bar */}
        <View className="bg-slate-800/90 border border-slate-700/80 rounded-xl p-1.5 flex-row items-center mb-2">
          <TextInput
            value={inputText}
            onChangeText={setInputText}
            placeholder="Ask about weather, workouts, rain..."
            placeholderTextColor="#94a3b8"
            returnKeyType="send"
            onSubmitEditing={() => handleSend()}
            className="flex-1 px-3 py-2 text-xs text-white"
          />
          <TouchableOpacity
            onPress={() => handleSend()}
            activeOpacity={0.7}
            disabled={!inputText.trim()}
            className={`px-3.5 py-2 rounded-lg ${
              inputText.trim() ? 'bg-sky-500' : 'bg-slate-700/60 opacity-50'
            }`}
          >
            <Text className="text-xs font-bold text-white">Send</Text>
          </TouchableOpacity>
        </View>

        {/* Disclaimer Footer */}
        <Text className="text-[10px] text-slate-400 text-center italic mb-1">
          Rule-based weather intelligence • SIH 2026 Prototype
        </Text>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
};
