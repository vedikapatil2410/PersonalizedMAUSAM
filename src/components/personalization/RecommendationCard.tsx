import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import type { PersonalizedRecommendation, RecommendationPriority } from '../../types/personalization';

interface RecommendationCardProps {
  item: PersonalizedRecommendation;
  onPressExplain?: () => void;
}

const getPriorityStyle = (priority: RecommendationPriority) => {
  switch (priority) {
    case 'critical':
      return {
        cardBorder: 'border-red-500 bg-red-950/40',
        badgeBg: 'bg-red-500/20 border-red-500/50',
        badgeText: 'text-red-300',
        iconBg: 'bg-red-500/25 border-red-500/40',
        explainBg: 'bg-red-950/40 border-red-500/30',
        explainTitle: 'text-red-400',
      };
    case 'high':
      return {
        cardBorder: 'border-amber-500/60 bg-amber-950/20',
        badgeBg: 'bg-amber-500/20 border-amber-500/40',
        badgeText: 'text-amber-300',
        iconBg: 'bg-amber-500/20 border-amber-500/30',
        explainBg: 'bg-sky-950/40 border-sky-500/20',
        explainTitle: 'text-sky-400',
      };
    case 'medium':
      return {
        cardBorder: 'border-sky-500/60 bg-slate-800/90',
        badgeBg: 'bg-sky-500/20 border-sky-500/40',
        badgeText: 'text-sky-300',
        iconBg: 'bg-sky-500/20 border-sky-500/30',
        explainBg: 'bg-sky-950/40 border-sky-500/20',
        explainTitle: 'text-sky-400',
      };
    case 'low':
      return {
        cardBorder: 'border-slate-700/60 bg-slate-800/70',
        badgeBg: 'bg-slate-700/50 border-slate-600/40',
        badgeText: 'text-slate-300',
        iconBg: 'bg-slate-800 border-slate-700/60',
        explainBg: 'bg-sky-950/40 border-sky-500/20',
        explainTitle: 'text-sky-400',
      };
  }
};

export const RecommendationCard: React.FC<RecommendationCardProps> = ({ item, onPressExplain }) => {
  const styles = getPriorityStyle(item.priority);
  const isCritical = item.priority === 'critical';

  const ExplainWrapper = onPressExplain ? TouchableOpacity : View;

  return (
    <View
      className={`rounded-2xl p-4 mb-3.5 border ${styles.cardBorder} shadow-md shadow-black/30 overflow-hidden`}
    >
      {/* Prominent Banner for Critical Safety Alerts */}
      {isCritical && (
        <View className="bg-red-600/30 border-b border-red-500/40 -mx-4 -mt-4 px-4 py-2 mb-3.5 flex-row items-center justify-between">
          <View className="flex-row items-center flex-1 mr-2">
            <Text className="text-xs mr-1.5">🚨</Text>
            <Text className="text-[11px] font-extrabold text-red-200 uppercase tracking-wider">
              Critical Safety Override • Public Advisory
            </Text>
          </View>
          <View className="bg-red-500 px-2 py-0.5 rounded">
            <Text className="text-[9px] font-black text-white uppercase tracking-widest">
              URGENT
            </Text>
          </View>
        </View>
      )}

      {/* Header: Icon, Badges & Priority */}
      <View className="flex-row items-center justify-between mb-2.5">
        <View className="flex-row items-center flex-1 pr-2">
          <View
            className={`w-9 h-9 rounded-xl items-center justify-center mr-2.5 border ${styles.iconBg}`}
          >
            <Text className="text-lg">{item.icon}</Text>
          </View>
          <View className="flex-1">
            <View className="flex-row items-center flex-wrap gap-1.5">
              {item.badge && (
                <View className="bg-sky-500/20 px-2 py-0.5 rounded border border-sky-400/30">
                  <Text className="text-[10px] font-semibold text-sky-300">{item.badge}</Text>
                </View>
              )}
              {item.relevantPersonaLabels.map((label, idx) => (
                <View
                  key={idx}
                  className="bg-slate-700/60 px-2 py-0.5 rounded border border-slate-600/40"
                >
                  <Text className="text-[10px] font-medium text-slate-200">{label}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Priority Badge */}
        <View className={`px-2.5 py-0.5 rounded-full border ${styles.badgeBg}`}>
          <Text className={`text-[10px] font-bold uppercase tracking-wider ${styles.badgeText}`}>
            {item.priority}
          </Text>
        </View>
      </View>

      {/* Title & Description */}
      <Text className="text-base font-bold text-white mb-1 tracking-tight">
        {item.title}
      </Text>
      <Text className="text-xs text-slate-300 leading-5 mb-3">
        {item.description}
      </Text>

      {/* Trigger Metric Pill */}
      <View className="bg-slate-900/60 border border-slate-700/50 rounded-xl px-3 py-2 mb-3 flex-row items-center justify-between">
        <Text className="text-[10px] font-semibold text-slate-400 uppercase">
          Weather Trigger
        </Text>
        <Text className="text-xs font-semibold text-sky-200">
          {item.weatherTrigger}
        </Text>
      </View>

      {/* Explainability Container ("Why this?") */}
      <ExplainWrapper
        {...(onPressExplain ? { onPress: onPressExplain, activeOpacity: 0.7 } : {})}
        className={`${styles.explainBg} border rounded-xl p-2.5`}
      >
        <View className="flex-row items-center justify-between mb-1">
          <View className="flex-row items-center">
            <Text className="text-[10px] mr-1">{isCritical ? '🛡️' : '💡'}</Text>
            <Text className={`text-[10px] font-bold ${styles.explainTitle} uppercase tracking-wider`}>
              Why this? (Rule-Based Explainability)
            </Text>
          </View>
          {onPressExplain && (
            <Text className="text-[9px] font-bold text-sky-400">Insights →</Text>
          )}
        </View>
        <Text className="text-xs text-slate-200 leading-4 font-normal">
          {item.explanation}
        </Text>
      </ExplainWrapper>
    </View>
  );
};
