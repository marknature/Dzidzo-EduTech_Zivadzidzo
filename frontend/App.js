import React, { useEffect, useState, useCallback } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';

import { supabase, isSupabaseConfigured } from './src/lib/supabaseClient';
import AuthScreen from './src/screens/AuthScreen';
import RootNavigator from './src/navigation/RootNavigator';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://127.0.0.1:5000';

// Provisions (or fetches) the caller's profiles row right after sign-in/sign-up.
// See backend/routes/auth.js - this is the one call that must succeed before any
// other authenticated route will accept the session.
async function syncProfile(accessToken) {
  const response = await fetch(`${API_URL}/auth/session-sync`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({}),
  });
  const result = await response.json();
  if (!result.success) throw new Error(result.error || 'Could not sync session.');
  return result.profile;
}

export default function App() {
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);

  const hydrateFromSession = useCallback(async (nextSession) => {
    setSession(nextSession);
    if (!nextSession) {
      setProfile(null);
      return;
    }
    try {
      const syncedProfile = await syncProfile(nextSession.access_token);
      setProfile(syncedProfile);
    } catch (error) {
      console.warn('Profile sync failed:', error.message);
      setProfile(null);
    }
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      // Mirrors the backend's own demo-mode fallback: the curriculum-audit flow keeps
      // working without any Supabase project configured, matching the pre-auth demo.
      setLoading(false);
      return undefined;
    }

    let isMounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!isMounted) return;
      hydrateFromSession(data.session).finally(() => setLoading(false));
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      hydrateFromSession(nextSession);
    });

    return () => {
      isMounted = false;
      subscription?.subscription?.unsubscribe();
    };
  }, [hydrateFromSession]);

  const handleSignOut = useCallback(async () => {
    if (!isSupabaseConfigured) return;
    await supabase.auth.signOut();
  }, []);

  if (loading) {
    return (
      <View className="flex-1 bg-[#0A0F1D] items-center justify-center">
        <StatusBar style="light" />
        <ActivityIndicator color="#3B82F6" />
      </View>
    );
  }

  // No Supabase project configured: skip the auth gate entirely so the curriculum
  // auditor (the working demo path) stays usable, same as the backend's own fallback.
  if (!isSupabaseConfigured) {
    return (
      <>
        <StatusBar style="light" />
        <RootNavigator profile={null} userEmail={null} onSignOut={handleSignOut} />
      </>
    );
  }

  if (!session) {
    return (
      <>
        <StatusBar style="light" />
        <AuthScreen />
      </>
    );
  }

  return (
    <>
      <StatusBar style="light" />
      <RootNavigator profile={profile} userEmail={session.user?.email} onSignOut={handleSignOut} />
    </>
  );
}
