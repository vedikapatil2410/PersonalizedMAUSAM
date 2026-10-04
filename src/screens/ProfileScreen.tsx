import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Switch, StyleSheet } from 'react-native';
import { ScreenContainer } from '../components/ui/ScreenContainer';
import { useApp } from '../context/AppContext';
import { useWeather } from '../context/WeatherContext';
import { generatePersonalizedAlerts } from '../services/alertEngine';
import { getNotificationDeliveryDecisions } from '../services/notificationEngine';
import { NotificationPreviewCard } from '../components/notifications/NotificationPreviewCard';
import { ACTIVITY_CATALOG } from '../constants/activities';
import type { AlertCategory } from '../types/alerts';
import type { RootStackScreenProps } from '../navigation/types';

const CATEGORY_LABELS: { id: AlertCategory; label: string; icon: string }[] = [
  { id: 'health', label: 'Health', icon: '🏥' },
  { id: 'fitness', label: 'Fitness', icon: '🏃' },
  { id: 'travel', label: 'Travel', icon: '✈️' },
  { id: 'agriculture', label: 'Agriculture', icon: '🌾' },
  { id: 'commuting', label: 'Commuting', icon: '🚆' },
  { id: 'family', label: 'Family', icon: '👨‍👩‍👧‍👦' },
  { id: 'outdoor', label: 'Beach & Outdoor', icon: '🏖️' },
  { id: 'events', label: 'Events', icon: '🎪' },
  { id: 'general', label: 'General', icon: '🌐' },
];

export const ProfileScreen: React.FC<RootStackScreenProps<'Profile'>> = ({ navigation }) => {
  const {
    selectedLocation,
    savedLocations,
    selectedPersonas,
    selectedActivities,
    toggleActivity,
    notificationPreferences,
    updateNotificationPreferences,
    resetNotificationPreferences,
  } = useApp();

  const { currentWeatherData, dataMode } = useWeather();

  const activeAlerts = useMemo(() => {
    return generatePersonalizedAlerts({
      weatherData: currentWeatherData,
      userState: {
        selectedPersonas,
        selectedPreferences: [],
        selectedLocation,
        onboardingCompleted: true,
      },
      dataMode,
    });
  }, [currentWeatherData, selectedPersonas, selectedLocation, dataMode]);

  const deliveryDecisions = useMemo(() => {
    return getNotificationDeliveryDecisions(activeAlerts, notificationPreferences);
  }, [activeAlerts, notificationPreferences]);

  const toggleCategory = (cat: AlertCategory) => {
    updateNotificationPreferences({
      categories: {
        ...notificationPreferences.categories,
        [cat]: !notificationPreferences.categories[cat],
      },
    });
  };

  return (
    <ScreenContainer
      title="Profile & Settings"
      subtitle="In-app notification preferences & persona controls"
      onBack={() => navigation.goBack()}
    >
      <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
        {/* Prototype Disclaimer Banner */}
        <View className="bg-sky-500/10 border border-sky-500/30 rounded-2xl p-3.5 mb-4">
          <View className="flex-row items-center mb-1">
            <Text className="text-xs mr-1.5">🔔</Text>
            <Text className="text-xs font-bold text-sky-300">
              In-App Notification Delivery Layer
            </Text>
          </View>
          <Text className="text-[11px] text-slate-300 leading-4">
            Control which weather alerts are surfaced as in-app notifications. Critical safety warnings can never be disabled.
          </Text>
        </View>

        {/* Phase 21: SIH Showcase Mode Navigation */}
        <TouchableOpacity
          onPress={() => navigation.navigate('ShowcaseMode')}
          activeOpacity={0.7}
          accessibilityLabel="Open SIH Showcase Mode Live Judge Demonstration"
          accessibilityRole="button"
          className="bg-amber-500/15 border border-amber-500/40 rounded-2xl p-4 mb-4 shadow-sm flex-row items-center justify-between"
        >
          <View className="flex-1 mr-3">
            <View className="flex-row items-center mb-0.5">
              <Text className="text-sm mr-2">🎯</Text>
              <Text className="text-sm font-extrabold text-amber-300">
                SIH Showcase / Demo Mode
              </Text>
              <View className="bg-amber-500/20 px-2 py-0.5 rounded border border-amber-400/40 ml-2">
                <Text className="text-[9px] font-black text-amber-300">JUDGE DEMO</Text>
              </View>
            </View>
            <Text className="text-[11px] text-slate-300 leading-4">
              Demonstrate rule-based personalization, persona priorities, severe weather safety override & multi-location support.
            </Text>
          </View>
          <View className="bg-amber-500/25 px-2.5 py-1.5 rounded-lg border border-amber-400/40">
            <Text className="text-xs font-bold text-amber-300">Run Demo →</Text>
          </View>
        </TouchableOpacity>

        {/* Phase 14: Personalization Insights Navigation */}
        <TouchableOpacity
          onPress={() => navigation.navigate('PersonalizationInsights')}
          activeOpacity={0.7}
          className="bg-slate-800/90 border border-sky-500/30 rounded-2xl p-4 mb-4 shadow-sm flex-row items-center justify-between"
        >
          <View className="flex-1 mr-3">
            <View className="flex-row items-center mb-0.5">
              <Text className="text-sm mr-2">🧠</Text>
              <Text className="text-sm font-bold text-white">
                Personalization Insights
              </Text>
            </View>
            <Text className="text-[11px] text-slate-400 leading-4">
              Understand why weather information is personalized for you.
            </Text>
          </View>
          <View className="bg-sky-500/20 px-2.5 py-1.5 rounded-lg border border-sky-400/30">
            <Text className="text-xs font-bold text-sky-300">View →</Text>
          </View>
        </TouchableOpacity>

        {/* Phase 15: Saved Locations Management */}
        <TouchableOpacity
          onPress={() => navigation.navigate('Locations')}
          activeOpacity={0.7}
          className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-4 mb-4 shadow-sm flex-row items-center justify-between"
        >
          <View className="flex-1 mr-3">
            <View className="flex-row items-center mb-0.5">
              <Text className="text-sm mr-2">📍</Text>
              <Text className="text-sm font-bold text-white">
                Saved Locations
              </Text>
              <View className="bg-sky-500/20 px-2 py-0.5 rounded border border-sky-400/30 ml-2">
                <Text className="text-[10px] font-bold text-sky-300">
                  {savedLocations.length}/5 Saved
                </Text>
              </View>
            </View>
            <Text className="text-[11px] text-slate-400 leading-4">
              Active: {selectedLocation} • Switch, add, or rename weather districts.
            </Text>
          </View>
          <View className="bg-sky-500/20 px-2.5 py-1.5 rounded-lg border border-sky-400/30">
            <Text className="text-xs font-bold text-sky-300">Manage →</Text>
          </View>
        </TouchableOpacity>
        {/* Phase 22: Data & Transparency Navigation */}
        <TouchableOpacity
  onPress={() => navigation.navigate('DataTransparency')}
  activeOpacity={0.7}
  accessibilityLabel="Open Data & Transparency Center"
  accessibilityRole="button"
  className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-4 mb-4 shadow-sm flex-row items-center justify-between"
>
  <View className="flex-1 mr-3">
    <View className="flex-row items-center mb-0.5">
      <Text className="text-sm mr-2">📊</Text>
      <Text className="text-sm font-bold text-white">Data & Transparency</Text>
    </View>
    <Text className="text-[11px] text-slate-400 leading-4">
      See where weather data comes from, live vs demo mode, and why recommendations appear.
    </Text>
  </View>
  <View className="bg-sky-500/20 px-2.5 py-1.5 rounded-lg border border-sky-400/30">
    <Text className="text-xs font-bold text-sky-300">View →</Text>
  </View>
</TouchableOpacity>

        {/* Phase 23: Judge Evaluation Mode Navigation */}
        <TouchableOpacity
          onPress={() => navigation.navigate('JudgeEvaluation')}
          activeOpacity={0.7}
          accessibilityLabel="Open Judge Evaluation Mode"
          accessibilityRole="button"
          className="bg-amber-500/15 border border-amber-500/40 rounded-2xl p-4 mb-4 shadow-sm flex-row items-center justify-between"
        >
          <View className="flex-1 mr-3">
            <View className="flex-row items-center mb-0.5">
              <Text className="text-sm mr-2">⚖️</Text>
              <Text className="text-sm font-extrabold text-amber-300">Judge Evaluation Mode</Text>
            </View>
            <Text className="text-[11px] text-slate-300 leading-4">
              Structured evaluation of personalization across personas, weather, and locations.
            </Text>
          </View>
          <View className="bg-amber-500/25 px-2.5 py-1.5 rounded-lg border border-amber-400/40">
            <Text className="text-xs font-bold text-amber-300">Run Demo →</Text>
          </View>
        </TouchableOpacity>

        {/* Phase 25: Demo Readiness & Reliability Navigation */}
        <TouchableOpacity
          onPress={() => navigation.navigate('DemoReadiness')}
          activeOpacity={0.7}
          accessibilityLabel="Open Demo Readiness and Reliability Preflight Checklist"
          accessibilityRole="button"
          className="bg-emerald-500/15 border border-emerald-500/40 rounded-2xl p-4 mb-4 shadow-sm flex-row items-center justify-between"
        >
          <View className="flex-1 mr-3">
            <View className="flex-row items-center mb-0.5">
              <Text className="text-sm mr-2">🛡️</Text>
              <Text className="text-sm font-extrabold text-emerald-300">Demo Readiness Checklist</Text>
            </View>
            <Text className="text-[11px] text-slate-300 leading-4">
              Preflight verification, live vs demo safeguard, and controlled demo launcher.
            </Text>
          </View>
          <View className="bg-emerald-500/25 px-2.5 py-1.5 rounded-lg border border-emerald-400/40">
            <Text className="text-xs font-bold text-emerald-300">Check →</Text>
          </View>
        </TouchableOpacity>

        {/* Phase 26: Activity Interests Management */}
        <View className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-4 mb-4 shadow-sm">
          <View className="flex-row items-center justify-between mb-1.5">
            <View className="flex-row items-center">
              <Text className="text-sm mr-2">🎯</Text>
              <Text className="text-sm font-bold text-white">Activities</Text>
              <View className="bg-sky-500/20 px-2 py-0.5 rounded border border-sky-400/30 ml-2">
                <Text className="text-[10px] font-bold text-sky-300">
                  {selectedActivities.length} Selected
                </Text>
              </View>
            </View>
          </View>
          <Text className="text-[11px] text-slate-400 leading-4 mb-3">
            Review or update activity preferences to personalize weather window ratings and impact advisories.
          </Text>

          <View className="flex-row flex-wrap justify-between">
            {ACTIVITY_CATALOG.map((act) => {
              const isSelected = selectedActivities.includes(act.id);
              return (
                <TouchableOpacity
                  key={act.id}
                  onPress={() => toggleActivity(act.id)}
                  activeOpacity={0.7}
                  accessibilityLabel={`Toggle ${act.title} activity`}
                  accessibilityState={{ selected: isSelected }}
                  accessibilityRole="checkbox"
                  style={[
                    styles.activityChipBase,
                    isSelected ? styles.activityChipSelected : styles.activityChipUnselected,
                  ]}
                >
                  <View className="flex-row items-center flex-1 mr-1">
                    <Text className="text-sm mr-1.5">{act.icon}</Text>
                    <Text
                      numberOfLines={1}
                      style={[
                        styles.activityChipText,
                        isSelected ? styles.activityChipTextSelected : styles.activityChipTextUnselected,
                      ]}
                    >
                      {act.title}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.activityDot,
                      isSelected ? styles.activityDotSelected : styles.activityDotUnselected,
                    ]}
                  />
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Master Notification Toggle */}
        <View className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-4 mb-4 shadow-sm">
          <View className="flex-row items-center justify-between">
            <View className="flex-1 mr-3">
              <Text className="text-sm font-bold text-white mb-0.5">
                In-App Weather Notifications
              </Text>
              <Text className="text-[11px] text-slate-400 leading-4">
                Master switch for non-critical weather alerts.
              </Text>
            </View>
            <Switch
              value={notificationPreferences.enabled}
              onValueChange={(val) => updateNotificationPreferences({ enabled: val })}
              trackColor={{ false: '#334155', true: '#0284c7' }}
              thumbColor={notificationPreferences.enabled ? '#38bdf8' : '#94a3b8'}
            />
          </View>
        </View>

        {/* Severity Preferences Section */}
        <View className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-4 mb-4 shadow-sm">
          <Text className="text-xs font-bold text-sky-400 uppercase tracking-wider mb-3">
            Severity Controls
          </Text>

          {/* Critical Safety Alerts (MANDATORY / ALWAYS ON) */}
          <View className="flex-row items-center justify-between py-2.5 border-b border-slate-700/50">
            <View className="flex-1 mr-3">
              <View className="flex-row items-center">
                <Text className="text-xs font-bold text-red-300 mr-2">
                  🚨 Critical Safety Alerts
                </Text>
                <View className="bg-red-500/20 px-2 py-0.5 rounded border border-red-500/40">
                  <Text className="text-[9px] font-black text-red-300">LOCKED</Text>
                </View>
              </View>
              <Text className="text-[10px] text-slate-400 mt-0.5">
                Official IMD storm & hazard warnings. Always active.
              </Text>
            </View>
            <Switch
              value={true}
              disabled={true}
              trackColor={{ false: '#334155', true: '#dc2626' }}
              thumbColor="#f87171"
            />
          </View>

          {/* High Severity */}
          <View className="flex-row items-center justify-between py-2.5 border-b border-slate-700/50">
            <View className="flex-1 mr-3">
              <Text className="text-xs font-bold text-amber-300">
                🔥 High Priority Alerts
              </Text>
              <Text className="text-[10px] text-slate-400 mt-0.5">
                Heatwave, severe crosswind, heavy precipitation.
              </Text>
            </View>
            <Switch
              value={notificationPreferences.highSeverityEnabled}
              onValueChange={(val) =>
                updateNotificationPreferences({ highSeverityEnabled: val })
              }
              trackColor={{ false: '#334155', true: '#d97706' }}
              thumbColor={notificationPreferences.highSeverityEnabled ? '#fbbf24' : '#94a3b8'}
            />
          </View>

          {/* Medium Severity */}
          <View className="flex-row items-center justify-between py-2.5 border-b border-slate-700/50">
            <View className="flex-1 mr-3">
              <Text className="text-xs font-bold text-sky-300">
                ⚡ Medium Priority Advisories
              </Text>
              <Text className="text-[10px] text-slate-400 mt-0.5">
                High humidity, moderate wind, UV advisories.
              </Text>
            </View>
            <Switch
              value={notificationPreferences.mediumSeverityEnabled}
              onValueChange={(val) =>
                updateNotificationPreferences({ mediumSeverityEnabled: val })
              }
              trackColor={{ false: '#334155', true: '#0284c7' }}
              thumbColor={notificationPreferences.mediumSeverityEnabled ? '#38bdf8' : '#94a3b8'}
            />
          </View>

          {/* Low Severity */}
          <View className="flex-row items-center justify-between py-2.5">
            <View className="flex-1 mr-3">
              <Text className="text-xs font-bold text-slate-300">
                💡 Low Priority Informational
              </Text>
              <Text className="text-[10px] text-slate-400 mt-0.5">
                Sunrise/sunset schedules and general comfort notes.
              </Text>
            </View>
            <Switch
              value={notificationPreferences.lowSeverityEnabled}
              onValueChange={(val) =>
                updateNotificationPreferences({ lowSeverityEnabled: val })
              }
              trackColor={{ false: '#334155', true: '#475569' }}
              thumbColor={notificationPreferences.lowSeverityEnabled ? '#94a3b8' : '#64748b'}
            />
          </View>
        </View>

        {/* Category Controls Section */}
        <View className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-4 mb-4 shadow-sm">
          <Text className="text-xs font-bold text-sky-400 uppercase tracking-wider mb-2.5">
            Alert Categories
          </Text>

          <View className="flex-row flex-wrap justify-between">
            {CATEGORY_LABELS.map((cat) => {
              const isEnabled = notificationPreferences.categories[cat.id] ?? true;

              return (
                <TouchableOpacity
                  key={cat.id}
                  onPress={() => toggleCategory(cat.id)}
                  activeOpacity={0.7}
                  className={`w-[48%] mb-2.5 p-2.5 rounded-xl border flex-row items-center justify-between ${
                    isEnabled
                      ? 'bg-sky-500/15 border-sky-500/40'
                      : 'bg-slate-900/60 border-slate-700/50 opacity-60'
                  }`}
                >
                  <View className="flex-row items-center flex-1 mr-1">
                    <Text className="text-sm mr-1.5">{cat.icon}</Text>
                    <Text
                      numberOfLines={1}
                      className={`text-xs font-semibold ${
                        isEnabled ? 'text-sky-200' : 'text-slate-400'
                      }`}
                    >
                      {cat.label}
                    </Text>
                  </View>
                  <View
                    className={`w-2 h-2 rounded-full ${
                      isEnabled ? 'bg-sky-400' : 'bg-slate-600'
                    }`}
                  />
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Quiet Hours Section */}
        <View className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-4 mb-4 shadow-sm">
          <View className="flex-row items-center justify-between mb-2">
            <View className="flex-1 mr-3">
              <Text className="text-xs font-bold text-sky-400 uppercase tracking-wider">
                Quiet Hours
              </Text>
              <Text className="text-[11px] text-slate-300 mt-0.5">
                Pause non-critical notifications during overnight rest hours.
              </Text>
            </View>
            <Switch
              value={notificationPreferences.quietHoursEnabled}
              onValueChange={(val) =>
                updateNotificationPreferences({ quietHoursEnabled: val })
              }
              trackColor={{ false: '#334155', true: '#7c3aed' }}
              thumbColor={notificationPreferences.quietHoursEnabled ? '#c084fc' : '#94a3b8'}
            />
          </View>

          {notificationPreferences.quietHoursEnabled && (
            <View className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-3 mt-2">
              <View className="flex-row items-center justify-between">
                <Text className="text-xs text-slate-300 font-medium">Active Window:</Text>
                <View className="bg-purple-500/20 px-2.5 py-1 rounded border border-purple-400/30">
                  <Text className="text-xs font-bold text-purple-300">
                    🌙 {notificationPreferences.quietHoursStart} → {notificationPreferences.quietHoursEnd} (Overnight)
                  </Text>
                </View>
              </View>
              <Text className="text-[10px] text-slate-400 mt-2 italic leading-3">
                Critical safety warnings will always bypass quiet hours.
              </Text>
            </View>
          )}
        </View>

        {/* Live Notification Delivery Simulator / Preview Section */}
        <View className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-4 mb-4 shadow-sm">
          <View className="flex-row items-center justify-between mb-3">
            <View>
              <Text className="text-xs font-bold text-sky-400 uppercase tracking-wider">
                Active Notification Preview
              </Text>
              <Text className="text-[10px] text-slate-400 mt-0.5">
                Live delivery simulation for current weather conditions
              </Text>
            </View>
            <View className="bg-sky-500/20 px-2 py-0.5 rounded border border-sky-400/30">
              <Text className="text-[10px] font-bold text-sky-300">
                {deliveryDecisions.filter((d) => d.delivered).length} / {deliveryDecisions.length} Delivered
              </Text>
            </View>
          </View>

          {deliveryDecisions.length > 0 ? (
            deliveryDecisions.map((decision) => (
              <NotificationPreviewCard key={decision.alert.id} decision={decision} />
            ))
          ) : (
            <View className="bg-slate-900/50 rounded-xl p-4 items-center">
              <Text className="text-xs text-slate-400 text-center">
                No active weather alerts under current conditions.
              </Text>
            </View>
          )}
        </View>

        {/* Reset Actions */}
        <View className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-4 mb-6">
          <Text className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
            Reset Preferences
          </Text>
          <TouchableOpacity
            onPress={resetNotificationPreferences}
            activeOpacity={0.7}
            className="bg-slate-700/70 py-2.5 rounded-xl items-center mb-2"
          >
            <Text className="text-xs font-semibold text-slate-200">
              Restore Default Notification Settings
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  activityChipBase: {
    width: '48%',
    marginBottom: 10,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  activityChipSelected: {
    backgroundColor: 'rgba(8, 47, 73, 0.75)',
    borderColor: '#38bdf8',
  },
  activityChipUnselected: {
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    borderColor: 'rgba(51, 65, 85, 0.6)',
    opacity: 0.7,
  },
  activityChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  activityChipTextSelected: {
    color: '#38bdf8',
  },
  activityChipTextUnselected: {
    color: '#94a3b8',
  },
  activityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  activityDotSelected: {
    backgroundColor: '#38bdf8',
  },
  activityDotUnselected: {
    backgroundColor: '#475569',
  },
});

