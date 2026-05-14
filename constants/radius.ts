/**
 * Border-radius scale. The whole product leans on rounded surfaces — pills
 * for chips/FABs, large radius for cards/sheets. Pulling from this scale
 * (vs literal pixel values) keeps corners consistent across the surface.
 */
export const radius = {
  xs: 8,
  sm: 12,
  md: 18,
  lg: 24,
  xl: 30,
  pill: 999,
} as const;

export type RadiusKey = keyof typeof radius;
