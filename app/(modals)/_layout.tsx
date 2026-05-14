import React from 'react';
import { Stack } from 'expo-router';

import { palette } from '@/constants';

/**
 * Modals group.
 *
 * All modal-presented routes live here. The root `app/_layout.tsx`
 * already configures this group with `presentation: 'modal'` +
 * `slide_from_bottom`, so individual screens just declare themselves.
 *
 * Adding a new modal:
 *   1. Drop the route file under `app/(modals)/...`
 *   2. Push to it from anywhere via `router.push('/the/route')`
 *   3. Add a screen factory in the relevant `/features/*` module
 */
export default function ModalsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: palette.voidPurple },
        animation: 'slide_from_bottom',
        gestureEnabled: true,
      }}
    />
  );
}
