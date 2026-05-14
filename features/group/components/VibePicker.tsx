import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { PressableScale } from '@/components/ui';
import { markerHues, motion, palette, radius, spacing, typography } from '@/constants';
import type { GroupVibeKey } from '@/types';

import { VIBES } from '../data/vibes';

type Props = {
  value: GroupVibeKey;
  onChange: (next: GroupVibeKey) => void;
};

/**
 * Step 2 — Pick a vibe. A scrollable grid of selectable cards; selected
 * card scales up slightly, picks up a glow tinted to its accent, and
 * reveals a short blurb in the header.
 */
export function VibePicker({ value, onChange }: Props) {
  const selectedVibe = VIBES.find((v) => v.key === value) ?? VIBES[0];

  return (
    <View style={styles.wrap}>
      <Text style={styles.eyebrow}>Step 2</Text>
      <Text style={styles.title}>What&apos;s the vibe?</Text>
      <Text style={styles.subtitle}>
        {selectedVibe.emoji} {selectedVibe.blurb}
      </Text>

      <View style={styles.grid}>
        {VIBES.map((vibe) => (
          <VibeCard
            key={vibe.key}
            vibeKey={vibe.key}
            emoji={vibe.emoji}
            label={vibe.label}
            accent={markerHues[vibe.accent]}
            selected={vibe.key === value}
            onPress={() => onChange(vibe.key)}
          />
        ))}
      </View>
    </View>
  );
}

type CardProps = {
  vibeKey: GroupVibeKey;
  emoji: string;
  label: string;
  accent: string;
  selected: boolean;
  onPress: () => void;
};

function VibeCard({ emoji, label, accent, selected, onPress }: CardProps) {
  const sel = useSharedValue(selected ? 1 : 0);

  React.useEffect(() => {
    sel.value = withTiming(selected ? 1 : 0, { duration: motion.duration.standard });
  }, [sel, selected]);

  const wrapStyle = useAnimatedStyle(() => ({
    transform: [
      {
        scale: withSpring(selected ? 1.04 : 1, motion.spring.selectionLift),
      },
    ],
    shadowOpacity: 0.7 * sel.value,
    shadowColor: accent,
  }));

  const fillStyle = useAnimatedStyle(() => ({
    opacity: 0.18 + sel.value * 0.55,
  }));

  const borderStyle = useAnimatedStyle(() => ({
    borderColor: selected ? accent : palette.glassStroke,
    borderWidth: selected ? 1.5 : StyleSheet.hairlineWidth,
  }));

  return (
    <PressableScale
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={`${label} vibe`}
      style={[styles.cardShadow, wrapStyle]}
    >
      <Animated.View style={[styles.cardBorder, borderStyle]}>
        <Animated.View style={[StyleSheet.absoluteFill, fillStyle]}>
          <LinearGradient
            colors={[`${accent}55`, `${accent}11`]}
            start={{ x: 0.2, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
        <Text style={styles.emoji}>{emoji}</Text>
        <Text style={styles.label}>{label}</Text>
      </Animated.View>
    </PressableScale>
  );
}

const CARD_W = '31%' as const;

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
    marginBottom: spacing.lg,
    minHeight: 38,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    justifyContent: 'space-between',
  },
  cardShadow: {
    width: CARD_W,
    aspectRatio: 1,
    borderRadius: radius.lg,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 4 },
  },
  cardBorder: {
    flex: 1,
    borderRadius: radius.lg,
    backgroundColor: palette.glassFill,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  emoji: {
    fontSize: 28,
  },
  label: {
    ...typography.bodySmall,
    color: palette.moonlight,
    fontWeight: '700',
    marginTop: 6,
    textAlign: 'center',
  },
});
