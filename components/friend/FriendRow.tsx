import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import {
  BatteryPill,
  PressableScale,
  StatusDot,
} from '@/components/ui';
import { markerHues, palette, typography } from '@/constants';
import { STATUS_COPY } from '@/services/mockData';
import type { Friend, StatusTone } from '@/types';

const toneToColor: Record<StatusTone, string> = {
  positive: palette.mint,
  neutral: palette.lilac,
  warning: palette.warning,
  danger: palette.danger,
};

type Props = {
  friend: Friend;
  onPress?: (friend: Friend) => void;
};

/**
 * One row in the friend list:
 *
 *   [hued avatar dot]  Name              status text  [battery]
 *                      "last seen 3 min ago"
 *
 * If `onPress` is provided the whole row is a PressableScale that opens
 * the friend-detail sheet; otherwise it's a plain view (used for the
 * current-user row at the top of the list).
 */
export function FriendRow({ friend, onPress }: Props) {
  const color = markerHues[friend.hue];
  const status = STATUS_COPY[friend.status];

  const body = (
    <View style={styles.row}>
      <View
        style={[
          styles.avatar,
          { backgroundColor: color, shadowColor: color },
        ]}
      >
        <Text style={styles.initials}>{friend.initials}</Text>
      </View>

      <View style={styles.middle}>
        <Text style={styles.name}>{friend.name}</Text>
        <View style={styles.metaRow}>
          <StatusDot status={friend.status} size={6} />
          <Text style={styles.meta}>
            {status.label}
            {friend.lastSeenMinutesAgo > 0
              ? ` · ${friend.lastSeenMinutesAgo} min`
              : ''}
          </Text>
        </View>
      </View>

      <View style={styles.right}>
        <Text style={[styles.statusText, { color: toneToColor[status.tone] }]}>
          {status.label}
        </Text>
        <BatteryPill percent={friend.batteryPercent} />
      </View>
    </View>
  );

  if (!onPress) return body;

  return (
    <PressableScale
      onPress={() => onPress(friend)}
      accessibilityRole="button"
      accessibilityLabel={`Open details for ${friend.name}`}
      scaleTo={0.98}
    >
      {body}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 14,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: palette.moonlight,
    shadowOpacity: 0.55,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
  },
  initials: {
    ...typography.bodySmall,
    color: palette.voidPurple,
    fontWeight: '800',
    fontSize: 11,
    letterSpacing: 0.4,
  },
  middle: {
    flex: 1,
  },
  name: {
    ...typography.titleMedium,
    color: palette.moonlight,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  meta: {
    ...typography.caption,
    color: palette.dim,
    textTransform: 'none',
    letterSpacing: 0,
  },
  right: {
    alignItems: 'flex-end',
    gap: 4,
  },
  statusText: {
    ...typography.caption,
    fontWeight: '800',
    letterSpacing: 0.4,
    textTransform: 'none',
  },
});
