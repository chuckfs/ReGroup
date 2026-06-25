import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeOutUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GlassCard, PressableScale } from '@/components/ui';
import { palette, radius, spacing, typography } from '@/constants';
import { calculateDistanceFeet } from '@/services/distance';
import type { RallyPoint } from '@/types/coordination';
import type { DeviceLocation } from '@/types/location';

type Props = {
  rally: RallyPoint;
  userLocation: DeviceLocation | null;
  currentUserId: string;
  onRespond: () => void;
};

function formatRallyDistance(feet: number): string {
  if (feet < 1000) return `${Math.round(feet)} ft`;
  return `${(feet / 5280).toFixed(1)} mi`;
}

/**
 * In-app alert when someone calls a regroup. Non-initiators tap to respond.
 */
export function RallyBanner({
  rally,
  userLocation,
  currentUserId,
  onRespond,
}: Props) {
  const insets = useSafeAreaInsets();
  const isInitiator = rally.initiatorUserId === currentUserId;
  const distanceLabel =
    userLocation != null
      ? formatRallyDistance(
          calculateDistanceFeet(userLocation, rally.location),
        )
      : null;

  return (
    <Animated.View
      entering={FadeInDown.duration(320)}
      exiting={FadeOutUp.duration(240)}
      style={[styles.slot, { top: insets.top + spacing.xl * 4.6 }]}
      pointerEvents="box-none"
    >
      <GlassCard cornerRadius={radius.lg} variant="strong" style={styles.card}>
        <View style={styles.accent} />
        <View style={styles.content}>
          <Text style={styles.title}>
            {isInitiator
              ? 'Regroup active'
              : `${rally.initiatorName} called a regroup`}
          </Text>
          <Text style={styles.subtitle}>
            {isInitiator
              ? 'Waiting for responses'
              : distanceLabel
                ? `${distanceLabel} away`
                : rally.label ?? 'Meet me here'}
          </Text>
        </View>
        {!isInitiator ? (
          <PressableScale
            onPress={onRespond}
            accessibilityRole="button"
            accessibilityLabel="Respond to regroup"
            style={styles.respondButton}
          >
            <Text style={styles.respondLabel}>Respond</Text>
          </PressableScale>
        ) : (
          <Pressable
            onPress={onRespond}
            accessibilityRole="button"
            accessibilityLabel="View regroup responses"
            style={styles.respondButtonMuted}
          >
            <Text style={styles.respondLabelMuted}>View</Text>
          </Pressable>
        )}
      </GlassCard>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  slot: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    zIndex: 7,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingLeft: spacing.md + 6,
    gap: spacing.sm,
  },
  accent: {
    position: 'absolute',
    left: spacing.sm,
    top: spacing.sm,
    bottom: spacing.sm,
    width: 3,
    borderRadius: 2,
    backgroundColor: palette.electric,
    opacity: 0.9,
  },
  content: {
    flex: 1,
  },
  title: {
    ...typography.bodySmall,
    color: palette.moonlight,
    fontWeight: '700',
  },
  subtitle: {
    ...typography.caption,
    color: palette.dim,
    marginTop: 2,
    textTransform: 'none',
    letterSpacing: 0.2,
  },
  respondButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255, 79, 216, 0.18)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255, 79, 216, 0.45)',
  },
  respondLabel: {
    ...typography.caption,
    color: palette.magenta,
    fontWeight: '800',
    textTransform: 'none',
    letterSpacing: 0.4,
  },
  respondButtonMuted: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  respondLabelMuted: {
    ...typography.caption,
    color: palette.lilac,
    fontWeight: '700',
    textTransform: 'none',
  },
});
