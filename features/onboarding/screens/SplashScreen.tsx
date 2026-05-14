import React, { useEffect } from 'react';
import {
  Dimensions,
  Image,
  ImageBackground,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { motion, palette, typography } from '@/constants';

const { width } = Dimensions.get('window');
const RING_SIZE = width * 0.92;

type Props = {
  onReady?: () => void;
  /** Hold time after the entrance animation settles before calling onReady. */
  holdMs?: number;
};

/**
 * Splash for ReGroup.
 *
 * Choreography:
 *   1. Ambient backdrop fades in.
 *   2. Mascot rises on a soft spring (Apple-style).
 *   3. The ring fades in, scales into place, and then rotates slowly
 *      forever (parented above the mascot so it visibly orbits the buddies).
 *   4. Wordmark + tagline drift up from below.
 *   5. After ~holdMs, fires onReady so the parent can navigate.
 */
export default function SplashScreen({ onReady, holdMs = 2200 }: Props) {
  const intro = useSharedValue(0);
  const ringScale = useSharedValue(0.86);
  const ringOpacity = useSharedValue(0);
  const rotation = useSharedValue(0);
  const wordmarkIntro = useSharedValue(0);

  useEffect(() => {
    intro.value = withDelay(120, withSpring(1, motion.spring.entrance));

    ringOpacity.value = withDelay(
      280,
      withTiming(1, {
        duration: motion.duration.sheen,
        easing: motion.easing.pressOut,
      }),
    );
    ringScale.value = withDelay(280, withSpring(1, motion.spring.bouncyAvatar));

    rotation.value = withDelay(
      280,
      withRepeat(
        withTiming(360, {
          duration: motion.duration.orbit,
          easing: motion.easing.linear,
        }),
        -1,
        false,
      ),
    );

    wordmarkIntro.value = withDelay(
      motion.duration.enterLong,
      withSpring(1, motion.spring.softEntrance),
    );

    const t = setTimeout(() => onReady?.(), holdMs + 1100);
    return () => clearTimeout(t);
  }, [holdMs, intro, onReady, ringOpacity, ringScale, rotation, wordmarkIntro]);

  const mascotStyle = useAnimatedStyle(() => ({
    opacity: intro.value,
    transform: [
      { translateY: (1 - intro.value) * 24 },
      { scale: 0.94 + intro.value * 0.06 },
    ],
  }));

  const ringStyle = useAnimatedStyle(() => ({
    opacity: ringOpacity.value,
    transform: [
      { scale: ringScale.value },
      { rotate: `${rotation.value}deg` },
    ],
  }));

  const wordmarkStyle = useAnimatedStyle(() => ({
    opacity: wordmarkIntro.value,
    transform: [{ translateY: (1 - wordmarkIntro.value) * 18 }],
  }));

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      <ImageBackground
        source={require('@/assets/images/mascot.png')}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
      >
        <LinearGradient
          colors={[
            'rgba(11, 4, 32, 0.45)',
            'rgba(28, 16, 64, 0.05)',
            'rgba(11, 4, 32, 0.7)',
          ]}
          locations={[0, 0.45, 1]}
          style={StyleSheet.absoluteFill}
        />

        <View style={styles.center} pointerEvents="none">
          <Animated.View style={[styles.mascotWrap, mascotStyle]} />

          <Animated.View style={[styles.ringWrap, ringStyle]}>
            <Image
              source={require('@/assets/images/ring.png')}
              style={styles.ring}
              resizeMode="contain"
            />
          </Animated.View>
        </View>

        <Animated.View
          style={[styles.bottomBlock, wordmarkStyle]}
          pointerEvents="none"
        >
          <Image
            source={require('@/assets/images/regroup-text.png')}
            style={styles.wordmark}
            resizeMode="contain"
          />
          <Text style={styles.tagline}>stay together · get home safe</Text>
        </Animated.View>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: palette.voidPurple,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mascotWrap: {
    position: 'absolute',
  },
  ringWrap: {
    width: RING_SIZE,
    height: RING_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    mixBlendMode: 'screen',
    shadowColor: palette.orchid,
    shadowOpacity: 0.5,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 0 },
  },
  ring: {
    width: '100%',
    height: '100%',
  },
  bottomBlock: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 80,
    alignItems: 'center',
  },
  wordmark: {
    width: width * 0.62,
    height: 72,
  },
  tagline: {
    ...typography.tagline,
    color: palette.whisper,
    marginTop: 6,
  },
});
