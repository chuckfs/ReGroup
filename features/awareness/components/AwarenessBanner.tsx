import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  FadeInDown,
  FadeOutUp,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GlassCard } from '@/components/ui';
import { palette, radius, spacing, typography } from '@/constants';
import { useUIStore } from '@/store/useUIStore';
import type { AwarenessEvent, AwarenessEventType } from '@/types/awareness';

const AUTO_DISMISS_MS = 8_000;

const toneByType: Record<AwarenessEventType, string> = {
  proximity_drifting: palette.warning,
  proximity_separated: palette.danger,
  proximity_reconnected: palette.mint,
  battery_low: palette.amber,
  location_stale: palette.lilac,
};

/**
 * A single soft ambient banner for the most recent awareness event.
 * Warm, dismissible, and intentionally not alarm-shaped.
 */
export function AwarenessBanner() {
  const insets = useSafeAreaInsets();
  const activeEvent = useUIStore((s) => s.activeAwarenessEvent);
  const dismissAwarenessEvent = useUIStore((s) => s.dismissAwarenessEvent);

  useEffect(() => {
    if (!activeEvent) return;

    const timer = setTimeout(() => {
      dismissAwarenessEvent(activeEvent.id);
    }, AUTO_DISMISS_MS);

    return () => clearTimeout(timer);
  }, [activeEvent, dismissAwarenessEvent]);

  if (!activeEvent) return null;

  return (
    <Animated.View
      entering={FadeInDown.duration(320)}
      exiting={FadeOutUp.duration(240)}
      style={[styles.slot, { top: insets.top + spacing.xl * 2.2 }]}
      pointerEvents="box-none"
    >
      <Pressable onPress={() => dismissAwarenessEvent(activeEvent.id)}>
        <AwarenessCard event={activeEvent} />
      </Pressable>
    </Animated.View>
  );
}

function AwarenessCard({ event }: { event: AwarenessEvent }) {
  const accent = toneByType[event.type];

  return (
    <GlassCard cornerRadius={radius.lg} variant="standard" style={styles.card}>
      <View style={[styles.accent, { backgroundColor: accent }]} />
      <Text style={styles.message}>{event.message}</Text>
      <Text style={styles.hint}>tap to dismiss</Text>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  slot: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    zIndex: 6,
  },
  card: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingLeft: spacing.md + 6,
  },
  accent: {
    position: 'absolute',
    left: spacing.sm,
    top: spacing.sm,
    bottom: spacing.sm,
    width: 3,
    borderRadius: 2,
    opacity: 0.85,
  },
  message: {
    ...typography.bodySmall,
    color: palette.moonlight,
    lineHeight: 18,
  },
  hint: {
    ...typography.caption,
    color: palette.faint,
    marginTop: 4,
    textTransform: 'none',
    letterSpacing: 0.2,
  },
});
