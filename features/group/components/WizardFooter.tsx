import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GradientButton } from '@/components/buttons';
import { PressableScale } from '@/components/ui';
import { gradients, palette, spacing, typography } from '@/constants';

type Props = {
  primaryLabel: string;
  onPrimary: () => void;
  primaryDisabled?: boolean;
  /** Optional accent for the primary button's glow. */
  accent?: string;
  /** Optional secondary text (left of primary). E.g. "Skip" or "Back". */
  secondaryLabel?: string;
  onSecondary?: () => void;
};

/**
 * Sticky-ish footer for wizard steps. Lives at the bottom of the screen
 * above the safe-area inset. Primary CTA is a glowing gradient pill
 * (built on `GradientButton`); optional secondary is a quiet text link.
 */
export function WizardFooter({
  primaryLabel,
  onPrimary,
  primaryDisabled = false,
  accent = palette.electric,
  secondaryLabel,
  onSecondary,
}: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.wrap, { paddingBottom: insets.bottom + spacing.md }]}>
      {secondaryLabel && onSecondary ? (
        <PressableScale
          onPress={onSecondary}
          accessibilityRole="button"
          accessibilityLabel={secondaryLabel}
          style={styles.secondary}
        >
          <Text style={styles.secondaryText}>{secondaryLabel}</Text>
        </PressableScale>
      ) : (
        <View style={styles.secondaryPlaceholder} />
      )}

      <GradientButton
        label={primaryLabel}
        onPress={onPrimary}
        disabled={primaryDisabled}
        showChevron
        glow={accent}
        colors={gradients.primaryBtn}
        accessibilityLabel={primaryLabel}
        style={styles.primary}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    gap: spacing.md,
  },
  secondary: {
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  secondaryPlaceholder: {
    width: 4,
  },
  secondaryText: {
    ...typography.body,
    color: palette.dim,
    fontWeight: '600',
  },
  primary: {
    flex: 1,
  },
});
