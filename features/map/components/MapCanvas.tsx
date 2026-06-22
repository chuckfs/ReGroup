import React from 'react';
import { StyleSheet, View } from 'react-native';

import { FloatingMapPin, UserMarker } from '@/components/map';
import { relativeToUser } from '@/services/mapProjection';
import type { Friend, MapPosition } from '@/types';

import { MapAtmosphere } from './MapAtmosphere';
import { MapPaths } from './MapPaths';

type Props = {
  width: number;
  height: number;
  friends: Friend[];
  /**
   * Optional per-friend live position overrides keyed by friendId. When
   * present, takes precedence over the friend's static `position` field
   * — that's the path real-time location updates will flow through.
   * Pins only move when entries here change.
   */
  positions?: Record<string, MapPosition>;
  /**
   * The user's projected map position from GPS. Friends are drawn
   * relative to this anchor so the user marker stays at screen centre
   * while the crew shifts around them.
   */
  userPosition?: MapPosition;
  onFriendPress?: (friend: Friend) => void;
};

/**
 * The full stylised live-group map.
 *
 * Layer order (bottom → top):
 *   1. Atmosphere — gradient sky + drifting glow blobs
 *   2. Glowing curved streets (SVG)
 *   3. Friend markers, absolutely positioned via normalised x/y in [0, 1]
 *   4. The user marker, locked to the optical centre of the screen
 *
 * Two intentional invariants:
 *   - The user marker never moves on screen. It's glued to the canvas
 *     centre; GPS updates shift friend pins relative to the user via
 *     `relativeToUser` so the world moves around them.
 *   - Friend pins are at their data-layer positions and only re-render
 *     when their entry in `positions` actually changes. Nothing else
 *     (sheet drag, ambient breathing, etc.) shifts where they sit on
 *     the map.
 */
export function MapCanvas({
  width,
  height,
  friends,
  positions,
  userPosition = { x: 0.5, y: 0.5 },
  onFriendPress,
}: Props) {
  const insetX = width * 0.08;
  const insetY = height * 0.1;

  return (
    <View
      style={[styles.canvas, { width, height }]}
      pointerEvents="box-none"
    >
      <MapAtmosphere />
      <MapPaths width={width} height={height} />

      {friends.map((friend, i) => {
        const pos = positions?.[friend.id] ?? friend.position;
        const relativePos = relativeToUser(pos, userPosition);
        const left = insetX + relativePos.x * (width - insetX * 2);
        const top = insetY + relativePos.y * (height - insetY * 2);
        return (
          <View
            key={friend.id}
            style={[styles.markerSlot, { left, top }]}
            pointerEvents="box-none"
          >
            <FloatingMapPin
              friend={friend}
              bobOffset={i * 220}
              onPress={onFriendPress}
            />
          </View>
        );
      })}

      <View style={styles.userSlot} pointerEvents="box-none">
        <UserMarker />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  canvas: {
    overflow: 'hidden',
    position: 'relative',
  },
  markerSlot: {
    position: 'absolute',
    transform: [{ translateX: -28 }, { translateY: -28 }],
  },
  userSlot: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    transform: [{ translateX: -39 }, { translateY: -39 }],
  },
});
