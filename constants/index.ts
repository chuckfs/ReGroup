/**
 * Design-token barrel. Most components import everything from here:
 *
 *   import { palette, spacing, radius, shadow, typography } from '@/constants';
 *
 * Keep this list flat — sub-paths (`@/constants/colors`, etc.) are still
 * available for code that only wants one slice.
 */
export { palette, gradients, markerHues, glow } from './colors';
export type { MarkerHue } from './colors';

export { spacing } from './spacing';
export type { SpacingKey } from './spacing';

export { radius } from './radius';
export type { RadiusKey } from './radius';

export { shadow } from './shadows';
export type { ShadowKey } from './shadows';

export { typography } from './typography';
export type { TypographyKey } from './typography';

export { motion } from './motion';
export type {
  MotionDurationKey,
  MotionEasingKey,
  MotionSpringKey,
} from './motion';
