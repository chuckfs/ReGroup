/**
 * Map feature module.
 *
 * Owns:
 *   - The live-group map screen (`HomeScreen`)
 *   - Feature-level compositions: `MapCanvas`, atmosphere, paths
 *   - Map-adjacent floating UI: `TopBar`, `GroupSelectorPill`, `LocateFab`
 *
 * Reusable map primitives (pins, rings, the user marker) live in
 * `/components/map` so other features could render them on their own
 * surfaces (mini-maps, etc.) without depending on this module.
 *
 * ## HomeScreen data flow
 *
 *   useUserMapPosition()  → user GPS + mapPosition
 *   useLiveFriends()      → friend positions + statuses
 *   useAwarenessLoop()    → proximity transition events
 *
 * ## MapCanvas API (stable — do not break without updating docs)
 *
 *   MapCanvas({
 *     width,
 *     height,
 *     friends,
 *     positions?,      // Record<friendId, MapPosition> from useLiveFriends
 *     userPosition?,    // from useUserMapPosition — camera anchor
 *     onFriendPress?,
 *   })
 *
 * See `docs/backend-contract.md` § MapCanvas contract.
 *
 * ## Scaling (later phases)
 *
 *   - Real maps: replace `MapPaths` + `MapAtmosphere` with MapLibre/Mapbox
 *   - Production friends: Supabase realtime replaces `friendSimulator`
 *   - Clustering: `MapClusterLayer` in Phase 4
 */
export { default as HomeScreen } from './screens/HomeScreen';
export { MapCanvas } from './components/MapCanvas';
export { MapAtmosphere } from './components/MapAtmosphere';
export { MapPaths } from './components/MapPaths';
export { TopBar } from './components/TopBar';
export { LocateFab } from './components/LocateFab';
export { GroupSelectorPill } from './components/GroupSelectorPill';
