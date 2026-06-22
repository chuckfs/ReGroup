import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { palette, spacing, typography } from '@/constants';
import type { DeviceLocation } from '@/types/location';

type Props = {
  location: DeviceLocation | null;
  error: string | null;
};

/**
 * Temporary dev-only overlay for verifying the GPS pipeline.
 * Stripped from production builds via the `__DEV__` guard in HomeScreen.
 */
export function LocationDebugCard({ location, error }: Props) {
  return (
    <View pointerEvents="none" style={styles.card}>
      <Text style={styles.label}>Location debug</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {location ? (
        <>
          <Text style={styles.line}>lat: {location.latitude.toFixed(6)}</Text>
          <Text style={styles.line}>lng: {location.longitude.toFixed(6)}</Text>
          <Text style={styles.line}>
            accuracy:{' '}
            {location.accuracy != null
              ? `${location.accuracy.toFixed(1)} m`
              : '—'}
          </Text>
          <Text style={styles.line}>
            timestamp:{' '}
            {location.timestamp != null
              ? new Date(location.timestamp).toLocaleTimeString()
              : '—'}
          </Text>
        </>
      ) : (
        <Text style={styles.line}>waiting for fix…</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    position: 'absolute',
    top: spacing.xl * 3,
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
  line: {
    ...typography.caption,
    color: palette.moonlight,
    fontVariant: ['tabular-nums'],
  },
  error: {
    ...typography.caption,
    color: palette.danger,
    marginBottom: spacing.xs,
  },
});
