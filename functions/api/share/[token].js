// ============================================================
// Daxio — Public share endpoint  ->  GET /api/share/:token
//
// A Cloudflare Pages Function that lets an *anonymous* (no-account)
// viewer open a project or a single asset that a team member shared.
//
// ZERO dependencies: the Cloudflare Workers runtime cannot import
// modules from a URL (e.g. esm.sh), so instead of the supabase-js
// client we talk to Supabase directly over its REST API with plain
// fetch, using the SERVICE ROLE key (which bypasses Row-Level
// Security). The share token is the authorization — we only ever
// return the exact project/asset the token points at, and we never
// leak the password.
// ============================================================

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

  // Supabase REST base + service-role auth headers (bypasses RLS).
  const base = env.SUPABASE_URL.replace(/\/$/, '') + '/rest/v1';
  const headers = {
    apikey: env.SUPABASE_SERVICE_ROLE,
    Authorization: 'Bearer ' + env.SUPABASE_SERVICE_ROLE,
    'Content-Type': 'application/json',
  };

  // Helper: GET rows from PostgREST with a raw query string.
  async function sel(path) {
    const r = await fetch(base + path, { headers });
    if (!r.ok) throw new Error('db ' + r.status);
    return r.json();
  }

  // 1) Resolve the share link --------------------------------------
  let link;
  try {
    const rows = await sel(
      `/share_links?token=eq.${encodeURIComponent(token)}` +
      `&select=id,token,project_id,asset_id,can_comment,expires_at,created_at`
    );
    link = rows[0];
  } catch {
    return json({ error: 'Lookup failed.' }, 500);
  }
  if (!link) return json({ error: 'Share link not found.' }, 404);

  // Expired?  (expires_at is optional; null = never expires)
  if (link.expires_at && new Date(link.expires_at).getTime() < Date.now()) {
    return json({ error: 'This share link has expired.' }, 410);
  }

  // Password-protected? Verify against the hash INSIDE Postgres via the
  // verify_share() RPC (returns true when no password is set), so the hash
  // never enters this function. Password is read from the x-share-password
  // header (kept out of access logs), with a legacy ?pw= fallback.
  {
    const pw = request.headers.get('x-share-password')
      || new URL(request.url).searchParams.get('pw');
    let ok = false;
    try {
      const r = await fetch(base + '/rpc/verify_share', {
        method: 'POST',
        headers,
        body: JSON.stringify({ p_token: token, p_pw: pw }),
      });
      if (!r.ok) return json({ error: 'Password check failed.' }, 500);
      ok = await r.json(); // the function returns a boolean
    } catch {
      return json({ error: 'Password check failed.' }, 500);
    }
    if (ok !== true) return json({ error: 'Password required or incorrect.' }, 401);
  }

  // What the public viewer may know about the link (NEVER the password).
  const share = {
    token: link.token,
    can_comment: !!link.can_comment,
    scope: link.asset_id ? 'asset' : 'project',
    created_at: link.created_at,
  };

  // 2) Decide the set of assets in scope ---------------------------
  let project = null;
  let assets = [];
  try {
    if (link.asset_id) {
      const a = (await sel(
        `/assets?id=eq.${link.asset_id}&select=id,project_id,title,status,created_at`
      ))[0];
      if (!a) return json({ error: 'Shared asset no longer exists.' }, 404);
      assets = [a];
      project = (await sel(
        `/projects?id=eq.${a.project_id}&select=id,name,color,created_at`
      ))[0] || null;
    } else if (link.project_id) {
      project = (await sel(
        `/projects?id=eq.${link.project_id}&select=id,name,color,created_at`
      ))[0];
      if (!project) return json({ error: 'Shared project no longer exists.' }, 404);
      assets = await sel(
        `/assets?project_id=eq.${project.id}` +
        `&select=id,project_id,title,status,created_at&order=created_at.asc`
      );
    } else {
      return json({ error: 'Share link is not attached to anything.' }, 404);
    }
  } catch {
    return json({ error: 'Could not load shared content.' }, 500);
  }

  // 3) Walk down: versions for those assets, comments for those versions.
  const assetIds = assets.map((a) => a.id);
  let versions = [];
  let comments = [];
  try {
    if (assetIds.length) {
      versions = await sel(
        `/versions?asset_id=in.(${assetIds.join(',')})` +
        `&select=id,asset_id,label,kind,r2_key,stream_uid,mux_playback_id,duration,created_at` +
        `&order=created_at.asc`
      );
    }
    const versionIds = versions.map((v) => v.id);
    if (versionIds.length) {
      comments = await sel(
        `/comments?version_id=in.(${versionIds.join(',')})` +
        `&select=id,version_id,author,guest_name,body,t,in_a,in_b,point_x,point_y,drawing,resolved,created_at` +
        `&order=created_at.asc`
      );
    }
  } catch {
    return json({ error: 'Could not load versions/comments.' }, 500);
  }

  // 4) Assemble the nested payload: project -> assets[] -> versions[] -> comments[]
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
