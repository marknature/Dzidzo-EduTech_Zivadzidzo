import { supabase, isSupabaseConfigured } from './supabaseClient';

export const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://127.0.0.1:5000';

// Every authenticated call goes through here so the bearer token is attached
// consistently - mobile never talks to Supabase with anything but its own session, and
// never calls OpenAI directly (see prompt.md's "mobile always calls through backend/" rule).
export async function apiFetch(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (isSupabaseConfigured) {
    const { data } = await supabase.auth.getSession();
    if (data.session?.access_token) headers.Authorization = `Bearer ${data.session.access_token}`;
  }

  const response = await fetch(`${API_URL}${path}`, { ...options, headers });
  const result = await response.json().catch(() => ({}));
  if (!response.ok || result.success === false) {
    throw new Error(result.error || `Request to ${path} failed (${response.status}).`);
  }
  return result;
}
