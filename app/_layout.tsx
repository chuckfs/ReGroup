import React from 'react';
import { StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import * as SystemUI from 'expo-system-ui';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider } from '@/providers/AuthProvider';
import { palette } from '@/constants';

SystemUI.setBackgroundColorAsync(palette.voidPurple).catch(() => {});

/**
 * Root layout. Wraps every route in:
 *   - SafeAreaProvider — so top-bar / sheet honour insets everywhere
 *   - GestureHandlerRootView — required by the sheet pan gesture
 *
 * The Stack is headerless; each screen sets its own status bar.
 *
 * Route groups:
 *   - `index`     — splash entry (`features/onboarding`)
 *   - `(tabs)`    — primary tabbed experience (today: just the map)
 *   - `(modals)`  — modal-presented routes (group creation, friend detail)
 *
 * Modal presentation is configured in `app/(modals)/_layout.tsx` so this
 * root file stays clean as more modals get added.
 */
export default function RootLayout() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <AuthProvider>
          <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: palette.voidPurple },
            animation: 'fade',
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen
            name="(modals)"
            options={{
              presentation: 'modal',
              animation: 'slide_from_bottom',
              gestureEnabled: true,
              contentStyle: { backgroundColor: palette.voidPurple },
            }}
          />
        </Stack>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: palette.voidPurple,
  },
});
