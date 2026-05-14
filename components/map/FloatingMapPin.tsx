import React, { useEffect } from 'react';
import { StyleSheet, Text } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { GlassCard, PressableScale } from '@/components/ui';
import { markerHues, motion, palette, radius, typography } from '@/constants';
import type { Friend } from '@/types';

type Props = {
  friend: Friend;
  /** Floating offset in ms so neighbouring markers don't bob in sync. */
  bobOffset?: number;
  /** Tap the marker → open friend detail. */
  onPress?: (friend: Friend) => void;
};

/**
 * Floating friend marker pin: a soft glowing dot with a white outline and
 * a name pill beneath. No profile pictures yet — the dot's hue and the
 * name pill carry the identity. Tap opens the friend-detail sheet.
 *
 * Renamed from `FriendMarker` → `FloatingMapPin` so it reads as a
 * reusable map primitive (any "floating thing on the map") rather than a
 * friend-only component. Friend-specific composition happens at the
 * `MapCanvas` level.
 */
export function FloatingMapPin({ friend, bobOffset = 0, onPress }: Props) {
  const bob = useSharedValue(0);
  const pulse = useSharedValue(0);
  const color = markerHues[friend.hue];

  useEffect(() => {
    bob.value = withDelay(
      bobOffset,
      withRepeat(
        withTiming(1, { duration: 4200, easing: motion.easing.sineBreathe }),
        -1,
        true,
      ),
    );
    pulse.value = withDelay(
      bobOffset + 200,
      withRepeat(
        withTiming(1, {
          duration: motion.duration.pulse,
          easing: motion.easing.sineBreathe,
        }),
        -1,
        true,
      ),
    );
  }, [bob, bobOffset, pulse]);

  const wrapperStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -3 + bob.value * 6 }],
  }));

  const dotStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + pulse.value * 0.06 }],
    shadowOpacity: 0.55 + pulse.value * 0.25,
  }));

  return (
    <Animated.View style={[styles.wrap, wrapperStyle]}>
      <PressableScale
        onPress={() => onPress?.(friend)}
        accessibilityRole="button"
        accessibilityLabel={`Open details for ${friend.name}`}
        scaleTo={0.9}
        style={styles.press}
      >
        <Animated.View
          style={[
            styles.dot,
            { backgroundColor: color, shadowColor: color },
            dotStyle,
          ]}
        />
        <GlassCard
          cornerRadius={radius.pill}
          variant="strong"
          style={styles.pill}
        >
          <Text style={styles.name} numberOfLines={1}>
            {friend.name}
          </Text>
        </GlassCard>
      </PressableScale>
    </Animated.View>
  );
}

const DOT_SIZE = 18;

export const FLOATING_MAP_PIN_DOT_SIZE = DOT_SIZE;

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
  },
  press: {
    alignItems: 'center',
  },
  dot: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
    borderWidth: 2.5,
    borderColor: palette.moonlight,
    shadowOpacity: 0.55,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 0 },
  },
  pill: {
    marginTop: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    minWidth: 56,
    alignItems: 'center',
  },
  name: {
    ...typography.bodySmall,
    color: palette.moonlight,
    fontWeight: '700',
  },
});
