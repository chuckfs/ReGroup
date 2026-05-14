import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { palette, typography } from '@/constants';

type Props = {
  percent: number;
};

/**
 * A miniature battery icon + percentage. Tints red below 20% so a
 * dying-phone friend is instantly visible in the friend list.
 */
export function BatteryPill({ percent }: Props) {
  const clamped = Math.max(0, Math.min(100, percent));
  const low = clamped <= 20;
  const mid = !low && clamped <= 50;
  const fillColor = low ? palette.danger : mid ? palette.warning : palette.mint;

  return (
    <View style={styles.row}>
      <Text style={[styles.percent, low && { color: palette.danger }]}>
        {clamped}%
      </Text>
      <View style={styles.battery}>
        <View
          style={[
            styles.fill,
            { width: `${clamped}%`, backgroundColor: fillColor },
          ]}
        />
        <View style={styles.tip} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  percent: {
    ...typography.bodySmall,
    color: palette.whisper,
  },
  battery: {
    width: 22,
    height: 11,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: palette.faint,
    padding: 1.5,
    flexDirection: 'row',
  },
  fill: {
    height: '100%',
    borderRadius: 1,
  },
  tip: {
    position: 'absolute',
    right: -3,
    top: 3,
    width: 2,
    height: 5,
    borderRadius: 1,
    backgroundColor: palette.faint,
  },
});
