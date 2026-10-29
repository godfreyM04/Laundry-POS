import { createClient } from '@supabase/supabase-js';

// Sanitize URL by removing trailing slashes and /rest/v1 if inadvertently pasted
export function sanitizeSupabaseUrl(url) {
  if (!url) return '';
  return url.trim().replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
}

// Check if a key is mistakenly a secret / service_role key
export function isSecretKey(key) {
  if (!key) return false;
  const k = key.trim();
  return k.startsWith('sb_secret_') || k.includes('service_role');
}

// Retrieve config from localStorage (for dynamic in-browser configuration) or environment variables
export function getStoredSupabaseConfig() {
  const localUrl = localStorage.getItem('laundrypos_supabase_url');
  const localKey = localStorage.getItem('laundrypos_supabase_anon_key');

  const envUrl = import.meta.env.VITE_SUPABASE_URL || '';
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

  const rawUrl = localUrl || envUrl;
  const rawKey = localKey || envKey;

  const url = sanitizeSupabaseUrl(rawUrl);
  const anonKey = rawKey ? rawKey.trim() : '';

  const hasSecretKey = isSecretKey(anonKey);

  const isConfigured = Boolean(
    url &&
    anonKey &&
    !hasSecretKey &&
    !url.includes('your-project-id') &&
    !url.includes('placeholder-project') &&
    !anonKey.includes('placeholder')
  );

  return { url, anonKey, isConfigured, hasSecretKey };
}

const { url: initialUrl, anonKey: initialKey, isConfigured: initialConfigured } = getStoredSupabaseConfig();

// Safe fallback placeholder for createClient initialization so it doesn't crash on invalid/secret key
const safeUrl = initialConfigured && initialUrl ? initialUrl : 'https://xyzcompanyplaceholder.supabase.co';
const safeKey = initialConfigured && initialKey ? initialKey : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummy';

export const supabase = createClient(safeUrl, safeKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

export function isSupabaseLive() {
  return getStoredSupabaseConfig().isConfigured;
}

export function saveSupabaseConfig(url, anonKey) {
  if (url) localStorage.setItem('laundrypos_supabase_url', sanitizeSupabaseUrl(url));
  if (anonKey) localStorage.setItem('laundrypos_supabase_anon_key', anonKey.trim());
}

export function clearCustomSupabaseConfig() {
  localStorage.removeItem('laundrypos_supabase_url');
  localStorage.removeItem('laundrypos_supabase_anon_key');
}

/**
 * Test connectivity with Supabase project
 */
export async function testSupabaseConnection(overrideUrl, overrideKey) {
  const rawUrl = overrideUrl || getStoredSupabaseConfig().url;
  const rawKey = overrideKey || getStoredSupabaseConfig().anonKey;

  const testUrl = sanitizeSupabaseUrl(rawUrl);
  const testKey = rawKey ? rawKey.trim() : '';

  if (!testUrl || !testKey) {
    return { ok: false, error: 'Missing Supabase URL or Anon Key' };
  }

  if (isSecretKey(testKey)) {
    return {
      ok: false,
      error: 'Forbidden use of secret API key in browser. Please use your "anon" (public/publishable) key from Supabase Dashboard > Project Settings > API, NOT the "service_role" secret key.'
    };
  }

  try {
    const tempClient = createClient(testUrl, testKey);
    const { data, error } = await tempClient.from('services').select('count', { count: 'exact', head: true });
    if (error) {
      if (error.code === '42P01') {
        return {
          ok: true,
          schemaMissing: true,
          message: 'Connected to Supabase, but the schema tables have not been created yet. Run the SQL migrations.'
        };
      }
      return { ok: false, error: error.message || 'Failed to query Supabase' };
    }
    return { ok: true, schemaMissing: false, message: 'Successfully connected to Supabase database!' };
  } catch (err) {
    return { ok: false, error: err.message || 'Connection test failed' };
  }
}
