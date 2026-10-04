/**
 * Phase 18 — Adaptive Homepage Card Component
 * SIH26076 · PersonalizedMAUSAM
 *
 * Reusable card container for adaptive homepage sections.
 * Supports priority badges, icons, interactive navigation, and explainability tags.
 */

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import type { HomepageCard } from '../../types/homepageLayout';

interface AdaptiveHomepageCardProps {
  card?: HomepageCard;
  title: string;
  subtitle?: string;
  icon?: string;
  priority?: 'critical' | 'high' | 'medium' | 'low';
  badge?: string;
  reason?: string;
  explanation?: string;
  isCritical?: boolean;
  onPress?: () => void;
  onPressExplain?: () => void;
  actionLabel?: string;
  children?: React.ReactNode;
}

export const AdaptiveHomepageCard: React.FC<AdaptiveHomepageCardProps> = ({
  title,
  subtitle,
  icon,
  priority = 'medium',
  badge,
  reason,
  explanation,
  isCritical = false,
  onPress,
  onPressExplain,
  actionLabel = 'View →',
  children,
}) => {
  const isSevereCritical = isCritical || priority === 'critical';

  const borderColor = isSevereCritical
    ? 'border-red-500/60'
    : priority === 'high'
    ? 'border-sky-500/40'
    : 'border-slate-700/60';

  const bgColor = isSevereCritical
    ? 'bg-red-950/30'
    : 'bg-slate-800/90';

  return (
    <View className={`${bgColor} border ${borderColor} rounded-2xl p-4 mb-4 shadow-sm`}>
      {/* Header: Icon, Title, Subtitle, Badge */}
      <View className="flex-row items-center justify-between mb-2">
        <View className="flex-row items-center flex-1 mr-2">
          {icon && <Text className="text-xl mr-2.5">{icon}</Text>}
          <View className="flex-1">
            <Text className="text-sm font-bold text-white tracking-tight leading-5">
              {title}
            </Text>
            {subtitle && (
              <Text className="text-[11px] text-slate-400 mt-0.5 leading-4">
                {subtitle}
              </Text>
            )}
          </View>
        </View>

        {badge && (
          <View
            className={`px-2 py-0.5 rounded-full border ${
              isSevereCritical
                ? 'bg-red-500/20 border-red-500/40'
                : priority === 'high'
                ? 'bg-sky-500/20 border-sky-400/30'
                : 'bg-slate-700/50 border-slate-600/40'
            }`}
          >
            <Text
              className={`text-[9px] font-bold uppercase tracking-wider ${
                isSevereCritical ? 'text-red-300' : 'text-sky-300'
              }`}
            >
              {badge}
            </Text>
          </View>
        )}
      </View>

      {/* Main Content Body */}
      {children && <View className="my-1.5">{children}</View>}

      {/* Footer: Reason / Explanation & Action Button */}
      <View className="flex-row items-center justify-between pt-2.5 border-t border-slate-700/50 mt-1">
        <View className="flex-1 mr-2">
          {reason && (
            <Text className="text-[10px] text-slate-400 leading-4 italic" numberOfLines={2}>
              💡 {reason}
            </Text>
          )}
          {explanation && !reason && (
            <Text className="text-[10px] text-slate-400 leading-4 italic" numberOfLines={2}>
              {explanation}
            </Text>
          )}
        </View>

        <View className="flex-row items-center">
          {onPressExplain && (
            <TouchableOpacity
              onPress={onPressExplain}
              activeOpacity={0.7}
              className="mr-2 px-2 py-1 rounded bg-slate-700/40 border border-slate-600/40"
            >
              <Text className="text-[9px] font-semibold text-sky-400">Why? →</Text>
            </TouchableOpacity>
          )}

          {onPress && (
            <TouchableOpacity
              onPress={onPress}
              activeOpacity={0.7}
              className={`px-2.5 py-1 rounded-lg border ${
                isSevereCritical
                  ? 'bg-red-500/20 border-red-500/40'
                  : 'bg-sky-500/20 border-sky-400/30'
              }`}
            >
              <Text
                className={`text-[10px] font-bold ${
                  isSevereCritical ? 'text-red-300' : 'text-sky-300'
                }`}
              >
                {actionLabel}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};
