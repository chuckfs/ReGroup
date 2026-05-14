import React from 'react';
import { StyleSheet, Text, type TextStyle } from 'react-native';

import { palette } from '@/constants';

/**
 * Minimal text-glyph "icons". Keeps the project zero-dep for icons until
 * we wire @expo/vector-icons; swap implementations later without touching
 * call-sites.
 */
const GLYPHS = {
  menu: '☰',
  chat: '✦',
  locate: '◎',
  back: '‹',
  more: '···',
  arrow: '›',
  signal: '◌',
  star: '★',
} as const;

export type IconName = keyof typeof GLYPHS;

type Props = {
  name: IconName;
  size?: number;
  color?: string;
  style?: TextStyle;
};

export function IconGlyph({
  name,
  size = 18,
  color = palette.moonlight,
  style,
}: Props) {
  return (
    <Text
      allowFontScaling={false}
      style={[styles.base, { fontSize: size, color }, style]}
    >
      {GLYPHS[name]}
    </Text>
  );
}

const styles = StyleSheet.create({
  base: {
    fontWeight: '700',
    textAlign: 'center',
  },
});
