// src/components/Icons.tsx
// Icônes modernes via @expo/vector-icons (natif Expo Go, pas de dépendance externe)
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { Colors } from '../constants/theme';

interface IconProps {
  size?:  number;
  color?: string;
}

// ── Tab icons ───────────────────────────────────────────────
export function MapTabIcon({ size=24, color=Colors.text1 }: IconProps) {
  return <Ionicons name="map-outline" size={size} color={color}/>;
}
export function ReportTabIcon({ size=24, color=Colors.text1 }: IconProps) {
  return <Ionicons name="location-outline" size={size} color={color}/>;
}
export function LeaderboardTabIcon({ size=24, color=Colors.text1 }: IconProps) {
  return <Ionicons name="podium-outline" size={size} color={color}/>;
}
export function ProfileTabIcon({ size=24, color=Colors.text1 }: IconProps) {
  return <Ionicons name="person-outline" size={size} color={color}/>;
}

// ── Action icons ────────────────────────────────────────────
export function NavigateIcon({ size=20, color=Colors.text1 }: IconProps) {
  return <Ionicons name="navigate-outline" size={size} color={color}/>;
}
export function CameraIcon({ size=24, color=Colors.text2 }: IconProps) {
  return <Feather name="camera" size={size} color={color}/>;
}
export function GalleryIcon({ size=24, color=Colors.text2 }: IconProps) {
  return <Feather name="image" size={size} color={color}/>;
}
export function GpsIcon({ size=20, color=Colors.text1 }: IconProps) {
  return <Ionicons name="locate-outline" size={size} color={color}/>;
}
export function EditIcon({ size=14, color=Colors.text1 }: IconProps) {
  return <Feather name="edit-2" size={size} color={color}/>;
}
export function LogoutIcon({ size=16, color=Colors.text2 }: IconProps) {
  return <Feather name="log-out" size={size} color={color}/>;
}
export function CheckCircleIcon({ size=20, color=Colors.green }: IconProps) {
  return <Feather name="check-circle" size={size} color={color}/>;
}
export function CloseCircleIcon({ size=20, color=Colors.red }: IconProps) {
  return <Feather name="x-circle" size={size} color={color}/>;
}
export function ClockIcon({ size=12, color=Colors.text3 }: IconProps) {
  return <Feather name="clock" size={size} color={color}/>;
}
export function UserIcon({ size=12, color=Colors.text3 }: IconProps) {
  return <Feather name="user" size={size} color={color}/>;
}
export function PinIcon({ size=12, color=Colors.accent }: IconProps) {
  return <Feather name="map-pin" size={size} color={color}/>;
}
export function ArrowRightIcon({ size=16, color=Colors.text2 }: IconProps) {
  return <Feather name="arrow-right" size={size} color={color}/>;
}
export function RefreshIcon({ size=16, color=Colors.text2 }: IconProps) {
  return <Feather name="refresh-cw" size={size} color={color}/>;
}
export function FilterIcon({ size=16, color=Colors.text2 }: IconProps) {
  return <Feather name="filter" size={size} color={color}/>;
}

// ── Spot type icons ─────────────────────────────────────────
export function CarIcon({ size=20, color=Colors.text2 }: IconProps) {
  return <Ionicons name="car-outline" size={size} color={color}/>;
}
export function MotorbikeIcon({ size=20, color=Colors.text2 }: IconProps) {
  return <MaterialCommunityIcons name="motorbike" size={size} color={color}/>;
}
export function TruckIcon({ size=20, color=Colors.text2 }: IconProps) {
  return <MaterialCommunityIcons name="truck-outline" size={size} color={color}/>;
}
export function BoltIcon({ size=20, color=Colors.text2 }: IconProps) {
  return <Ionicons name="flash-outline" size={size} color={color}/>;
}
export function WheelchairIcon({ size=20, color=Colors.text2 }: IconProps) {
  return <MaterialCommunityIcons name="wheelchair-accessibility" size={size} color={color}/>;
}
export function PaidIcon({ size=20, color=Colors.purple }: IconProps) {
  return <Ionicons name="card-outline" size={size} color={color}/>;
}
export function FreeIcon({ size=20, color=Colors.green }: IconProps) {
  return <MaterialCommunityIcons name="tag-heart-outline" size={size} color={color}/>;
}

// ── Star rating ─────────────────────────────────────────────
export function StarIcon({ size=18, color=Colors.gold, filled=true }: IconProps & { filled?:boolean }) {
  return <Ionicons name={filled ? 'star' : 'star-outline'} size={size} color={color}/>;
}

// ── Status dot ──────────────────────────────────────────────
export function StatusDot({ status, size=8 }: { status:string; size?:number }) {
  const colors: Record<string,string> = {
    free:'#34c77b', occupied:'#ff6b6b', soon:'#f5b731'
  };
  return <View style={{ width:size, height:size, borderRadius:size/2, backgroundColor:colors[status]||'#7a93b3' }}/>;
}

// ── Logo icon standalone ────────────────────────────────────
export function LogoIcon({ size=32, color=Colors.accent }: IconProps) {
  return (
    <View style={{
      width:size, height:size, borderRadius:size*0.28,
      backgroundColor:color, alignItems:'center', justifyContent:'center',
    }}>
      <Ionicons name="location" size={Math.round(size*0.55)} color="#0a0d14"/>
    </View>
  );
}
