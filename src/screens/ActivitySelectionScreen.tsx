import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { ScreenContainer } from '../components/ui/ScreenContainer';
import { useApp } from '../context/AppContext';
import { getPrioritizedActivities } from '../constants/activities';
import type { RootStackScreenProps } from '../navigation/types';
import type { ActivityType } from '../types/activity';

export const ActivitySelectionScreen: React.FC<RootStackScreenProps<'ActivitySelection'>> = ({
  navigation,
}) => {
  const { selectedPersonas, selectedActivities, toggleActivity, setActivities } = useApp();

  const prioritizedList = useMemo(() => {
    return getPrioritizedActivities(selectedPersonas);
  }, [selectedPersonas]);

  const hasRecommended = useMemo(() => {
    return prioritizedList.some((item) => item.isRecommended);
  }, [prioritizedList]);

  const handleToggle = (activityId: ActivityType) => {
    toggleActivity(activityId);
  };

  const handleContinue = () => {
    navigation.navigate('Preferences');
  };

  const handleSkip = () => {
    setActivities([]);
    navigation.navigate('Preferences');
  };

  const isAnySelected = selectedActivities.length > 0;

  return (
    <ScreenContainer
      title="What are you interested in?"
      subtitle="Choose the activities that matter most to you. We'll personalize your weather experience around them."
      onBack={() => navigation.goBack()}
    >
      <View style={styles.container}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Header Status Bar */}
          <View className="flex-row items-center justify-between mb-3 px-0.5">
            <View className="flex-row items-center">
              <View className="bg-sky-500/20 px-2 py-0.5 rounded border border-sky-400/30 mr-2">
                <Text className="text-[10px] font-bold text-sky-300 uppercase">Step 3 of 5</Text>
              </View>
              <Text className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                {selectedActivities.length} of {prioritizedList.length} Selected
              </Text>
            </View>

            {hasRecommended && (
              <View className="bg-sky-950/80 px-2 py-0.5 rounded-full border border-sky-500/30">
                <Text className="text-[10px] font-semibold text-sky-300">
                  🎯 Persona-Prioritized
                </Text>
              </View>
            )}
          </View>

          {/* Persona Relevance Explainer Banner */}
          {hasRecommended && (
            <View className="bg-sky-950/40 border border-sky-500/30 rounded-xl p-3 mb-3.5">
              <Text className="text-xs text-sky-200 leading-4">
                💡 Activities matching your active personas appear at the top. You can choose any combination.
              </Text>
            </View>
          )}

          {/* Activity Cards List */}
          <View style={styles.cardsContainer}>
            {prioritizedList.map(({ activity, isRecommended }) => {
              const isSelected = selectedActivities.includes(activity.id);

              return (
                <TouchableOpacity
                  key={activity.id}
                  onPress={() => handleToggle(activity.id)}
                  activeOpacity={0.7}
                  accessibilityLabel={`Select ${activity.title} activity, ${activity.description}`}
                  accessibilityState={{ selected: isSelected }}
                  accessibilityRole="checkbox"
                  style={[
                    styles.cardBase,
                    isSelected ? styles.cardSelected : styles.cardUnselected,
                  ]}
                >
                  <View style={styles.cardHeader}>
                    <View style={styles.cardHeaderLeft}>
                      <Text style={styles.cardIcon}>{activity.icon}</Text>
                      <View style={styles.cardTitleWrap}>
                        <View style={styles.titleRow}>
                          <Text
                            style={[
                              styles.cardTitle,
                              isSelected ? styles.titleSelected : styles.titleUnselected,
                            ]}
                          >
                            {activity.title}
                          </Text>
                          {isRecommended && (
                            <View style={styles.recBadge}>
                              <Text style={styles.recBadgeText}>Recommended</Text>
                            </View>
                          )}
                        </View>
                        <Text
                          style={[
                            styles.cardDesc,
                            isSelected ? styles.descSelected : styles.descUnselected,
                          ]}
                        >
                          {activity.description}
                        </Text>
                      </View>
                    </View>

                    <View
                      style={[
                        styles.indicatorBase,
                        isSelected ? styles.indicatorSelected : styles.indicatorUnselected,
                      ]}
                    >
                      {isSelected && <Text style={styles.checkmark}>✓</Text>}
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>

        {/* Bottom Actions Bar */}
        <View style={styles.footer}>
          {isAnySelected ? (
            <TouchableOpacity
              onPress={handleContinue}
              activeOpacity={0.8}
              accessibilityLabel={`Continue to Weather Preferences with ${selectedActivities.length} activities selected`}
              accessibilityRole="button"
              style={styles.continueButton}
            >
              <Text style={styles.continueButtonText}>
                Continue ({selectedActivities.length} selected) →
              </Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.skipRow}>
              <TouchableOpacity
                onPress={handleSkip}
                activeOpacity={0.7}
                accessibilityLabel="Skip activity selection for now"
                accessibilityRole="button"
                style={styles.skipButton}
              >
                <Text style={styles.skipButtonText}>Skip for now</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleContinue}
                activeOpacity={0.8}
                accessibilityLabel="Continue to Weather Preferences"
                accessibilityRole="button"
                style={styles.continueButtonSecondary}
              >
                <Text style={styles.continueButtonText}>Continue →</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
  },
  scrollContent: {
    paddingBottom: 24,
  },
  cardsContainer: {
    flexDirection: 'column',
    gap: 10,
  },
  cardBase: {
    width: '100%',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
  },
  cardSelected: {
    backgroundColor: 'rgba(8, 47, 73, 0.75)',
    borderColor: '#38bdf8',
    shadowColor: '#38bdf8',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  cardUnselected: {
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderColor: 'rgba(51, 65, 85, 0.6)',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  cardIcon: {
    fontSize: 26,
    marginRight: 12,
  },
  cardTitleWrap: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 2,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  titleSelected: {
    color: '#38bdf8',
  },
  titleUnselected: {
    color: '#f8fafc',
  },
  recBadge: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.35)',
  },
  recBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#7dd3fc',
    textTransform: 'uppercase',
  },
  cardDesc: {
    fontSize: 11,
    lineHeight: 15,
  },
  descSelected: {
    color: '#bae6fd',
  },
  descUnselected: {
    color: '#94a3b8',
  },
  indicatorBase: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  indicatorSelected: {
    backgroundColor: '#38bdf8',
    borderColor: '#38bdf8',
  },
  indicatorUnselected: {
    backgroundColor: 'transparent',
    borderColor: '#64748b',
  },
  checkmark: {
    color: '#0f172a',
    fontSize: 13,
    fontWeight: '900',
    lineHeight: 15,
  },
  footer: {
    paddingTop: 12,
    paddingBottom: 8,
  },
  continueButton: {
    width: '100%',
    backgroundColor: '#0284c7',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0284c7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  continueButtonSecondary: {
    flex: 1,
    backgroundColor: '#0284c7',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 15,
  },
  skipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  skipButton: {
    flex: 1,
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderColor: 'rgba(71, 85, 105, 0.6)',
    borderWidth: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipButtonText: {
    color: '#94a3b8',
    fontWeight: '600',
    fontSize: 14,
  },
});
