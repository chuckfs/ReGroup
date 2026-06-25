import { useEffect, useMemo, useState } from 'react';

import { useGroupStore } from '@/store/useGroupStore';
import { useCoordinationStore } from '@/store/useCoordinationStore';
import { awarenessDevSimulator } from '@/services/awarenessDevSimulator';
import { friendSimulator } from '@/services/friendSimulator';
import { mapProjection } from '@/services/mapProjection';
import { resolveCoordinationStatus } from '@/lib/coordinationStatus';
import { onFriendDeclared } from '@/services/sessionDeclaredService';
import { onFriendLocation } from '@/services/sessionLocationService';
import { computeFriendProximity } from '@/services/proximityEngine';
import type { DeviceLocation, MapPosition } from '@/types/location';
import type { Friend } from '@/types';
import {
  isProximityStatus,
  mergeDisplayStatus,
  type CoordinationStatus,
  type DeclaredStatus,
  type DisplayStatus,
  type ProximityStatus,
} from '@/types/status';

export type FriendProximityDetail = {
  id: string;
  name: string;
  distanceFeet: number;
  status: DisplayStatus;
  proximityStatus: ProximityStatus;
};

type UseLiveFriendsResult = {
  friends: Friend[];
  positions: Record<string, MapPosition>;
  proximityDetails: FriendProximityDetail[];
  friendLocations: Record<string, DeviceLocation>;
};

type FriendLiveMeta = {
  batteryPercent?: number;
  declaredStatus?: DeclaredStatus;
};

function resolveProximityStatus(friend: Friend): ProximityStatus {
  if (friend.proximityStatus) return friend.proximityStatus;
  if (isProximityStatus(friend.status)) return friend.status;
  return 'nearby';
}

function applyFriendLiveMeta(
  friend: Friend,
  meta: FriendLiveMeta | undefined,
  overrides: {
    proximityStatus: ProximityStatus;
    coordinationStatus?: CoordinationStatus;
    position?: MapPosition;
    batteryPercent?: number;
    distanceFromUserMiles?: number;
    lastSeenMinutesAgo?: number;
  },
): Friend {
  const declaredStatus = meta?.declaredStatus ?? friend.declaredStatus;
  const coordinationStatus =
    overrides.coordinationStatus ?? friend.coordinationStatus;
  const status = mergeDisplayStatus(
    overrides.proximityStatus,
    declaredStatus,
    coordinationStatus,
  );

  return {
    ...friend,
    declaredStatus,
    coordinationStatus,
    status,
    proximityStatus: overrides.proximityStatus,
    position: overrides.position ?? friend.position,
    batteryPercent: overrides.batteryPercent ?? friend.batteryPercent,
    distanceFromUserMiles: overrides.distanceFromUserMiles ?? friend.distanceFromUserMiles,
    lastSeenMinutesAgo: overrides.lastSeenMinutesAgo ?? friend.lastSeenMinutesAgo,
  };
}

function staticFriendsResult(baseFriends: Friend[]): UseLiveFriendsResult {
  return {
    friends: baseFriends,
    positions: Object.fromEntries(
      baseFriends.map((friend) => [friend.id, friend.position]),
    ),
    proximityDetails: [],
    friendLocations: {},
  };
}

function minutesSinceFix(location: DeviceLocation): number {
  const ts = location.timestamp;
  if (ts == null) return 0;
  return Math.max(0, Math.floor((Date.now() - ts) / 60_000));
}

function buildLiveFriendsFromLocations(
  baseFriends: Friend[],
  userLocation: DeviceLocation,
  friendLocations: Record<string, DeviceLocation>,
  friendLiveMeta: Record<string, FriendLiveMeta>,
  simulateBattery: boolean,
  coordinationContext: {
    activeRally: ReturnType<typeof useCoordinationStore.getState>['activeRally'];
    responses: ReturnType<typeof useCoordinationStore.getState>['responses'];
    responseDeadline: ReturnType<typeof useCoordinationStore.getState>['responseDeadline'];
    currentUserId: string;
    rosterUserIds: string[];
  },
): UseLiveFriendsResult {
  mapProjection.updateSpanForLocations(userLocation, friendLocations);

  const proximityDetails: FriendProximityDetail[] = [];
  const positions: Record<string, MapPosition> = {};

  const friends = baseFriends.map((friend) => {
    const meta = friendLiveMeta[friend.id];
    const deviceLocation = friendLocations[friend.id];
    const coordinationStatus = resolveCoordinationStatus(friend.id, {
      activeRally: coordinationContext.activeRally,
      responses: coordinationContext.responses,
      responseDeadline: coordinationContext.responseDeadline,
      currentUserId: coordinationContext.currentUserId,
      rosterUserIds: coordinationContext.rosterUserIds,
    });

    if (!deviceLocation) {
      if (
        !meta?.declaredStatus &&
        meta?.batteryPercent == null &&
        !coordinationStatus
      ) {
        return friend;
      }

      return applyFriendLiveMeta(friend, meta, {
        proximityStatus: resolveProximityStatus(friend),
        coordinationStatus,
        batteryPercent: simulateBattery
          ? awarenessDevSimulator.getBatteryPercent(friend.id, friend.batteryPercent)
          : meta?.batteryPercent ?? friend.batteryPercent,
      });
    }

    const projected =
      mapProjection.projectFromOrigin(deviceLocation) ?? friend.position;
    const { distanceFeet, status: proximityStatus } = computeFriendProximity(
      userLocation,
      deviceLocation,
    );
    const batteryPercent = simulateBattery
      ? awarenessDevSimulator.getBatteryPercent(friend.id, friend.batteryPercent)
      : meta?.batteryPercent ?? friend.batteryPercent;

    const merged = applyFriendLiveMeta(friend, meta, {
      proximityStatus,
      coordinationStatus,
      position: projected,
      batteryPercent,
      distanceFromUserMiles: distanceFeet / 5280,
      lastSeenMinutesAgo: minutesSinceFix(deviceLocation),
    });

    positions[friend.id] = projected;
    proximityDetails.push({
      id: friend.id,
      name: friend.name,
      distanceFeet,
      status: merged.status,
      proximityStatus,
    });

    return merged;
  });

  return {
    friends,
    positions,
    proximityDetails,
    friendLocations,
  };
}

/**
 * Live friend pipeline (v1 proximity anchor: **user**):
 *
 *   DeviceLocation → Projection → Distance (user→friend) → ProximityStatus → DisplayStatus
 *
 * See `docs/proximity-model.md`.
 *
 * - Active session: Supabase `session:{id}:locations` via `onFriendLocation`
 * - Solo dev idle: `friendSimulator` around the user's real GPS
 */
export function useLiveFriends(
  baseFriends: Friend[],
  userLocation: DeviceLocation | null,
  devRefreshKey = 0,
): UseLiveFriendsResult {
  const [friendLocations, setFriendLocations] = useState<
    Record<string, DeviceLocation>
  >({});
  const [friendLiveMeta, setFriendLiveMeta] = useState<
    Record<string, FriendLiveMeta>
  >({});
  const hasUserFix = userLocation != null;
  const hasActiveSession = useGroupStore((s) => s.hasActiveSession);
  const currentUserId = useGroupStore((s) => s.active.user.id);
  const activeRally = useCoordinationStore((s) => s.activeRally);
  const responses = useCoordinationStore((s) => s.responses);
  const responseDeadline = useCoordinationStore((s) => s.responseDeadline);

  const coordinationContext = useMemo(
    () => ({
      activeRally,
      responses,
      responseDeadline,
      currentUserId,
      rosterUserIds: baseFriends.map((friend) => friend.id),
    }),
    [activeRally, baseFriends, currentUserId, responseDeadline, responses],
  );

  useEffect(() => {
    if (!hasActiveSession) return;

    onFriendLocation((update) => {
      setFriendLocations((prev) => ({
        ...prev,
        [update.userId]: update.location,
      }));

      if (update.batteryPercent != null) {
        setFriendLiveMeta((prev) => ({
          ...prev,
          [update.userId]: {
            ...prev[update.userId],
            batteryPercent: update.batteryPercent,
          },
        }));
      }
    });

    onFriendDeclared((update) => {
      setFriendLiveMeta((prev) => ({
        ...prev,
        [update.userId]: {
          ...prev[update.userId],
          declaredStatus: update.declaredStatus,
        },
      }));
    });

    return () => {
      onFriendLocation(null);
      onFriendDeclared(null);
      setFriendLocations({});
      setFriendLiveMeta({});
    };
  }, [hasActiveSession]);

  useEffect(() => {
    if (!hasActiveSession) return;

    const memberIds = new Set(baseFriends.map((friend) => friend.id));
    setFriendLocations((prev) => {
      const next: Record<string, DeviceLocation> = {};
      for (const [id, location] of Object.entries(prev)) {
        if (memberIds.has(id)) next[id] = location;
      }
      return next;
    });
    setFriendLiveMeta((prev) => {
      const next: Record<string, FriendLiveMeta> = {};
      for (const [id, meta] of Object.entries(prev)) {
        if (memberIds.has(id)) next[id] = meta;
      }
      return next;
    });
  }, [baseFriends, hasActiveSession]);

  useEffect(() => {
    if (!__DEV__ || !userLocation || hasActiveSession) return;

    friendSimulator.seed(baseFriends, userLocation);
    friendSimulator.setUserLocation(userLocation);
    friendSimulator.start();
    setFriendLocations(friendSimulator.getSnapshot());

    const unsubscribe = friendSimulator.subscribe((update) => {
      setFriendLocations((prev) => ({
        ...prev,
        [update.friendId]: update.location,
      }));
    });

    return () => {
      unsubscribe();
      friendSimulator.stop();
    };
  }, [baseFriends, hasActiveSession, hasUserFix]);

  useEffect(() => {
    if (!__DEV__ || !userLocation || hasActiveSession) return;
    friendSimulator.setUserLocation(userLocation);
  }, [userLocation, hasActiveSession]);

  return useMemo(() => {
    if (!userLocation) {
      return staticFriendsResult(baseFriends);
    }

    if (hasActiveSession) {
      return buildLiveFriendsFromLocations(
        baseFriends,
        userLocation,
        friendLocations,
        friendLiveMeta,
        false,
        coordinationContext,
      );
    }

    if (!__DEV__ || Object.keys(friendLocations).length === 0) {
      return staticFriendsResult(baseFriends);
    }

    void devRefreshKey;

    return buildLiveFriendsFromLocations(
      baseFriends,
      userLocation,
      friendLocations,
      friendLiveMeta,
      true,
      coordinationContext,
    );
  }, [
    baseFriends,
    userLocation,
    friendLocations,
    friendLiveMeta,
    devRefreshKey,
    hasActiveSession,
    coordinationContext,
  ]);
}
