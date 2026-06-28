// app.js — the Daxio cloud SPA controller.
// Ties auth.js + data.js + upload.js to the DOM in index.html.
// Zero build: plain ES modules. Run only after config.js sets window.DAXIO_CONFIG.

import { getUser, onAuth, signInEmail, signInOAuth, signOut } from './auth.js';
import * as db from './data.js';
import { uploadFile } from './upload.js';

const CFG = window.DAXIO_CONFIG || {};
const $ = (s) => document.querySelector(s);
const show = (sel, on = true) => { const e = $(sel); if (e) e.hidden = !on; };

const state = { workspace: null, projects: [], project: null, asset: null, versions: [], version: null, unsub: null, pendingT: null };

/* ---------- helpers ---------- */
function toast(msg, isErr) {
  const t = $('#toast'); t.textContent = msg; t.className = 'toast' + (isErr ? ' err' : ''); t.hidden = false;
  clearTimeout(toast._t); toast._t = setTimeout(() => { t.hidden = true; }, isErr ? 5000 : 2600);
}
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
function initials(name) { return (name || '?').trim().slice(0, 2).toUpperCase(); }
function mmss(t) { t = Math.max(0, Math.floor(t || 0)); return Math.floor(t / 60) + ':' + String(t % 60).padStart(2, '0'); }
function timeAgo(ts) { const s = Math.floor((Date.now() - new Date(ts).getTime()) / 1000); if (s < 60) return 'now'; const m = (s / 60) | 0; if (m < 60) return m + 'm'; const h = (m / 60) | 0; if (h < 24) return h + 'h'; return ((h / 24) | 0) + 'd'; }
function mediaUrl(v) { if (!v || !v.r2_key) return null; const base = (CFG.R2_PUBLIC_BASE || '').replace(/\/$/, ''); return base + '/' + v.r2_key; }
function statusClass(s) { return s === 'Approved' ? 'badge-approved' : s === 'Changes requested' ? 'badge-changes' : 'badge-review'; }

/* ---------- auth / boot ---------- */
async function boot() {
  // OAuth + magic-link buttons
  document.querySelectorAll('[data-oauth]').forEach((b) => b.addEventListener('click', async () => {
    try { await signInOAuth(b.dataset.oauth); } catch (e) { authMsg(e.message || 'Sign-in failed', true); }
  }));
  $('#emailForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    try { await signInEmail($('#email').value.trim()); authMsg('Check your email for the magic link.', false); }
    catch (err) { authMsg(err.message || 'Could not send the link', true); }
  });
  $('#signOut').addEventListener('click', async () => { await signOut(); });
  $('#newProject').addEventListener('click', newProject);
  $('#fileInput').addEventListener('change', onFilePicked);
  $('#reviewBack').addEventListener('click', closeReview);
  $('#shareBtn').addEventListener('click', shareCurrentAsset);
  $('#versionSelect').addEventListener('change', () => loadVersion($('#versionSelect').value));
  wireComposer();

  if (!CFG.SUPABASE_URL || !CFG.SUPABASE_ANON_KEY) {
    show('#loading', false); authScreen(); authMsg('Set your Supabase URL + anon key in config.js first.', true); return;
  }
  // React to auth state for the lifetime of the page.
  onAuth((user) => { user ? enterApp(user) : authScreen(); });
}
function authMsg(m, err) { const p = $('#authMsg'); p.textContent = m; p.className = 'auth-msg' + (err ? ' err' : ''); p.hidden = false; }
function authScreen() { show('#loading', false); show('#app', false); show('#signin', true); }

async function enterApp(user) {
  show('#loading', false); show('#signin', false); show('#app', true);
  const prof = await db.myProfile().catch(() => null);
  const name = (prof && prof.full_name) || user.email || 'You';
  $('#userChip').innerHTML = `<span class="avatar">${esc(initials(name))}</span>${esc(name)}`;
  await ensureWorkspace();
  await loadProjects();
}

// The fix for the "stranded new user": make sure they always have a workspace.
async function ensureWorkspace() {
  let ws = await db.listWorkspaces();
  if (!ws.length) { await db.createWorkspace('My workspace'); ws = await db.listWorkspaces(); }
  state.workspace = ws[0];
  $('#wsName').textContent = state.workspace ? state.workspace.name : '';
}

/* ---------- projects ---------- */
async function loadProjects() {
  state.projects = await db.listProjects(state.workspace.id);
  const ul = $('#projectList');
  ul.innerHTML = state.projects.map((p) => `<li data-id="${p.id}">${esc(p.name)}</li>`).join('')
    || '<li class="muted" style="cursor:default;color:var(--muted)">No projects yet</li>';
  ul.querySelectorAll('li[data-id]').forEach((li) => li.addEventListener('click', () => selectProject(li.dataset.id)));
  if (state.projects.length) selectProject((state.project && state.projects.find((p) => p.id === state.project.id) ? state.project.id : state.projects[0].id));
  else { state.project = null; $('#projectTitle').textContent = 'Create a project to start'; $('#assetGrid').innerHTML = ''; showEmpty('No projects yet', 'Click + next to “Projects” to make one.'); }
}
async function newProject() {
  const name = prompt('Project name'); if (!name || !name.trim()) return;
  try { await db.createProject(state.workspace.id, name.trim()); await loadProjects(); toast('Project created'); }
  catch (e) { toast(e.message || 'Could not create project', true); }
}
async function selectProject(id) {
  state.project = state.projects.find((p) => p.id === id) || null; if (!state.project) return;
  $('#projectList').querySelectorAll('li').forEach((li) => li.classList.toggle('active', li.dataset.id === id));
  $('#projectTitle').textContent = state.project.name;
  await loadAssets();
}

/* ---------- assets ---------- */
async function loadAssets() {
  const assets = await db.listAssets(state.project.id);
  const grid = $('#assetGrid');
  if (!assets.length) { grid.innerHTML = ''; showEmpty('No reviews yet', 'Click “New review” to upload your first image or video.'); return; }
  show('#emptyState', false);
  // fetch the first version of each asset for a thumbnail/kind (cheap N+1 for the MVP)
  const cards = await Promise.all(assets.map(async (a) => {
    const vers = await db.listVersions(a.id).catch(() => []);
    const v = vers[vers.length - 1];
    const url = v && v.kind === 'image' ? mediaUrl(v) : null;
    const media = url ? `<img alt="" src="${esc(url)}">` : (v && v.kind === 'video' ? '▶ video' : 'no media');
    return `<div class="card" data-id="${a.id}"><div class="card-media">${media}<span class="card-badge ${statusClass(a.status)}">${esc(a.status)}</span></div>
      <div class="card-body"><div class="card-title">${esc(a.title)}</div><div class="card-meta">${vers.length} version${vers.length === 1 ? '' : 's'} · ${timeAgo(a.created_at)}</div></div></div>`;
  }));
  grid.innerHTML = cards.join('');
  grid.querySelectorAll('.card').forEach((c) => c.addEventListener('click', () => openAsset(c.dataset.id, assets)));
}
function showEmpty(h, p) { const e = $('#emptyState'); e.innerHTML = `<h3>${esc(h)}</h3><p>${esc(p)}</p>`; e.hidden = false; }

/* ---------- upload ---------- */
async function onFilePicked(e) {
  const file = e.target.files && e.target.files[0]; e.target.value = '';
  if (!file || !state.project) return;
  const kind = /^video\//.test(file.type) ? 'video' : /^image\//.test(file.type) ? 'image' : null;
  if (!kind) { toast('Only image or video files', true); return; }
  show('#uploadBar', true); $('#upLabel').textContent = 'Uploading ' + file.name + '…'; $('#upFill').style.width = '0%';
  try {
    const { r2_key } = await uploadFile(file, { projectId: state.project.id, onProgress: (p) => { $('#upFill').style.width = Math.round(p * 100) + '%'; } });
    const asset = await db.createAsset(state.project.id, file.name.replace(/\.[^.]+$/, ''));
    await db.addVersion(asset.id, { label: 'V1', kind, r2_key, duration: null });
    toast('Uploaded');
    await loadAssets();
  } catch (err) { toast(err.message || 'Upload failed', true); }
  finally { show('#uploadBar', false); }
}

/* ---------- review ---------- */
async function openAsset(id, assets) {
  state.asset = (assets || []).find((a) => a.id === id) || { id };
  $('#reviewTitle').textContent = state.asset.title || 'Review';
  state.versions = await db.listVersions(id);
  const sel = $('#versionSelect');
  sel.innerHTML = state.versions.map((v) => `<option value="${v.id}">${esc(v.label || 'V')}</option>`).join('');
  show('#review', true);
  if (state.versions.length) { sel.value = state.versions[state.versions.length - 1].id; await loadVersion(sel.value); }
  else { $('#stage').innerHTML = '<div class="stage-empty">No versions uploaded.</div>'; $('#commentList').innerHTML = ''; }
}
function closeReview() { if (state.unsub) { state.unsub(); state.unsub = null; } show('#review', false); }

async function loadVersion(versionId) {
  state.version = state.versions.find((v) => v.id === versionId); if (!state.version) return;
  const v = state.version, url = mediaUrl(v), stage = $('#stage');
  if (!url) stage.innerHTML = '<div class="stage-empty">Media still processing…</div>';
  else if (v.kind === 'video') stage.innerHTML = `<video id="media" src="${esc(url)}" controls playsinline></video>`;
  else stage.innerHTML = `<img id="media" alt="" src="${esc(url)}">`;
  state.pendingT = null; updateStamp();
  await loadComments();
  if (state.unsub) state.unsub();
  state.unsub = db.subscribeComments(v.id, () => loadComments());
}

async function loadComments() {
  const v = state.version; if (!v) return;
  let rows = []; try { rows = await db.listComments(v.id); } catch (e) { /* ignore transient */ }
  const list = $('#commentList');
  if (!rows.length) { list.innerHTML = '<div class="comment-empty">No comments yet — add the first one below.</div>'; return; }
  list.innerHTML = rows.map((c) => {
    const who = c.guest_name || 'Member';
    const stamp = c.t != null ? `<span class="note-stamp" data-t="${c.t}">▶ ${mmss(c.t)}</span>` : '';
    return `<div class="note"><div class="note-top"><span class="note-who">${esc(who)}</span>${stamp}<span class="note-when">${timeAgo(c.created_at)}</span></div><div class="note-body">${esc(c.body)}</div></div>`;
  }).join('');
  list.querySelectorAll('.note-stamp').forEach((s) => s.addEventListener('click', () => { const m = document.getElementById('media'); if (m && m.tagName === 'VIDEO') { m.currentTime = +s.dataset.t; m.play && m.play(); } }));
  list.scrollTop = list.scrollHeight;
}

function wireComposer() {
  const ta = $('#commentInput'), post = $('#postBtn');
  ta.addEventListener('input', () => { post.disabled = !ta.value.trim(); });
  ta.addEventListener('focus', () => { const m = document.getElementById('media'); if (m && m.tagName === 'VIDEO') { state.pendingT = m.currentTime; updateStamp(); } });
  ta.addEventListener('keydown', (e) => { if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') { e.preventDefault(); postComment(); } });
  post.addEventListener('click', postComment);
}
function updateStamp() { const chip = $('#stampChip'); if (state.pendingT != null) { chip.textContent = 'At ' + mmss(state.pendingT); chip.hidden = false; } else chip.hidden = true; }
async function postComment() {
  const ta = $('#commentInput'), body = ta.value.trim(); if (!body || !state.version) return;
  const fields = { body }; if (state.pendingT != null) fields.t = state.pendingT;
  try { await db.addComment(state.version.id, fields); ta.value = ''; $('#postBtn').disabled = true; state.pendingT = null; updateStamp(); await loadComments(); }
  catch (e) { toast(e.message || 'Could not post', true); }
}

/* ---------- share ---------- */
async function shareCurrentAsset() {
  if (!state.asset) return;
  try {
    const link = await db.createShareLink({ assetId: state.asset.id });
    const url = location.origin + '/share.html#' + link.token;
    try { await navigator.clipboard.writeText(url); toast('Share link copied to clipboard'); }
    catch { prompt('Share link:', url); }
  } catch (e) { toast(e.message || 'Could not create link', true); }
}

boot();
