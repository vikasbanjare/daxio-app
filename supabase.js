// supabase.js — singleton Supabase client for the Daxio browser app.
//
// Reads public config from window.DAXIO_CONFIG (loaded by /config.js):
//   { SUPABASE_URL, SUPABASE_ANON_KEY }
// Exports the shared `supabase` client and an async getAccessToken() helper.
//
// No build step: we import supabase-js straight from esm.sh as an ES module.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Pull public config injected on the window by /config.js. The anon key is
// safe to expose to the browser; RLS protects the data server-side.
const config = window.DAXIO_CONFIG || {};
const { SUPABASE_URL, SUPABASE_ANON_KEY } = config;

// Guard: without config the client can't work. Log a clear, actionable error
// rather than letting createClient throw something cryptic.
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error(
    '[Daxio] Missing Supabase config. Ensure /config.js loads before this ' +
      'module and defines window.DAXIO_CONFIG = { SUPABASE_URL, SUPABASE_ANON_KEY }. ' +
      'Copy /config.example.js to /config.js to get started.'
  );
}

// The one and only Supabase client for the whole app (singleton). Other modules
// import this instance instead of creating their own, so a single auth session
// and realtime connection is shared everywhere.
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    // Persist the session in localStorage and keep it fresh so users stay
    // signed in across reloads, and pick up the session from magic-link /
    // OAuth redirect URLs automatically.
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

// Return the current session's JWT access token, or null if signed out.
// Used by upload.js (and any other caller) to authorize Pages Function calls
// via an `Authorization: Bearer <token>` header.
export async function getAccessToken() {
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    console.error('[Daxio] Failed to read Supabase session:', error.message);
    return null;
  }
  return data?.session?.access_token ?? null;
}
