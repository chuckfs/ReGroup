/**
 * ReGroup palette. Pulled from the brand sheet:
 * deep navy purples for ambient/spatial surfaces, electric violet + magenta
 * for energy, soft lilacs for text/accents, and a small set of "status"
 * hues used by markers + the friend list.
 *
 * All colour usage in the app should pull from this module — never inline
 * hex strings in component code. New shades belong here so the visual
 * language stays consistent and centrally tunable.
 */
export const palette = {
  // Ambient surface gradient
  voidPurple: '#0E0521',
  midnight: '#160933',
  inkViolet: '#1E1043',
  abyss: '#2E1A47',

  // Brand violets
  bruise: '#46307A',
  electric: '#6E4DFF',
  orchid: '#A565F2',
  lilac: '#BDA7FF',
  blush: '#F2C8FF',

  // Energy accents
  magenta: '#FF5DBB',
  rose: '#FF8FD0',
  amber: '#FFD56B',
  flame: '#FF8A5B',

  // Status hues (semantic)
  mint: '#4DE6C2',
  cyan: '#5EE7F2',
  warning: '#FFB45F',
  danger: '#FF6B8A',

  // Neutrals
  moonlight: '#F4ECFF',
  whisper: 'rgba(244, 236, 255, 0.78)',
  dim: 'rgba(244, 236, 255, 0.55)',
  faint: 'rgba(244, 236, 255, 0.35)',
  hairline: 'rgba(244, 236, 255, 0.12)',
  glassStroke: 'rgba(255, 255, 255, 0.14)',
  glassFill: 'rgba(28, 16, 64, 0.55)',
  glassFillStrong: 'rgba(28, 16, 64, 0.78)',
  scrim: 'rgba(0, 0, 0, 0.35)',
} as const;

export const gradients = {
  // Full-screen ambient backdrop
  backdrop: [palette.voidPurple, palette.midnight, palette.inkViolet] as const,

  // Map atmosphere — sits inside the map canvas
  mapSky: ['#160933', '#1E1043', '#0E0521'] as const,
  mapHorizon: ['rgba(110, 77, 255, 0.0)', 'rgba(165, 101, 242, 0.18)'] as const,
  cityGlow: ['rgba(255, 93, 187, 0.28)', 'rgba(110, 77, 255, 0)'] as const,

  // Glow rings + halos
  halo: ['rgba(165, 101, 242, 0.55)', 'rgba(165, 101, 242, 0)'] as const,
  haloMagenta: ['rgba(255, 93, 187, 0.55)', 'rgba(255, 93, 187, 0)'] as const,

  // Buttons
  primaryBtn: [palette.electric, '#8A6BFF'] as const,
  mintBtn: ['#4DE6C2', '#36C8A8'] as const,
  endNightBtn: ['#FF5DBB', '#FF8FD0'] as const,

  // Brand wordmark
  brand: [palette.blush, palette.orchid, palette.electric] as const,
} as const;

/**
 * Friend marker hues. Stable per-friend assignment is done at the data
 * layer so colours don't shift between renders. New hue keys must also be
 * added to the marker-rendering layer (`FloatingMapPin` reads from this).
 */
export const markerHues = {
  magenta: palette.magenta,
  flame: palette.flame,
  electric: palette.electric,
  lilac: palette.lilac,
  mint: palette.mint,
  cyan: palette.cyan,
  amber: palette.amber,
  rose: palette.rose,
} as const;

export type MarkerHue = keyof typeof markerHues;

/**
 * Soft glow values used by markers, FABs, and selected cards. Centralised
 * so we can globally retune the glow intensity (e.g. for low-power mode
 * later) without hunting through component styles.
 */
export const glow = {
  soft: 0.35,
  standard: 0.55,
  strong: 0.7,
  intense: 0.9,
} as const;
