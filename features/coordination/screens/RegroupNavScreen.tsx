import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { IconButton } from '@/components/buttons';
import { GradientButton } from '@/components/buttons/GradientButton';
import { AtmosphericBackdrop, GlassCard, PressableScale } from '@/components/ui';
import { palette, radius, spacing, typography } from '@/constants';
import { useRegroupNavigation } from '@/hooks/useRegroupNavigation';
import { useLocation } from '@/hooks/useLocation';
import { openRallyInMaps } from '@/lib/openMaps';
import type { RallyPoint } from '@/types/coordination';

type Props = {
  rally: RallyPoint;
  onClose: () => void;
  onMarkArrived?: () => void;
};

function NavigationArrow({ rotationDeg }: { rotationDeg: number }) {
  const rotation = useSharedValue(rotationDeg);

  useEffect(() => {
    rotation.value = withTiming(rotationDeg, { duration: 220 });
  }, [rotationDeg, rotation]);

  const arrowStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <Animated.View style={[styles.arrowWrap, arrowStyle]}>
      <Svg width={160} height={160} viewBox="0 0 100 100">
        <Path
          d="M50 8 L78 88 L50 72 L22 88 Z"
          fill={palette.electric}
          stroke={palette.moonlight}
          strokeWidth={2}
        />
      </Svg>
    </Animated.View>
  );
}

/**
 * Full-screen hotter/colder navigation toward an active rally point.
 */
export function RegroupNavScreen({ rally, onClose, onMarkArrived }: Props) {
  const insets = useSafeAreaInsets();
  const { location, error } = useLocation();
  const navigation = useRegroupNavigation(location, rally.location);

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <AtmosphericBackdrop accent={palette.electric} />

      <View style={[styles.header, { paddingTop: insets.top + spacing.xs }]}>
        <IconButton
          icon="back"
          size={44}
          onPress={onClose}
          accessibilityLabel="Close navigation"
        />
        <Text style={styles.headerEyebrow}>Regroup</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.body}>
        <Text style={styles.eyebrow}>
          {rally.label ?? 'Meet me here'} · {rally.initiatorName}
        </Text>

        {navigation.hasFix ? (
          <>
            <Text style={styles.distance}>{navigation.distanceLabel}</Text>
            <Text style={styles.hint}>
              {navigation.isArrived
                ? 'You are at the rally point'
                : 'Follow the arrow'}
            </Text>
            <NavigationArrow rotationDeg={navigation.arrowRotationDeg} />
          </>
        ) : (
          <GlassCard cornerRadius={radius.lg} style={styles.waitingCard}>
            <Text style={styles.waitingTitle}>Waiting for GPS</Text>
            <Text style={styles.waitingBody}>
              {error ?? 'Move to an open area for a clearer fix.'}
            </Text>
          </GlassCard>
        )}

        {navigation.isArrived ? (
          <GlassCard cornerRadius={radius.lg} variant="strong" style={styles.arrivedCard}>
            <Text style={styles.arrivedTitle}>You made it</Text>
            <Text style={styles.arrivedBody}>
              Tap below to let the crew know you are at the point.
            </Text>
          </GlassCard>
        ) : null}
      </View>

      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.lg }]}>
        {navigation.isArrived && onMarkArrived ? (
          <GradientButton
            label="I'm here"
            onPress={onMarkArrived}
            colors={[palette.mint, palette.electric]}
            glow={palette.mint}
            style={styles.primaryAction}
          />
        ) : null}

        <PressableScale
          onPress={() => openRallyInMaps(rally.location, rally.label ?? 'Regroup')}
          accessibilityRole="button"
          accessibilityLabel="Open rally point in Maps"
          style={styles.mapsButton}
        >
          <GlassCard cornerRadius={radius.pill} variant="strong" style={styles.mapsInner}>
            <Text style={styles.mapsLabel}>Open in Maps</Text>
          </GlassCard>
        </PressableScale>
      </View>
    </View>
  );
}

function EmptyState({ onClose }: { onClose: () => void }) {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <AtmosphericBackdrop accent={palette.lilac} />
      <View style={[styles.header, { paddingTop: insets.top + spacing.xs }]}>
        <IconButton
          icon="back"
          size={44}
          onPress={onClose}
          accessibilityLabel="Close navigation"
        />
      </View>
      <View style={styles.body}>
        <Text style={styles.waitingTitle}>No active regroup</Text>
        <Text style={styles.waitingBody}>
          Start or join a rally from the home screen first.
        </Text>
      </View>
    </View>
  );
}

export function RegroupNavScreenRoute({
  rally,
  onClose,
  onMarkArrived,
}: {
  rally: RallyPoint | null;
  onClose: () => void;
  onMarkArrived?: () => void;
}) {
  if (!rally) {
    return <EmptyState onClose={onClose} />;
  }

  return (
    <RegroupNavScreen
      rally={rally}
      onClose={onClose}
      onMarkArrived={onMarkArrived}
    />
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
    paddingHorizontal: spacing.md,
    zIndex: 2,
  },
  headerEyebrow: {
    ...typography.label,
    color: palette.lilac,
  },
  headerSpacer: {
    width: 44,
  },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  eyebrow: {
    ...typography.bodySmall,
    color: palette.dim,
    textAlign: 'center',
  },
  distance: {
    ...typography.titleLarge,
    color: palette.moonlight,
    fontSize: 48,
    fontWeight: '800',
    letterSpacing: -1,
  },
  hint: {
    ...typography.bodySmall,
    color: palette.lilac,
    marginBottom: spacing.md,
  },
  arrowWrap: {
    width: 160,
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: spacing.lg,
  },
  waitingCard: {
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.xs,
  },
  waitingTitle: {
    ...typography.titleMedium,
    color: palette.moonlight,
    textAlign: 'center',
  },
  waitingBody: {
    ...typography.bodySmall,
    color: palette.dim,
    textAlign: 'center',
  },
  arrivedCard: {
    marginTop: spacing.md,
    padding: spacing.md,
    alignItems: 'center',
    gap: spacing.xs,
  },
  arrivedTitle: {
    ...typography.titleMedium,
    color: palette.mint,
  },
  arrivedBody: {
    ...typography.bodySmall,
    color: palette.dim,
    textAlign: 'center',
  },
  footer: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  primaryAction: {
    width: '100%',
  },
  mapsButton: {
    width: '100%',
  },
  mapsInner: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  mapsLabel: {
    ...typography.body,
    color: palette.moonlight,
    fontWeight: '700',
  },
});
