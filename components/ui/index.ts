/**
 * Barrel for the design-system primitives. Anything in `/components/ui`
 * is purely presentational and reusable across features.
 *
 * Bigger components (FriendRow, FloatingMapPin, BottomSheetHandle,
 * GradientButton, IconButton) live in their own category folders next
 * to this one — keep this barrel focused on truly atomic primitives.
 */
export { PressableScale } from './PressableScale';
export { GlassCard } from './GlassCard';
export { IconGlyph } from './IconGlyph';
export type { IconName } from './IconGlyph';
export { StatusDot } from './StatusDot';
export { StatusBadge } from './StatusBadge';
export { BatteryPill } from './BatteryPill';
export { GlowAvatar } from './GlowAvatar';
export { AtmosphericBackdrop } from './AtmosphericBackdrop';
