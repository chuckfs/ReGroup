/**
 * Group feature module.
 *
 * Owns:
 *   - The active-group bottom sheet (`GroupSheet`) and its `QuickActions`
 *   - The group-creation wizard (`CreateGroupScreen` + step components)
 *   - The structured vibe catalog (`/data/vibes.ts`)
 *
 * State for the active group lives in `/store/useGroupStore`; this module
 * reads from and (in the wizard's `createGroup`) writes to that store.
 */
export { default as CreateGroupScreen } from './screens/CreateGroupScreen';
export {
  GroupSheet,
  SNAP as GROUP_SHEET_SNAP,
  type SnapKey as GroupSheetSnap,
} from './components/GroupSheet';
export { QuickActions } from './components/QuickActions';
export {
  VIBES,
  VIBES_BY_KEY,
  generateInviteCode,
} from './data/vibes';
