/**
 * Phase 19 — Contextual Quick Action Card Component
 * SIH26076 · PersonalizedMAUSAM
 *
 * Visual card component for rendering personalized contextual quick actions.
 * Supports critical safety styling, priority badges, explainability rationale, and onPress navigation.
 */

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import type { ContextualAction } from '../../types/contextualActions';

interface ContextualActionCardProps {
  action: ContextualAction;
  onPress: () => void;
  onPressExplain?: () => void;
}

export const ContextualActionCard: React.FC<ContextualActionCardProps> = ({
  action,
  onPress,
  onPressExplain,
}) => {
  const { title, subtitle, icon, priority, reason, critical } = action;

  const isCritical = critical || priority === 'critical';

  const borderColor = isCritical
    ? 'border-red-500/60'
    : priority === 'high'
    ? 'border-sky-500/40'
    : 'border-slate-700/60';

  const bgColor = isCritical ? 'bg-red-950/30' : 'bg-slate-800/90';

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      className={`${bgColor} border ${borderColor} rounded-xl p-3 mb-2.5 flex-row items-center justify-between shadow-sm`}
    >
      <View className="flex-row items-center flex-1 mr-2">
        <Text className="text-2xl mr-3">{icon}</Text>
        <View className="flex-1">
          <View className="flex-row items-center flex-wrap">
            <Text className="text-sm font-bold text-white tracking-tight mr-2">
              {title}
            </Text>
            {isCritical && (
              <View className="bg-red-500/20 px-1.5 py-0.5 rounded border border-red-500/40">
                <Text className="text-[9px] font-bold text-red-300 uppercase">Critical</Text>
              </View>
            )}
          </View>
          <Text className="text-[11px] text-slate-300 mt-0.5 leading-4" numberOfLines={1}>
            {subtitle}
          </Text>
          {reason && (
            <Text className="text-[10px] text-slate-400 mt-1 italic leading-3" numberOfLines={2}>
              💡 {reason}
            </Text>
          )}
        </View>
      </View>

      <View className="items-end">
        <View
          className={`px-2 py-1 rounded-lg border flex-row items-center ${
            isCritical
              ? 'bg-red-500/20 border-red-500/40'
              : 'bg-sky-500/20 border-sky-400/30'
          }`}
        >
          <Text
            className={`text-[10px] font-bold mr-0.5 ${
              isCritical ? 'text-red-300' : 'text-sky-300'
            }`}
          >
            Action
          </Text>
          <Text
            className={`text-[10px] font-bold ${
              isCritical ? 'text-red-300' : 'text-sky-300'
            }`}
          >
            →
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};
