import { useEffect, useMemo, useState } from 'react';
import * as Location from 'expo-location';

import { calculateDistanceFeet } from '@/services/distance';
import { bearingDegrees } from '@/services/geo';
import type { DeviceLocation, GeoCoordinate } from '@/types/location';

export const ARRIVAL_THRESHOLD_FEET = 80;

export type RegroupNavigationState = {
  bearingDeg: number | null;
  arrowRotationDeg: number;
  distanceFeet: number | null;
  distanceLabel: string;
  isArrived: boolean;
  hasFix: boolean;
};

export function formatNavigationDistance(feet: number): string {
  if (feet < 1000) return `${Math.round(feet)} ft`;
  return `${(feet / 5280).toFixed(1)} mi`;
}

/**
 * Bearing + distance from the user to a rally point. When device heading
 * is available, `arrowRotationDeg` is relative to where the phone is facing.
 */
export function useRegroupNavigation(
  userLocation: DeviceLocation | null,
  rallyLocation: GeoCoordinate | null,
): RegroupNavigationState {
  const [deviceHeading, setDeviceHeading] = useState<number | null>(null);

  useEffect(() => {
    let subscription: Location.LocationSubscription | undefined;

    void Location.watchHeadingAsync((heading) => {
      const value =
        heading.trueHeading >= 0 ? heading.trueHeading : heading.magHeading;
      if (Number.isFinite(value)) {
        setDeviceHeading(value);
      }
    }).then((sub) => {
      subscription = sub;
    });

    return () => {
      subscription?.remove();
    };
  }, []);

  return useMemo(() => {
    if (!userLocation || !rallyLocation) {
      return {
        bearingDeg: null,
        arrowRotationDeg: 0,
        distanceFeet: null,
        distanceLabel: '—',
        isArrived: false,
        hasFix: false,
      };
    }

    const distanceFeet = calculateDistanceFeet(userLocation, rallyLocation);
    const bearingDeg = bearingDegrees(userLocation, rallyLocation);
    const arrowRotationDeg =
      deviceHeading != null
        ? (bearingDeg - deviceHeading + 360) % 360
        : bearingDeg;

    return {
      bearingDeg,
      arrowRotationDeg,
      distanceFeet,
      distanceLabel: formatNavigationDistance(distanceFeet),
      isArrived: distanceFeet < ARRIVAL_THRESHOLD_FEET,
      hasFix: true,
    };
  }, [deviceHeading, rallyLocation, userLocation]);
}
