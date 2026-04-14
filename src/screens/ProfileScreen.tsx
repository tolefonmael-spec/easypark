// src/screens/ProfileScreen.tsx
import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, RefreshControl, Image, ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Colors, Radius, Shadow } from '../constants/theme';
import { supabase } from '../services/supabase';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../hooks/useAuth';
import { uploadPhoto } from '../services/spots';
import { signOut } from '../services/auth';
import { Report, Badge } from '../types';

const LEVEL_LABELS: Record<number,string> = {1:'Débutant',2:'Contributeur',3:'Expert',4:'Maître',5:'Légende'};
const LEVEL_COLORS: Record<number,string> = {1:Colors.text3,2:Colors.green,3:Colors.accent,4:Colors.purple,5:Colors.gold};
const VEHICLE_LABELS: Record<string,string> = {car:'🚗 Voiture',motorcycle:'🛵 Moto',truck:'🚐 Utilitaire',other:'🚲 Autre'};

function avatarEmoji(u:string) {
  const e=['🧑','👨','👩','🧔','🧕','👱','🧑‍💼','👨‍💻'];
  return e[u?.charCodeAt(0)%e.length]||'👤';
}

export default function ProfileScreen() {
  const { colors: C } = useTheme();
  const dynBg    = { backgroundColor: C.bg };
  const dynCard  = { backgroundColor: C.card, borderColor: C.border };
  const dynSurf  = { backgroundColor: C.surf, borderColor: C.border };
  const dynText1 = { color: C.text1 };
  const dynText2 = { color: C.text2 };
  const dynText3 = { color: C.text3 };
  const navigation = useNavigation<any>();
  const { user, profile, loading, refreshProfile } = useAuth();
  const [reports,    setReports]    = useState<Report[]>([]);
  const [allBadges,  setAllBadges]  = useState<Badge[]>([]);
  const [myBadgeIds, setMyBadgeIds] = useState<Set<number>>(new Set());
  const [refreshing, setRefreshing] = useState(false);
  const [uploading,  setUploading]  = useState(false);

  useEffect(() => { if(user) loadData(); }, [user]);

  async function loadData() {
    if(!user) return;
    const [{ data:reps }, { data:allB }, { data:myB }] = await Promise.all([
      supabase.from('reports').select('*,spots(address,status)').eq('user_id',user.id).order('created_at',{ascending:false}).limit(10),
      supabase.from('badges').select('*'),
      supabase.from('user_badges').select('badge_id').eq('user_id',user.id),
    ]);
    setReports((reps||[]) as Report[]);
    setAllBadges((allB||[]) as Badge[]);
    setMyBadgeIds(new Set((myB||[]).map((b:any)=>b.badge_id)));
  }

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refreshProfile(), loadData()]);
    setRefreshing(false);
  }, [refreshProfile]);

  const handlePickAvatar = useCallback(async () => {
    if (!user) return;
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permission requise','Autorisez l\'accès à la galerie dans les réglages.'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing:true, aspect:[1,1], quality:0.8,
    });
    if (result.canceled || !result.assets[0]) return;
    setUploading(true);
    try {
      const url = await uploadPhoto('avatars', user.id, result.assets[0].uri);
      const { error: dbErr } = await supabase.from('profiles').update({ avatar_url: url }).eq('id', user.id);
      if (dbErr) throw dbErr;
      await refreshProfile();
      Alert.alert('✅ Photo mise à jour', 'Votre photo de profil a été modifiée.');
    } catch(e:any) {
      console.error('Avatar upload error:', e);
      Alert.alert('Erreur upload', e.message || "Impossible d'uploader la photo. Vérifiez votre connexion.");
    }
    finally { setUploading(false); }
  }, [user, refreshProfile]);

  if (loading) return <View style={[styles.centered,dynBg]}><ActivityIndicator size="large" color={Colors.accent}/></View>;

  if (!user || !profile) {
    return (
      <View style={[styles.notAuth,dynBg]}>
        <View style={styles.notAuthIcon}><Text style={{fontSize:36}}>👤</Text></View>
        <Text style={styles.notAuthTitle}>Non connecté</Text>
        <Text style={styles.notAuthSub}>Connectez-vous pour accéder à votre profil et contribuer.</Text>
      </View>
    );
  }

  const relPercent = Math.min(100, Number(profile.reliability||100));
  const levelColor = LEVEL_COLORS[profile.level]||Colors.text3;

  return (
    <ScrollView style={[styles.container,dynBg]} contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.accent}/>}>

      {/* Top bar with settings button */}
      <View style={styles.topBar}>
        <Text style={[styles.pageTitle,dynText1]}>Mon profil</Text>
        <TouchableOpacity style={styles.settingsBtn} onPress={()=>navigation?.navigate('Settings')} activeOpacity={0.8}>
          <Ionicons name="settings-outline" size={20} color={Colors.text2}/>
        </TouchableOpacity>
      </View>

      {/* Profile Card */}
      <View style={styles.profileCard}>
        <View style={[styles.banner,{backgroundColor:levelColor+'18'}]}/>
        <View style={styles.profileBody}>
          {/* Avatar */}
          <TouchableOpacity style={styles.avatarWrap} onPress={handlePickAvatar} activeOpacity={0.85}>
            {uploading
              ? <View style={styles.avatarOuter}><ActivityIndicator color={Colors.accent}/></View>
              : profile.avatar_url
                ? <View style={styles.avatarOuter}><Image source={{uri:profile.avatar_url}} style={styles.avatarImg}/></View>
                : <View style={styles.avatarOuter}><View style={styles.avatarDefault}><Text style={styles.avatarEmoji}>{avatarEmoji(profile.username)}</Text></View></View>
            }
            <View style={styles.avatarEditBadge}>
              <Ionicons name="camera" size={10} color="#0a0d14"/>
            </View>
          </TouchableOpacity>

          <Text style={styles.profileName}>{profile.full_name||profile.username}</Text>
          <Text style={styles.profileHandle}>@{profile.username}</Text>

          <View style={[styles.levelBadge,{borderColor:levelColor+'55',backgroundColor:levelColor+'15'}]}>
            <View style={[styles.levelDot,{backgroundColor:levelColor}]}/>
            <Text style={[styles.levelText,{color:levelColor}]}>{LEVEL_LABELS[profile.level]||'Débutant'}</Text>
          </View>

          {/* Info pills */}
          <View style={styles.infoPills}>
            {profile.city&&<View style={styles.pill}><Ionicons name="location-outline" size={11} color={Colors.text3}/><Text style={styles.pillText}>{profile.city}</Text></View>}
            {profile.vehicle_type&&<View style={styles.pill}><Text style={styles.pillText}>{VEHICLE_LABELS[profile.vehicle_type]||profile.vehicle_type}</Text></View>}
            <View style={styles.pill}><Ionicons name="calendar-outline" size={11} color={Colors.text3}/><Text style={styles.pillText}>Depuis {new Date(profile.created_at).toLocaleDateString('fr-FR',{month:'short',year:'numeric'})}</Text></View>
          </View>

          {/* Stats */}
          <View style={styles.statsRow}>
            <StatBox value={(profile.points||0).toLocaleString()} label="Points" color={Colors.gold}/>
            <StatBox value={String(reports.length)+(reports.length>=10?'+':'')} label="Signalements" color={Colors.accent}/>
            <StatBox value={String(myBadgeIds.size)} label="Badges" color={Colors.purple}/>
            <StatBox value={`${profile.level}/5`} label="Niveau" color={levelColor}/>
          </View>

          {/* Reliability */}
          <View style={styles.relSection}>
            <View style={styles.relHeader}>
              <Text style={styles.relLabel}>Fiabilité communautaire</Text>
              <Text style={[styles.relValue,{color:relPercent>75?Colors.green:relPercent>50?Colors.yellow:Colors.red}]}>{relPercent.toFixed(1)}%</Text>
            </View>
            <View style={styles.relTrack}>
              <View style={[styles.relFill,{width:`${relPercent}%` as any,backgroundColor:relPercent>75?Colors.green:relPercent>50?Colors.yellow:Colors.red}]}/>
            </View>
            <Text style={styles.relHint}>Basé sur les évaluations des autres conducteurs</Text>
          </View>
        </View>
      </View>

      {/* Badges */}
      <SectionTitle title={`Badges  ${myBadgeIds.size}/${allBadges.length}`}/>
      <View style={styles.badgesGrid}>
        {allBadges.map(b=>(
          <TouchableOpacity key={b.id}
            style={[styles.badgeCell,!myBadgeIds.has(b.id)&&styles.badgeLocked]}
            onPress={()=>myBadgeIds.has(b.id)&&Alert.alert(b.emoji+' '+b.name,b.description+'\n\n+'+b.points_reward+' points')}
            activeOpacity={0.8}>
            <Text style={styles.badgeEmoji}>{b.emoji}</Text>
            <Text style={styles.badgeName} numberOfLines={2}>{b.name}</Text>
            {myBadgeIds.has(b.id)&&<View style={styles.badgeCheck}><Ionicons name="checkmark" size={8} color="#fff"/></View>}
          </TouchableOpacity>
        ))}
      </View>

      {/* History */}
      <SectionTitle title="Historique récent"/>
      {reports.length===0
        ? <View style={styles.emptyHist}><Text style={styles.emptyHistText}>Aucun signalement pour l'instant — commencez à contribuer !</Text></View>
        : reports.map(r=><HistItem key={r.id} report={r}/>)
      }

      {/* Logout */}
      <TouchableOpacity style={styles.logoutBtn} activeOpacity={0.8}
        onPress={()=>Alert.alert('Déconnexion','Voulez-vous vous déconnecter ?',[
          {text:'Annuler',style:'cancel'},
          {text:'Déconnecter',style:'destructive',onPress:async()=>{await signOut();}},
        ])}>
        <Ionicons name="log-out-outline" size={18} color={Colors.text3}/>
        <Text style={styles.logoutText}>Déconnexion</Text>
      </TouchableOpacity>

      <View style={{height:40}}/>
    </ScrollView>
  );
}

function StatBox({value,label,color}:{value:string;label:string;color:string}) {
  return (
    <View style={stStyles.box}>
      <Text style={[stStyles.val,{color}]}>{value}</Text>
      <Text style={stStyles.lbl}>{label}</Text>
    </View>
  );
}
const stStyles = StyleSheet.create({
  box:{flex:1,backgroundColor:Colors.surf,borderRadius:Radius.md,padding:11,alignItems:'center',borderWidth:1,borderColor:Colors.border},
  val:{fontSize:17,fontWeight:'800',letterSpacing:-0.5},
  lbl:{fontSize:10,color:Colors.text3,textTransform:'uppercase',letterSpacing:0.5,marginTop:3},
});

function SectionTitle({title}:{title:string}) {
  return <Text style={{fontSize:11,fontWeight:'800',textTransform:'uppercase',letterSpacing:1,color:Colors.text3,marginTop:24,marginBottom:12}}>{title}</Text>;
}

function HistItem({report}:{report:Report}) {
  const icons:Record<string,string>={free:'🟢',occupied:'🔴',soon:'🟡'};
  const labels:Record<string,string>={free:'Libre',occupied:'Occupée',soon:'Bientôt libre'};
  const diff=Date.now()-new Date(report.created_at).getTime();
  const m=Math.floor(diff/60000);
  const time=m<60?`il y a ${m} min`:m<1440?`il y a ${Math.floor(m/60)}h`:`il y a ${Math.floor(m/1440)}j`;
  return (
    <View style={hStyles.row}>
      <View style={hStyles.ico}><Text style={{fontSize:16}}>{icons[report.status]||'📍'}</Text></View>
      <View style={{flex:1,minWidth:0}}>
        <Text style={hStyles.addr} numberOfLines={1}>{report.spots?.address||'Place signalée'}</Text>
        <Text style={hStyles.meta}>{labels[report.status]||report.status} · {time}</Text>
      </View>
      <Text style={hStyles.pts}>+10 pts</Text>
    </View>
  );
}
const hStyles = StyleSheet.create({
  row:{flexDirection:'row',alignItems:'center',gap:12,backgroundColor:Colors.card,borderRadius:Radius.md,padding:12,marginBottom:8,borderWidth:1,borderColor:Colors.border},
  ico:{width:34,height:34,borderRadius:10,backgroundColor:Colors.accentD,alignItems:'center',justifyContent:'center',flexShrink:0},
  addr:{fontSize:13,fontWeight:'700',color:Colors.text1,marginBottom:2},
  meta:{fontSize:11,color:Colors.text3},
  pts:{fontSize:13,fontWeight:'800',color:Colors.green,flexShrink:0},
});

const styles = StyleSheet.create({
  container:     {flex:1,backgroundColor:Colors.bg},
  content:       {padding:20},
  centered:      {flex:1,backgroundColor:Colors.bg,alignItems:'center',justifyContent:'center'},
  notAuth:       {flex:1,backgroundColor:Colors.bg,alignItems:'center',justifyContent:'center',padding:32},
  notAuthIcon:   {width:72,height:72,borderRadius:36,backgroundColor:Colors.card,alignItems:'center',justifyContent:'center',marginBottom:16,...Shadow.md},
  notAuthTitle:  {fontSize:20,fontWeight:'800',color:Colors.text1,marginBottom:8},
  notAuthSub:    {fontSize:14,color:Colors.text2,textAlign:'center',lineHeight:21},
  topBar:        {flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginBottom:16},
  pageTitle:     {fontSize:26,fontWeight:'800',color:Colors.text1,letterSpacing:-0.5},
  settingsBtn:   {width:40,height:40,borderRadius:Radius.md,backgroundColor:Colors.card,borderWidth:1,borderColor:Colors.border,alignItems:'center',justifyContent:'center'},
  profileCard:   {backgroundColor:Colors.card,borderRadius:Radius.xl,borderWidth:1,borderColor:Colors.border,overflow:'hidden',...Shadow.md,marginBottom:8},
  banner:        {height:64},
  profileBody:   {padding:18,paddingTop:0},
  avatarWrap:    {marginTop:-34,marginBottom:10,position:'relative',alignSelf:'flex-start'},
  avatarOuter:   {width:68,height:68,borderRadius:34,borderWidth:3,borderColor:Colors.bg,overflow:'hidden',backgroundColor:Colors.card2,alignItems:'center',justifyContent:'center',...Shadow.sm},
  avatarImg:     {width:62,height:62,borderRadius:31},
  avatarDefault: {width:62,height:62,borderRadius:31,backgroundColor:Colors.card2,alignItems:'center',justifyContent:'center'},
  avatarEmoji:   {fontSize:28},
  avatarEditBadge:{position:'absolute',bottom:0,right:0,width:22,height:22,borderRadius:11,backgroundColor:Colors.accent,alignItems:'center',justifyContent:'center',borderWidth:2,borderColor:Colors.bg},
  profileName:   {fontSize:18,fontWeight:'800',color:Colors.text1,letterSpacing:-0.3},
  profileHandle: {fontSize:13,color:Colors.text3,marginBottom:8},
  levelBadge:    {flexDirection:'row',alignItems:'center',gap:5,alignSelf:'flex-start',paddingHorizontal:11,paddingVertical:4,borderRadius:Radius.full,borderWidth:1,marginBottom:10},
  levelDot:      {width:6,height:6,borderRadius:3},
  levelText:     {fontSize:12,fontWeight:'800'},
  infoPills:     {flexDirection:'row',flexWrap:'wrap',gap:7,marginBottom:14},
  pill:          {flexDirection:'row',alignItems:'center',gap:4,paddingHorizontal:10,paddingVertical:5,backgroundColor:Colors.surf,borderRadius:Radius.full,borderWidth:1,borderColor:Colors.border},
  pillText:      {fontSize:11,fontWeight:'600',color:Colors.text2},
  statsRow:      {flexDirection:'row',gap:7,marginBottom:16},
  relSection:    {marginBottom:8},
  relHeader:     {flexDirection:'row',justifyContent:'space-between',marginBottom:6},
  relLabel:      {fontSize:12,color:Colors.text2,fontWeight:'600'},
  relValue:      {fontSize:13,fontWeight:'800'},
  relTrack:      {height:6,backgroundColor:Colors.surf,borderRadius:3,overflow:'hidden',marginBottom:5},
  relFill:       {height:'100%',borderRadius:3},
  relHint:       {fontSize:11,color:Colors.text3},
  badgesGrid:    {flexDirection:'row',flexWrap:'wrap',gap:8},
  badgeCell:     {width:'22%',backgroundColor:Colors.surf,borderRadius:Radius.md,padding:10,alignItems:'center',borderWidth:1,borderColor:Colors.border,position:'relative'},
  badgeLocked:   {opacity:0.22},
  badgeEmoji:    {fontSize:22,marginBottom:5},
  badgeName:     {fontSize:10,fontWeight:'700',color:Colors.text2,textAlign:'center'},
  badgeCheck:    {position:'absolute',top:5,right:5,width:14,height:14,borderRadius:7,backgroundColor:Colors.green,alignItems:'center',justifyContent:'center'},
  emptyHist:     {alignItems:'center',paddingVertical:20,backgroundColor:Colors.card,borderRadius:Radius.md,borderWidth:1,borderColor:Colors.border,padding:20},
  emptyHistText: {fontSize:13,color:Colors.text3,textAlign:'center'},
  logoutBtn:     {flexDirection:'row',alignItems:'center',justifyContent:'center',gap:8,marginTop:20,padding:14,borderRadius:Radius.md,borderWidth:1,borderColor:Colors.border},
  logoutText:    {fontSize:14,fontWeight:'600',color:Colors.text3},
});
