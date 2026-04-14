// src/components/UI.tsx
import React from 'react';
import {
  View, Text, TouchableOpacity, ActivityIndicator,
  StyleSheet, ViewStyle, TextStyle,
} from 'react-native';
import { Colors, Radius } from '../constants/theme';

// ── StatusBadge ─────────────────────────────────
interface StatusBadgeProps { status: 'free' | 'occupied' | 'soon'; style?: ViewStyle }
export function StatusBadge({ status, style }: StatusBadgeProps) {
  const map = {
    free:     { label: 'Libre',         color: Colors.green,  bg: Colors.greenD },
    occupied: { label: 'Occupée',       color: Colors.red,    bg: Colors.redD },
    soon:     { label: 'Bientôt libre', color: Colors.yellow, bg: Colors.yellowD },
  };
  const cfg = map[status];
  return (
    <View style={[{ backgroundColor: cfg.bg, borderRadius: 99, paddingHorizontal: 10, paddingVertical: 3, borderWidth: 1, borderColor: cfg.color + '44' }, style]}>
      <Text style={{ color: cfg.color, fontSize: 11, fontWeight: '700' }}>{cfg.label}</Text>
    </View>
  );
}

// ── PriceBadge ───────────────────────────────────
interface PriceBadgeProps { isPaid: boolean; style?: ViewStyle }
export function PriceBadge({ isPaid, style }: PriceBadgeProps) {
  return (
    <View style={[{
      backgroundColor: isPaid ? Colors.purpleD : Colors.greenD,
      borderRadius: 99, paddingHorizontal: 10, paddingVertical: 3,
      borderWidth: 1, borderColor: isPaid ? Colors.purple + '44' : Colors.green + '44',
    }, style]}>
      <Text style={{ color: isPaid ? Colors.purple : Colors.green, fontSize: 11, fontWeight: '700' }}>
        {isPaid ? '💰 Payante' : '🆓 Gratuite'}
      </Text>
    </View>
  );
}

// ── Button ───────────────────────────────────────
interface ButtonProps {
  title: string; onPress: () => void; loading?: boolean;
  variant?: 'primary' | 'outline' | 'danger' | 'success';
  style?: ViewStyle; textStyle?: TextStyle; icon?: string; disabled?: boolean;
}
export function Button({ title, onPress, loading, variant = 'primary', style, textStyle, icon, disabled }: ButtonProps) {
  const variantStyles = {
    primary: { bg: Colors.accent, text: '#07090f', border: Colors.accent },
    outline: { bg: 'transparent', text: Colors.text1, border: Colors.border },
    danger:  { bg: Colors.redD, text: Colors.red, border: Colors.red + '44' },
    success: { bg: Colors.greenD, text: Colors.green, border: Colors.green + '44' },
  };
  const vs = variantStyles[variant];
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      style={[{
        backgroundColor: vs.bg, borderRadius: Radius.md, borderWidth: 1,
        borderColor: vs.border, paddingVertical: 13, paddingHorizontal: 22,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
        opacity: (disabled || loading) ? 0.5 : 1,
      }, style]}
    >
      {loading
        ? <ActivityIndicator size="small" color={vs.text} />
        : <>
            {icon && <Text style={{ fontSize: 16 }}>{icon}</Text>}
            <Text style={[{ color: vs.text, fontSize: 14, fontWeight: '700' }, textStyle]}>{title}</Text>
          </>
      }
    </TouchableOpacity>
  );
}

// ── Card ─────────────────────────────────────────
interface CardProps { children: React.ReactNode; style?: ViewStyle; onPress?: () => void }
export function Card({ children, style, onPress }: CardProps) {
  const cardStyle = [styles.card, style];
  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={cardStyle}>
        {children}
      </TouchableOpacity>
    );
  }
  return <View style={cardStyle}>{children}</View>;
}

// ── EmptyState ───────────────────────────────────
interface EmptyStateProps { icon: string; title: string; subtitle?: string }
export function EmptyState({ icon, title, subtitle }: EmptyStateProps) {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyIcon}>{icon}</Text>
      <Text style={styles.emptyTitle}>{title}</Text>
      {subtitle && <Text style={styles.emptySub}>{subtitle}</Text>}
    </View>
  );
}

// ── LoadingScreen ────────────────────────────────
export function LoadingScreen() {
  return (
    <View style={styles.loadingScreen}>
      <ActivityIndicator size="large" color={Colors.accent} />
    </View>
  );
}

// ── SectionTitle ─────────────────────────────────
export function SectionTitle({ children }: { children: string }) {
  return <Text style={styles.sectionTitle}>{children}</Text>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
  },
  empty: { alignItems: 'center', padding: 40 },
  emptyIcon:  { fontSize: 36, marginBottom: 12 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: Colors.text2, marginBottom: 6 },
  emptySub:   { fontSize: 13, color: Colors.text3, textAlign: 'center' },
  loadingScreen: { flex: 1, backgroundColor: Colors.bg, alignItems: 'center', justifyContent: 'center' },
  sectionTitle:  { fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1, color: Colors.text3, marginBottom: 12 },
});
