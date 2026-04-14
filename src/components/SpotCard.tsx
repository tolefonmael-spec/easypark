// src/components/SpotCard.tsx
import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors, Radius } from '../constants/theme';
import { StatusBadge, PriceBadge } from './UI';
import { Spot } from '../types';
import { formatDistance } from '../services/spots';
import { SpotTypeConfig } from '../constants/theme';

interface Props {
  spot: Spot & { distance?: number };
  onPress: () => void;
  onDeclareOccupied?: () => void;
  isSelected?: boolean;
  currentUserId?: string;
}

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "À l'instant";
  if (m < 60) return `il y a ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `il y a ${h}h`;
  return `il y a ${Math.floor(h / 24)}j`;
}

function minsLeft(freeAt: string): number {
  return Math.max(0, Math.round((new Date(freeAt).getTime() - Date.now()) / 60000));
}

export function SpotCard({ spot, onPress, onDeclareOccupied, isSelected, currentUserId }: Props) {
  const typeConfig = SpotTypeConfig[spot.spot_type] || SpotTypeConfig.standard;
  const canDeclareOccupied = currentUserId && (spot.status === 'free' || spot.status === 'soon');

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={[styles.card, isSelected && styles.cardSelected]}
    >
      <View style={styles.row}>
        {/* Photo or icon */}
        <View style={styles.photoWrap}>
          {spot.photo_url ? (
            <Image source={{ uri: spot.photo_url }} style={styles.photo} />
          ) : (
            <View style={styles.photoPlaceholder}>
              <Text style={{ fontSize: 24 }}>{typeConfig.icon}</Text>
            </View>
          )}
        </View>

        {/* Info */}
        <View style={styles.info}>
          <View style={styles.badgeRow}>
            <StatusBadge status={spot.status} />
            <PriceBadge isPaid={spot.is_paid} />
            {spot.status === 'soon' && spot.free_at && (
              <View style={styles.timerBadge}>
                <Text style={styles.timerText}>⏱ {minsLeft(spot.free_at)} min</Text>
              </View>
            )}
          </View>

          <Text style={styles.address} numberOfLines={2}>
            {spot.address || 'Position signalée'}
          </Text>

          {spot.description ? (
            <Text style={styles.desc} numberOfLines={2}>{spot.description}</Text>
          ) : null}

          <View style={styles.metaRow}>
            <Text style={styles.meta}>🕐 {relativeTime(spot.last_updated || spot.created_at)}</Text>
            {spot.profiles?.username && (
              <Text style={styles.meta}>👤 @{spot.profiles.username}</Text>
            )}
            {spot.distance != null && (
              <Text style={[styles.meta, { color: Colors.accent, fontWeight: '700' }]}>
                📍 {formatDistance(spot.distance)}
              </Text>
            )}
          </View>
        </View>
      </View>

      {/* Declare occupied button */}
      {canDeclareOccupied && onDeclareOccupied && (
        <TouchableOpacity style={styles.occupiedBtn} onPress={onDeclareOccupied} activeOpacity={0.8}>
          <Text style={styles.occupiedBtnText}>🔴 Déclarer occupée</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    marginHorizontal: 16,
    marginBottom: 10,
  },
  cardSelected: {
    borderColor: Colors.accent,
    backgroundColor: 'rgba(99,179,237,0.07)',
  },
  row: { flexDirection: 'row', gap: 12 },
  photoWrap: { width: 70, height: 70, borderRadius: Radius.md, overflow: 'hidden', flexShrink: 0 },
  photo: { width: '100%', height: '100%' },
  photoPlaceholder: {
    width: '100%', height: '100%',
    backgroundColor: Colors.surf,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Colors.border,
    borderRadius: Radius.md,
  },
  info: { flex: 1, minWidth: 0 },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginBottom: 6 },
  timerBadge: {
    backgroundColor: Colors.yellowD, borderRadius: 99,
    paddingHorizontal: 8, paddingVertical: 3,
    borderWidth: 1, borderColor: Colors.yellow + '44',
  },
  timerText: { fontSize: 10, color: Colors.yellow, fontWeight: '700' },
  address: { fontSize: 13, fontWeight: '700', color: Colors.text1, marginBottom: 3 },
  desc:    { fontSize: 12, color: Colors.text2, marginBottom: 4, lineHeight: 17 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  meta:    { fontSize: 11, color: Colors.text3 },
  occupiedBtn: {
    marginTop: 10,
    backgroundColor: Colors.redD,
    borderRadius: Radius.sm,
    padding: 9,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.red + '44',
  },
  occupiedBtnText: { fontSize: 12, fontWeight: '700', color: Colors.red },
});
