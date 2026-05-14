import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated from 'react-native-reanimated';

import { BatteryPill, GlassCard, StatusDot } from '@/components/ui';
import { markerHues, palette, radius, spacing, typography } from '@/constants';
import { useGlowAnimation } from '@/hooks/useGlowAnimation';
import { STATUS_COPY, formatTimeAgo } from '@/services/mockData';
import type { Friend, StatusTone } from '@/types';

type Props = {
  friend: Friend;
};

const toneToColor: Record<StatusTone, string> = {
  positive: palette.mint,
  neutral: palette.lilac,
  warning: palette.warning,
  danger: palette.danger,
};

/**
 * Top of the friend-detail sheet: a soft avatar disc tinted to the
 * friend's hue with a status-dot pulse, the name + status, and a battery
 * pill on the right. Sits inside a translucent card.
 */
export function FriendHeroCard({ friend }: Props) {
  const color = markerHues[friend.hue];
  const status = STATUS_COPY[friend.status];
  const statusColor = toneToColor[status.tone];
  const { pulseStyle: haloStyle } = useGlowAnimation({
    min: 0.32,
    max: 0.64,
    scaleAmplitude: 0.08,
  });

  return (
    <GlassCard
      cornerRadius={radius.lg}
      variant="strong"
      style={[styles.card, { shadowColor: color }]}
    >
      <LinearGradient
        colors={[`${color}22`, `${color}00`]}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      <View style={styles.row}>
        <View style={styles.avatarWrap}>
          <Animated.View
            style={[
              styles.halo,
              { backgroundColor: color, shadowColor: color },
              haloStyle,
            ]}
          />
          <View
            style={[
              styles.avatar,
              { backgroundColor: color, shadowColor: color },
            ]}
          >
            <Text style={styles.initials}>{friend.initials}</Text>
          </View>
        </View>

        <View style={styles.middle}>
          <Text style={styles.name} numberOfLines={1}>
            {friend.name}
          </Text>
          <View style={styles.statusRow}>
            <StatusDot status={friend.status} size={8} />
            <Text style={[styles.statusText, { color: statusColor }]}>
              {status.label}
            </Text>
            <Text style={styles.statusDivider}>·</Text>
            <Text style={styles.statusSub}>
              {formatTimeAgo(friend.lastSeenMinutesAgo)}
            </Text>
          </View>
        </View>

        <View style={styles.right}>
          <BatteryPill percent={friend.batteryPercent} />
        </View>
      </View>
    </GlassCard>
  );
}

const AVATAR = 64;

const styles = StyleSheet.create({
  card: {
    padding: spacing.lg,
    shadowOpacity: 0.45,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 6 },
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatarWrap: {
    width: AVATAR,
    height: AVATAR,
    alignItems: 'center',
    justifyContent: 'center',
  },
  halo: {
    position: 'absolute',
    width: AVATAR * 1.4,
    height: AVATAR * 1.4,
    borderRadius: AVATAR,
    shadowOpacity: 0.7,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 0 },
  },
  avatar: {
    width: AVATAR,
    height: AVATAR,
    borderRadius: AVATAR / 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: palette.moonlight,
    shadowOpacity: 0.5,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 0 },
  },
  initials: {
    fontSize: 18,
    fontWeight: '900',
    color: palette.voidPurple,
    letterSpacing: 0.4,
  },
  middle: {
    flex: 1,
    gap: 4,
  },
  name: {
    ...typography.titleLarge,
    color: palette.moonlight,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  statusText: {
    ...typography.bodySmall,
    fontWeight: '800',
  },
  statusDivider: {
    ...typography.bodySmall,
    color: palette.faint,
  },
  statusSub: {
    ...typography.bodySmall,
    color: palette.dim,
  },
  right: {
    alignItems: 'flex-end',
  },
});
