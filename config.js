// Daxio — PUBLIC browser config for the LIVE site (daxio-app.pages.dev).
// PUBLIC values only. The secret keys live in Cloudflare's env vars, never here.
// No API_BASE here: on the live site the app calls its own same-origin /api functions.
window.DAXIO_CONFIG = {
  SUPABASE_URL: 'https://bqgdvrzojejipzcbibvm.supabase.co',
  SUPABASE_ANON_KEY: 'sb_publishable_lKNkijnP3uvClCNGQzzd-w_XK_S9H7f',
  R2_PUBLIC_BASE: 'https://pub-2adfc312d31f4453bc9c8e97cd430e04.r2.dev'
};
