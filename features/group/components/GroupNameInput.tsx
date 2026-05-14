import React, { useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { GlassCard } from '@/components/ui';
import { motion, palette, radius, spacing, typography } from '@/constants';

type Props = {
  value: string;
  onChangeText: (next: string) => void;
  accent?: string;
  /** Reserve some keyboard space without using KeyboardAvoidingView. */
  autoFocus?: boolean;
};

const SUGGESTIONS = [
  "Tash's birthday",
  'Webster Hall',
  'Bushwick Crawl',
  'Bk Mirage Set',
];

const MAX_LENGTH = 32;

/**
 * Step 1 — Name the night. Auto-focuses a big translucent input with a
 * focus-glow border. Below it, a row of tap-to-fill suggestions to
 * de-risk the blank-page moment.
 */
export function GroupNameInput({
  value,
  onChangeText,
  accent = palette.orchid,
  autoFocus = true,
}: Props) {
  const ref = useRef<TextInput>(null);
  const focus = useSharedValue(0);

  useEffect(() => {
    if (autoFocus) {
      const t = setTimeout(() => ref.current?.focus(), 320);
      return () => clearTimeout(t);
    }
  }, [autoFocus]);

  const borderStyle = useAnimatedStyle(() => ({
    borderColor:
      focus.value > 0.5 ? accent : palette.glassStroke,
    shadowOpacity: 0.35 * focus.value,
  }));

  return (
    <View style={styles.wrap}>
      <Text style={styles.eyebrow}>Step 1</Text>
      <Text style={styles.title}>Name your night</Text>
      <Text style={styles.subtitle}>
        Pick something short and memorable. You can change it later.
      </Text>

      <Animated.View style={[styles.field, { shadowColor: accent }, borderStyle]}>
        <TextInput
          ref={ref}
          value={value}
          onChangeText={(t) => onChangeText(t.slice(0, MAX_LENGTH))}
          onFocus={() => {
            focus.value = withTiming(1, { duration: motion.duration.standard });
          }}
          onBlur={() => {
            focus.value = withTiming(0, { duration: motion.duration.standard });
          }}
          placeholder="Brooklyn Nights"
          placeholderTextColor={palette.faint}
          style={styles.input}
          autoCapitalize="words"
          autoCorrect={false}
          maxLength={MAX_LENGTH}
          returnKeyType="next"
        />
        <Text style={styles.counter}>
          {value.length}/{MAX_LENGTH}
        </Text>
      </Animated.View>

      <View style={styles.suggestRow}>
        {SUGGESTIONS.map((s) => (
          <GlassCard
            key={s}
            cornerRadius={radius.pill}
            variant="flat"
            style={styles.suggestPill}
          >
            <Text style={styles.suggestText} onPress={() => onChangeText(s)}>
              {s}
            </Text>
          </GlassCard>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: spacing.lg,
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
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 0 },
  },
  input: {
    ...typography.titleLarge,
    color: palette.moonlight,
    paddingVertical: 0,
  },
  counter: {
    ...typography.caption,
    color: palette.faint,
    textTransform: 'none',
    letterSpacing: 0.2,
    textAlign: 'right',
    marginTop: 6,
  },
  suggestRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: spacing.lg,
  },
  suggestPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  suggestText: {
    ...typography.bodySmall,
    color: palette.whisper,
  },
});
