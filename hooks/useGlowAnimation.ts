import { useEffect } from 'react';
import {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { motion } from '@/constants';

type Options = {
  /** Total length of one breath (ms). Defaults to motion.duration.pulse. */
  duration?: number;
  /** Stagger so neighbouring glows don't sync. */
  delayMs?: number;
  /** Opacity oscillates between `min` and `max`. */
  min?: number;
  max?: number;
  /** Scale oscillates between `1` and `1 + scaleAmplitude`. */
  scaleAmplitude?: number;
};

/**
 * The reusable "soft pulse" animation used by:
 *   - Friend marker dots (`FloatingMapPin`)
 *   - Avatar halos in the friend detail card
 *   - The user marker's outer halo
 *
 * Returns:
 *   - `progress`: the underlying shared value in [0,1] for advanced
 *      consumers who want to compose their own animated styles.
 *   - `pulseStyle`: a ready-to-use animated style (opacity + scale)
 *      that drops straight onto an `Animated.View`.
 *
 * The animation runs on the UI thread (Reanimated). Cheap to spin up
 * many copies — every glowing dot in the app uses one.
 *
 * Return type is intentionally inferred: Reanimated's animated-style
 * type doesn't survive an explicit annotation cleanly, but inferred
 * types compose fine with `Animated.View`'s style prop.
 */
export function useGlowAnimation(options: Options = {}) {
  const {
    duration = motion.duration.pulse,
    delayMs = 0,
    min = 0.35,
    max = 0.7,
    scaleAmplitude = 0.08,
  } = options;

  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      delayMs,
      withRepeat(
        withTiming(1, { duration, easing: motion.easing.sineBreathe }),
        -1,
        true,
      ),
    );
  }, [delayMs, duration, progress]);

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: min + progress.value * (max - min),
    transform: [{ scale: 1 + progress.value * scaleAmplitude }],
  }));

  return { progress, pulseStyle };
}
