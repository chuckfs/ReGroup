import React, { useEffect } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { gradients, motion, palette } from '@/constants';

const { width, height } = Dimensions.get('window');
const BLOB = Math.max(width, height) * 1.1;

/**
 * The base "atmosphere" beneath the map. A deep purple sky gradient with
 * two slow-drifting glow blobs (city light + magenta haze) that breathe in
 * opposite phases. Pure decoration, lives behind every other map layer.
 */
export function MapAtmosphere() {
  const drift = useSharedValue(0);
  const breathe = useSharedValue(0);

  useEffect(() => {
    drift.value = withRepeat(
      withTiming(1, {
        duration: motion.duration.drift,
        easing: motion.easing.sineBreathe,
      }),
      -1,
      true,
    );
    breathe.value = withRepeat(
      withTiming(1, {
        duration: motion.duration.breathe,
        easing: motion.easing.sineBreathe,
      }),
      -1,
      true,
    );
  }, [breathe, drift]);

  const cityStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: -40 + drift.value * 80 },
      { translateY: -20 + drift.value * 30 },
      { scale: 1 + breathe.value * 0.06 },
    ],
    opacity: 0.55 + breathe.value * 0.1,
  }));

  const magentaStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: 30 - drift.value * 60 },
      { translateY: 10 - drift.value * 24 },
      { scale: 1 + (1 - breathe.value) * 0.08 },
    ],
    opacity: 0.45 + (1 - breathe.value) * 0.15,
  }));

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <LinearGradient
        colors={gradients.mapSky}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <Animated.View style={[styles.blob, styles.blobTopRight, cityStyle]}>
        <LinearGradient
          colors={gradients.cityGlow}
          start={{ x: 0.5, y: 0.5 }}
          end={{ x: 1, y: 1 }}
          style={styles.blobFill}
        />
      </Animated.View>

      <Animated.View style={[styles.blob, styles.blobBottomLeft, magentaStyle]}>
        <LinearGradient
          colors={['rgba(255, 93, 187, 0.32)', 'rgba(255, 93, 187, 0)']}
          start={{ x: 0.5, y: 0.5 }}
          end={{ x: 1, y: 1 }}
          style={styles.blobFill}
        />
      </Animated.View>

      <View style={styles.vignette} />
    </View>
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
  blobTopRight: {
    top: -BLOB * 0.45,
    right: -BLOB * 0.4,
  },
  blobBottomLeft: {
    bottom: -BLOB * 0.5,
    left: -BLOB * 0.45,
  },
  vignette: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: palette.voidPurple,
    opacity: 0.15,
  },
});
