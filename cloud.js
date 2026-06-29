/* ============================================================
   cloud.js — backend bridge for the Daxio review app.
   Exposes window.Cloud: auth + data + storage against Supabase/R2.
   Maps database rows <-> the in-memory shapes app.js already uses
   (asset / version / comment), so the rich UI stays unchanged.
   ============================================================ */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CFG = window.DAXIO_CONFIG || {};
const API = (CFG.API_BASE || '').replace(/\/$/, '');         // '' = same-origin
const R2  = (CFG.R2_PUBLIC_BASE || '').replace(/\/$/, '');

const supabase = createClient(CFG.SUPABASE_URL, CFG.SUPABASE_ANON_KEY, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
});

function unwrap({ data, error }) { if (error) throw error; return data; }
const ts = (s) => (s ? Date.parse(s) : Date.now());

/* ---------------- auth ---------------- */
async function getUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error) return null;
  return data?.user || null;
}
function onAuth(cb) {
  const { data } = supabase.auth.onAuthStateChange((_e, session) => cb(session?.user || null));
  return () => data.subscription.unsubscribe();
}
async function signInEmail(email) {
  const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: location.href } });
  if (error) throw error;
}
async function signInOAuth(provider) {
  const { error } = await supabase.auth.signInWithOAuth({ provider, options: { redirectTo: location.href } });
  if (error) throw error;
}
async function signOut() { await supabase.auth.signOut(); }

/* ---------------- profiles (author UUID -> display name) ---------------- */
let _profiles = null;
async function profileMap() {
  if (_profiles) return _profiles;
  _profiles = {};
  try {
    const { data } = await supabase.from('profiles').select('id, full_name, email');
    (data || []).forEach((p) => { _profiles[p.id] = p.full_name || (p.email ? p.email.split('@')[0] : 'Member'); });
  } catch (_) {}
  return _profiles;
}
async function myName() {
  const u = await getUser();
  if (!u) return 'You';
  const m = await profileMap();
  return m[u.id] || (u.email ? u.email.split('@')[0] : 'You');
}

/* ---------------- workspace + default project ---------------- */
async function ensureProject() {
  // A SECURITY DEFINER function creates the first workspace + default project
  // reliably (it runs with elevated rights, so it isn't blocked by the
  // row-level-security insert rule). Returns { workspaceId, projectId }.
  const { data, error } = await supabase.rpc('bootstrap_workspace');
  if (error) throw error;
  if (!data || !data.projectId) throw new Error('bootstrap_workspace returned nothing');
  return { workspaceId: data.workspaceId, projectId: data.projectId };
}

// All folders (projects) in the workspace, oldest first.
async function listProjects(workspaceId) {
  return unwrap(await supabase.from('projects')
    .select('id,name,color,created_at')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: true }));
}
// Create a new folder. The "proj rw" RLS rule allows this directly because the
// WITH CHECK is is_member(workspace_id), which is true for the creator.
async function createProject(workspaceId, name) {
  const u = await getUser();
  return unwrap(await supabase.from('projects')
    .insert({ workspace_id: workspaceId, name: name, created_by: u.id })
    .select('id,name,color,created_at').single());
}

/* ---------------- row -> demo shape ---------------- */
function groupReactions(rows, pm) {
  const r = {};
  (rows || []).forEach((x) => { const n = pm[x.user_id] || 'Member'; (r[x.emoji] = r[x.emoji] || []).push(n); });
  return r;
}
function toComment(row, pm) {
  return {
    id: row.id,
    author: pm[row.author] || row.guest_name || 'Member',
    body: row.body || '',
    t: row.t,
    inOut: (row.in_a != null) ? { a: row.in_a, b: row.in_b } : null,
    point: (row.point_x != null) ? { x: row.point_x, y: row.point_y } : null,
    drawing: (function (d) { if (typeof d === 'string') { try { d = JSON.parse(d); } catch (e) { d = null; } } return (Array.isArray(d) && d.length) ? d : null; })(row.drawing),
    reactions: groupReactions(row.comment_reactions, pm),
    resolved: !!row.resolved,
    mentions: (String(row.body || '').match(/@(\w+)/g) || []).map((s) => s.slice(1)),
    replies: (row.comment_replies || [])
      .slice().sort((a, b) => ts(a.created_at) - ts(b.created_at))
      .map((rp) => ({ id: rp.id, author: pm[rp.author] || 'Member', body: rp.body, createdAt: ts(rp.created_at) })),
    createdAt: ts(row.created_at),
  };
}
function toVersion(row, comments) {
  return { id: row.id, label: row.label, kind: row.kind || null, r2_key: row.r2_key || null,
    dataURL: null, blobKey: null, duration: row.duration, comments };
}
function toAsset(row, versions) {
  return { id: row.id, title: row.title, status: row.status || 'In review', versions,
    activeVersionId: versions.length ? versions[versions.length - 1].id : null, createdAt: ts(row.created_at) };
}

/* ---------------- load everything for a project ---------------- */
async function loadAssets(projectId) {
  const pm = await profileMap();
  const assets = unwrap(await supabase.from('assets').select('*').eq('project_id', projectId).order('created_at', { ascending: false }));
  const out = [];
  for (const a of assets) {
    const vrows = unwrap(await supabase.from('versions').select('*').eq('asset_id', a.id).order('created_at', { ascending: true }));
    const versions = [];
    for (const v of vrows) {
      const crows = unwrap(await supabase.from('comments')
        .select('*, comment_replies(*), comment_reactions(*)')
        .eq('version_id', v.id).order('created_at', { ascending: true }));
      versions.push(toVersion(v, crows.map((c) => toComment(c, pm))));
    }
    if (!versions.length) versions.push(toVersion({ id: 'tmp-' + a.id, label: 'V1', kind: null, duration: null }, []));
    out.push(toAsset(a, versions));
  }
  return out;
}

// Fresh comments for ONE version (used by the realtime subscription to refetch
// after someone else adds / resolves / deletes a comment).
async function loadVersionComments(versionId) {
  const pm = await profileMap();
  const crows = unwrap(await supabase.from('comments')
    .select('*, comment_replies(*), comment_reactions(*)')
    .eq('version_id', versionId).order('created_at', { ascending: true }));
  return crows.map((c) => toComment(c, pm));
}

/* ---------------- assets ---------------- */
async function createAsset(projectId, title) {
  const u = await getUser();
  const row = unwrap(await supabase.from('assets')
    .insert({ project_id: projectId, title, status: 'In review', created_by: u.id }).select().single());
  return toAsset(row, []);
}
async function renameAsset(id, title) { unwrap(await supabase.from('assets').update({ title }).eq('id', id).select().single()); }
async function setAssetStatus(id, status) { unwrap(await supabase.from('assets').update({ status }).eq('id', id).select().single()); }
async function deleteAsset(id) { unwrap(await supabase.from('assets').delete().eq('id', id)); }

/* ---------------- versions + upload ---------------- */
async function addVersion(assetId, { label, kind, r2_key, duration }) {
  const u = await getUser();
  const row = unwrap(await supabase.from('versions')
    .insert({ asset_id: assetId, label, kind, r2_key, duration, created_by: u.id }).select().single());
  return toVersion(row, []);
}
async function updateVersion(id, patch) {
  const set = {};
  if (patch.kind !== undefined) set.kind = patch.kind;
  if (patch.r2_key !== undefined) set.r2_key = patch.r2_key;
  if (patch.duration !== undefined) set.duration = patch.duration;
  unwrap(await supabase.from('versions').update(set).eq('id', id).select().single());
}
async function uploadFile(file, projectId, onProgress) {
  const ct = file.type || 'application/octet-stream';
  const token = (await supabase.auth.getSession()).data?.session?.access_token;
  const res = await fetch(API + '/api/upload-url', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
    body: JSON.stringify({ filename: file.name, contentType: ct, size: file.size, projectId }),
  });
  if (!res.ok) { const d = await res.text().catch(() => ''); throw new Error('upload-url ' + res.status + (d ? ': ' + d : '')); }
  const { uploadUrl, key } = await res.json();
  await new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', uploadUrl);
    xhr.setRequestHeader('Content-Type', ct);
    xhr.upload.onprogress = (e) => { if (onProgress && e.lengthComputable) onProgress(e.loaded / e.total); };
    xhr.onload = () => (xhr.status === 200 ? resolve() : reject(new Error('Upload failed (' + xhr.status + ')')));
    xhr.onerror = () => reject(new Error('Upload failed: network error'));
    xhr.send(file);
  });
  return { r2_key: key };
}
function mediaUrl(r2_key) { return r2_key ? R2 + '/' + r2_key : null; }

/* ---------------- comments / replies / reactions ---------------- */
async function addComment(versionId, { body, t, inOut, point, drawing }) {
  const u = await getUser();
  const fields = { version_id: versionId, author: u.id, body,
    t: t ?? null,
    in_a: inOut ? inOut.a : null, in_b: inOut ? inOut.b : null,
    point_x: point ? point.x : null, point_y: point ? point.y : null,
    drawing: drawing || null };
  const row = unwrap(await supabase.from('comments').insert(fields).select().single());
  const pm = await profileMap();
  return toComment({ ...row, comment_replies: [], comment_reactions: [] }, pm);
}
async function setResolved(id, resolved) { unwrap(await supabase.from('comments').update({ resolved }).eq('id', id).select().single()); }
async function deleteComment(id) { unwrap(await supabase.from('comments').delete().eq('id', id)); }
async function addReply(commentId, body) {
  const u = await getUser();
  const row = unwrap(await supabase.from('comment_replies').insert({ comment_id: commentId, body, author: u.id }).select().single());
  const pm = await profileMap();
  return { id: row.id, author: pm[u.id] || 'You', body: row.body, createdAt: ts(row.created_at) };
}
async function toggleReaction(commentId, emoji) {
  const u = await getUser();
  const existing = unwrap(await supabase.from('comment_reactions')
    .select('id').eq('comment_id', commentId).eq('user_id', u.id).eq('emoji', emoji).maybeSingle());
  if (existing) { unwrap(await supabase.from('comment_reactions').delete().eq('id', existing.id)); return false; }
  unwrap(await supabase.from('comment_reactions').insert({ comment_id: commentId, user_id: u.id, emoji }).select().single());
  return true;
}

/* ---------------- share + realtime ---------------- */
// Create a public share link for a single asset OR a whole folder (project).
// Pass { assetId } or { projectId }. (A bare string is treated as an assetId for
// back-compat with the per-review Share button.)
async function createShareLink(opts) {
  if (typeof opts === 'string') opts = { assetId: opts };
  opts = opts || {};
  const u = await getUser();
  const ins = { can_comment: true, created_by: u.id };
  if (opts.projectId) ins.project_id = opts.projectId;
  else ins.asset_id = opts.assetId;
  if (!ins.project_id && !ins.asset_id) throw new Error('Nothing to share — missing assetId or projectId.');
  const row = unwrap(await supabase.from('share_links').insert(ins).select().single());
  return row.token;
}
// PUBLIC (no login): load a shared asset via the /api/share function, mapped to the
// same in-memory shape the review UI uses, so the shared view reuses the rich player.
async function loadShared(token) {
  const r = await fetch(API + '/api/share/' + encodeURIComponent(token));
  if (!r.ok) { const d = await r.text().catch(() => ''); throw new Error('share ' + r.status + (d ? ': ' + d : '')); }
  const data = await r.json();
  const parseDrawing = (dd) => { if (typeof dd === 'string') { try { dd = JSON.parse(dd); } catch (e) { dd = null; } } return (Array.isArray(dd) && dd.length) ? dd : null; };
  const toC = (row) => ({
    id: row.id, author: row.guest_name || 'Reviewer', body: row.body || '',
    t: row.t,
    inOut: (row.in_a != null) ? { a: row.in_a, b: row.in_b } : null,
    point: (row.point_x != null) ? { x: row.point_x, y: row.point_y } : null,
    drawing: parseDrawing(row.drawing),
    reactions: {}, resolved: !!row.resolved, mentions: [], replies: [], createdAt: ts(row.created_at),
  });
  const assets = (data.assets || []).map((a) => {
    let versions = (a.versions || []).map((v) => ({ id: v.id, label: v.label, kind: v.kind || null, r2_key: v.r2_key || null, dataURL: null, blobKey: null, duration: v.duration, comments: (v.comments || []).map(toC) }));
    if (!versions.length) versions = [{ id: 'sv-' + a.id, label: 'V1', kind: null, r2_key: null, dataURL: null, blobKey: null, duration: null, comments: [] }];
    return { id: a.id, title: a.title, status: a.status || 'In review', versions, activeVersionId: versions[versions.length - 1].id, createdAt: ts(a.created_at) };
  });
  return { project: data.project || null, assets, share: data.share || {} };
}
function subscribeComments(versionId, onChange) {
  const ch = supabase.channel('rev-comments:' + versionId)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'comments', filter: 'version_id=eq.' + versionId }, onChange)
    .subscribe();
  return () => { supabase.removeChannel(ch); };
}

window.Cloud = {
  getUser, onAuth, signInEmail, signInOAuth, signOut, myName,
  ensureProject, listProjects, createProject, loadAssets, loadVersionComments,
  createAsset, renameAsset, setAssetStatus, deleteAsset,
  addVersion, updateVersion, uploadFile, mediaUrl,
  addComment, setResolved, deleteComment, addReply, toggleReaction,
  createShareLink, loadShared, subscribeComments,
};
