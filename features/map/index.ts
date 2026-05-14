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
 * Scaling guidance:
 *   - Real maps: replace `MapPaths` + `MapAtmosphere` with an actual
 *     map renderer (MapLibre/Mapbox). Keep `MapCanvas`'s `(friends,
 *     positions)` API stable.
 *   - Per-friend live positions: already plumbed via the optional
 *     `positions` prop on `MapCanvas`. Pass `useMockLocation(members)`
 *     (or the realtime equivalent) from `HomeScreen` once we're ready
 *     for moving markers.
 *   - Clustering: introduce a `MapClusterLayer` between `MapCanvas`
 *     and the per-friend `FloatingMapPin` so larger groups stay
 *     legible without changing pin code.
 */
export { default as HomeScreen } from './screens/HomeScreen';
export { MapCanvas } from './components/MapCanvas';
export { MapAtmosphere } from './components/MapAtmosphere';
export { MapPaths } from './components/MapPaths';
export { TopBar } from './components/TopBar';
export { LocateFab } from './components/LocateFab';
export { GroupSelectorPill } from './components/GroupSelectorPill';
