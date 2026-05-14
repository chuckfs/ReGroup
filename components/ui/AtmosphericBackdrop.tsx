import React, { useEffect, useMemo } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { gradients, motion, palette } from '@/constants';

const { width, height } = Dimensions.get('window');
const BLOB = Math.max(width, height) * 1.05;

type SparkleConfig = {
  left: number;
  top: number;
  size: number;
  delay: number;
};

/**
 * Cinematic ambient backdrop used by full-screen modals (group creation,
 * onboarding, etc). Deep purple gradient with slow-drifting glow blobs +
 * faint floating sparkle motes — feels like the city skyline at 2am.
 *
 * Optionally tint the magenta glow to a different hue (e.g. follow the
 * selected vibe's accent colour through the wizard).
 */
type Props = {
  accent?: string;
};

export function AtmosphericBackdrop({ accent = palette.magenta }: Props) {
  const drift = useSharedValue(0);
  const breathe = useSharedValue(0);

  useEffect(() => {
    drift.value = withRepeat(
      withTiming(1, {
        duration: motion.duration.drift + 2000,
        easing: motion.easing.sineBreathe,
      }),
      -1,
      true,
    );
    breathe.value = withRepeat(
      withTiming(1, {
        duration: motion.duration.breathe + 1200,
        easing: motion.easing.sineBreathe,
      }),
      -1,
      true,
    );
  }, [breathe, drift]);

  const orchidStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: -30 + drift.value * 60 },
      { translateY: -10 + drift.value * 20 },
      { scale: 1 + breathe.value * 0.05 },
    ],
    opacity: 0.55 + breathe.value * 0.08,
  }));

  const accentStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: 20 - drift.value * 50 },
      { translateY: 10 - drift.value * 22 },
      { scale: 1 + (1 - breathe.value) * 0.06 },
    ],
    opacity: 0.4 + (1 - breathe.value) * 0.15,
  }));

  const accentColors = useMemo(
    () =>
      [
        `${accent}80`,
        `${accent}00`,
      ] as [string, string],
    [accent],
  );

  // Deterministic-but-scattered sparkle positions. Computed once.
  const sparkles = useMemo<SparkleConfig[]>(() => {
    const out: SparkleConfig[] = [];
    for (let i = 0; i < 18; i++) {
      out.push({
        left: ((i * 137) % 100) / 100,
        top: ((i * 73 + 11) % 100) / 100,
        size: 1.5 + ((i * 31) % 4) * 0.6,
        delay: (i * 211) % 4200,
      });
    }
    return out;
  }, []);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <LinearGradient
        colors={gradients.backdrop}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <Animated.View style={[styles.blob, styles.blobTopLeft, orchidStyle]}>
        <LinearGradient
          colors={gradients.halo}
          start={{ x: 0.5, y: 0.5 }}
          end={{ x: 1, y: 1 }}
          style={styles.blobFill}
        />
      </Animated.View>

      <Animated.View style={[styles.blob, styles.blobBottomRight, accentStyle]}>
        <LinearGradient
          colors={accentColors}
          start={{ x: 0.5, y: 0.5 }}
          end={{ x: 1, y: 1 }}
          style={styles.blobFill}
        />
      </Animated.View>

      {sparkles.map((s, i) => (
        <Sparkle key={i} config={s} />
      ))}

      <View style={styles.vignette} />
    </View>
  );
}

function Sparkle({ config }: { config: SparkleConfig }) {
  const twinkle = useSharedValue(0);

  useEffect(() => {
    twinkle.value = withDelay(
      config.delay,
      withRepeat(
        withTiming(1, {
          duration: motion.duration.pulse + 200,
          easing: motion.easing.sineBreathe,
        }),
        -1,
        true,
      ),
    );
  }, [config.delay, twinkle]);

  const style = useAnimatedStyle(() => ({
    opacity: 0.15 + twinkle.value * 0.55,
    transform: [{ scale: 0.8 + twinkle.value * 0.4 }],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.sparkle,
        {
          left: `${config.left * 100}%`,
          top: `${config.top * 100}%`,
          width: config.size,
          height: config.size,
          borderRadius: config.size / 2,
        },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  blob: {
    position: 'absolute',
    width: BLOB,
    height: BLOB,
    borderRadius: BLOB / 2,
  },
  blobFill: {
    flex: 1,
    borderRadius: BLOB / 2,
  },
  blobTopLeft: {
    top: -BLOB * 0.5,
    left: -BLOB * 0.35,
  },
  blobBottomRight: {
    bottom: -BLOB * 0.55,
    right: -BLOB * 0.35,
  },
  sparkle: {
    position: 'absolute',
    backgroundColor: palette.moonlight,
    shadowColor: palette.moonlight,
    shadowOpacity: 0.9,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 0 },
  },
  vignette: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: palette.voidPurple,
    opacity: 0.12,
  },
});
