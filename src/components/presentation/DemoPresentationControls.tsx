// src/components/presentation/DemoPresentationControls.tsx
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

interface DemoPresentationControlsProps {
  onBack: () => void;
  onNext: () => void;
  onExit: () => void;
  onFinish: () => void;
  disableBack: boolean;
  disableNext: boolean;
  isLast: boolean;
}

export const DemoPresentationControls: React.FC<DemoPresentationControlsProps> = ({
  onBack,
  onNext,
  onExit,
  onFinish,
  disableBack,
  disableNext,
  isLast,
}) => {
  return (
    <View className="pt-2 pb-6">
      <View className="flex-row items-center justify-between gap-3 mb-4">
        <TouchableOpacity
          onPress={onBack}
          disabled={disableBack}
          activeOpacity={0.7}
          className={`flex-1 py-3 px-4 rounded-xl items-center border ${
            disableBack
              ? 'bg-slate-800/40 border-slate-700/30 opacity-40'
              : 'bg-slate-800 border-slate-700/80'
          }`}
          accessibilityLabel="Previous Step"
          accessibilityRole="button"
          accessibilityState={{ disabled: disableBack }}
        >
          <Text
            className={`font-semibold text-sm ${
              disableBack ? 'text-slate-500' : 'text-slate-200'
            }`}
          >
            ← Previous
          </Text>
        </TouchableOpacity>

        {isLast ? (
          <TouchableOpacity
            onPress={onFinish}
            activeOpacity={0.8}
            className="flex-1 py-3 px-4 rounded-xl items-center bg-emerald-600 border border-emerald-500 shadow-sm"
            accessibilityLabel="Finish Demo Presentation"
            accessibilityRole="button"
          >
            <Text className="font-bold text-sm text-white">Finish Demo ✓</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={onNext}
            disabled={disableNext}
            activeOpacity={0.8}
            className={`flex-1 py-3 px-4 rounded-xl items-center border ${
              disableNext
                ? 'bg-sky-900/40 border-sky-800/30 opacity-40'
                : 'bg-sky-600 border-sky-500 shadow-sm'
            }`}
            accessibilityLabel="Next Demo Step"
            accessibilityRole="button"
            accessibilityState={{ disabled: disableNext }}
          >
            <Text className="font-bold text-sm text-white">Next Step →</Text>
          </TouchableOpacity>
        )}
      </View>

      <TouchableOpacity
        onPress={onExit}
        activeOpacity={0.7}
        className="py-2.5 px-4 rounded-xl items-center bg-slate-900/60 border border-slate-800"
        accessibilityLabel="Exit Demo Presentation"
        accessibilityRole="button"
      >
        <Text className="text-xs font-medium text-slate-400">Exit Presentation Mode</Text>
      </TouchableOpacity>
    </View>
  );
};
