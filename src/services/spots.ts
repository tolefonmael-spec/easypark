// src/services/spots.ts
import { supabase } from './supabase';
import { Spot, SpotStatus, SpotType, Review } from '../types';

export function calcDistance(lat1:number, lon1:number, lat2:number, lon2:number): number {
  const R=6371000, r=Math.PI/180;
  const dLat=(lat2-lat1)*r, dLon=(lon2-lon1)*r;
  const a=Math.sin(dLat/2)**2+Math.cos(lat1*r)*Math.cos(lat2*r)*Math.sin(dLon/2)**2;
  return R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
}

export function formatDistance(m:number): string {
  return m<1000?`${Math.round(m)} m`:`${(m/1000).toFixed(1)} km`;
}

export async function fetchSpots(): Promise<Spot[]> {
  const { data, error } = await supabase
    .from('spots')
    .select('*, profiles:reported_by(username, avatar_url)')
    .order('created_at', { ascending: false })
    .limit(200);
  if (error) throw error;
  return (data || []) as Spot[];
}

export async function createSpot(params: {
  lat:number; lng:number; address:string; description:string;
  photo_url:string; status:SpotStatus; spot_type:SpotType;
  is_paid:boolean; reported_by:string; free_at:string|null;
}): Promise<Spot> {
  const { data, error } = await supabase
    .from('spots')
    .insert({ ...params, city:'Paris', last_updated: new Date().toISOString() })
    .select()
    .single();
  if (error) throw error;
  return data as Spot;
}

export async function updateSpotStatus(spotId:string, status:SpotStatus): Promise<void> {
  const { error } = await supabase
    .from('spots')
    .update({ status, free_at: null, last_updated: new Date().toISOString() })
    .eq('id', spotId);
  if (error) throw error;
}

export async function createReport(params:{
  spot_id:string; user_id:string; status:SpotStatus;
  description:string; photo_url:string; lat:number; lng:number; address:string;
}): Promise<void> {
  const { error } = await supabase.from('reports').insert(params);
  if (error) throw error;
}

export async function submitReview(params:{
  spot_id:string; reviewer_id:string; rating:number;
  comment:string; was_accurate:boolean|null;
}): Promise<void> {
  const { error } = await supabase.from('reviews').upsert({
    ...params,
    created_at: new Date().toISOString()
  }, { onConflict: 'spot_id,reviewer_id' });
  if (error) throw error;
}

export async function fetchReviews(spotId:string): Promise<Review[]> {
  const { data, error } = await supabase
    .from('reviews')
    .select('*, profiles:reviewer_id(username, avatar_url)')
    .eq('spot_id', spotId)
    .order('created_at', { ascending: false })
    .limit(10);
  if (error) throw error;
  return (data||[]) as Review[];
}

export async function reverseGeocode(lat:number, lng:number): Promise<string> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=fr`,
      { headers:{'Accept-Language':'fr'} }
    );
    const j = await res.json();
    if (j?.display_name) return j.display_name.split(',').slice(0,3).join(', ').trim();
  } catch(_) {}
  return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
}

export async function uploadPhoto(bucket:string, userId:string, uri:string): Promise<string> {
  // Determine extension — handle content:// URIs on Android
  let ext = 'jpg';
  const uriParts = uri.split('.');
  if (uriParts.length > 1) {
    const candidate = uriParts.pop()?.toLowerCase().split('?')[0] || 'jpg';
    if (['jpg','jpeg','png','webp','gif','heic'].includes(candidate)) {
      ext = candidate === 'jpeg' ? 'jpg' : candidate;
    }
  }
  const mimeType = ext === 'jpg' ? 'image/jpeg' : `image/${ext}`;
  const path = `${userId}/${Date.now()}.${ext}`;

  // Use FormData — works with both file:// and content:// URIs on Android/iOS
  const formData = new FormData();
  formData.append('file', {
    uri,
    name: `upload.${ext}`,
    type: mimeType,
  } as any);

  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  if (!token) throw new Error('Non authentifié');

  const supabaseUrl = 'https://wgrnvyezitzpmpguuvsb.supabase.co';
  const uploadUrl = `${supabaseUrl}/storage/v1/object/${bucket}/${path}`;

  const response = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'x-upsert': 'true',
    },
    body: formData,
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Upload failed: ${errText}`);
  }

  const { data:{ publicUrl } } = supabase.storage.from(bucket).getPublicUrl(path);
  return publicUrl;
}
