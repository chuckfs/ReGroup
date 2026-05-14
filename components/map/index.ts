/**
 * Reusable map primitives — anything that renders ON the map (pins,
 * rings, the user marker) without knowing about the canvas itself.
 *
 * The map composition layer (canvas, atmosphere, paths) lives next door
 * in `/features/map/components` so canvas-specific assumptions don't
 * leak into reusable building blocks.
 */
export { FloatingMapPin, FLOATING_MAP_PIN_DOT_SIZE } from './FloatingMapPin';
export { UserMarker } from './UserMarker';
export { MapRadarRings } from './MapRadarRings';
