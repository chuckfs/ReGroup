import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated from 'react-native-reanimated';

import { GlassCard } from '@/components/ui';
import { gradients, palette, radius, typography } from '@/constants';
import { useGlowAnimation } from '@/hooks/useGlowAnimation';

import { MapRadarRings } from './MapRadarRings';

type Props = {
  /** Inner avatar size. The radar reaches roughly 3× this. */
  size?: number;
  /** Optional override label, defaults to "You". */
  label?: string;
};

/**
 * The user marker is the emotional centre of the map — radar rings ping
 * out from it, a soft halo breathes around it, and the mascot sits inside.
 */
export function UserMarker({ size = 78, label = 'You' }: Props) {
  const { pulseStyle } = useGlowAnimation({
    duration: 3200,
    min: 0.35,
    max: 0.7,
    scaleAmplitude: 0.08,
  });

  return (
    <View style={styles.wrap} pointerEvents="none">
      <MapRadarRings size={size * 3.2} color={palette.orchid} />

      <Animated.View
        style={[
          styles.halo,
          {
            width: size * 1.55,
            height: size * 1.55,
            borderRadius: size,
          },
          pulseStyle,
        ]}
      >
        <LinearGradient
          colors={gradients.halo}
          style={[StyleSheet.absoluteFill, { borderRadius: size }]}
        />
      </Animated.View>

      <View
        style={[
          styles.avatarRing,
          { width: size, height: size, borderRadius: size / 2 },
        ]}
      >
        <LinearGradient
          colors={[palette.blush, palette.magenta, palette.electric]}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[StyleSheet.absoluteFill, { borderRadius: size / 2 }]}
        />
        <View
          style={[
            styles.avatarInner,
            {
              width: size - 8,
              height: size - 8,
              borderRadius: (size - 8) / 2,
            },
          ]}
        >
          <Image
            source={require('@/assets/images/mascot.png')}
            style={styles.mascot}
            resizeMode="cover"
          />
        </View>
      </View>

      <GlassCard
        cornerRadius={radius.pill}
        variant="strong"
        style={styles.youPill}
      >
        <Text style={styles.youText}>{label}</Text>
      </GlassCard>
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
  },
  avatarRing: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: palette.magenta,
    shadowOpacity: 0.55,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 4 },
    overflow: 'hidden',
    padding: 4,
  },
  avatarInner: {
    overflow: 'hidden',
    backgroundColor: palette.inkViolet,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mascot: {
    width: '110%',
    height: '110%',
  },
  youPill: {
    position: 'absolute',
    bottom: -34,
    paddingHorizontal: 14,
    paddingVertical: 5,
  },
  youText: {
    ...typography.bodySmall,
    color: palette.moonlight,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
});
