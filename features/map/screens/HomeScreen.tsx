import React, { useCallback } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { palette, spacing } from '@/constants';
import { useMockLocation } from '@/hooks/useMockLocation';
import { useFriendStore } from '@/store/useFriendStore';
import { useGroupStore } from '@/store/useGroupStore';
import { useUIStore } from '@/store/useUIStore';
import type { Friend, QuickAction } from '@/types';

import { GroupSheet, SNAP, type SnapKey } from '@/features/group/components/GroupSheet';

import { LocateFab } from '../components/LocateFab';
import { MapCanvas } from '../components/MapCanvas';
import { TopBar } from '../components/TopBar';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

/**
 * The single core screen of ReGroup — the live group map.
 *
 * Layer stack (back → front):
 *   - MapCanvas   (full screen, atmospheric, glowing)
 *   - TopBar      (floating, safe-area aware)
 *   - LocateFab   (parks just above the sheet's current snap)
 *   - GroupSheet  (draggable; QuickActions live inside at the bottom band)
 *
 * The FAB fades out at the `full` snap — at that point there's nothing
 * left of the map to centre on.
 *
 * Domain state (active group, selected friend) comes from Zustand stores
 * so the same data feeds the sheet, the markers, and the modal routes
 * without prop-drilling.
 */
export default function HomeScreen() {
  const group = useGroupStore((s) => s.active);
  const selectFriend = useFriendStore((s) => s.select);
  const setSheetSnap = useUIStore((s) => s.setSheetSnap);

  const fabOpacity = useSharedValue(1);

  const mapWidth = SCREEN_WIDTH;
  const mapHeight = SCREEN_HEIGHT;

  // Live position overrides for the friends pins. Today this is a quiet
  // pass-through (no synthesised drift) — pins only move when their
  // entry actually changes. Real GPS / realtime updates will flow
  // through this same map when wired.
  const positions = useMockLocation(group.members);

  const handleAction = useCallback((action: QuickAction) => {
    // TODO(backend): post the user's quick-action status to the realtime
    // channel so other group members see "Heading Home" / "End Night"
    // immediately. For now we just log.
    console.log('[ReGroup] quick action:', action);
  }, []);

  const handleFriendPress = useCallback(
    (friend: Friend) => {
      selectFriend(friend.id);
      router.push(`/friend/${friend.id}` as never);
    },
    [selectFriend],
  );

  const handleSnap = useCallback(
    (nextSnap: SnapKey) => {
      setSheetSnap(nextSnap);
      fabOpacity.value = withTiming(nextSnap === 'full' ? 0 : 1, {
        duration: 220,
      });
    },
    [fabOpacity, setSheetSnap],
  );

  const snap = useUIStore((s) => s.sheetSnap);
  const fabBottom = SNAP[snap] + spacing.md;
  const fabStyle = useAnimatedStyle(() => ({
    opacity: fabOpacity.value,
  }));

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      <MapCanvas
        width={mapWidth}
        height={mapHeight}
        friends={group.members}
        positions={positions}
        onFriendPress={handleFriendPress}
      />

      <TopBar
        groupName={group.name}
        memberCount={group.members.length + 1}
        onMenu={() => console.log('[ReGroup] menu')}
        onChat={() => console.log('[ReGroup] chat')}
        onSwitchGroup={() => router.push('/group/new' as never)}
      />

      <Animated.View
        pointerEvents={snap === 'full' ? 'none' : 'box-none'}
        style={[styles.fabSlot, { bottom: fabBottom }, fabStyle]}
      >
        <LocateFab onPress={() => console.log('[ReGroup] locate me')} />
      </Animated.View>

      <GroupSheet
        group={group}
        initialSnap="mid"
        onAction={handleAction}
        onSnapChange={handleSnap}
        onFriendPress={handleFriendPress}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: palette.voidPurple,
  },
  fabSlot: {
    position: 'absolute',
    right: spacing.lg,
    zIndex: 5,
  },
});
