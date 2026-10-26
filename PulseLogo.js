import React from 'react';
import { Text, View } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';
import { colors } from './theme';

export default function PulseLogo({ size = 32, withWord = false }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      <Svg width={size} height={size} viewBox="0 0 64 64" accessibilityLabel="Pulse logo">
        <Rect width="64" height="64" rx="16" fill={colors.emergency} />
        <Path d="M10 35H23L28 22L37 46L43 31H54" stroke="#fff" strokeWidth="5" fill="none"
          strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
      {withWord && <Text style={{ fontSize: size * 0.72, fontWeight: '800', color: colors.ink }}>Pulse</Text>}
    </View>
  );
}
