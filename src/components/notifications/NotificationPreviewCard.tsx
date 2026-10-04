import React from 'react';
import { View, Text } from 'react-native';
import type { NotificationDeliveryDecision } from '../../types/notifications';

interface NotificationPreviewCardProps {
  decision: NotificationDeliveryDecision;
}

export const NotificationPreviewCard: React.FC<NotificationPreviewCardProps> = ({ decision }) => {
  const { alert, delivered, reason, rule } = decision;
  const isCritical = alert.severity === 'critical';

  return (
    <View
      className={`rounded-2xl p-4 mb-3 border shadow-sm ${
        isCritical
          ? 'bg-red-950/30 border-red-500/60'
          : delivered
          ? 'bg-slate-800/90 border-slate-700/80'
          : 'bg-slate-900/60 border-slate-800/80 opacity-70'
      }`}
    >
      {/* Header: Status Pill, Category & Severity */}
      <View className="flex-row items-center justify-between mb-2">
        <View className="flex-row items-center flex-wrap gap-1.5 flex-1 pr-2">
          {/* Delivery Status Pill */}
          <View
            className={`px-2 py-0.5 rounded border ${
              isCritical
                ? 'bg-red-500/25 border-red-500/50'
                : delivered
                ? 'bg-emerald-500/20 border-emerald-500/40'
                : 'bg-slate-700/50 border-slate-600/40'
            }`}
          >
            <Text
              className={`text-[9px] font-bold uppercase tracking-wider ${
                isCritical
                  ? 'text-red-200'
                  : delivered
                  ? 'text-emerald-300'
                  : 'text-slate-400'
              }`}
            >
              {isCritical
                ? '🚨 Mandatory Delivery'
                : delivered
                ? '🔔 Delivered'
                : '🔕 Suppressed'}
            </Text>
          </View>

          {/* Category */}
          <View className="bg-slate-900/60 px-2 py-0.5 rounded border border-slate-700/50">
            <Text className="text-[9px] font-medium text-slate-300 capitalize">
              {alert.category}
            </Text>
          </View>
        </View>

        {/* Severity Badge */}
        <View
          className={`px-2 py-0.5 rounded-full border ${
            isCritical
              ? 'bg-red-500/30 border-red-500/50'
              : alert.severity === 'high'
              ? 'bg-amber-500/20 border-amber-500/40'
              : 'bg-sky-500/20 border-sky-500/40'
          }`}
        >
          <Text
            className={`text-[9px] font-bold uppercase tracking-wider ${
              isCritical
                ? 'text-red-300'
                : alert.severity === 'high'
                ? 'text-amber-300'
                : 'text-sky-300'
            }`}
          >
            {alert.severity}
          </Text>
        </View>
      </View>

      {/* Alert Title & Message */}
      <Text className="text-sm font-bold text-white mb-1 tracking-tight">
        {alert.title}
      </Text>
      <Text className="text-xs text-slate-300 leading-4 mb-2.5">
        {alert.message}
      </Text>

      {/* Rule-Based Delivery Decision Explanation */}
      <View
        className={`rounded-xl p-2.5 border ${
          isCritical
            ? 'bg-red-950/40 border-red-500/30'
            : delivered
            ? 'bg-emerald-950/20 border-emerald-500/20'
            : 'bg-slate-900/70 border-slate-700/40'
        }`}
      >
        <View className="flex-row items-center mb-0.5">
          <Text className="text-[10px] mr-1">
            {isCritical ? '🛡️' : delivered ? '✅' : '🚫'}
          </Text>
          <Text
            className={`text-[10px] font-bold uppercase tracking-wider ${
              isCritical
                ? 'text-red-300'
                : delivered
                ? 'text-emerald-300'
                : 'text-slate-400'
            }`}
          >
            Rule-Based Notification Decision
          </Text>
        </View>
        <Text className="text-[11px] text-slate-300 leading-4">
          {reason}
        </Text>
      </View>
    </View>
  );
};
