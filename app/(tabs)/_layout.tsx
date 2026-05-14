import React from 'react';
import { Stack } from 'expo-router';

import { palette } from '@/constants';

/**
 * Tabs group.
 *
 * Today this is just a headerless Stack rendering the single Map tab —
 * no visible tab bar so the home map keeps its current full-bleed look.
 *
 * When we add Friends / Activity / Settings tabs, swap this `Stack` for
 * an Expo Router `Tabs` layout with the bespoke ReGroup-style tab bar
 * (glassy pill at the bottom, gradient active indicator).
 *
 * Route group `(tabs)` is URL-invisible: `/(tabs)/index` is reachable
 * as just `/`.
 */
export default function TabsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: palette.voidPurple },
        animation: 'fade',
      }}
    />
  );
}
