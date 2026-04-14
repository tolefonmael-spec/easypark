// src/screens/SearchScreen.tsx
// Recherche d'adresse avec géocodage Nominatim + affichage des places proches
import React, { useState, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  FlatList, ActivityIndicator, Keyboard, Image,
} from 'react-native';
import { Colors, Radius, Shadow, StatusConfig, SpotTypeConfig } from '../constants/theme';
import { useTheme } from '../contexts/ThemeContext';
import { fetchSpots, calcDistance, formatDistance } from '../services/spots';
import { Spot } from '../types';
import { ClockIcon, PinIcon } from '../components/Icons';

interface SearchResult {
  place_id: number;
  display_name: string;
  lat: string; lon: string;
  type: string;
}

function relTime(d:string) {
  const m=Math.floor((Date.now()-new Date(d).getTime())/60000);
  if(m<1)return"À l'instant"; if(m<60)return`${m} min`; const h=Math.floor(m/60);
  return h<24?`${h}h`:`${Math.floor(h/24)}j`;
}

export default function SearchScreen() {
  const { colors: C } = useTheme();
  const dynBg    = { backgroundColor: C.bg };
  const dynCard  = { backgroundColor: C.card, borderColor: C.border };
  const dynSurf  = { backgroundColor: C.surf, borderColor: C.border };
  const dynText1 = { color: C.text1 };
  const dynText2 = { color: C.text2 };
  const dynText3 = { color: C.text3 };
  const onSelectSpot = undefined;
  const [query,       setQuery]     = useState('');
  const [results,     setResults]   = useState<SearchResult[]>([]);
  const [spots,       setSpots]     = useState<(Spot & {distance:number})[]>([]);
  const [loadSearch,  setLoadS]     = useState(false);
  const [loadSpots,   setLoadSp]    = useState(false);
  const [selectedLoc, setSelectedLoc] = useState<{lat:number;lng:number;label:string}|null>(null);
  const [filter,      setFilter]    = useState<'all'|'free'|'soon'|'occupied'>('all');
  const debounceRef = useRef<ReturnType<typeof setTimeout>|null>(null);

  const searchAddress = useCallback(async (q: string) => {
    if (q.trim().length < 3) { setResults([]); return; }
    setLoadS(true);
    try {
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&addressdetails=1&limit=8&accept-language=fr`;
      const res = await fetch(url, { headers:{'Accept-Language':'fr','User-Agent':'EasyPark/1.0'} });
      const data: SearchResult[] = await res.json();
      setResults(data);
    } catch(_) { setResults([]); }
    finally { setLoadS(false); }
  }, []);

  const handleChange = useCallback((text: string) => {
    setQuery(text);
    setSelectedLoc(null);
    setSpots([]);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchAddress(text), 500);
  }, [searchAddress]);

  const handleSelectLocation = useCallback(async (r: SearchResult) => {
    Keyboard.dismiss();
    const lat = parseFloat(r.lat);
    const lng = parseFloat(r.lon);
    const label = r.display_name.split(',').slice(0,3).join(', ');
    setQuery(label);
    setResults([]);
    setSelectedLoc({ lat, lng, label });
    setLoadSp(true);
    try {
      const allSpots = await fetchSpots();
      const near = allSpots
        .map(s => ({ ...s, distance: calcDistance(lat, lng, s.lat, s.lng) }))
        .filter(s => s.distance <= 1000)
        .sort((a,b) => a.distance - b.distance);
      setSpots(near);
    } catch(_) { setSpots([]); }
    finally { setLoadSp(false); }
  }, []);

  const filtered = filter==='all' ? spots : spots.filter(s=>s.status===filter);

  return (
    <View style={[styles.container,dynBg]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Rechercher</Text>
        <Text style={styles.sub}>Trouvez des places près d'une adresse</Text>
      </View>

      {/* Search bar */}
      <View style={styles.searchWrap}>
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            value={query}
            onChangeText={handleChange}
            placeholder="Adresse, lieu, ville…"
            placeholderTextColor={Colors.text3}
            returnKeyType="search"
            onSubmitEditing={() => searchAddress(query)}
            autoCorrect={false}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => { setQuery(''); setResults([]); setSpots([]); setSelectedLoc(null); }} style={styles.clearBtn}>
              <Text style={{ fontSize:16, color:Colors.text3 }}>✕</Text>
            </TouchableOpacity>
          )}
          {loadSearch && <ActivityIndicator size="small" color={Colors.accent} style={{ marginRight:12 }}/>}
        </View>
      </View>

      {/* Autocomplete results */}
      {results.length > 0 && !selectedLoc && (
        <View style={styles.dropdown}>
          {results.map((r, i) => (
            <TouchableOpacity key={r.place_id} style={[styles.dropItem, i>0&&{borderTopWidth:1,borderTopColor:Colors.border}]}
              onPress={() => handleSelectLocation(r)} activeOpacity={0.8}>
              <Text style={styles.dropIcon}>📍</Text>
              <View style={{flex:1}}>
                <Text style={styles.dropName} numberOfLines={1}>{r.display_name.split(',')[0]}</Text>
                <Text style={styles.dropSub} numberOfLines={1}>{r.display_name.split(',').slice(1,3).join(', ')}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Selected location info */}
      {selectedLoc && (
        <View style={styles.locInfo}>
          <View style={{flex:1}}>
            <Text style={styles.locLabel} numberOfLines={2}>{selectedLoc.label}</Text>
            <Text style={styles.locSub}>
              {loadSpots ? 'Recherche des places…' : `${filtered.length} place${filtered.length!==1?'s':''} dans 1 km`}
            </Text>
          </View>
          {loadSpots && <ActivityIndicator color={Colors.accent}/>}
        </View>
      )}

      {/* Filter chips */}
      {selectedLoc && spots.length > 0 && (
        <View style={styles.filterRow}>
          {(['all','free','soon','occupied'] as const).map(f => (
            <TouchableOpacity key={f} style={[styles.chip, filter===f&&styles.chipOn]}
              onPress={()=>setFilter(f)} activeOpacity={0.8}>
              <Text style={[styles.chipText, filter===f&&{color:Colors.accent}]}>
                {f==='all'?'Tous':f==='free'?'Libres':f==='soon'?'Bientôt':'Occupées'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Spots list */}
      {selectedLoc && !loadSpots && (
        <FlatList
          data={filtered}
          keyExtractor={s=>s.id}
          contentContainerStyle={{paddingHorizontal:16,paddingTop:8,paddingBottom:100}}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={{fontSize:32,marginBottom:10}}>🔍</Text>
              <Text style={styles.emptyTitle}>Aucune place dans 1 km</Text>
              <Text style={styles.emptySub}>Soyez le premier à signaler une place ici !</Text>
            </View>
          }
          renderItem={({item}) => (
            <TouchableOpacity style={styles.spotCard} onPress={()=>onSelectSpot?.(item)} activeOpacity={0.85}>
              <View style={styles.spotRow}>
                <View style={styles.spotPhoto}>
                  {item.photo_url
                    ? <Image source={{uri:item.photo_url}} style={{width:'100%',height:'100%'}}/>
                    : <View style={styles.spotPhotoEmpty}><Text style={{fontSize:20}}>{SpotTypeConfig[item.spot_type]?.emoji||'🚗'}</Text></View>
                  }
                </View>
                <View style={{flex:1,minWidth:0}}>
                  <View style={{flexDirection:'row',flexWrap:'wrap',gap:5,marginBottom:5}}>
                    <StatusBadge status={item.status}/>
                    <PriceBadge isPaid={item.is_paid}/>
                  </View>
                  <Text style={styles.spotAddr} numberOfLines={2}>{item.address||'Position signalée'}</Text>
                  {item.description?<Text style={styles.spotDesc} numberOfLines={1}>{item.description}</Text>:null}
                  <View style={{flexDirection:'row',gap:8,marginTop:3}}>
                    <View style={{flexDirection:'row',alignItems:'center',gap:3}}>
                      <ClockIcon size={11} color={Colors.text3}/>
                      <Text style={styles.metaText}>{relTime(item.last_updated||item.created_at)}</Text>
                    </View>
                    <View style={{flexDirection:'row',alignItems:'center',gap:3}}>
                      <PinIcon size={11} color={Colors.accent}/>
                      <Text style={[styles.metaText,{color:Colors.accent,fontWeight:'700'}]}>{formatDistance(item.distance)}</Text>
                    </View>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          )}
        />
      )}

      {/* Default state */}
      {!selectedLoc && results.length===0 && query.length===0 && (
        <View style={styles.emptyDefault}>
          <Text style={{fontSize:48,marginBottom:16}}>🗺️</Text>
          <Text style={styles.emptyTitle}>Recherchez une adresse</Text>
          <Text style={styles.emptySub}>Tapez une adresse, un lieu ou une ville pour voir les places disponibles dans les alentours.</Text>
          <View style={styles.exampleList}>
            {['Place de la République, Paris','Gare de Lyon','Champs-Élysées'].map(ex=>(
              <TouchableOpacity key={ex} style={styles.exampleChip} onPress={()=>{setQuery(ex);searchAddress(ex);}} activeOpacity={0.8}>
                <Text style={styles.exampleText}>📍 {ex}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
    </View>
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

const styles = StyleSheet.create({
  container:      {flex:1,backgroundColor:Colors.bg},
  header:         {padding:20,paddingBottom:10},
  title:          {fontSize:26,fontWeight:'800',color:Colors.text1,letterSpacing:-0.5,marginBottom:4},
  sub:            {fontSize:14,color:Colors.text2},
  searchWrap:     {paddingHorizontal:16,paddingBottom:8},
  searchBar:      {flexDirection:'row',alignItems:'center',backgroundColor:Colors.card,borderRadius:Radius.lg,borderWidth:1,borderColor:Colors.border,...Shadow.sm},
  searchIcon:     {fontSize:16,paddingHorizontal:14},
  searchInput:    {flex:1,fontSize:15,color:Colors.text1,paddingVertical:14},
  clearBtn:       {padding:12},
  dropdown:       {marginHorizontal:16,backgroundColor:Colors.card,borderRadius:Radius.lg,borderWidth:1,borderColor:Colors.border,overflow:'hidden',...Shadow.md,zIndex:99,marginBottom:8},
  dropItem:       {flexDirection:'row',alignItems:'center',gap:10,padding:14},
  dropIcon:       {fontSize:16,flexShrink:0},
  dropName:       {fontSize:14,fontWeight:'700',color:Colors.text1,marginBottom:2},
  dropSub:        {fontSize:12,color:Colors.text2},
  locInfo:        {flexDirection:'row',alignItems:'center',paddingHorizontal:16,paddingVertical:12,backgroundColor:Colors.accentD,marginHorizontal:16,borderRadius:Radius.lg,marginBottom:8,borderWidth:1,borderColor:Colors.borderA},
  locLabel:       {fontSize:13,fontWeight:'700',color:Colors.text1,marginBottom:2},
  locSub:         {fontSize:12,color:Colors.accent},
  filterRow:      {flexDirection:'row',gap:7,paddingHorizontal:16,paddingBottom:8},
  chip:           {paddingHorizontal:14,paddingVertical:7,borderRadius:Radius.full,borderWidth:1,borderColor:Colors.border,backgroundColor:'transparent',height:34,justifyContent:'center'},
  chipOn:         {borderColor:Colors.accent,backgroundColor:Colors.accentD},
  chipText:       {fontSize:12,fontWeight:'700',color:Colors.text2},
  spotCard:       {backgroundColor:Colors.card,borderRadius:Radius.lg,borderWidth:1,borderColor:Colors.border,padding:14,marginBottom:10,...Shadow.sm},
  spotRow:        {flexDirection:'row',gap:12},
  spotPhoto:      {width:66,height:66,borderRadius:Radius.md,overflow:'hidden',flexShrink:0,backgroundColor:Colors.surf},
  spotPhotoEmpty: {width:'100%',height:'100%',alignItems:'center',justifyContent:'center'},
  spotAddr:       {fontSize:13,fontWeight:'700',color:Colors.text1,marginBottom:3},
  spotDesc:       {fontSize:12,color:Colors.text2,marginBottom:3},
  metaText:       {fontSize:11,color:Colors.text3},
  empty:          {alignItems:'center',paddingVertical:40},
  emptyDefault:   {flex:1,alignItems:'center',justifyContent:'center',padding:32},
  emptyTitle:     {fontSize:17,fontWeight:'800',color:Colors.text2,marginBottom:8},
  emptySub:       {fontSize:13,color:Colors.text3,textAlign:'center',lineHeight:20,marginBottom:24},
  exampleList:    {gap:10,width:'100%'},
  exampleChip:    {padding:14,backgroundColor:Colors.card,borderRadius:Radius.md,borderWidth:1,borderColor:Colors.border},
  exampleText:    {fontSize:13,fontWeight:'600',color:Colors.text2},
});
