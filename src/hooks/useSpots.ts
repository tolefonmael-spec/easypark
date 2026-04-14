// src/hooks/useSpots.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../services/supabase';
import { fetchSpots, calcDistance, updateSpotStatus } from '../services/spots';
import { Spot } from '../types';

interface Location { lat: number; lng: number }

export function useSpots(userLocation: Location | null) {
  const [spots, setSpots]     = useState<Spot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchSpots();
      setSpots(data);
      setError(null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();

    // Realtime subscription
    const channel = supabase
      .channel('spots-mobile')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'spots' }, payload => {
        if (payload.eventType === 'INSERT') {
          setSpots(prev => [payload.new as Spot, ...prev]);
        }
        if (payload.eventType === 'UPDATE') {
          setSpots(prev => prev.map(s => s.id === payload.new.id ? { ...s, ...(payload.new as Spot) } : s));
        }
        if (payload.eventType === 'DELETE') {
          setSpots(prev => prev.filter(s => s.id !== payload.old.id));
        }
      })
      .subscribe();

    // Auto-expire "soon" spots every 30s
    timerRef.current = setInterval(async () => {
      const now = new Date().toISOString();
      setSpots(prev => {
        const toExpire = prev.filter(s => s.status === 'soon' && s.free_at && s.free_at <= now);
        toExpire.forEach(s => updateSpotStatus(s.id, 'free').catch(() => {}));
        if (toExpire.length === 0) return prev;
        return prev.map(s => toExpire.find(e => e.id === s.id) ? { ...s, status: 'free' as const, free_at: null } : s);
      });
    }, 30000);

    return () => {
      supabase.removeChannel(channel);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [load]);

  // Spots sorted by distance if location available
  const nearbySpots = userLocation
    ? spots
        .map(s => ({ ...s, distance: calcDistance(userLocation.lat, userLocation.lng, s.lat, s.lng) }))
        .filter(s => s.distance <= 1000)
        .sort((a, b) => a.distance - b.distance)
    : spots.map(s => ({ ...s, distance: null as any }));

  return { spots: nearbySpots, allSpots: spots, loading, error, refresh: load };
}
