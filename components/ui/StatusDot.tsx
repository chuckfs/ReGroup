import React from 'react';
import { StyleSheet, View } from 'react-native';

import { palette } from '@/constants';
import { STATUS_COPY } from '@/services/mockData';
import type { FriendStatus, StatusTone } from '@/types';

const toneToColor: Record<StatusTone, string> = {
  positive: palette.mint,
  neutral: palette.lilac,
  warning: palette.warning,
  danger: palette.danger,
};

type Props = {
  status: FriendStatus;
  size?: number;
};

/** A pulsing-coloured dot used to indicate per-friend status at-a-glance. */
export function StatusDot({ status, size = 8 }: Props) {
  const tone = STATUS_COPY[status].tone;
  const color = toneToColor[tone];
  return (
    <View
      style={[
        styles.dot,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          shadowColor: color,
        },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  dot: {
    shadowOpacity: 0.9,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
  },
});
