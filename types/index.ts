/**
 * Domain-types barrel. Most code can import the shapes it needs from
 * `@/types` directly, e.g.:
 *
 *   import type { Friend, DisplayStatus, Group } from '@/types';
 */
export type { CurrentUser, Friend, StatusTone } from './friend';

export type {
  CoordinationUpdate,
  RallyCancelledPayload,
  RallyPoint,
  RallyStartedPayload,
} from './coordination';

export type {
  CoordinationStatus,
  DeclaredStatus,
  DeclaredStatusUpdate,
  DisplayStatus,
  ProximityStatus,
} from './status';

export {
  effectiveProximity,
  isProximityStatus,
  mergeDisplayStatus,
  quickActionToDeclaredStatus,
} from './status';

export type {
  DeviceLocation,
  GeoCoordinate,
  LocationUpdate,
  MapPosition,
} from './location';

export type {
  DraftGroup,
  Group,
  GroupVibe,
  GroupVibeKey,
  QuickAction,
} from './group';

export type {
  AwarenessEvent,
  AwarenessEventType,
} from './awareness';
