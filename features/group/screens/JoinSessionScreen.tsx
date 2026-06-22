import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';

import { AtmosphericBackdrop } from '@/components/ui';
import { markerHues, palette, radius, spacing, typography } from '@/constants';
import { normalizeInviteCode } from '@/lib/deepLinks';

import { WizardFooter } from '../components/WizardFooter';
import { WizardHeader } from '../components/WizardHeader';

type Props = {
  initialCode?: string;
  /** When true, show an editable code field (manual entry route). */
  allowEdit?: boolean;
  onClose: () => void;
  onJoin: (inviteCode: string) => void | Promise<void>;
  isSubmitting?: boolean;
  submitError?: string | null;
};

/**
 * Join flow — confirm an invite code and enter a server session.
 * Used by deep links (`/join/BKLY-7G3X`) and manual entry (`/join`).
 */
export default function JoinSessionScreen({
  initialCode = '',
  allowEdit = false,
  onClose,
  onJoin,
  isSubmitting = false,
  submitError = null,
}: Props) {
  const [code, setCode] = useState(initialCode);
  const accent = markerHues.electric;

  useEffect(() => {
    setCode(initialCode);
  }, [initialCode]);

  const normalized = normalizeInviteCode(code);
  const canJoin = normalized.length >= 4;

  const handleJoin = useCallback(() => {
    if (!canJoin || isSubmitting) return;
    void onJoin(normalized);
  }, [canJoin, isSubmitting, normalized, onJoin]);

  const primaryLabel = isSubmitting ? 'Joining…' : 'Join night';

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <AtmosphericBackdrop accent={accent} />

      <WizardHeader
        stepCount={1}
        currentIndex={0}
        accent={accent}
        showBack
        onBack={onClose}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
        keyboardVerticalOffset={32}
      >
        <View style={styles.body}>
          <Text style={styles.eyebrow}>Join</Text>
          <Text style={styles.title}>Enter the night</Text>
          <Text style={styles.subtitle}>
            {allowEdit
              ? 'Paste or type the invite code from your friend.'
              : 'You were invited to join this session.'}
          </Text>

          {allowEdit ? (
            <View style={[styles.field, { borderColor: palette.glassStroke }]}>
              <Text style={styles.fieldLabel}>Invite code</Text>
              <TextInput
                value={code}
                onChangeText={(next) => setCode(next.toUpperCase())}
                placeholder="BKLY-7G3X"
                placeholderTextColor={palette.faint}
                style={styles.input}
                autoCapitalize="characters"
                autoCorrect={false}
                autoFocus
                maxLength={16}
                returnKeyType="done"
                onSubmitEditing={handleJoin}
              />
            </View>
          ) : (
            <View style={[styles.codeHero, { shadowColor: accent }]}>
              <Text style={styles.codeLabel}>Invite code</Text>
              <Text style={styles.code} selectable>
                {normalized || '—'}
              </Text>
            </View>
          )}
        </View>

        {submitError ? <Text style={styles.error}>{submitError}</Text> : null}

        {isSubmitting ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator color={accent} />
          </View>
        ) : null}

        <WizardFooter
          primaryLabel={primaryLabel}
          onPrimary={handleJoin}
          primaryDisabled={!canJoin || isSubmitting}
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
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  eyebrow: {
    ...typography.label,
    color: palette.lilac,
    marginBottom: 6,
  },
  title: {
    ...typography.displayLarge,
    color: palette.moonlight,
  },
  subtitle: {
    ...typography.body,
    color: palette.dim,
    marginTop: 8,
    marginBottom: spacing.xl,
  },
  field: {
    backgroundColor: palette.glassFillStrong,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    paddingHorizontal: spacing.md,
    paddingTop: 14,
    paddingBottom: 12,
  },
  fieldLabel: {
    ...typography.caption,
    color: palette.faint,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  input: {
    ...typography.titleLarge,
    color: palette.moonlight,
    paddingVertical: 0,
    letterSpacing: 1.2,
  },
  codeHero: {
    backgroundColor: palette.glassFillStrong,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: palette.glassStroke,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
    alignItems: 'center',
    shadowOpacity: 0.35,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 0 },
  },
  codeLabel: {
    ...typography.caption,
    color: palette.faint,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: spacing.sm,
  },
  code: {
    ...typography.displayLarge,
    color: palette.moonlight,
    letterSpacing: 2,
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
