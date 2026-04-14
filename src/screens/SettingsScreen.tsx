// src/screens/SettingsScreen.tsx
import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Switch, Alert, Linking, ActivityIndicator,
} from 'react-native';
import { Colors, Radius, Shadow, THEME_META, THEMES, ThemeKey } from '../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../services/supabase';
import { signOut } from '../services/auth';

interface SettingRowProps {
  label: string; sub?: string; value?: boolean;
  onToggle?: (v:boolean)=>void; onPress?: ()=>void;
  rightEl?: React.ReactNode; danger?: boolean;
}

function SettingRow({ label, sub, value, onToggle, onPress, rightEl, danger }: SettingRowProps) {
  return (
    <TouchableOpacity
      style={styles.settingRow}
      onPress={onPress}
      disabled={!onPress && onToggle===undefined}
      activeOpacity={onPress?0.7:1}
    >
      <View style={{flex:1}}>
        <Text style={[styles.settingLabel, danger&&{color:Colors.red}]}>{label}</Text>
        {sub && <Text style={styles.settingSub}>{sub}</Text>}
      </View>
      {onToggle!==undefined && value!==undefined
        ? <Switch value={value} onValueChange={onToggle} trackColor={{false:Colors.border,true:Colors.accent}} thumbColor="#fff"/>
        : rightEl
          ? rightEl
          : onPress
            ? <Text style={styles.chevron}>›</Text>
            : null
      }
    </TouchableOpacity>
  );
}

function Section({ title, children }: { title:string; children:React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionCard}>{children}</View>
    </View>
  );
}

function ThemePicker() {
  const { themeKey, setTheme, colors: C } = useTheme();
  const keys = Object.keys(THEME_META) as ThemeKey[];

  return (
    <View style={{ marginBottom: 24 }}>
      <Text style={{
        fontSize: 11, fontWeight: '800', textTransform: 'uppercase',
        letterSpacing: 1.2, color: C.text3, marginBottom: 14, paddingLeft: 2,
      }}>
        Apparence
      </Text>

      {/* Grid 2 colonnes */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
        {keys.map(k => {
          const meta = THEME_META[k];
          const active = themeKey === k;
          return (
            <TouchableOpacity
              key={k}
              onPress={() => setTheme(k)}
              activeOpacity={0.8}
              style={{
                width: '47%',
                borderRadius: 16,
                borderWidth: active ? 2 : 1,
                borderColor: active ? C.accent : C.border,
                backgroundColor: meta.preview[0],
                paddingVertical: 16,
                paddingHorizontal: 14,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
              }}
            >
              {/* Cercles couleur */}
              <View style={{ flexDirection: 'row', gap: 5 }}>
                {meta.preview.slice(1).map((col, i) => (
                  <View key={i} style={{
                    width: 20, height: 20, borderRadius: 10,
                    backgroundColor: col,
                    borderWidth: 1.5,
                    borderColor: 'rgba(255,255,255,0.15)',
                  }}/>
                ))}
              </View>

              {/* Nom du thème */}
              <View style={{ flex: 1 }}>
                <Text style={{
                  fontSize: 13,
                  fontWeight: active ? '800' : '600',
                  color: active ? C.accent : '#ccc',
                  letterSpacing: 0.1,
                }} numberOfLines={1}>
                  {meta.label}
                </Text>
                {active && (
                  <Text style={{ fontSize: 10, color: C.accent, marginTop: 2, fontWeight: '600' }}>
                    Actif
                  </Text>
                )}
              </View>

              {/* Indicateur actif */}
              {active && (
                <View style={{
                  width: 8, height: 8, borderRadius: 4,
                  backgroundColor: C.accent,
                }}/>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

export default function SettingsScreen() {
  const { colors: C } = useTheme();
  const dynBg    = { backgroundColor: C.bg };
  const dynCard  = { backgroundColor: C.card, borderColor: C.border };
  const dynSurf  = { backgroundColor: C.surf, borderColor: C.border };
  const dynText1 = { color: C.text1 };
  const dynText2 = { color: C.text2 };
  const dynText3 = { color: C.text3 };
  const navigation = useNavigation<any>();
  const { user, profile, refreshProfile } = useAuth();
  const [notifs,    setNotifs]    = useState(profile?.notifications_enabled ?? true);
  const [radius,    setRadius]    = useState(profile?.radius_km ?? 1);
  const [saving,    setSaving]    = useState(false);
  const [deleting,  setDeleting]  = useState(false);

  const savePrefs = useCallback(async (key:string, value:any) => {
    if (!user) return;
    setSaving(true);
    await supabase.from('profiles').update({[key]:value}).eq('id',user.id);
    await refreshProfile();
    setSaving(false);
  }, [user, refreshProfile]);

  const handleDeleteAccount = useCallback(() => {
    Alert.alert(
      'Supprimer le compte',
      'Cette action est irréversible. Tous vos signalements et données seront supprimés.',
      [
        { text:'Annuler', style:'cancel' },
        { text:'Supprimer définitivement', style:'destructive', onPress: async () => {
          setDeleting(true);
          try {
            if (user) await supabase.from('profiles').delete().eq('id',user.id);
            await signOut();
          } catch(e:any) { Alert.alert('Erreur', e.message); }
          finally { setDeleting(false); }
        }},
      ]
    );
  }, [user]);

  const RADIUS_OPTIONS = [0.5, 1, 2, 5];

  return (
    <ScrollView style={[styles.container,dynBg]} contentContainerStyle={styles.content}>
      <View style={{flexDirection:'row',alignItems:'center',gap:12,marginBottom:6}}>
        <TouchableOpacity style={{width:36,height:36,borderRadius:10,backgroundColor:Colors.card,borderWidth:1,borderColor:Colors.border,alignItems:'center',justifyContent:'center'}} onPress={()=>navigation.goBack()} activeOpacity={0.8}>
          <Ionicons name="arrow-back" size={18} color={Colors.text1}/>
        </TouchableOpacity>
        <ThemePicker/>
      <View style={{height:1,backgroundColor:C.border,marginBottom:20}}/>
      <Text style={[styles.title,dynText1]}>Paramètres</Text>
      </View>

      {/* Notifications */}
      <Section title="Notifications">
        <SettingRow
          label="Alertes places disponibles"
          sub="Recevez une notif quand une place se libère près de vous"
          value={notifs}
          onToggle={async v => { setNotifs(v); await savePrefs('notifications_enabled',v); }}
        />
        <View style={[styles.settingRow,{borderTopWidth:1,borderTopColor:Colors.border}]}>
          <View style={{flex:1}}>
            <Text style={styles.settingLabel}>Rayon d'alerte</Text>
            <Text style={styles.settingSub}>Distance maximale pour les alertes</Text>
          </View>
          <View style={{flexDirection:'row',gap:6}}>
            {RADIUS_OPTIONS.map(r => (
              <TouchableOpacity key={r}
                style={[styles.radiusBtn, radius===r && styles.radiusBtnOn]}
                onPress={async ()=>{ setRadius(r); await savePrefs('radius_km',r); }}>
                <Text style={[styles.radiusText, radius===r&&{color:Colors.accent}]}>{r}<Text style={{fontSize:9}}>km</Text></Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Section>

      {/* Confidentialité */}
      <Section title="Confidentialité & Données">
        <SettingRow label="Politique de confidentialité"
          sub="Comment nous traitons vos données"
          onPress={()=>Linking.openURL('https://easypark.app/privacy')}/>
        <SettingRow label="Conditions d'utilisation"
          sub={"Les règles d'utilisation de l'application"}
          onPress={()=>Linking.openURL('https://easypark.app/terms')}/>
        <SettingRow label="Gestion des cookies"
          sub="Paramétrez vos préférences"
          onPress={()=>Alert.alert('Cookies','Easy Park utilise uniquement des cookies fonctionnels nécessaires au fonctionnement de l\'application. Aucun cookie publicitaire n\'est utilisé.')}/>
        <SettingRow label="Télécharger mes données"
          sub="Recevez une copie de toutes vos données"
          onPress={()=>Alert.alert('Export de données','Votre demande a été enregistrée. Vous recevrez vos données par email dans 72h.')}/>
      </Section>

      {/* Sécurité */}
      <Section title="Sécurité">
        <SettingRow label="Changer le mot de passe"
          sub="Envoi d'un lien de réinitialisation par email"
          onPress={async ()=>{
            if (!user?.email) return;
            const {error} = await supabase.auth.resetPasswordForEmail(user.email);
            if (error) Alert.alert('Erreur', error.message);
            else Alert.alert('Email envoyé', `Un lien de réinitialisation a été envoyé à ${user.email}`);
          }}/>
        <SettingRow label="Sessions actives"
          sub="Voir et déconnecter vos autres sessions"
          onPress={()=>Alert.alert('Sessions','Fonctionnalité disponible prochainement.')}/>
      </Section>

      {/* À propos */}
      <Section title="À propos">
        <SettingRow label="Version de l'application"
          rightEl={<Text style={styles.versionText}>1.0.0</Text>}/>
        <SettingRow label="Contacter le support"
          sub="support@easypark.app"
          onPress={()=>Linking.openURL('mailto:support@easypark.app')}/>
        <SettingRow label="Signaler un bug"
          onPress={()=>Linking.openURL('mailto:bugs@easypark.app?subject=Bug%20Easy%20Park')}/>
        <SettingRow label="Évaluer l'application"
          onPress={()=>Alert.alert('Merci !', 'Fonctionnalité disponible lors de la publication sur le store.')}/>
        <SettingRow label="Mentions légales"
          onPress={()=>Alert.alert('Mentions légales',
            'Easy Park SAS\nRCS Paris — En cours d\'immatriculation\nDirecteur de publication : Équipe Easy Park\nHébergement : Supabase Inc., San Francisco, CA\n\nConformément au RGPD, vous disposez d\'un droit d\'accès, de rectification et de suppression de vos données.')}/>
      </Section>

      {/* Danger zone */}
      {user && (
        <Section title="Zone dangereuse">
          <SettingRow label="Se déconnecter de tous les appareils"
            onPress={async ()=>{
              await supabase.auth.signOut({scope:'global'});
              await signOut();
            }}/>
          <SettingRow label="Supprimer mon compte"
            sub="Action irréversible — toutes vos données seront effacées"
            onPress={handleDeleteAccount} danger/>
        </Section>
      )}

      {/* Privacy notice */}
      <View style={styles.privacyNotice}>
        <Text style={styles.privacyTitle}>🔒 Protection de vos données</Text>
        <Text style={styles.privacyText}>
          Easy Park s'engage à protéger vos données personnelles conformément au Règlement Général sur la Protection des Données (RGPD). Vos données de localisation ne sont utilisées que pour afficher les places de parking et ne sont jamais revendues à des tiers.{'\n\n'}
          Vos données sont stockées de manière sécurisée sur des serveurs européens (Supabase EU). Vous pouvez exercer vos droits RGPD à tout moment via l'option "Télécharger mes données" ou en nous contactant à dpo@easypark.app.
        </Text>
      </View>

      <View style={{height:40}}/>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:     {flex:1,backgroundColor:Colors.bg},
  content:       {padding:20},
  title:         {fontSize:26,fontWeight:'800',color:Colors.text1,letterSpacing:-0.5,marginBottom:24},
  section:       {marginBottom:20},
  sectionTitle:  {fontSize:11,fontWeight:'800',textTransform:'uppercase',letterSpacing:1.2,color:Colors.text3,marginBottom:8,paddingLeft:4},
  sectionCard:   {backgroundColor:Colors.card,borderRadius:Radius.lg,borderWidth:1,borderColor:Colors.border,...Shadow.sm,overflow:'hidden'},
  settingRow:    {flexDirection:'row',alignItems:'center',padding:15,gap:10},
  settingLabel:  {fontSize:14,fontWeight:'600',color:Colors.text1,marginBottom:2},
  settingSub:    {fontSize:12,color:Colors.text3,lineHeight:17},
  chevron:       {fontSize:20,color:Colors.text3,fontWeight:'300'},
  versionText:   {fontSize:13,color:Colors.text2,fontWeight:'600'},
  radiusBtn:     {width:40,height:32,borderRadius:Radius.sm,borderWidth:1,borderColor:Colors.border,alignItems:'center',justifyContent:'center',backgroundColor:Colors.surf},
  radiusBtnOn:   {borderColor:Colors.accent,backgroundColor:Colors.accentD},
  radiusText:    {fontSize:12,fontWeight:'800',color:Colors.text2},
  privacyNotice: {backgroundColor:Colors.card,borderRadius:Radius.lg,padding:18,borderWidth:1,borderColor:Colors.borderA,marginBottom:8},
  privacyTitle:  {fontSize:14,fontWeight:'800',color:Colors.accent,marginBottom:10},
  privacyText:   {fontSize:12,color:Colors.text2,lineHeight:19},
});
