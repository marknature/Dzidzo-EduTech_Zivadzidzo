import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { GraduationCap, Mail, Lock } from 'lucide-react-native';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

// Single-institution mode (Phase 0): every new sign-up is provisioned onto the one
// seeded institution server-side by POST /auth/session-sync, so there is no
// institution picker here yet - the schema stays multi-tenant-ready underneath.
export default function AuthScreen() {
  const [mode, setMode] = useState('sign_in'); // 'sign_in' | 'sign_up' | 'magic_link'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isSupabaseConfigured) {
    return (
      <View className="flex-1 bg-[#0A0F1D] items-center justify-center px-6">
        <Text className="text-white text-lg font-bold mb-2 text-center">Supabase is not configured</Text>
        <Text className="text-gray-400 text-sm text-center">
          Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in frontend/.env to enable sign-in.
        </Text>
      </View>
    );
  }

  const handleSubmit = async () => {
    if (!email.trim()) {
      Alert.alert('Missing email', 'Please enter your email address.');
      return;
    }
    setLoading(true);
    try {
      if (mode === 'magic_link') {
        const { error } = await supabase.auth.signInWithOtp({ email: email.trim() });
        if (error) throw error;
        Alert.alert('Check your email', 'We sent you a magic sign-in link.');
        return;
      }

      if (!password) {
        Alert.alert('Missing password', 'Please enter your password.');
        return;
      }

      const { error } =
        mode === 'sign_up'
          ? await supabase.auth.signUp({ email: email.trim(), password })
          : await supabase.auth.signInWithPassword({ email: email.trim(), password });

      if (error) throw error;

      if (mode === 'sign_up') {
        Alert.alert('Account created', 'Check your email to confirm your account, then sign in.');
        setMode('sign_in');
      }
      // On successful sign-in, App.js's onAuthStateChange listener takes over
      // (session-sync + navigating into RootNavigator).
    } catch (error) {
      Alert.alert('Authentication error', error.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1 bg-[#0A0F1D]"
    >
      <View className="flex-1 justify-center px-6">
        <View className="items-center mb-10">
          <GraduationCap color="#3B82F6" size={40} />
          <Text className="text-white text-2xl font-bold mt-3">ZivaDzidzo</Text>
          <Text className="text-gray-400 text-xs uppercase tracking-widest mt-1">ChiedzaAI Platform</Text>
        </View>

        <View className="bg-[#141B2D] border border-gray-800 rounded-3xl p-5">
          <View className="flex-row items-center bg-[#0A0F1D] border border-gray-800 rounded-xl px-4 mb-3">
            <Mail color="#6B7280" size={16} />
            <TextInput
              className="flex-1 text-white px-3 py-3"
              placeholder="Email"
              placeholderTextColor="#6B7280"
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          {mode !== 'magic_link' && (
            <View className="flex-row items-center bg-[#0A0F1D] border border-gray-800 rounded-xl px-4 mb-4">
              <Lock color="#6B7280" size={16} />
              <TextInput
                className="flex-1 text-white px-3 py-3"
                placeholder="Password"
                placeholderTextColor="#6B7280"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
            </View>
          )}

          <TouchableOpacity
            className="bg-accent rounded-xl py-4 items-center justify-center mb-3"
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white font-bold">
                {mode === 'sign_in' ? 'Sign In' : mode === 'sign_up' ? 'Create Account' : 'Send Magic Link'}
              </Text>
            )}
          </TouchableOpacity>

          <View className="flex-row justify-center flex-wrap">
            <TouchableOpacity onPress={() => setMode(mode === 'sign_in' ? 'sign_up' : 'sign_in')}>
              <Text className="text-blue-400 text-xs">
                {mode === 'sign_in' ? "Need an account? Sign up" : 'Have an account? Sign in'}
              </Text>
            </TouchableOpacity>
            <Text className="text-gray-600 text-xs mx-2">·</Text>
            <TouchableOpacity onPress={() => setMode(mode === 'magic_link' ? 'sign_in' : 'magic_link')}>
              <Text className="text-blue-400 text-xs">
                {mode === 'magic_link' ? 'Use a password instead' : 'Use a magic link instead'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
