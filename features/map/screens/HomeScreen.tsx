import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { palette, spacing } from '@/constants';
import { useAwarenessLoop } from '@/hooks/useAwarenessLoop';
import { useCoordinationSync } from '@/hooks/useCoordinationSync';
import { useLiveFriends } from '@/hooks/useLiveFriends';
import { useLocalBattery } from '@/hooks/useLocalBattery';
import { useRallyResponseTimeout } from '@/hooks/useRallyResponseTimeout';
import { useUserMapPosition } from '@/hooks/useUserMapPosition';
import { resolveCoordinationStatus } from '@/lib/coordinationStatus';
import { respondToRally, startRally } from '@/services/coordinationService';
import { broadcastDeclaredStatus } from '@/services/sessionDeclaredService';
import { useCoordinationStore } from '@/store/useCoordinationStore';
import { useFriendStore } from '@/store/useFriendStore';
import { useGroupStore } from '@/store/useGroupStore';
import { useUIStore } from '@/store/useUIStore';
import type { Friend, QuickAction } from '@/types';
import {
  isProximityStatus,
  mergeDisplayStatus,
  quickActionToDeclaredStatus,
  type CoordinationStatus,
  type DeclaredStatus,
} from '@/types/status';

import { GroupSheet, SNAP, type SnapKey } from '@/features/group/components/GroupSheet';
import { AwarenessBanner, AwarenessDevPanel } from '@/features/awareness';
import { RallyBanner, RallyResponseSheet } from '@/features/coordination';

import { LocationDebugCard } from '../components/LocationDebugCard';
import { ProximityDebugPanel } from '../components/ProximityDebugPanel';
import { LocateFab } from '../components/LocateFab';
import { MapCanvas } from '../components/MapCanvas';
import { TopBar } from '../components/TopBar';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

/**
 * The single core screen of ReGroup — the live group map.
 *
 * Layer stack (back → front):
 *   - MapCanvas        (full screen, atmospheric, glowing)
 *   - TopBar           (floating, safe-area aware)
 *   - AwarenessBanner  (soft ambient status transitions)
 *   - LocateFab        (parks just above the sheet's current snap)
 *   - GroupSheet       (draggable; QuickActions at the bottom band)
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
  const hasActiveSession = useGroupStore((s) => s.hasActiveSession);
  const endSession = useGroupStore((s) => s.endSession);
  const selectFriend = useFriendStore((s) => s.select);
  const setSheetSnap = useUIStore((s) => s.setSheetSnap);

  const fabOpacity = useSharedValue(1);
  const [devRefreshKey, setDevRefreshKey] = useState(0);
  const [selfDeclaredStatus, setSelfDeclaredStatus] = useState<
    DeclaredStatus | undefined
  >();
  const [rallySheetVisible, setRallySheetVisible] = useState(false);
  const hadActiveSession = useRef(hasActiveSession);

  useEffect(() => {
    if (hadActiveSession.current && !hasActiveSession) {
      setSelfDeclaredStatus(undefined);
    }
    hadActiveSession.current = hasActiveSession;
  }, [hasActiveSession]);

  const mapWidth = SCREEN_WIDTH;
  const mapHeight = SCREEN_HEIGHT;

  const { location, mapPosition, error } = useUserMapPosition();
  const localBatteryPercent = useLocalBattery(hasActiveSession);
  const {
    friends: liveFriends,
    positions,
    proximityDetails,
    friendLocations,
  } = useLiveFriends(group.members, location, devRefreshKey);

  useAwarenessLoop(liveFriends, friendLocations, hasActiveSession);
  useCoordinationSync(hasActiveSession);
  useRallyResponseTimeout(hasActiveSession);

  const activeRally = useCoordinationStore((s) => s.activeRally);
  const responses = useCoordinationStore((s) => s.responses);
  const responseDeadline = useCoordinationStore((s) => s.responseDeadline);

  const rosterUserIds = group.members.map((member) => member.id);
  const selfCoordinationStatus = resolveCoordinationStatus(group.user.id, {
    activeRally,
    responses,
    responseDeadline,
    currentUserId: group.user.id,
    rosterUserIds,
  });
  const userProximity = isProximityStatus(group.user.status)
    ? group.user.status
    : 'with_group';
  const selfDeclared = selfDeclaredStatus ?? group.user.declaredStatus;

  const liveGroup = {
    ...group,
    members: liveFriends,
    user: {
      ...group.user,
      batteryPercent: localBatteryPercent ?? group.user.batteryPercent,
      declaredStatus: selfDeclared,
      coordinationStatus: selfCoordinationStatus,
      status: mergeDisplayStatus(
        userProximity,
        selfDeclared,
        selfCoordinationStatus,
      ),
    },
  };

  const handleDevRefresh = useCallback(() => {
    setDevRefreshKey((value) => value + 1);
  }, []);

  const handleRegroup = useCallback(async () => {
    if (!hasActiveSession || !location) return;

    try {
      await startRally(location, group.user.name, 'Meet me here');
    } catch (err) {
      console.error('[ReGroup] start rally failed:', err);
    }
  }, [group.user.name, hasActiveSession, location]);

  useEffect(() => {
    if (__DEV__ && activeRally) {
      console.log(
        '[ReGroup] active rally:',
        activeRally.initiatorName,
        activeRally.rallyId,
      );
    }
  }, [activeRally]);

  const handleRallyRespond = useCallback(
    async (status: Exclude<CoordinationStatus, 'no_response'>) => {
      if (!activeRally) return;

      try {
        await respondToRally(activeRally.rallyId, status);
        setRallySheetVisible(false);
      } catch (err) {
        console.error('[ReGroup] rally response failed:', err);
      }
    },
    [activeRally],
  );

  const handleNavigateToRally = useCallback(() => {
    router.push('/regroup/nav' as never);
  }, []);

  const handleAction = useCallback(
    async (action: QuickAction) => {
      if (action === 'end_night') {
        if (!hasActiveSession) {
          console.log('[ReGroup] end night — no active server session');
          return;
        }

        try {
          await endSession();
          setSelfDeclaredStatus(undefined);
        } catch (err) {
          console.error('[ReGroup] end session failed:', err);
        }
        return;
      }

      const declaredStatus = quickActionToDeclaredStatus(action);
      if (!declaredStatus) return;

      if (!hasActiveSession) {
        setSelfDeclaredStatus(declaredStatus);
        return;
      }

      try {
        await broadcastDeclaredStatus(declaredStatus);
        setSelfDeclaredStatus(declaredStatus);
      } catch (err) {
        console.error('[ReGroup] declared status broadcast failed:', err);
      }
    },
    [endSession, hasActiveSession],
  );

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
        friends={liveFriends}
        positions={positions}
        userPosition={mapPosition}
        onFriendPress={handleFriendPress}
      />

      <TopBar
        groupName={group.name}
        rosterLabel={
          group.vibe || `${group.members.length + 1} people`
        }
        onMenu={() => console.log('[ReGroup] menu')}
        onChat={() => console.log('[ReGroup] chat')}
        onSwitchGroup={() => router.push('/group/new' as never)}
      />

      <AwarenessBanner />

      {activeRally ? (
        <RallyBanner
          rally={activeRally}
          userLocation={location}
          currentUserId={group.user.id}
          onRespond={() => setRallySheetVisible(true)}
          onNavigate={handleNavigateToRally}
        />
      ) : null}

      {activeRally ? (
        <RallyResponseSheet
          visible={rallySheetVisible}
          initiatorName={activeRally.initiatorName}
          onClose={() => setRallySheetVisible(false)}
          onRespond={handleRallyRespond}
        />
      ) : null}

      {__DEV__ ? (
        <>
          <LocationDebugCard location={location} error={error} />
          <ProximityDebugPanel details={proximityDetails} />
          <AwarenessDevPanel onRefresh={handleDevRefresh} />
        </>
      ) : null}

      <Animated.View
        pointerEvents={snap === 'full' ? 'none' : 'box-none'}
        style={[styles.fabSlot, { bottom: fabBottom }, fabStyle]}
      >
        <LocateFab
          onPress={
            hasActiveSession
              ? handleRegroup
              : () => console.log('[ReGroup] locate me')
          }
        />
      </Animated.View>

      <GroupSheet
        group={liveGroup}
        initialSnap="mid"
        onAction={handleAction}
        onSnapChange={handleSnap}
        onFriendPress={handleFriendPress}
        onJoinWithCode={
          hasActiveSession ? undefined : () => router.push('/join' as never)
        }
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
