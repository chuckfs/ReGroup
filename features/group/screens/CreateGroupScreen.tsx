import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { AtmosphericBackdrop } from '@/components/ui';
import { markerHues, motion, palette, spacing, typography } from '@/constants';
import type { DraftGroup, GroupVibeKey } from '@/types';

import { GroupNameInput } from '../components/GroupNameInput';
import { InviteCard } from '../components/InviteCard';
import { VibePicker } from '../components/VibePicker';
import { WizardFooter } from '../components/WizardFooter';
import { WizardHeader } from '../components/WizardHeader';
import { VIBES_BY_KEY, generateInviteCode } from '../data/vibes';

type Props = {
  onClose: () => void;
  onComplete: (group: DraftGroup) => void | Promise<void>;
  isSubmitting?: boolean;
  submitError?: string | null;
};

const STEP_COUNT = 3;

/**
 * Group-creation wizard.
 *
 * Three steps:
 *   0. Name      — TextInput with focus glow + suggestions
 *   1. Vibe      — Grid of selectable cards (drives accent colour)
 *   2. Invite    — Generated invite code + Share CTA
 *
 * Visual choreography between steps: a horizontal slide (translateX) +
 * fade on the step body, while the persistent backdrop subtly retints to
 * match the currently-selected vibe accent.
 *
 * Local state is fine here — there's no async work, no global concerns,
 * and the wizard always produces a single DraftGroup that's handed back
 * to the route via onComplete (the route persists into `useGroupStore`).
 */
export default function CreateGroupScreen({
  onClose,
  onComplete,
  isSubmitting = false,
  submitError = null,
}: Props) {
  const [stepIndex, setStepIndex] = useState(0);
  const [name, setName] = useState('');
  const [vibeKey, setVibeKey] = useState<GroupVibeKey>('nightlife');
  const [inviteCode, setInviteCode] = useState('');

  const accent = markerHues[VIBES_BY_KEY[vibeKey].accent];

  // Drives step body slide+fade. -1 = previous, 0 = current, +1 = next.
  const stepProgress = useSharedValue(0);

  const goTo = useCallback(
    (next: number, direction: 'forward' | 'back') => {
      const sign = direction === 'forward' ? -1 : 1;

      // Slide current step out…
      stepProgress.value = withTiming(
        sign,
        { duration: motion.duration.standard, easing: motion.easing.standard },
        () => {
          // …then snap to opposite side and ease the new one in.
          stepProgress.value = -sign;
          stepProgress.value = withTiming(0, {
            duration: motion.duration.standardLong,
            easing: motion.easing.pressOut,
          });
        },
      );

      setTimeout(() => setStepIndex(next), motion.duration.standard);
    },
    [stepProgress],
  );

  const handleNext = useCallback(() => {
    if (isSubmitting) return;

    if (stepIndex === 0) {
      goTo(1, 'forward');
    } else if (stepIndex === 1) {
      setInviteCode(generateInviteCode(name || 'ReGroup'));
      goTo(2, 'forward');
    } else {
      void onComplete({ name: name.trim(), vibeKey, inviteCode });
    }
  }, [goTo, inviteCode, isSubmitting, name, onComplete, stepIndex, vibeKey]);

  const handleBack = useCallback(() => {
    if (stepIndex === 0) {
      onClose();
    } else {
      goTo(stepIndex - 1, 'back');
    }
  }, [goTo, onClose, stepIndex]);

  const bodyStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: stepProgress.value * 60 }],
    opacity: 1 - Math.min(Math.abs(stepProgress.value), 1) * 0.85,
  }));

  const canAdvance = useMemo(() => {
    if (stepIndex === 0) return name.trim().length >= 2;
    return true;
  }, [name, stepIndex]);

  const primaryLabel = isSubmitting
    ? 'Creating…'
    : stepIndex === 0
      ? 'Continue'
      : stepIndex === 1
        ? 'Continue'
        : 'Start night';

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <AtmosphericBackdrop accent={accent} />

      <WizardHeader
        stepCount={STEP_COUNT}
        currentIndex={stepIndex}
        accent={accent}
        showBack={stepIndex > 0}
        onBack={handleBack}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
        keyboardVerticalOffset={32}
      >
        <Animated.View style={[styles.body, bodyStyle]}>
          {stepIndex === 0 && (
            <GroupNameInput
              value={name}
              onChangeText={setName}
              accent={accent}
            />
          )}
          {stepIndex === 1 && (
            <VibePicker value={vibeKey} onChange={setVibeKey} />
          )}
          {stepIndex === 2 && (
            <InviteCard
              groupName={name}
              vibeKey={vibeKey}
              inviteCode={inviteCode}
              preview
            />
          )}
        </Animated.View>

        {submitError ? (
          <Text style={styles.error}>{submitError}</Text>
        ) : null}

        {isSubmitting ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator color={accent} />
          </View>
        ) : null}

        <WizardFooter
          primaryLabel={primaryLabel}
          onPrimary={handleNext}
          primaryDisabled={!canAdvance || isSubmitting}
          accent={accent}
        />
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: palette.voidPurple,
  },
  flex: {
    flex: 1,
  },
  body: {
    flex: 1,
    paddingTop: spacing.md,
  },
  error: {
    ...typography.bodySmall,
    color: palette.danger,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xs,
  },
  loadingRow: {
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
});
