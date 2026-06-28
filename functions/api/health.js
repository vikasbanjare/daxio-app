// Diagnostic endpoint:  GET /api/health
// Reports which environment variables the Pages Functions can actually see
// at runtime. For the secret keys it returns ONLY true/false (never the
// secret value). SUPABASE_URL is public (it's already in config.js), so we
// echo it back to confirm there are no typos/whitespace. Safe to deploy.

export function onRequestGet(context) {
  const env = (context && context.env) || {};
  const has = (k) => (env[k] != null && String(env[k]).length > 0);

  const body = {
    ok: true,
    can_see_env: !!(context && context.env),
    SUPABASE_URL: has('SUPABASE_URL'),
    SUPABASE_URL_value: env.SUPABASE_URL || null,
    SUPABASE_ANON_KEY: has('SUPABASE_ANON_KEY'),
    SUPABASE_SERVICE_ROLE: has('SUPABASE_SERVICE_ROLE'),
    R2_ACCOUNT_ID: has('R2_ACCOUNT_ID'),
    R2_ACCESS_KEY_ID: has('R2_ACCESS_KEY_ID'),
    R2_SECRET_ACCESS_KEY: has('R2_SECRET_ACCESS_KEY'),
    R2_BUCKET: has('R2_BUCKET'),
    R2_PUBLIC_BASE: has('R2_PUBLIC_BASE')
  };

  return new Response(JSON.stringify(body, null, 2), {
    status: 200,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
  });
}
