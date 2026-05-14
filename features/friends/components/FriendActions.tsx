import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { GlassCard, PressableScale } from '@/components/ui';
import { palette, radius, shadow, spacing, typography } from '@/constants';

type Props = {
  friendName: string;
  accent: string;
  onMessage?: () => void;
  onPing?: () => void;
  onDirections?: () => void;
};

/**
 * Friend-detail CTAs:
 *   - Primary: "Message {name}" (gradient pill)
 *   - Secondary row: Ping (gentle nudge notification) + Directions
 *
 * Each handler is optional so we can stage these as the backend lands;
 * unused ones just `console.log` from the caller for now.
 *
 * TODO(backend):
 *   - `onMessage` → push to `/chat/[friendId]` when chat ships
 *   - `onPing` → emit a "ping" event over the realtime channel
 *   - `onDirections` → open Apple Maps / Google Maps with the friend's
 *     last-seen location
 */
export function FriendActions({
  friendName,
  accent,
  onMessage,
  onPing,
  onDirections,
}: Props) {
  return (
    <View style={styles.wrap}>
      <PressableScale
        onPress={onMessage}
        accessibilityRole="button"
        accessibilityLabel={`Message ${friendName}`}
        style={[styles.primary, shadow.fab, { shadowColor: accent }]}
      >
        <LinearGradient
          colors={[accent, palette.electric]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.primaryFill}
        >
          <Text style={styles.primaryEmoji}>✦</Text>
          <Text style={styles.primaryText}>Message {friendName}</Text>
        </LinearGradient>
      </PressableScale>

      <View style={styles.secondaryRow}>
        <SecondaryButton
          icon="◔"
          label="Ping"
          onPress={onPing}
          accessibilityLabel={`Ping ${friendName}`}
        />
        <SecondaryButton
          icon="↗"
          label="Directions"
          onPress={onDirections}
          accessibilityLabel={`Get directions to ${friendName}`}
        />
      </View>
    </View>
  );
}

function SecondaryButton({
  icon,
  label,
  onPress,
  accessibilityLabel,
}: {
  icon: string;
  label: string;
  onPress?: () => void;
  accessibilityLabel: string;
}) {
  return (
    <PressableScale
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={styles.secondary}
    >
      <GlassCard
        cornerRadius={radius.pill}
        variant="strong"
        style={styles.secondaryInner}
      >
        <Text style={styles.secondaryIcon}>{icon}</Text>
        <Text style={styles.secondaryText}>{label}</Text>
      </GlassCard>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.sm,
  },
  primary: {
    borderRadius: radius.pill,
    overflow: 'visible',
    shadowOpacity: 0.55,
  },
  primaryFill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: radius.pill,
    gap: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255, 255, 255, 0.22)',
  },
  primaryEmoji: {
    color: palette.moonlight,
    fontSize: 16,
    fontWeight: '900',
  },
  primaryText: {
    ...typography.titleMedium,
    color: palette.moonlight,
    fontWeight: '800',
  },
  secondaryRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  secondary: {
    flex: 1,
  },
  secondaryInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  secondaryIcon: {
    color: palette.lilac,
    fontSize: 14,
    fontWeight: '900',
  },
  secondaryText: {
    ...typography.body,
    color: palette.moonlight,
    fontWeight: '700',
  },
});
