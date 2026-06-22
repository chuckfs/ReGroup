import type { GeoCoordinate } from '@/types/location';

const EARTH_RADIUS_METERS = 6_371_000;
const METERS_PER_FOOT = 0.3048;

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

function toDegrees(radians: number): number {
  return (radians * 180) / Math.PI;
}

/**
 * Move a coordinate along a bearing for a given distance in meters.
 * Used by the dev friend simulator for continuous, realistic walking.
 */
export function moveByMeters(
  from: GeoCoordinate,
  bearingDegrees: number,
  meters: number,
): GeoCoordinate {
  const bearing = toRadians(bearingDegrees);
  const lat1 = toRadians(from.latitude);
  const lon1 = toRadians(from.longitude);
  const angularDistance = meters / EARTH_RADIUS_METERS;

  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(angularDistance) +
      Math.cos(lat1) * Math.sin(angularDistance) * Math.cos(bearing),
  );
  const lon2 =
    lon1 +
    Math.atan2(
      Math.sin(bearing) * Math.sin(angularDistance) * Math.cos(lat1),
      Math.cos(angularDistance) - Math.sin(lat1) * Math.sin(lat2),
    );

  return {
    latitude: toDegrees(lat2),
    longitude: toDegrees(lon2),
  };
}

/** Bearing from `from` to `to` in degrees (0 = north, 90 = east). */
export function bearingDegrees(
  from: GeoCoordinate,
  to: GeoCoordinate,
): number {
  const lat1 = toRadians(from.latitude);
  const lat2 = toRadians(to.latitude);
  const dLon = toRadians(to.longitude - from.longitude);

  const y = Math.sin(dLon) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);

  return (toDegrees(Math.atan2(y, x)) + 360) % 360;
}

/** Offset from an anchor by bearing (degrees) and distance (feet). */
export function offsetByFeet(
  anchor: GeoCoordinate,
  bearingDeg: number,
  feet: number,
): GeoCoordinate {
  return moveByMeters(anchor, bearingDeg, feet * METERS_PER_FOOT);
}
