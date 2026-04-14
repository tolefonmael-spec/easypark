// src/hooks/useLocation.ts
import { useState, useEffect } from 'react';
import * as Location from 'expo-location';

export function useLocation() {
  const [location, setLocation]   = useState<{ lat: number; lng: number } | null>(null);
  const [error, setError]         = useState<string | null>(null);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    let subscription: Location.LocationSubscription | null = null;

    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('Permission de localisation refusée.');
        setLoading(false);
        return;
      }
      // Get initial position fast
      const initial = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setLocation({ lat: initial.coords.latitude, lng: initial.coords.longitude });
      setLoading(false);

      // Watch for updates
      subscription = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, timeInterval: 10000, distanceInterval: 10 },
        pos => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude })
      );
    })();

    return () => { subscription?.remove(); };
  }, []);

  return { location, error, loading };
}
