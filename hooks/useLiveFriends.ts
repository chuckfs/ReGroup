import { useEffect, useMemo, useState } from 'react';

import { useGroupStore } from '@/store/useGroupStore';
import { awarenessDevSimulator } from '@/services/awarenessDevSimulator';
import { friendSimulator } from '@/services/friendSimulator';
import { mapProjection } from '@/services/mapProjection';
import { onFriendLocation } from '@/services/sessionLocationService';
import { computeFriendProximity } from '@/services/proximityEngine';
import type { DeviceLocation, MapPosition } from '@/types/location';
import type { Friend } from '@/types';
import {
  mergeDisplayStatus,
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
  simulateBattery: boolean,
): UseLiveFriendsResult {
  const proximityDetails: FriendProximityDetail[] = [];
  const positions: Record<string, MapPosition> = {};

  const friends = baseFriends.map((friend) => {
    const deviceLocation = friendLocations[friend.id];
    if (!deviceLocation) return friend;

    const projected =
      mapProjection.projectFromOrigin(deviceLocation) ?? friend.position;
    const { distanceFeet, status: proximityStatus } = computeFriendProximity(
      userLocation,
      deviceLocation,
    );
    const status = mergeDisplayStatus(
      proximityStatus,
      friend.declaredStatus,
      friend.coordinationStatus,
    );
    const batteryPercent = simulateBattery
      ? awarenessDevSimulator.getBatteryPercent(friend.id, friend.batteryPercent)
      : friend.batteryPercent;

    positions[friend.id] = projected;
    proximityDetails.push({
      id: friend.id,
      name: friend.name,
      distanceFeet,
      status,
      proximityStatus,
    });

    return {
      ...friend,
      status,
      proximityStatus,
      position: projected,
      batteryPercent,
      distanceFromUserMiles: distanceFeet / 5280,
      lastSeenMinutesAgo: minutesSinceFix(deviceLocation),
    };
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
  const hasUserFix = userLocation != null;
  const hasActiveSession = useGroupStore((s) => s.hasActiveSession);

  useEffect(() => {
    if (!hasActiveSession) return;

    onFriendLocation((update) => {
      setFriendLocations((prev) => ({
        ...prev,
        [update.userId]: update.location,
      }));
    });

    return () => {
      onFriendLocation(null);
      setFriendLocations({});
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
        false,
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
      true,
    );
  }, [baseFriends, userLocation, friendLocations, devRefreshKey, hasActiveSession]);
}
