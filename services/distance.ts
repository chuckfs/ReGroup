import type { GeoCoordinate } from '@/types/location';

const EARTH_RADIUS_METERS = 6_371_000;
const METERS_PER_FOOT = 0.3048;

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Great-circle distance between two GPS points (Haversine).
 * v1 proximity uses user → friend; Phase 4 may add centroid anchors.
 */
export function calculateDistanceMeters(
  from: GeoCoordinate,
  to: GeoCoordinate,
): number {
  const lat1 = toRadians(from.latitude);
  const lat2 = toRadians(to.latitude);
  const deltaLat = toRadians(to.latitude - from.latitude);
  const deltaLng = toRadians(to.longitude - from.longitude);

  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) ** 2;

  return 2 * EARTH_RADIUS_METERS * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function calculateDistanceFeet(
  from: GeoCoordinate,
  to: GeoCoordinate,
): number {
  return calculateDistanceMeters(from, to) / METERS_PER_FOOT;
}
