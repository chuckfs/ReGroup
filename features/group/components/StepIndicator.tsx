import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';

import { motion, palette } from '@/constants';

type Props = {
  count: number;
  currentIndex: number;
  accent?: string;
};

/**
 * Pill-shaped step dots, with the current step elongated and tinted to
 * the wizard's accent colour. Each dot springs into its target style when
 * the step changes.
 */
export function StepIndicator({
  count,
  currentIndex,
  accent = palette.orchid,
}: Props) {
  return (
    <View style={styles.row}>
      {Array.from({ length: count }).map((_, i) => (
        <Dot key={i} active={i === currentIndex} accent={accent} />
      ))}
    </View>
  );
}

function Dot({ active, accent }: { active: boolean; accent: string }) {
  const style = useAnimatedStyle(() => {
    const width = withSpring(active ? 28 : 8, motion.spring.selectionLift);
    return {
      width,
      backgroundColor: active ? accent : palette.faint,
      shadowOpacity: active ? 0.6 : 0,
      shadowColor: accent,
    };
  });

  return <Animated.View style={[styles.dot, style]} />;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
  },
});
