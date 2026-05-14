import React from 'react';
import {
  Pressable,
  StyleSheet,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { motion } from '@/constants';

type Props = Omit<PressableProps, 'style'> & {
  style?: StyleProp<ViewStyle>;
  scaleTo?: number;
  haptic?: boolean;
  children: React.ReactNode;
};

/**
 * Animated `Pressable` — supports Reanimated `useAnimatedStyle` on the
 * outer wrapper so consumers can pass animated styles for transforms,
 * shadows, etc. directly via the `style` prop.
 */
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/**
 * Pressable that scales down on press for that crisp, native iOS tap feel.
 * Used everywhere — buttons, FABs, sheet rows, marker chips.
 *
 * The consumer's `style` is applied to the OUTER `Pressable` so layout
 * props (`flex`, `width`, `margin`, etc.) take effect inside the parent
 * flexbox. The inner `Animated.View` only handles the scale transform
 * and `stretches` to fill its parent so the press-scale animation
 * covers the whole visible area.
 *
 * We use `Animated.createAnimatedComponent(Pressable)` for the outer
 * so consumers can also pass Reanimated animated styles via `style`
 * (e.g. selection glow on the vibe-picker cards).
 */
export function PressableScale({
  style,
  scaleTo = 0.96,
  children,
  onPressIn,
  onPressOut,
  ...rest
}: Props) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      style={style}
      onPressIn={(e) => {
        scale.value = withSpring(scaleTo, motion.spring.press);
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        scale.value = withSpring(1, motion.spring.release);
        onPressOut?.(e);
      }}
      {...rest}
    >
      <Animated.View style={[styles.inner, animatedStyle]}>
        {children}
      </Animated.View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  inner: {
    flexGrow: 1,
    alignSelf: 'stretch',
  },
});
