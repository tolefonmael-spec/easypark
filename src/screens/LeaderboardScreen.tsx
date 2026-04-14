// src/screens/LeaderboardScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, RefreshControl,
} from 'react-native';
import { Colors, Radius } from '../constants/theme';
import { supabase } from '../services/supabase';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../hooks/useAuth';
import { Profile } from '../types';
import { EmptyState, LoadingScreen } from '../components/UI';

type SortKey = 'points' | 'reliability';

function avatarEmoji(username: string): string {
  const e = ['🧑','👨','👩','🧔','🧕','👱','🧑‍💼','👨‍💻'];
  return e[username.charCodeAt(0) % e.length] || '👤';
}

export default function LeaderboardScreen() {
  const { colors: C } = useTheme();
  const dynBg    = { backgroundColor: C.bg };
  const dynCard  = { backgroundColor: C.card, borderColor: C.border };
  const dynSurf  = { backgroundColor: C.surf, borderColor: C.border };
  const dynText1 = { color: C.text1 };
  const dynText2 = { color: C.text2 };
  const dynText3 = { color: C.text3 };
  const { user } = useAuth();
  const [data,       setData]       = useState<Profile[]>([]);
  const [sort,       setSort]       = useState<SortKey>('points');
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [members,    setMembers]    = useState(0);
  const [todayReps,  setTodayReps]  = useState(0);

  useEffect(() => { loadAll(); }, [sort]);

  async function loadAll() {
    setLoading(true);
    const [{ data: lb }, { count: mem }, { count: rep }] = await Promise.all([
      supabase.from('profiles').select('*').order(sort, { ascending: false }).limit(20),
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('reports').select('*', { count: 'exact', head: true })
        .gte('created_at', new Date(new Date().setHours(0,0,0,0)).toISOString()),
    ]);
    setData((lb || []) as Profile[]);
    setMembers(mem || 0);
    setTodayReps(rep || 0);
    setLoading(false);
  }

  async function onRefresh() { setRefreshing(true); await loadAll(); setRefreshing(false); }

  const rankIcon  = (i: number) => ['🥇','🥈','🥉'][i] || String(i + 1);
  const rankColor = (i: number) => ['#f6c90e','#94a3b8','#b45309'][i] || Colors.text3;

  if (loading) return <LoadingScreen />;

  return (
    <View style={[styles.container,dynBg]}>
      <FlatList
        data={data}
        keyExtractor={i => i.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.accent} />}
        contentContainerStyle={{ paddingBottom: 100 }}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.title}>Classement</Text>
            <Text style={styles.subtitle}>Les contributeurs les plus actifs d'Easy Park.</Text>

            {/* Stats */}
            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <Text style={styles.statVal}>{members.toLocaleString()}</Text>
                <Text style={styles.statLbl}>Membres</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statVal}>{todayReps.toLocaleString()}</Text>
                <Text style={styles.statLbl}>Signalements/jour</Text>
              </View>
            </View>

            {/* Sort tabs */}
            <View style={styles.tabs}>
              <TouchableOpacity style={[styles.tab, sort==='points' && styles.tabOn]} onPress={() => setSort('points')}>
                <Text style={[styles.tabText, sort==='points' && styles.tabTextOn]}>Points</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.tab, sort==='reliability' && styles.tabOn]} onPress={() => setSort('reliability')}>
                <Text style={[styles.tabText, sort==='reliability' && styles.tabTextOn]}>Fiabilité</Text>
              </TouchableOpacity>
            </View>
          </View>
        }
        ListEmptyComponent={<EmptyState icon="🏆" title="Aucun contributeur" subtitle="Soyez le premier !" />}
        renderItem={({ item, index }) => {
          const isMe = user?.id === item.id;
          return (
            <View style={[styles.row, isMe && styles.rowMe]}>
              <Text style={[styles.rank, { color: rankColor(index) }]}>{rankIcon(index)}</Text>
              <View style={[styles.avatar, isMe && styles.avatarMe]}>
                <Text style={{ fontSize: 18 }}>{avatarEmoji(item.username)}</Text>
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.username} numberOfLines={1}>
                  {item.username}{isMe ? ' (vous)' : ''}
                </Text>
                <Text style={styles.userMeta}>{item.city} · Niveau {item.level}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.score}>
                  {sort === 'points' ? (item.points || 0).toLocaleString() : Number(item.reliability || 100).toFixed(1) + '%'}
                </Text>
                <Text style={styles.scoreLabel}>{sort === 'points' ? 'pts' : 'fiabilité'}</Text>
              </View>
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header:    { padding: 20, paddingBottom: 8 },
  title:     { fontSize: 26, fontWeight: '800', color: Colors.text1, letterSpacing: -0.5, marginBottom: 4 },
  subtitle:  { fontSize: 14, color: Colors.text2, marginBottom: 20 },
  statsRow:  { flexDirection: 'row', gap: 10, marginBottom: 16 },
  statCard:  { flex: 1, backgroundColor: Colors.card, borderRadius: Radius.lg, padding: 16, borderWidth: 1, borderColor: Colors.border, alignItems: 'center' },
  statVal:   { fontSize: 22, fontWeight: '800', color: Colors.text1, letterSpacing: -0.5 },
  statLbl:   { fontSize: 11, color: Colors.text3, marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.5 },
  tabs:      { flexDirection: 'row', gap: 6, backgroundColor: Colors.surf, padding: 4, borderRadius: Radius.md, marginBottom: 8 },
  tab:       { flex: 1, paddingVertical: 8, borderRadius: Radius.sm, alignItems: 'center' },
  tabOn:     { backgroundColor: Colors.accent },
  tabText:   { fontSize: 13, fontWeight: '700', color: Colors.text2 },
  tabTextOn: { color: '#07090f' },
  row:       { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: Colors.border },
  rowMe:     { backgroundColor: Colors.accentD },
  rank:      { fontSize: 16, fontWeight: '800', width: 30, textAlign: 'center' },
  avatar:    { width: 38, height: 38, borderRadius: 19, backgroundColor: Colors.surf, borderWidth: 2, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  avatarMe:  { borderColor: Colors.accent },
  username:  { fontSize: 14, fontWeight: '700', color: Colors.text1 },
  userMeta:  { fontSize: 11, color: Colors.text3, marginTop: 1 },
  score:     { fontSize: 15, fontWeight: '800', color: Colors.text1 },
  scoreLabel:{ fontSize: 10, color: Colors.text3 },
});
