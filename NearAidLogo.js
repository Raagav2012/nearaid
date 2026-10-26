import React from 'react';
import { Text, View } from 'react-native';
import Svg, { Circle, Rect } from 'react-native-svg';
import { colors } from './theme';

const NAVY = '#0F2747', TEAL = '#2EC4B6', AMBER = '#FFB703';

// Logo: radar rings (the 400 m alert area), amber responder dots, and a medical cross at the center
export default function NearAidLogo({ size = 32, withWord = false }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      <Svg width={size} height={size} viewBox="0 0 64 64" accessibilityLabel="NearAid logo">
        <Rect width="64" height="64" rx="16" fill={NAVY} />
        <Circle cx="32" cy="32" r="27" stroke={TEAL} strokeOpacity="0.35" strokeWidth="2" fill="none" />
        <Circle cx="32" cy="32" r="20" stroke={TEAL} strokeOpacity="0.65" strokeWidth="2" fill="none" />
        <Circle cx="32" cy="32" r="13" stroke={TEAL} strokeWidth="2.5" fill="none" />
        <Circle cx="32" cy="32" r="10" fill="#fff" />
        <Rect x="29.5" y="25.5" width="5" height="13" rx="1.2" fill={NAVY} />
        <Rect x="25.5" y="29.5" width="13" height="5" rx="1.2" fill={NAVY} />
        <Circle cx="50.4" cy="13.6" r="3.6" fill={AMBER} stroke={NAVY} strokeWidth="1.5" />
        <Circle cx="14.1" cy="38.5" r="3.6" fill={AMBER} stroke={NAVY} strokeWidth="1.5" />
        <Circle cx="48.5" cy="41.5" r="3.6" fill={AMBER} stroke={NAVY} strokeWidth="1.5" />
        <Circle cx="27.5" cy="57.6" r="3.6" fill={AMBER} stroke={NAVY} strokeWidth="1.5" />
      </Svg>
      {withWord && <Text style={{ fontSize: size * 0.72, fontWeight: '800', color: colors.ink }}>NearAid</Text>}
    </View>
  );
}
