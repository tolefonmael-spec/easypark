// src/components/Logo.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import { useTheme } from '../contexts/ThemeContext';
import { Radius } from '../constants/theme';

interface LogoIconProps { size?: number }

export function LogoPin({ size = 40 }: LogoIconProps) {
  const { colors } = useTheme();
  const s = size;
  const cx = s / 2;
  // circle center at 40% height, radius 36% of size
  const cr = s * 0.36;
  const cy = s * 0.40;

  return (
    <View style={{
      width: s, height: s,
      borderRadius: s * 0.22,
      backgroundColor: colors.accent,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    }}>
      <Svg width={s * 0.7} height={s * 0.82} viewBox="0 0 70 82">
        {/* Pin circle */}
        <Circle cx="35" cy="28" r="25" fill="white" opacity="0.95"/>
        {/* Pin tail */}
        <Path d="M18 46 Q26 62 35 75 Q44 62 52 46 Q44 52 35 52 Q26 52 18 46Z" fill="white" opacity="0.95"/>
        {/* Letter P — bold, clean */}
        <Path
          d="M25 17 L25 39 M25 17 L35 17 Q43 17 43 23 Q43 29 35 29 L25 29"
          fill="none"
          stroke={colors.accent}
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </View>
  );
}

export function LogoFull({ size = 36 }: LogoIconProps) {
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection:'row', alignItems:'center', gap:10 }}>
      <LogoPin size={size}/>
      <Text style={{
        fontSize: size * 0.65,
        fontWeight: '800',
        letterSpacing: -0.5,
        color: colors.text1,
      }}>
        Easy<Text style={{ color: colors.accent }}>Park</Text>
      </Text>
    </View>
  );
}
