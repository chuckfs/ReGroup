import { Easing } from 'react-native-reanimated';

/**
 * Centralised motion language. Every animation in the app should pull its
 * duration + easing from here so the choreography stays consistent.
 *
 * Naming convention:
 *   - `*Fast`     ≈ 120-180ms — micro-interactions (press, focus glow)
 *   - `*Standard` ≈ 220-280ms — UI state transitions (step changes)
 *   - `*Slow`     ≈ 600-900ms — entrance flourishes
 *   - `*Ambient`  ≈ 2-22s     — atmospheric loops (orbit, pulse, drift)
 */
export const motion = {
  duration: {
    pressFast: 120,
    fadeFast: 180,
    standard: 220,
    standardLong: 280,
    enter: 360,
    enterLong: 520,
    sheen: 800,
    pulse: 2600,
    radarPing: 4200,
    breathe: 7200,
    drift: 16000,
    orbit: 22000,
  },
  easing: {
    pressOut: Easing.out(Easing.cubic),
    standard: Easing.inOut(Easing.cubic),
    sineBreathe: Easing.inOut(Easing.sin),
    radar: Easing.out(Easing.cubic),
    linear: Easing.linear,
  },
  /**
   * Critical-damped spring presets for that "native iOS" feel. Tap-scale
   * pressables, sheet snap, card selection all share these — change one
   * here and the whole product responds in unison.
   */
  spring: {
    press: { mass: 0.4, damping: 14, stiffness: 220 },
    release: { mass: 0.5, damping: 12, stiffness: 180 },
    sheetSnap: {
      mass: 0.7,
      damping: 22,
      stiffness: 180,
      overshootClamping: false,
    },
    entrance: { mass: 0.9, damping: 16, stiffness: 110 },
    softEntrance: { mass: 0.9, damping: 18, stiffness: 110 },
    selectionLift: { mass: 0.5, damping: 14, stiffness: 180 },
    bouncyAvatar: { mass: 0.8, damping: 14, stiffness: 90 },
  },
} as const;

export type MotionDurationKey = keyof typeof motion.duration;
export type MotionEasingKey = keyof typeof motion.easing;
export type MotionSpringKey = keyof typeof motion.spring;
