/**
 * Location feature module.
 *
 * Foreground device location flows through `locationService` and
 * `useLocation`. GPS fixes are projected onto the stylized map via
 * `mapProjection` and `useUserMapPosition`. Friend proximity is derived
 * in `proximityEngine` and surfaced through `useLiveFriends`.
 *
 * Privacy: only the most recent point is held in memory — no GPS history.
 */
export { locationService } from '@/services/locationService';
export { mapProjection } from '@/services/mapProjection';
export {
  calculateDistanceFeet,
  calculateDistanceMeters,
} from '@/services/distance';
export {
  computeAllFriendProximity,
  computeFriendProximity,
  computeProximityStatus,
  PROXIMITY_THRESHOLDS_FEET,
} from '@/services/proximityEngine';
export { friendSimulator } from '@/services/friendSimulator';
export { useLocation } from '@/hooks/useLocation';
export { useUserMapPosition } from '@/hooks/useUserMapPosition';
export { useLiveFriends } from '@/hooks/useLiveFriends';
export type { FriendProximityDetail } from '@/hooks/useLiveFriends';
export type {
  DeviceLocation,
  GeoCoordinate,
  MapPosition,
} from '@/types/location';
