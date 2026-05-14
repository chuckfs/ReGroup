import type { ViewStyle } from 'react-native';

import { palette } from './colors';

/**
 * Pre-baked shadow presets. Apply with the spread operator inside a style
 * object, then override `shadowColor` per-call when you want a coloured
 * glow (e.g. magenta marker, mint quick-action chip).
 *
 *   { ...shadow.fab, shadowColor: action.glow }
 *
 * Centralising shadows here lets us swap to a single elevation system
 * (e.g. Android-native or a future cross-platform shadow lib) in one spot.
 */
export const shadow = {
  glow: {
    shadowColor: palette.orchid,
    shadowOpacity: 0.55,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 0 },
  },
  glowMagenta: {
    shadowColor: palette.magenta,
    shadowOpacity: 0.55,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 0 },
  },
  card: {
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
  },
  fab: {
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
  },
} as const satisfies Record<string, ViewStyle>;

export type ShadowKey = keyof typeof shadow;
