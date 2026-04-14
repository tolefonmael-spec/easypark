// src/screens/AuthScreen.tsx
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { Colors, Radius, Shadow } from '../constants/theme';
import { LogoFull } from '../components/Logo';
import { useTheme } from '../contexts/ThemeContext';
import { signIn, signUp } from '../services/auth';

type Mode = 'login' | 'signup';
type Step = 1 | 2;

const VEHICLE_OPTIONS = [
  { value:'car',        label:'🚗 Voiture' },
  { value:'motorcycle', label:'🛵 Moto / Scooter' },
  { value:'truck',      label:'🚐 Utilitaire' },
  { value:'other',      label:'🚲 Autre' },
];

const GENDER_OPTIONS = [
  { value:'male',   label:'Homme' },
  { value:'female', label:'Femme' },
  { value:'other',  label:'Autre' },
];

export default function AuthScreen() {
  const { colors: C } = useTheme();
  const dynBg    = { backgroundColor: C.bg };
  const dynCard  = { backgroundColor: C.card, borderColor: C.border };
  const dynSurf  = { backgroundColor: C.surf, borderColor: C.border };
  const dynText1 = { color: C.text1 };
  const dynText2 = { color: C.text2 };
  const dynText3 = { color: C.text3 };
  const [mode,        setMode]     = useState<Mode>('login');
  const [step,        setStep]     = useState<Step>(1);
  // Step 1
  const [email,       setEmail]    = useState('');
  const [password,    setPass]     = useState('');
  const [showPass,    setShowPass] = useState(false);
  // Step 2
  const [username,    setUser]     = useState('');
  const [firstName,   setFirst]    = useState('');
  const [lastName,    setLast]     = useState('');
  const [phone,       setPhone]    = useState('');
  const [city,        setCity]     = useState('Paris');
  const [gender,      setGender]   = useState('');
  const [vehicle,     setVehicle]  = useState('car');

  const [loading,     setLoading]  = useState(false);
  const [error,       setError]    = useState('');

  function reset() { setError(''); }

  async function handleLogin() {
    reset();
    if (!email.trim())  { setError('Email obligatoire.'); return; }
    if (!password)      { setError('Mot de passe obligatoire.'); return; }
    setLoading(true);
    const { error:e } = await signIn(email.trim(), password);
    setLoading(false);
    if (e) {
      let msg = e.message;
      if (msg.includes('Invalid login credentials')) msg = 'Email ou mot de passe incorrect.';
      else if (msg.includes('Email not confirmed'))  msg = 'Email non confirmé → Supabase → Auth → Providers → Email → désactivez "Confirm email".';
      else if (msg.includes('rate limit'))           msg = 'Trop de tentatives, attendez 1 minute.';
      setError(msg);
    }
  }

  function handleSignupStep1() {
    reset();
    if (!email.trim())          { setError('Email obligatoire.'); return; }
    if (!password || password.length < 8) { setError('Mot de passe : 8 caractères minimum.'); return; }
    setStep(2);
  }

  async function handleSignupSubmit() {
    reset();
    const clean = (username.trim()||email.split('@')[0]).replace(/[^a-zA-Z0-9_]/g,'_').toLowerCase().slice(0,20);
    setLoading(true);
    const { data, error:e } = await signUp(email.trim(), password, clean,
      `${firstName.trim()} ${lastName.trim()}`.trim(), { phone, city, gender, vehicle_type: vehicle });
    setLoading(false);
    if (e) {
      let msg = e.message;
      if (msg.includes('already')) msg = 'Email déjà utilisé. Connectez-vous.';
      if (msg.includes('rate limit')) msg = 'Trop de tentatives, attendez 1 minute.';
      setError(msg); return;
    }
    if (!data?.session) {
      Alert.alert('📧 Vérifiez vos emails',
        `Lien envoyé à ${email}\n\nOu désactivez "Confirm email" dans Supabase → Auth → Providers → Email.`,
        [{ text:'OK', onPress:()=>{ setMode('login'); setStep(1); }}]);
    }
  }

  function switchMode() {
    setMode(m => m==='login'?'signup':'login');
    setStep(1); reset();
  }

  return (
    <KeyboardAvoidingView style={[{flex:1},dynBg]} behavior={Platform.OS==='ios'?'padding':undefined}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        {/* Logo */}
        <View style={styles.logoRow}>
          <LogoIcon size={44} color={Colors.accent}/>
          <Text style={styles.logoText}>Easy<Text style={{color:Colors.accent}}>Park</Text></Text>
        </View>

        {/* Title */}
        <Text style={styles.title}>
          {mode==='login' ? 'Bon retour 👋' : step===1 ? 'Créer un compte' : 'Votre profil'}
        </Text>
        <Text style={styles.sub}>
          {mode==='login' ? 'Connectez-vous pour contribuer.' :
           step===1 ? 'Étape 1/2 — Vos identifiants' : 'Étape 2/2 — Informations personnelles'}
        </Text>

        {/* Step indicator signup */}
        {mode==='signup' && (
          <View style={styles.stepRow}>
            <View style={[styles.stepDot, {backgroundColor:Colors.accent}]}/>
            <View style={[styles.stepLine, {backgroundColor:step===2?Colors.accent:Colors.border}]}/>
            <View style={[styles.stepDot, {backgroundColor:step===2?Colors.accent:Colors.border}]}/>
          </View>
        )}

        {/* LOGIN */}
        {mode==='login' && (
          <View style={styles.form}>
            <Field label="Email" value={email} onChangeText={setEmail}
              placeholder="vous@email.com" keyboardType="email-address" autoCapitalize="none"/>
            <Field label="Mot de passe" value={password} onChangeText={setPass}
              placeholder="••••••••" secureTextEntry={!showPass}
              rightEl={
                <TouchableOpacity onPress={()=>setShowPass(v=>!v)} style={styles.eyeBtn}>
                  <Text style={styles.eyeText}>{showPass?'🙈':'👁️'}</Text>
                </TouchableOpacity>
              }/>
            {error ? <View style={styles.errBox}><Text style={styles.errText}>{error}</Text></View> : null}
            <SubmitBtn title="Se connecter" onPress={handleLogin} loading={loading}/>
          </View>
        )}

        {/* SIGNUP STEP 1 */}
        {mode==='signup' && step===1 && (
          <View style={styles.form}>
            <Field label="Email *" value={email} onChangeText={setEmail}
              placeholder="vous@email.com" keyboardType="email-address" autoCapitalize="none"/>
            <Field label="Mot de passe * (8 min.)" value={password} onChangeText={setPass}
              placeholder="••••••••" secureTextEntry={!showPass}
              rightEl={
                <TouchableOpacity onPress={()=>setShowPass(v=>!v)} style={styles.eyeBtn}>
                  <Text style={styles.eyeText}>{showPass?'🙈':'👁️'}</Text>
                </TouchableOpacity>
              }/>
            {error ? <View style={styles.errBox}><Text style={styles.errText}>{error}</Text></View> : null}
            <SubmitBtn title="Continuer →" onPress={handleSignupStep1} loading={false}/>
          </View>
        )}

        {/* SIGNUP STEP 2 */}
        {mode==='signup' && step===2 && (
          <View style={styles.form}>
            <View style={styles.row2}>
              <View style={{flex:1}}>
                <Field label="Prénom" value={firstName} onChangeText={setFirst} placeholder="Lucas" autoCapitalize="words"/>
              </View>
              <View style={{flex:1}}>
                <Field label="Nom" value={lastName} onChangeText={setLast} placeholder="Moreau" autoCapitalize="words"/>
              </View>
            </View>
            <Field label="Nom d'utilisateur *" value={username} onChangeText={setUser}
              placeholder="lucas_paris" autoCapitalize="none" autoCorrect={false}/>
            <Field label="Téléphone" value={phone} onChangeText={setPhone}
              placeholder="+33 6 00 00 00 00" keyboardType="phone-pad"/>
            <Field label="Ville" value={city} onChangeText={setCity} placeholder="Paris"/>

            {/* Genre */}
            <Text style={styles.fieldLabel}>Genre</Text>
            <View style={styles.optRow}>
              {GENDER_OPTIONS.map(o => (
                <TouchableOpacity key={o.value}
                  style={[styles.optChip, gender===o.value && styles.optChipOn]}
                  onPress={()=>setGender(o.value)} activeOpacity={0.8}>
                  <Text style={[styles.optText, gender===o.value && {color:Colors.accent}]}>{o.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Véhicule */}
            <Text style={styles.fieldLabel}>Type de véhicule principal</Text>
            <View style={styles.optRow}>
              {VEHICLE_OPTIONS.map(o => (
                <TouchableOpacity key={o.value}
                  style={[styles.optChip, vehicle===o.value && styles.optChipOn]}
                  onPress={()=>setVehicle(o.value)} activeOpacity={0.8}>
                  <Text style={[styles.optText, vehicle===o.value && {color:Colors.accent}]}>{o.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {error ? <View style={styles.errBox}><Text style={styles.errText}>{error}</Text></View> : null}
            <View style={styles.btnRow}>
              <TouchableOpacity style={styles.backBtn} onPress={()=>{setStep(1);reset();}}>
                <Text style={styles.backText}>← Retour</Text>
              </TouchableOpacity>
              <View style={{flex:1}}>
                <SubmitBtn title="Créer mon compte" onPress={handleSignupSubmit} loading={loading}/>
              </View>
            </View>

            <Text style={styles.legal}>
              En créant un compte, vous acceptez nos{' '}
              <Text style={{color:Colors.accent}}>Conditions d'utilisation</Text> et notre{' '}
              <Text style={{color:Colors.accent}}>Politique de confidentialité</Text>.
            </Text>
          </View>
        )}

        {/* Switch */}
        <View style={styles.switchRow}>
          <Text style={styles.switchText}>
            {mode==='login' ? 'Pas de compte ? ' : 'Déjà un compte ? '}
          </Text>
          <TouchableOpacity onPress={switchMode}>
            <Text style={styles.switchLink}>{mode==='login'?"S'inscrire":'Se connecter'}</Text>
          </TouchableOpacity>
        </View>

        <View style={{height:40}}/>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({ label, rightEl, ...props }: any) {
  return (
    <View style={fStyles.wrap}>
      <Text style={fStyles.label}>{label}</Text>
      <View style={fStyles.inputWrap}>
        <TextInput style={[fStyles.input, rightEl&&{paddingRight:44}]} placeholderTextColor={Colors.text3} {...props}/>
        {rightEl && <View style={fStyles.right}>{rightEl}</View>}
      </View>
    </View>
  );
}
const fStyles = StyleSheet.create({
  wrap:      {marginBottom:12},
  label:     {fontSize:13,fontWeight:'600',color:Colors.text2,marginBottom:7},
  inputWrap: {position:'relative'},
  input:     {backgroundColor:Colors.surf,borderWidth:1,borderColor:Colors.border,borderRadius:Radius.md,padding:13,fontSize:14,color:Colors.text1},
  right:     {position:'absolute',right:0,top:0,bottom:0,width:44,alignItems:'center',justifyContent:'center'},
});

function SubmitBtn({ title, onPress, loading }: { title:string; onPress:()=>void; loading:boolean }) {
  return (
    <TouchableOpacity style={[sbStyles.btn, loading&&{opacity:0.6}]} onPress={onPress} disabled={loading} activeOpacity={0.85}>
      {loading ? <ActivityIndicator color="#0a0d14"/> : <Text style={sbStyles.text}>{title}</Text>}
    </TouchableOpacity>
  );
}
const sbStyles = StyleSheet.create({
  btn:  {backgroundColor:Colors.accent,borderRadius:Radius.lg,paddingVertical:15,alignItems:'center',marginTop:6,...Shadow.glow},
  text: {fontSize:15,fontWeight:'800',color:'#0a0d14'},
});

const styles = StyleSheet.create({
  container:  {padding:24,paddingTop:60},
  logoRow:    {flexDirection:'row',alignItems:'center',gap:10,marginBottom:28},
  logoText:   {fontSize:24,fontWeight:'800',color:Colors.text1,letterSpacing:-0.5},
  title:      {fontSize:26,fontWeight:'800',color:Colors.text1,letterSpacing:-0.5,marginBottom:5},
  sub:        {fontSize:14,color:Colors.text2,marginBottom:20},
  stepRow:    {flexDirection:'row',alignItems:'center',marginBottom:22,gap:0},
  stepDot:    {width:10,height:10,borderRadius:5},
  stepLine:   {flex:1,height:2,marginHorizontal:6},
  form:       {gap:0},
  row2:       {flexDirection:'row',gap:10},
  fieldLabel: {fontSize:13,fontWeight:'600',color:Colors.text2,marginBottom:8,marginTop:4},
  optRow:     {flexDirection:'row',flexWrap:'wrap',gap:8,marginBottom:14},
  optChip:    {paddingHorizontal:14,paddingVertical:8,borderRadius:Radius.full,borderWidth:1,borderColor:Colors.border,backgroundColor:Colors.card},
  optChipOn:  {borderColor:Colors.accent,backgroundColor:Colors.accentD},
  optText:    {fontSize:12,fontWeight:'600',color:Colors.text2},
  errBox:     {backgroundColor:Colors.redD,borderRadius:Radius.sm,padding:12,marginBottom:8,borderWidth:1,borderColor:Colors.red+'44'},
  errText:    {fontSize:13,color:Colors.red,fontWeight:'600'},
  btnRow:     {flexDirection:'row',gap:10,alignItems:'center',marginTop:6},
  backBtn:    {paddingHorizontal:16,paddingVertical:15,borderRadius:Radius.lg,borderWidth:1,borderColor:Colors.border},
  backText:   {fontSize:14,fontWeight:'600',color:Colors.text2},
  legal:      {fontSize:11,color:Colors.text3,textAlign:'center',lineHeight:17,marginTop:14},
  switchRow:  {flexDirection:'row',justifyContent:'center',alignItems:'center',marginTop:22},
  switchText: {fontSize:14,color:Colors.text2},
  switchLink: {fontSize:14,color:Colors.accent,fontWeight:'700'},
  eyeBtn:     {padding:8},
  eyeText:    {fontSize:16},
});
