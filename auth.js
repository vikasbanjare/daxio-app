// auth.js — thin authentication wrapper around the shared Supabase client.
//
// Every function here delegates to `supabase.auth` (see ./supabase.js) and
// throws on error so callers can use try/catch. The client is configured with
// detectSessionInUrl + persistSession, so magic-link and OAuth redirects are
// picked up automatically on page load and the session survives reloads.
//
// Public API (matches the agreed client surface exactly):
//   getUser()                  -> the current user object, or null if signed out
//   onAuth(cb) -> unsub        -> subscribe to auth changes; returns unsubscribe
//   signInEmail(email)         -> send a magic link (redirect back to this origin)
//   signInOAuth(provider)      -> 'google' | 'azure' OAuth sign-in (redirects)
//   signOut()                  -> sign the user out

import { supabase } from './supabase.js';

// Resolve the current signed-in user, or null if there is no session.
// Throws if Supabase reports an error reading the user.
export async function getUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error) {
    // A missing session is not an exceptional case — getUser() errors when
    // there's simply no logged-in user, so treat that as "signed out".
    if (error.name === 'AuthSessionMissingError') return null;
    throw error;
  }
  return data?.user ?? null;
}

// Subscribe to auth state changes (sign in, sign out, token refresh, etc.).
// `cb` is invoked with the current user (or null) whenever the state changes.
// Returns an unsubscribe function — call it to stop listening.
export function onAuth(cb) {
  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    cb(session?.user ?? null);
  });
  return () => data.subscription.unsubscribe();
}

// Send a passwordless magic-link email. The link brings the user back to this
// site's origin, where detectSessionInUrl completes the sign-in automatically.
export async function signInEmail(email) {
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: location.origin },
  });
  if (error) throw error;
}

// Start an OAuth sign-in flow. Supported providers: 'google' and 'azure'.
// This redirects the browser to the provider and back to this origin.
export async function signInOAuth(provider) {
  const { error } = await supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo: location.origin },
  });
  if (error) throw error;
}

// Sign the current user out and clear the persisted session.
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}
