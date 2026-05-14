import React from 'react';
import { StyleSheet, View, type ViewProps } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { palette, radius, shadow } from '@/constants';

type Props = ViewProps & {
  variant?: 'standard' | 'strong' | 'flat';
  cornerRadius?: number;
  children?: React.ReactNode;
};

/**
 * Translucent, lightly bordered surface used for every floating panel,
 * sheet header, top-bar pill, etc. Layers a soft top-down gradient on top
 * of a tinted dark fill so it reads as glass — no native blur required, so
 * it works in Expo Go and looks consistent across iOS/Android.
 */
export function GlassCard({
  variant = 'standard',
  cornerRadius = radius.lg,
  style,
  children,
  ...rest
}: Props) {
  const fill =
    variant === 'strong'
      ? palette.glassFillStrong
      : variant === 'flat'
        ? 'rgba(28, 16, 64, 0.4)'
        : palette.glassFill;

  return (
    <View
      style={[
        styles.base,
        { borderRadius: cornerRadius, backgroundColor: fill },
        variant !== 'flat' && shadow.card,
        style,
      ]}
      {...rest}
    >
      <LinearGradient
        pointerEvents="none"
        colors={['rgba(255, 255, 255, 0.06)', 'rgba(255, 255, 255, 0)']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={[StyleSheet.absoluteFill, { borderRadius: cornerRadius }]}
      />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.glassStroke,
    overflow: 'hidden',
  },
});
