import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { palette, typography } from '@/constants';
import { useGlowAnimation } from '@/hooks/useGlowAnimation';

type Props = {
  /** Two-letter initials shown inside the disc. */
  initials: string;
  /** Hue used to tint both the fill and the halo glow. */
  color: string;
  /** Diameter of the avatar disc in points. */
  size?: number;
  /** Toggle the breathing halo. Off for tight contexts like row cells. */
  withHalo?: boolean;
  /** Halo size multiplier (relative to `size`). */
  haloScale?: number;
};

/**
 * Reusable "tinted disc with breathing halo + bold initials" — pulled
 * out of `FriendHeroCard` so the friend list, separation alerts, and
 * future avatar contexts share one source of truth for the look.
 *
 * Compose with `FriendRow` and the hero card; not used inline in those
 * existing components yet (kept stable for this refactor) but available
 * for the next round of UI assembly.
 */
export function GlowAvatar({
  initials,
  color,
  size = 64,
  withHalo = true,
  haloScale = 1.4,
}: Props) {
  const { pulseStyle } = useGlowAnimation({
    min: 0.32,
    max: 0.64,
    scaleAmplitude: 0.08,
  });

  return (
    <View
      style={[styles.wrap, { width: size, height: size }]}
      accessibilityElementsHidden
    >
      {withHalo && (
        <Animated.View
          style={[
            styles.halo,
            {
              width: size * haloScale,
              height: size * haloScale,
              borderRadius: size,
              backgroundColor: color,
              shadowColor: color,
            },
            pulseStyle,
          ]}
        />
      )}
      <View
        style={[
          styles.disc,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: color,
            shadowColor: color,
          },
        ]}
      >
        <Text style={[styles.initials, { fontSize: Math.round(size * 0.28) }]}>
          {initials}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  halo: {
    position: 'absolute',
    shadowOpacity: 0.7,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 0 },
  },
  disc: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: palette.moonlight,
    shadowOpacity: 0.5,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 0 },
  },
  initials: {
    ...typography.bodySmall,
    fontWeight: '900',
    color: palette.voidPurple,
    letterSpacing: 0.4,
  },
});
