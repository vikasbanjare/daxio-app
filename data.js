// data.js — the data-access layer for Daxio.
//
// Thin, well-typed wrappers around the Supabase client. Every function is
// async, throws on error (so callers can `try/catch`), and returns the raw
// row(s) from Postgres. Table and column names match the project contract
// exactly. RLS (scoped to workspace membership) is enforced server-side, so
// these queries only ever see rows the current user is allowed to touch.

import { supabase } from './supabase.js';

// Small helper: unwrap a Supabase `{ data, error }` result, throwing on error.
function unwrap({ data, error }) {
  if (error) throw error;
  return data;
}

/* ------------------------------------------------------------------ *
 * Workspaces
 * ------------------------------------------------------------------ */

// List every workspace the current user can see (RLS limits this to their
// memberships), newest name order is not guaranteed by the contract so we
// keep the natural ordering by name for a stable, friendly list.
export async function listWorkspaces() {
  return unwrap(
    await supabase
      .from('workspaces')
      .select('*')
      .order('name', { ascending: true })
  );
}

// Create a workspace owned by the current user and return the new row.
export async function createWorkspace(name) {
  const { data: { user } } = await supabase.auth.getUser();
  return unwrap(
    await supabase
      .from('workspaces')
      .insert({ name, owner_id: user?.id })
      .select()
      .single()
  );
}

/* ------------------------------------------------------------------ *
 * Projects
 * ------------------------------------------------------------------ */

// List the projects in a workspace, most recently created first.
export async function listProjects(workspaceId) {
  return unwrap(
    await supabase
      .from('projects')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false })
  );
}

// Create a project in a workspace and return the new row.
export async function createProject(workspaceId, name) {
  const { data: { user } } = await supabase.auth.getUser();
  return unwrap(
    await supabase
      .from('projects')
      .insert({ workspace_id: workspaceId, name, created_by: user?.id })
      .select()
      .single()
  );
}

/* ------------------------------------------------------------------ *
 * Assets
 * ------------------------------------------------------------------ */

// List the assets in a project, most recently created first.
export async function listAssets(projectId) {
  return unwrap(
    await supabase
      .from('assets')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
  );
}

// Create an asset in a project. New assets start life in the 'In review'
// status. Returns the new row.
export async function createAsset(projectId, title) {
  const { data: { user } } = await supabase.auth.getUser();
  return unwrap(
    await supabase
      .from('assets')
      .insert({
        project_id: projectId,
        title,
        status: 'In review',
        created_by: user?.id,
      })
      .select()
      .single()
  );
}

/* ------------------------------------------------------------------ *
 * Versions
 * ------------------------------------------------------------------ */

// List the versions of an asset, oldest first (so v1, v2, v3 read in order).
export async function listVersions(assetId) {
  return unwrap(
    await supabase
      .from('versions')
      .select('*')
      .eq('asset_id', assetId)
      .order('created_at', { ascending: true })
  );
}

// Add a version to an asset. `fields` carries { label, kind, r2_key, duration }
// per the contract (stream_uid / mux_playback_id are set elsewhere when video
// transcoding completes). Returns the new row.
export async function addVersion(assetId, { label, kind, r2_key, duration }) {
  const { data: { user } } = await supabase.auth.getUser();
  return unwrap(
    await supabase
      .from('versions')
      .insert({
        asset_id: assetId,
        label,
        kind,
        r2_key,
        duration,
        created_by: user?.id,
      })
      .select()
      .single()
  );
}

/* ------------------------------------------------------------------ *
 * Comments
 * ------------------------------------------------------------------ */

// List the comments on a version, oldest first, with their replies and
// reactions embedded (Supabase resolves these via the foreign-key relations
// comment_replies.comment_id and comment_reactions.comment_id).
export async function listComments(versionId) {
  return unwrap(
    await supabase
      .from('comments')
      .select('*, comment_replies(*), comment_reactions(*)')
      .eq('version_id', versionId)
      .order('created_at', { ascending: true })
  );
}

// Add a comment to a version. `fields` is a free-form subset of the comment
// columns (body, t, in_a, in_b, point_x, point_y, drawing, guest_name, …);
// version_id is filled in here. Returns the new row.
export async function addComment(versionId, fields) {
  const { data: { user } } = await supabase.auth.getUser();
  return unwrap(
    await supabase
      .from('comments')
      .insert({ version_id: versionId, author: user?.id, ...fields })
      .select()
      .single()
  );
}

// Mark a comment resolved / unresolved. Returns the updated row.
export async function resolveComment(id, resolved) {
  return unwrap(
    await supabase
      .from('comments')
      .update({ resolved })
      .eq('id', id)
      .select()
      .single()
  );
}

// Delete a comment by id. Returns the deleted row.
export async function deleteComment(id) {
  return unwrap(
    await supabase
      .from('comments')
      .delete()
      .eq('id', id)
      .select()
      .single()
  );
}

/* ------------------------------------------------------------------ *
 * Replies
 * ------------------------------------------------------------------ */

// Add a reply to a comment and return the new row.
export async function addReply(commentId, body) {
  const { data: { user } } = await supabase.auth.getUser();
  return unwrap(
    await supabase
      .from('comment_replies')
      // author is required by RLS (reply-insert check: author = auth.uid())
      .insert({ comment_id: commentId, body, author: user?.id })
      .select()
      .single()
  );
}

/* ------------------------------------------------------------------ *
 * Reactions
 * ------------------------------------------------------------------ */

// Toggle an emoji reaction on a comment for the current user: if the user has
// already reacted with this emoji, remove it; otherwise add it. Returns the
// new reaction row when added, or null when removed.
export async function toggleReaction(commentId, emoji) {
  const { data: { user } } = await supabase.auth.getUser();
  const userId = user?.id;

  // Is there an existing reaction by this user with this emoji?
  const existing = unwrap(
    await supabase
      .from('comment_reactions')
      .select('id')
      .eq('comment_id', commentId)
      .eq('user_id', userId)
      .eq('emoji', emoji)
      .maybeSingle()
  );

  if (existing) {
    // Remove it.
    unwrap(
      await supabase
        .from('comment_reactions')
        .delete()
        .eq('id', existing.id)
    );
    return null;
  }

  // Add it.
  return unwrap(
    await supabase
      .from('comment_reactions')
      .insert({ comment_id: commentId, user_id: userId, emoji })
      .select()
      .single()
  );
}

/* ------------------------------------------------------------------ *
 * Realtime
 * ------------------------------------------------------------------ */

// Subscribe to live changes (insert/update/delete) on the comments of a single
// version. `onChange` receives the raw Realtime payload. Returns an unsubscribe
// function that tears the channel down.
export function subscribeComments(versionId, onChange) {
  const channel = supabase
    .channel('comments:' + versionId)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'comments',
        filter: 'version_id=eq.' + versionId,
      },
      onChange
    )
    .subscribe();

  // Returned cleanup: remove the channel from the client.
  return () => { supabase.removeChannel(channel); };
}

/* ------------------------------------------------------------------ *
 * Share links + profile
 * ------------------------------------------------------------------ */

// Create a share link for a project OR a single asset. Returns the row,
// including `token` (build the public URL as `${origin}/share.html#${token}`).
export async function createShareLink({ projectId = null, assetId = null, canComment = true, expiresAt = null } = {}) {
  const { data: { user } } = await supabase.auth.getUser();
  return unwrap(
    await supabase
      .from('share_links')
      .insert({ project_id: projectId, asset_id: assetId, can_comment: canComment, expires_at: expiresAt, created_by: user?.id })
      .select()
      .single()
  );
}

// Set (or clear) a share link's password — hashed server-side via the RPC.
export async function setSharePassword(linkId, password) {
  const { error } = await supabase.rpc('set_share_password', { p_link: linkId, p_pw: password || null });
  if (error) throw error;
}

// The current user's profile row (name/email/avatar).
export async function myProfile() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  return unwrap(await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle());
}
