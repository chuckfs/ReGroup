import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { palette, typography } from '@/constants';

type Props = {
  label: string;
  value: string;
  /** Optional emoji/glyph to the left of the label. */
  icon?: string;
  /** Highlight the value (e.g. show distance in warning colour). */
  tone?: 'default' | 'warning' | 'danger' | 'positive';
};

/**
 * A single label → value row used in the friend detail "metrics" list.
 * Tones tint just the value so the label stays uniform across the list.
 */
export function FriendMetric({ label, value, icon, tone = 'default' }: Props) {
  const valueColor =
    tone === 'warning'
      ? palette.warning
      : tone === 'danger'
        ? palette.danger
        : tone === 'positive'
          ? palette.mint
          : palette.moonlight;

  return (
    <View style={styles.row}>
      <View style={styles.labelGroup}>
        {icon ? <Text style={styles.icon}>{icon}</Text> : null}
        <Text style={styles.label}>{label}</Text>
      </View>
      <Text style={[styles.value, { color: valueColor }]} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    gap: 12,
  },
  labelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  icon: {
    fontSize: 14,
  },
  label: {
    ...typography.body,
    color: palette.dim,
  },
  value: {
    ...typography.body,
    fontWeight: '700',
    textAlign: 'right',
    flexShrink: 1,
  },
});
