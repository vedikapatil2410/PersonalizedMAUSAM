/**
 * Phase 14 — Personalization Insights Screen
 * SIH26076 · PersonalizedMAUSAM
 *
 * Displays a transparent, rule-based explanation of why the user's
 * Personalized MAUSAM homepage looks the way it does.
 *
 * This screen is an OBSERVATION layer only.
 * It does not re-run or duplicate any recommendation/alert engine.
 */

import React, { useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { ScreenContainer } from '../components/ui/ScreenContainer';
import { useApp } from '../context/AppContext';
import { useWeather } from '../context/WeatherContext';
import { generatePersonalizedRecommendations } from '../services/personalizationEngine';
import { decideRecommendations } from '../services/decisionEngine';
import { applySafetyOverride } from '../services/safetyOverrideEngine';
import { generatePersonalizedAlerts } from '../services/alertEngine';
import { getNotificationDeliveryDecisions } from '../services/notificationEngine';
import { generatePersonalizationInsights } from '../services/personalizationInsightEngine';
import type { PersonalizationInsight } from '../types/personalizationInsights';
import type { InsightType } from '../types/personalizationInsights';
import type { RootStackScreenProps } from '../navigation/types';

// ─── Style helpers ────────────────────────────────────────────────────────────

const getInsightTypeStyle = (type: InsightType, isCritical: boolean) => {
  if (isCritical) {
    return {
      border: 'border-red-500 bg-red-950/40',
      badge: 'bg-red-500/25 border-red-500/50',
      badgeText: 'text-red-200',
      label: 'CRITICAL',
      headerBg: 'bg-red-600/20 border-b border-red-500/30',
    };
  }
  switch (type) {
    case 'safety_override':
      return {
        border: 'border-red-500/80 bg-red-950/30',
        badge: 'bg-red-500/25 border-red-500/50',
        badgeText: 'text-red-200',
        label: 'SAFETY OVERRIDE',
        headerBg: 'bg-red-600/20 border-b border-red-500/30',
      };
    case 'weather_trigger':
      return {
        border: 'border-amber-500/50 bg-amber-950/10',
        badge: 'bg-amber-500/20 border-amber-500/40',
        badgeText: 'text-amber-200',
        label: 'WEATHER TRIGGER',
        headerBg: '',
      };
    case 'recommendation':
      return {
        border: 'border-sky-500/50 bg-slate-800/80',
        badge: 'bg-sky-500/20 border-sky-400/40',
        badgeText: 'text-sky-200',
        label: 'RECOMMENDATION',
        headerBg: '',
      };
    case 'persona_match':
      return {
        border: 'border-violet-500/40 bg-slate-800/70',
        badge: 'bg-violet-500/20 border-violet-500/40',
        badgeText: 'text-violet-200',
        label: 'PERSONA',
        headerBg: '',
      };
    case 'preference_match':
      return {
        border: 'border-teal-500/40 bg-slate-800/70',
        badge: 'bg-teal-500/20 border-teal-500/40',
        badgeText: 'text-teal-200',
        label: 'PREFERENCE',
        headerBg: '',
      };
    case 'alert':
      return {
        border: 'border-orange-500/40 bg-slate-800/70',
        badge: 'bg-orange-500/20 border-orange-500/40',
        badgeText: 'text-orange-200',
        label: 'ALERT',
        headerBg: '',
      };
    case 'notification':
      return {
        border: 'border-slate-600/50 bg-slate-800/60',
        badge: 'bg-slate-700/50 border-slate-600/50',
        badgeText: 'text-slate-300',
        label: 'NOTIFICATION',
        headerBg: '',
      };
    default:
      return {
        border: 'border-slate-700/50 bg-slate-800/60',
        badge: 'bg-slate-700/50 border-slate-600/50',
        badgeText: 'text-slate-300',
        label: 'INFO',
        headerBg: '',
      };
  }
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const InsightCard: React.FC<{ insight: PersonalizationInsight }> = ({ insight }) => {
  const style = getInsightTypeStyle(insight.type, insight.isCritical);

  return (
    <View className={`rounded-2xl p-4 mb-3.5 border ${style.border} overflow-hidden`}>
      {/* Critical header banner */}
      {insight.isCritical && style.headerBg !== '' && (
        <View
          className={`-mx-4 -mt-4 px-4 py-2 mb-3 flex-row items-center ${style.headerBg}`}
        >
          <Text className="text-xs mr-1.5">{insight.icon}</Text>
          <Text className="text-[10px] font-extrabold text-red-200 uppercase tracking-wider">
            CRITICAL SAFETY OVERRIDE — OFFICIAL IMD
          </Text>
        </View>
      )}

      {/* Header row: type badge + source */}
      <View className="flex-row items-center justify-between mb-2 flex-wrap gap-1.5">
        <View className="flex-row items-center gap-1.5 flex-wrap flex-1 pr-1">
          {/* Type badge */}
          <View className={`px-2 py-0.5 rounded border ${style.badge}`}>
            <Text className={`text-[9px] font-bold uppercase tracking-wider ${style.badgeText}`}>
              {style.label}
            </Text>
          </View>

          {/* Source */}
          <View
            className={`px-2 py-0.5 rounded border ${
              insight.source === 'Official IMD'
                ? 'bg-emerald-500/20 border-emerald-500/40'
                : insight.source === 'Personalized MAUSAM'
                ? 'bg-sky-500/20 border-sky-400/30'
                : 'bg-slate-700/50 border-slate-600/40'
            }`}
          >
            <Text
              className={`text-[9px] font-bold uppercase tracking-wider ${
                insight.source === 'Official IMD'
                  ? 'text-emerald-300'
                  : insight.source === 'Personalized MAUSAM'
                  ? 'text-sky-300'
                  : 'text-slate-400'
              }`}
            >
              {insight.source}
            </Text>
          </View>

          {/* Persona badge */}
          {insight.relatedPersonaLabel && (
            <View className="bg-violet-500/15 px-2 py-0.5 rounded border border-violet-500/30">
              <Text className="text-[9px] font-medium text-violet-300">
                {insight.relatedPersonaLabel}
              </Text>
            </View>
          )}
        </View>

        {/* Priority pill */}
        {insight.priority && (
          <View
            className={`px-2 py-0.5 rounded-full border ${
              insight.priority === 'critical'
                ? 'bg-red-500/25 border-red-500/50'
                : insight.priority === 'high'
                ? 'bg-amber-500/20 border-amber-500/40'
                : insight.priority === 'medium'
                ? 'bg-sky-500/20 border-sky-400/40'
                : 'bg-slate-700/50 border-slate-600/40'
            }`}
          >
            <Text
              className={`text-[9px] font-bold uppercase ${
                insight.priority === 'critical'
                  ? 'text-red-200'
                  : insight.priority === 'high'
                  ? 'text-amber-200'
                  : insight.priority === 'medium'
                  ? 'text-sky-200'
                  : 'text-slate-300'
              }`}
            >
              {insight.priority}
            </Text>
          </View>
        )}
      </View>

      {/* Title */}
      <View className="flex-row items-center mb-1">
        <Text className="text-sm mr-1.5">{insight.icon}</Text>
        <Text className="text-sm font-bold text-white tracking-tight flex-1">
          {insight.title}
        </Text>
      </View>

      {/* Description */}
      <Text className="text-xs text-slate-300 leading-5 mb-3">{insight.description}</Text>

      {/* Why this? box */}
      <View className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-2.5">
        <View className="flex-row items-center mb-0.5">
          <Text className="text-[10px] mr-1">💡</Text>
          <Text className="text-[10px] font-bold text-sky-400 uppercase tracking-wider">
            Rule-Based Explanation
          </Text>
        </View>
        <Text className="text-xs text-slate-300 leading-4">{insight.explanation}</Text>
        {insight.triggeredBy && (
          <Text className="text-[10px] text-slate-500 mt-1">
            Trigger: {insight.triggeredBy}
          </Text>
        )}
      </View>
    </View>
  );
};

// ─── Section Header ───────────────────────────────────────────────────────────

const SectionHeader: React.FC<{ icon: string; title: string; count?: number }> = ({
  icon,
  title,
  count,
}) => (
  <View className="flex-row items-center mb-3 mt-1">
    <Text className="text-base mr-2">{icon}</Text>
    <Text className="text-sm font-extrabold text-white tracking-tight flex-1">{title}</Text>
    {count !== undefined && (
      <View className="bg-sky-500/20 px-2 py-0.5 rounded border border-sky-400/30">
        <Text className="text-[10px] font-bold text-sky-300">{count}</Text>
      </View>
    )}
  </View>
);

// ─── Main Screen ──────────────────────────────────────────────────────────────

export const PersonalizationInsightsScreen: React.FC<
  RootStackScreenProps<'PersonalizationInsights'>
> = ({ navigation }) => {
  const userState = useApp();
  const { currentWeatherData, dataMode } = useWeather();

  const { selectedPersonas, selectedPreferences, selectedLocation, notificationPreferences } =
    userState;

  // ── Re-use existing pipeline outputs (observation only) ──────────────────
  const rawRecommendations = useMemo(
    () => generatePersonalizedRecommendations({ userState, weatherData: currentWeatherData }),
    [userState, currentWeatherData]
  );

  const selectedRecs = useMemo(
    () => decideRecommendations(rawRecommendations),
    [rawRecommendations]
  );

  const finalRecommendations = useMemo(
    () => applySafetyOverride(selectedRecs, rawRecommendations, currentWeatherData),
    [selectedRecs, rawRecommendations, currentWeatherData]
  );

  const alerts = useMemo(
    () => generatePersonalizedAlerts({ weatherData: currentWeatherData, userState, dataMode }),
    [currentWeatherData, userState, dataMode]
  );

  const notificationDecisions = useMemo(
    () => getNotificationDeliveryDecisions(alerts, notificationPreferences),
    [alerts, notificationPreferences]
  );

  // ── Generate insights report ─────────────────────────────────────────────
  const report = useMemo(
    () =>
      generatePersonalizationInsights({
        weatherData: currentWeatherData,
        dataMode,
        selectedPersonas,
        selectedPreferences,
        selectedLocation,
        rawRecommendations,
        finalRecommendations,
        alerts,
        notificationDecisions,
      }),
    [
      currentWeatherData,
      dataMode,
      selectedPersonas,
      selectedPreferences,
      selectedLocation,
      rawRecommendations,
      finalRecommendations,
      alerts,
      notificationDecisions,
    ]
  );

  const { summary, insights } = report;

  // ── Group insights by section ────────────────────────────────────────────
  const safetyInsights = insights.filter(
    (i) => i.type === 'safety_override' || (i.type === 'alert' && i.isCritical)
  );
  const weatherInsights = insights.filter((i) => i.type === 'weather_trigger');
  const recommendationInsights = insights.filter((i) => i.type === 'recommendation');
  const personaInsights = insights.filter((i) => i.type === 'persona_match');
  const preferenceInsights = insights.filter((i) => i.type === 'preference_match');
  const nonCriticalAlertInsights = insights.filter(
    (i) => i.type === 'alert' && !i.isCritical
  );
  const notificationInsights = insights.filter((i) => i.type === 'notification');

  return (
    <ScreenContainer
      title="Personalization Insights"
      subtitle="See why MAUSAM is showing you this information."
      onBack={() => navigation.goBack()}
    >
      <ScrollView showsVerticalScrollIndicator={false} className="flex-1">

        {/* ── Section 1: Personalization Summary ────────────────────────── */}
        <View className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-4 mb-4 shadow-md">
          <View className="flex-row items-center mb-3">
            <Text className="text-base mr-2">🧠</Text>
            <Text className="text-sm font-extrabold text-white tracking-tight">
              Personalization Summary
            </Text>
            <View
              className={`ml-auto px-2 py-0.5 rounded border ${
                dataMode === 'live'
                  ? 'bg-emerald-500/20 border-emerald-500/40'
                  : 'bg-amber-500/20 border-amber-500/40'
              }`}
            >
              <Text
                className={`text-[9px] font-bold uppercase ${
                  dataMode === 'live' ? 'text-emerald-300' : 'text-amber-300'
                }`}
              >
                {dataMode === 'live' ? 'Live IMD' : 'Demo Mode'}
              </Text>
            </View>
          </View>

          <Text className="text-[11px] text-slate-400 mb-3 leading-4">
            Your homepage is personalized using:
          </Text>

          {/* Personas */}
          <View className="mb-2">
            <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Active Personas
            </Text>
            {summary.activePersonaLabels.length > 0 ? (
              <View className="flex-row flex-wrap gap-1.5">
                {summary.activePersonaLabels.map((label) => (
                  <View
                    key={label}
                    className="bg-violet-500/20 px-2.5 py-1 rounded-lg border border-violet-500/40"
                  >
                    <Text className="text-[11px] font-semibold text-violet-200">
                      👤 {label}
                    </Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text className="text-[11px] text-slate-500 italic">No personas selected</Text>
            )}
          </View>

          {/* Preferences */}
          <View className="mb-3">
            <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Active Preferences
            </Text>
            {summary.activePreferenceLabels.length > 0 ? (
              <View className="flex-row flex-wrap gap-1.5">
                {summary.activePreferenceLabels.map((label) => (
                  <View
                    key={label}
                    className="bg-teal-500/15 px-2.5 py-1 rounded-lg border border-teal-500/30"
                  >
                    <Text className="text-[11px] font-semibold text-teal-200">⚙️ {label}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text className="text-[11px] text-slate-500 italic">No preferences selected</Text>
            )}
          </View>

          {/* Current context */}
          <View className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-3 mb-3">
            <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Current Weather Context
            </Text>
            <View className="flex-row flex-wrap gap-x-4 gap-y-1">
              <Text className="text-xs text-slate-200">
                📍 {summary.location}
              </Text>
              <Text className="text-xs text-slate-200">
                🌡️ {summary.temperature}°C
              </Text>
              <Text className="text-xs text-slate-200">
                🌤️ {summary.weatherConditionLabel}
              </Text>
              <Text className="text-xs text-slate-200">
                🔔 {summary.severityLabel}
              </Text>
            </View>
          </View>

          {/* Stats row */}
          <View className="flex-row gap-2">
            {[
              { label: 'Recommendations', value: summary.totalRecommendations, color: 'sky' },
              { label: 'Alerts', value: summary.totalAlerts, color: 'amber' },
              {
                label: 'Notifications',
                value: `${summary.deliveredNotifications}/${summary.totalAlerts}`,
                color: 'teal',
              },
            ].map(({ label, value, color }) => (
              <View
                key={label}
                className={`flex-1 bg-slate-900/60 border border-slate-700/50 rounded-xl p-2.5 items-center`}
              >
                <Text className={`text-base font-extrabold text-${color}-300`}>{value}</Text>
                <Text className="text-[9px] text-slate-400 text-center leading-3 mt-0.5">
                  {label}
                </Text>
              </View>
            ))}
          </View>

          {summary.safetyOverrideActive && (
            <View className="bg-red-500/15 border border-red-500/40 rounded-xl p-2.5 mt-3 flex-row items-center">
              <Text className="text-xs mr-1.5">🚨</Text>
              <Text className="text-[11px] font-bold text-red-200">
                Safety Override Active — Critical content is shown first
              </Text>
            </View>
          )}
        </View>

        {/* ── Section 2: Safety & Critical Alerts ──────────────────────── */}
        {safetyInsights.length > 0 && (
          <View className="mb-2">
            <SectionHeader
              icon="🛡️"
              title="Safety & Critical Overrides"
              count={safetyInsights.length}
            />
            {safetyInsights.map((i) => (
              <InsightCard key={i.id} insight={i} />
            ))}
          </View>
        )}

        {/* ── Section 3: Active Weather Triggers ───────────────────────── */}
        {weatherInsights.length > 0 && (
          <View className="mb-2">
            <SectionHeader
              icon="⛅"
              title="Active Weather Triggers"
              count={weatherInsights.length}
            />
            <Text className="text-[11px] text-slate-400 mb-3 leading-4">
              These meteorological conditions crossed configured thresholds and triggered
              personalized recommendations.
            </Text>
            {weatherInsights.map((i) => (
              <InsightCard key={i.id} insight={i} />
            ))}
          </View>
        )}

        {/* ── Section 4: Your Active Personas ──────────────────────────── */}
        {personaInsights.length > 0 && (
          <View className="mb-2">
            <SectionHeader
              icon="👤"
              title="Active Personas"
              count={personaInsights.length}
            />
            <Text className="text-[11px] text-slate-400 mb-3 leading-4">
              Each persona you selected shapes which weather conditions are considered relevant
              for your homepage.
            </Text>
            {personaInsights.map((i) => (
              <InsightCard key={i.id} insight={i} />
            ))}
          </View>
        )}

        {/* ── Section 5: Recommendations on Your Homepage ───────────────── */}
        {recommendationInsights.length > 0 && (
          <View className="mb-2">
            <SectionHeader
              icon="💡"
              title="Recommendations on Your Homepage"
              count={recommendationInsights.length}
            />
            <Text className="text-[11px] text-slate-400 mb-3 leading-4">
              Each card below explains why a specific recommendation appears on your personalized
              homepage.
            </Text>
            {recommendationInsights.map((i) => (
              <InsightCard key={i.id} insight={i} />
            ))}
          </View>
        )}

        {/* ── Section 6: Your Active Preferences ───────────────────────── */}
        {preferenceInsights.length > 0 && (
          <View className="mb-2">
            <SectionHeader
              icon="⚙️"
              title="Active Preferences"
              count={preferenceInsights.length}
            />
            {preferenceInsights.map((i) => (
              <InsightCard key={i.id} insight={i} />
            ))}
          </View>
        )}

        {/* ── Section 7: Non-Critical Alerts ───────────────────────────── */}
        {nonCriticalAlertInsights.length > 0 && (
          <View className="mb-2">
            <SectionHeader
              icon="⚠️"
              title="Personalized Alerts"
              count={nonCriticalAlertInsights.length}
            />
            {nonCriticalAlertInsights.map((i) => (
              <InsightCard key={i.id} insight={i} />
            ))}
          </View>
        )}

        {/* ── Section 8: Notification Decisions ────────────────────────── */}
        {notificationInsights.length > 0 && (
          <View className="mb-2">
            <SectionHeader
              icon="🔔"
              title="Notification Delivery Decisions"
              count={notificationInsights.length}
            />
            <Text className="text-[11px] text-slate-400 mb-3 leading-4">
              Alerts are always visible here. The delivery decision below shows whether each alert
              would trigger an in-app notification based on your Phase 13 preferences.
            </Text>
            {notificationInsights.map((i) => (
              <InsightCard key={i.id} insight={i} />
            ))}
          </View>
        )}

        {/* ── Empty state ───────────────────────────────────────────────── */}
        {insights.length === 0 && (
          <View className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-8 items-center my-4">
            <Text className="text-4xl mb-3">🌤️</Text>
            <Text className="text-base font-extrabold text-white mb-1.5 text-center">
              Personalization is Active
            </Text>
            <Text className="text-xs text-slate-400 text-center leading-5 max-w-xs">
              Current weather conditions are within comfortable ranges. No specific weather triggers
              are active. Your homepage is showing general personalization based on your personas
              and preferences.
            </Text>
          </View>
        )}

        {/* ── Footer ───────────────────────────────────────────────────── */}
        <View className="bg-slate-800/40 border border-slate-700/40 rounded-2xl p-4 mb-6">
          <View className="flex-row items-center mb-2">
            <Text className="text-xs mr-1.5">🔍</Text>
            <Text className="text-xs font-bold text-slate-300">
              About Explainable Personalization
            </Text>
          </View>
          <Text className="text-[11px] text-slate-400 leading-4">
            Personalized MAUSAM uses deterministic, rule-based logic — not AI or machine learning.
            Every recommendation, alert, and notification decision shown here can be traced to a
            specific weather threshold, persona configuration, or preference setting.
          </Text>
          <Text className="text-[10px] text-slate-500 mt-2">
            Generated at {report.generatedAt} • SIH26076 · {dataMode === 'live' ? 'Live IMD Data' : 'Demo Scenario'}
          </Text>
        </View>

      </ScrollView>
    </ScreenContainer>
  );
};
