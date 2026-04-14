// src/screens/MapScreen.tsx
import React, { useState, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Modal, ScrollView, Image, Alert, ActivityIndicator,
  RefreshControl, TextInput, Platform,
} from 'react-native';
import MapView, { Marker, Callout } from 'react-native-maps';
import { Linking } from 'react-native';
import { Colors, Radius, Shadow, StatusConfig, SpotTypeConfig } from '../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { NavigateIcon, ClockIcon, UserIcon, PinIcon, StarIcon, CheckCircleIcon, CloseCircleIcon, RefreshIcon } from '../components/Icons';
import { useSpots } from '../hooks/useSpots';
import { useLocation } from '../hooks/useLocation';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../hooks/useAuth';
import { updateSpotStatus, createReport, formatDistance, submitReview, fetchReviews } from '../services/spots';
import { Spot, Review } from '../types';

type FilterKey = 'all'|'free'|'soon'|'occupied'|'gratuit'|'payant';
const FILTERS: {key:FilterKey; label:string}[] = [
  {key:'all', label:'Tous'}, {key:'free', label:'Libres'},
  {key:'soon', label:'Bientôt'}, {key:'occupied', label:'Occupées'},
  {key:'gratuit', label:'Gratuites'}, {key:'payant', label:'Payantes'},
];

function relTime(d:string): string {
  const m=Math.floor((Date.now()-new Date(d).getTime())/60000);
  if(m<1)return"À l'instant"; if(m<60)return`${m} min`; const h=Math.floor(m/60);
  if(h<24)return`${h}h`; return`${Math.floor(h/24)}j`;
}

function StarRating({ rating, onRate, size=20 }: { rating:number; onRate?:(r:number)=>void; size?:number }) {
  return (
    <View style={{ flexDirection:'row', gap:3 }}>
      {[1,2,3,4,5].map(i => (
        <TouchableOpacity key={i} onPress={() => onRate?.(i)} disabled={!onRate} activeOpacity={0.7}>
          <Text style={{ fontSize:size, color: i<=rating ? Colors.gold : Colors.text3 }}>★</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

export default function MapScreen() {
  const { colors: C } = useTheme();
  const dynBg    = { backgroundColor: C.bg };
  const dynCard  = { backgroundColor: C.card, borderColor: C.border };
  const dynSurf  = { backgroundColor: C.surf, borderColor: C.border };
  const dynText1 = { color: C.text1 };
  const dynText2 = { color: C.text2 };
  const dynText3 = { color: C.text3 };
  const { location, loading:locLoading } = useLocation();
  const { spots, loading, error, refresh } = useSpots(location??null);
  const { user, profile, refreshProfile } = useAuth();

  const [filter,    setFilter]  = useState<FilterKey>('all');
  const [selSpot,   setSel]     = useState<Spot|null>(null);
  const [detailVis, setDetail]  = useState(false);
  const [mapMode,   setMapMode] = useState(false);
  const [declaring, setDecl]    = useState(false);
  const [reviews,   setReviews] = useState<Review[]>([]);
  const [revLoading,setRevLoad] = useState(false);
  const [myRating,  setMyRating]= useState(0);
  const [myComment, setMyComment]=useState('');
  const [wasAccurate,setWasAcc] = useState<boolean|null>(null);
  const [submittingRev, setSubRev]=useState(false);
  const mapRef = useRef<MapView>(null);

  const filtered = spots.filter(s => {
    if(filter==='all')     return true;
    if(filter==='gratuit') return !s.is_paid;
    if(filter==='payant')  return s.is_paid;
    return s.status===filter;
  });

  const openDetail = useCallback(async (spot:Spot) => {
    setSel(spot); setDetail(true); setMyRating(0); setMyComment(''); setWasAcc(null);
    setRevLoad(true);
    try { setReviews(await fetchReviews(spot.id)); }
    catch(_) { setReviews([]); }
    finally { setRevLoad(false); }
  }, []);

  const closeDetail = useCallback(() => { setDetail(false); setSel(null); setReviews([]); }, []);

  const handleDeclareOccupied = useCallback(async (spot:Spot) => {
    if (!user) return;
    Alert.alert('Déclarer occupée', `La place "${spot.address.split(',')[0]}" est maintenant occupée ?`, [
      { text:'Annuler', style:'cancel' },
      { text:'Confirmer', style:'destructive', onPress: async () => {
        setDecl(true);
        try {
          await updateSpotStatus(spot.id, 'occupied');
          await createReport({ spot_id:spot.id, user_id:user.id, status:'occupied',
            description:'Place déclarée occupée', photo_url:'',
            lat:location?.lat??0, lng:location?.lng??0, address:spot.address });
          await refreshProfile();
          setSel(prev => prev?.id===spot.id ? {...prev, status:'occupied'} : prev);
          closeDetail();
        } catch(e:any) { Alert.alert('Erreur', e.message); }
        finally { setDecl(false); }
      }},
    ]);
  }, [user, location, refreshProfile, closeDetail]);

  const handleSubmitReview = useCallback(async () => {
    if (!user || !selSpot || myRating===0) return;
    setSubRev(true);
    try {
      await submitReview({ spot_id:selSpot.id, reviewer_id:user.id,
        rating:myRating, comment:myComment.trim(), was_accurate:wasAccurate });
      const updated = await fetchReviews(selSpot.id);
      setReviews(updated);
      setMyRating(0); setMyComment(''); setWasAcc(null);
      Alert.alert('Merci !', 'Votre évaluation a été enregistrée.');
    } catch(e:any) { Alert.alert('Erreur', e.message); }
    finally { setSubRev(false); }
  }, [user, selSpot, myRating, myComment, wasAccurate]);

  const avgRating = reviews.length ? (reviews.reduce((a,r)=>a+r.rating,0)/reviews.length) : 0;

  if (loading && spots.length===0) {
    return <View style={styles.centered}><ActivityIndicator size="large" color={Colors.accent}/></View>;
  }

  return (
    <View style={[styles.container, dynBg]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Places autour de moi</Text>
          <Text style={styles.subtitle}>
            {location ? `${filtered.length} place${filtered.length!==1?'s':''} dans 1 km` : 'Activation GPS…'}
          </Text>
        </View>
        <View style={{flexDirection:'row',gap:8}}>
          <TouchableOpacity style={styles.mapToggle} onPress={() => setMapMode(v=>!v)} activeOpacity={0.8}>
            <Ionicons name={mapMode?'list-outline':'map-outline'} size={18} color={Colors.text1}/>
          </TouchableOpacity>
        </View>
      </View>

      {/* Filters */}
      <View style={styles.filterWrap}>
        <FlatList
          horizontal data={FILTERS} keyExtractor={i=>i.key}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterList}
          renderItem={({item}) => (
            <TouchableOpacity
              style={[styles.chip, filter===item.key && styles.chipOn]}
              onPress={() => setFilter(item.key)} activeOpacity={0.8}
            >
              <Text style={[styles.chipText, filter===item.key && styles.chipTextOn]}>{item.label}</Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Map or List */}
      {mapMode && location ? (
        <MapView ref={mapRef} style={styles.map}
          initialRegion={{ latitude:location.lat, longitude:location.lng, latitudeDelta:0.01, longitudeDelta:0.01 }}
          showsUserLocation showsMyLocationButton>
          {filtered.map(s => (
            <Marker key={s.id} coordinate={{latitude:s.lat, longitude:s.lng}}
              pinColor={StatusConfig[s.status]?.color} onPress={()=>openDetail(s)}>
              <Callout onPress={()=>openDetail(s)}>
                <View style={{width:180, padding:8}}>
                  <Text style={{fontSize:13,fontWeight:'700',color:'#000'}} numberOfLines={2}>{s.address}</Text>
                  <Text style={{fontSize:11,color:'#555',marginTop:3}}>{StatusConfig[s.status]?.label} · {s.is_paid?'Payante':'Gratuite'}</Text>
                </View>
              </Callout>
            </Marker>
          ))}
        </MapView>
      ) : (
        <FlatList
          data={filtered} keyExtractor={s=>s.id}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} tintColor={Colors.accent}/>}
          contentContainerStyle={{ paddingTop:8, paddingBottom:100 }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>🔍</Text>
              <Text style={styles.emptyTitle}>{location?'Aucune place à 1 km':'GPS désactivé'}</Text>
              <Text style={styles.emptySub}>{location?'Soyez le premier à signaler !':'Activez le GPS pour voir les places proches.'}</Text>
            </View>
          }
          renderItem={({item}) => <SpotRow spot={item} onPress={()=>openDetail(item)} onDeclare={()=>handleDeclareOccupied(item)} userId={user?.id}/>}
        />
      )}

      {/* Detail Modal */}
      <Modal visible={detailVis} animationType="slide" presentationStyle="pageSheet" onRequestClose={closeDetail}>
        {selSpot && (
          <View style={styles.modal}>
            <View style={styles.modalHandle}/>
            <ScrollView showsVerticalScrollIndicator={false}>
              {selSpot.photo_url ? <Image source={{uri:selSpot.photo_url}} style={styles.modalPhoto}/> : null}
              <View style={styles.modalBody}>
                {/* Status row */}
                <View style={styles.modalBadgeRow}>
                  <StatusBadge status={selSpot.status}/>
                  <PriceBadge isPaid={selSpot.is_paid}/>
                  {selSpot.status==='soon'&&selSpot.free_at&&(
                    <View style={styles.timerBadge}>
                      <Text style={{fontSize:11,color:Colors.yellow,fontWeight:'700'}}>
                        ⏱ {Math.max(0,Math.round((new Date(selSpot.free_at).getTime()-Date.now())/60000))} min
                      </Text>
                    </View>
                  )}
                </View>
                <Text style={styles.modalAddr}>{selSpot.address||'Position signalée'}</Text>
                {selSpot.description?<Text style={styles.modalDesc}>{selSpot.description}</Text>:null}

                {/* Meta */}
                <View style={styles.metaBox}>
                  <MetaRow k="Type" v={`${SpotTypeConfig[selSpot.spot_type]?.emoji} ${SpotTypeConfig[selSpot.spot_type]?.label}`}/>
                  {selSpot.distance!=null&&<MetaRow k="Distance" v={formatDistance(selSpot.distance)} highlight/>}
                  {selSpot.profiles?.username&&<MetaRow k="Signalé par" v={`@${selSpot.profiles.username}`}/>}
                  <MetaRow k="Mis à jour" v={`il y a ${relTime(selSpot.last_updated||selSpot.created_at)}`}/>
                  {avgRating>0&&<MetaRow k="Fiabilité" v={`${'★'.repeat(Math.round(avgRating))}${'☆'.repeat(5-Math.round(avgRating))} ${avgRating.toFixed(1)}/5`} highlight/>}
                </View>

                {/* Actions */}
                {selSpot.status==='free'&&(
                  <TouchableOpacity style={styles.btnGreen} activeOpacity={0.85}
                    onPress={()=>{
                      const lat=selSpot.lat, lng=selSpot.lng;
                      const gUrl=`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
                      const iUrl=`maps://?daddr=${lat},${lng}`;
                      const url = Platform.OS==='ios' ? iUrl : gUrl;
                      Linking.canOpenURL(url)
                        .then(ok => Linking.openURL(ok ? url : gUrl))
                        .catch(()=> Linking.openURL(gUrl));
                    }}>
                    <Text style={styles.btnGreenText}>Naviguer vers cette place</Text>
                  </TouchableOpacity>
                )}
                {(selSpot.status==='free'||selSpot.status==='soon')&&user&&(
                  <TouchableOpacity style={styles.btnRed} activeOpacity={0.85} disabled={declaring}
                    onPress={()=>handleDeclareOccupied(selSpot)}>
                    {declaring?<ActivityIndicator size="small" color={Colors.red}/>:
                    <Text style={styles.btnRedText}>Déclarer cette place occupée</Text>}
                  </TouchableOpacity>
                )}

                {/* Reviews */}
                <View style={styles.reviewSection}>
                  <Text style={styles.reviewSectionTitle}>Évaluations ({reviews.length})</Text>
                  {revLoading ? <ActivityIndicator color={Colors.accent} style={{marginVertical:16}}/> :
                    reviews.length===0 ? <Text style={styles.noReview}>Aucune évaluation pour l'instant.</Text> :
                    reviews.slice(0,3).map(r=>(
                      <View key={r.id} style={styles.reviewItem}>
                        <View style={styles.reviewHeader}>
                          <Text style={styles.reviewUser}>@{r.profiles?.username||'anonyme'}</Text>
                          <StarRating rating={r.rating} size={14}/>
                          {r.was_accurate!==null&&(
                            <View style={[styles.accuracyBadge,{backgroundColor:r.was_accurate?Colors.greenD:Colors.redD}]}>
                              <Text style={{fontSize:10,fontWeight:'700',color:r.was_accurate?Colors.green:Colors.red}}>
                                {r.was_accurate?'Place trouvée ✓':'Introuvable ✗'}
                              </Text>
                            </View>
                          )}
                        </View>
                        {r.comment?<Text style={styles.reviewComment}>{r.comment}</Text>:null}
                      </View>
                    ))
                  }

                  {/* Add review */}
                  {user&&user.id!==selSpot.reported_by&&(
                    <View style={styles.addReview}>
                      <Text style={styles.addReviewTitle}>Votre évaluation</Text>
                      <StarRating rating={myRating} onRate={setMyRating} size={28}/>
                      <Text style={[styles.fieldLabel,{marginTop:12}]}>La place était-elle vraiment disponible ?</Text>
                      <View style={styles.accuracyRow}>
                        <TouchableOpacity style={[styles.accBtn, wasAccurate===true&&styles.accBtnYes]} onPress={()=>setWasAcc(true)}>
                          <Text style={{fontSize:12,fontWeight:'700',color:wasAccurate===true?Colors.green:Colors.text2}}>✓ Oui, libre</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.accBtn, wasAccurate===false&&styles.accBtnNo]} onPress={()=>setWasAcc(false)}>
                          <Text style={{fontSize:12,fontWeight:'700',color:wasAccurate===false?Colors.red:Colors.text2}}>✗ Non, occupée</Text>
                        </TouchableOpacity>
                      </View>
                      <TextInput
                        style={[styles.input,{marginTop:10}]}
                        value={myComment} onChangeText={setMyComment}
                        placeholder="Commentaire facultatif…" placeholderTextColor={Colors.text3}
                        multiline maxLength={200}
                      />
                      <TouchableOpacity
                        style={[styles.submitReviewBtn, (myRating===0||submittingRev)&&{opacity:0.5}]}
                        onPress={handleSubmitReview} disabled={myRating===0||submittingRev}>
                        {submittingRev?<ActivityIndicator size="small" color="#fff"/>:
                        <Text style={styles.submitReviewText}>Publier l'évaluation</Text>}
                      </TouchableOpacity>
                    </View>
                  )}
                </View>

                <TouchableOpacity style={styles.btnClose} onPress={closeDetail}>
                  <Text style={styles.btnCloseText}>Fermer</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        )}
      </Modal>
    </View>
  );
}

/* ── Sub-components ── */
function SpotRow({ spot, onPress, onDeclare, userId }:{ spot:Spot; onPress:()=>void; onDeclare:()=>void; userId?:string }) {
  const cfg = StatusConfig[spot.status];
  const canDeclare = userId && (spot.status==='free'||spot.status==='soon');
  return (
    <TouchableOpacity style={rStyles.card} onPress={onPress} activeOpacity={0.85}>
      <View style={rStyles.row}>
        <View style={rStyles.photo}>
          {spot.photo_url
            ? <Image source={{uri:spot.photo_url}} style={rStyles.photoImg}/>
            : <View style={rStyles.photoEmpty}><Text style={{fontSize:22}}>{SpotTypeConfig[spot.spot_type]?.emoji||'🚗'}</Text></View>
          }
        </View>
        <View style={{flex:1,minWidth:0}}>
          <View style={rStyles.badges}>
            <StatusBadge status={spot.status}/>
            <PriceBadge isPaid={spot.is_paid}/>
          </View>
          <Text style={rStyles.addr} numberOfLines={2}>{spot.address||'Position signalée'}</Text>
          {spot.description?<Text style={rStyles.desc} numberOfLines={1}>{spot.description}</Text>:null}
          <View style={rStyles.meta}>
            <View style={{flexDirection:'row',alignItems:'center',gap:3}}>
              <ClockIcon size={11} color={Colors.text3}/>
              <Text style={rStyles.metaText}>{relTime(spot.last_updated||spot.created_at)}</Text>
            </View>
            {spot.profiles?.username&&<Text style={rStyles.metaText}>· @{spot.profiles.username}</Text>}
          </View>
        </View>
        <View style={{alignItems:'flex-end',gap:6,flexShrink:0}}>
          {spot.distance!=null&&<Text style={rStyles.dist}>{formatDistance(spot.distance)}</Text>}
          {canDeclare&&(
            <TouchableOpacity style={rStyles.declareBtn} onPress={e=>{e.stopPropagation?.();onDeclare();}} activeOpacity={0.8}>
              <Text style={rStyles.declareBtnText}>Occupée</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

function StatusBadge({status}:{status:string}) {
  const cfg=StatusConfig[status]||StatusConfig.free;
  return (
    <View style={{backgroundColor:cfg.bg,borderRadius:Radius.full,paddingHorizontal:9,paddingVertical:3,borderWidth:1,borderColor:cfg.color+'44',flexDirection:'row',alignItems:'center',gap:4}}>
      <View style={{width:6,height:6,borderRadius:3,backgroundColor:cfg.dot}}/>
      <Text style={{fontSize:11,fontWeight:'700',color:cfg.color}}>{cfg.label}</Text>
    </View>
  );
}

function PriceBadge({isPaid}:{isPaid:boolean}) {
  return (
    <View style={{backgroundColor:isPaid?Colors.purpleD:Colors.greenD,borderRadius:Radius.full,paddingHorizontal:9,paddingVertical:3,borderWidth:1,borderColor:isPaid?Colors.purple+'44':Colors.green+'44'}}>
      <Text style={{fontSize:11,fontWeight:'700',color:isPaid?Colors.purple:Colors.green}}>{isPaid?'Payante':'Gratuite'}</Text>
    </View>
  );
}

function MetaRow({k,v,highlight}:{k:string;v:string;highlight?:boolean}) {
  return (
    <View style={{flexDirection:'row',justifyContent:'space-between',paddingVertical:8,borderBottomWidth:1,borderBottomColor:Colors.border}}>
      <Text style={{fontSize:13,color:Colors.text3}}>{k}</Text>
      <Text style={{fontSize:13,fontWeight:'600',color:highlight?Colors.accent:Colors.text1}}>{v}</Text>
    </View>
  );
}

const rStyles = StyleSheet.create({
  card:    {backgroundColor:Colors.card,borderRadius:Radius.lg,borderWidth:1,borderColor:Colors.border,padding:14,marginHorizontal:16,marginBottom:10,...Shadow.sm},
  row:     {flexDirection:'row',gap:12},
  photo:   {width:68,height:68,borderRadius:Radius.md,overflow:'hidden',flexShrink:0},
  photoImg:{width:'100%',height:'100%'},
  photoEmpty:{width:'100%',height:'100%',backgroundColor:Colors.surf,alignItems:'center',justifyContent:'center'},
  badges:  {flexDirection:'row',flexWrap:'wrap',gap:5,marginBottom:5},
  addr:    {fontSize:13,fontWeight:'700',color:Colors.text1,marginBottom:3},
  desc:    {fontSize:12,color:Colors.text2,marginBottom:4},
  meta:    {flexDirection:'row',gap:6,flexWrap:'wrap'},
  metaText:{fontSize:11,color:Colors.text3},
  dist:    {fontSize:13,fontWeight:'800',color:Colors.accent},
  declareBtn:{backgroundColor:Colors.redD,borderRadius:Radius.sm,paddingHorizontal:10,paddingVertical:5,borderWidth:1,borderColor:Colors.red+'44'},
  declareBtnText:{fontSize:11,fontWeight:'700',color:Colors.red},
});

const styles = StyleSheet.create({
  container:   {flex:1,backgroundColor:Colors.bg},
  centered:    {flex:1,backgroundColor:Colors.bg,alignItems:'center',justifyContent:'center'},
  header:      {flexDirection:'row',alignItems:'center',justifyContent:'space-between',padding:20,paddingBottom:10},
  title:       {fontSize:22,fontWeight:'800',color:Colors.text1,letterSpacing:-0.4},
  subtitle:    {fontSize:13,color:Colors.text2,marginTop:2},
  mapToggle:   {width:40,height:40,backgroundColor:Colors.card,borderRadius:Radius.md,borderWidth:1,borderColor:Colors.border,alignItems:'center',justifyContent:'center'},
  mapToggleText:{fontSize:13,fontWeight:'700',color:Colors.text1}, /* unused */
  filterWrap:  {height:46},
  filterList:  {paddingHorizontal:16,paddingVertical:8,gap:8,alignItems:'center'},
  chip:        {paddingHorizontal:16,paddingVertical:7,borderRadius:Radius.full,borderWidth:1,borderColor:Colors.border,backgroundColor:'transparent',alignSelf:'center',height:34,justifyContent:'center'},
  chipOn:      {borderColor:Colors.accent,backgroundColor:Colors.accentD},
  chipText:    {fontSize:12,fontWeight:'700',color:Colors.text2},
  chipTextOn:  {color:Colors.accent},
  map:         {flex:1},
  empty:       {alignItems:'center',paddingVertical:60,paddingHorizontal:32},
  emptyIcon:   {fontSize:40,marginBottom:12},
  emptyTitle:  {fontSize:16,fontWeight:'700',color:Colors.text2,marginBottom:6},
  emptySub:    {fontSize:13,color:Colors.text3,textAlign:'center'},
  modal:       {flex:1,backgroundColor:Colors.bg},
  modalHandle: {width:36,height:4,backgroundColor:Colors.border,borderRadius:2,alignSelf:'center',marginTop:12,marginBottom:8},
  modalPhoto:  {width:'100%',height:220},
  modalBody:   {padding:20},
  modalBadgeRow:{flexDirection:'row',flexWrap:'wrap',gap:8,marginBottom:12},
  modalAddr:   {fontSize:20,fontWeight:'800',color:Colors.text1,marginBottom:8,letterSpacing:-0.3},
  modalDesc:   {fontSize:14,color:Colors.text2,lineHeight:21,padding:12,backgroundColor:Colors.surf,borderRadius:Radius.md,borderWidth:1,borderColor:Colors.border,marginBottom:14},
  metaBox:     {marginBottom:18},
  timerBadge:  {backgroundColor:Colors.yellowD,borderRadius:Radius.full,paddingHorizontal:9,paddingVertical:3,borderWidth:1,borderColor:Colors.yellow+'44'},
  btnGreen:    {backgroundColor:Colors.greenD,borderRadius:Radius.lg,paddingVertical:14,alignItems:'center',marginBottom:10,borderWidth:1,borderColor:Colors.green+'44'},
  btnGreenText:{fontSize:14,fontWeight:'700',color:Colors.green},
  btnRed:      {backgroundColor:Colors.redD,borderRadius:Radius.lg,paddingVertical:14,alignItems:'center',marginBottom:10,borderWidth:1,borderColor:Colors.red+'44'},
  btnRedText:  {fontSize:14,fontWeight:'700',color:Colors.red},
  btnClose:    {borderRadius:Radius.lg,paddingVertical:13,alignItems:'center',borderWidth:1,borderColor:Colors.border,marginTop:4},
  btnCloseText:{fontSize:14,fontWeight:'600',color:Colors.text2},
  reviewSection:{marginTop:24,marginBottom:8},
  reviewSectionTitle:{fontSize:16,fontWeight:'800',color:Colors.text1,marginBottom:14},
  noReview:    {fontSize:13,color:Colors.text3,textAlign:'center',paddingVertical:12},
  reviewItem:  {backgroundColor:Colors.card2,borderRadius:Radius.md,padding:12,marginBottom:8,borderWidth:1,borderColor:Colors.border},
  reviewHeader:{flexDirection:'row',alignItems:'center',gap:8,flexWrap:'wrap',marginBottom:4},
  reviewUser:  {fontSize:12,fontWeight:'700',color:Colors.accent},
  reviewComment:{fontSize:13,color:Colors.text2,lineHeight:19},
  accuracyBadge:{borderRadius:Radius.full,paddingHorizontal:8,paddingVertical:2},
  addReview:   {backgroundColor:Colors.card,borderRadius:Radius.lg,padding:16,borderWidth:1,borderColor:Colors.borderA,marginTop:12},
  addReviewTitle:{fontSize:14,fontWeight:'800',color:Colors.text1,marginBottom:12},
  accuracyRow: {flexDirection:'row',gap:10,marginTop:6},
  accBtn:      {flex:1,paddingVertical:10,borderRadius:Radius.md,borderWidth:1,borderColor:Colors.border,alignItems:'center',backgroundColor:Colors.card2},
  accBtnYes:   {borderColor:Colors.green,backgroundColor:Colors.greenD},
  accBtnNo:    {borderColor:Colors.red,backgroundColor:Colors.redD},
  input:       {backgroundColor:Colors.surf,borderWidth:1,borderColor:Colors.border,borderRadius:Radius.md,padding:12,fontSize:13,color:Colors.text1},
  fieldLabel:  {fontSize:13,fontWeight:'600',color:Colors.text2,marginBottom:6},
  submitReviewBtn:{backgroundColor:Colors.accent,borderRadius:Radius.md,paddingVertical:13,alignItems:'center',marginTop:12},
  submitReviewText:{fontSize:14,fontWeight:'700',color:'#0a0d14'},
});
