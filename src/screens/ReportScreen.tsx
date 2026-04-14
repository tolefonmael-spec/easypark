// src/screens/ReportScreen.tsx
import React, { useState, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, Image, Alert, KeyboardAvoidingView,
  Platform, ActivityIndicator, Animated,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Colors, Radius, Shadow, SpotTypeConfig } from '../constants/theme';
import { CameraIcon, GalleryIcon } from '../components/Icons';
import { useLocation } from '../hooks/useLocation';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../hooks/useAuth';
import { createSpot, createReport, reverseGeocode, uploadPhoto } from '../services/spots';
import { SpotStatus, SpotType } from '../types';

type PaidOpt = 'free' | 'paid';

const STATUS_OPTS: { value: SpotStatus; label: string; color: string; desc: string }[] = [
  { value:'free', label:'Libre maintenant', color:Colors.green,  desc:'La place est disponible maintenant' },
  { value:'soon', label:'Bientôt libre',    color:Colors.yellow, desc:'Se libère dans quelques minutes' },
];

const TYPE_OPTS = Object.entries(SpotTypeConfig).map(([k,v]) => ({ value:k as SpotType, ...v }));

export default function ReportScreen() {
  const { colors: C } = useTheme();
  const dynBg    = { backgroundColor: C.bg };
  const dynCard  = { backgroundColor: C.card, borderColor: C.border };
  const dynSurf  = { backgroundColor: C.surf, borderColor: C.border };
  const dynText1 = { color: C.text1 };
  const dynText2 = { color: C.text2 };
  const dynText3 = { color: C.text3 };
  const { location, error: gpsError } = useLocation();
  const { user, refreshProfile }       = useAuth();

  const [status,   setStatus]   = useState<SpotStatus>('free');
  const [type,     setType]     = useState<SpotType>('standard');
  const [paid,     setPaid]     = useState<PaidOpt>('free');
  const [desc,     setDesc]     = useState('');
  const [mins,     setMins]     = useState('10');
  const [photoUri, setPhoto]    = useState<string|null>(null);
  const [loading,  setLoading]  = useState(false);
  const [success,  setSuccess]  = useState(false);
  const [step,     setStep]     = useState(1); // 1,2,3
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const pickPhoto = useCallback(async (fromCamera: boolean) => {
    const perm = fromCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (perm.status !== 'granted') {
      Alert.alert('Permission requise', fromCamera ? "Autorisez l'accès à la caméra." : "Autorisez l'accès à la galerie.");
      return;
    }
    const result = fromCamera
      ? await ImagePicker.launchCameraAsync({ quality:0.7, allowsEditing:true, aspect:[4,3] })
      : await ImagePicker.launchImageLibraryAsync({ mediaTypes:ImagePicker.MediaTypeOptions.Images, quality:0.7, allowsEditing:true, aspect:[4,3] });
    if (!result.canceled && result.assets[0]) setPhoto(result.assets[0].uri);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!user)     { Alert.alert('Connexion requise', 'Connectez-vous pour signaler une place.'); return; }
    if (!location) { Alert.alert('GPS requis', 'Activez la géolocalisation.'); return; }
    if (!desc.trim()) { Alert.alert('Description requise', "Décrivez l'emplacement pour aider les conducteurs."); return; }

    setLoading(true);
    try {
      const address   = await reverseGeocode(location.lat, location.lng);
      let photo_url   = '';
      if (photoUri) {
        try { photo_url = await uploadPhoto('spot-photos', user.id, photoUri); }
        catch (e) { console.warn('Photo upload failed:', e); }
      }
      const parsedMins = Math.max(1, Math.min(60, parseInt(mins)||10));
      const free_at    = status === 'soon' ? new Date(Date.now() + parsedMins*60000).toISOString() : null;

      const spot = await createSpot({
        lat:location.lat, lng:location.lng, address,
        description:desc.trim(), photo_url,
        status, spot_type:type,
        is_paid: paid === 'paid',
        reported_by:user.id, free_at,
      });
      await createReport({
        spot_id:spot.id, user_id:user.id, status,
        description:desc.trim(), photo_url,
        lat:location.lat, lng:location.lng, address,
      });
      await refreshProfile();

      Animated.sequence([
        Animated.timing(fadeAnim, { toValue:0, duration:200, useNativeDriver:true }),
        Animated.timing(fadeAnim, { toValue:1, duration:400, useNativeDriver:true }),
      ]).start();

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false); setDesc(''); setPhoto(null);
        setStatus('free'); setType('standard'); setPaid('free');
        setMins('10'); setStep(1);
      }, 2500);
    } catch (e:any) {
      Alert.alert('Erreur', e.message || 'Une erreur est survenue.');
    } finally { setLoading(false); }
  }, [user, location, desc, photoUri, status, type, paid, mins, refreshProfile, fadeAnim]);

  if (success) {
    return (
      <View style={styles.successScreen}>
        <View style={styles.successCard}>
          <View style={styles.successIcon}><Text style={{ fontSize:40 }}>✓</Text></View>
          <Text style={styles.successTitle}>Signalement publié !</Text>
          <Text style={styles.successSub}>+10 points ajoutés à votre profil</Text>
          <View style={styles.successBadge}><Text style={styles.successBadgeText}>🎯 Merci pour la communauté</Text></View>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex:1, backgroundColor:Colors.bg }} behavior={Platform.OS==='ios'?'padding':undefined}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.container}>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Signaler une place</Text>
          <Text style={styles.subtitle}>Votre position GPS est détectée automatiquement</Text>
        </View>

        {/* GPS Card */}
        <View style={[styles.gpsCard, location ? styles.gpsOk : styles.gpsWait]}>
          <View style={[styles.gpsIconWrap, { backgroundColor: location ? Colors.greenD : Colors.card2 }]}>
            <Text style={{ fontSize:18 }}>{location ? '📍' : '📡'}</Text>
          </View>
          <View style={{ flex:1 }}>
            <Text style={[styles.gpsTitle, { color: location ? Colors.green : Colors.text2 }]}>
              {location ? 'Position acquise' : 'Localisation en cours…'}
            </Text>
            {location
              ? <Text style={styles.gpsSub}>{location.lat.toFixed(5)}, {location.lng.toFixed(5)}</Text>
              : <Text style={styles.gpsSub}>{gpsError || 'Autorisez la géolocalisation dans les réglages'}</Text>
            }
          </View>
          {location && <View style={styles.gpsDot} />}
        </View>

        {/* Step 1 — Statut */}
        <SectionHeader number={1} title="État de la place" active={step >= 1} />
        <View style={styles.statusGrid}>
          {STATUS_OPTS.map(opt => (
            <TouchableOpacity
              key={opt.value}
              style={[styles.statusCard, status===opt.value && { borderColor:opt.color, backgroundColor:opt.color+'18' }]}
              onPress={() => { setStatus(opt.value); setStep(Math.max(step,2)); }}
              activeOpacity={0.8}
            >
              <View style={[styles.statusDot, { backgroundColor: opt.color }]} />
              <Text style={[styles.statusLabel, status===opt.value && { color:opt.color }]}>{opt.label}</Text>
              <Text style={styles.statusDesc}>{opt.desc}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Minutes if soon */}
        {status === 'soon' && (
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Disponible dans (minutes)</Text>
            <TextInput
              style={styles.input}
              value={mins}
              onChangeText={setMins}
              keyboardType="numeric"
              placeholder="10"
              placeholderTextColor={Colors.text3}
              maxLength={2}
            />
          </View>
        )}

        {/* Step 2 — Type + Tarif */}
        <SectionHeader number={2} title="Type et tarification" active={step >= 2} />

        <Text style={styles.fieldLabel}>Type de place</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeScroll}>
          <View style={styles.typeRow}>
            {TYPE_OPTS.map(opt => (
              <TouchableOpacity
                key={opt.value}
                style={[styles.typeChip, type===opt.value && { borderColor:Colors.accent, backgroundColor:Colors.accentD }]}
                onPress={() => setType(opt.value)}
                activeOpacity={0.8}
              >
                <Text style={styles.typeEmoji}>{opt.emoji}</Text>
                <Text style={[styles.typeLabel, type===opt.value && { color:Colors.accent }]}>{opt.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        <Text style={[styles.fieldLabel, { marginTop:16 }]}>Tarification</Text>
        <View style={styles.paidRow}>
          <TouchableOpacity
            style={[styles.paidCard, paid==='free' && styles.paidCardFree]}
            onPress={() => setPaid('free')} activeOpacity={0.8}
          >
            <Text style={styles.paidEmoji}>🆓</Text>
            <Text style={[styles.paidLabel, paid==='free' && { color:Colors.green }]}>Gratuite</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.paidCard, paid==='paid' && styles.paidCardPaid]}
            onPress={() => setPaid('paid')} activeOpacity={0.8}
          >
            <Text style={styles.paidEmoji}>💳</Text>
            <Text style={[styles.paidLabel, paid==='paid' && { color:Colors.purple }]}>Payante</Text>
          </TouchableOpacity>
        </View>

        {/* Step 3 — Description + Photo */}
        <SectionHeader number={3} title="Description et photo" active={step >= 3} />

        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Description de l'endroit <Text style={{ color:Colors.red }}>*</Text></Text>
          <TextInput
            style={[styles.input, styles.textarea]}
            value={desc}
            onChangeText={v => { setDesc(v); if(v.length>0) setStep(Math.max(step,3)); }}
            placeholder="Ex : Après le boulanger, côté droit, panneau 2h max…"
            placeholderTextColor={Colors.text3}
            multiline numberOfLines={4}
            textAlignVertical="top"
            maxLength={300}
          />
          <Text style={styles.charCount}>{desc.length}/300</Text>
        </View>

        {/* Photo */}
        <Text style={styles.fieldLabel}>Photo du lieu</Text>
        {photoUri ? (
          <View style={styles.photoPreview}>
            <Image source={{ uri:photoUri }} style={styles.photoImg} />
            <TouchableOpacity style={styles.photoRemove} onPress={() => setPhoto(null)}>
              <Text style={{ color:'#fff', fontWeight:'700', fontSize:13 }}>✕</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.photoButtons}>
            <TouchableOpacity style={styles.photoBtn} onPress={() => pickPhoto(true)} activeOpacity={0.8}>
              <CameraIcon size={24} color={Colors.text2}/>
              <Text style={styles.photoBtnText}>Appareil photo</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.photoBtn} onPress={() => pickPhoto(false)} activeOpacity={0.8}>
              <GalleryIcon size={24} color={Colors.text2}/>
              <Text style={styles.photoBtnText}>Galerie</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Submit */}
        <TouchableOpacity
          style={[styles.submitBtn, (!location || !desc.trim() || loading) && styles.submitDisabled]}
          onPress={handleSubmit}
          disabled={!location || !desc.trim() || loading}
          activeOpacity={0.85}
        >
          {loading
            ? <ActivityIndicator color="#0a0d14" size="small" />
            : <Text style={styles.submitText}>Publier le signalement  ·  +10 pts</Text>
          }
        </TouchableOpacity>

        <View style={{ height:40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function SectionHeader({ number, title, active }: { number:number; title:string; active:boolean }) {
  return (
    <View style={sStyles.row}>
      <View style={[sStyles.num, active && sStyles.numActive]}>
        <Text style={[sStyles.numText, active && sStyles.numTextActive]}>{number}</Text>
      </View>
      <Text style={[sStyles.title, active && sStyles.titleActive]}>{title}</Text>
    </View>
  );
}
const sStyles = StyleSheet.create({
  row:          { flexDirection:'row', alignItems:'center', gap:10, marginTop:24, marginBottom:12 },
  num:          { width:26, height:26, borderRadius:13, backgroundColor:Colors.card2, borderWidth:1, borderColor:Colors.border, alignItems:'center', justifyContent:'center' },
  numActive:    { backgroundColor:Colors.accent, borderColor:Colors.accent },
  numText:      { fontSize:12, fontWeight:'800', color:Colors.text3 },
  numTextActive:{ color:'#0a0d14' },
  title:        { fontSize:15, fontWeight:'700', color:Colors.text3 },
  titleActive:  { color:Colors.text1 },
});

const styles = StyleSheet.create({
  container:    { padding:20, paddingBottom:60 },
  header:       { marginBottom:22 },
  title:        { fontSize:26, fontWeight:'800', color:Colors.text1, letterSpacing:-0.5, marginBottom:4 },
  subtitle:     { fontSize:14, color:Colors.text2 },

  gpsCard:      { flexDirection:'row', alignItems:'center', gap:12, padding:14, borderRadius:Radius.lg, borderWidth:1, marginBottom:4 },
  gpsOk:        { borderColor:Colors.green+'44', backgroundColor:Colors.greenD },
  gpsWait:      { borderColor:Colors.border, backgroundColor:Colors.card },
  gpsIconWrap:  { width:40, height:40, borderRadius:Radius.md, alignItems:'center', justifyContent:'center' },
  gpsTitle:     { fontSize:14, fontWeight:'700', marginBottom:2 },
  gpsSub:       { fontSize:11, color:Colors.text2, fontFamily:Platform.OS==='ios'?'Menlo':'monospace' },
  gpsDot:       { width:8, height:8, borderRadius:4, backgroundColor:Colors.green },

  statusGrid:   { flexDirection:'row', gap:8 },
  statusCard:   { flex:1, borderWidth:1.5, borderColor:Colors.border, borderRadius:Radius.md, padding:12, alignItems:'center', backgroundColor:Colors.card, gap:6 },
  statusDot:    { width:10, height:10, borderRadius:5 },
  statusLabel:  { fontSize:12, fontWeight:'700', color:Colors.text2, textAlign:'center' },
  statusDesc:   { fontSize:10, color:Colors.text3, textAlign:'center', lineHeight:14 },

  field:        { marginBottom:4 },
  fieldLabel:   { fontSize:13, fontWeight:'600', color:Colors.text2, marginBottom:8 },
  input:        { backgroundColor:Colors.surf, borderWidth:1, borderColor:Colors.border, borderRadius:Radius.md, padding:13, fontSize:14, color:Colors.text1 },
  textarea:     { minHeight:90, textAlignVertical:'top', marginBottom:4 },
  charCount:    { fontSize:11, color:Colors.text3, textAlign:'right', marginBottom:8 },

  typeScroll:   { marginBottom:4 },
  typeRow:      { flexDirection:'row', gap:8, paddingRight:4 },
  typeChip:     { flexDirection:'row', alignItems:'center', gap:7, paddingHorizontal:14, paddingVertical:10, borderRadius:Radius.full, borderWidth:1.5, borderColor:Colors.border, backgroundColor:Colors.card },
  typeEmoji:    { fontSize:15 },
  typeLabel:    { fontSize:12, fontWeight:'700', color:Colors.text2 },

  paidRow:      { flexDirection:'row', gap:10 },
  paidCard:     { flex:1, borderWidth:1.5, borderColor:Colors.border, borderRadius:Radius.lg, paddingVertical:18, alignItems:'center', backgroundColor:Colors.card, gap:6 },
  paidCardFree: { borderColor:Colors.green, backgroundColor:Colors.greenD },
  paidCardPaid: { borderColor:Colors.purple, backgroundColor:Colors.purpleD },
  paidEmoji:    { fontSize:22 },
  paidLabel:    { fontSize:13, fontWeight:'700', color:Colors.text2 },

  photoButtons: { flexDirection:'row', gap:10, marginBottom:4 },
  photoBtn:     { flex:1, borderWidth:1, borderColor:Colors.border, borderRadius:Radius.md, paddingVertical:16, alignItems:'center', gap:6, backgroundColor:Colors.card },
  photoBtnEmoji:{ fontSize:22 },
  photoBtnText: { fontSize:12, fontWeight:'600', color:Colors.text2 },
  photoPreview: { borderRadius:Radius.lg, overflow:'hidden', marginBottom:4, position:'relative' },
  photoImg:     { width:'100%', height:200 },
  photoRemove:  { position:'absolute', top:10, right:10, width:30, height:30, borderRadius:15, backgroundColor:'rgba(0,0,0,0.65)', alignItems:'center', justifyContent:'center' },

  submitBtn:    { backgroundColor:Colors.accent, borderRadius:Radius.lg, paddingVertical:16, alignItems:'center', marginTop:24, ...Shadow.glow },
  submitDisabled:{ backgroundColor:Colors.surf, ...Shadow.sm },
  submitText:   { fontSize:15, fontWeight:'800', color:'#0a0d14', letterSpacing:0.2 },

  successScreen:{ flex:1, backgroundColor:Colors.bg, alignItems:'center', justifyContent:'center', padding:32 },
  successCard:  { alignItems:'center', gap:14 },
  successIcon:  { width:80, height:80, borderRadius:40, backgroundColor:Colors.greenD, borderWidth:2, borderColor:Colors.green, alignItems:'center', justifyContent:'center' },
  successTitle: { fontSize:22, fontWeight:'800', color:Colors.text1, letterSpacing:-0.3 },
  successSub:   { fontSize:15, color:Colors.text2 },
  successBadge: { backgroundColor:Colors.accentD, borderRadius:Radius.full, paddingHorizontal:16, paddingVertical:8, borderWidth:1, borderColor:Colors.borderA },
  successBadgeText: { fontSize:13, color:Colors.accent, fontWeight:'700' },
});
