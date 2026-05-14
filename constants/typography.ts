import { Platform, type TextStyle } from 'react-native';

/**
 * Typography ramp. We're using system display for now; when we wire up
 * Baloo 2 (display) and Inter (UI) via expo-font, replace these `family`
 * strings and the whole ramp inherits the change.
 */
const family = {
  display: Platform.select({
    ios: 'System',
    android: 'sans-serif-medium',
    default: 'System',
  })!,
  ui: Platform.select({
    ios: 'System',
    android: 'sans-serif',
    default: 'System',
  })!,
};

export const typography = {
  displayHero: {
    fontFamily: family.display,
    fontSize: 44,
    fontWeight: '800',
    letterSpacing: 0.2,
  } satisfies TextStyle,

  displayLarge: {
    fontFamily: family.display,
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: 0.2,
  } satisfies TextStyle,

  titleLarge: {
    fontFamily: family.display,
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: 0.1,
  } satisfies TextStyle,

  titleMedium: {
    fontFamily: family.display,
    fontSize: 17,
    fontWeight: '700',
  } satisfies TextStyle,

  body: {
    fontFamily: family.ui,
    fontSize: 15,
    fontWeight: '500',
  } satisfies TextStyle,

  bodySmall: {
    fontFamily: family.ui,
    fontSize: 13,
    fontWeight: '500',
  } satisfies TextStyle,

  label: {
    fontFamily: family.ui,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  } satisfies TextStyle,

  caption: {
    fontFamily: family.ui,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.4,
  } satisfies TextStyle,

  tagline: {
    fontFamily: family.ui,
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 1.4,
    textTransform: 'lowercase',
  } satisfies TextStyle,
};

export type TypographyKey = keyof typeof typography;
