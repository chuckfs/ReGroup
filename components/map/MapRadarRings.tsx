import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { motion, palette } from '@/constants';

type RingProps = {
  size: number;
  delay: number;
  duration: number;
  color: string;
};

function Ring({ size, delay, duration, color }: RingProps) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      delay,
      withRepeat(
        withTiming(1, { duration, easing: motion.easing.radar }),
        -1,
        false,
      ),
    );
  }, [delay, duration, progress]);

  const style = useAnimatedStyle(() => ({
    opacity: 0.65 * (1 - progress.value),
    transform: [{ scale: 0.4 + progress.value * 0.95 }],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.ring,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderColor: color,
          shadowColor: color,
        },
        style,
      ]}
    />
  );
}

type Props = {
  size: number;
  color?: string;
};

/**
 * The "social radar" — three rings emanating outward from the user marker,
 * each delayed so they never sync, like sonar pings under the friends.
 */
export function MapRadarRings({ size, color = palette.orchid }: Props) {
  return (
    <View
      style={[
        styles.container,
        { width: size, height: size, borderRadius: size / 2 },
      ]}
      pointerEvents="none"
    >
      <Ring size={size} delay={0} duration={motion.duration.radarPing} color={color} />
      <Ring size={size} delay={1400} duration={motion.duration.radarPing} color={color} />
      <Ring size={size} delay={2800} duration={motion.duration.radarPing} color={color} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    borderWidth: 1.5,
    shadowOpacity: 0.6,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 0 },
  },
});
