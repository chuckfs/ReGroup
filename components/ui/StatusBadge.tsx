import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { palette, radius, typography } from '@/constants';
import { STATUS_COPY } from '@/services/mockData';
import type { DisplayStatus, StatusTone } from '@/types';

import { StatusDot } from './StatusDot';

const toneToColor: Record<StatusTone, string> = {
  positive: palette.mint,
  neutral: palette.lilac,
  warning: palette.warning,
  danger: palette.danger,
};

const toneToBackground: Record<StatusTone, string> = {
  positive: 'rgba(77, 230, 194, 0.12)',
  neutral: 'rgba(189, 167, 255, 0.14)',
  warning: 'rgba(255, 180, 95, 0.14)',
  danger: 'rgba(255, 107, 138, 0.16)',
};

type Props = {
  status: DisplayStatus;
  /** "pill" puts the status inside a tinted capsule; "inline" is text only. */
  variant?: 'pill' | 'inline';
  /** Show a leading status dot. Defaults to true. */
  withDot?: boolean;
};

/**
 * Status presentation primitive — converts a `DisplayStatus` into the
 * canonical {colour, dot, label} chip used across the friend list, the
 * hero card, and friend detail.
 *
 * Keeps the tone-to-colour mapping in one place; new statuses only need
 * `STATUS_COPY` updated and they show up here automatically.
 */
export function StatusBadge({
  status,
  variant = 'inline',
  withDot = true,
}: Props) {
  const copy = STATUS_COPY[status];
  const color = toneToColor[copy.tone];

  if (variant === 'pill') {
    return (
      <View
        style={[
          styles.pill,
          {
            backgroundColor: toneToBackground[copy.tone],
            borderColor: `${color}55`,
          },
        ]}
      >
        {withDot && <StatusDot status={status} size={7} />}
        <Text style={[styles.label, { color }]} numberOfLines={1}>
          {copy.label}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.inline}>
      {withDot && <StatusDot status={status} size={6} />}
      <Text style={[styles.label, { color }]} numberOfLines={1}>
        {copy.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
  },
  inline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  label: {
    ...typography.caption,
    fontWeight: '800',
    letterSpacing: 0.4,
    textTransform: 'none',
  },
});
