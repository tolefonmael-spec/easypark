// src/services/auth.ts
import { supabase } from './supabase';

export async function signUp(
  email: string, password: string, username: string, fullName: string,
  extra?: { phone?:string; city?:string; gender?:string; vehicle_type?:string }
) {
  const { data, error } = await supabase.auth.signUp({
    email, password,
    options: {
      data: {
        username: username.toLowerCase(),
        full_name: fullName,
        phone:        extra?.phone        || '',
        city:         extra?.city         || 'Paris',
        gender:       extra?.gender       || '',
        vehicle_type: extra?.vehicle_type || 'car',
      },
    },
  });
  return { data, error };
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  return { data, error };
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  return { error };
}

export async function getSession() {
  const { data: { session }, error } = await supabase.auth.getSession();
  return { session, error };
}
