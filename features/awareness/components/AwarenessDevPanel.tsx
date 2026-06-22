import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { palette, spacing, typography } from '@/constants';
import { awarenessDevSimulator } from '@/services/awarenessDevSimulator';
import { friendSimulator } from '@/services/friendSimulator';

type Props = {
  onRefresh?: () => void;
};

/**
 * Dev controls for scripting drift, regroup, stale, and low-battery
 * scenarios so the awareness loop can be exercised on one device.
 */
export function AwarenessDevPanel({ onRefresh }: Props) {
  return (
    <View pointerEvents="box-none" style={styles.panel}>
      <Text style={styles.label}>Awareness simulator</Text>
      <View style={styles.row}>
        <DevButton
          label="Drift Chris"
          onPress={() => {
            friendSimulator.setBehavior('f_chris', 'drift_away');
            onRefresh?.();
          }}
        />
        <DevButton
          label="Drift Alex"
          onPress={() => {
            friendSimulator.setBehavior('f_alex', 'drift_away');
            onRefresh?.();
          }}
        />
      </View>
      <View style={styles.row}>
        <DevButton
          label="Regroup all"
          onPress={() => {
            friendSimulator.regroupAll();
            onRefresh?.();
          }}
        />
        <DevButton
          label="Stale Jake"
          onPress={() => {
            friendSimulator.pauseUpdates('f_jake');
            onRefresh?.();
          }}
        />
      </View>
      <View style={styles.row}>
        <DevButton
          label="Low battery Ben"
          onPress={() => {
            awarenessDevSimulator.setBatteryPercent('f_ben', 15);
            onRefresh?.();
          }}
        />
        <DevButton
          label="Reset"
          onPress={() => {
            friendSimulator.resumeAllUpdates();
            awarenessDevSimulator.reset();
            onRefresh?.();
          }}
        />
      </View>
    </View>
  );
}

function DevButton({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.button} onPress={onPress}>
      <Text style={styles.buttonText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  panel: {
    position: 'absolute',
    bottom: spacing.xl * 14,
    left: spacing.md,
    right: spacing.md,
    zIndex: 4,
    padding: spacing.sm,
    borderRadius: 10,
    backgroundColor: 'rgba(14, 5, 33, 0.82)',
    borderWidth: 1,
    borderColor: palette.hairline,
  },
  label: {
    ...typography.caption,
    color: palette.lilac,
    marginBottom: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  button: {
    flex: 1,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(110, 77, 255, 0.18)',
    borderWidth: 1,
    borderColor: palette.hairline,
    alignItems: 'center',
  },
  buttonText: {
    ...typography.caption,
    color: palette.moonlight,
    textTransform: 'none',
    letterSpacing: 0.2,
  },
});
