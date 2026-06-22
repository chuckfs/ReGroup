import { useEffect, useMemo, useState } from 'react';

import { awarenessDevSimulator } from '@/services/awarenessDevSimulator';
import { friendSimulator } from '@/services/friendSimulator';
import { mapProjection } from '@/services/mapProjection';
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

/**
 * Live friend pipeline:
 *
 *   DeviceLocation → Projection → Distance → ProximityStatus → DisplayStatus
 *
 * In __DEV__, `friendSimulator` supplies friend GPS fixes around the
 * user's real location. In production, this hook will subscribe to
 * Supabase realtime positions instead.
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

  useEffect(() => {
    if (!__DEV__ || !userLocation) return;

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
  }, [baseFriends, hasUserFix]);

  useEffect(() => {
    if (!__DEV__ || !userLocation) return;
    friendSimulator.setUserLocation(userLocation);
  }, [userLocation]);

  return useMemo(() => {
    if (!userLocation || !__DEV__ || Object.keys(friendLocations).length === 0) {
      return {
        friends: baseFriends,
        positions: Object.fromEntries(
          baseFriends.map((friend) => [friend.id, friend.position]),
        ),
        proximityDetails: [],
        friendLocations: {},
      };
    }

    void devRefreshKey;

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
      const batteryPercent = awarenessDevSimulator.getBatteryPercent(
        friend.id,
        friend.batteryPercent,
      );

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
        distanceFromGroupMiles: distanceFeet / 5280,
        lastSeenMinutesAgo: 0,
      };
    });

    return {
      friends,
      positions,
      proximityDetails,
      friendLocations,
    };
  }, [baseFriends, userLocation, friendLocations, devRefreshKey]);
}
