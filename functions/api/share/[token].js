// ============================================================
// Daxio — Public share endpoint  ->  GET /api/share/:token
//
// A Cloudflare Pages Function that lets an *anonymous* (no-account)
// viewer open a project or a single asset that a team member shared.
//
// Flow:
//   1. Look up share_links by the token in the URL.
//        - not found            -> 404
//        - expired (expires_at) -> 410
//        - password set & ?pw=  -> must match, else 401
//   2. Using the SERVICE ROLE key (which bypasses Row-Level Security),
//      load the linked project (or asset) and walk down to its
//      assets -> versions -> comments, and return ONE JSON payload the
//      external review page can render.
//
// Why the service role is safe here: RLS would normally hide these rows
// from an anonymous request, but the share token *is* the authorization —
// we only ever return the exact project/asset the token points at, and we
// strip the password before sending anything back.
//
// Runs on the Cloudflare Workers runtime — Web standards only, no Node.
// ============================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Permissive, read-only CORS so the share page can be hosted anywhere.
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, x-share-password',
  'Access-Control-Max-Age': '86400',
};

// Small helper: JSON response with CORS headers attached.
function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS },
  });
}

// Preflight (and any stray OPTIONS) -> just the CORS headers.
export function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS });
}

export async function onRequestGet(context) {
  const { env, params, request } = context;
  const token = params.token;

  if (!token) return json({ error: 'Missing share token.' }, 400);

  // Service-role client — bypasses RLS. The token is the authorization,
  // so we are careful to only return what the token points at.
  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // 1) Resolve the share link --------------------------------------
  const { data: link, error: linkErr } = await supabase
    .from('share_links')
    .select('id, token, project_id, asset_id, can_comment, expires_at, created_at')
    .eq('token', token)
    .maybeSingle();

  if (linkErr) return json({ error: 'Lookup failed.' }, 500);
  if (!link) return json({ error: 'Share link not found.' }, 404);

  // Expired?  (expires_at is optional; null = never expires)
  if (link.expires_at && new Date(link.expires_at).getTime() < Date.now()) {
    return json({ error: 'This share link has expired.' }, 410);
  }

  // Password-protected? Verify against the bcrypt hash INSIDE Postgres via the
  // verify_share() RPC (it returns true when no password is set), so the hash
  // never enters this function. The password is read from the `x-share-password`
  // header rather than the URL query, keeping it out of access logs.
  {
    const pw = request.headers.get('x-share-password')
      || new URL(request.url).searchParams.get('pw'); // legacy fallback
    const { data: ok, error: vErr } = await supabase.rpc('verify_share', { p_token: token, p_pw: pw });
    if (vErr) return json({ error: 'Password check failed.' }, 500);
    if (ok !== true) return json({ error: 'Password required or incorrect.' }, 401);
  }

  // What the public viewer is allowed to know about the link itself
  // (NEVER leak the password).
  const share = {
    token: link.token,
    can_comment: !!link.can_comment,
    scope: link.asset_id ? 'asset' : 'project',
    created_at: link.created_at,
  };

  // 2) Decide the set of assets in scope ---------------------------
  // An asset link exposes exactly one asset; a project link exposes
  // every asset in the project.
  let project = null;
  let assets = [];

  if (link.asset_id) {
    const { data: asset, error: aErr } = await supabase
      .from('assets')
      .select('id, project_id, title, status, created_at')
      .eq('id', link.asset_id)
      .maybeSingle();
    if (aErr) return json({ error: 'Could not load asset.' }, 500);
    if (!asset) return json({ error: 'Shared asset no longer exists.' }, 404);
    assets = [asset];

    // Include the parent project as light context (name/color only).
    const { data: proj } = await supabase
      .from('projects')
      .select('id, name, color, created_at')
      .eq('id', asset.project_id)
      .maybeSingle();
    project = proj || null;
  } else if (link.project_id) {
    const { data: proj, error: pErr } = await supabase
      .from('projects')
      .select('id, name, color, created_at')
      .eq('id', link.project_id)
      .maybeSingle();
    if (pErr) return json({ error: 'Could not load project.' }, 500);
    if (!proj) return json({ error: 'Shared project no longer exists.' }, 404);
    project = proj;

    const { data: rows, error: asErr } = await supabase
      .from('assets')
      .select('id, project_id, title, status, created_at')
      .eq('project_id', proj.id)
      .order('created_at', { ascending: true });
    if (asErr) return json({ error: 'Could not load assets.' }, 500);
    assets = rows || [];
  } else {
    // A link that points at neither a project nor an asset is broken.
    return json({ error: 'Share link is not attached to anything.' }, 404);
  }

  // 3) Walk down: versions for those assets, comments for those versions.
  const assetIds = assets.map((a) => a.id);

  let versions = [];
  if (assetIds.length) {
    const { data: vRows, error: vErr } = await supabase
      .from('versions')
      .select('id, asset_id, label, kind, r2_key, stream_uid, mux_playback_id, duration, created_at')
      .in('asset_id', assetIds)
      .order('created_at', { ascending: true });
    if (vErr) return json({ error: 'Could not load versions.' }, 500);
    versions = vRows || [];
  }

  const versionIds = versions.map((v) => v.id);

  let comments = [];
  if (versionIds.length) {
    const { data: cRows, error: cErr } = await supabase
      .from('comments')
      .select('id, version_id, author, guest_name, body, t, in_a, in_b, point_x, point_y, drawing, resolved, created_at')
      .in('version_id', versionIds)
      .order('created_at', { ascending: true });
    if (cErr) return json({ error: 'Could not load comments.' }, 500);
    comments = cRows || [];
  }

  // 4) Assemble the nested payload the viewer renders --------------
  //    project -> assets[] -> versions[] -> comments[]
  const versionsByAsset = new Map();
  for (const v of versions) {
    if (!versionsByAsset.has(v.asset_id)) versionsByAsset.set(v.asset_id, []);
    versionsByAsset.get(v.asset_id).push({ ...v, comments: [] });
  }
  const commentTargets = new Map(); // version_id -> that version's comments array
  for (const list of versionsByAsset.values()) {
    for (const v of list) commentTargets.set(v.id, v.comments);
  }
  for (const c of comments) {
    const target = commentTargets.get(c.version_id);
    if (target) target.push(c);
  }

  const assetsOut = assets.map((a) => ({
    ...a,
    versions: versionsByAsset.get(a.id) || [],
  }));

  return json({ share, project, assets: assetsOut });
}
