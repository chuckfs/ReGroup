import React, { useEffect, useMemo } from 'react';
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BottomSheetHandle } from '@/components/sheet';
import { FriendRow } from '@/components/friend';
import { motion, palette, radius, spacing, typography } from '@/constants';
import { summarizeGroup } from '@/services/mockData';
import type { Friend, Group, QuickAction } from '@/types';

import { QuickActions } from './QuickActions';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

/**
 * Snap points are expressed as the sheet's *height* (i.e. how tall the
 * sheet is from the bottom). We translate that into a translateY off the
 * sheet's full height inside the gesture handler.
 *
 * The QuickActions chips live at the bottom of the scrollable content
 * inside the sheet (right under the friend-list divider), so when the
 * full snap can fit the whole list the chips appear without any scroll.
 * On shorter screens the user simply scrolls to reach them.
 */
const SNAP = {
  peek: 240,
  mid: 500,
  full: Math.max(720, SCREEN_HEIGHT * 0.86),
} as const;

type SnapKey = keyof typeof SNAP;
const SNAP_KEYS: SnapKey[] = ['peek', 'mid', 'full'];

type Props = {
  group: Group;
  initialSnap?: SnapKey;
  onAction?: (action: QuickAction) => void;
  onSnapChange?: (snap: SnapKey) => void;
  onFriendPress?: (friend: Friend) => void;
};

/**
 * Draggable bottom sheet with three snap points (peek / mid / full).
 *
 * Implementation notes:
 *   - Gesture handler v2 Pan, with `activeOffsetY` so vertical drags don't
 *     fight the inner ScrollView.
 *   - All animation lives on the UI thread via Reanimated shared values.
 *   - Snapping uses a critically-damped spring for that iOS native feel.
 *   - We expose the current snap via `onSnapChange` so the parent can,
 *     e.g., dim the map or hide the FAB when the sheet is fully expanded.
 */
export function GroupSheet({
  group,
  initialSnap = 'mid',
  onAction,
  onSnapChange,
  onFriendPress,
}: Props) {
  const insets = useSafeAreaInsets();
  const fullHeight = SNAP.full + insets.bottom;

  // translateY measured from "fully open at fullHeight"; positive values
  // push the sheet downward off-screen.
  const initialTranslate = fullHeight - SNAP[initialSnap];
  const translateY = useSharedValue(initialTranslate);
  const offset = useSharedValue(initialTranslate);

  const summary = useMemo(() => summarizeGroup(group), [group]);

  const reportSnap = (key: SnapKey) => onSnapChange?.(key);

  const pan = Gesture.Pan()
    .activeOffsetY([-8, 8])
    .onStart(() => {
      offset.value = translateY.value;
    })
    .onUpdate((e) => {
      const max = fullHeight - SNAP.peek;
      const min = fullHeight - SNAP.full;
      const next = offset.value + e.translationY;
      translateY.value = Math.min(Math.max(next, min), max);
    })
    .onEnd((e) => {
      const velocity = e.velocityY;
      const currentHeight = fullHeight - translateY.value;
      const projected = currentHeight - velocity * 0.18;

      let target: SnapKey = 'peek';
      let bestDelta = Number.POSITIVE_INFINITY;
      for (const key of SNAP_KEYS) {
        const delta = Math.abs(SNAP[key] - projected);
        if (delta < bestDelta) {
          bestDelta = delta;
          target = key;
        }
      }

      translateY.value = withSpring(
        fullHeight - SNAP[target],
        motion.spring.sheetSnap,
      );

      if (onSnapChange) {
        runOnJS(reportSnap)(target);
      }
    });

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  // Map the sheet's openness into 0..1 (peek=0, full=1) so we can drive
  // surface effects (extra darkening, etc) consistently across children.
  const progress = useDerivedValue(() =>
    interpolate(
      fullHeight - translateY.value,
      [SNAP.peek, SNAP.full],
      [0, 1],
      Extrapolation.CLAMP,
    ),
  );

  const tintStyle = useAnimatedStyle(() => ({
    opacity: 0.45 + progress.value * 0.2,
  }));

  useEffect(() => {
    onSnapChange?.(initialSnap);
  }, [initialSnap, onSnapChange]);

  return (
    <GestureDetector gesture={pan}>
      <Animated.View
        style={[
          styles.sheet,
          {
            height: fullHeight,
            paddingBottom: insets.bottom,
          },
          sheetStyle,
        ]}
      >
        <Animated.View style={[styles.surfaceTint, tintStyle]} />
        <LinearGradient
          colors={['rgba(255, 255, 255, 0.06)', 'rgba(255, 255, 255, 0)']}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 0.6 }}
          style={styles.surfaceSheen}
          pointerEvents="none"
        />

        <BottomSheetHandle />

        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerLabel}>Group Status</Text>
            <Text style={styles.headerSubtitle}>
              {summary.withGroup}/{summary.total} with group
              {summary.drifting > 0 ? ` · ${summary.drifting} drifting` : ''}
            </Text>
          </View>
          <View style={styles.headerRightPill}>
            <View style={styles.headerDot} />
            <Text style={styles.headerLive}>LIVE</Text>
          </View>
        </View>

        <ScrollView
          style={styles.list}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator
          indicatorStyle="white"
          bounces
        >
          <FriendRow
            friend={{
              id: group.user.id,
              name: group.user.name,
              initials: group.user.initials,
              hue: 'electric',
              status: group.user.status,
              batteryPercent: group.user.batteryPercent,
              lastSeenMinutesAgo: 0,
              position: { x: 0.5, y: 0.5 },
            }}
          />
          {group.members.map((member) => (
            <View key={member.id} style={styles.rowSeparator}>
              <FriendRow friend={member} onPress={onFriendPress} />
            </View>
          ))}

          {/*
           * Divider + chips are the LAST items in the scrollable content,
           * glued directly below the friend list. When the list is short
           * they appear right under the last row; when it's long the
           * user scrolls down to reach them.
           */}
          <View style={styles.divider} />
          <View style={styles.actionsWrap}>
            <QuickActions onAction={onAction} />
          </View>
        </ScrollView>
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(20, 9, 47, 0.92)',
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: palette.glassStroke,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: -8 },
  },
  surfaceTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: palette.inkViolet,
  },
  surfaceSheen: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 160,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
    paddingBottom: spacing.sm,
  },
  headerLeft: {
    flex: 1,
  },
  headerLabel: {
    ...typography.label,
    color: palette.lilac,
  },
  headerSubtitle: {
    ...typography.bodySmall,
    color: palette.dim,
    marginTop: 4,
  },
  headerRightPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(77, 230, 194, 0.12)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(77, 230, 194, 0.4)',
  },
  headerDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: palette.mint,
    shadowColor: palette.mint,
    shadowOpacity: 0.8,
    shadowRadius: 6,
  },
  headerLive: {
    ...typography.caption,
    color: palette.mint,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  list: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  listContent: {
    paddingBottom: spacing.md,
  },
  rowSeparator: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: palette.hairline,
  },
  /**
   * The thin "section break" between the friend list and the chips.
   * Visually a hairline with a touch of vertical margin so it reads as
   * a section divider rather than a row separator.
   */
  divider: {
    marginTop: spacing.md,
    marginBottom: spacing.md,
    height: StyleSheet.hairlineWidth,
    backgroundColor: palette.glassStroke,
  },
  /**
   * Chip strip — lives at the end of the scrollable content. We pull
   * it out of the ScrollView's `paddingHorizontal: spacing.lg` so the
   * three equal-width chips stretch closer to the screen edges, which
   * puts "Heading Home" right at the visual centre of the screen and
   * lets "I'm Good" / "End Night" fill the remaining left/right space.
   * The `paddingHorizontal: spacing.sm` then re-establishes a small
   * margin so the glows don't kiss the device bezel.
   */
  actionsWrap: {
    marginHorizontal: -spacing.lg,
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.sm,
  },
});

export type { SnapKey };
export { SNAP };
