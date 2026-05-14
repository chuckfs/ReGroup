import React from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { palette, radius, shadow, typography } from '@/constants';
import { PressableScale } from '@/components/ui';

type GradientStops = readonly [string, string, ...string[]];

type Props = {
  label: string;
  onPress?: () => void;
  /** Two- or three-stop gradient for the pill fill. */
  colors?: GradientStops;
  /** Hue used for the soft outer glow. Defaults to first gradient stop. */
  glow?: string;
  disabled?: boolean;
  /** Optional trailing chevron ›. */
  showChevron?: boolean;
  /** Layout override (margins, flex, etc.) applied to the outer pressable. */
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
};

/**
 * Reusable glowing gradient pill — the canonical "primary CTA" surface
 * in the app. Used by the wizard footer's primary button and the
 * invite-card share button today; ready for any future primary action.
 *
 * Layered recipe (back → front):
 *   1. Outer coloured shadow ("glow")
 *   2. Diagonal gradient fill
 *   3. Hairline white border (raised-edge feel)
 *   4. Centred bold label + optional chevron
 */
export function GradientButton({
  label,
  onPress,
  colors = [palette.electric, '#8A6BFF'] as const,
  glow,
  disabled = false,
  showChevron = false,
  style,
  accessibilityLabel,
}: Props) {
  const glowColor = glow ?? colors[0];

  return (
    <PressableScale
      onPress={disabled ? undefined : onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled }}
      style={[
        styles.wrap,
        shadow.fab,
        { shadowColor: glowColor, opacity: disabled ? 0.45 : 1 },
        style,
      ]}
    >
      <LinearGradient
        colors={colors as unknown as readonly [string, string, ...string[]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.fill}
      >
        <View style={styles.content}>
          <Text style={styles.label}>{label}</Text>
          {showChevron && <Text style={styles.chevron}>›</Text>}
        </View>
      </LinearGradient>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: radius.pill,
    overflow: 'visible',
    shadowOpacity: 0.6,
  },
  fill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255, 255, 255, 0.22)',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  label: {
    ...typography.titleMedium,
    color: palette.moonlight,
    fontWeight: '800',
  },
  chevron: {
    color: palette.moonlight,
    fontWeight: '900',
    fontSize: 22,
    marginTop: -2,
  },
});
