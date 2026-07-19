import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// Only EXPO_PUBLIC_* variables reach the client bundle. Supabase's current
// publishable key name is preferred, while the legacy anon-key name remains
// supported for existing deployments. The service role key never leaves backend/.
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabasePublishableKey = process.env.EXPO_PUBLIC_SUPABASE_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// Native sessions are persisted in SecureStore. Expo SecureStore's web module does
// not provide the native async methods, so web deliberately uses Supabase's default
// browser localStorage adapter instead. Using the native adapter on web makes a
// password login fail while it tries to persist the session.
const SecureStoreAdapter = {
  getItem: (key) => SecureStore.getItemAsync(key),
  setItem: (key, value) => SecureStore.setItemAsync(key, value),
  removeItem: (key) => SecureStore.deleteItemAsync(key),
};

export const isSupabaseConfigured = Boolean(supabaseUrl && supabasePublishableKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabasePublishableKey, {
      auth: {
        ...(Platform.OS === 'web' ? {} : { storage: SecureStoreAdapter }),
        autoRefreshToken: true,
        persistSession: true,
        // Web magic links return the auth tokens in the URL; native clients use
        // their configured deep-link flow instead.
        detectSessionInUrl: Platform.OS === 'web',
      },
    })
  : null;
