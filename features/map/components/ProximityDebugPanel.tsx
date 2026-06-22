import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { formatDistanceFeet } from '@/services/friendSimulator';
import { STATUS_COPY } from '@/services/mockData';
import { palette, spacing, typography } from '@/constants';
import type { FriendProximityDetail } from '@/hooks/useLiveFriends';

type Props = {
  details: FriendProximityDetail[];
};

/**
 * Dev-only proximity readout — friend name, distance, and live status.
 */
export function ProximityDebugPanel({ details }: Props) {
  if (details.length === 0) return null;

  return (
    <View pointerEvents="none" style={styles.panel}>
      <Text style={styles.label}>Proximity debug</Text>
      {details.map((detail) => (
        <View key={detail.id} style={styles.row}>
          <Text style={styles.name} numberOfLines={1}>
            {detail.name}
          </Text>
          <Text style={styles.distance}>
            {formatDistanceFeet(detail.distanceFeet)}
          </Text>
          <Text style={styles.status}>
            {STATUS_COPY[detail.proximityStatus].label}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    position: 'absolute',
    top: spacing.xl * 7.5,
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
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: 2,
  },
  name: {
    ...typography.caption,
    color: palette.moonlight,
    flex: 1,
  },
  distance: {
    ...typography.caption,
    color: palette.dim,
    fontVariant: ['tabular-nums'],
    minWidth: 52,
    textAlign: 'right',
  },
  status: {
    ...typography.caption,
    color: palette.lilac,
    fontWeight: '700',
    minWidth: 72,
    textAlign: 'right',
  },
});
