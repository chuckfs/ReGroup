/**
 * Location feature module.
 *
 * Pipeline:
 *   locationService → useLocation → useUserMapPosition (user GPS + projection)
 *   useLiveFriends → proximityEngine → mergeDisplayStatus (friends)
 *
 * Specs: `docs/backend-contract.md`, `docs/proximity-model.md`
 *
 * Privacy: only the most recent point is held in memory — no GPS history.
 *
 * Dev only: `friendSimulator` supplies fake friend GPS when `__DEV__`.
 */
export { locationService } from '@/services/locationService';
export { mapProjection, relativeToUser } from '@/services/mapProjection';
export {
  calculateDistanceFeet,
  calculateDistanceMeters,
} from '@/services/distance';
export {
  computeAllFriendProximity,
  computeFriendProximity,
  computeProximityStatus,
  PROXIMITY_ANCHOR,
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
