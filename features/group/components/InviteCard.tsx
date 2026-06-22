import React from 'react';
import { Share, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { GlassCard, PressableScale } from '@/components/ui';
import { markerHues, palette, radius, spacing, typography } from '@/constants';
import type { GroupVibeKey } from '@/types';

import { VIBES_BY_KEY } from '../data/vibes';

type Props = {
  groupName: string;
  vibeKey: GroupVibeKey;
  inviteCode: string;
  /** Wizard preview — server assigns the real code on create. */
  preview?: boolean;
};

/**
 * Step 3 — Group is ready. Shows a hero summary (name + vibe emoji), the
 * generated invite code in a tappable card, and a single Share CTA that
 * uses the system Share sheet (no extra deps).
 */
export function InviteCard({
  groupName,
  vibeKey,
  inviteCode,
  preview = false,
}: Props) {
  const vibe = VIBES_BY_KEY[vibeKey];
  const accent = markerHues[vibe.accent];

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Join my ReGroup tonight — ${groupName}\nCode: ${inviteCode}\nregroup://join/${inviteCode}`,
        title: `Join ${groupName}`,
      });
    } catch {
      // user cancelled, nothing to do
    }
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.eyebrow}>Step 3</Text>
      <Text style={styles.title}>Your group is ready</Text>
      <Text style={styles.subtitle}>
        {preview
          ? 'Preview only — your real invite code is assigned when you start the night.'
          : 'Send this to your crew. They join with the code or the link.'}
      </Text>

      <View style={[styles.summary, { shadowColor: accent }]}>
        <LinearGradient
          colors={[`${accent}55`, `${accent}11`]}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[StyleSheet.absoluteFill, { borderRadius: radius.lg }]}
        />
        <Text style={styles.summaryEmoji}>{vibe.emoji}</Text>
        <Text style={styles.summaryName} numberOfLines={1}>
          {groupName || 'Untitled night'}
        </Text>
        <Text style={styles.summaryVibe}>{vibe.label}</Text>
      </View>

      <GlassCard cornerRadius={radius.lg} style={styles.codeCard}>
        <Text style={styles.codeLabel}>
          {preview ? 'Preview code' : 'Invite code'}
        </Text>
        <Text style={styles.code} selectable>
          {inviteCode}
        </Text>
        <View style={styles.dashRow}>
          {Array.from({ length: 24 }).map((_, i) => (
            <View key={i} style={styles.dash} />
          ))}
        </View>
        <Text style={styles.linkLabel}>Or join with the link</Text>
        <Text style={styles.link} selectable>
          regroup://join/{inviteCode}
        </Text>
      </GlassCard>

      <PressableScale
        onPress={preview ? undefined : handleShare}
        accessibilityRole="button"
        accessibilityLabel={preview ? 'Share available after create' : 'Share invite'}
        style={[
          styles.shareBtn,
          { shadowColor: accent },
          preview && styles.shareBtnDisabled,
        ]}
      >
        <LinearGradient
          colors={[accent, palette.electric]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.shareFill}
        >
          <Text style={styles.shareText}>Share invite</Text>
        </LinearGradient>
      </PressableScale>
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
  summary: {
    borderRadius: radius.lg,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    backgroundColor: palette.glassFillStrong,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.glassStroke,
    overflow: 'hidden',
    shadowOpacity: 0.5,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 6 },
  },
  summaryEmoji: {
    fontSize: 38,
    marginBottom: 4,
  },
  summaryName: {
    ...typography.titleLarge,
    color: palette.moonlight,
    paddingHorizontal: spacing.md,
  },
  summaryVibe: {
    ...typography.bodySmall,
    color: palette.lilac,
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    fontSize: 11,
    fontWeight: '800',
  },
  codeCard: {
    marginTop: spacing.md,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
  },
  codeLabel: {
    ...typography.label,
    color: palette.lilac,
  },
  code: {
    fontSize: 36,
    fontWeight: '800',
    letterSpacing: 6,
    color: palette.moonlight,
    marginTop: 8,
    textShadowColor: 'rgba(189, 167, 255, 0.55)',
    textShadowRadius: 14,
  },
  dashRow: {
    flexDirection: 'row',
    alignSelf: 'stretch',
    justifyContent: 'space-between',
    marginVertical: spacing.md,
  },
  dash: {
    width: 8,
    height: 1,
    backgroundColor: palette.hairline,
  },
  linkLabel: {
    ...typography.caption,
    color: palette.dim,
  },
  link: {
    ...typography.bodySmall,
    color: palette.lilac,
    marginTop: 2,
    letterSpacing: 0.4,
  },
  shareBtn: {
    marginTop: spacing.md,
    borderRadius: radius.pill,
    overflow: 'visible',
    shadowOpacity: 0.55,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 4 },
  },
  shareBtnDisabled: {
    opacity: 0.45,
  },
  shareFill: {
    paddingVertical: 14,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255, 255, 255, 0.22)',
  },
  shareText: {
    ...typography.titleMedium,
    color: palette.moonlight,
    fontWeight: '800',
  },
});
