import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { PressableScale } from '@/components/ui';
import { palette, radius, typography } from '@/constants';
import type { QuickAction } from '@/types';

/**
 * Each button is a layered surface, recipe (back → front):
 *
 *   1. Outer shadow wrap — coloured glow tinted to the action hue
 *   2. Base 3-stop diagonal gradient (highlight → mid → shade)
 *   3. Top sheen — white-translucent → clear (≈55% height) for the
 *      glassy "lit-from-above" feel
 *   4. Bottom dim — clear → black-translucent (≈40% height) for depth
 *   5. Hairline white border — the "raised edge" of a physical chip
 *   6. Centred bold label
 */

type GradientStops = readonly [string, string, string];

type ActionDef = {
  id: QuickAction;
  label: string;
  gradient: GradientStops;
  glow: string;
};

const ACTIONS: ActionDef[] = [
  {
    id: 'im_good',
    label: "I'm Good",
    gradient: ['#7CF6D6', '#4DE6C2', '#2DB591'],
    glow: '#4DE6C2',
  },
  {
    id: 'heading_home',
    label: 'Heading Home',
    gradient: ['#A78DFF', '#7B61FF', '#4D2DCA'],
    glow: '#7B61FF',
  },
  {
    id: 'end_night',
    label: 'End Night',
    gradient: ['#FFA0DA', '#FF5FA2', '#D63B97'],
    glow: '#FF5FA2',
  },
];

type Props = {
  onAction?: (action: QuickAction) => void;
};

/**
 * Three equal-width action chips that stretch edge-to-edge of their
 * parent row. The chips themselves are `flex: 1`, the row uses a fixed
 * `gap`, so the layout naturally produces:
 *
 *     ╔═════╗  ╔═════╗  ╔═════╗
 *     ║left ║  ║cent.║  ║right║
 *     ╚═════╝  ╚═════╝  ╚═════╝
 *
 * — same width per chip, same gap between chips, with the first chip's
 * left edge flush with the row's left edge and the last chip's right
 * edge flush with the row's right edge.
 */
export function QuickActions({ onAction }: Props) {
  return (
    <View style={styles.row}>
      {ACTIONS.map((action) => (
        <ActionChip
          key={action.id}
          action={action}
          onPress={() => onAction?.(action.id)}
        />
      ))}
    </View>
  );
}

function ActionChip({
  action,
  onPress,
}: {
  action: ActionDef;
  onPress: () => void;
}) {
  return (
    <PressableScale
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={action.label}
      scaleTo={0.94}
      style={[styles.shadow, { shadowColor: action.glow }]}
    >
      <View style={styles.clip}>
        <LinearGradient
          colors={action.gradient}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 0.9, y: 1 }}
          style={styles.fill}
        />

        <LinearGradient
          colors={['rgba(255, 255, 255, 0.38)', 'rgba(255, 255, 255, 0)']}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.sheen}
          pointerEvents="none"
        />

        <LinearGradient
          colors={['rgba(0, 0, 0, 0)', 'rgba(0, 0, 0, 0.18)']}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.bottomDim}
          pointerEvents="none"
        />

        <View style={styles.content}>
          <Text style={styles.label} numberOfLines={1} adjustsFontSizeToFit>
            {action.label}
          </Text>
        </View>

        <View pointerEvents="none" style={styles.innerStroke} />
      </View>
    </PressableScale>
  );
}

/**
 * Geometry: each chip uses `flex: 1` + `flexBasis: 0` so the three chips
 * get IDENTICAL widths regardless of label length. The clip layer has an
 * explicit `height` so they're also identical in height. Together those
 * two props guarantee perfectly uniform pills across the row.
 */
const CHIP_HEIGHT = 64;

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 10,
  },
  shadow: {
    flex: 1,
    flexBasis: 0,
    borderRadius: radius.lg,
    shadowOpacity: 0.7,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 8 },
  },
  clip: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    height: CHIP_HEIGHT,
  },
  fill: {
    ...StyleSheet.absoluteFillObject,
  },
  sheen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '55%',
  },
  bottomDim: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '40%',
  },
  innerStroke: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.28)',
    borderTopColor: 'rgba(255, 255, 255, 0.55)',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    ...typography.bodySmall,
    color: palette.moonlight,
    fontWeight: '900',
    fontSize: 14,
    letterSpacing: 0.3,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.25)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});
