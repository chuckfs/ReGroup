import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, {
  Defs,
  LinearGradient as SvgLinearGradient,
  Path,
  Stop,
} from 'react-native-svg';

import { palette } from '@/constants';

type Props = {
  width: number;
  height: number;
};

/**
 * Stylised glowing "city streets". Hand-drawn SVG paths that loosely echo
 * a Brooklyn-ish grid bent into curves. The look is intentionally not
 * cartographic — it's mood lighting under the floating markers.
 *
 * When real maps land, this whole component is replaced by an actual map
 * (MapLibre/Mapbox) layered behind the markers; the public shape stays
 * `(width, height)` so swapping it doesn't ripple through callers.
 */
export function MapPaths({ width, height }: Props) {
  const w = width;
  const h = height;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg width={w} height={h}>
        <Defs>
          <SvgLinearGradient id="road-main" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%" stopColor={palette.electric} stopOpacity={0.0} />
            <Stop offset="35%" stopColor={palette.electric} stopOpacity={0.55} />
            <Stop offset="70%" stopColor={palette.magenta} stopOpacity={0.55} />
            <Stop offset="100%" stopColor={palette.magenta} stopOpacity={0.0} />
          </SvgLinearGradient>

          <SvgLinearGradient id="road-soft" x1="0" y1="1" x2="1" y2="0">
            <Stop offset="0%" stopColor={palette.orchid} stopOpacity={0.0} />
            <Stop offset="50%" stopColor={palette.orchid} stopOpacity={0.35} />
            <Stop offset="100%" stopColor={palette.lilac} stopOpacity={0.0} />
          </SvgLinearGradient>

          <SvgLinearGradient id="road-trail" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={palette.blush} stopOpacity={0.0} />
            <Stop offset="50%" stopColor={palette.blush} stopOpacity={0.42} />
            <Stop offset="100%" stopColor={palette.blush} stopOpacity={0.0} />
          </SvgLinearGradient>
        </Defs>

        {/* Background "fog" of soft hairline streets */}
        <Path
          d={`M -20 ${h * 0.18} C ${w * 0.3} ${h * 0.05}, ${w * 0.55} ${h * 0.35}, ${w + 40} ${h * 0.22}`}
          stroke={palette.glassStroke}
          strokeWidth={1}
          fill="none"
        />
        <Path
          d={`M -20 ${h * 0.74} C ${w * 0.35} ${h * 0.6}, ${w * 0.65} ${h * 0.95}, ${w + 40} ${h * 0.82}`}
          stroke={palette.glassStroke}
          strokeWidth={1}
          fill="none"
        />
        <Path
          d={`M ${w * 0.1} -20 C ${w * 0.2} ${h * 0.3}, ${w * 0.05} ${h * 0.7}, ${w * 0.18} ${h + 20}`}
          stroke={palette.glassStroke}
          strokeWidth={1}
          fill="none"
        />
        <Path
          d={`M ${w * 0.86} -20 C ${w * 0.75} ${h * 0.35}, ${w * 0.95} ${h * 0.65}, ${w * 0.82} ${h + 20}`}
          stroke={palette.glassStroke}
          strokeWidth={1}
          fill="none"
        />

        {/* Glowing main avenue – diagonal sweep through the city */}
        <Path
          d={`M -30 ${h * 0.62} C ${w * 0.25} ${h * 0.42}, ${w * 0.55} ${h * 0.55}, ${w + 30} ${h * 0.3}`}
          stroke="url(#road-main)"
          strokeWidth={4}
          strokeLinecap="round"
          fill="none"
        />

        {/* Cross-street arc – upper right */}
        <Path
          d={`M ${w * 0.45} ${h * 0.08} C ${w * 0.62} ${h * 0.2}, ${w * 0.78} ${h * 0.18}, ${w * 0.95} ${h * 0.32}`}
          stroke="url(#road-soft)"
          strokeWidth={3}
          strokeLinecap="round"
          fill="none"
        />

        {/* Lower-left park trail */}
        <Path
          d={`M ${w * 0.06} ${h * 0.7} C ${w * 0.18} ${h * 0.78}, ${w * 0.3} ${h * 0.74}, ${w * 0.42} ${h * 0.88}`}
          stroke="url(#road-trail)"
          strokeWidth={3}
          strokeLinecap="round"
          fill="none"
        />

        {/* Subtle horizontal seam – feels like a transit line */}
        <Path
          d={`M -10 ${h * 0.5} C ${w * 0.4} ${h * 0.46}, ${w * 0.6} ${h * 0.54}, ${w + 10} ${h * 0.5}`}
          stroke={palette.hairline}
          strokeWidth={1}
          strokeDasharray="3 6"
          fill="none"
        />
      </Svg>
    </View>
  );
}
