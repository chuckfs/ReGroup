/**
 * The app's 4-pt spacing scale. Every margin/padding/gap should come from
 * here — never raw numbers in styles. Keeps rhythm consistent and lets us
 * retune density globally.
 */
export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  hero: 48,
} as const;

export type SpacingKey = keyof typeof spacing;
