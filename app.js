import './cloud.js?v=9';   // sets window.Cloud (Supabase Auth + Postgres + Cloudflare R2)
/* ============================================================
   Daxio — Frame.io-style review, wired to a real backend.
   Data in Supabase (Postgres); media in Cloudflare R2.
   ============================================================ */
'use strict';

const I = {
  back:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>',
  play:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 5v14l12-7z"/></svg>',
  pause:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 5h4v14H7zM13 5h4v14h-4z"/></svg>',
  plus:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
  check:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>',
  close:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>',
  link:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1.5 1.5"/><path d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1.5-1.5"/></svg>',
  trash:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/></svg>',
  reply:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 17l-5-5 5-5"/><path d="M4 12h11a5 5 0 0 1 5 5v1"/></svg>',
  fprev:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M18 5 8 12l10 7zM6 5h2v14H6z"/></svg>',
  fnext:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 5l10 7L6 19zM16 5h2v14h-2z"/></svg>',
  loop:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M17 2l4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><path d="M7 22l-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>',
  fs:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3M16 3h3a2 2 0 0 1 2 2v3M21 16v3a2 2 0 0 1-2 2h-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>',
  draw:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18z"/><path d="M2 2l7.6 7.6"/><circle cx="11" cy="11" r="2"/></svg>',
  range:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M8 4H5v16h3M16 4h3v16h-3"/></svg>',
  pin:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s-6-5.3-6-10a6 6 0 0 1 12 0c0 4.7-6 10-6 10z"/><circle cx="12" cy="11" r="2"/></svg>',
  download:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12M7 10l5 5 5-5M5 21h14"/></svg>',
  image:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8.5" cy="9.5" r="1.5"/><path d="m21 16-5-5L5 20"/></svg>',
  video:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="2" y="6" width="14" height="12" rx="2"/><path d="m16 10 6-3v10l-6-3"/></svg>',
  compare:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v18"/><rect x="3" y="6" width="6" height="12" rx="1"/><rect x="15" y="6" width="6" height="12" rx="1"/></svg>',
  smile:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><path d="M8 14s1.5 2 4 2 4-2 4-2" stroke-linecap="round"/><path d="M9 9h.01M15 9h.01" stroke-linecap="round"/></svg>',
  up:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M7 9l5-5 5 5"/><path d="M12 4v12"/></svg>',
  vol:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H2v6h4l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a9 9 0 0 1 0 14"/></svg>',
  mute:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H2v6h4l5 4z"/><path d="M22 9l-6 6M16 9l6 6"/></svg>',
  search:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>',
  sort:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M7 4v16M7 20l-3-3M7 4l3 3"/><path d="M17 20V4M17 4l3 3M17 20l-3-3"/></svg>',
  grid:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>',
  alert:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/></svg>',
  info:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/></svg>',
  dots:'<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="1.7"/><circle cx="12" cy="12" r="1.7"/><circle cx="19" cy="12" r="1.7"/></svg>',
  edit:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>',
  camera:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>',
  box:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><rect x="4" y="6" width="16" height="12" rx="1.5"/></svg>',
  arrow:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M5 19 19 5M11 5h8v8"/></svg>',
  circle:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><ellipse cx="12" cy="12" rx="9" ry="6.5"/></svg>',
};
// icons are always decorative (text or aria-label carries meaning) — hide them from the a11y tree
Object.keys(I).forEach(function(k){ I[k]=I[k].replace('<svg ','<svg aria-hidden="true" focusable="false" '); });

const TEAM = ['You','Maya','Sam','Jordan','Priya','Leo'];
const EMOJIS = ['👍','❤️','✅','👀','🎉'];
const AVC = ['#4F6EF0','#16A34A','#0EA5E9','#D97706','#DB2777','#7C3AED'];
function av(name,cls){ name=name||'?'; let h=0; for(const c of name) h=(h*31+c.charCodeAt(0))>>>0; const col=AVC[h%AVC.length];
  return `<span class="avatar ${cls||''}" style="background:${col}" title="${esc(name)}">${name.slice(0,name==='You'?2:1).toUpperCase()}</span>`; }

const STATUS = { 'In review':'st-review', 'Changes requested':'st-changes', 'Approved':'st-approved' };

/* ---------- storage ---------- */
const LS='review-studio'; let DB=null; const mem=new Map();
function openDB(){ return new Promise(r=>{ try{ const q=indexedDB.open('review-media',1); q.onupgradeneeded=()=>q.result.createObjectStore('m'); q.onsuccess=()=>{DB=q.result;r(1);}; q.onerror=()=>{DB=null;r(0);}; }catch(e){r(0);} }); }
function idbPut(k,b){ return new Promise(r=>{ if(!DB){mem.set(k,b);return r(1);} try{const t=DB.transaction('m','readwrite');t.objectStore('m').put(b,k);t.oncomplete=()=>r(1);t.onerror=()=>{mem.set(k,b);r(1);};}catch(e){mem.set(k,b);r(1);} }); }
function idbGet(k){ return new Promise(r=>{ if(mem.has(k))return r(mem.get(k)); if(!DB)return r(null); try{const t=DB.transaction('m','readonly').objectStore('m').get(k);t.onsuccess=()=>r(t.result||null);t.onerror=()=>r(null);}catch(e){r(null);} }); }
function idbDel(k){ mem.delete(k); if(DB){try{DB.transaction('m','readwrite').objectStore('m').delete(k);}catch(e){}} }

let state = { assets:[], currentUser:'You' };
/* assets persist to the backend via Cloud.* ; only UI prefs are cached locally */
function save(){ try{ localStorage.setItem(LS,JSON.stringify({libView:state.libView})); }catch(e){} return true; }
function load(){ try{ const r=localStorage.getItem(LS); if(r){state=JSON.parse(r);return 1;} }catch(e){} return 0; }

/* ---------- helpers ---------- */
let _i=0; function uid(p){ _i++; return (p||'id')+Date.now().toString(36)+_i; }
function $(s,r){ return (r||document).querySelector(s); }
function $all(s,r){ return Array.from((r||document).querySelectorAll(s)); }
function esc(s){ return String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }
function mmss(t){ t=Math.max(0,Math.floor(t||0)); return Math.floor(t/60)+':'+String(t%60).padStart(2,'0'); }
function smpte(t,fps){ fps=fps||30; t=Math.max(0,t||0); const h=Math.floor(t/3600),m=Math.floor(t%3600/60),s=Math.floor(t%60),f=Math.floor((t%1)*fps); const p=n=>String(n).padStart(2,'0'); return `${p(h)}:${p(m)}:${p(s)}:${p(f)}`; }
function me(){ return state.currentUser; }
function asset(id){ return state.assets.find(a=>a.id===id); }
function activeVer(a){ if(!a||!a.versions||!a.versions.length)return null; return a.versions.find(v=>v.id===a.activeVersionId)||a.versions[a.versions.length-1]; }
function open(v){ return v&&v.comments?v.comments.filter(c=>!c.resolved).length:0; }
function hasMedia(v){ return !!(v&&(v.dataURL||v.blobKey||v.r2_key)); }
function timeAgo(ts){ const s=Math.floor((Date.now()-ts)/1000); if(s<60)return'now'; const m=Math.floor(s/60); if(m<60)return m+'m'; const h=Math.floor(m/60); if(h<24)return h+'h'; return Math.floor(h/24)+'d'; }

/* ---------- seed ---------- */
function gimg(a,b,label){ const c=document.createElement('canvas');c.width=640;c.height=400;const g=c.getContext('2d');
  const gr=g.createLinearGradient(0,0,640,400);gr.addColorStop(0,a);gr.addColorStop(1,b);g.fillStyle=gr;g.fillRect(0,0,640,400);
  g.fillStyle='rgba(255,255,255,.92)';g.font='600 32px Inter,sans-serif';g.fillText(label||'',34,372);return c.toDataURL('image/jpeg',.82); }
function ver(label,kind){ return {id:uid('v'),label,kind:kind||null,dataURL:null,blobKey:null,duration:null,comments:[]}; }
function cmt(author,body,o){ o=o||{}; return {id:uid('c'),author,body,t:o.t??null,inOut:o.inOut||null,point:o.point||null,drawing:o.drawing||null,reactions:o.reactions||{},resolved:!!o.resolved,mentions:o.mentions||[],replies:o.replies||[],createdAt:Date.now()-(o.ago||0)}; }

function seed(){
  const a1=ver('V1','video');
  a1.comments=[
    cmt('Maya','Trim the intro ~2s — we reach the product too slowly.',{t:2,ago:8e6,reactions:{'👍':['Sam']}}),
    cmt('Sam','Hold the logo a beat longer at the end. @Maya good for you?',{t:6,mentions:['Maya'],ago:5e6,replies:[{id:uid('r'),author:'Maya',body:'Yes — give it +1 second.',createdAt:Date.now()-3e6}]}),
  ];
  const a2=ver('V1','image'); a2.dataURL=gimg('#1f6f8b','#0c2c3a','Hero Banner');
  a2.comments=[
    cmt('Jordan','Headline is hard to read on the photo — add a subtle dark gradient behind it.',{point:{x:60,y:30},ago:2e6}),
    cmt('Sam','Nudge the CTA button up so it sits above the fold — see sketch.',{point:{x:34,y:64},ago:1e6,drawing:[[{x:.22,y:.58},{x:.34,y:.46},{x:.47,y:.6}]]}),
  ];
  const a3=ver('V1','video');
  a3.comments=[ cmt('Priya','VO dips around here — bring the voice up ~3 dB.',{t:3,ago:9e6}) ];
  const a4=ver('V1','image'); a4.dataURL=gimg('#2e7d51','#123a28','Thumbnail B');
  a4.comments=[ cmt('Maya','This version pops more. Approved!',{resolved:true,ago:2e7,reactions:{'✅':['Sam','Jordan']}}) ];

  state.assets=[
    {id:uid('a'),title:'Summer Launch — 30s Ad',status:'In review',versions:[a1],activeVersionId:a1.id,createdAt:Date.now()},
    {id:uid('a'),title:'Homepage Hero Banner',status:'Changes requested',versions:[a2],activeVersionId:a2.id,createdAt:Date.now()-1e6},
    {id:uid('a'),title:'Podcast Ep. 12 — Highlight',status:'In review',versions:[a3],activeVersionId:a3.id,createdAt:Date.now()-15e5},
    {id:uid('a'),title:'YouTube Thumbnail A/B',status:'Approved',versions:[a4],activeVersionId:a4.id,createdAt:Date.now()-2e6},
  ];
  state.seedVersion=2;
  save();
}

/* ---------- boot / route ---------- */
let cur=null;
// Validate/normalize stored shape so a malformed or older blob can never throw mid-render
// or trigger a destructive reseed. We only ever seed when there are genuinely no assets.
function normalizeState(){
  if(!state||typeof state!=='object'){ state={assets:[],currentUser:'You'}; return; }
  if(!Array.isArray(state.assets)) state.assets=[];
  state.assets=state.assets.filter(a=>a&&typeof a==='object').map(a=>{
    a.versions=Array.isArray(a.versions)?a.versions.filter(v=>v&&typeof v==='object'):[];
    a.versions.forEach(v=>{ if(!Array.isArray(v.comments))v.comments=[];
      v.comments.forEach(c=>{ if(!c||typeof c!=='object')return; if(!c.reactions||typeof c.reactions!=='object')c.reactions={}; if(!Array.isArray(c.replies))c.replies=[]; if(!Array.isArray(c.mentions))c.mentions=[]; }); });
    if(!a.versions.length) a.versions=[ver('V1',null)];
    if(!a.activeVersionId||!a.versions.find(v=>v.id===a.activeVersionId)) a.activeVersionId=a.versions[a.versions.length-1].id;
    if(!a.status) a.status='In review'; if(a.title==null) a.title='Untitled review'; if(!a.createdAt) a.createdAt=Date.now();
    return a;
  });
  if(!state.currentUser) state.currentUser='You';
}
let PROJECT=null, PROJECTS=[], CUR_PROJECT=null;
async function hydrate(){
  console.log('[Daxio] hydrate → ensureProject');
  PROJECT=await Cloud.ensureProject();
  console.log('[Daxio] ensureProject OK', PROJECT);
  PROJECTS=await Cloud.listProjects(PROJECT.workspaceId);
  if(!PROJECTS.length) PROJECTS=[{id:PROJECT.projectId,name:'Reviews'}];
  CUR_PROJECT=PROJECTS.find(p=>p.id===PROJECT.projectId)||PROJECTS[0];
  state.assets=await Cloud.loadAssets(CUR_PROJECT.id);
  console.log('[Daxio] loadAssets OK', state.assets.length, 'in', CUR_PROJECT.name);
  state.currentUser=await Cloud.myName();
  console.log('[Daxio] hydrate done as', state.currentUser);
}
/* ---------------- folders (projects) ---------------- */
function renderProjSwitcher(){ const nm=$('#projName'); if(nm)nm.textContent=(CUR_PROJECT&&CUR_PROJECT.name)||'Reviews'; }
async function switchProject(pid){ const p=PROJECTS.find(x=>x.id===pid); if(!p||p===CUR_PROJECT)return; CUR_PROJECT=p; renderProjSwitcher();
  try{ state.assets=await Cloud.loadAssets(p.id); }catch(e){ state.assets=[]; toast('Could not open folder: '+((e&&e.message)||e),'error'); }
  renderLibrary(); }
async function newProject(){ const name=(prompt('Name this folder (e.g. “Client A — Brand Film”)')||'').trim(); if(!name)return;
  try{ const p=await Cloud.createProject(PROJECT.workspaceId,name); PROJECTS.push(p); CUR_PROJECT=p; renderProjSwitcher(); state.assets=[]; renderLibrary(); toast('Folder “'+p.name+'” created'); }
  catch(e){ toast('Could not create folder: '+((e&&e.message)||e),'error'); } }
function toggleProjMenu(force){ const m=$('#projMenu'); if(!m)return; const show=(force!=null)?force:m.hidden;
  if(!show){ m.hidden=true; return; }
  m.innerHTML=PROJECTS.map(p=>`<button class="pm-row${CUR_PROJECT&&p.id===CUR_PROJECT.id?' active':''}" type="button" data-p="${esc(p.id)}">${esc(p.name)}</button>`).join('')
    +`<button class="pm-row pm-new" type="button" data-newproj>+ New folder</button>`;
  $all('.pm-row[data-p]',m).forEach(r=>r.onclick=()=>{ toggleProjMenu(false); switchProject(r.dataset.p); });
  const np=$('[data-newproj]',m); if(np)np.onclick=()=>{ toggleProjMenu(false); newProject(); };
  m.hidden=false; }
async function shareProject(){ if(!CUR_PROJECT){ toast('Open a folder first.','error'); return; }
  const card=modal('Share this folder',`<p class="muted" style="margin:0">Creating a public link…</p>`,`<button class="btn btn-ghost" data-close>Close</button>`);
  try{
    const token=await Cloud.createShareLink({projectId:CUR_PROJECT.id});
    const url=location.origin+location.pathname+'#/share/'+token;
    const n=state.assets.length;
    const body=$('.modal-body',card); if(body) body.innerHTML=`<div class="field"><label>Public folder link</label><div class="share-link"><input id="shareUrl" value="${esc(url)}" readonly><button class="btn btn-primary" id="copyUrl">Copy</button></div></div>
      <p class="muted">Anyone with this link can browse <strong>all ${n} item${n===1?'':'s'} in “${esc(CUR_PROJECT.name)}”</strong> and see every comment — <strong>no account needed</strong>.</p>`;
    const cb=$('#copyUrl'); if(cb)cb.onclick=()=>{const i=$('#shareUrl');i.select();copy(i.value);toast('Link copied');};
  }catch(e){ const body=$('.modal-body',card); if(body) body.innerHTML=`<p class="muted">Could not create the link: ${esc((e&&e.message)||String(e))}</p>`; }
}
function signinMsg(m,err){ const p=$('#signinMsg'); if(!p)return; p.textContent=m; p.className='auth-msg'+(err?' err':''); p.hidden=false; }
function showSignin(){ const l=$('#authLoading'); if(l)l.hidden=true; const s=$('#signinView'); if(s)s.hidden=false; }
function hideAuth(){ const l=$('#authLoading'); if(l)l.hidden=true; const s=$('#signinView'); if(s)s.hidden=true; }
function wireSignin(){
  $all('#signinView [data-oauth]').forEach(b=>b.onclick=async()=>{ try{ await Cloud.signInOAuth(b.dataset.oauth); }catch(e){ signinMsg(e.message||'Sign-in failed',true); } });
  const f=$('#signinEmailForm'); if(f)f.onsubmit=async e=>{ e.preventDefault(); const em=$('#signinEmail').value.trim(); if(!em)return; try{ await Cloud.signInEmail(em); signinMsg('Check your email for the magic link.',false); }catch(err){ signinMsg(err.message||'Could not send the link',true); } };
}
async function startApp(){ hideAuth(); await hydrate(); renderUser(); renderProjSwitcher(); route(); }
let SHARE=null;
async function openShared(token){
  document.body.classList.add('share-mode'); hideAuth();
  try{
    const data=await Cloud.loadShared(token);
    const scope=(data.share&&data.share.scope)||(((data.assets||[]).length>1)?'project':'asset');
    SHARE={token:token, canComment:!!(data.share&&data.share.can_comment), project:data.project, scope:scope};
    state.assets=data.assets||[];
    if(!state.assets.length){ shareError('This shared link has nothing to show.'); return; }
    if(scope==='project'){
      // A whole folder was shared: show a read-only grid the guest can browse.
      document.body.classList.add('folder-share');
      const nm=$('#projName'); if(nm)nm.textContent=(data.project&&data.project.name)||'Shared folder';
      showLibrary();
    } else {
      openReview(state.assets[0].id,{});
    }
  }catch(e){ console.error('[Daxio] share load failed',e);
    var s=String((e&&e.message)||e), msg='This shared link is unavailable.';
    if(/410/.test(s))msg='This shared link has expired.'; else if(/404/.test(s))msg='This shared link was not found.'; else if(/401/.test(s))msg='This shared link is password-protected.';
    shareError(msg); }
}
function shareError(msg){ const el=$('#shareError'); if(el){ const m=$('#shareErrMsg'); if(m)m.textContent=msg; el.hidden=false; } else { try{alert(msg);}catch(_){} } }
(async function(){ await openDB();
  try{ const r=localStorage.getItem(LS); if(r){ const s=JSON.parse(r); if(s&&s.libView) state.libView=s.libView; } }catch(e){}
  wire(); wireSignin(); window.addEventListener('hashchange',route);
  if(!window.Cloud){ showSignin(); signinMsg('Backend not configured (check config.js).',true); return; }
  // Public share links open WITHOUT sign-in (read-only viewer for clients/guests).
  if(/^#\/share\//.test(location.hash||'')){ document.body.classList.add('share-mode'); hideAuth(); route(); return; }
  // NOTE: don't call Supabase methods synchronously inside the auth callback
  // (it holds an internal lock — doing so deadlocks getUser/queries). Defer with
  // setTimeout so workspace/project setup runs *after* the callback returns.
  let _booted=false;
  Cloud.onAuth(user=>{
    if(user){
      if(_booted)return; _booted=true;
      setTimeout(()=>{
        var done=false;
        var wd=setTimeout(()=>{ if(!done){ try{alert('Daxio setup is hanging — no response from the backend. Open the console (Cmd+Option+J) for details.');}catch(_){} } }, 9000);
        startApp().then(()=>{ done=true; clearTimeout(wd); })
          .catch(e=>{ done=true; clearTimeout(wd); console.error('[Daxio] startApp failed:', e); hideAuth(); var m='Daxio setup failed: '+((e&&e.message)||e); try{alert(m);}catch(_){} toast(m,'error'); });
      },0);
    } else { _booted=false; showSignin(); }
  });
})();

function route(){ const sm=(location.hash||'').match(/^#\/share\/([^/?]+)/);
  if(sm){ openShared(decodeURIComponent(sm[1])); return; }
  const m=(location.hash||'').match(/^#\/a\/([^/?]+)/);
  if(m&&asset(decodeURIComponent(m[1]))){ const q=new URLSearchParams((location.hash.split('?')[1]||'')); openReview(decodeURIComponent(m[1]),{v:q.get('v'),t:q.get('t')?+q.get('t'):null,c:q.get('c')}); }
  else showLibrary(); }

function wire(){
  $('#backBtn').innerHTML=I.back; $('#backBtn').onclick=()=>{location.hash='';};
  $('#newBtn').innerHTML=I.plus+'New review'; $('#newBtn').onclick=newReview;
  { const pb=$('#projBtn'); if(pb)pb.onclick=(e)=>{ e.stopPropagation(); toggleProjMenu(); };
    const npb=$('#newProjBtn'); if(npb)npb.onclick=newProject;
    const spb=$('#shareProjBtn'); if(spb)spb.onclick=shareProject;
    document.addEventListener('click',(e)=>{ const m=$('#projMenu'); const sw=$('#projSwitch'); if(m&&!m.hidden&&sw&&!sw.contains(e.target)) toggleProjMenu(false); }); }
  $('#exportBtn').innerHTML=I.download;
  $('#shareBtn').innerHTML=I.link+'Share'; $('#requestBtn').textContent='Request changes'; $('#approveBtn').innerHTML=I.check+'Approve';
  $('#compareBtn').innerHTML=I.compare+'Compare';
  $('#snapBtn').innerHTML=I.camera+'Snapshot'; $('#snapBtn').onclick=frameSnapshot;
  $('#addVersionLabel span').innerHTML=I.plus+'New version';
  $('#playBtn').innerHTML=I.play; $('#frameBack').innerHTML=I.fprev; $('#frameFwd').innerHTML=I.fnext; $('#loopBtn').innerHTML=I.loop; $('#fsBtn').innerHTML=I.fs; $('#muteBtn').innerHTML=I.vol;
  $('#drawToggle').innerHTML=I.draw+'Draw'; $('#pinToggle').innerHTML=I.pin+'Pin'; $('#rangeToggle').innerHTML=I.range+'Range';
  { var _sb={'#shape-rect':I.box,'#shape-arrow':I.arrow,'#shape-ellipse':I.circle}; Object.keys(_sb).forEach(function(k){var b=$(k);if(b)b.innerHTML=_sb[k];}); }
  $('#userBtn').onclick=(e)=>{e.stopPropagation(); const m=$('#userMenu'); m.hidden=!m.hidden; $('#userBtn').setAttribute('aria-expanded',String(!m.hidden)); if(!m.hidden) renderUserMenu();};
  document.addEventListener('click',()=>{$('#userMenu').hidden=true;$('#userBtn').setAttribute('aria-expanded','false');});
  $('#userMenu').onclick=e=>e.stopPropagation();
  // library toolbar
  const lv=libView();
  $('#libSearchIc').innerHTML=I.search; $('#libSortIc').innerHTML=I.sort; $('#libGroup').innerHTML=I.grid+'<span>Group</span>';
  $('#libSearch').value=lv.q||'';
  $('#libSearch').oninput=function(){ libView().q=this.value; save(); renderLibrary(); };
  $('#libSort').onchange=function(){ libView().sort=this.value; save(); renderLibrary(); };
  $('#libGroup').onclick=function(){ const v=libView(); v.group=!v.group; save(); renderLibrary(); };
  $('#helpBtn').innerHTML=I.info; $('#helpBtn').onclick=shortcutsModal;
  $('#threadSearchIc').innerHTML=I.search;
  $('#threadSearch').oninput=()=>{ if(cur){ const a=asset(cur.assetId); renderThread(a,activeVer(a)); } };
  // thread sort (review view)
  $('#threadSort').innerHTML=I.sort; $('#threadSort').title='Sort: by time';
  $('#threadSort').onclick=function(){ if(!cur)return; const modes=['time','newest','oldest']; cur.tsort=modes[(modes.indexOf(cur.tsort||'time')+1)%modes.length];
    this.title='Sort: '+tsortLabel(cur.tsort); this.classList.toggle('active',cur.tsort!=='time'); const a=asset(cur.assetId); renderThread(a,activeVer(a)); toast('Comments sorted: '+tsortLabel(cur.tsort)); };
  document.addEventListener('keydown',onKey);
}
function tsortLabel(s){ return s==='newest'?'newest first':s==='oldest'?'oldest first':'by time'; }
function renderUser(){ const b=$('#userBtn'); b.innerHTML=av(me()); b.setAttribute('aria-label','Account menu, signed in as '+me()); const a0=b.querySelector('.avatar'); if(a0)a0.setAttribute('aria-hidden','true'); }
function renderUserMenu(){ const m=$('#userMenu');
  m.innerHTML=`<div class="menu-head">Signed in as ${esc(me())}</div><div class="menu-row" data-signout>${av(me(),'avatar-sm')}<span>Sign out</span></div>`;
  const so=$('[data-signout]',m); if(so)so.onclick=async()=>{ m.hidden=true; $('#userBtn').setAttribute('aria-expanded','false'); try{ await Cloud.signOut(); }catch(e){} }; }

/* ---------- library ---------- */
function showLibrary(){ $('#reviewView').hidden=true; $('#libraryView').hidden=false; $('#backBtn').hidden=true; $('#crumb').textContent='';
  $('#reviewActions').hidden=true; $('#presence').hidden=true; $('#newBtn').hidden=false;
  if(cur&&cur.mediaURL){try{URL.revokeObjectURL(cur.mediaURL);}catch(e){}} if(cur&&cur.compareURL){try{URL.revokeObjectURL(cur.compareURL);}catch(e){}} cur=null; renderLibrary(); }
const STATUS_ORDER={'In review':0,'Changes requested':1,'Approved':2};
const STATUS_FULL=['In review','Changes requested','Approved'];
function libView(){ return state.libView=state.libView||{q:'',status:'all',sort:'recent',group:false}; }
function openCountA(a){ return open(activeVer(a)); }
function sortAssets(list,key){
  const so=STATUS_ORDER;
  const by={ recent:(a,b)=>(b.createdAt||0)-(a.createdAt||0), oldest:(a,b)=>(a.createdAt||0)-(b.createdAt||0),
    name:(a,b)=>a.title.localeCompare(b.title),
    status:(a,b)=>((so[a.status]??9)-(so[b.status]??9))||((b.createdAt||0)-(a.createdAt||0)),
    open:(a,b)=>(openCountA(b)-openCountA(a))||((b.createdAt||0)-(a.createdAt||0)) };
  return list.slice().sort(by[key]||by.recent);
}
function libCard(a){ const v=activeVer(a)||{}, n=open(v); const isVid=a.versions.some(x=>x.kind==='video');
  const imgUrl = v.dataURL || (v.r2_key&&v.kind==='image'?Cloud.mediaUrl(v.r2_key):(v.thumb||null));
  const media = imgUrl?`<img alt="" src="${esc(imgUrl)}">`:`<span class="ph">${(v.kind==='video'||isVid)?I.video:I.image}</span>`;
  return `<div class="lib-card" data-id="${a.id}" tabindex="0" role="button" aria-label="${esc(a.title)}, ${esc(a.status)}, ${n?n+' open comments':'no open comments'}"><div class="lc-media">${media}
    ${(v.kind==='video'&&hasMedia(v))?`<span class="lc-play" aria-hidden="true">${I.play}</span>`:''}
    <span class="lc-badge ${STATUS[a.status]||''}">${esc(a.status)}</span>
    <button class="lc-menu" data-menu type="button" aria-label="Options for ${esc(a.title)}">${I.dots}</button></div>
    <div class="lc-body"><div class="lc-title">${esc(a.title)}</div>
    <div class="lc-meta"><span>${a.versions.length} ${a.versions.length>1?'versions':'version'}</span><span class="lc-sep">·</span><span>${timeAgo(a.createdAt)}</span>
    <span class="lc-open ${n?'':'zero'}">${n?n+' open':'all clear'}</span></div></div></div>`;
}
function wireCards(g){ $all('.lib-card[data-id]',g).forEach(c=>{ const go=()=>location.hash='#/a/'+encodeURIComponent(c.dataset.id);
  c.onclick=e=>{ if(e.target.closest('[data-menu]'))return; go(); };
  c.onkeydown=e=>{ if(e.target.closest('[data-menu]'))return; if(e.key==='Enter'||e.key===' '){e.preventDefault();go();} }; });
  $all('.lc-menu',g).forEach(b=>b.onclick=e=>{ e.stopPropagation(); const card=b.closest('.lib-card'); const a=card&&asset(card.dataset.id); if(a)assetMenu(a); }); }
function renderLibChips(counts){ const lv=libView(); const order=['all',...STATUS_FULL]; const label={all:'All','In review':'In review','Changes requested':'Changes','Approved':'Approved'};
  $('#libStatusFilter').innerHTML=order.map(k=>`<button class="lib-chip ${lv.status===k?'active':''}" type="button" aria-pressed="${lv.status===k}" data-s="${esc(k)}">${label[k]}<span class="lib-chip-cnt">${counts[k]||0}</span></button>`).join('');
  $all('#libStatusFilter .lib-chip').forEach(b=>b.onclick=()=>{libView().status=b.dataset.s;save();renderLibrary();}); }
function renderLibrary(){
  const lv=libView(); const g=$('#libGrid'), empty=$('#libEmpty');
  const counts={all:state.assets.length}; STATUS_FULL.forEach(s=>counts[s]=0); state.assets.forEach(a=>{counts[a.status]=(counts[a.status]||0)+1;});
  renderLibChips(counts);
  const sortSel=$('#libSort'); if(sortSel)sortSel.value=lv.sort;
  const gb=$('#libGroup'); if(gb){gb.classList.toggle('active',lv.group);gb.setAttribute('aria-pressed',lv.group);}
  // filter + sort
  let list=state.assets.slice();
  if(lv.status!=='all')list=list.filter(a=>a.status===lv.status);
  const q=(lv.q||'').trim().toLowerCase(); if(q)list=list.filter(a=>a.title.toLowerCase().includes(q));
  list=sortAssets(list,lv.sort);
  const total=state.assets.length, shown=list.length, filtered=!!(q||lv.status!=='all');
  const sm=document.body.classList.contains('share-mode');
  $('#libSub').textContent=sm
    ? `${total} item${total===1?'':'s'} · shared with you · no account needed`
    : (filtered?`${shown} of ${total} ${total===1?'review':'reviews'}`:`${total} ${total===1?'review':'reviews'}`)+` · signed in as ${me()}`;
  // empty
  if(!shown){ g.hidden=true; empty.hidden=false;
    empty.innerHTML=filtered?`<h3>No matching reviews</h3><p>Nothing matches your search or filter.</p><button class="btn btn-soft btn-sm" id="libClear">Clear filters</button>`
      :`<div class="empty-ic">${I.up}</div><h3>No reviews yet</h3><p>Create your first review to start collecting feedback.</p><button class="btn btn-primary btn-sm" id="libNew2">${I.plus}New review</button>`;
    const c1=$('#libClear'); if(c1)c1.onclick=()=>{lv.q='';lv.status='all';$('#libSearch').value='';save();renderLibrary();};
    const c2=$('#libNew2'); if(c2)c2.onclick=newReview; return; }
  empty.hidden=true; g.hidden=false;
  if(lv.group){ g.className='lib-grid grouped';
    g.innerHTML=STATUS_FULL.map(st=>{ const items=list.filter(a=>a.status===st); if(!items.length)return '';
      return `<section class="lib-group"><div class="lib-group-h"><span class="lc-badge ${STATUS[st]||''}" style="position:static">${esc(st)}</span><span class="lib-group-cnt">${items.length}</span></div><div class="lib-grid-inner">${items.map(libCard).join('')}</div></section>`; }).join('');
  } else { g.className='lib-grid';
    const showNew=!q&&lv.status==='all'&&!sm;
    g.innerHTML=(showNew?`<div class="lib-card new" id="newCard">${I.up}<span>New review</span></div>`:'')+list.map(libCard).join('');
    const nc=$('#newCard'); if(nc)nc.onclick=newReview;
  }
  wireCards(g);
}
function newReview(){
  const card=modal('New review',`<div class="field"><label>Title</label><input id="nrTitle" placeholder="e.g. Brand Film"></div>
    <p class="muted">You'll upload the image or video on the next screen.</p>`,
    `<button class="btn btn-ghost" data-close>Cancel</button><button class="btn btn-primary" id="nrGo">Create</button>`);
  $('#nrTitle',card).focus();
  $('#nrTitle',card).onkeydown=e=>{ if(e.key==='Enter'){ e.preventDefault(); $('#nrGo',card).click(); } };
  $('#nrGo',card).onclick=async()=>{ const t=$('#nrTitle',card).value.trim()||'Untitled review'; const go=$('#nrGo',card); go.disabled=true;
    try{ const a=await Cloud.createAsset(CUR_PROJECT.id,t); const v=await Cloud.addVersion(a.id,{label:'V1',kind:null,r2_key:null,duration:null}); a.versions=[v]; a.activeVersionId=v.id; state.assets.unshift(a); closeModal(); location.hash='#/a/'+encodeURIComponent(a.id); }
    catch(e){ go.disabled=false; toast('Could not create review: '+((e&&e.message)||e),'error'); } };
}
function assetMenu(a){
  const card=modal('Review settings',
    `<div class="field"><label for="amTitle">Title</label><input id="amTitle" value="${esc(a.title)}"></div>
     <div class="am-danger"><div><strong>Delete this review</strong><p class="muted" style="margin:2px 0 0;">Removes it and its media. You can undo for a few seconds.</p></div><button class="btn btn-danger btn-sm" id="amDel" type="button">Delete</button></div>`,
    `<button class="btn btn-ghost" data-close>Cancel</button><button class="btn btn-primary" id="amSave">Save</button>`);
  const ti=$('#amTitle',card); ti.focus(); try{ti.select();}catch(_){}
  ti.onkeydown=e=>{ if(e.key==='Enter'){ e.preventDefault(); $('#amSave',card).click(); } };
  $('#amSave',card).onclick=()=>{ const t=ti.value.trim(); if(!t){ti.focus();return;} a.title=t; closeModal();
    if(!$('#reviewView').hidden&&cur&&cur.assetId===a.id)$('#crumb').textContent=a.title; renderLibrarySilently(); Cloud.renameAsset(a.id,t).catch(()=>toast('Rename not saved','error')); toast('Renamed'); };
  $('#amDel',card).onclick=function(){ if(this.dataset.armed!=='1'){ this.dataset.armed='1'; this.textContent='Click again to delete'; this.classList.add('armed'); return; } closeModal(); deleteAsset(a); };
}
function deleteAsset(a){
  const idx=state.assets.indexOf(a); if(idx<0)return;
  state.assets.splice(idx,1);
  if(!$('#reviewView').hidden&&cur&&cur.assetId===a.id) location.hash=''; else renderLibrary();
  Cloud.deleteAsset(a.id).catch(()=>{ state.assets.splice(Math.min(idx,state.assets.length),0,a); renderLibrary(); toast('Could not delete','error'); });
  toast('Review deleted.');
}

/* ---------- review ---------- */
async function openReview(id,deep){ const a=asset(id); if(!a){location.hash='';return;} deep=deep||{};
  $('#libraryView').hidden=true; $('#reviewView').hidden=false; $('#backBtn').hidden=false; $('#newBtn').hidden=true;
  $('#reviewActions').hidden=false; $('#presence').hidden=false; $('#crumb').textContent=a.title;
  const v=(deep.v&&a.versions.find(x=>x.id===deep.v))||activeVer(a); a.activeVersionId=v.id;
  if(cur&&cur.mediaURL){try{URL.revokeObjectURL(cur.mediaURL);}catch(e){}}
  if(cur&&cur.compareURL){try{URL.revokeObjectURL(cur.compareURL);}catch(e){}}
  cur={assetId:id,versionId:v.id,mediaEl:null,mediaURL:null,compareURL:null,pendingPin:null,pendingDrawing:null,drawMode:false,pinMode:false,rangeAnchor:null,compare:false,activeDrawing:null,selectedId:null,showDrawings:[],canvas:null,ctx:null,pendingT:deep.t??null,pendingC:deep.c||null,speed:1,zoom:1,filter:(cur&&cur.filter)||'open',tsort:(cur&&cur.tsort)||'time'};
  renderStatus(a); renderPresence(); renderVersions(a); renderFilters(a,v);
  await renderStage(a,v); renderThread(a,v); wireComposer(a,v); wireActions(a);
  $('#exportBtn').onclick=()=>exportFeedback(a);
  $('#shareBtn').onclick=()=>shareModal(a,v);
  $('#addVersionInput').onchange=e=>{upload(e.target.files[0],a,'version');e.target.value='';};
  $('#compareBtn').hidden=a.versions.length<2;
  $('#compareBtn').onclick=()=>{cur.compare=!cur.compare;$('#compareBtn').classList.toggle('active',cur.compare);renderStage(a,activeVer(a)).then(()=>{renderThread(a,activeVer(a));});};
}
function renderStatus(a){ const b=$('#statusBadge'); b.className='status-badge '+(STATUS[a.status]||''); b.innerHTML=`<span class="dot" style="background:currentColor"></span>${esc(a.status)}`; }
function renderPresence(){ const others=TEAM.filter(n=>n!==me()).slice(0,3); $('#presence').innerHTML=av(me(),'avatar-sm')+others.map(n=>av(n,'avatar-sm')).join(''); }
function renderVersions(a){ const t=$('#versionTabs');
  t.innerHTML=a.versions.map(v=>`<button class="vtab ${v.id===a.activeVersionId?'active':''}" data-v="${v.id}">${esc(v.label)}${open(v)?'<span class="vdot"></span>':''}</button>`).join('');
  $all('.vtab',t).forEach(b=>b.onclick=()=>openReview(a.id,{v:b.dataset.v})); }

async function mediaURL(v){ if(v.dataURL)return v.dataURL; if(v.r2_key)return Cloud.mediaUrl(v.r2_key); if(v.blobKey){const b=await idbGet(v.blobKey);if(b)return URL.createObjectURL(b);} return null; }

async function renderStage(a,v){
  const stage=$('#stage'); stage.className='stage'; stage.innerHTML=''; cur.mediaEl=null; cur.canvas=null;
  // revoke any blob URLs from the previous render (renderStage can run outside openReview, e.g. compare toggle)
  if(cur.mediaURL){try{URL.revokeObjectURL(cur.mediaURL);}catch(e){}cur.mediaURL=null;}
  if(cur.compareURL){try{URL.revokeObjectURL(cur.compareURL);}catch(e){}cur.compareURL=null;}
  // compare cell
  const cell2=$('#stage2Cell');
  if(cur.compare&&a.versions.length>=2){ const idx=a.versions.indexOf(v); const pv=a.versions[idx-1]||a.versions[idx+1]||a.versions[0];
    cell2.hidden=false; $('#stage2Label').textContent=pv.label+' (compare)'; const s2=$('#stage2'); s2.innerHTML=''; const u2=await mediaURL(pv); cur.compareURL=(u2&&u2.startsWith('blob:'))?u2:null;
    s2.innerHTML = u2 ? (pv.kind==='video'?`<video src="${u2}" controls></video>`:`<img alt="" src="${u2}">`) : `<div class="stage-empty">No media</div>`;
  } else cell2.hidden=true;

  const url=await mediaURL(v); cur.mediaURL=(url&&url.startsWith('blob:'))?url:null;
  if(!url){ $('#controls').hidden=true;
    stage.innerHTML=`<div class="stage-empty"><div class="up">${I.up}</div><div>Nothing to review yet</div>
      <div class="upload-row"><label class="btn btn-primary">${I.up}Upload image or video<input type="file" accept="image/*,video/*" hidden id="firstUp"></label>
      ${v.kind==='video'?`<button class="btn btn-ghost" id="sampleClip">Load sample clip</button>`:`<button class="btn btn-ghost" id="sampleImg">Sample image</button>`}</div></div>`;
    $('#firstUp',stage).onchange=e=>{upload(e.target.files[0],a,'first');e.target.value='';};
    if($('#sampleImg',stage))$('#sampleImg',stage).onclick=()=>{v.kind='image';v.dataURL=gimg('#1e6f4f','#0b3a28','Sample');save();openReview(a.id);};
    if($('#sampleClip',stage))$('#sampleClip',stage).onclick=()=>sampleClip(a,v);
    return; }

  if(v.kind==='video'){
    stage.innerHTML=`<video id="media" src="${url}" preload="metadata"></video>`;
    const vid=$('#media',stage); cur.mediaEl=vid; addCanvas(stage); $('#controls').hidden=false;
    stage.classList.add('has-video');
    const cp=document.createElement('button'); cp.className='center-play'; cp.innerHTML=I.play; cp.setAttribute('aria-label','Play'); stage.appendChild(cp); cp.onclick=()=>vid.play();
    vid.addEventListener('loadedmetadata',()=>{v.duration=vid.duration;$('#timeline').setAttribute('aria-valuemax',Math.floor(vid.duration));$('#timecode').textContent=mmss(0)+' / '+mmss(vid.duration);renderMarkers(v);jump();sizeCanvas();applyZoom();});
    vid.addEventListener('timeupdate',()=>{const p=vid.duration?vid.currentTime/vid.duration*100:0;$('#timeProgress').style.width=p+'%';$('#playhead').style.left=p+'%';$('#timecode').textContent=mmss(vid.currentTime)+' / '+mmss(vid.duration||0);$('#timeline').setAttribute('aria-valuenow',Math.floor(vid.currentTime));$('#timeline').setAttribute('aria-valuetext',mmss(vid.currentTime)); renderOverlays(v); if(!scrub)scrollToPlayhead();});
    vid.addEventListener('play',()=>{$('#playBtn').innerHTML=I.pause;stage.classList.add('playing');cur.selectedId=null;}); vid.addEventListener('pause',()=>{$('#playBtn').innerHTML=I.play;stage.classList.remove('playing');});
    vid.addEventListener('click',()=>{ if(cur.drawMode||cur.pinMode)return; vid.paused?vid.play():vid.pause(); });
    $('#playBtn').onclick=function(){vid.paused?vid.play():vid.pause();this.blur();};
    $('#frameBack').onclick=()=>{vid.pause();vid.currentTime=Math.max(0,vid.currentTime-1/((cur&&cur.fps)||30));};
    $('#frameFwd').onclick=()=>{vid.pause();vid.currentTime=Math.min(vid.duration||1e9,vid.currentTime+1/((cur&&cur.fps)||30));};
    $('#loopBtn').onclick=()=>{vid.loop=!vid.loop;$('#loopBtn').classList.toggle('active',vid.loop);};
    $('#speedBtn').onclick=()=>{const arr=[0.5,1,1.5,2];const i=arr.indexOf(cur.speed);cur.speed=arr[(i<0?1:i)+1>=arr.length?0:(i<0?1:i)+1];vid.playbackRate=cur.speed;$('#speedBtn').textContent=cur.speed+'×';};
    $('#fsBtn').onclick=()=>{ if(document.fullscreenElement){(document.exitFullscreen?document.exitFullscreen():null);} else {(stage.requestFullscreen?stage.requestFullscreen():null);} };
    stage.onfullscreenchange=()=>{$('#fsBtn').classList.toggle('active',!!document.fullscreenElement);setTimeout(sizeCanvas,60);};
    const mute=$('#muteBtn'),volEl=$('#volume'); mute.innerHTML=I.vol; volEl.value=vid.volume;
    mute.onclick=()=>{vid.muted=!vid.muted;mute.innerHTML=vid.muted?I.mute:I.vol;mute.classList.toggle('active',vid.muted);};
    volEl.oninput=()=>{vid.volume=+volEl.value;vid.muted=+volEl.value===0;mute.innerHTML=vid.muted?I.mute:I.vol;};
    var tlWrap=$('#tlWrap'), zlbl=$('#zoomLbl'), ZOOMS=[1,2,4,8], _tlW=0, _wrapW=0;
    function measureTl(){ var t=$('#timeline'); _tlW=t?t.scrollWidth:0; _wrapW=tlWrap?tlWrap.clientWidth:0; }
    function applyZoom(){ var t=$('#timeline'); if(t)t.style.width=(cur.zoom*100)+'%'; if(zlbl)zlbl.textContent=cur.zoom+'×'; measureTl(); }
    // cached widths (they only change on zoom/resize) so the per-frame scroll doesn't force a reflow
    function scrollToPlayhead(){ if(!tlWrap||cur.zoom<=1)return; if(!_tlW)measureTl(); var x=(vid.duration?vid.currentTime/vid.duration:0)*_tlW; tlWrap.scrollLeft=x-_wrapW/2; }
    $('#zoomIn').onclick=function(){ var i=ZOOMS.indexOf(cur.zoom); if(i<0)i=0; if(i<ZOOMS.length-1){cur.zoom=ZOOMS[i+1];applyZoom();scrollToPlayhead();} };
    $('#zoomOut').onclick=function(){ var i=ZOOMS.indexOf(cur.zoom); cur.zoom=(i<=0)?1:ZOOMS[i-1]; applyZoom(); scrollToPlayhead(); };
    applyZoom();
    const tl=$('#timeline'),th=$('#timeHover');
    var scrub=false;
    function tlFrac(e){ var r=tl.getBoundingClientRect(); return Math.min(1,Math.max(0,(e.clientX-r.left)/r.width)); }
    tl.onclick=null;
    tl.onpointerdown=function(e){ if(cur.drawMode||cur.pinMode)return; scrub=true; try{tl.setPointerCapture(e.pointerId);}catch(_){} vid.currentTime=tlFrac(e)*(vid.duration||0); };
    tl.onpointermove=function(e){ var f=tlFrac(e); th.hidden=false; th.style.left=(f*100)+'%'; th.textContent=mmss(f*(vid.duration||0)); if(scrub)vid.currentTime=f*(vid.duration||0); };
    tl.onpointerup=function(){ scrub=false; };
    tl.onpointercancel=function(){ scrub=false; };
    tl.onpointerleave=function(){ th.hidden=true; };
    // arrows/Home/End scrub; Space is left to the global handler (onKey) to avoid a double-toggle
    tl.onkeydown=function(e){ if(!vid.duration)return; var step=(e.shiftKey?5:1),t=vid.currentTime;
      if(e.key==='ArrowRight'||e.key==='ArrowUp')t=Math.min(vid.duration,t+step);
      else if(e.key==='ArrowLeft'||e.key==='ArrowDown')t=Math.max(0,t-step);
      else if(e.key==='Home')t=0; else if(e.key==='End')t=vid.duration;
      else return;
      e.preventDefault(); vid.pause(); vid.currentTime=t; };
  } else {
    $('#controls').hidden=true; stage.classList.add('is-canvas');
    stage.innerHTML=`<img id="media" alt="${esc(a.title)}" src="${url}">`; cur.mediaEl=$('#media',stage); addCanvas(stage);
    cur.mediaEl.addEventListener('load',sizeCanvas);
    stage.onclick=e=>{ if(cur.drawMode||cur.pinMode||e.target.id!=='media')return; const r=e.target.getBoundingClientRect();
      cur.pendingPin={kind:'point',x:Math.round((e.clientX-r.left)/r.width*100),y:Math.round((e.clientY-r.top)/r.height*100)};
      renderPins(v); pinChip(); openInline(cur.pendingPin.x,cur.pendingPin.y,a,v); };
    renderPins(v);
  }
  sizeCanvas(); jump();
}

/* ---------- draw canvas ---------- */
function addCanvas(stage){ const c=document.createElement('canvas'); c.className='drawCanvas'; c.style.pointerEvents='none'; stage.appendChild(c); cur.canvas=c; cur.ctx=c.getContext('2d');
  let drawing=false,stroke=null,shaping=false,start=null;
  function ptN(e){ const r=c.getBoundingClientRect(); return {x:Math.max(0,Math.min(1,(e.clientX-r.left)/r.width)),y:Math.max(0,Math.min(1,(e.clientY-r.top)/r.height))}; }
  function shapeFrom(a,b){ const t=cur.shapeMode;
    if(t==='rect') return {t:t,x:Math.min(a.x,b.x),y:Math.min(a.y,b.y),w:Math.abs(b.x-a.x),h:Math.abs(b.y-a.y)};
    if(t==='ellipse') return {t:t,cx:(a.x+b.x)/2,cy:(a.y+b.y)/2,rx:Math.abs(b.x-a.x)/2,ry:Math.abs(b.y-a.y)/2};
    return {t:'arrow',x1:a.x,y1:a.y,x2:b.x,y2:b.y}; }
  function shapeSize(s){ if(s.t==='rect')return s.w+s.h; if(s.t==='ellipse')return s.rx+s.ry; return Math.hypot(s.x2-s.x1,s.y2-s.y1); }
  c.addEventListener('pointerdown',e=>{
    if(cur.pinMode){ dropPin(e); return; }
    if(cur.shapeMode){ shaping=true; start=ptN(e); try{c.setPointerCapture(e.pointerId);}catch(_){} cur.pendingShape=shapeFrom(start,start); paint(); return; }
    if(!cur.drawMode)return; drawing=true; stroke=[]; try{c.setPointerCapture(e.pointerId);}catch(_){} (cur.pendingDrawing=cur.pendingDrawing||[]).push(stroke); addPt(e,stroke); paint();
  });
  c.addEventListener('pointermove',e=>{ if(shaping){ cur.pendingShape=shapeFrom(start,ptN(e)); paint(); return; } if(!drawing)return; addPt(e,stroke); paint(); });
  // pointerup/cancel bound to the canvas (not window) so listeners die with this canvas on re-render — no leak.
  c.addEventListener('pointerup',()=>{ if(shaping){ shaping=false; if(cur.pendingShape&&shapeSize(cur.pendingShape)>0.01)(cur.pendingDrawing=cur.pendingDrawing||[]).push(cur.pendingShape); cur.pendingShape=null; paint(); return; } drawing=false; });
  c.addEventListener('pointercancel',()=>{shaping=false;cur.pendingShape=null;drawing=false;});
  function addPt(e,st){ const r=c.getBoundingClientRect(); st.push({x:Math.max(0,Math.min(1,(e.clientX-r.left)/r.width)),y:Math.max(0,Math.min(1,(e.clientY-r.top)/r.height))}); }
  function dropPin(e){ const m=cur.mediaEl, r=(m||c).getBoundingClientRect();
    let x=(e.clientX-r.left)/r.width*100, y=(e.clientY-r.top)/r.height*100; x=Math.max(0,Math.min(100,x)); y=Math.max(0,Math.min(100,y));
    cur.pendingPin={kind:'point',x:Math.round(x),y:Math.round(y),t:(m&&m.tagName==='VIDEO')?m.currentTime:null};
    setPinMode(false); var aa=asset(cur.assetId),vv=activeVer(aa); renderPins(vv); pinChip(); openInline(Math.round(x),Math.round(y),aa,vv); }
}
function closeInline(){ const b=document.getElementById('inlineCmt'); if(b)b.remove(); }
function openInline(x,y,a,v){ closeInline(); const st=$('#stage'); if(!st)return; const host=st.parentNode||st;
  const box=document.createElement('div'); box.id='inlineCmt'; box.className='inline-cmt';
  box.style.left=Math.min(68,Math.max(2,x))+'%'; box.style.top=Math.min(70,Math.max(2,y))+'%';
  const loc=(cur.mediaEl&&cur.mediaEl.tagName==='VIDEO')?('Note at '+mmss(cur.mediaEl.currentTime)):'Note on this frame';
  box.innerHTML='<div class="ic-head">'+esc(loc)+'</div><textarea rows="2" placeholder="Type your note… Enter to save"></textarea><div class="ic-foot"><button class="ic-cancel">Cancel</button><button class="ic-post">Comment</button></div>';
  host.appendChild(box);
  const ta=box.querySelector('textarea'); setTimeout(function(){ta.focus();},0);
  function cancel(){ closeInline(); cur.pendingPin=null; cur.pendingDrawing=null; renderOverlays(v); pinChip(); }
  function post(){ const body=ta.value.trim(); if(!body){cancel();return;} $('#commentInput').value=body; doPost(a,v); }
  box.querySelector('.ic-post').onclick=post;
  box.querySelector('.ic-cancel').onclick=cancel;
  ta.onkeydown=function(e){ if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();post();} else if(e.key==='Escape'){e.preventDefault();cancel();} };
}
function sizeCanvas(){ const c=cur.canvas; if(!c)return; const m=cur.mediaEl, st=$('#stage');
  // Overlay the canvas exactly on the (letterboxed) media box so strokes align with pins.
  if(m&&st&&m.getBoundingClientRect){ const mr=m.getBoundingClientRect(), sr=st.getBoundingClientRect();
    if(mr.width>1&&mr.height>1){ c.style.inset='auto'; c.style.left=(mr.left-sr.left)+'px'; c.style.top=(mr.top-sr.top)+'px';
      c.style.width=mr.width+'px'; c.style.height=mr.height+'px'; c.width=Math.round(mr.width); c.height=Math.round(mr.height); paint(); return; } }
  c.width=c.clientWidth; c.height=c.clientHeight; paint(); }
// One drawing element = a freehand stroke (array of {x,y}) OR a shape {t:'rect'|'ellipse'|'arrow',...}, all normalized 0..1.
function drawEl(g,c,el){ const W=c.width,H=c.height;
  if(Array.isArray(el)){ if(!el.length)return; g.beginPath(); el.forEach((p,i)=>{const x=p.x*W,y=p.y*H;i?g.lineTo(x,y):g.moveTo(x,y);}); g.stroke(); return; }
  if(!el||!el.t)return;
  if(el.t==='rect'){ g.strokeRect(el.x*W, el.y*H, Math.max(0,el.w)*W, Math.max(0,el.h)*H); }
  else if(el.t==='ellipse'){ g.beginPath(); g.ellipse(el.cx*W, el.cy*H, Math.abs(el.rx)*W, Math.abs(el.ry)*H, 0, 0, Math.PI*2); g.stroke(); }
  else if(el.t==='arrow'){ const x1=el.x1*W,y1=el.y1*H,x2=el.x2*W,y2=el.y2*H; g.beginPath(); g.moveTo(x1,y1); g.lineTo(x2,y2); g.stroke();
    const ang=Math.atan2(y2-y1,x2-x1), L=Math.min(15, Math.hypot(x2-x1,y2-y1)*0.45);
    g.beginPath(); g.moveTo(x2,y2); g.lineTo(x2-L*Math.cos(ang-0.42), y2-L*Math.sin(ang-0.42)); g.moveTo(x2,y2); g.lineTo(x2-L*Math.cos(ang+0.42), y2-L*Math.sin(ang+0.42)); g.stroke(); } }
function shapeSVG(s){ const C='#4F6EF0', W='1.4';
  if(Array.isArray(s)){ if(!s.length)return ''; return `<polyline fill="none" stroke="${C}" stroke-width="${W}" points="${s.map(p=>(p.x*100).toFixed(1)+','+(p.y*60).toFixed(1)).join(' ')}"/>`; }
  if(!s||!s.t)return '';
  if(s.t==='rect')return `<rect fill="none" stroke="${C}" stroke-width="${W}" x="${(s.x*100).toFixed(1)}" y="${(s.y*60).toFixed(1)}" width="${(Math.max(0,s.w)*100).toFixed(1)}" height="${(Math.max(0,s.h)*60).toFixed(1)}"/>`;
  if(s.t==='ellipse')return `<ellipse fill="none" stroke="${C}" stroke-width="${W}" cx="${(s.cx*100).toFixed(1)}" cy="${(s.cy*60).toFixed(1)}" rx="${(Math.abs(s.rx)*100).toFixed(1)}" ry="${(Math.abs(s.ry)*60).toFixed(1)}"/>`;
  if(s.t==='arrow')return `<line stroke="${C}" stroke-width="${W}" stroke-linecap="round" x1="${(s.x1*100).toFixed(1)}" y1="${(s.y1*60).toFixed(1)}" x2="${(s.x2*100).toFixed(1)}" y2="${(s.y2*60).toFixed(1)}"/>`;
  return ''; }
function paint(){ const c=cur.canvas; if(!c)return; const g=cur.ctx; g.clearRect(0,0,c.width,c.height);
  g.lineWidth=3; g.lineCap='round'; g.lineJoin='round';
  g.strokeStyle=cur._accent||(cur._accent=(getComputedStyle(document.documentElement).getPropertyValue('--accent')||'#4F6EF0').trim());
  const sets=(cur.showDrawings||[]).slice(); if(cur.pendingDrawing) sets.push(cur.pendingDrawing);
  sets.forEach(drawing=>{ (drawing||[]).forEach(el=>drawEl(g,c,el)); });
  if(cur.pendingShape) drawEl(g,c,cur.pendingShape); }
function updateTool(){ const active=cur.drawMode||cur.pinMode||!!cur.shapeMode; const c=cur.canvas; if(c)c.style.pointerEvents=active?'auto':'none';
  const st=$('#stage'); if(st){st.classList.toggle('tool-active',active);}
  const d=$('#drawToggle'),p=$('#pinToggle'); if(d)d.classList.toggle('on',cur.drawMode); if(p)p.classList.toggle('on',cur.pinMode);
  [['rect','#shape-rect'],['arrow','#shape-arrow'],['ellipse','#shape-ellipse']].forEach(pair=>{const b=$(pair[1]); if(b)b.classList.toggle('on',cur.shapeMode===pair[0]);}); }
function setDrawMode(on){ cur.drawMode=on; if(on){cur.pinMode=false;cur.shapeMode=null; if(cur.pendingPin&&cur.pendingPin.kind==='point'){cur.pendingPin=null;closeInline();}} if(!on)cur.pendingDrawing=null; cur._ovSig=null; updateTool(); paint(); }
function setPinMode(on){ cur.pinMode=on; if(on){cur.drawMode=false;cur.shapeMode=null;cur.pendingDrawing=null;} cur._ovSig=null; updateTool(); paint(); }
function setShapeMode(type){ cur.shapeMode=(cur.shapeMode===type)?null:type; if(cur.shapeMode){ cur.drawMode=false; cur.pinMode=false; if(cur.pendingPin&&cur.pendingPin.kind==='point'){cur.pendingPin=null;closeInline();} } cur.pendingShape=null; cur._ovSig=null; updateTool(); paint(); }

function renderMarkers(v){ const w=$('#markers'); if(!v.duration){w.innerHTML='';return;}
  const vis=c=>visible(c);   // match the thread's filter exactly (incl. "Mine")
  let html='';
  v.comments.filter(c=>c.inOut&&vis(c)).forEach(c=>{ const a=Math.max(0,c.inOut.a/v.duration*100), b=Math.min(100,c.inOut.b/v.duration*100); html+=`<span class="range ${c.resolved?'resolved':''}" style="left:${a}%;width:${Math.max(1.5,b-a)}%"></span>`; });
  html+=v.comments.filter(c=>c.t!=null&&vis(c)).map(c=>{ const left=Math.min(100,Math.max(0,c.t/v.duration*100)); return `<span class="marker ${c.resolved?'resolved':''}" data-c="${c.id}" tabindex="0" role="button" aria-label="Comment by ${esc(c.author)} at ${mmss(c.t)}" style="left:${left}%"><span class="tip">${esc(c.author)}: ${esc(c.body.slice(0,36))}</span></span>`; }).join('');
  w.innerHTML=html;
  $all('.marker',w).forEach(m=>{ const go=ev=>{ev.stopPropagation();const c=v.comments.find(x=>x.id===m.dataset.c);if(c&&cur.mediaEl){cur.mediaEl.currentTime=c.t;}if(c)selectNote(c.id);}; m.onclick=go; m.onkeydown=ev=>{if(ev.key==='Enter'||ev.key===' '){ev.preventDefault();go(ev);}}; });
}
function frameActive(c){
  const m=cur.mediaEl; if(!(m&&m.tagName==='VIDEO')) return false;
  const t=m.currentTime;
  if(c.inOut) return t>=c.inOut.a-0.05 && t<=c.inOut.b+0.05;
  const fps=(cur&&cur.fps)||30;
  if(c.t!=null) return Math.abs(t-c.t) <= (1.0/fps);   // frame-accurate: only at the marked frame
  return false;
}
function renderOverlays(v){ const st=$('#stage'); if(!st)return;
  const isVid=v.kind==='video'; const pins=[]; const draws=[];
  v.comments.forEach(c=>{ if(!visible(c)) return;
    const sel = c.id===cur.selectedId;
    // selected = always show (you clicked it to review); otherwise show only at the exact frame
    const showThis = isVid ? (frameActive(c) || sel) : true;
    if(c.point&&showThis) pins.push({id:c.id,x:c.point.x,y:c.point.y,res:!!c.resolved,sel});
    if(c.drawing && showThis && (isVid || sel)) draws.push({id:c.id,d:c.drawing});
  });
  const pend=(cur.pendingPin&&cur.pendingPin.kind==='point')?cur.pendingPin:null;
  const pdLen=cur.pendingDrawing?cur.pendingDrawing.reduce((n,s)=>n+(s?s.length:0),0):0;
  // diff-guard keyed on WHICH drawings/pins (identity) + the pending mark + selection, so a stale
  // drawing can never persist and a fresh pending mark always paints.
  const sig=JSON.stringify(pins)+'|'+draws.map(d=>d.id).join(',')+'|'+(pend?pend.x+','+pend.y:'')+'|pd'+pdLen+'|'+(cur.selectedId||'');
  if(sig===cur._ovSig && !pend && !pdLen) return;
  cur._ovSig=sig; cur.showDrawings=draws.map(d=>d.d);
  $all('.point-pin',st).forEach(p=>p.remove());
  pins.forEach((p,idx)=>{ const el=document.createElement('span'); el.className='point-pin '+(p.res?'resolved ':'')+(p.sel?'sel':''); el.style.left=p.x+'%'; el.style.top=p.y+'%'; el.textContent=idx+1; el.dataset.c=p.id; el.onclick=e=>{e.stopPropagation();selectNote(p.id);}; st.appendChild(el); });
  if(pend){const el=document.createElement('span');el.className='point-pin pending';el.style.left=pend.x+'%';el.style.top=pend.y+'%';el.textContent='+';st.appendChild(el);}
  paint();
}
function renderPins(v){ return renderOverlays(v); }

function visible(c){ if(cur.filter==='open')return !c.resolved; if(cur.filter==='resolved')return c.resolved; if(cur.filter==='mine')return c.author===me()||(c.mentions||[]).includes(me()); return true; }

/* ---------- filters ---------- */
function renderFilters(a,v){
  cur.filter=cur.filter||'open';
  const all=v.comments.length, op=open(v), res=all-op, mine=v.comments.filter(c=>c.author===me()||(c.mentions||[]).includes(me())).length;
  const tabs=[['open','Open',op],['all','All',all],['resolved','Resolved',res],['mine','Mine',mine]];
  $('#filters').innerHTML=tabs.map(([k,l,n])=>`<button class="filter ${cur.filter===k?'active':''}" type="button" aria-pressed="${cur.filter===k}" data-f="${k}">${l}<span class="cnt">${n}</span></button>`).join('');
  $all('#filters .filter').forEach(b=>b.onclick=()=>{cur.filter=b.dataset.f;renderThread(a,activeVer(a));});
}

/* ---------- thread ---------- */
function renderThread(a,v){
  renderFilters(a,v);
  const list=$('#threadList'); const ts=(cur&&cur.tsort)||'time';
  const sorters={time:(x,y)=>expTime(x)-expTime(y),newest:(x,y)=>(y.createdAt||0)-(x.createdAt||0),oldest:(x,y)=>(x.createdAt||0)-(y.createdAt||0)};
  const sq=(($('#threadSearch')||{}).value||'').trim().toLowerCase();
  let items=v.comments.filter(visible);
  if(sq) items=items.filter(c=>((c.body||'')+' '+(c.author||'')+' '+(c.replies||[]).map(r=>r.body).join(' ')).toLowerCase().includes(sq));
  items=items.slice().sort(sorters[ts]||sorters.time);
  const tsb=$('#threadSort'); if(tsb){tsb.classList.toggle('active',ts!=='time');tsb.title='Sort: '+tsortLabel(ts);}
  if(!items.length){ list.innerHTML=`<div class="thread-empty">${sq?'No comments match “'+esc(sq)+'”.':(cur.filter==='open'?'No open comments — all caught up.':'No comments here yet.')}<br>${sq?'Clear the search to see all.':(v.kind==='video'?'Move to a moment and type below':'Click the image, or just type')+' to add one.'}</div>`; }
  else list.innerHTML=items.map(c=>noteHTML(v,c)).join('');
  $all('.note',list).forEach(n=>wireNote(n,a,v));
  if(v.kind==='video'){renderMarkers(v);renderPins(v);} else renderPins(v);
  renderVersions(a);
}
function chip(c){ if(c.inOut)return `<span class="note-chip" data-jump>${mmss(c.inOut.a)}–${mmss(c.inOut.b)}</span>`;
  if(c.t!=null)return `<span class="note-chip" data-jump>${I.play}${mmss(c.t)}</span>`;
  if(c.point)return `<span class="note-chip point" data-jump>spot</span>`; return `<span class="note-chip point">general</span>`; }
function mentions(b){ return esc(b).replace(/@([A-Za-z]+)/g,(m,n)=>TEAM.find(x=>x.toLowerCase()===n.toLowerCase())?`<span class="mention">@${esc(n)}</span>`:m); }
function reactRow(c){ const r=c.reactions||{}; const chips=Object.keys(r).filter(k=>r[k].length).map(k=>`<button class="react ${r[k].includes(me())?'on':''}" data-emoji="${k}">${k}<span class="rc">${r[k].length}</span></button>`).join('');
  return `<span class="react-row">${chips}<button class="react add-react" data-add aria-label="Add reaction" title="Add reaction">${I.smile}</button></span>`; }
function noteHTML(v,c){ const reps=(c.replies||[]).map(r=>`<div class="reply"><b>${esc(r.author)}</b> ${mentions(r.body)}</div>`).join('');
  const draw=c.drawing?`<div class="note-thumb"><svg viewBox="0 0 100 60" preserveAspectRatio="none">${c.drawing.map(shapeSVG).join('')}</svg></div>`:'';
  return `<div class="note ${c.resolved?'resolved':''}" data-c="${c.id}">
    <div class="note-top">${av(c.author,'avatar-sm')}<span class="note-author">${esc(c.author)}</span>${chip(c)}${c.resolved?`<span class="done-pill">${I.check}Resolved</span>`:''}<span class="note-when">${timeAgo(c.createdAt)}</span></div>
    <div class="note-body">${mentions(c.body)}</div>${draw}
    ${reps?`<div class="replies">${reps}</div>`:''}
    <div class="note-foot">${reactRow(c)}<span class="spacer"></span>
      <button class="txt reply-toggle" title="Reply">${I.reply}<span class="lbl">Reply</span></button>
      <button class="txt resolve ${c.resolved?'done':''}" title="${c.resolved?'Reopen':'Resolve'}">${I.check}<span class="lbl">${c.resolved?'Reopen':'Resolve'}</span></button>
      <button class="txt del" title="Delete note" aria-label="Delete note">${I.trash}</button></div>
    <div class="confirm-row" hidden>Delete this note?<span class="spacer"></span><button class="cf-no">Cancel</button><button class="cf-yes">Delete</button></div>
    <div class="reply-box" hidden><input placeholder="Reply…"><button class="btn btn-soft btn-sm">Send</button></div></div>`; }
function wireNote(node,a,v){ const c=v.comments.find(x=>x.id===node.dataset.c); if(!c)return;
  const j=$('[data-jump]',node); if(j)j.onclick=()=>{ const tt=c.inOut?c.inOut.a:c.t;
    if(tt!=null){ if(cur.mediaEl&&cur.mediaEl.tagName==='VIDEO'){cur.mediaEl.currentTime=tt;selectNote(c.id);}else toast('Load the video to jump there.'); }
    else selectNote(c.id); };
  $('.resolve',node).onclick=()=>{c.resolved=!c.resolved;renderThread(a,v);renderLibrarySilently();toast(c.resolved?'Marked resolved':'Reopened');Cloud.setResolved(c.id,c.resolved).catch(()=>toast('Not saved','error'));};
  const rt=$('.reply-toggle',node),rb=$('.reply-box',node); rt.onclick=()=>{rb.hidden=!rb.hidden;if(!rb.hidden)$('input',rb).focus();};
  const send=async()=>{const inp=$('input',rb),val=inp.value.trim();if(!val)return;inp.value='';try{const r=await Cloud.addReply(c.id,val);(c.replies=c.replies||[]).push(r);renderThread(a,v);}catch(e){toast('Reply not sent','error');}};
  $('.btn',rb).onclick=send; $('input',rb).onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();send();}};
  $all('.react[data-emoji]',node).forEach(b=>b.onclick=()=>toggleReact(c,b.dataset.emoji,a,v));
  $('[data-add]',node).onclick=(e)=>{e.stopPropagation();reactPalette(node,c,a,v);};
  const foot=$('.note-foot',node),cfr=$('.confirm-row',node);
  $('.del',node).onclick=e=>{e.stopPropagation();foot.hidden=true;cfr.hidden=false;};
  $('.cf-no',cfr).onclick=e=>{e.stopPropagation();cfr.hidden=true;foot.hidden=false;};
  $('.cf-yes',cfr).onclick=e=>{e.stopPropagation();v.comments=v.comments.filter(x=>x.id!==c.id);if(cur.selectedId===c.id)cur.selectedId=null;renderThread(a,v);renderLibrarySilently();
    Cloud.deleteComment(c.id).catch(()=>toast('Could not delete','error')); toast('Note deleted.');};
  node.addEventListener('click',e=>{ if(e.target.closest('button')||e.target.closest('input')||e.target.closest('textarea')||e.target.closest('[data-jump]')||e.target.closest('.reply-box')||e.target.closest('.confirm-row'))return; selectNote(c.id); });
}
function toggleReact(c,emoji,a,v){ const r=c.reactions=c.reactions||{}; r[emoji]=r[emoji]||[]; const i=r[emoji].indexOf(me()); if(i>=0)r[emoji].splice(i,1);else r[emoji].push(me()); if(!r[emoji].length)delete r[emoji]; renderThread(a,v); Cloud.toggleReaction(c.id,emoji).catch(()=>{}); }
function reactPalette(node,c,a,v){ const old=$('.rpal',node); if(old){old.remove();return;} const pal=document.createElement('span'); pal.className='react-row rpal';
  pal.innerHTML=EMOJIS.map(e=>`<button class="react" data-e="${e}">${e}</button>`).join(''); $('.react-row',node).appendChild(pal);
  $all('[data-e]',pal).forEach(b=>b.onclick=ev=>{ev.stopPropagation();toggleReact(c,b.dataset.e,a,v);}); }
function selectNote(cid){ $all('.note').forEach(n=>n.classList.toggle('active',n.dataset.c===cid)); const node=$(`.note[data-c="${cid}"]`); if(node)node.scrollIntoView({block:'nearest',behavior:'smooth'});
  cur.selectedId=cid; cur.pendingPin=null; cur.pendingDrawing=null; cur._ovSig=null;
  const v=activeVer(asset(cur.assetId)); const c=v.comments.find(x=>x.id===cid); if(!c){renderOverlays(v);return;}
  const m=cur.mediaEl, target=(c.inOut?c.inOut.a:c.t);
  if(target!=null && m && m.tagName==='VIDEO' && Math.abs(m.currentTime-target)>0.02){
    // repaint AFTER the async seek lands, so overlays reflect the new frame (not the stale one)
    const onSeek=()=>{ m.removeEventListener('seeked',onSeek); cur._ovSig=null; renderOverlays(v); };
    m.addEventListener('seeked',onSeek); m.currentTime=target;
  }
  renderOverlays(v); }

/* ---------- composer ---------- */
function parseM(t){ const s=new Set(); (t.match(/@([A-Za-z]+)/g)||[]).forEach(k=>{const n=k.slice(1);const p=TEAM.find(x=>x.toLowerCase()===n.toLowerCase());if(p&&p!==me())s.add(p);}); return Array.from(s); }
function pinChip(){ const el=$('#pinChip'); const p=cur.pendingPin;
  if(cur.rangeAnchor!=null){el.hidden=false;el.innerHTML=`Range from ${mmss(cur.rangeAnchor)} · move to the end &amp; click Range`;return;}
  if(p&&p.kind==='time'){el.hidden=false;el.innerHTML=`At ${mmss(p.t)} <button id="rePin">change</button>`;$('#rePin').onclick=rePin;}
  else if(p&&p.kind==='range'){el.hidden=false;el.innerHTML=`Shows ${mmss(p.a)}–${mmss(p.b)} <button id="rePin">clear</button>`;$('#rePin').onclick=()=>{cur.pendingPin=null;pinChip();};}
  else if(p&&p.kind==='point'){el.hidden=false;el.innerHTML=`Pinned to a spot <button id="rePin">change</button>`;$('#rePin').onclick=()=>{cur.pendingPin=null;renderOverlays(activeVer(asset(cur.assetId)));toast('Click the frame to re-pin.');pinChip();};}
  else el.hidden=true; }
function rePin(){ const v=activeVer(asset(cur.assetId)); if(v.kind==='video'&&cur.mediaEl){cur.pendingPin={kind:'time',t:cur.mediaEl.currentTime};} pinChip(); }
function wireComposer(a,v){ const ta=$('#commentInput'),post=$('#postBtn'),menu=$('#mentionMenu');
  closeInline();cur.pendingPin=null;cur.pendingDrawing=null;cur.pendingShape=null;cur.rangeAnchor=null;cur.pinMode=false;cur.shapeMode=null;setDrawMode(false);setPinMode(false);$('#rangeToggle').classList.remove('on');pinChip();ta.value='';post.disabled=true;cur.activeDrawing=null;cur.selectedId=null;cur.showDrawings=[];updateTool();paint();
  if($('#threadSearch'))$('#threadSearch').value='';
  ta.onfocus=()=>{ if(!cur.pendingPin&&!cur.rangeAnchor&&v.kind==='video'&&cur.mediaEl){cur.pendingPin={kind:'time',t:cur.mediaEl.currentTime};pinChip();} };
  ta.oninput=()=>{post.disabled=!ta.value.trim();mention(ta,menu);};
  ta.onkeydown=e=>{ if(!menu.hidden){if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();moveM(menu,e.key==='ArrowDown'?1:-1);return;}if(e.key==='Enter'){e.preventDefault();pickM(ta,menu);return;}if(e.key==='Escape'){menu.hidden=true;return;}}
    if((e.metaKey||e.ctrlKey)&&e.key==='Enter'){e.preventDefault();doPost(a,v);} };
  post.onclick=()=>doPost(a,v);
  $('#drawToggle').onclick=()=>{setDrawMode(!cur.drawMode);if(cur.drawMode&&v.kind==='video'&&cur.mediaEl)cur.mediaEl.pause();};
  [['rect','#shape-rect','box'],['arrow','#shape-arrow','arrow'],['ellipse','#shape-ellipse','circle']].forEach(function(s){ const b=$(s[1]); if(b)b.onclick=()=>{ if(!hasMedia(v)){toast('Upload media first.');return;} setShapeMode(s[0]); if(cur.shapeMode){ if(v.kind==='video'&&cur.mediaEl)cur.mediaEl.pause(); toast('Drag on the '+(v.kind==='video'?'frame':'image')+' to draw a '+s[2]+'.'); } }; });
  $('#pinToggle').onclick=()=>{ if(!hasMedia(v)){toast('Upload media first.');return;} setPinMode(!cur.pinMode); if(cur.pinMode){ if(v.kind==='video'&&cur.mediaEl)cur.mediaEl.pause(); toast(v.kind==='video'?'Paused. Click the frame to drop a pin.':'Click the image to drop a pin.'); } };
  $('#rangeToggle').onclick=()=>{ if(v.kind!=='video'||!cur.mediaEl){toast('Range is for video — it keeps a note on screen across a whole section.');return;}
    if(cur.rangeAnchor==null){cur.rangeAnchor=cur.mediaEl.currentTime;cur.pendingPin=null;$('#rangeToggle').classList.add('on');pinChip();toast('Range start set at '+mmss(cur.rangeAnchor)+'. Now move to the end and click Range again.');}
    else{const b=cur.mediaEl.currentTime;cur.pendingPin={kind:'range',a:Math.min(cur.rangeAnchor,b),b:Math.max(cur.rangeAnchor,b)};cur.rangeAnchor=null;$('#rangeToggle').classList.remove('on');pinChip();toast('Range '+mmss(cur.pendingPin.a)+'–'+mmss(cur.pendingPin.b)+' — your note shows across this whole section.');} };
}
async function doPost(a,v){ const ta=$('#commentInput'),body=ta.value.trim(); if(!body)return; const p=cur.pendingPin;
  let t=p?(p.kind==='time'?p.t:p.kind==='point'?(p.t??null):null):null;   // range carries its own a/b, not t
  const inOut=p&&p.kind==='range'?{a:p.a,b:p.b}:null;
  const drawing=cur.pendingDrawing&&cur.pendingDrawing.length?cur.pendingDrawing:null;
  // anchor every video comment to the current frame unless it's a range, so it reappears exactly there
  if(t==null&&!inOut&&v.kind==='video'&&cur.mediaEl)t=cur.mediaEl.currentTime;
  const point=p&&p.kind==='point'?{x:p.x,y:p.y}:null;
  ta.value='';$('#postBtn').disabled=true;cur.pendingPin=null;cur.pendingDrawing=null;setDrawMode(false);pinChip();closeInline();
  if(cur.filter==='resolved')cur.filter='open';
  try{
    const c=await Cloud.addComment(v.id,{ body, t, inOut, point, drawing });
    v.comments.push(c); cur.selectedId=c.id;
    renderThread(a,v);renderLibrarySilently();
    const node=$(`.note[data-c="${c.id}"]`);if(node)node.scrollIntoView({block:'center'});
  }catch(e){ toast('Could not post comment: '+((e&&e.message)||e),'error'); }
}
function mention(ta,menu){ const pos=ta.selectionStart,m=ta.value.slice(0,pos).match(/@([A-Za-z]*)$/); if(!m){menu.hidden=true;return;}
  cur.mStart=pos-m[1].length-1; const q=m[1].toLowerCase(); const opts=TEAM.filter(n=>n.toLowerCase().startsWith(q)&&n!==me());
  if(!opts.length){menu.hidden=true;return;} menu.innerHTML=opts.map((n,i)=>`<div class="mention-opt ${i?'':'active'}" data-n="${esc(n)}">${av(n,'avatar-sm')}<span>${esc(n)}</span></div>`).join(''); menu.hidden=false;
  $all('.mention-opt',menu).forEach(o=>o.onmousedown=e=>{e.preventDefault();insM(ta,menu,o.dataset.n);}); }
function moveM(menu,d){ const o=$all('.mention-opt',menu);let i=o.findIndex(x=>x.classList.contains('active'));o[i]&&o[i].classList.remove('active');i=(i+d+o.length)%o.length;o[i].classList.add('active'); }
function pickM(ta,menu){ const a=$('.mention-opt.active',menu)||$('.mention-opt',menu); if(a)insM(ta,menu,a.dataset.n); }
function insM(ta,menu,n){ const pos=ta.selectionStart;ta.value=ta.value.slice(0,cur.mStart)+'@'+n+' '+ta.value.slice(pos);menu.hidden=true;ta.focus();$('#postBtn').disabled=!ta.value.trim(); }

/* ---------- actions ---------- */
function wireActions(a){
  $('#approveBtn').onclick=()=>{const v=activeVer(a),o=open(v);const go=()=>{a.status='Approved';renderStatus(a);renderLibrarySilently();toast('Approved');Cloud.setAssetStatus(a.id,'Approved').catch(()=>{});};
    if(o>0){modal('Approve with open comments?',`<p>${o} ${o===1?'comment is':'comments are'} still open. Approve anyway?</p>`,`<button class="btn btn-ghost" data-close>Keep reviewing</button><button class="btn btn-primary" id="apy">Approve</button>`);$('#apy').onclick=()=>{closeModal();go();};}else go();};
  $('#requestBtn').onclick=()=>{a.status='Changes requested';renderStatus(a);renderLibrarySilently();toast('Sent back for changes');Cloud.setAssetStatus(a.id,'Changes requested').catch(()=>{});};
}

/* ---------- upload / sample / versions ---------- */
const MAX_UPLOAD_MB = 500;   // demo cap (file is held in your browser). Hosted version (Mux) has no practical limit.
async function upload(file,a,mode){ if(!file)return;
  if(!/^image\//.test(file.type)&&!/^video\//.test(file.type)){toast('Only image or video files.','error');return;}
  if(file.size>5*1024*1024*1024-5*1024*1024){toast('File is over ~5 GB — bigger uploads are coming soon.','error');return;}
  const kind=/^video\//.test(file.type)?'video':'image';
  const t=toast('Uploading '+file.name+'…','info');
  try{
    const { r2_key }=await Cloud.uploadFile(file,CUR_PROJECT.id);
    let v;
    if(mode==='version'&&a.versions.length&&hasMedia(activeVer(a))){
      v=await Cloud.addVersion(a.id,{label:'V'+(a.versions.length+1),kind,r2_key,duration:null}); a.versions.push(v); a.activeVersionId=v.id;
    } else {
      v=activeVer(a); await Cloud.updateVersion(v.id,{kind,r2_key,duration:null}); v.kind=kind; v.r2_key=r2_key; v.dataURL=null; v.blobKey=null; v.duration=null;
    }
    if(a.status==='Approved'){a.status='In review'; Cloud.setAssetStatus(a.id,'In review').catch(()=>{});}
    try{t&&t.remove();}catch(_){}
    openReview(a.id,{v:v.id}); toast(mode==='version'?'Uploaded '+v.label:'Uploaded');
  }catch(e){ try{t&&t.remove();}catch(_){} toast('Upload failed: '+((e&&e.message)||e),'error'); }
}
function thumb(kind,file){ return new Promise((res,rej)=>{ const u=URL.createObjectURL(file);
  if(kind==='image'){const im=new Image();im.onload=()=>{res(draw(im,im.width,im.height));URL.revokeObjectURL(u);};im.onerror=rej;im.src=u;}
  else{const vd=document.createElement('video');vd.muted=true;vd.src=u;vd.onloadeddata=()=>{vd.currentTime=Math.min(.5,(vd.duration||1)*.25);};vd.onseeked=()=>{res(draw(vd,vd.videoWidth,vd.videoHeight));URL.revokeObjectURL(u);};vd.onerror=rej;} });
  function draw(s,w,h){const c=document.createElement('canvas');c.width=320;c.height=200;const g=c.getContext('2d');const r=Math.max(320/w,200/h);g.drawImage(s,(320-w*r)/2,(200-h*r)/2,w*r,h*r);return c.toDataURL('image/jpeg',.7);} }
function sampleClip(a,v){ if(typeof MediaRecorder==='undefined'||!HTMLCanvasElement.prototype.captureStream){toast('This browser can’t make a sample — upload your own.');return;}
  toast('Recording an 8s sample clip…'); const c=document.createElement('canvas');c.width=640;c.height=360;const g=c.getContext('2d');const stream=c.captureStream(30);let rec;
  try{rec=new MediaRecorder(stream,{mimeType:'video/webm'});}catch(e){toast('Recorder unavailable — upload your own.');return;}
  const ch=[];rec.ondataavailable=e=>{if(e.data.size)ch.push(e.data);};const t0=performance.now();
  (function f(){const t=(performance.now()-t0)/1000;g.fillStyle='#0b1f3a';g.fillRect(0,0,640,360);g.save();g.translate(320,190);g.rotate(t*.6);g.fillStyle='#4F6EF0';g.fillRect(-55,-55,110,110);g.restore();g.fillStyle='#fff';g.textAlign='center';g.font='700 40px Inter,sans-serif';g.fillText('BRAND FILM',320,70);g.font='500 16px Inter';g.fillStyle='rgba(255,255,255,.7)';g.fillText(t.toFixed(1)+'s',320,330);if(performance.now()-t0<8000)requestAnimationFrame(f);else rec.stop();})();
  rec.onstop=async()=>{const blob=new Blob(ch,{type:'video/webm'});const key=uid('b');await idbPut(key,blob);v.kind='video';v.blobKey=key;v.dataURL=null;v.duration=8;try{v.thumb=await thumb('video',blob);}catch(e){}save();openReview(a.id);toast('Sample clip loaded');};
  rec.start();
}

/* ---------- share / export ---------- */
async function shareModal(a,v){
  const card=modal('Share for review',`<p class="muted" style="margin:0">Creating a public link…</p>`,`<button class="btn btn-ghost" data-close>Close</button>`);
  try{
    const token=await Cloud.createShareLink(a.id);
    const url=location.origin+location.pathname+'#/share/'+token;
    const body=$('.modal-body',card); if(body) body.innerHTML=`<div class="field"><label>Public review link</label><div class="share-link"><input id="shareUrl" value="${esc(url)}" readonly><button class="btn btn-primary" id="copyUrl">Copy</button></div></div>
      <p class="muted">Anyone with this link can open the review and see the video plus all comments and markups — <strong>no account needed</strong>. (Guest commenting is coming next.)</p>`;
    const cb=$('#copyUrl'); if(cb)cb.onclick=()=>{const i=$('#shareUrl');i.select();copy(i.value);toast('Link copied');};
  }catch(e){ const body=$('.modal-body',card); if(body) body.innerHTML=`<p class="muted">Could not create the link: ${esc((e&&e.message)||String(e))}</p>`; }
}
function copy(t){ if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(t).catch(()=>fb()); else fb(); function fb(){const x=document.createElement('textarea');x.value=t;document.body.appendChild(x);x.select();try{document.execCommand('copy');}catch(e){}x.remove();} }
/* ---------- export: turn comments into NLE timeline markers ---------- */
function tc(sec,fps){ sec=Math.max(0,sec||0); var f=Math.round(sec*fps); var p=function(n){return String(n).padStart(2,'0');};
  return p(Math.floor(f/(fps*3600)))+':'+p(Math.floor(f/(fps*60))%60)+':'+p(Math.floor(f/fps)%60)+':'+p(f%fps); }
function expTime(c){ return c.t!=null?c.t:(c.inOut?c.inOut.a:0); }
function expSorted(v){ return v.comments.slice().sort(function(x,y){return expTime(x)-expTime(y);}); }
function dl(name,content,mime){ var b=new Blob([content],{type:mime||'text/plain'}); var u=URL.createObjectURL(b); var el=document.createElement('a'); el.href=u; el.download=name; el.click(); URL.revokeObjectURL(u); }
function dlBlob(name,blob){ var u=URL.createObjectURL(blob); var el=document.createElement('a'); el.href=u; el.download=name; el.click(); setTimeout(function(){URL.revokeObjectURL(u);},3000); }
// Save the current frame (media + freehand drawings) as a PNG
function frameSnapshot(){
  var m=cur&&cur.mediaEl; if(!m){toast('Open a review with media first.','info');return;}
  var w=m.videoWidth||m.naturalWidth||m.clientWidth, h=m.videoHeight||m.naturalHeight||m.clientHeight;
  if(!w||!h){toast('The frame isn’t ready yet — give it a moment.','info');return;}
  var cn=document.createElement('canvas'); cn.width=w; cn.height=h; var g=cn.getContext('2d');
  try{ g.drawImage(m,0,0,w,h); if(cur.canvas&&cur.canvas.width) g.drawImage(cur.canvas,0,0,w,h); }
  catch(e){ toast('Couldn’t capture this frame.','error'); return; }
  cn.toBlob(function(b){ if(!b){toast('Couldn’t capture this frame.','error');return;}
    var a=asset(cur.assetId); var base=((a&&a.title)||'frame').replace(/[^\w]+/g,'-').replace(/^-+|-+$/g,'')||'frame';
    var stamp=(m.tagName==='VIDEO')?'-'+mmss(m.currentTime).replace(':','m')+'s':'';
    dlBlob(base+stamp+'.png',b); toast('Frame saved as PNG.'); },'image/png');
}
function csvCell(s){ return '"'+String(s==null?'':s).replace(/"/g,'""')+'"'; }
function oneLine(s){ return String(s==null?'':s).replace(/[\r\n]+/g,' '); }

function genTXT(a,v){ var L=['Feedback — '+a.title+' ('+v.label+')','Status: '+a.status,''];
  v.comments.forEach(function(c){ var loc=c.inOut?('['+mmss(c.inOut.a)+'-'+mmss(c.inOut.b)+']'):(c.t!=null?('['+mmss(c.t)+']'):(c.point?'[spot]':'[general]'));
    L.push((c.resolved?'[x]':'[ ]')+' '+loc+' '+c.author+': '+c.body); (c.replies||[]).forEach(function(r){L.push('      ↳ '+r.author+': '+r.body);}); });
  return L.join('\n'); }
function genCSV(a,v,fps){ var L=['Number,Timecode,Seconds,Author,Comment,Type,Resolved'];
  expSorted(v).forEach(function(c,i){ var type=c.inOut?'range':(c.t!=null?'time':(c.point?'spot':'general'));
    L.push([i+1,tc(expTime(c),fps),expTime(c).toFixed(2),csvCell(c.author),csvCell(c.body),type,c.resolved?'yes':'no'].join(',')); });
  return L.join('\n'); }
function genEDL(a,v,fps){ var L=['TITLE: '+a.title.toUpperCase()+' — FEEDBACK','FCM: NON-DROP FRAME','']; var n=0;
  expSorted(v).forEach(function(c){ n++; var rin=tc(expTime(c),fps), rout=tc(expTime(c)+1/fps,fps); var txt=oneLine(c.author+': '+c.body);
    L.push(String(n).padStart(3,'0')+'  AX       V     C        00:00:00:00 00:00:00:01 '+rin+' '+rout);
    L.push('* '+txt);
    L.push('* LOC: '+rin+' RED '+txt.slice(0,60)); L.push(''); });
  return L.join('\n'); }
function genFCPXML(a,v,fps){ var total=0; v.comments.forEach(function(c){ total=Math.max(total,expTime(c)); }); total=Math.round((total+5)*fps);
  var fd='1/'+fps+'s';
  var markers=expSorted(v).map(function(c){ return '            <marker start="'+(Math.round(expTime(c)*fps)+'/'+fps+'s')+'" duration="'+fd+'" value="'+esc(oneLine(c.author+': '+c.body))+'"/>'; }).join('\n');
  return '<?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE fcpxml>\n<fcpxml version="1.10">\n'+
    '  <resources>\n    <format id="r1" name="Daxio '+fps+'p" frameDuration="'+fd+'" width="1920" height="1080"/>\n  </resources>\n'+
    '  <library>\n    <event name="Daxio Feedback">\n      <project name="'+esc(a.title)+' — feedback">\n'+
    '        <sequence format="r1" tcStart="0s" tcFormat="NDF">\n          <spine>\n'+
    '            <gap name="Feedback" offset="0s" start="0s" duration="'+total+'/'+fps+'s">\n'+markers+'\n            </gap>\n'+
    '          </spine>\n        </sequence>\n      </project>\n    </event>\n  </library>\n</fcpxml>\n'; }

function exportFeedback(a){ var v=activeVer(a);
  if(!v||!v.comments||!v.comments.length){ modal('Nothing to export yet','<p style="margin:0;color:var(--ink-2);font-size:14px;line-height:1.55;">This review has no comments yet. Add feedback on the frame first — then you can export it as timeline markers for Premiere, Final Cut or DaVinci Resolve.</p>','<button class="btn btn-primary" data-close>Got it</button>'); return; }
  var fmts=[['fcpxml','Final Cut Pro (FCPXML)','Markers — also imports into Resolve & Premiere'],
            ['edl','EDL (CMX 3600)','Resolve & Premiere — includes * LOC: marker lines'],
            ['csv','CSV','Spreadsheet or generic marker list'],
            ['txt','Text checklist','Human-readable notes']];
  var card=modal('Export feedback as markers',
    '<p style="margin:0 0 16px;color:var(--ink-2);font-size:13px;line-height:1.5;">Turn these comments into timeline markers your editor can import — the round-trip back into Premiere, Final Cut or DaVinci Resolve. Pick a frame rate so timecodes line up.</p>'+
    '<div style="font-size:12px;font-weight:600;color:var(--ink-2);margin-bottom:6px;">Frame rate</div>'+
    '<div class="fps-row">'+[24,25,30].map(function(f){return '<button class="fps-btn'+(f===30?' on':'')+'" data-fps="'+f+'">'+f+' fps</button>';}).join('')+'</div>'+
    '<div class="exp-list">'+fmts.map(function(f){return '<button class="exp-opt" data-k="'+f[0]+'"><div><div class="eo-t">'+f[1]+'</div><div class="eo-h">'+f[2]+'</div></div><span>&darr;</span></button>';}).join('')+'</div>',
    '<button class="btn btn-soft" data-close>Close</button>');
  var fps=30;
  $all('.fps-btn',card).forEach(function(b){ b.onclick=function(){ fps=+b.dataset.fps; $all('.fps-btn',card).forEach(function(x){x.classList.toggle('on',x===b);}); }; });
  $all('.exp-opt',card).forEach(function(b){ b.onclick=function(){ var k=b.dataset.k; var base=(a.title||'daxio').replace(/[^\w]+/g,'-').replace(/^-+|-+$/g,'')||'daxio';
    if(k==='txt') dl(base+'-feedback.txt',genTXT(a,v),'text/plain');
    else if(k==='csv') dl(base+'-markers.csv',genCSV(a,v,fps),'text/csv');
    else if(k==='edl') dl(base+'.edl',genEDL(a,v,fps),'text/plain');
    else dl(base+'.fcpxml',genFCPXML(a,v,fps),'application/xml');
    closeModal(); toast('Exported '+k.toUpperCase()+' — import it as markers in your editor.'); }; });
}

/* ---------- misc ---------- */
function jump(){ if(cur.pendingT!=null&&cur.mediaEl&&cur.mediaEl.tagName==='VIDEO'){try{cur.mediaEl.currentTime=cur.pendingT;}catch(e){}cur.pendingT=null;} if(cur.pendingC){selectNote(cur.pendingC);cur.pendingC=null;} }
function renderLibrarySilently(){ if($('#libraryView').hidden)return; renderLibrary(); }
function modal(title,body,foot){ const root=$('#modalRoot'),card=$('#modalCard'); card.innerHTML=`<div class="modal-head">${esc(title)}<button class="icon-btn" data-close>${I.close}</button></div><div class="modal-body">${body}</div>${foot?`<div class="modal-foot">${foot}</div>`:''}`; root.hidden=false; $all('[data-close]',root).forEach(x=>x.onclick=closeModal); $('.modal-scrim',root).onclick=closeModal; return card; }
function closeModal(){ $('#modalRoot').hidden=true; $('#modalCard').innerHTML=''; }
function onKey(e){ if(!$('#modalRoot').hidden&&e.key==='Escape'){closeModal();return;} if($('#reviewView').hidden)return;
  const ae=document.activeElement; const typing=!!(ae&&/^(INPUT|TEXTAREA)$/.test(ae.tagName));
  if(e.key==='Escape'){if(!$('#mentionMenu').hidden){$('#mentionMenu').hidden=true;return;}if(cur&&cur.drawMode){setDrawMode(false);return;}if(cur&&cur.pinMode){setPinMode(false);return;}location.hash='';return;}
  if(typing)return;
  if(e.key==='?'||(e.key==='/'&&e.shiftKey)){ e.preventDefault(); shortcutsModal(); return; }
  const vid=cur&&cur.mediaEl&&cur.mediaEl.tagName==='VIDEO'?cur.mediaEl:null; if(!vid)return;
  const fps=(cur&&cur.fps)||30;
  if(e.key===' '||e.code==='Space'||e.key==='k'||e.key==='K'){e.preventDefault();vid.paused?vid.play():vid.pause();}
  else if(e.key===','){vid.pause();vid.currentTime=Math.max(0,vid.currentTime-1/fps);}
  else if(e.key==='.'){vid.pause();vid.currentTime+=1/fps;}
  else if(e.key==='j'||e.key==='J'){vid.currentTime=Math.max(0,vid.currentTime-1);}
  else if(e.key==='l'||e.key==='L'){vid.currentTime=Math.min(vid.duration||1e9,vid.currentTime+1);} }
function shortcutsModal(){ const rows=[['Space  ·  K','Play / pause'],[',  /  .','Previous / next frame'],['J  /  L','Back / forward 1 second'],['← →  (timeline focused)','Scrub · hold Shift for ±5s'],['Home / End','Jump to start / end'],['⌘ / Ctrl + Enter','Post a comment'],['?','Show this help'],['Esc','Close / go back']];
  modal('Keyboard shortcuts','<div class="sc-list">'+rows.map(r=>'<div class="sc-row"><kbd>'+esc(r[0])+'</kbd><span>'+esc(r[1])+'</span></div>').join('')+'</div>','<button class="btn btn-primary" data-close>Got it</button>'); }
function toast(m,type,action){ const h=$('#toastHost'); if(!h)return; const el=document.createElement('div'); el.className='toast'+(type?' toast-'+type:'');
  const ic = type==='error'?I.alert : type==='info'?I.info : I.check;
  el.innerHTML='<span class="toast-ic" aria-hidden="true">'+ic+'</span><span class="toast-msg">'+esc(m)+'</span>';
  if(action&&action.label){ const b=document.createElement('button'); b.className='toast-action'; b.type='button'; b.textContent=action.label;
    b.onclick=()=>{ clearTimeout(tm); try{action.onClick();}catch(_){} el.remove(); }; el.appendChild(b); }
  h.appendChild(el);
  const tm=setTimeout(()=>{ el.style.opacity='0'; setTimeout(()=>el.remove(),250); }, action?6000:2400);
  return el; }
window.addEventListener('resize',()=>{ if(cur&&cur.canvas)sizeCanvas(); });
