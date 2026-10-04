import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { ScreenContainer } from '../components/ui/ScreenContainer';
import { useApp } from '../context/AppContext';
import { useWeather } from '../context/WeatherContext';
import { generatePersonalizedAlerts } from '../services/alertEngine';
import { evaluateNotificationDelivery } from '../services/notificationEngine';
import type { WeatherAlert, AlertSeverityLevel } from '../types/alerts';
import type { RootStackScreenProps } from '../navigation/types';

const getSeverityStyle = (severity: AlertSeverityLevel) => {
  switch (severity) {
    case 'critical':
      return {
        cardBorder: 'border-red-500 bg-red-950/40',
        badgeBg: 'bg-red-500/25 border-red-500/50',
        badgeText: 'text-red-200',
        pillBg: 'bg-red-500',
        pillText: 'text-white font-black',
        icon: '🚨',
      };
    case 'high':
      return {
        cardBorder: 'border-amber-500/60 bg-amber-950/20',
        badgeBg: 'bg-amber-500/20 border-amber-500/40',
        badgeText: 'text-amber-300',
        pillBg: 'bg-amber-500/30',
        pillText: 'text-amber-200',
        icon: '⚠️',
      };
    case 'medium':
      return {
        cardBorder: 'border-sky-500/50 bg-slate-800/90',
        badgeBg: 'bg-sky-500/20 border-sky-500/40',
        badgeText: 'text-sky-300',
        pillBg: 'bg-sky-500/30',
        pillText: 'text-sky-200',
        icon: 'ℹ️',
      };
    case 'low':
      return {
        cardBorder: 'border-slate-700/60 bg-slate-800/70',
        badgeBg: 'bg-slate-700/50 border-slate-600/40',
        badgeText: 'text-slate-300',
        pillBg: 'bg-slate-700',
        pillText: 'text-slate-300',
        icon: '💡',
      };
  }
};

export const AlertsScreen: React.FC<RootStackScreenProps<'Alerts'>> = ({ navigation }) => {
  const userState = useApp();
  const { currentWeatherData, dataMode } = useWeather();
  const [readAlertIds, setReadAlertIds] = useState<Set<string>>(new Set());
  const [filterMode, setFilterMode] = useState<'all' | 'unread'>('all');

  const alerts = useMemo(() => {
    return generatePersonalizedAlerts({
      weatherData: currentWeatherData,
      userState,
      dataMode,
      readAlertIds,
    });
  }, [currentWeatherData, userState, dataMode, readAlertIds]);

  const unreadCount = alerts.filter((a) => !a.isRead).length;
  const filteredAlerts = filterMode === 'unread' ? alerts.filter((a) => !a.isRead) : alerts;

  const toggleReadState = (id: string) => {
    setReadAlertIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const markAllAsRead = () => {
    setReadAlertIds(new Set(alerts.map((a) => a.id)));
  };

  return (
    <ScreenContainer
      title="Weather Alerts"
      subtitle={`Public safety alerts & warnings • ${userState.selectedLocation || currentWeatherData.location}`}
      onBack={() => navigation.goBack()}
    >
      {/* Alert Center Control Header */}
      <View className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-4 mb-4 shadow-sm">
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-row items-center">
            <Text className="text-sm font-bold text-white mr-2">Alert Center</Text>
            <View className="bg-sky-500/20 px-2 py-0.5 rounded border border-sky-400/30">
              <Text className="text-[10px] font-bold text-sky-300">
                {alerts.length} Total • {unreadCount} Unread
              </Text>
            </View>
          </View>

          {unreadCount > 0 && (
            <TouchableOpacity
              onPress={markAllAsRead}
              activeOpacity={0.7}
              className="bg-slate-700/60 px-2.5 py-1 rounded-lg border border-slate-600/50"
            >
              <Text className="text-[10px] font-semibold text-slate-300">Mark all read</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Filter Toggle: All vs Unread */}
        <View className="bg-slate-900/60 p-1 rounded-xl flex-row">
          <TouchableOpacity
            onPress={() => setFilterMode('all')}
            activeOpacity={0.7}
            className={`flex-1 py-1.5 rounded-lg items-center ${
              filterMode === 'all' ? 'bg-sky-600 shadow-sm' : 'bg-transparent'
            }`}
          >
            <Text
              className={`text-xs font-bold ${
                filterMode === 'all' ? 'text-white' : 'text-slate-400'
              }`}
            >
              All Alerts ({alerts.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setFilterMode('unread')}
            activeOpacity={0.7}
            className={`flex-1 py-1.5 rounded-lg items-center ${
              filterMode === 'unread' ? 'bg-sky-600 shadow-sm' : 'bg-transparent'
            }`}
          >
            <Text
              className={`text-xs font-bold ${
                filterMode === 'unread' ? 'text-white' : 'text-slate-400'
              }`}
            >
              Unread Only ({unreadCount})
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Alerts Feed */}
      <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
        {filteredAlerts.length > 0 ? (
          filteredAlerts.map((alert) => {
            const styles = getSeverityStyle(alert.severity);
            const isCritical = alert.severity === 'critical';
            const delivery = evaluateNotificationDelivery(alert, userState.notificationPreferences);
            const isSuppressed = !delivery.delivered;

            return (
              <View
                key={alert.id}
                className={`rounded-2xl p-4 mb-3.5 border ${styles.cardBorder} shadow-md overflow-hidden ${
                  alert.isRead ? 'opacity-70' : 'opacity-100'
                }`}
              >
                {/* Critical Banner */}
                {isCritical && (
                  <View className="bg-red-600/30 border-b border-red-500/40 -mx-4 -mt-4 px-4 py-2 mb-3 flex-row items-center justify-between">
                    <View className="flex-row items-center flex-1 mr-2">
                      <Text className="text-xs mr-1.5">🚨</Text>
                      <Text className="text-[11px] font-extrabold text-red-200 uppercase tracking-wider">
                        CRITICAL SAFETY OVERRIDE • OFFICIAL IMD
                      </Text>
                    </View>
                    <View className="bg-red-500 px-2 py-0.5 rounded">
                      <Text className="text-[9px] font-black text-white uppercase tracking-widest">
                        EMERGENCY
                      </Text>
                    </View>
                  </View>
                )}

                {/* Header Row: Source, Category, Severity & Read toggle */}
                <View className="flex-row items-center justify-between mb-2">
                  <View className="flex-row items-center flex-wrap gap-1.5 flex-1 pr-2">
                    {/* Source Pill */}
                    <View
                      className={`px-2 py-0.5 rounded border ${
                        alert.source === 'Official IMD'
                          ? 'bg-emerald-500/20 border-emerald-500/40'
                          : 'bg-sky-500/20 border-sky-400/30'
                      }`}
                    >
                      <Text
                        className={`text-[9px] font-bold uppercase tracking-wider ${
                          alert.source === 'Official IMD' ? 'text-emerald-300' : 'text-sky-300'
                        }`}
                      >
                        {alert.source}
                      </Text>
                    </View>

                    {/* Persona Badge if personalized */}
                    {alert.persona && (
                      <View className="bg-slate-700/60 px-2 py-0.5 rounded border border-slate-600/40">
                        <Text className="text-[9px] font-medium text-slate-200">
                          {alert.persona}
                        </Text>
                      </View>
                    )}

                    {/* Category */}
                    <View className="bg-slate-900/60 px-2 py-0.5 rounded border border-slate-700/50">
                      <Text className="text-[9px] font-medium text-slate-400 capitalize">
                        {alert.category}
                      </Text>
                    </View>

                    {/* Phase 13: Notification delivery status chip */}
                    {isSuppressed && (
                      <View className="bg-slate-700/50 px-2 py-0.5 rounded border border-slate-600/40 flex-row items-center">
                        <Text className="text-[9px] mr-0.5">🔕</Text>
                        <Text className="text-[9px] font-medium text-slate-400">
                          Suppressed
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Severity Badge */}
                  <View className={`px-2.5 py-0.5 rounded-full border ${styles.badgeBg}`}>
                    <Text
                      className={`text-[10px] font-bold uppercase tracking-wider ${styles.badgeText}`}
                    >
                      {alert.severity}
                    </Text>
                  </View>
                </View>

                {/* Title & Message */}
                <Text className="text-base font-bold text-white mb-1 tracking-tight">
                  {alert.title}
                </Text>
                <Text className="text-xs text-slate-300 leading-5 mb-3">
                  {alert.message}
                </Text>

                {/* "Why this?" Rule-Based Explainability */}
                <View className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-2.5 mb-3">
                  <View className="flex-row items-center mb-0.5">
                    <Text className="text-[10px] mr-1">{isCritical ? '🛡️' : '💡'}</Text>
                    <Text className="text-[10px] font-bold text-sky-400 uppercase tracking-wider">
                      Why this? (Rule-Based Explainability)
                    </Text>
                  </View>
                  <Text className="text-xs text-slate-300 leading-4 font-normal">
                    {alert.explanation}
                  </Text>
                </View>

                {/* Footer: Timestamp & Read Status Action */}
                <View className="flex-row items-center justify-between pt-1 border-t border-slate-700/40">
                  <Text className="text-[10px] text-slate-400">
                    🕒 {alert.timestamp}
                  </Text>

                  <TouchableOpacity
                    onPress={() => toggleReadState(alert.id)}
                    activeOpacity={0.7}
                    className="flex-row items-center"
                  >
                    <View
                      className={`w-2 h-2 rounded-full mr-1.5 ${
                        alert.isRead ? 'bg-slate-500' : 'bg-sky-400'
                      }`}
                    />
                    <Text className="text-[10px] font-semibold text-slate-300">
                      {alert.isRead ? 'Mark unread' : 'Mark as read'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        ) : (
          /* Clean Empty State (TASK 8) */
          <View className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-8 items-center justify-center my-6">
            <Text className="text-4xl mb-3">🛡️</Text>
            <Text className="text-base font-extrabold text-white mb-1.5 text-center">
              You're all clear
            </Text>
            <Text className="text-xs text-slate-400 text-center leading-5 max-w-xs">
              {filterMode === 'unread'
                ? 'All alerts have been marked as read.'
                : 'Currently, there are no weather alerts for your selected location and preferences.'}
            </Text>
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
};
