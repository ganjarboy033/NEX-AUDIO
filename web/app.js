(() => {
'use strict';
const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
const N = window.NX, LS = localStorage, BUILTIN = window.E, APPV = '3.0.0';
const get = (k, d) => { try { const v = LS.getItem(k); return v == null ? d : JSON.parse(v); } catch (_) { return d; } };
const set = (k, v) => { try { LS.setItem(k, JSON.stringify(v)); } catch (_) {} };
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const sleep = ms => new Promise(r => setTimeout(r, ms));

/* ================= i18n ================= */
const T = {
  id: { ph_url: 'https://…', ph_search: 'Cari…', paste_empty: 'Clipboard kosong', paste_none: 'Tidak ada link di clipboard', analyzing: 'Menganalisis…', found: 'Ditemukan {n} opsi', dl: 'Unduh', dl_all: 'Unduh semua', copy: 'Salin tautan', copied: 'Tautan disalin', preview: 'Pratinjau', to_queue: '+ Antrean', queued: 'Masuk antrean pemutar', prep: 'Menyiapkan…', started: 'Mengunduh…', done: 'Selesai — folder Unduhan', failed: 'Gagal', paused: 'Dijeda', hist_empty: 'Belum ada riwayat', q_empty: 'Antrean kosong. Tambah file dari perangkat.', del: 'Hapus', again: 'Analisis ulang', cleared: 'Dibersihkan', ota_none: 'Isi URL sumber update lebih dulu', ota_https: 'URL harus diawali https://', ota_check: 'Memeriksa…', ota_latest: 'Sudah terbaru (v{v})', ota_ok: 'Scraper diperbarui ke v{v}', ota_reset_ok: 'Kembali ke scraper bawaan', ota_never: 'Belum pernah', ota_builtin: 'Bawaan', ota_confirm: 'Hapus semua setelan & riwayat?', multi: '{n} item', by: 'oleh' },
  en: { hero_k: 'MEDIA DOWNLOADER', hero_h: 'Paste a link, get the media.', hero_p: '16 platforms in one lightweight app.', analyze: 'Analyze', clear: 'Clear', platforms: 'SUPPORTED PLATFORMS', history: 'History', clear_all: 'Delete all', player: 'Player', add_files: '+ Add files', speed: 'Speed', sleep: 'Sleep timer', queue: 'QUEUE', reset: 'Reset', mode: 'MODE', accent: 'ACCENT COLOR', radius: 'Radius', font: 'Font size', glass: 'Glass effect (blur)', glass_s: 'Turn off if the device feels slow', orbs: 'Orb animation', orbs_s: 'Home banner decoration', brand: 'APP NAME', settings: 'Settings', general: 'GENERAL', lang: 'Language', autopaste: 'Auto-paste from clipboard', autopaste_s: 'On open, if the clipboard holds a supported link', autogo: 'Auto analyze', autogo_s: 'Analyze right after paste / share', timeout: 'Network timeout (seconds)', folder: 'DOWNLOAD FOLDER', open_dl: 'Open Downloads folder', ota: 'SCRAPER UPDATE (OTA)', ota_p: 'Update scraper scripts without installing a new APK. Bundles are SHA-256 verified before use.', ota_cur: 'Active version', ota_last: 'Last check', ota_log: 'Notes', ota_url: 'UPDATE SOURCE URL', ota_auto: 'Auto check', ota_auto_s: 'At most once per 6 hours on launch', ota_check: 'Check & update', ota_reset: 'Restore built-in', data: 'DATA', clear_hist: 'Clear history', clear_data: 'Reset all settings', n_home: 'Home', n_hist: 'History', n_play: 'Player', n_theme: 'Theme', n_set: 'Settings',
    paste_empty: 'Clipboard is empty', paste_none: 'No link in clipboard', analyzing: 'Analyzing…', found: '{n} options found', dl: 'Download', dl_all: 'Download all', copy: 'Copy link', copied: 'Link copied', preview: 'Preview', to_queue: '+ Queue', queued: 'Added to player queue', prep: 'Preparing…', started: 'Downloading…', done: 'Done — Downloads folder', failed: 'Failed', paused: 'Paused', hist_empty: 'No history yet', q_empty: 'Queue is empty. Add files from your device.', del: 'Delete', again: 'Analyze again', cleared: 'Cleared', ota_none: 'Enter the update source URL first', ota_https: 'URL must start with https://', ota_check: 'Checking…', ota_latest: 'Up to date (v{v})', ota_ok: 'Scrapers updated to v{v}', ota_reset_ok: 'Restored built-in scrapers', ota_never: 'Never', ota_builtin: 'Built-in', ota_confirm: 'Delete all settings & history?', multi: '{n} items', by: 'by' },
};
let lang = get('nx_lang', (navigator.language || 'id').startsWith('en') ? 'en' : 'id');
const tr = (k, o) => { let s = (T[lang] && T[lang][k]) || T.id[k] || k; if (o) for (const x in o) s = s.replace('{' + x + '}', o[x]); return s; };
function applyLang() {
  document.documentElement.lang = lang;
  $$('[data-t]').forEach(e => { if (e.dataset.o == null) e.dataset.o = e.textContent; e.textContent = lang === 'en' && T.en[e.dataset.t] ? T.en[e.dataset.t] : e.dataset.o; });
  $$('[data-tp]').forEach(e => { if (e.dataset.o == null) e.dataset.o = e.placeholder; e.placeholder = lang === 'en' && T.en[e.dataset.tp] ? T.en[e.dataset.tp] : e.dataset.o; });
  $$('#segLang button').forEach(b => b.classList.toggle('on', b.dataset.v === lang));
}
function toast(m, ms = 2600) { const d = document.createElement('div'); d.className = 'toast'; d.textContent = m; $('#toasts').appendChild(d); setTimeout(() => d.remove(), ms); }

/* ================= Theme ================= */
const TH0 = { mode: 'dark', accent: '#9b7cff', radius: 18, font: 100, glass: true, orbs: true, brand: 'Nimiyo' };
let th = Object.assign({}, TH0, get('nx_theme', {}));
const PRESETS = ['#9b7cff', '#38b9de', '#4dd6a4', '#ff7487', '#f4bf68', '#ff8a4c', '#e879f9', '#60a5fa'];
const hexOk = h => /^#[0-9a-f]{6}$/i.test(h);
const rgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)).join(',');
function applyTheme() {
  const r = document.documentElement.style, b = document.body;
  b.dataset.mode = th.mode; r.setProperty('--accent', th.accent); r.setProperty('--accent-rgb', rgb(th.accent));
  r.setProperty('--radius', th.radius + 'px'); r.setProperty('--fs', th.font + '%');
  b.classList.toggle('noglass', !th.glass); b.classList.toggle('noorbs', !th.orbs);
  $('#appName').textContent = th.brand || 'Nimiyo';
  const m = document.querySelector('meta[name=theme-color]'); if (m) m.content = { dark: '#0c1020', light: '#f2f3fb', amoled: '#000000' }[th.mode];
  $$('#segMode button').forEach(x => x.classList.toggle('on', x.dataset.v === th.mode));
  $$('.pr').forEach(x => x.classList.toggle('on', x.dataset.c === th.accent.toLowerCase()));
  $('#accPick').value = th.accent; $('#accHex').value = th.accent; $('#rad').value = th.radius; $('#radV').textContent = th.radius + 'px';
  $('#fnt').value = th.font; $('#fntV').textContent = th.font + '%'; $('#glass').checked = th.glass; $('#orbs').checked = th.orbs; $('#brand').value = th.brand === 'Nimiyo' ? '' : th.brand;
}
const saveTheme = () => { set('nx_theme', th); applyTheme(); };
function initTheme() {
  $('#presets').innerHTML = PRESETS.map(c => `<button class="pr" data-c="${c}" style="background:linear-gradient(135deg,${c},#38b9de)"></button>`).join('');
  $('#presets').onclick = e => { const c = e.target.dataset && e.target.dataset.c; if (c) { th.accent = c; saveTheme(); } };
  $('#segMode').onclick = e => { const v = e.target.dataset.v; if (v) { th.mode = v; saveTheme(); } };
  $('#accPick').oninput = e => { th.accent = e.target.value; saveTheme(); };
  $('#accHex').onchange = e => { let v = e.target.value.trim(); if (v[0] !== '#') v = '#' + v; if (hexOk(v)) { th.accent = v.toLowerCase(); saveTheme(); } else applyTheme(); };
  $('#rad').oninput = e => { th.radius = +e.target.value; saveTheme(); };
  $('#fnt').oninput = e => { th.font = +e.target.value; saveTheme(); };
  $('#glass').onchange = e => { th.glass = e.target.checked; saveTheme(); };
  $('#orbs').onchange = e => { th.orbs = e.target.checked; saveTheme(); };
  $('#brand').onchange = e => { th.brand = e.target.value.trim() || 'Nimiyo'; saveTheme(); };
  $('#thReset').onclick = () => { th = Object.assign({}, TH0); saveTheme(); };
  applyTheme();
}

/* ================= Navigasi ================= */
let page = 'home';
function go(p) { page = p; $$('.page').forEach(x => x.classList.toggle('active', x.id === 'p-' + p)); $$('.ni').forEach(x => x.classList.toggle('active', x.dataset.p === p)); window.scrollTo(0, 0); if (p === 'hist') { renderHist(); renderSaved(); } if (p === 'set') otaUI(); }
$('#nav').onclick = e => { const b = e.target.closest('.ni'); if (b) go(b.dataset.p); };
function openModal(html) { $('#mBody').innerHTML = html; $('#modal').classList.remove('hidden'); }
function closeModal() { $('#modal').classList.add('hidden'); $('#mBody').innerHTML = ''; }
$('#mClose').onclick = closeModal; $('#modal').onclick = e => { if (e.target.id === 'modal') closeModal(); };
window.__back = () => { if (!$('#modal').classList.contains('hidden')) return closeModal(); if (page !== 'home') return go('home'); if (N) N.exit(); };

/* ================= Beranda ================= */
const kcol = k => { let h = 0; for (const c of k) h = (h * 31 + c.charCodeAt(0)) % 360; return `hsl(${h},62%,52%)`; };
function chips() { $('#chips').innerHTML = E.PL.map(p => `<div class="chip"><i style="background:${kcol(p[0])}">${esc(p[1][0])}</i>${esc(p[1])}</div>`).join(''); }
function status(m, c) { const s = $('#status'); s.textContent = m || ''; s.className = 'status' + (c ? ' ' + c : ''); }
let cur = null, busy = false;
async function analyze() {
  if (busy) return; const raw = $('#url').value.trim(); if (!raw) return status('', '');
  busy = true; $('#btnGo').disabled = true; $('#result').classList.add('hidden'); status(tr('analyzing'));
  try {
    const r = await E.run(raw, s => status(s));
    cur = r; $('#url').value = r.url; renderResult(r); status(tr('found', { n: r.items.length }), 'ok');
  } catch (e) { status(e.message || String(e), 'err'); }
  busy = false; $('#btnGo').disabled = false;
}
const ICON = { video: '▶', audio: '♪', image: '▣', file: '⬚' };
const MIME = { mp4: 'video/mp4', webm: 'video/webm', mkv: 'video/x-matroska', mp3: 'audio/mpeg', m4a: 'audio/mp4', flac: 'audio/flac', wav: 'audio/wav', jpg: 'image/jpeg', png: 'image/png', webp: 'image/webp', gif: 'image/gif', zip: 'application/zip' };
function renderResult(r) {
  const th2 = r.thumb ? `<img class="thumb" src="${esc(r.thumb)}" referrerpolicy="no-referrer" onerror="this.style.visibility='hidden'">` : '<div class="thumb"></div>';
  $('#result').innerHTML = `<div class="res-head">${th2}<div style="min-width:0"><h4>${esc(r.title)}</h4><small class="muted">${r.author ? esc(tr('by') + ' ' + r.author) : ''}</small><div class="badges"><span class="bd">${esc(r.pname)}</span><span class="bd">${esc(r.src)}</span><span class="bd">${esc(tr('multi', { n: r.items.length }))}</span></div></div></div>
  <div class="btnrow"><button class="btn" id="saveCurrent">☆ Simpan tautan</button><button class="btn" id="shareCurrent">↗ Bagikan</button></div>
  ${r.items.length > 1 ? `<button class="btn primary" id="dlAll" style="width:100%;margin-top:14px">⬇ ${esc(tr('dl_all'))}</button>` : ''}
  <div class="items">${r.items.map((x, i) => `<div class="item" data-i="${i}"><div class="irow"><div class="ik">${ICON[x.kind] || '⬚'}</div><div class="il"><b>${esc(x.label)}</b><small>${esc(x.ext.toUpperCase())} · ${esc(x.kind)}</small></div>
  <div class="acts">${x.url && x.kind !== 'file' ? `<button data-a="pv" title="${esc(tr('preview'))}">👁</button>` : ''}${x.url ? `<button data-a="cp" title="${esc(tr('copy'))}">⧉</button>` : ''}<button class="go" data-a="dl" title="${esc(tr('dl'))}">⬇</button></div></div><div class="bar hidden"><i></i></div><small class="st"></small></div>`).join('')}</div>`;
  $('#result').classList.remove('hidden');
  $('#result').scrollIntoView({ behavior: 'smooth', block: 'start' });
}
$('#result').onclick = e => {
  const all = e.target.closest('#dlAll'); if (all) return dlAll();
  if (e.target.closest('#saveCurrent')) { saveCurrent(); return; }
  if (e.target.closest('#shareCurrent')) { if (navigator.share && cur) navigator.share({title:cur.title,text:cur.url}).catch(()=>{}); else copy(cur.url); return; }
  const b = e.target.closest('button[data-a]'); if (!b) return;
  const row = b.closest('.item'), i = +row.dataset.i, it = cur.items[i];
  if (b.dataset.a === 'dl') download(i, row);
  else if (b.dataset.a === 'cp') copy(it.url);
  else if (b.dataset.a === 'pv') preview(it);
};
async function dlAll() { const rows = $$('#result .item'); for (const r of rows) { await download(+r.dataset.i, r); await sleep(350); } }
function copy(t) { if (N) N.copy(t); else if (navigator.clipboard) navigator.clipboard.writeText(t).catch(() => {}); toast(tr('copied')); }
function preview(it) {
  const u = esc(it.url);
  const body = it.kind === 'image' ? `<img src="${u}" referrerpolicy="no-referrer">` : it.kind === 'audio' ? `<audio controls autoplay src="${u}"></audio>` : `<video controls autoplay playsinline src="${u}"></video>`;
  openModal(body + `<p>${esc(it.label)}</p>` + (it.kind !== 'image' ? `<button class="btn sm" id="mq" style="margin-top:10px">${esc(tr('to_queue'))}</button>` : ''));
  const q = $('#mq'); if (q) q.onclick = () => { addQ({ n: (cur ? cur.title : it.label) + ' · ' + it.label, u: it.url, v: it.kind === 'video' }); toast(tr('queued')); };
}
const safe = s => String(s || '').replace(/[\\/:*?"<>|\u0000-\u001f]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 70);
function hdrs(it) { const h = Object.assign({ 'User-Agent': E.UA }, it.h || {}); return Object.keys(h).map(k => k + ': ' + h[k]).join('\n'); }
async function download(i, row) {
  const st = row.querySelector('.st'), bar = row.querySelector('.bar'), fill = bar.firstElementChild, r = cur;
  const say = (t, c) => { st.textContent = t; st.className = 'st' + (c ? ' ' + c : ''); };
  try {
    say(tr('prep')); let it = r.items[i];
    if (it.lazy) it = await E.resolve(it);
    if (!it.url) throw new Error('URL kosong');
    const folder = safe(get('nx_folder', 'Nimiyo')) || 'Nimiyo';
    const nm = safe(r.title) + (r.items.length > 1 ? ' - ' + safe(it.label) : '');
    const name = folder + '/' + (nm || 'media') + '.' + it.ext;
    if (!N) { window.open(it.url, '_blank'); say(tr('started')); addHist(r); return; }
    const id = N.dl(it.url, name, MIME[it.ext] || 'application/octet-stream', hdrs(it));
    if (!id) throw new Error('DownloadManager menolak');
    addHist(r); logDownload({name:nm+'.'+it.ext,url:it.url,status:'Dimulai',ts:Date.now(),id:String(id)}); bar.classList.remove('hidden'); say(tr('started'));
    const t0 = Date.now();
    const iv = setInterval(() => {
      const s = (N.dlState(id) || '').split('|'), c = +s[0], b = +s[1], t = +s[2];
      if (c === 8) { clearInterval(iv); fill.style.width = '100%'; say(tr('done'), 'ok'); logDownload({name:nm+'.'+it.ext,url:it.url,status:'Selesai',ts:Date.now(),id:String(id)}); }
      else if (c === 16 || !s[0] || Date.now() - t0 > 3.6e6) { clearInterval(iv); say(tr('failed'), 'bad'); logDownload({name:nm+'.'+it.ext,url:it.url,status:'Gagal',ts:Date.now(),id:String(id)}); }
      else { fill.style.width = (t > 0 ? Math.max(4, b / t * 100) : 8) + '%'; say((c === 4 ? tr('paused') : tr('started')) + (t > 0 ? ' ' + Math.round(b / t * 100) + '%' : '')); }
    }, 700);
  } catch (e) { say(tr('failed') + ': ' + (e.message || e), 'bad'); }
}
$('#btnGo').onclick = analyze;
$('#url').onkeydown = e => { if (e.key === 'Enter') analyze(); };
$('#btnClr').onclick = () => { $('#url').value = ''; $('#result').classList.add('hidden'); status(''); cur = null; };
async function pasteClip() { let t = ''; try { t = N ? N.paste() : await navigator.clipboard.readText(); } catch (_) {} return t || ''; }
$('#btnPaste').onclick = async () => { const t = await pasteClip(); if (!t) return toast(tr('paste_empty')); const u = E.clean(t); if (!/^https?:/.test(u)) return toast(tr('paste_none')); $('#url').value = u; if (get('nx_autogo', true)) analyze(); };

/* ================= Riwayat ================= */
const hist = () => get('nx_hist', []);
const saved = () => get('nx_saved', []);
function saveCurrent() {
  if (!cur) return;
  const s = saved().filter(x => x.u !== cur.url);
  s.unshift({u:cur.url,p:cur.platform,pn:cur.pname,t:cur.title,th:cur.thumb,ts:Date.now()});
  set('nx_saved', s.slice(0,300)); renderSaved(); toast('Tautan disimpan ke koleksi');
}
function renderSaved() {
  const s=saved(); $('#savedCount').textContent=s.length+' ITEM';
  $('#savedList').innerHTML=s.length?s.map(x=>`<div class="hrow" data-u="${esc(x.u)}">${x.th?`<img src="${esc(x.th)}" referrerpolicy="no-referrer" onerror="this.style.visibility='hidden'">`:'<div class="ph"></div>'}<div class="il"><b>${esc(x.t||x.u)}</b><small>${esc(x.pn||'Tautan tersimpan')}</small></div><div class="saved-actions"><button data-a="open" title="Analisis">↗</button><button data-a="copy" title="Salin">⧉</button><button data-a="remove" title="Hapus">✕</button></div></div>`).join(''):'<div class="empty">Belum ada tautan tersimpan.</div>';
}
$('#savedList').onclick=e=>{
 const row=e.target.closest('.hrow'), b=e.target.closest('button'); if(!row||!b)return;
 const u=row.dataset.u;
 if(b.dataset.a==='remove'){set('nx_saved',saved().filter(x=>x.u!==u));renderSaved();}
 else if(b.dataset.a==='copy')copy(u);
 else {$('#url').value=u;go('home');analyze();}
};

function addHist(r) {
  const h = hist().filter(x => x.u !== r.url); h.unshift({ u: r.url, p: r.platform, pn: r.pname, t: r.title, th: r.thumb, ts: Date.now(), n: r.items.length }); set('nx_hist', h.slice(0, 200));
}
function renderHist() {
  const q = $('#histQ').value.trim().toLowerCase(), h = hist().filter(x => !q || (x.t + ' ' + x.pn + ' ' + x.u).toLowerCase().includes(q));
  $('#histList').innerHTML = h.length ? h.map(x => `<div class="hrow" data-u="${esc(x.u)}">${x.th ? `<img src="${esc(x.th)}" referrerpolicy="no-referrer" onerror="this.style.visibility='hidden'">` : '<div class="ph"></div>'}<div class="il"><b>${esc(x.t)}</b><small>${esc(x.pn)} · ${esc(new Date(x.ts).toLocaleDateString(lang))}</small></div><div class="acts"><button data-a="re" title="${esc(tr('again'))}">↻</button><button data-a="rm" title="${esc(tr('del'))}">✕</button></div></div>`).join('') : `<div class="empty">${esc(tr('hist_empty'))}</div>`;
}
$('#histQ').oninput = renderHist;
$('#histList').onclick = e => {
  const row = e.target.closest('.hrow'), b = e.target.closest('button'); if (!row) return; const u = row.dataset.u;
  if (b && b.dataset.a === 'rm') { set('nx_hist', hist().filter(x => x.u !== u)); renderHist(); }
  else { $('#url').value = u; go('home'); analyze(); }
};
$('#histClear').onclick = () => { set('nx_hist', []); renderHist(); toast(tr('cleared')); };

/* ================= Analisis massal ================= */
$('#batchClear').onclick=()=>{$('#batchLinks').value='';$('#batchResults').innerHTML='';$('#batchStatus').textContent='';};
$('#batchGo').onclick=async()=>{
 const urls=[...new Set($('#batchLinks').value.split(/\s+/).map(x=>E.clean(x.trim())).filter(x=>/^https?:/.test(x)&&E.detect(x)))];
 if(!urls.length){$('#batchStatus').textContent='Tidak ditemukan tautan yang didukung.';return;}
 const btn=$('#batchGo');btn.disabled=true;$('#batchResults').innerHTML='';let ok=0,fail=0;
 for(let i=0;i<urls.length;i++){
  const box=document.createElement('div');box.className='item';box.innerHTML=`<div class="irow"><div class="ik">↻</div><div class="il"><b>${esc(urls[i])}</b><small>Menunggu…</small></div></div>`;$('#batchResults').appendChild(box);
  const small=box.querySelector('small');
  $('#batchStatus').textContent=`Memproses ${i+1}/${urls.length}…`;
  try{const r=await E.run(urls[i]);addHist(r);ok++;small.textContent=`Berhasil · ${r.pname} · ${r.items.length} opsi`;small.className='st ok';box.querySelector('.ik').textContent='✓';box.onclick=()=>{$('#url').value=r.url;cur=r;renderResult(r);go('home');};}
  catch(err){fail++;small.textContent='Gagal · '+(err.message||err);small.className='st bad';box.querySelector('.ik').textContent='!';}
  await sleep(250);
 }
 $('#batchStatus').textContent=`Selesai: ${ok} berhasil, ${fail} gagal dari ${urls.length} tautan.`;btn.disabled=false;
};
/* ================= Pemutar ================= */
const av = $('#av'); let Q = [], qi = -1, shuf = false, rep = 0, sleepT = null;
const fmt = s => { s = Math.floor(s || 0); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
function addQ(x) { Q.push(x); persistQueue(); renderQ(); if (qi < 0) play(0); }
function persistQueue(){set('nx_queue',Q.map(x=>x.mid?{mid:x.mid,n:x.n,v:x.v}:String(x.u||'').startsWith('blob:')?null:x).filter(Boolean));}
function renderQ() { $('#queue').innerHTML = Q.length ? Q.map((x, i) => `<div class="hrow qi${i === qi ? ' cur' : ''}" data-i="${i}"><div class="ik">${x.v ? '▶' : '♪'}</div><div class="il"><b>${esc(x.n)}</b></div><div class="acts"><button data-a="rm">✕</button></div></div>`).join('') : `<div class="empty">${esc(tr('q_empty'))}</div>`; }
function play(i) { if (!Q[i]) return; const m=Q[i].mid&&libraryItems.find(z=>z.id===Q[i].mid); if(m) Q[i].u=m.url; qi = i; av.src = Q[i].u; av.classList.toggle('v', !!Q[i].v); av.playbackRate = +$('#spd').value; av.play().catch(() => {}); $('#npT').textContent = Q[i].n; $('#npS').textContent = (i + 1) + ' / ' + Q.length; renderQ(); syncMediaSession(); }
function next(dir = 1) { if (!Q.length) return; let i; if (shuf && Q.length > 1) { do i = Math.floor(Math.random() * Q.length); while (i === qi); } else { i = qi + dir; if (i >= Q.length) { if (rep === 0) return; i = 0; } if (i < 0) i = Q.length - 1; } play(i); }
$('#fileIn').onchange = e => { [...e.target.files].forEach(f => Q.push({ n: f.name.replace(/\.[^.]+$/, ''), u: URL.createObjectURL(f), v: f.type.startsWith('video') })); e.target.value = ''; renderQ(); if (qi < 0 && Q.length) play(0); };
$('#queue').onclick = e => { const r = e.target.closest('.qi'); if (!r) return; const i = +r.dataset.i; if (e.target.closest('button')) { Q.splice(i, 1); persistQueue(); if (i < qi) qi--; else if (i === qi) { av.pause(); av.removeAttribute('src'); qi = -1; $('#npT').textContent = '—'; } renderQ(); } else play(i); };
$('#qClr').onclick = () => { Q = []; persistQueue(); qi = -1; av.pause(); av.removeAttribute('src'); $('#npT').textContent = '—'; $('#npS').textContent = ''; renderQ(); };
$('#bPlay').onclick = () => { if (qi < 0 && Q.length) return play(0); av.paused ? av.play().catch(() => {}) : av.pause(); };
$('#bNext').onclick = () => next(1); $('#bPrev').onclick = () => { if (av.currentTime > 4) av.currentTime = 0; else next(-1); };
$('#bShuf').onclick = e => { shuf = !shuf; e.currentTarget.classList.toggle('on', shuf); };
$('#bRep').onclick = e => { rep = (rep + 1) % 3; e.currentTarget.classList.toggle('on', rep > 0); e.currentTarget.textContent = rep === 2 ? '↺' : '↻'; };
av.onplay = () => { $('#bPlay').textContent = '⏸'; syncMediaSession(); }; av.onpause = () => { $('#bPlay').textContent = '▶'; syncMediaSession(); };
av.onended = () => { if (rep === 2) { av.currentTime = 0; av.play(); } else next(1); };
/* Media Session: kontrol notifikasi/layar kunci bila didukung WebView. */
function syncMediaSession(){if(!('mediaSession' in navigator))return;const x=Q[qi];try{navigator.mediaSession.metadata=x?new MediaMetadata({title:x.n,artist:'Nexora',album:'Player'}):null;navigator.mediaSession.playbackState=av.paused?'paused':'playing';if(av.duration&&isFinite(av.duration))navigator.mediaSession.setPositionState({duration:av.duration,playbackRate:av.playbackRate,position:Math.min(av.currentTime,av.duration)});}catch(_){}}
if('mediaSession' in navigator){[['play',()=>av.play()],['pause',()=>av.pause()],['previoustrack',()=>next(-1)],['nexttrack',()=>next(1)],['seekbackward',d=>av.currentTime=Math.max(0,av.currentTime-(d.seekOffset||10))],['seekforward',d=>av.currentTime=Math.min(av.duration||1e9,av.currentTime+(d.seekOffset||10))],['seekto',d=>{if(Number.isFinite(d.seekTime))av.currentTime=d.seekTime;}]].forEach(([a,h])=>{try{navigator.mediaSession.setActionHandler(a,h);}catch(_){}});}

av.ontimeupdate = () => { $('#tC').textContent = fmt(av.currentTime); $('#tD').textContent = fmt(av.duration); if (av.duration) $('#seek').value = av.currentTime / av.duration * 1000; };
$('#seek').oninput = e => { if (av.duration) av.currentTime = e.target.value / 1000 * av.duration; };
$('#spd').onchange = e => { av.playbackRate = +e.target.value; };
$('#slp').onchange = e => { clearTimeout(sleepT); const m = +e.target.value; if (m) { sleepT = setTimeout(() => { av.pause(); $('#slp').value = '0'; }, m * 6e4); toast('Timer ' + m + ' m'); } };

/* ================= Setelan ================= */
function initSettings() {
  $('#segLang').onclick = e => { const v = e.target.dataset.v; if (v) { lang = v; set('nx_lang', v); applyLang(); chips(); otaUI(); renderQ(); } };
  const bind = (id, key, def) => { const el = $(id); el.checked = get(key, def); el.onchange = () => set(key, el.checked); };
  bind('#autoPaste', 'nx_autopaste', false); bind('#autoGo', 'nx_autogo', true); bind('#otaAuto', 'nx_ota_auto', true);
  const to = +LS.getItem('nx_timeout') || 30; $('#to').value = to; $('#toV').textContent = to + 's';
  $('#to').oninput = e => { LS.setItem('nx_timeout', e.target.value); $('#toV').textContent = e.target.value + 's'; };
  $('#folder').value = get('nx_folder', 'Nimiyo'); $('#folder').onchange = e => set('nx_folder', e.target.value.trim() || 'Nimiyo');
  $('#openDl').onclick = () => N ? N.downloads() : toast('Hanya di aplikasi Android');
  $('#clrHist').onclick = () => { set('nx_hist', []); toast(tr('cleared')); };
  $('#exportData').onclick=()=>{
    const data={format:'nexora-backup',version:1,createdAt:new Date().toISOString(),data:{}};
    Object.keys(LS).filter(k=>k.startsWith('nx_')).forEach(k=>{try{data.data[k]=JSON.parse(LS.getItem(k));}catch(_){}});
    const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'}),u=URL.createObjectURL(blob),a=document.createElement('a');
    a.href=u;a.download='nexora-backup-'+new Date().toISOString().slice(0,10)+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(u),1000);toast('Cadangan berhasil dibuat');
  };
  $('#importData').onclick=()=>$('#importFile').click();
  $('#importFile').onchange=async e=>{
    const f=e.target.files&&e.target.files[0];if(!f)return;
    try{const data=JSON.parse(await f.text());if(data.format!=='nexora-backup'||!data.data||typeof data.data!=='object')throw new Error('Format cadangan tidak dikenal');
      Object.keys(data.data).filter(k=>k.startsWith('nx_')).forEach(k=>set(k,data.data[k]));
      toast('Cadangan diimpor. Memuat ulang…');setTimeout(()=>location.reload(),700);
    }catch(err){toast('Impor gagal: '+(err.message||err));}e.target.value='';
  };

  $('#clrAll').onclick = () => { if (confirm(tr('ota_confirm'))) { Object.keys(LS).filter(k => k.startsWith('nx_') && !k.startsWith('nx_ota')).forEach(k => LS.removeItem(k)); location.reload(); } };
  $('#appVer').textContent = APPV;
  $('#verPill').onclick = () => { go('set'); setTimeout(() => $('#otaBox').scrollIntoView({ behavior: 'smooth' }), 60); };
}

/* ================= OTA scraper ================= */
const SHA_K = [], SHA_H = [];
(() => { for (let p = 2, c = 0; c < 64; p++) { let pr = 1; for (let d = 2; d * d <= p; d++) if (p % d === 0) { pr = 0; break; } if (pr) { SHA_K[c] = Math.floor((Math.cbrt(p) % 1) * 4294967296); if (c < 8) SHA_H[c] = Math.floor((Math.sqrt(p) % 1) * 4294967296); c++; } } })();
function sha256(str) {
  const b = new TextEncoder().encode(str), l = b.length, n = ((l + 9 + 63) >> 6) << 6, d = new Uint8Array(n); d.set(b); d[l] = 128;
  const dv = new DataView(d.buffer); dv.setUint32(n - 4, (l * 8) >>> 0); dv.setUint32(n - 8, Math.floor(l * 8 / 4294967296));
  const h = SHA_H.slice(), w = new Uint32Array(64), R = (x, k) => (x >>> k) | (x << (32 - k));
  for (let o = 0; o < n; o += 64) {
    for (let i = 0; i < 16; i++) w[i] = dv.getUint32(o + i * 4);
    for (let i = 16; i < 64; i++) { const a = w[i - 15], c = w[i - 2]; w[i] = (w[i - 16] + (R(a, 7) ^ R(a, 18) ^ (a >>> 3)) + w[i - 7] + (R(c, 17) ^ R(c, 19) ^ (c >>> 10))) >>> 0; }
    let [a, b2, c2, d2, e, f, g, hh] = h;
    for (let i = 0; i < 64; i++) {
      const t1 = (hh + (R(e, 6) ^ R(e, 11) ^ R(e, 25)) + ((e & f) ^ (~e & g)) + SHA_K[i] + w[i]) >>> 0, t2 = ((R(a, 2) ^ R(a, 13) ^ R(a, 22)) + ((a & b2) ^ (a & c2) ^ (b2 & c2))) >>> 0;
      hh = g; g = f; f = e; e = (d2 + t1) >>> 0; d2 = c2; c2 = b2; b2 = a; a = (t1 + t2) >>> 0;
    }
    [a, b2, c2, d2, e, f, g, hh].forEach((x, i) => h[i] = (h[i] + x) >>> 0);
  }
  return h.map(x => x.toString(16).padStart(8, '0')).join('');
}
const cmpV = (a, b) => { const x = String(a).split('.').map(Number), y = String(b).split('.').map(Number); for (let i = 0; i < 3; i++) { const d = (x[i] || 0) - (y[i] || 0); if (d) return d; } return 0; };
function loadBundle(text) {
  const prev = window.E;
  try {
    new Function(text)();
    const e = window.E;
    if (!e || ['run', 'resolve', 'detect', 'clean', 'http'].some(k => typeof e[k] !== 'function') || !Array.isArray(e.PL) || typeof e.v !== 'number') throw new Error('Struktur bundle tidak valid');
    if (e.detect('https://youtu.be/dQw4w9WgXcQ') !== 'youtube') throw new Error('Uji dasar bundle gagal');
    return e;
  } catch (err) { window.E = prev; throw err; }
}
const otaMeta = () => get('nx_ota_meta', null);
function otaDrop() { LS.removeItem('nx_ota_js'); LS.removeItem('nx_ota_meta'); }
function otaBoot() {
  const m = otaMeta(), txt = LS.getItem('nx_ota_js');
  if (!m || !txt) return;
  try {
    if (!(m.v > BUILTIN.v)) return otaDrop();
    if (sha256(txt) !== m.h) throw new Error('hash cache berubah');
    loadBundle(txt);
  } catch (e) { otaDrop(); window.E = BUILTIN; }
}
function otaUI() {
  const m = otaMeta(), last = get('nx_ota_last', 0);
  $('#otaCur').textContent = 'v' + E.v + ' (' + (m && E.v === m.v ? 'OTA' : tr('ota_builtin')) + ')';
  $('#otaLast').textContent = last ? new Date(last).toLocaleString(lang) : tr('ota_never');
  $('#otaLog').textContent = (m && m.log) || '—';
  $('#verTxt').textContent = 'scraper v' + E.v; $('#otaUrl').value = get('nx_ota_url', '');
}
const otaSt = (m, c) => { const s = $('#otaSt'); s.textContent = m; s.className = 'status' + (c ? ' ' + c : ''); };
async function otaCheck(manual) {
  const base = String(get('nx_ota_url', '') || '').trim().replace(/\/+$/, '');
  if (!base) { if (manual) otaSt(tr('ota_none'), 'err'); return false; }
  if (!/^https:\/\//i.test(base)) { if (manual) otaSt(tr('ota_https'), 'err'); return false; }
  if (manual) otaSt(tr('ota_check'));
  try {
    const bust = '?_=' + Date.now(), H = { 'Cache-Control': 'no-cache' };
    const mr = await BUILTIN.http({ url: base + '/scrapers-version.json' + bust, headers: H });
    if (mr.status !== 200) throw new Error('HTTP ' + mr.status + ' (scrapers-version.json)');
    const meta = JSON.parse(mr.text); set('nx_ota_last', Date.now());
    if (!(meta.scraperVersion > E.v)) { if (manual) otaSt(tr('ota_latest', { v: E.v }), 'ok'); otaUI(); return false; }
    if (meta.minAppVersion && cmpV(APPV, meta.minAppVersion) < 0) throw new Error('Butuh aplikasi ≥ ' + meta.minAppVersion);
    if (!/^[a-f0-9]{64}$/i.test(meta.sourceHash || '')) throw new Error('sourceHash tidak ada — update ditolak');
    const br = await BUILTIN.http({ url: base + '/bundle.js' + bust, headers: H });
    if (br.status !== 200 || br.text.length < 2000) throw new Error('bundle.js tidak valid (HTTP ' + br.status + ')');
    if (sha256(br.text) !== meta.sourceHash.toLowerCase()) throw new Error('SHA-256 tidak cocok — update ditolak');
    const prev = window.E; loadBundle(br.text);
    if (window.E.v !== meta.scraperVersion) { window.E = prev; throw new Error('Versi di bundle ≠ versi di metadata'); }
    LS.setItem('nx_ota_js', br.text); set('nx_ota_meta', { v: meta.scraperVersion, h: meta.sourceHash.toLowerCase(), log: meta.changelog || '', ts: Date.now() });
    chips(); otaUI(); otaSt(tr('ota_ok', { v: E.v }), 'ok'); toast(tr('ota_ok', { v: E.v })); return true;
  } catch (e) { if (manual) otaSt(e.message || String(e), 'err'); return false; }
}
function initOta() {
  $('#otaUrl').onchange = e => set('nx_ota_url', e.target.value.trim());
  $('#otaCheck').onclick = async () => { set('nx_ota_url', $('#otaUrl').value.trim()); $('#otaCheck').disabled = true; await otaCheck(true); $('#otaCheck').disabled = false; };
  $('#otaReset').onclick = () => { otaDrop(); window.E = BUILTIN; chips(); otaUI(); otaSt(tr('ota_reset_ok'), 'ok'); };
}

/* ================= Media Library & Tools ================= */
let libraryItems = [], mediaFilter = 'all', db = null;
const dlLogs = () => get('nx_dl_logs', []);
function openDB(){return new Promise((resolve,reject)=>{if(!('indexedDB' in window))return resolve(null);const q=indexedDB.open('nx_media',1);q.onupgradeneeded=()=>q.result.createObjectStore('files',{keyPath:'id'});q.onsuccess=()=>resolve(q.result);q.onerror=()=>resolve(null);});}
function dbPut(x){return new Promise((resolve)=>{if(!db)return resolve(false);const t=db.transaction('files','readwrite');t.objectStore('files').put(x);t.oncomplete=()=>resolve(true);t.onerror=()=>resolve(false);});}
function dbAll(){return new Promise(resolve=>{if(!db)return resolve([]);const q=db.transaction('files').objectStore('files').getAll();q.onsuccess=()=>resolve(q.result||[]);q.onerror=()=>resolve([]);});}
function dbDel(id){return new Promise(resolve=>{if(!db)return resolve();const t=db.transaction('files','readwrite');t.objectStore('files').delete(id);t.oncomplete=resolve;t.onerror=resolve;});}
function logDownload(x){const a=dlLogs().filter(v=>v.id!==x.id);a.unshift(x);set('nx_dl_logs',a.slice(0,100));renderDownloadLog();refreshStats();}
function renderDownloadLog(){const a=dlLogs();$('#downloadLog').innerHTML=a.length?a.map(x=>`<div class="media-row"><div class="ik">⬇</div><div class="il"><b>${esc(x.name)}</b><small>${esc(x.status)} · ${esc(new Date(x.ts).toLocaleString())}</small></div><button data-copy="${esc(x.url)}">⧉</button></div>`).join(''):'<div class="empty">Kosong</div>';}
$('#downloadLog').onclick=e=>{const b=e.target.closest('[data-copy]');if(b)copy(b.dataset.copy);};
$('#clearDlLog').onclick=()=>{set('nx_dl_logs',[]);renderDownloadLog();refreshStats();};
let mediaSort='name';
function renderLibrary(){const q=($('#libraryQ').value||'').toLowerCase();const a=libraryItems.filter(x=>(mediaFilter==='all'||x.kind===mediaFilter)&&x.name.toLowerCase().includes(q)).sort((x,y)=>mediaSort==='size'?y.size-x.size:mediaSort==='new'?y.ts-x.ts:x.name.localeCompare(y.name));$('#mediaCount').textContent=libraryItems.length+' MEDIA';$('#libraryList').innerHTML=a.length?a.map(x=>`<div class="media-row" data-id="${x.id}"><div class="ik">${x.kind==='audio'?'♪':x.kind==='video'?'▶':'▣'}</div><div class="il"><b>${esc(x.name)}</b><small>${esc(x.type||x.kind)} · ${Math.max(1,Math.round(x.size/1024))} KB${x.duration?' · '+fmt(x.duration):''}</small></div>${x.kind!=='image'?'<button data-play>▶</button>':'<button data-view>◉</button>'}<button data-edit>✎</button><button data-remove>✕</button></div>`).join(''):'<div class="empty">Kosong</div>';}
$('#libraryIn').onchange=async e=>{const files=[...e.target.files];for(const f of files){const kind=f.type.startsWith('audio/')?'audio':f.type.startsWith('video/')?'video':f.type.startsWith('image/')?'image':'file';if(!['audio','video','image'].includes(kind))continue;const id='m'+Date.now()+Math.random().toString(16).slice(2);const item={id,name:f.name,type:f.type,size:f.size,kind,blob:f,ts:Date.now()};if(await dbPut(item)){const media=Object.assign({},item,{url:URL.createObjectURL(f),duration:0});if(kind!=='image'){const probe=document.createElement(kind==='audio'?'audio':'video');probe.preload='metadata';probe.src=media.url;await new Promise(r=>{probe.onloadedmetadata=()=>{media.duration=Number.isFinite(probe.duration)?probe.duration:0;r();};probe.onerror=r;setTimeout(r,1800);});}await dbPut(Object.assign({},item,{duration:media.duration}));libraryItems.push(media);}else toast('Penyimpanan gagal');}e.target.value='';renderLibrary();refreshStats();};
$('#libraryQ').oninput=renderLibrary;$('#mediaFilter').onclick=e=>{const b=e.target.closest('button[data-v]');if(!b)return;mediaFilter=b.dataset.v;$('#mediaFilter').querySelectorAll('button').forEach(x=>x.classList.toggle('on',x===b));renderLibrary();};
$('#libraryList').onclick=async e=>{const row=e.target.closest('.media-row');if(!row)return;const x=libraryItems.find(v=>v.id===row.dataset.id);if(!x)return;if(e.target.closest('[data-remove]')){URL.revokeObjectURL(x.url);await dbDel(x.id);libraryItems=libraryItems.filter(v=>v!==x);renderLibrary();refreshStats();return;}if(e.target.closest('[data-edit]')){const n=prompt('Nama',x.name);if(n&&n.trim()){x.name=n.trim().slice(0,120);await dbPut(x);renderLibrary();}return;}if(e.target.closest('[data-view]')){openModal(`<img src="${esc(x.url)}"><p>${esc(x.name)}</p>`);return;}if(e.target.closest('[data-play]')){addQ({mid:x.id,n:x.name,u:x.url,v:x.kind==='video'});go('play');}};
function refreshStats(){$('#statHist').textContent=hist().length;$('#statSaved').textContent=saved().length;$('#statDl').textContent=dlLogs().length;}
let scheduledTimer=null;
function runSchedule(){const j=get('nx_schedule',null);if(!j)return;const left=j.at-Date.now();if(left<=0){set('nx_schedule',null);$('#batchLinks').value=j.links;$('#batchGo').click();$('#scheduleInfo').textContent='Mulai';return;}clearTimeout(scheduledTimer);scheduledTimer=setTimeout(runSchedule,Math.min(left,60000));$('#scheduleInfo').textContent='Jadwal aktif';}
$('#scheduleBatch').onclick=()=>{const at=new Date($('#scheduleAt').value).getTime(),links=$('#batchLinks').value.trim();if(!Number.isFinite(at)||at<=Date.now()||!links)return $('#scheduleInfo').textContent='Periksa waktu & link';if(at-Date.now()>7*864e5)return $('#scheduleInfo').textContent='Maks. 7 hari';set('nx_schedule',{at,links});runSchedule();toast('Jadwal disimpan');};
const mini=document.createElement('div');mini.className='floating-player';mini.innerHTML='<b id="miniTitle">Player</b><button id="miniPlay">▶</button><button id="miniOpen">▣</button>';document.body.appendChild(mini);
function syncMini(){mini.classList.toggle('show',!!av.src);$('#miniTitle').textContent=$('#npT').textContent||'Player';$('#miniPlay').textContent=av.paused?'▶':'⏸';}
$('#miniPlay').onclick=()=>{if(av.paused)av.play().catch(()=>{});else av.pause();};$('#miniOpen').onclick=()=>go('play');av.addEventListener('play',syncMini);av.addEventListener('pause',syncMini);av.addEventListener('loadedmetadata',()=>{syncMini();syncMediaSession();});av.addEventListener('timeupdate',()=>{if('mediaSession' in navigator&&av.duration&&isFinite(av.duration)){try{navigator.mediaSession.setPositionState({duration:av.duration,playbackRate:av.playbackRate,position:Math.min(av.currentTime,av.duration)});}catch(_){}}});av.addEventListener('emptied',()=>{syncMini();syncMediaSession();});
const oldGo=go;go=function(p){oldGo(p);if(p==='media'){renderLibrary();renderDownloadLog();refreshStats();renderPlaylists();}};
/* ================= NEXORA 2.0: playlist, smart library, PiP ================= */
const playlists=()=>get('nx_playlists',[]);
function renderPlaylists(){const a=playlists();const box=$('#playlistList');if(!box)return;box.innerHTML=a.length?a.map(p=>`<div class="media-row" data-pid="${esc(p.id)}"><div class="ik">♫</div><div class="il"><b>${esc(p.name)}</b><small>${p.ids.length} media</small></div><button data-open>▶</button><button data-rename>✎</button><button data-drop>✕</button></div>`).join(''):'<div class="empty">Belum ada playlist</div>';}
function makePlaylist(){const name=prompt('Nama playlist');if(!name||!name.trim())return;const a=playlists();a.unshift({id:'p'+Date.now(),name:name.trim().slice(0,60),ids:[]});set('nx_playlists',a);renderPlaylists();}
$('#newPlaylist').onclick=makePlaylist;
$('#savePlaylist').onclick=()=>{if(!Q.length)return toast('Antrean kosong');const name=prompt('Nama playlist');if(!name||!name.trim())return;const ids=Q.map(q=>q.mid).filter(Boolean);if(!ids.length)return toast('Playlist hanya menyimpan media pustaka');const a=playlists();a.unshift({id:'p'+Date.now(),name:name.trim().slice(0,60),ids});set('nx_playlists',a);renderPlaylists();toast('Playlist disimpan');};
$('#playlistList').onclick=e=>{const row=e.target.closest('[data-pid]');if(!row)return;const a=playlists(),p=a.find(x=>x.id===row.dataset.pid);if(!p)return;if(e.target.closest('[data-drop]')){set('nx_playlists',a.filter(x=>x!==p));renderPlaylists();return;}if(e.target.closest('[data-rename]')){const n=prompt('Nama',p.name);if(n&&n.trim()){p.name=n.trim().slice(0,60);set('nx_playlists',a);renderPlaylists();}return;}if(e.target.closest('[data-open]')){const items=p.ids.map(id=>libraryItems.find(x=>x.id===id)).filter(Boolean);if(!items.length)return toast('Media tidak tersedia');Q=items.map(x=>({mid:x.id,n:x.name,u:x.url,v:x.kind==='video'}));qi=-1;persistQueue();renderQ();play(0);go('play');}};
$('#sortMedia').onclick=()=>{mediaSort=mediaSort==='name'?'new':mediaSort==='new'?'size':'name';$('#sortMedia').textContent=mediaSort==='name'?'Nama ↑':mediaSort==='new'?'Terbaru':'Ukuran ↓';renderLibrary();};
$('#scanMedia').onclick=()=>$('#libraryIn').click();
$('#exportLibrary').onclick=()=>{const rows=['#EXTM3U',...libraryItems.map(x=>`#EXTINF:${Math.floor(x.duration||-1)},${x.name}\n${x.name}`)];const b=new Blob([rows.join('\n')],{type:'audio/x-mpegurl'}),u=URL.createObjectURL(b),a=document.createElement('a');a.href=u;a.download='nexora-library.m3u';a.click();setTimeout(()=>URL.revokeObjectURL(u),1000);};
$('#exportQueue').onclick=()=>{const rows=['#EXTM3U',...Q.map(x=>`#EXTINF:-1,${x.n}\n${x.u}`)];const b=new Blob([rows.join('\n')],{type:'audio/x-mpegurl'}),u=URL.createObjectURL(b),a=document.createElement('a');a.href=u;a.download='nexora-queue.m3u';a.click();setTimeout(()=>URL.revokeObjectURL(u),1000);};
$('#pipBtn').onclick=async()=>{try{if(document.pictureInPictureEnabled&&av.requestPictureInPicture)await av.requestPictureInPicture();else if(window.NX?.pip)NX.pip();else toast('PiP tidak didukung');}catch(_){toast('PiP tidak tersedia untuk media ini');}};
if(document.pictureInPictureEnabled)$('#pipBtn').hidden=false;else $('#pipBtn').hidden=true;

/* ================= Boot ================= */
window.__share = t => { go('home'); const u = E.clean(t); $('#url').value = u || t; if (u && get('nx_autogo', true)) analyze(); };
(async function boot() {
  otaBoot(); applyLang(); initTheme(); initSettings(); initOta(); chips(); otaUI(); Q=get('nx_queue',[]); renderQ(); db=await openDB(); libraryItems=(await dbAll()).map(x=>Object.assign({},x,{url:URL.createObjectURL(x.blob)})); Q=Q.map(x=>x.mid?Object.assign({},x,{u:(libraryItems.find(m=>m.id===x.mid)||{}).url}):x).filter(x=>x.u);renderQ();renderPlaylists();renderPlugins();activatePlugins();runSchedule();
  const s = new URLSearchParams(location.search).get('s');
  if (s) window.__share(decodeURIComponent(s));
  else if (get('nx_autopaste', false)) { const t = await pasteClip(), u = E.clean(t); if (/^https?:/.test(u) && E.detect(u)) { $('#url').value = u; if (get('nx_autogo', true)) analyze(); } }
  if (get('nx_ota_auto', true) && get('nx_ota_url', '') && Date.now() - get('nx_ota_last', 0) > 216e5) otaCheck(false).then(ok => ok && toast(tr('ota_ok', { v: E.v })));
})();

/* Native playback & MediaStore bridge: remote URL and content URI via Native Player. */
$('#bgPlayBtn')?.addEventListener('click',()=>{
 const x=Q[qi]; if(!x){toast('Pilih media');return;}
 if(!/^https?:\/\//i.test(x.u||'')){toast('BG perlu URL online');return;}
 if(!window.NX||!NX.nativePlay){toast('Bridge native belum tersedia');return;}
 const r=NX.nativePlay(x.u,x.n||'Nexora'); toast(r==='ok'?'BG aktif':'BG gagal');
});
$('#scanDevice')?.addEventListener('click',async()=>{
 if(!window.NX||!NX.scanMedia){toast('Scan native belum tersedia');return;}
 try{
  const rows=JSON.parse(NX.scanMedia()||'[]');
  const box=$('#libraryList');
  if(!rows.length){toast('Izin media diperlukan / kosong');return;}
  box.innerHTML=rows.map(x=>`<div class="media-row"><div class="ik">${String(x.mime||'').startsWith('video')?'▶':String(x.mime||'').startsWith('image')?'▣':'♪'}</div><div class="il"><b>${esc(x.name||'Media')}</b><small>${Math.max(1,Math.round((x.size||0)/1024))} KB</small></div><button data-native-uri="${esc(x.uri)}" data-native-name="${esc(x.name||'Media')}">▶</button><button data-meta-uri="${esc(x.uri)}">i</button></div>`).join('');
  toast(rows.length+' media');
 }catch(e){toast('Scan gagal');}
});
$('#libraryList')?.addEventListener('click',e=>{
 const b=e.target.closest('[data-native-uri]');if(!b)return;
 const u=b.getAttribute('data-native-uri'),n=b.getAttribute('data-native-name');
 if(window.NX)NX.nativePlay(u,n);
});

$('#floatBtn')?.addEventListener('click',()=>{if(!window.NX)return;const r=NX.startOverlay();if(r==='permission'){NX.overlaySettings();toast('Izinkan tampil di atas aplikasi');}else toast(r==='ok'?'Float aktif':'Float gagal');});


/* User-installed scraper plugins. Imported scripts are trusted code; install only files you trust. */
const pluginKey='nx_user_plugins';
function getPlugins(){return get(pluginKey,[]);}
function installPlugin(code,name){try{const factory=new Function('window','NX','E',code+'\n;return window.NX_PLUGIN||null;');const plug=factory(window,window.NX,window.E);if(!plug||typeof plug.match!=='function'||typeof plug.run!=='function'||!plug.id)throw Error('API plugin tidak valid');const all=getPlugins().filter(x=>x.id!==plug.id);all.push({id:String(plug.id).slice(0,40),name:String(plug.name||name).slice(0,60),code});set(pluginKey,all);return true;}catch(e){toast('Plugin gagal: '+(e.message||'format'));return false;}}
function renderPlugins(){const box=$('#pluginList');if(!box)return;const a=getPlugins();box.innerHTML=a.length?a.map(x=>`<div class="media-row"><div class="ik">⌘</div><div class="il"><b>${esc(x.name)}</b><small>${esc(x.id)}</small></div><button data-pdel="${esc(x.id)}">✕</button></div>`).join(''):'<div class="empty">Belum ada plugin</div>';}
function activatePlugins(){window.__NX_PLUGINS=[];for(const p of getPlugins()){try{const plug=new Function('window','NX','E',p.code+'\n;return window.NX_PLUGIN||null;')(window,window.NX,window.E);if(plug&&typeof plug.match==='function'&&typeof plug.run==='function')window.__NX_PLUGINS=(window.__NX_PLUGINS||[]).concat(plug);}catch(_){}}}
$('#pluginIn')?.addEventListener('change',async e=>{const f=e.target.files?.[0];if(!f)return;if(f.size>256*1024){toast('Maks. 256 KB');e.target.value='';return;}const code=await f.text();if(installPlugin(code,f.name)){renderPlugins();activatePlugins();toast('Plugin dipasang');}e.target.value='';});
$('#pluginList')?.addEventListener('click',e=>{const b=e.target.closest('[data-pdel]');if(!b)return;set(pluginKey,getPlugins().filter(x=>x.id!==b.dataset.pdel));window.__NX_PLUGINS=(window.__NX_PLUGINS||[]).filter(x=>x.id!==b.dataset.pdel);renderPlugins();});
const baseAnalyze=analyze;
analyze=async function(){const raw=$('#url').value.trim();for(const p of (window.__NX_PLUGINS||[])){try{if(p.match(raw)){if(busy)return;busy=true;$('#btnGo').disabled=true;$('#result').classList.add('hidden');status('Plugin · '+(p.name||p.id));const r=await p.run(raw,{NX:window.NX});if(!r||!Array.isArray(r.items)||!r.items.length)throw Error('Hasil kosong');cur=Object.assign({url:raw,title:p.name||'Media',pname:p.name||'Plugin',src:p.id,author:''},r);renderResult(cur);status(tr('found',{n:cur.items.length}),'ok');busy=false;$('#btnGo').disabled=false;return;} }catch(err){status(err.message||'Plugin gagal','err');busy=false;$('#btnGo').disabled=false;return;}}return baseAnalyze();};

/* NEXORA 3.0: lightweight native audio effects, visualizer, lyrics & metadata */
function applyFx(){if(window.NX?.audioFx)NX.audioFx(+$('#fxEq').value,+$('#fxBass').value,+$('#fx3d').value,+$('#fxPan').value/100);}
['fxEq','fxBass','fx3d','fxPan'].forEach(id=>$('#'+id)?.addEventListener('input',applyFx));
$('#fxReset')?.addEventListener('click',()=>{['fxEq','fxBass','fx3d'].forEach(id=>$('#'+id).value=id==='fxEq'?50:0);$('#fxPan').value=0;applyFx();});
let orbitTimer=null,orbitPhase=0;
$('#orbit8d')?.addEventListener('click',()=>{if(orbitTimer){clearInterval(orbitTimer);orbitTimer=null;$('#orbit8d').classList.remove('primary');$('#fxPan').value=0;applyFx();return;}$('#orbit8d').classList.add('primary');orbitTimer=setInterval(()=>{orbitPhase+=0.055;$('#fxPan').value=Math.round(Math.sin(orbitPhase)*85);applyFx();},80);});
$('#vizEnable')?.addEventListener('click',()=>{if(!window.NX?.enableVisualizer)return toast('Native FX tidak tersedia');const r=NX.enableVisualizer();toast(r==='ok'?'Visualizer aktif':r==='permission'?'Izin audio diperlukan untuk visualizer':'Visualizer gagal');});
const vc=$('#viz'),vctx=vc?.getContext('2d');let vizFrame=0;
function drawViz(){if(!vctx)return;if(page!=='play'){setTimeout(drawViz,250);return;}const w=vc.clientWidth||300,h=54,dpr=Math.min(2,window.devicePixelRatio||1);if(vc.width!==Math.round(w*dpr)){vc.width=Math.round(w*dpr);vc.height=Math.round(h*dpr);}vctx.clearRect(0,0,vc.width,vc.height);let a=[];try{a=JSON.parse(window.NX?.spectrum?.()||'[]')}catch(_){}const n=32,bw=vc.width/n;for(let i=0;i<n;i++){const val=a.length?(a[i]||0)/255:0.04;const bh=Math.max(3,val*vc.height);vctx.fillStyle='rgba(120,160,255,.85)';vctx.fillRect(i*bw+1,vc.height-bh,bw-2,bh);}vizFrame++;setTimeout(drawViz,100);}setTimeout(drawViz,100);
const lyricKey=()=>{const x=Q[qi];return 'nx_lyrics_'+(x?.mid||x?.u||'none');};
$('#saveLyrics')?.addEventListener('click',()=>{const x=Q[qi];if(!x)return toast('Pilih media');set(lyricKey(),$('#lyricsText').value);toast('Lirik disimpan');});
function loadLyrics(){const x=Q[qi];$('#lyricsText').value=x?get(lyricKey(),''):'';}
function syncLyrics(){const t=av.currentTime*1000,raw=$('#lyricsText').value.split(/\r?\n/);let line='—';for(const r of raw){const m=r.match(/^\[(\d{2}):(\d{2})(?:\.(\d{1,3}))?\](.*)$/);if(m){const ms=(+m[1]*60+ +m[2])*1000+ +(m[3]||'0').padEnd(3,'0');if(ms<=t)line=m[4];}}$('#lyricNow').textContent=line;}
av.addEventListener('timeupdate',syncLyrics);av.addEventListener('loadedmetadata',loadLyrics);$('#bNext')?.addEventListener('click',()=>setTimeout(loadLyrics,0));$('#bPrev')?.addEventListener('click',()=>setTimeout(loadLyrics,0));
$('#metaBtn')?.addEventListener('click',()=>{const x=Q[qi];if(!x)return toast('Pilih media');if(x.mid){const m=libraryItems.find(z=>z.id===x.mid);const meta=get('nx_meta_'+x.mid,{title:m?.name||x.n,artist:'',album:''});openModal(`<b>Metadata</b><input id="edTitle" class="search" value="${esc(meta.title)}" placeholder="Judul"><input id="edArtist" class="search" value="${esc(meta.artist)}" placeholder="Artis"><input id="edAlbum" class="search" value="${esc(meta.album)}" placeholder="Album"><button class="btn primary" id="saveMeta">Simpan</button><p>${esc(m?.type||'Media lokal')} · ${Math.round((m?.size||0)/1024)} KB</p>`);setTimeout(()=>$('#saveMeta')?.addEventListener('click',()=>{set('nx_meta_'+x.mid,{title:$('#edTitle').value,artist:$('#edArtist').value,album:$('#edAlbum').value});closeModal();toast('Metadata lokal disimpan');}),0);return;}if(window.NX?.metadata){try{const m=JSON.parse(NX.metadata(x.u)||'{}');openModal(`<b>${esc(m.title||x.n)}</b><p>${esc(m.artist||'—')} · ${esc(m.album||'—')}</p>${m.art?`<img style="width:100%;max-height:180px;object-fit:contain" src="${m.art}">`:''}<small>${esc(m.mime||'')}</small>`);}catch(_){toast('Metadata tidak tersedia');}}});
$('#libraryList')?.addEventListener('click',e=>{const b=e.target.closest('[data-meta-uri]');if(!b)return;try{const m=JSON.parse(NX.metadata(b.dataset.metaUri)||'{}');openModal(`<b>${esc(m.title||'Media')}</b><p>${esc(m.artist||'—')} · ${esc(m.album||'—')}</p>${m.art?`<img style="width:100%;max-height:180px;object-fit:contain" src="${m.art}">`:''}`);}catch(_){toast('Info tidak tersedia');}});
})();
