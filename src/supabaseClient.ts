import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://lqlumszqxnzmowfpioxf.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_OWl0EbdYM5n2HUzWElzilg_NpfxQkO0';
const SUPABASE_PUBLIC_KEY = SUPABASE_ANON_KEY;

// Clean any trailing whitespace, '/rest/v1/', or trailing '/' suffix so Supabase Auth & REST endpoints resolve properly
const normalizedSupabaseUrl = SUPABASE_URL.trim()
  .replace(/\/rest\/v1\/?$/, '')
  .replace(/\/+$/, '');
const normalizedSupabaseKey = SUPABASE_ANON_KEY.trim();

// Proactively remove expired or malformed local auth tokens before client startup to prevent 400 refresh_token errors
if (typeof window !== 'undefined' && window.localStorage) {
  const authStorageKey = 'sb-lqlumszqxnzmowfpioxf-auth-token';
  try {
    const rawToken = window.localStorage.getItem(authStorageKey);
    if (rawToken) {
      const parsed = JSON.parse(rawToken);
      const expiresAt = Number(parsed?.expires_at || 0);
      if (
        !parsed?.access_token ||
        !parsed?.refresh_token ||
        (expiresAt > 0 && expiresAt * 1000 < Date.now())
      ) {
        window.localStorage.removeItem(authStorageKey);
      }
    }
  } catch {
    try {
      window.localStorage.removeItem(authStorageKey);
    } catch {
      // Ignore storage access errors
    }
  }
}

const customFetch: typeof fetch = async (input, init) => {
  const urlStr =
    typeof input === 'string'
      ? input
      : input instanceof URL
      ? input.toString()
      : input.url;

  // Ensure PostgREST (/rest/v1/) and Storage (/storage/v1/) calls pass the valid apikey and retry with publishable key if a stale JWT causes 401/403
  if (urlStr.includes('/rest/v1/') || urlStr.includes('/storage/v1/')) {
    const headers = new Headers(init?.headers || {});
    headers.set('apikey', normalizedSupabaseKey);
    if (!headers.get('Authorization')) {
      headers.set('Authorization', `Bearer ${normalizedSupabaseKey}`);
    }

    const res = await fetch(input, { ...init, headers });
    if (res.status === 401 || res.status === 403) {
      headers.set('Authorization', `Bearer ${normalizedSupabaseKey}`);
      return fetch(input, { ...init, headers });
    }
    return res;
  }

  return fetch(input, init);
};

export const supabase = createClient(
  normalizedSupabaseUrl,
  normalizedSupabaseKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
    global: {
      fetch: customFetch,
    },
  }
);

export { SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_PUBLIC_KEY };
export default supabase;
