export type SpotStatus = 'free' | 'occupied' | 'soon';
export type SpotType   = 'standard' | 'pmr' | 'two_wheels' | 'delivery' | 'electric';

export interface Spot {
  id: string; lat: number; lng: number;
  address: string; city: string; description: string; photo_url: string;
  status: SpotStatus; spot_type: SpotType; is_paid: boolean;
  free_at: string | null; reported_by: string | null;
  confirmed_count: number; last_updated: string; created_at: string;
  profiles?: { username: string; avatar_url?: string } | null;
  distance?: number;
}

export interface Profile {
  id: string; username: string; full_name: string; avatar_url: string;
  city: string; phone: string; gender: string; vehicle_type: string;
  points: number; reliability: number; level: number;
  notifications_enabled: boolean; radius_km: number; created_at: string;
}

export interface Report {
  id: string; spot_id: string; user_id: string; status: SpotStatus;
  description: string; photo_url: string; lat: number | null; lng: number | null;
  address: string; created_at: string;
  spots?: { address: string; status: SpotStatus } | null;
}

export interface Review {
  id: string; spot_id: string; reviewer_id: string; rating: number;
  comment: string; was_accurate: boolean | null; created_at: string;
  profiles?: { username: string; avatar_url?: string } | null;
}

export interface Notification {
  id: string; user_id: string; type: string; title: string;
  message: string; read: boolean; data: Record<string, unknown> | null; created_at: string;
}

export interface Badge {
  id: number; slug: string; name: string; description: string; emoji: string;
  condition_type: string; condition_value: number; points_reward: number;
}
