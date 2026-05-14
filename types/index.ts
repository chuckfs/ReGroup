/**
 * Domain-types barrel. Most code can import the shapes it needs from
 * `@/types` directly, e.g.:
 *
 *   import type { Friend, FriendStatus, Group } from '@/types';
 */
export type {
  CurrentUser,
  Friend,
  FriendStatus,
  MapPosition,
  StatusTone,
} from './friend';

export type {
  DraftGroup,
  Group,
  GroupVibe,
  GroupVibeKey,
  QuickAction,
} from './group';

export type {
  Alert,
  AlertFilter,
  AlertKind,
  AlertSeverity,
} from './alert';
