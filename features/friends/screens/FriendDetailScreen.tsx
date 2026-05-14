import React, { useEffect, useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IconButton } from '@/components/buttons';
import { AtmosphericBackdrop, GlassCard, PressableScale } from '@/components/ui';
import { markerHues, motion, palette, radius, spacing, typography } from '@/constants';
import {
  STATUS_COPY,
  formatDistance,
  formatTimeAgo,
} from '@/services/mockData';
import type { Friend } from '@/types';

import { FriendActions } from '../components/FriendActions';
import { FriendHeroCard } from '../components/FriendHeroCard';
import { FriendMetric } from '../components/FriendMetric';

type Props = {
  friend: Friend | null;
  onClose: () => void;
  onMessage?: (friend: Friend) => void;
  onPing?: (friend: Friend) => void;
  onDirections?: (friend: Friend) => void;
};

/**
 * The Friend Detail sheet.
 *
 * Layout (top → bottom):
 *   - Modal header: close × + "···" overflow
 *   - FriendHeroCard: avatar / name / status / battery
 *   - Metrics: last updated, last seen near, distance, device
 *   - Actions: Message (primary) + Ping / Directions (secondary)
 *
 * Each section enters with a small staggered fade+rise (Apple-style).
 * The backdrop subtly retints to the friend's hue.
 */
export default function FriendDetailScreen({
  friend,
  onClose,
  onMessage,
  onPing,
  onDirections,
}: Props) {
  const insets = useSafeAreaInsets();

  if (!friend) {
    return <EmptyState onClose={onClose} />;
  }

  const accent = markerHues[friend.hue];
  const status = STATUS_COPY[friend.status];
  const distanceTone =
    friend.distanceFromGroupMiles && friend.distanceFromGroupMiles >= 0.5
      ? 'warning'
      : 'default';

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <AtmosphericBackdrop accent={accent} />

      <View style={[styles.header, { paddingTop: insets.top + spacing.xs }]}>
        <IconButton
          icon="back"
          size={44}
          onPress={onClose}
          accessibilityLabel="Close"
        />
        <Text style={styles.headerEyebrow}>Friend Detail</Text>
        <IconButton
          icon="more"
          size={44}
          onPress={() => console.log('[ReGroup] friend overflow:', friend.id)}
          accessibilityLabel="More options"
        />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: insets.bottom + spacing.lg },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <StaggerItem delay={0}>
          <FriendHeroCard friend={friend} />
        </StaggerItem>

        <StaggerItem delay={80}>
          <GlassCard cornerRadius={radius.lg} style={styles.metricsCard}>
            <FriendMetric
              icon="◌"
              label="Last updated"
              value={formatTimeAgo(friend.lastSeenMinutesAgo)}
            />
            <Divider />
            <FriendMetric
              icon="◎"
              label="Last seen near"
              value={friend.lastSeenPlace ?? 'Unknown'}
            />
            <Divider />
            <FriendMetric
              icon="↗"
              label="From group"
              value={formatDistance(friend.distanceFromGroupMiles)}
              tone={distanceTone}
            />
            <Divider />
            <FriendMetric
              icon="✦"
              label="Status"
              value={status.label}
              tone={
                status.tone === 'positive'
                  ? 'positive'
                  : status.tone === 'warning'
                    ? 'warning'
                    : status.tone === 'danger'
                      ? 'danger'
                      : 'default'
              }
            />
            <Divider />
            <FriendMetric
              icon="◉"
              label="Device"
              value={friend.device ?? 'iPhone'}
            />
          </GlassCard>
        </StaggerItem>

        <StaggerItem delay={160}>
          <FriendActions
            friendName={friend.name}
            accent={accent}
            onMessage={() => onMessage?.(friend)}
            onPing={() => onPing?.(friend)}
            onDirections={() => onDirections?.(friend)}
          />
        </StaggerItem>

        <StaggerItem delay={220}>
          <PressableScale
            onPress={() =>
              console.log('[ReGroup] mark as separated:', friend.id)
            }
            accessibilityRole="button"
            accessibilityLabel={`Mark ${friend.name} as separated`}
            style={styles.muted}
          >
            <Text style={styles.mutedText}>Mark as separated from group</Text>
          </PressableScale>
        </StaggerItem>
      </ScrollView>
    </View>
  );
}

/** Small fade+rise wrapper used to stagger each section in. */
function StaggerItem({
  delay,
  children,
}: {
  delay: number;
  children: React.ReactNode;
}) {
  const v = useSharedValue(0);
  useEffect(() => {
    v.value = withDelay(
      delay,
      withTiming(1, {
        duration: motion.duration.enter,
        easing: motion.easing.pressOut,
      }),
    );
  }, [delay, v]);

  const style = useAnimatedStyle(() => ({
    opacity: v.value,
    transform: [{ translateY: (1 - v.value) * 12 }],
  }));

  return <Animated.View style={[styles.staggerWrap, style]}>{children}</Animated.View>;
}

function Divider() {
  return <View style={styles.divider} />;
}

function EmptyState({ onClose }: { onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const accent = useMemo(() => palette.orchid, []);
  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <AtmosphericBackdrop accent={accent} />
      <View style={[styles.header, { paddingTop: insets.top + spacing.xs }]}>
        <IconButton icon="back" size={44} onPress={onClose} />
        <View />
        <View style={styles.spacer} />
      </View>
      <View style={styles.emptyBody}>
        <Text style={styles.emptyTitle}>Friend not found</Text>
        <Text style={styles.emptySub}>
          They may have left the group or the link is stale.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: palette.voidPurple,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  headerEyebrow: {
    ...typography.label,
    color: palette.lilac,
  },
  scroll: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
    gap: spacing.md,
  },
  staggerWrap: {
    // marker so gap stays applied
  },
  metricsCard: {
    paddingHorizontal: spacing.lg,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: palette.hairline,
  },
  muted: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  mutedText: {
    ...typography.bodySmall,
    color: palette.dim,
    fontWeight: '600',
    textDecorationLine: 'underline',
    textDecorationColor: palette.faint,
  },
  spacer: {
    width: 44,
    height: 44,
  },
  emptyBody: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  emptyTitle: {
    ...typography.titleLarge,
    color: palette.moonlight,
  },
  emptySub: {
    ...typography.body,
    color: palette.dim,
    textAlign: 'center',
    marginTop: 8,
  },
});
