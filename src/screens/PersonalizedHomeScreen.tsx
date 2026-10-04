import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../context/AppContext';
import { useWeather } from '../context/WeatherContext';
import { PERSONA_CATALOG } from '../constants/personas';
import { PREFERENCE_CATALOG } from '../constants/preferences';
import { DemoWeatherSelector } from '../components/weather/DemoWeatherSelector';
import { RecommendationCard } from '../components/personalization/RecommendationCard';
import { LocationSwitcher } from '../components/location/LocationSwitcher';
import { AdaptiveHomepageCard } from '../components/homepage/AdaptiveHomepageCard';
import { ContextualActionCard } from '../components/homepage/ContextualActionCard';
import { generatePersonalizedRecommendations } from '../services/personalizationEngine';
import { decideRecommendations } from '../services/decisionEngine';
import { applySafetyOverride } from '../services/safetyOverrideEngine';
import { generatePersonalizedAlerts } from '../services/alertEngine';
import { getDeliveredAlerts } from '../services/notificationEngine';
import { generateDailyBriefing } from '../services/dailyBriefingEngine';
import { generateHomepageLayout } from '../services/homepageLayoutEngine';
import { generateContextualActions } from '../services/contextualActionEngine';
import { getDemoForecast, getLiveForecast } from '../constants/demoForecast';
import type { RootStackScreenProps, RootStackParamList } from '../navigation/types';
import type { HomepageCard } from '../types/homepageLayout';
import { APP_METADATA } from '../constants/config';

interface NavButtonConfig {
  name: string;
  route: keyof RootStackParamList;
  tagline: string;
  badge?: string;
}

const DASHBOARD_ROUTES: NavButtonConfig[] = [
  { name: 'Daily Briefing', route: 'DailyBriefing', tagline: 'Personalized today overview & highlights', badge: 'Briefing' },
  { name: 'Saved Locations', route: 'Locations', tagline: 'Switch & manage weather observation districts', badge: 'Places' },
  { name: 'Forecast', route: 'Forecast', tagline: 'Hourly & 7-day granular conditions' },
  { name: 'Activity Details', route: 'ActivityDetails', tagline: 'Persona-specific condition ratings' },
  { name: 'Traveler', route: 'Traveler', tagline: 'Transit & corridor weather analysis' },
  { name: 'Event Planner', route: 'EventPlanner', tagline: 'Advance event weather feasibility' },
  { name: 'Ask MAUSAM', route: 'AskMausam', tagline: 'Interactive weather assistance query', badge: 'Query' },
  { name: 'Alerts', route: 'Alerts', tagline: 'IMD weather warnings & safety override', badge: 'Priority' },
  { name: 'Insights', route: 'PersonalizationInsights', tagline: 'Explainable personalization rules & triggers', badge: 'Explain' },
  { name: 'Profile / Settings', route: 'Profile', tagline: 'Personas, preferences & saved locations' },
];

export const PersonalizedHomeScreen: React.FC<RootStackScreenProps<'PersonalizedHome'>> = ({
  navigation,
}) => {
  const userState = useApp();
  const { selectedPersonas, selectedPreferences, selectedLocation, togglePersona } = userState;
  const {
    currentWeatherData,
    currentScenarioId,
    availableScenarios,
    dataMode,
    setDataMode,
    isLoading,
    error,
  } = useWeather();

  const activeScenario = availableScenarios.find((s) => s.id === currentScenarioId);

  // Map IDs to human-readable titles ensuring "Beach & Outdoor" is respected
  const personaTitles = selectedPersonas
    .map((pId) => {
      const match = PERSONA_CATALOG.find((p) => p.id === pId);
      return match ? match.title : pId;
    })
    .join(' • ');

  const preferenceTitles = selectedPreferences
    .map((prefId) => {
      const match = PREFERENCE_CATALOG.find((p) => p.id === prefId);
      return match ? match.title : prefId;
    })
    .join(' • ');

  // Alerts Summary for Homepage Banner (Phase 12)
  const activeAlerts = useMemo(() => {
    return generatePersonalizedAlerts({
      weatherData: currentWeatherData,
      userState,
      dataMode,
    });
  }, [currentWeatherData, userState, dataMode]);

  const hasCriticalAlert = activeAlerts.some((a) => a.severity === 'critical');

  // Phase 13: Notification delivery count (respects user preferences)
  const deliveredAlerts = useMemo(() => {
    return getDeliveredAlerts(activeAlerts, userState.notificationPreferences);
  }, [activeAlerts, userState.notificationPreferences]);

  // Pipeline Step 1: Generate candidate recommendations from Personalization Engine
  const rawRecommendations = useMemo(() => {
    return generatePersonalizedRecommendations({
      userState,
      weatherData: currentWeatherData,
    });
  }, [userState, currentWeatherData]);

  // Pipeline Step 2: Rank, prioritize, and enforce feed limits via Decision Engine
  const selectedRecommendations = useMemo(() => {
    return decideRecommendations(rawRecommendations);
  }, [rawRecommendations]);

  // Pipeline Step 3: Enforce safety override
  const recommendations = useMemo(() => {
    return applySafetyOverride(
      selectedRecommendations,
      rawRecommendations,
      currentWeatherData
    );
  }, [selectedRecommendations, rawRecommendations, currentWeatherData]);

  // Phase 16: Forecast data
  const forecastData = useMemo(() => {
    if (dataMode === 'demo') {
      return getDemoForecast(currentScenarioId, selectedLocation);
    }
    return getLiveForecast(currentWeatherData, selectedLocation);
  }, [dataMode, currentScenarioId, currentWeatherData, selectedLocation]);

  // Phase 15 & 17: Active Location Label
  const activeLocationObj = userState.savedLocations?.find(
    (loc) => loc.name.toLowerCase() === selectedLocation.toLowerCase() || loc.city.toLowerCase() === selectedLocation.toLowerCase()
  );
  const locationLabel = activeLocationObj ? `${selectedLocation} • ${activeLocationObj.label}` : selectedLocation;

  // Phase 17: Daily Weather Briefing
  const briefing = useMemo(() => {
    return generateDailyBriefing({
      weatherData: currentWeatherData,
      forecastData,
      selectedPersonas,
      selectedPreferences,
      recommendations: rawRecommendations,
      selectedRecommendations: recommendations,
      alerts: activeAlerts,
      isSafetyActive: hasCriticalAlert || currentWeatherData.severity === 'severe',
      activeLocationName: selectedLocation,
      activeLocationLabel: locationLabel,
      dataMode,
    });
  }, [
    currentWeatherData,
    forecastData,
    selectedPersonas,
    selectedPreferences,
    rawRecommendations,
    recommendations,
    activeAlerts,
    hasCriticalAlert,
    selectedLocation,
    locationLabel,
    dataMode,
  ]);

  // Phase 18: Adaptive Homepage Layout
  const homepageLayout = useMemo(() => {
    return generateHomepageLayout({
      activeLocationName: selectedLocation,
      activeLocationLabel: locationLabel,
      selectedPersonas,
      selectedPreferences,
      weatherData: currentWeatherData,
      recommendations,
      alerts: activeAlerts,
      dailyBriefing: briefing,
      forecastData,
      isSafetyActive: hasCriticalAlert || currentWeatherData.severity === 'severe',
      dataMode,
    });
  }, [
    selectedLocation,
    locationLabel,
    selectedPersonas,
    selectedPreferences,
    currentWeatherData,
    recommendations,
    activeAlerts,
    briefing,
    forecastData,
    hasCriticalAlert,
    dataMode,
  ]);

  // Phase 19: Contextual Quick Actions
  const contextualActions = useMemo(() => {
    return generateContextualActions({
      activeLocationName: selectedLocation,
      selectedPersonas,
      selectedPreferences,
      weatherData: currentWeatherData,
      recommendations,
      alerts: activeAlerts,
      isSafetyActive: hasCriticalAlert || currentWeatherData.severity === 'severe',
      dataMode,
      forecastData,
    });
  }, [
    selectedLocation,
    selectedPersonas,
    selectedPreferences,
    currentWeatherData,
    recommendations,
    activeAlerts,
    hasCriticalAlert,
    dataMode,
    forecastData,
  ]);

  // Severity badge color styling
  const getSeverityStyle = (severity: string) => {
    switch (severity) {
      case 'severe':
        return 'bg-red-500/20 text-red-400 border-red-500/40';
      case 'warning':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/40';
      case 'advisory':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/40';
      default:
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40';
    }
  };

  // =========================================================================
  // Phase 18: Render adaptive card section based on card type
  // =========================================================================
  const renderAdaptiveCardContent = (card: HomepageCard) => {
    switch (card.type) {
      // ---------------------------------------------------------------
      // SAFETY CARD — Critical severe weather override
      // ---------------------------------------------------------------
      case 'safety':
        return (
          <AdaptiveHomepageCard
            key={card.id}
            card={card}
            title={card.title}
            subtitle={card.subtitle}
            icon={card.icon}
            priority="critical"
            badge={card.badge}
            reason={card.reason}
            isCritical
            onPress={() => navigation.navigate('Alerts')}
            onPressExplain={() => navigation.navigate('PersonalizationInsights')}
            actionLabel="View Safety Alerts →"
          >
            <Text className="text-xs text-red-200 leading-4">
              Severe weather override is active. All recommendations have been replaced with
              critical safety advisories. Stay indoors and follow IMD guidelines.
            </Text>
          </AdaptiveHomepageCard>
        );

      // ---------------------------------------------------------------
      // WEATHER SUMMARY — Current observation card (existing weather card)
      // ---------------------------------------------------------------
      case 'weather_summary':
        return (
          <AdaptiveHomepageCard
            key={card.id}
            card={card}
            title={card.title}
            subtitle={`${currentWeatherData.temperature}°C • ${currentWeatherData.weatherCondition.replace('_', ' ')}`}
            icon={card.icon}
            priority={card.priority}
            badge={card.badge}
            reason={card.reason}
            onPress={() => navigation.navigate('Forecast')}
            onPressExplain={() => navigation.navigate('PersonalizationInsights')}
            actionLabel="Full Forecast →"
          >
            {/* Temperature & Condition Main Display */}
            <View className="flex-row items-center justify-between mb-3">
              <View>
                <View className="flex-row items-baseline">
                  <Text className="text-3xl font-extrabold text-white">
                    {currentWeatherData.temperature}°
                  </Text>
                  <Text className="text-base font-bold text-slate-400 ml-0.5">C</Text>
                </View>
                <Text className="text-xs text-slate-400 mt-0.5">
                  Feels like {currentWeatherData.feelsLike}°C
                </Text>
              </View>
              <View className="items-end">
                <Text className="text-2xl mb-0.5">
                  {dataMode === 'live'
                    ? currentWeatherData.weatherCondition === 'rain'
                      ? '🌧️'
                      : currentWeatherData.weatherCondition === 'thunderstorm'
                      ? '⛈️'
                      : currentWeatherData.weatherCondition === 'fog'
                      ? '🌫️'
                      : currentWeatherData.weatherCondition === 'heat'
                      ? '☀️'
                      : currentWeatherData.weatherCondition === 'partly_cloudy'
                      ? '⛅'
                      : currentWeatherData.weatherCondition === 'cloudy'
                      ? '☁️'
                      : currentWeatherData.weatherCondition === 'severe'
                      ? '🚨'
                      : '☀️'
                    : activeScenario?.icon}
                </Text>
                <Text className="text-xs font-semibold text-sky-300 capitalize">
                  {currentWeatherData.weatherCondition.replace('_', ' ')}
                </Text>
                {/* Severity Pill */}
                <View
                  className={`px-2 py-0.5 rounded-full border mt-1 ${getSeverityStyle(
                    currentWeatherData.severity
                  )}`}
                >
                  <Text className="text-[9px] font-bold uppercase tracking-wider">
                    {currentWeatherData.severity}
                  </Text>
                </View>
              </View>
            </View>

            {/* Condition Summary */}
            <View className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-2.5 mb-2.5">
              <Text className="text-[11px] text-slate-300 leading-4">
                {currentWeatherData.summary}
              </Text>
            </View>

            {/* Key Metrics Row */}
            <View className="flex-row flex-wrap justify-between">
              <View className="w-[48%] bg-slate-900/40 border border-slate-700/40 rounded-lg p-2 mb-2">
                <Text className="text-[9px] font-semibold text-slate-400 uppercase">Rain</Text>
                <Text className="text-[11px] font-bold text-white mt-0.5">
                  {dataMode === 'live'
                    ? '0% (Dry / Obs)'
                    : `${currentWeatherData.rainProbability}% (${currentWeatherData.rainfall} mm)`}
                </Text>
              </View>
              <View className="w-[48%] bg-slate-900/40 border border-slate-700/40 rounded-lg p-2 mb-2">
                <Text className="text-[9px] font-semibold text-slate-400 uppercase">Humidity</Text>
                <Text className="text-[11px] font-bold text-white mt-0.5">
                  {currentWeatherData.humidity}%
                </Text>
              </View>
              <View className="w-[48%] bg-slate-900/40 border border-slate-700/40 rounded-lg p-2 mb-2">
                <Text className="text-[9px] font-semibold text-slate-400 uppercase">Wind</Text>
                <Text className="text-[11px] font-bold text-white mt-0.5">
                  {currentWeatherData.windSpeed} km/h {currentWeatherData.windDirection}
                </Text>
              </View>
              <View className="w-[48%] bg-slate-900/40 border border-slate-700/40 rounded-lg p-2 mb-2">
                <View className="flex-row items-center justify-between">
                  <Text className="text-[9px] font-semibold text-slate-400 uppercase">UV</Text>
                  {dataMode === 'live' && currentWeatherData.externalData?.openMeteo?.available && (
                    <Text className="text-[8px] text-sky-400 font-medium">Open-Meteo</Text>
                  )}
                </View>
                <Text className="text-[11px] font-bold text-white mt-0.5">
                  {dataMode === 'live'
                    ? currentWeatherData.externalData?.openMeteo?.available
                      ? `${currentWeatherData.uvIndex} of 12`
                      : 'N/A (IMD Obs)'
                    : `${currentWeatherData.uvIndex} of 12`}
                </Text>
              </View>
              <View className="w-[48%] bg-slate-900/40 border border-slate-700/40 rounded-lg p-2">
                <View className="flex-row items-center justify-between">
                  <Text className="text-[9px] font-semibold text-slate-400 uppercase">Visibility</Text>
                  {dataMode === 'live' && currentWeatherData.externalData?.openMeteo?.available && (
                    <Text className="text-[8px] text-sky-400 font-medium">Open-Meteo</Text>
                  )}
                </View>
                <Text className="text-[11px] font-bold text-white mt-0.5">
                  {dataMode === 'live'
                    ? currentWeatherData.externalData?.openMeteo?.available
                      ? `${currentWeatherData.visibility} km`
                      : 'N/A (IMD Obs)'
                    : `${currentWeatherData.visibility} km`}
                </Text>
              </View>
              <View className="w-[48%] bg-slate-900/40 border border-slate-700/40 rounded-lg p-2">
                <Text className="text-[9px] font-semibold text-slate-400 uppercase">Sun</Text>
                <Text className="text-[10px] font-bold text-white mt-0.5">
                  🌅 {currentWeatherData.sunrise} • 🌇 {currentWeatherData.sunset}
                </Text>
              </View>
            </View>

            {/* Google Pollen Enrichment Banner (When Available) */}
            {currentWeatherData.pollen?.available && (
              <View className="mt-2 bg-emerald-950/40 border border-emerald-500/30 rounded-lg p-2 flex-row items-center justify-between">
                <Text className="text-[10px] text-emerald-300 font-semibold">
                  🌸 Pollen: {currentWeatherData.pollen.category} ({currentWeatherData.pollen.dominantPollenType})
                </Text>
                <Text className="text-[8px] text-emerald-400 uppercase font-bold">Google Pollen</Text>
              </View>
            )}

            {/* Mandatory Data Mode & Attribution Disclaimer */}
            <View className="mt-2.5 pt-2 border-t border-slate-700/40">
              <Text className="text-[9px] text-slate-400 text-center font-medium leading-3 italic">
                {dataMode === 'live'
                  ? currentWeatherData.externalData?.openMeteo?.available
                    ? 'Primary: Official IMD Observation • UV & Visibility: Open-Meteo API'
                    : 'Official India Meteorological Department (IMD) observation data'
                  : 'Prototype demo scenario • Not live IMD data'}
              </Text>
            </View>
          </AdaptiveHomepageCard>
        );

      // ---------------------------------------------------------------
      // DAILY BRIEFING — Phase 17 compact card
      // ---------------------------------------------------------------
      case 'daily_briefing':
        return (
          <AdaptiveHomepageCard
            key={card.id}
            card={card}
            title={card.title}
            subtitle={briefing.headline}
            icon={card.icon}
            priority={card.priority}
            badge={card.badge}
            reason={card.reason}
            onPress={() => navigation.navigate('DailyBriefing')}
            onPressExplain={() => navigation.navigate('PersonalizationInsights')}
            actionLabel="Full Briefing →"
          >
            <Text className="text-xs text-slate-300 leading-4 mb-2">
              {briefing.summary}
            </Text>

            {/* Key Personalized Highlights */}
            {briefing.personalizedHighlights.slice(0, 2).map((item) => (
              <View
                key={item.id}
                className="bg-slate-900/50 border border-slate-700/40 rounded-xl p-2.5 mb-2 flex-row items-start"
              >
                <Text className="text-sm mr-2">{item.icon}</Text>
                <View className="flex-1">
                  <Text className="text-xs font-bold text-white">{item.title}</Text>
                  <Text className="text-[11px] text-slate-300 leading-4">{item.description}</Text>
                </View>
              </View>
            ))}

            {/* Alert Status Footer */}
            <View className="flex-row items-center justify-between pt-1.5">
              <Text className="text-[10px] text-slate-400">
                {hasCriticalAlert
                  ? '🚨 1 Critical Safety Warning'
                  : activeAlerts.length > 0
                  ? `⚠️ ${activeAlerts.length} Weather Alert${activeAlerts.length !== 1 ? 's' : ''} Active`
                  : '✓ No active weather alerts'}
              </Text>
            </View>
          </AdaptiveHomepageCard>
        );

      // ---------------------------------------------------------------
      // PERSONALIZED RECOMMENDATIONS — adaptive summary card
      // ---------------------------------------------------------------
      case 'personalized_recommendations':
        return (
          <AdaptiveHomepageCard
            key={card.id}
            card={card}
            title={card.title}
            subtitle={card.subtitle}
            icon={card.icon}
            priority={card.priority}
            badge={card.badge}
            reason={card.reason}
            onPress={() => navigation.navigate('PersonalizationInsights')}
            onPressExplain={() => navigation.navigate('PersonalizationInsights')}
            actionLabel="View Insights →"
          >
            <Text className="text-xs text-sky-300 font-semibold mb-1">
              Active for: {personaTitles || 'All Users'}
            </Text>
            {recommendations.slice(0, 2).map((rec) => (
              <View
                key={rec.id}
                className="bg-slate-900/50 border border-slate-700/40 rounded-xl p-2.5 mb-1.5 flex-row items-start"
              >
                <Text className="text-sm mr-2">{rec.icon || '✨'}</Text>
                <View className="flex-1">
                  <Text className="text-xs font-bold text-white">{rec.title}</Text>
                  <Text className="text-[11px] text-slate-300 leading-4" numberOfLines={2}>
                    {rec.description}
                  </Text>
                </View>
              </View>
            ))}
            {recommendations.length > 2 && (
              <Text className="text-[10px] text-sky-400 font-semibold mt-0.5">
                +{recommendations.length - 2} more {recommendations.length - 2 === 1 ? 'advisory' : 'advisories'}
              </Text>
            )}
          </AdaptiveHomepageCard>
        );

      // ---------------------------------------------------------------
      // ALERTS — Non-critical weather alerts card
      // ---------------------------------------------------------------
      case 'alerts':
        return (
          <AdaptiveHomepageCard
            key={card.id}
            card={card}
            title={card.title}
            subtitle={card.subtitle}
            icon={card.icon}
            priority={card.priority}
            badge={card.badge}
            reason={card.reason}
            onPress={() => navigation.navigate('Alerts')}
            onPressExplain={() => navigation.navigate('PersonalizationInsights')}
            actionLabel="View All Alerts →"
          >
            {activeAlerts.slice(0, 2).map((alert) => (
              <View
                key={alert.id}
                className="bg-slate-900/50 border border-slate-700/40 rounded-xl p-2.5 mb-1.5 flex-row items-start"
              >
                <Text className="text-sm mr-2">⚠️</Text>
                <View className="flex-1">
                  <Text className="text-xs font-bold text-white">{alert.title}</Text>
                  <Text className="text-[11px] text-slate-300 leading-4" numberOfLines={2}>
                    {alert.message}
                  </Text>
                </View>
              </View>
            ))}
          </AdaptiveHomepageCard>
        );

      // ---------------------------------------------------------------
      // FORECAST — Timeline preview card
      // ---------------------------------------------------------------
      case 'forecast':
        return (
          <AdaptiveHomepageCard
            key={card.id}
            card={card}
            title={card.title}
            subtitle={card.subtitle}
            icon={card.icon}
            priority={card.priority}
            badge={card.badge}
            reason={card.reason}
            onPress={() => navigation.navigate('Forecast')}
            onPressExplain={() => navigation.navigate('PersonalizationInsights')}
            actionLabel="View Forecast →"
          >
            {forecastData && forecastData.periods && forecastData.periods.length > 0 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {forecastData.periods.slice(0, 6).map((period: any, idx: number) => (
                  <View
                    key={`hr-${idx}`}
                    className="bg-slate-900/50 border border-slate-700/40 rounded-lg p-2 mr-2 items-center min-w-[60px]"
                  >
                    <Text className="text-[9px] text-slate-400 font-semibold">{period.displayTime}</Text>
                    <Text className="text-sm my-0.5">☀️</Text>
                    <Text className="text-[11px] font-bold text-white">{period.temperature}°</Text>
                  </View>
                ))}
              </ScrollView>
            ) : (
              <Text className="text-[11px] text-slate-400 italic">
                Forecast timeline preview available from Forecast screen
              </Text>
            )}
          </AdaptiveHomepageCard>
        );

      // ---------------------------------------------------------------
      // PERSONA-SPECIFIC CARDS — Activity, Travel, Event
      // ---------------------------------------------------------------
      case 'activity':
        return (
          <AdaptiveHomepageCard
            key={card.id}
            card={card}
            title={card.title}
            subtitle={card.subtitle}
            icon={card.icon}
            priority={card.priority}
            badge={card.badge}
            reason={card.reason}
            onPress={() => navigation.navigate('ActivityDetails')}
            onPressExplain={() => navigation.navigate('PersonalizationInsights')}
            actionLabel="View Activity Details →"
          >
            <Text className="text-[11px] text-slate-300 leading-4">
              View detailed condition ratings for workouts, running, and outdoor exercise based on current meteorological data.
            </Text>
          </AdaptiveHomepageCard>
        );

      case 'travel':
        return (
          <AdaptiveHomepageCard
            key={card.id}
            card={card}
            title={card.title}
            subtitle={card.subtitle}
            icon={card.icon}
            priority={card.priority}
            badge={card.badge}
            reason={card.reason}
            onPress={() => navigation.navigate('Traveler')}
            onPressExplain={() => navigation.navigate('PersonalizationInsights')}
            actionLabel="View Travel Intel →"
          >
            <Text className="text-[11px] text-slate-300 leading-4">
              Transit corridor conditions, travel comfort ratings, and weather-aware packing suggestions.
            </Text>
          </AdaptiveHomepageCard>
        );

      case 'event':
        return (
          <AdaptiveHomepageCard
            key={card.id}
            card={card}
            title={card.title}
            subtitle={card.subtitle}
            icon={card.icon}
            priority={card.priority}
            badge={card.badge}
            reason={card.reason}
            onPress={() => navigation.navigate('EventPlanner')}
            onPressExplain={() => navigation.navigate('PersonalizationInsights')}
            actionLabel="View Event Planner →"
          >
            <Text className="text-[11px] text-slate-300 leading-4">
              Rain risk assessment, outdoor feasibility ratings, and event-planning weather analysis.
            </Text>
          </AdaptiveHomepageCard>
        );

      default:
        return null;
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-900" edges={['top', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        className="px-4 py-3"
      >
        {/* Header & Brand */}
        <View className="items-center mb-3 pt-1">
          <View className="bg-sky-500/10 border border-sky-500/20 px-3 py-1 rounded-full mb-2">
            <Text className="text-sky-400 text-[11px] font-semibold uppercase tracking-wider">
              SIH 2026 Prototype • {APP_METADATA.sihProblemStatement}
            </Text>
          </View>

          <Text className="text-3xl font-extrabold text-white text-center tracking-tight mb-0.5">
            Personalized MAUSAM
          </Text>

          <Text className="text-xs text-sky-200/80 text-center">
            {APP_METADATA.tagline}
          </Text>
        </View>

        {/* Phase 21: SIH Showcase Mode Live Banner */}
        <TouchableOpacity
          onPress={() => navigation.navigate('ShowcaseMode')}
          activeOpacity={0.8}
          accessibilityLabel="Open SIH Showcase Mode Judge Dashboard"
          accessibilityRole="button"
          className="bg-amber-500/15 border border-amber-500/30 rounded-xl p-2.5 mb-3 flex-row items-center justify-between"
        >
          <View className="flex-row items-center flex-1 mr-2">
            <Text className="text-sm mr-2">🎯</Text>
            <View className="flex-1">
              <Text className="text-xs font-bold text-amber-200">
                SIH Showcase Mode • Rule-Based Personalization
              </Text>
              <Text className="text-[10px] text-amber-300/80 leading-3">
                {dataMode === 'demo' ? 'Controlled Scenario active' : 'Live IMD Mode active'} • Tap to test judge scenarios
              </Text>
            </View>
          </View>
          <View className="bg-amber-500/25 px-2 py-1 rounded border border-amber-400/40">
            <Text className="text-[10px] font-bold text-amber-300">Showcase →</Text>
          </View>
        </TouchableOpacity>

        {/* Compact Weather Alert Banner (Phase 12) */}
        {activeAlerts.length > 0 && (
          <TouchableOpacity
            onPress={() => navigation.navigate('Alerts')}
            activeOpacity={0.7}
            className={`rounded-xl p-2.5 mb-3 flex-row items-center justify-between border ${
              hasCriticalAlert
                ? 'bg-red-500/20 border-red-500/50'
                : 'bg-amber-500/15 border-amber-500/30'
            }`}
          >
            <View className="flex-row items-center flex-1 mr-2">
              <Text className="text-sm mr-2">{hasCriticalAlert ? '🚨' : '⚠️'}</Text>
              <Text
                className={`text-xs font-bold ${
                  hasCriticalAlert ? 'text-red-200' : 'text-amber-200'
                }`}
              >
                {hasCriticalAlert
                  ? 'Critical Safety Warning Active'
                  : `${activeAlerts.length} Weather ${
                      activeAlerts.length === 1 ? 'Alert' : 'Alerts'
                    } Active`}
              </Text>
            </View>
            <Text
              className={`text-[10px] font-bold ${
                hasCriticalAlert ? 'text-red-300' : 'text-amber-300'
              }`}
            >
              View Alerts →
            </Text>
          </TouchableOpacity>
        )}

        {/* Phase 13: Compact Notification Status Row */}
        {activeAlerts.length > 0 && (
          <TouchableOpacity
            onPress={() => navigation.navigate('Profile')}
            activeOpacity={0.7}
            className="flex-row items-center justify-between px-1 mb-3"
          >
            <View className="flex-row items-center">
              <Text className="text-[10px] mr-1.5">
                {userState.notificationPreferences.enabled ? '🔔' : '🔕'}
              </Text>
              <Text className="text-[10px] text-slate-400">
                {userState.notificationPreferences.enabled
                  ? `Notifications: ${deliveredAlerts.length} of ${activeAlerts.length} alert${activeAlerts.length !== 1 ? 's' : ''} active`
                  : 'Notifications disabled'}
              </Text>
            </View>
            <Text className="text-[10px] text-sky-500 font-semibold">Configure →</Text>
          </TouchableOpacity>
        )}

        {/* Live IMD vs Demo Mode Toggle Bar */}

        <View className="bg-slate-800/90 border border-slate-700/80 rounded-xl p-1.5 mb-4 flex-row">
          <TouchableOpacity
            onPress={() => setDataMode('live')}
            activeOpacity={0.7}
            className={`flex-1 py-2 rounded-lg flex-row items-center justify-center ${
              dataMode === 'live' ? 'bg-emerald-600 shadow-sm' : 'bg-transparent'
            }`}
          >
            <View
              className={`w-2 h-2 rounded-full mr-2 ${
                dataMode === 'live' ? 'bg-emerald-200' : 'bg-emerald-500'
              }`}
            />
            <Text
              className={`text-xs font-bold ${
                dataMode === 'live' ? 'text-white' : 'text-slate-400'
              }`}
            >
              Live IMD Data
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setDataMode('demo')}
            activeOpacity={0.7}
            className={`flex-1 py-2 rounded-lg flex-row items-center justify-center ${
              dataMode === 'demo' ? 'bg-amber-600 shadow-sm' : 'bg-transparent'
            }`}
          >
            <View
              className={`w-2 h-2 rounded-full mr-2 ${
                dataMode === 'demo' ? 'bg-amber-200' : 'bg-amber-500'
              }`}
            />
            <Text
              className={`text-xs font-bold ${
                dataMode === 'demo' ? 'text-white' : 'text-slate-400'
              }`}
            >
              Demo Scenarios
            </Text>
          </TouchableOpacity>
        </View>

        {/* Loading Indicator for Live IMD fetch */}
        {isLoading && (
          <View className="bg-sky-500/10 border border-sky-500/30 rounded-xl p-3 mb-4 flex-row items-center justify-center">
            <Text className="text-xs font-semibold text-sky-300">
              ⏳ Loading live IMD weather...
            </Text>
          </View>
        )}

        {/* Error Notification Banner with explicit Live failure choices */}
        {error && dataMode === 'live' && (
          <View className="bg-red-950/40 border border-red-500/50 rounded-xl p-3.5 mb-4">
            <View className="flex-row items-center mb-1">
              <Text className="text-sm mr-1.5">⚠️</Text>
              <Text className="text-xs font-bold text-red-300">
                Live IMD data is currently unavailable.
              </Text>
            </View>
            <Text className="text-[11px] text-slate-300 mb-3">
              We cannot contact the IMD observation service. You can retry fetching or switch to our prototype controlled demo scenarios.
            </Text>
            <View className="flex-row gap-2">
              <TouchableOpacity
                onPress={() => setDataMode('live')}
                activeOpacity={0.7}
                className="bg-slate-800 border border-slate-600 px-3 py-1.5 rounded-lg flex-1 items-center"
                accessibilityLabel="Try Again fetching Live IMD Data"
                accessibilityRole="button"
              >
                <Text className="text-xs font-semibold text-slate-200">Try Again</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  setDataMode('demo');
                }}
                activeOpacity={0.7}
                className="bg-amber-600/80 border border-amber-500 px-3 py-1.5 rounded-lg flex-1 items-center"
                accessibilityLabel="Use Controlled Demo"
                accessibilityRole="button"
              >
                <Text className="text-xs font-bold text-white">Use Controlled Demo</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Demo Mode Weather Scenario Simulator (Visible in Demo Mode) */}
        {dataMode === 'demo' && <DemoWeatherSelector />}

        {/* Phase 15: Prominent Location Switcher Header */}
        <LocationSwitcher onManageLocations={() => navigation.navigate('Locations')} />

        {/* ================================================================= */}
        {/* Phase 18: ADAPTIVE HOMEPAGE CARDS                                 */}
        {/* Dynamically ordered by persona-weighted priority from layout engine */}
        {/* ================================================================= */}

        <View className="mb-2">
          <View className="flex-row items-center justify-between mb-2 px-1">
            <View className="flex-row items-center">
              <Text className="text-[10px] mr-1">🧩</Text>
              <Text className="text-[10px] font-bold text-sky-400 uppercase tracking-wider">
                Adaptive Dashboard
              </Text>
            </View>
            <View className="bg-sky-500/15 px-2 py-0.5 rounded border border-sky-400/30">
              <Text className="text-[9px] font-bold text-sky-300">
                {homepageLayout.cards.length} Cards • {homepageLayout.primaryPersona
                  ? PERSONA_CATALOG.find((p) => p.id === homepageLayout.primaryPersona)?.title || 'General'
                  : 'Balanced'} Priority
              </Text>
            </View>
          </View>
        </View>

        {/* Render adaptive cards in layout-engine-determined order */}
        {homepageLayout.cards.map((card) => renderAdaptiveCardContent(card))}

        {/* Phase 18: Why Your Homepage Looks Like This — Explainability Section */}
        <TouchableOpacity
          onPress={() => navigation.navigate('PersonalizationInsights')}
          activeOpacity={0.7}
          className="bg-slate-800/90 border border-sky-500/30 rounded-xl p-3 mb-4 flex-row items-center justify-between shadow-sm"
        >
          <View className="flex-1 mr-2">
            <View className="flex-row items-center mb-0.5">
              <Text className="text-[10px] mr-1">🧠</Text>
              <Text className="text-[10px] font-bold text-sky-400 uppercase tracking-wider">
                Why your homepage looks like this
              </Text>
            </View>
            <Text className="text-[11px] text-slate-300 leading-4 mt-0.5">
              {homepageLayout.explanation}
            </Text>
            <Text className="text-[10px] text-slate-400 leading-3 mt-1 italic">
              {homepageLayout.cards.length} adaptive cards • {recommendations.length} recommendation{recommendations.length !== 1 ? 's' : ''} • {activeAlerts.length} alert{activeAlerts.length !== 1 ? 's' : ''}
            </Text>
          </View>
          <View className="bg-sky-500/20 px-2 py-1 rounded-lg border border-sky-400/30">
            <Text className="text-[10px] font-bold text-sky-300">Insights →</Text>
          </View>
        </TouchableOpacity>

        {/* ================================================================= */}
        {/* FULL RECOMMENDATIONS FEED (preserving Phase 5/6/7 detail cards)  */}
        {/* ================================================================= */}

        <View className="mb-6">
          <View className="flex-row items-center justify-between mb-1.5 px-1">
            <Text className="text-base font-extrabold text-white tracking-tight uppercase">
              Personalized For You
            </Text>
            <View className="bg-sky-500/20 px-2.5 py-0.5 rounded-full border border-sky-400/30">
              <Text className="text-[10px] font-bold text-sky-300">
                {recommendations.length} Active {recommendations.length === 1 ? 'Advisory' : 'Advisories'}
              </Text>
            </View>
          </View>

          {/* Subtitle displaying active personas and transparent explanation */}
          <View className="mb-3 px-1">
            <Text className="text-xs text-sky-300 font-semibold leading-5">
              Personalized for: {personaTitles || 'All Users (No specific personas selected)'}
            </Text>
            <Text className="text-[11px] text-slate-400 mt-0.5 leading-4">
              Recommendations are based on your selected interests and current weather conditions.
            </Text>
          </View>

          {/* Interactive Persona Quick-Switcher Chips (Instant Live Simulation) */}
          <View className="mb-3.5 bg-slate-800/60 border border-slate-700/50 rounded-xl p-2.5">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Quick Persona Filter (Tap to Toggle)
              </Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('PersonaSelection')}
                activeOpacity={0.7}
              >
                <Text className="text-[10px] font-bold text-sky-400">Edit All →</Text>
              </TouchableOpacity>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="flex-row"
            >
              {PERSONA_CATALOG.map((p) => {
                const isSelected = selectedPersonas.includes(p.id);
                return (
                  <TouchableOpacity
                    key={p.id}
                    onPress={() => togglePersona(p.id)}
                    activeOpacity={0.7}
                    className={`mr-2 px-2.5 py-1.5 rounded-lg border flex-row items-center ${
                      isSelected
                        ? 'bg-sky-500/25 border-sky-400 text-sky-200'
                        : 'bg-slate-900/60 border-slate-700/60'
                    }`}
                  >
                    <Text className="text-xs mr-1">{p.icon}</Text>
                    <Text
                      className={`text-[11px] font-medium ${
                        isSelected ? 'text-sky-200 font-bold' : 'text-slate-400'
                      }`}
                    >
                      {p.title}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Final Personalized Recommendations Feed */}
          {recommendations.length > 0 ? (
            recommendations.map((rec) => (
              <RecommendationCard
                key={rec.id}
                item={rec}
                onPressExplain={() => navigation.navigate('PersonalizationInsights')}
              />
            ))
          ) : (
            <View className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-6 items-center">
              <Text className="text-3xl mb-2">✨</Text>
              <Text className="text-sm font-bold text-white mb-1">
                You're all set
              </Text>
              <Text className="text-xs text-slate-400 text-center leading-4 max-w-xs">
                Current conditions don't require any personalized alerts.
              </Text>
            </View>
          )}
        </View>

        {/* Onboarding State & Personalization Context Card */}
        <View className="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-4 mb-5 shadow-sm">
          <View className="flex-row items-center justify-between pb-3 mb-3 border-b border-slate-700/60">
            <Text className="text-xs font-bold text-sky-400 uppercase tracking-wider">
              Personalization Settings
            </Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('Profile')}
              activeOpacity={0.7}
              className="bg-sky-500/15 border border-sky-500/30 px-2.5 py-1 rounded-md"
            >
              <Text className="text-[11px] font-semibold text-sky-300">Edit Settings</Text>
            </TouchableOpacity>
          </View>

          {/* Location */}
          <TouchableOpacity
            onPress={() => navigation.navigate('Locations')}
            activeOpacity={0.7}
            className="mb-3 flex-row items-center justify-between"
          >
            <View className="flex-1 mr-2">
              <Text className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Saved Locations & Active District
              </Text>
              <Text className="text-sm font-bold text-white mt-0.5">
                📍 {selectedLocation}
              </Text>
            </View>
            <Text className="text-[10px] font-bold text-sky-400">Manage →</Text>
          </TouchableOpacity>

          {/* Personas */}
          <TouchableOpacity
            onPress={() => navigation.navigate('PersonaSelection')}
            activeOpacity={0.7}
            className="mb-3 flex-row items-center justify-between"
          >
            <View className="flex-1 mr-2">
              <Text className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Your Personas
              </Text>
              <Text className="text-xs font-semibold text-sky-200 mt-0.5 leading-5">
                {personaTitles || 'None selected'}
              </Text>
            </View>
            <Text className="text-[10px] font-bold text-sky-400">Edit →</Text>
          </TouchableOpacity>

          {/* Preferences */}
          <TouchableOpacity
            onPress={() => navigation.navigate('Preferences')}
            activeOpacity={0.7}
            className="flex-row items-center justify-between"
          >
            <View className="flex-1 mr-2">
              <Text className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Your Weather Preferences
              </Text>
              <Text className="text-xs text-slate-300 mt-0.5 leading-5">
                {preferenceTitles || 'None selected'}
              </Text>
            </View>
            <Text className="text-[10px] font-bold text-sky-400">Edit →</Text>
          </TouchableOpacity>
        </View>

        {/* Phase 19: Recommended Actions For You (Contextual Quick Actions) */}
        {contextualActions.length > 0 && (
          <View className="mb-6">
            <View className="flex-row items-center justify-between mb-2.5 px-1">
              <View className="flex-row items-center">
                <Text className="text-base font-extrabold text-white tracking-tight uppercase mr-2">
                  Recommended Actions For You
                </Text>
              </View>
              <View className="bg-sky-500/20 px-2.5 py-0.5 rounded-full border border-sky-400/30">
                <Text className="text-[10px] font-bold text-sky-300">
                  {contextualActions.length} Contextual {contextualActions.length === 1 ? 'Action' : 'Actions'}
                </Text>
              </View>
            </View>

            {contextualActions.map((action) => (
              <ContextualActionCard
                key={action.id}
                action={action}
                onPress={() => navigation.navigate(action.route)}
                onPressExplain={() => navigation.navigate('PersonalizationInsights')}
              />
            ))}
          </View>
        )}

        {/* Quick Navigation Application Screens */}
        <View className="mb-6">
          <View className="flex-row items-center justify-between mb-3 px-1">
            <Text className="text-sm font-bold text-slate-300 uppercase tracking-wider">
              Application Screens
            </Text>
            <Text className="text-xs text-slate-500 font-medium">Quick Actions</Text>
          </View>

          <View className="space-y-2.5">
            {DASHBOARD_ROUTES.map((item) => (
              <TouchableOpacity
                key={item.route}
                onPress={() => navigation.navigate(item.route)}
                activeOpacity={0.7}
                className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-3.5 flex-row items-center justify-between mb-2.5"
              >
                <View className="flex-1 pr-3">
                  <View className="flex-row items-center mb-0.5">
                    <Text className="text-sm font-bold text-white mr-2">{item.name}</Text>
                    {item.badge && (
                      <View className="bg-sky-500/20 px-2 py-0.5 rounded border border-sky-400/30">
                        <Text className="text-[10px] font-semibold text-sky-300">
                          {item.badge}
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text className="text-xs text-slate-400">{item.tagline}</Text>
                </View>

                <Text className="text-sky-400 font-bold text-base">→</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Development Quick-Nav */}
        <View className="bg-slate-800/40 border border-slate-700/40 rounded-xl p-4 mb-4">
          <Text className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Prototype Demo Reset
          </Text>
          <TouchableOpacity
            onPress={() => navigation.reset({ index: 0, routes: [{ name: 'Splash' }] })}
            activeOpacity={0.7}
            className="bg-slate-700/60 py-2 rounded-lg items-center"
          >
            <Text className="text-xs font-medium text-slate-300">Restart Full Onboarding Flow</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};
