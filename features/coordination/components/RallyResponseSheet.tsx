import React from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GlassCard, PressableScale } from '@/components/ui';
import { palette, radius, spacing, typography } from '@/constants';
import type { CoordinationStatus } from '@/types/status';

type RallyResponse = Exclude<CoordinationStatus, 'no_response'>;

type Props = {
  visible: boolean;
  initiatorName: string;
  onClose: () => void;
  onRespond: (status: RallyResponse) => void;
};

const RESPONSE_OPTIONS: Array<{
  status: RallyResponse;
  label: string;
  hint: string;
}> = [
  {
    status: 'heading_to_point',
    label: 'On my way',
    hint: 'Heading to the rally point',
  },
  {
    status: 'at_meeting_point',
    label: "I'm here",
    hint: 'Already at the meeting point',
  },
  {
    status: 'cant_make_it',
    label: "Can't make it",
    hint: 'Let the crew know you are sitting this one out',
  },
];

/**
 * Bottom sheet-style modal for rally responses.
 */
export function RallyResponseSheet({
  visible,
  initiatorName,
  onClose,
  onRespond,
}: Props) {
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={[styles.sheet, { paddingBottom: insets.bottom + spacing.lg }]}
          onPress={(event) => event.stopPropagation()}
        >
          <GlassCard cornerRadius={radius.xl} variant="strong" style={styles.card}>
            <Text style={styles.title}>Regroup with {initiatorName}</Text>
            <Text style={styles.subtitle}>How are you responding?</Text>

            <View style={styles.options}>
              {RESPONSE_OPTIONS.map((option) => (
                <PressableScale
                  key={option.status}
                  onPress={() => onRespond(option.status)}
                  accessibilityRole="button"
                  accessibilityLabel={option.label}
                  style={styles.option}
                >
                  <Text style={styles.optionLabel}>{option.label}</Text>
                  <Text style={styles.optionHint}>{option.hint}</Text>
                </PressableScale>
              ))}
            </View>

            <PressableScale
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Close rally response sheet"
              style={styles.cancel}
            >
              <Text style={styles.cancelLabel}>Not now</Text>
            </PressableScale>
          </GlassCard>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(8, 4, 20, 0.72)',
  },
  sheet: {
    paddingHorizontal: spacing.md,
  },
  card: {
    padding: spacing.lg,
  },
  title: {
    ...typography.titleMedium,
    color: palette.moonlight,
  },
  subtitle: {
    ...typography.bodySmall,
    color: palette.dim,
    marginTop: spacing.xs,
  },
  options: {
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  option: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.glassStroke,
  },
  optionLabel: {
    ...typography.bodySmall,
    color: palette.moonlight,
    fontWeight: '700',
  },
  optionHint: {
    ...typography.caption,
    color: palette.dim,
    marginTop: 4,
    textTransform: 'none',
    letterSpacing: 0.2,
  },
  cancel: {
    alignItems: 'center',
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
  },
  cancelLabel: {
    ...typography.bodySmall,
    color: palette.lilac,
    fontWeight: '700',
  },
});
