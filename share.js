// share.js — the external (no-account) review viewer.
// Reads /api/share/:token (token in the URL hash) and renders the shared
// project/asset, its versions, and comments — read-only.

const CFG = window.DAXIO_CONFIG || {};
const $ = (s) => document.querySelector(s);
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const mmss = (t) => { t = Math.max(0, Math.floor(t || 0)); return Math.floor(t / 60) + ':' + String(t % 60).padStart(2, '0'); };
const mediaUrl = (v) => (v && v.r2_key) ? (CFG.R2_PUBLIC_BASE || '').replace(/\/$/, '') + '/' + v.r2_key : null;

const token = (location.hash || '').replace(/^#/, '').trim();
let payload = null;
let allVersions = [];

function showOnly(id) { ['loading', 'error', 'viewer', 'pwGate'].forEach((x) => { const e = $('#' + x); if (e) e.hidden = (x !== id); }); }
function fail(h, p) { $('#errH').textContent = h; $('#errP').textContent = p || ''; showOnly('error'); }

async function load(password) {
  if (!token) return fail('No share token', 'This link is missing its token.');
  showOnly('loading');
  let res;
  try {
    res = await fetch('/api/share/' + encodeURIComponent(token), { headers: password ? { 'x-share-password': password } : {} });
  } catch { return fail('Network error', 'Could not reach the server.'); }
  if (res.status === 401) { showOnly('pwGate'); if (password) { $('#pwMsg').hidden = false; $('#pwMsg').textContent = 'Incorrect password.'; } return; }
  if (res.status === 404) return fail('Link not found', 'This share link does not exist.');
  if (res.status === 410) return fail('Link expired', 'This share link has expired.');
  if (!res.ok) return fail('Unavailable', 'Could not load this review.');
  payload = await res.json();
  render();
}

function render() {
  showOnly('viewer');
  const proj = payload.project, assets = payload.assets || [];
  $('#shareScope').textContent = proj ? proj.name : 'Shared review';
  $('#viewerTitle').textContent = (assets[0] && assets[0].title) || (proj && proj.name) || 'Review';
  // flatten versions across assets for the selector (most setups share one asset)
  allVersions = [];
  assets.forEach((a) => (a.versions || []).forEach((v) => allVersions.push({ ...v, _asset: a.title })));
  const sel = $('#viewerVersion');
  sel.innerHTML = allVersions.map((v, i) => `<option value="${i}">${esc(v._asset)} · ${esc(v.label || 'V')}</option>`).join('');
  sel.onchange = () => showVersion(+sel.value);
  if (allVersions.length) showVersion(allVersions.length - 1), (sel.value = String(allVersions.length - 1));
  else { $('#stage').innerHTML = '<div class="stage-empty">Nothing uploaded yet.</div>'; $('#commentList').innerHTML = ''; }
}

function showVersion(i) {
  const v = allVersions[i]; if (!v) return;
  const url = mediaUrl(v), stage = $('#stage');
  if (!url) stage.innerHTML = '<div class="stage-empty">Media unavailable.</div>';
  else if (v.kind === 'video') stage.innerHTML = `<video id="media" src="${esc(url)}" controls playsinline></video>`;
  else stage.innerHTML = `<img id="media" alt="" src="${esc(url)}">`;
  const list = $('#commentList'), cs = v.comments || [];
  list.innerHTML = cs.length ? cs.map((c) => {
    const stamp = c.t != null ? `<span class="note-stamp" data-t="${c.t}">▶ ${mmss(c.t)}</span>` : '';
    return `<div class="note"><div class="note-top"><span class="note-who">${esc(c.guest_name || 'Member')}</span>${stamp}</div><div class="note-body">${esc(c.body)}</div></div>`;
  }).join('') : '<div class="comment-empty">No comments yet.</div>';
  list.querySelectorAll('.note-stamp').forEach((s) => s.addEventListener('click', () => { const m = document.getElementById('media'); if (m && m.tagName === 'VIDEO') m.currentTime = +s.dataset.t; }));
}

$('#pwForm').addEventListener('submit', (e) => { e.preventDefault(); load($('#pw').value); });
load();
