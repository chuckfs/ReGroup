import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IconButton } from '@/components/buttons';
import { palette, spacing } from '@/constants';

import { StepIndicator } from './StepIndicator';

type Props = {
  stepCount: number;
  currentIndex: number;
  accent?: string;
  onBack?: () => void;
  /** Show a back arrow on the left. Step 0 hides it; modal swipe-down dismisses. */
  showBack?: boolean;
};

/**
 * Modal header: an optional back arrow on the left and the step indicator
 * centred. Honours safe-area inset so the back button sits below the
 * notch on iOS modals.
 *
 * Step 0 has no back affordance — the modal's swipe-down dismiss is
 * enough; the prior `···` close icon was redundant.
 */
export function WizardHeader({
  stepCount,
  currentIndex,
  accent = palette.orchid,
  onBack,
  showBack = false,
}: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.row, { paddingTop: insets.top + spacing.xs }]}>
      {showBack ? (
        <IconButton
          icon="back"
          accessibilityLabel="Go back"
          onPress={onBack}
          size={44}
        />
      ) : (
        // Step 0 has no back affordance — the modal's swipe-down dismiss
        // is enough. Keep an invisible spacer so the step indicator
        // stays centred against the right-hand phantom spacer.
        <View style={styles.spacer} />
      )}

      <StepIndicator
        count={stepCount}
        currentIndex={currentIndex}
        accent={accent}
      />

      {/* Phantom spacer so the indicator stays centred */}
      <View style={styles.spacer} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  spacer: {
    width: 44,
    height: 44,
  },
});
