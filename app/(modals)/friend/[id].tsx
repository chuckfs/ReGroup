import React, { useCallback, useMemo } from 'react';
import { router, useLocalSearchParams } from 'expo-router';

import { FriendDetailScreen } from '@/features/friends';
import { findFriendById } from '@/services/mockData';
import { useFriendStore } from '@/store/useFriendStore';
import type { Friend } from '@/types';

/**
 * Dynamic modal route: /friend/[id]
 *
 * Picks the friend out of the mock group by id. When the realtime layer
 * lands, swap `findFriendById` for a selector against `useGroupStore`'s
 * realtime cache — everything else stays the same.
 */
export default function FriendDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const clearSelected = useFriendStore((s) => s.select);
  const friend = useMemo(() => findFriendById(id) ?? null, [id]);

  const handleClose = useCallback(() => {
    clearSelected(null);
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)' as never);
  }, [clearSelected]);

  const handleMessage = useCallback((f: Friend) => {
    // TODO(backend): route to /chat/[friendId] when chat lands.
    console.log('[ReGroup] message friend:', f.id);
  }, []);

  const handlePing = useCallback((f: Friend) => {
    // TODO(backend): emit a "ping" event over the realtime channel.
    console.log('[ReGroup] ping friend:', f.id);
  }, []);

  const handleDirections = useCallback((f: Friend) => {
    // TODO: open Apple/Google maps to the friend's last known location.
    console.log('[ReGroup] directions to friend:', f.id);
  }, []);

  return (
    <FriendDetailScreen
      friend={friend}
      onClose={handleClose}
      onMessage={handleMessage}
      onPing={handlePing}
      onDirections={handleDirections}
    />
  );
}
