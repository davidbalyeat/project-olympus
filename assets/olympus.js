/* Project Olympus Workbench engine. Vanilla JS, no build step, runs from a local file.
   v.2026.9.23.2: dashboard navigation, paginated lessons, Summit theme, reward system with
   sound and celebration stages, trophy case, six ranks, Basecamp, hero names. */
(function(){
  const OLY = window.OLY;
  const KEY = 'olympus.v1';
  const RANKS = [['Mortal',0],['Hero',1500],['Demigod',3500],['Titan',6000],['Immortal',7500],['Olympian',9000]];
  let S = load();
  let teacherMode = false;
  /* Only the grown-ups get Teacher mode. Hudson never sees the button, and switching
     into a profile that cannot teach drops the mode on the way in. This is a speed bump,
     not a vault: every answer ships in the content files so the app can mark work offline. */
  function canTeach(n){ const who = n === undefined ? S.active : n;
    return ((OLY.config||{}).grownups||[]).indexOf(who) !== -1; }
  const PS = {}; // transient per-problem state: {hints, wrong, revealed, again}
  const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let LAST = {x: window.innerWidth/2, y: window.innerHeight/2};
  document.addEventListener('click', e=>{ if(e.clientX||e.clientY) LAST={x:e.clientX,y:e.clientY}; }, true);

  // ---------- cloud sync (optional; Google Apps Script backend, see cloud/Code.gs) ----------
  const SYNC = { url: (((OLY.config||{}).syncUrl)||'').trim() || (localStorage.getItem('olympus.sync')||'').trim(), status:'off', timer:null, cloud:null };
  async function api(params, body){
    const u = SYNC.url + (SYNC.url.includes('?')?'&':'?') + new URLSearchParams(params).toString();
    const opt = body ? { method:'POST', body:JSON.stringify(body), redirect:'follow' } : { redirect:'follow', cache:'no-store' };
    const r = await fetch(u, opt); if(!r.ok) throw new Error('http '+r.status); return r.json();
  }
  function setSync(status){ SYNC.status=status; const el=document.getElementById('sync-chip'); if(el){ el.textContent = ({off:'',synced:'☁ saved',saving:'☁ saving…',offline:'☁ offline',connecting:'☁ …'})[status]||''; el.className='chip sync '+status; el.title = ({synced:'Progress is saved to the cloud',saving:'Saving…',offline:'Cloud unreachable; progress is kept in this browser and will sync when it can. Click to retry.',connecting:'Connecting…'})[status]||''; } }
  function scheduleSync(){ if(!SYNC.url || !S.active) return; clearTimeout(SYNC.timer); SYNC.dirty=true; setSync('saving'); SYNC.timer=setTimeout(pushProfile, 1500); }
  async function pushProfile(){
    const p=P(); if(!p||!SYNC.url) return;
    clearTimeout(SYNC.timer); SYNC.dirty=false;
    try{
      const res = await api({action:'save'}, {action:'save', profile:p.name, data:p, rank:rankOf(p.xp)[0], sessionsDone: allSessions().filter(s=>sessionDone(p,s)).length});
      if(res.ok){ p.cloudUpdated=res.updated; setSync(SYNC.dirty?'saving':'synced'); }
      else { setSync('offline'); }
    }catch(e){ setSync('offline'); }
  }
  async function loginProfile(n){
    const finish = () => {
      if(!S.profiles[n]) S.profiles[n]=newProfile(n);
      S.active=n; if(!canTeach(n)) teacherMode=false;
      save(); closeModal();
      /* Always land on the map. Fixes the bug where switching profiles left the new
         person sitting on whatever problem the previous person had open. */
      if(location.hash && location.hash !== '#/') location.hash = '#/'; else route();
      if(!S.profiles[n].hero) setTimeout(heroModal, 350);
    };
    try{
      const inCloud = (SYNC.cloud||[]).some(c=>c.name===n);
      if(inCloud){
        const r = await api({action:'load', profile:n});
        if(r.ok){
          const local=S.profiles[n]; const cloudData=r.data||{}; cloudData.name=n;
          const keepLocal = local && (local.updated||0) > (r.updated||0) && (local.xp||0) >= (cloudData.xp||0);
          if(!keepLocal) S.profiles[n] = Object.assign(newProfile(n), cloudData);
        }
      }
      finish(); pushProfile();
    }catch(e){
      finish();
      toast('Working offline for now. Progress is kept in this browser and syncs when the connection comes back.');
    }
  }

  // ---------- storage ----------
  function load(){
    try{ const raw = localStorage.getItem(KEY); if(raw){ return migrate(JSON.parse(raw)); } }catch(e){}
    return { v:2, profiles:{}, active:null };
  }
  /* The profile once called "Dad" is now "David". Carry its progress across rather than
     stranding it, and drop the PINs, which nobody could remember anyway. */
  function migrate(st){
    st = st || {}; st.profiles = st.profiles || {};
    if(st.profiles.Dad && !st.profiles.David){ st.profiles.David = st.profiles.Dad; st.profiles.David.name = 'David'; delete st.profiles.Dad; if(st.active === 'Dad') st.active = 'David'; }
    delete st.dadPin; st.v = 2; return st;
  }
  function save(){ const p=P(); if(p) p.updated=Date.now(); try{ localStorage.setItem(KEY, JSON.stringify(S)); }catch(e){} scheduleSync(); }
  function P(){ return S.active ? S.profiles[S.active] : null; }
  function newProfile(name){ return { name, hero:'', xp:0, probs:{}, sessions:{}, badges:{}, codex:{}, beatdad:{}, created:Date.now() }; }

  // ---------- utils ----------
  const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const fmt = n => Number.isInteger(n) ? n.toLocaleString() : n.toLocaleString(undefined,{maximumFractionDigits:3});
  function toast(msg, gold){ const t = document.createElement('div'); t.className = 'toast' + (gold?' gold':''); t.innerHTML = msg; document.body.appendChild(t); setTimeout(()=>t.remove(), 3200); }
  function rankOf(xp){ let r = RANKS[0]; for(const k of RANKS){ if(xp >= k[1]) r = k; } return r; }
  function nextRank(xp){ for(const k of RANKS){ if(xp < k[1]) return k; } return null; }
  const pick = arr => arr[Math.floor(Math.random()*arr.length)];

  // ---------- audio: synthesised, no files; every cue pitch-jittered so it never goes stale ----------
  let actx = null;
  let soundOn = (localStorage.getItem('olympus.sound')||'on') !== 'off';
  function ac(){ if(!actx){ try{ actx = new (window.AudioContext||window.webkitAudioContext)(); }catch(e){ return null; } } if(actx.state==='suspended') actx.resume(); return actx; }
  function tone(freq, start, dur, vol, type){
    const c = ac(); if(!c) return;
    const o=c.createOscillator(), g=c.createGain(); o.type=type||'sine';
    o.frequency.setValueAtTime(freq, c.currentTime+start);
    g.gain.setValueAtTime(0.0001, c.currentTime+start);
    g.gain.exponentialRampToValueAtTime(vol, c.currentTime+start+0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime+start+dur);
    o.connect(g); g.connect(c.destination); o.start(c.currentTime+start); o.stop(c.currentTime+start+dur+0.02);
  }
  const jit = () => 1 + (Math.random()*0.03 - 0.015);
  const SFX = {
    correct(){ if(!soundOn) return; const j=jit(); tone(660*j,0,.16,.16,'triangle'); tone(880*j,.07,.24,.14,'triangle'); },
    xp(){ if(!soundOn) return; tone(990*jit(),0,.12,.08,'triangle'); },
    miss(){ if(!soundOn) return; tone(200,0,.13,.11,'sine'); tone(170,.11,.17,.09,'sine'); },
    hint(){ if(!soundOn) return; tone(520*jit(),0,.12,.08,'sine'); },
    page(){ if(!soundOn) return; tone(440*jit(),0,.07,.05,'sine'); },
    badge(){ if(!soundOn) return; const n=[523.25,659.25,783.99,1046.5]; n.forEach((f,i)=>{ tone(f,i*.11,.34,.15,'triangle'); tone(f/2,i*.11,.34,.07,'sine'); }); tone(1567.98,.46,.7,.10,'triangle'); },
    rank(){ if(!soundOn) return; const n=[523.25,659.25,783.99,1046.5,1318.51]; n.forEach((f,i)=>{ tone(f,i*.13,.42,.15,'triangle'); tone(f/2,i*.13,.42,.07,'sine'); }); },
    boom(){ if(!soundOn) return; tone(80+Math.random()*40,0,.22,.10,'sine'); tone(1200+Math.random()*700,.02,.5,.045,'triangle'); }
  };

  // ---------- effects ----------
  function floatXp(amount){
    if(reduced) return; const el=document.createElement('div'); el.className='xpfloat'; el.textContent='+'+amount+' XP';
    el.style.left=(LAST.x-30)+'px'; el.style.top=(LAST.y-24)+'px'; document.body.appendChild(el); setTimeout(()=>el.remove(),1300);
  }
  function sparkle(x,y,n){
    if(reduced) return; const colors=['#FFC833','#F07C1E','#2BB5A8','#1C7FD6','#7B2FF7']; n=n||18;
    for(let i=0;i<n;i++){ const s=document.createElement('div'); s.className='spark'; s.style.background=colors[i%colors.length]; s.style.left=x+'px'; s.style.top=y+'px'; document.body.appendChild(s);
      const ang=(Math.PI*2)*(i/n)+Math.random()*.4, dist=70+Math.random()*90;
      s.animate([{transform:'translate(0,0) scale(1)',opacity:1},{transform:`translate(${Math.cos(ang)*dist}px,${Math.sin(ang)*dist}px) scale(0)`,opacity:0}],{duration:750+Math.random()*350,easing:'cubic-bezier(.2,.7,.3,1)'});
      setTimeout(()=>s.remove(),1150); }
  }
  function firework(x,y,hue){
    if(reduced) return; const n=26;
    for(let i=0;i<n;i++){ const d=document.createElement('div'); d.className='fw'; d.style.background=`hsl(${hue+Math.random()*40-20},100%,${55+Math.random()*25}%)`; d.style.left=x+'px'; d.style.top=y+'px'; d.style.boxShadow='0 0 10px currentColor'; document.body.appendChild(d);
      const ang=(Math.PI*2)*(i/n)+Math.random()*.25, dist=110+Math.random()*140, dx=Math.cos(ang)*dist, dy=Math.sin(ang)*dist;
      d.animate([{transform:'translate(0,0) scale(1.3)',opacity:1},{transform:`translate(${dx*.75}px,${dy*.75-10}px) scale(.9)`,opacity:1,offset:.55},{transform:`translate(${dx}px,${dy+90}px) scale(.2)`,opacity:0}],{duration:1250+Math.random()*450,easing:'cubic-bezier(.15,.7,.3,1)'});
      setTimeout(()=>d.remove(),1750); }
  }
  function fireworkShow(){ const hues=[45,15,200,320,110,60,280]; hues.forEach((h,i)=>setTimeout(()=>{ firework(window.innerWidth*(.18+Math.random()*.64), window.innerHeight*(.18+Math.random()*.34), h); SFX.boom(); }, i*300)); }
  function rollXp(from, to){
    const el=document.getElementById('xp-num'); const chip=document.getElementById('xp-stat');
    if(chip && !reduced){ chip.classList.remove('punch'); void chip.offsetWidth; chip.classList.add('punch'); }
    if(!el) return; if(reduced){ el.textContent=fmt(to); return; }
    let t0=null; const dur=700, delta=to-from;
    (function step(ts){ if(t0===null) t0=ts; const p=Math.min((ts-t0)/dur,1), e=1-Math.pow(1-p,3); el.textContent=fmt(Math.round(from+delta*e)); if(p<1) requestAnimationFrame(step); else el.textContent=fmt(to); })(performance.now());
  }
  const TROPHY = `<svg viewBox="0 0 64 64" aria-hidden="true"><defs><linearGradient id="tg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFE9A8"/><stop offset=".5" stop-color="#FFC833"/><stop offset="1" stop-color="#E09000"/></linearGradient></defs><path d="M16 12h32v12a16 16 0 0 1-32 0z" fill="url(#tg)" stroke="#7A3D08" stroke-width="2.5" stroke-linejoin="round"/><path d="M16 15H9v5a9 9 0 0 0 9 9M48 15h7v5a9 9 0 0 1-9 9" fill="none" stroke="#7A3D08" stroke-width="2.5" stroke-linecap="round"/><path d="M28 40h8v7h-8z" fill="url(#tg)" stroke="#7A3D08" stroke-width="2.5" stroke-linejoin="round"/><rect x="20" y="47" width="24" height="6" rx="2" fill="#C97E00" stroke="#7A3D08" stroke-width="2.5"/></svg>`;
  /* The celebration takes over the screen and goes dark, so the bright things read as bright. */
  function celebrate(o){
    const old=document.getElementById('celebrate'); if(old) old.remove();
    const el=document.createElement('div'); el.className='celebrate'; el.id='celebrate';
    el.innerHTML = `<div class="inner"><div class="title">${o.title}</div><p class="sub">${o.sub||''}</p>
      <div class="medal">${o.medal||TROPHY}</div>
      ${o.rewards&&o.rewards.length?`<div class="rewards">${o.rewards.map(r=>`<div class="ribbon"><div class="top" style="background:${r.bg}">${r.icon}</div><div class="tag2">${r.label}</div></div>`).join('')}</div>`:''}
      <div class="tap">Tap to claim</div></div>`;
    document.body.appendChild(el);
    el.addEventListener('click', ()=>el.remove());
    setTimeout(()=>{ if(el.parentNode) el.remove(); }, 8000);
    if(o.fireworks) fireworkShow(); else setTimeout(()=>sparkle(window.innerWidth/2, window.innerHeight*.45, 24), 250);
  }

  // ---------- XP and badges ----------
  function addXP(n, why, opts){
    const p = P(); if(!p || !n) return; opts=opts||{};
    const before = rankOf(p.xp); const from=p.xp; p.xp += n; save();
    if(!opts.quiet) SFX.xp();
    floatXp(n);
    /* Rebuild the bar first, then animate the counter on the element that is actually on screen. */
    updateTop(true); rollXp(from, p.xp);
    toast(`+${n} XP${why?' · '+why:''}`);
    const after = rankOf(p.xp);
    if(after[0] !== before[0]){
      setTimeout(()=>{ SFX.rank(); celebrate({ title:'CONGRATULATIONS!', sub:`${esc(p.hero||p.name)} reached the rank of <b>${after[0]}</b>`, fireworks:true,
        rewards:[{bg:'#FFC833',icon:'⚡',label:'RANK UP'},{bg:'#F07C1E',icon:'🔥',label:fmt(p.xp)+' XP'},{bg:'#1C7FD6',icon:'🏔',label:(nextRank(p.xp)?'NEXT: '+nextRank(p.xp)[0].toUpperCase():'THE TOP')}] }); }, 900);
    }
  }
  function award(id, why){
    const p = P(); if(!p || p.badges[id]) return;
    p.badges[id] = Date.now(); save();
    const meta = OLY.badgeMeta.find(b=>b.id===id);
    setTimeout(()=>{ SFX.badge(); const chip=document.getElementById('badge-stat'); if(chip&&!reduced){ chip.classList.remove('punch'); void chip.offsetWidth; chip.classList.add('punch'); }
      celebrate({ title:'BADGE EARNED', sub:`<b>${esc(meta?meta.name:id)}</b>${why?' · '+esc(why):''}`, medal:`<div style="width:170px;height:170px;margin:0 auto">${OLY.badgeArt[id]||TROPHY}</div>`,
        rewards:[{bg:'#FFC833',icon:'🏅',label:'NEW BADGE'},{bg:'#2BB5A8',icon:'🗂',label:(Object.keys(p.badges).length)+' / '+OLY.badgeMeta.length}] });
      updateTop(true); }, 500);
  }

  function parseNum(raw){
    if(raw==null) return NaN;
    let s = String(raw).trim().toLowerCase();
    s = s.replace(/,/g,'').replace(/\$/g,'').replace(/[a-z%°]+(\/[a-z]+)?$/g,'').trim();
    s = s.replace(/\s*(×|x|\*)\s*10\s*\^?\s*/,'e').replace(/\s+/g,'');
    if(/^-?\d+(\.\d+)?\/\d+(\.\d+)?$/.test(s)){ const [a,b]=s.split('/'); return Number(a)/Number(b); }
    return Number(s);
  }
  function checkAnswer(p, raw){
    if(p.type==='mc') return Number(raw)===p.ans;
    if(p.type==='text'){ const norm = s=>String(s).toLowerCase().replace(/[^a-z0-9]/g,''); return [].concat(p.ans).map(norm).includes(norm(raw)); }
    const v = parseNum(raw); if(Number.isNaN(v)) return null;
    if(p.lo!=null) return v>=p.lo && v<=p.hi;
    const tol = p.tol!=null ? p.tol : Math.max(Math.abs(p.ans)*0.005, 0.001);
    return Math.abs(v-p.ans) <= tol + 1e-9;
  }
  function answerText(p){
    if(p.type==='mc') return p.choices[p.ans];
    if(p.type==='text') return [].concat(p.ans)[0];
    if(p.lo!=null) return `about ${fmt(p.ans)} (anything from ${fmt(p.lo)} to ${fmt(p.hi)} counts)`;
    return fmt(p.ans) + (p.unit?' '+p.unit:'') + (p.tol!=null && p.tol>0 ? ` (±${fmt(p.tol)})` : '');
  }

  // ---------- lookups ----------
  const allSessions = () => OLY.units.flatMap(u=>u.sessions.map(s=>({...s, unit:u})));
  const findUnit = id => OLY.units.find(u=>u.id===id);
  const findSession = id => { for(const u of OLY.units){ const s=u.sessions.find(x=>x.id===id); if(s) return {s,u}; } return null; };
  function sessionProblems(s){ return s.practice || []; }
  function sessionDone(p, s){ const pr = sessionProblems(s); return pr.length>0 && pr.every(x=>p.probs[x.id] && p.probs[x.id].ok); }
  function laborDone(p, u){ return u.labor && u.labor.problems.every(x=>p.probs[x.id] && p.probs[x.id].ok); }
  function decoders(){ const out=[]; for(const u of OLY.units) for(const s of u.sessions) for(const b of (s.story||[])) if(b.t==='decoder') out.push({...b, sid:s.id, unit:u.num, session:s.title}); return out; }
  /* Unit 0 is Basecamp: the on-ramp, not a missing unit. Ids and quest numbering are untouched. */
  const unitLabel = u => u.num===0 ? 'Basecamp' : 'Unit '+u.num;
  const unitShort = u => u.num===0 ? 'BC' : String(u.num);
  /* Split a story into bite-sized screens: a heading starts a new screen, and heavy blocks
     (decoders, threads, plots, tables) count double so no screen runs long. */
  function storyScreens(s){
    const W = b => (!b||typeof b==='string')?1:({h:0,decoder:2,thread:2,plot:2,table:2,formula:1}[b.t]||1);
    const out=[]; let cur=[], w=0;
    for(const b of (s.story||[])){
      const isH = b && b.t==='h';
      if(isH && cur.length){ out.push(cur); cur=[]; w=0; }
      cur.push(b); w += W(b);
      if(!isH && w>=5){ out.push(cur); cur=[]; w=0; }
    }
    if(cur.length) out.push(cur);
    /* No orphans: a screen that is just one or two light blocks with no heading folds into the one before it. */
    const weight = scr => scr.reduce((a,b)=>a+W(b),0);
    for(let i=out.length-1;i>0;i--){ if(!out[i].some(b=>b&&b.t==='h') && weight(out[i])<=2 && weight(out[i-1])<=5){ out[i-1].push(...out[i]); out.splice(i,1); } }
    return out.length?out:[[]];
  }
  function sessionSteps(s){ const n=storyScreens(s).length; const st=['warmup']; for(let i=1;i<=n;i++) st.push('story-'+i); st.push('practice','apply','log'); return st; }

  // ---------- plots ----------
  OLY.plot = function(o){
    const W=o.w||560, H=o.h||320, m={l:56,r:16,t:16,b:44};
    const [x0,x1]=o.x, [y0,y1]=o.y;
    const sx = x => m.l + (x-x0)/(x1-x0)*(W-m.l-m.r), sy = y => H-m.b - (y-y0)/(y1-y0)*(H-m.t-m.b);
    let g = '';
    const xt = o.xt || niceTicks(x0,x1), yt = o.yt || niceTicks(y0,y1);
    for(const t of xt){ g += `<line x1="${sx(t)}" y1="${sy(y0)}" x2="${sx(t)}" y2="${sy(y1)}" stroke="#eef1f6"/><text x="${sx(t)}" y="${H-m.b+18}" font-size="12" text-anchor="middle" fill="#6b7686">${fmt(t)}</text>`; }
    for(const t of yt){ g += `<line x1="${sx(x0)}" y1="${sy(t)}" x2="${sx(x1)}" y2="${sy(t)}" stroke="#eef1f6"/><text x="${m.l-8}" y="${sy(t)+4}" font-size="12" text-anchor="end" fill="#6b7686">${fmt(t)}</text>`; }
    g += `<line x1="${sx(x0)}" y1="${sy(0>=y0&&0<=y1?0:y0)}" x2="${sx(x1)}" y2="${sy(0>=y0&&0<=y1?0:y0)}" stroke="#2B1A0E" stroke-width="1.5"/>`;
    g += `<line x1="${sx(0>=x0&&0<=x1?0:x0)}" y1="${sy(y0)}" x2="${sx(0>=x0&&0<=x1?0:x0)}" y2="${sy(y1)}" stroke="#2B1A0E" stroke-width="1.5"/>`;
    const cols = ['#1C7FD6','#F07C1E','#3E9E32','#7B2FF7','#2BB5A8'];
    (o.lines||[]).forEach((L,i)=>{
      const col = L.color||cols[i%cols.length]; let d='', started=false;
      const n=120, xa = L.x0!=null?L.x0:x0, xb = L.x1!=null?L.x1:x1;
      for(let k=0;k<=n;k++){ const x = xa+(xb-xa)*k/n; const y = L.f(x); if(y<y0-1e-9||y>y1+1e-9){ started=false; continue; } d += (started?'L':'M')+sx(x).toFixed(1)+','+sy(y).toFixed(1); started=true; }
      g += `<path d="${d}" fill="none" stroke="${col}" stroke-width="3.5"/>`;
      if(L.label){ const lx = L.lx!=null?L.lx:xb*0.75; const ly = L.f(lx); g += `<text x="${sx(lx)+6}" y="${sy(ly)-8}" font-size="13" font-weight="700" fill="${col}">${esc(L.label)}</text>`; }
    });
    (o.points||[]).forEach(pt=>{ g += `<circle cx="${sx(pt[0])}" cy="${sy(pt[1])}" r="5.5" fill="#2B1A0E"/>`; if(pt[2]) g += `<text x="${sx(pt[0])+8}" y="${sy(pt[1])-8}" font-size="12" fill="#2B1A0E">${esc(pt[2])}</text>`; });
    g += `<text x="${(m.l+W-m.r)/2}" y="${H-6}" font-size="13" text-anchor="middle" fill="#2B1A0E">${esc(o.xl||'x')}</text>`;
    g += `<text transform="translate(14,${(m.t+H-m.b)/2}) rotate(-90)" font-size="13" text-anchor="middle" fill="#2B1A0E">${esc(o.yl||'y')}</text>`;
    return `<svg class="plot" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">${g}</svg>`;
  };
  function niceTicks(a,b){ const span=b-a; const raw=span/6; const p=Math.pow(10,Math.floor(Math.log10(raw))); const f=raw/p; const step=(f<1.5?1:f<3?2:f<7?5:10)*p; const out=[]; for(let t=Math.ceil(a/step)*step; t<=b+1e-9; t+=step) out.push(Number(t.toFixed(6))); return out; }

  // ---------- rendering helpers ----------
  const app = document.getElementById('app');
  function tagHtml(tags){ return (tags||[]).map(t=>`<span class="tag ${t}">${({matmath:'Mat Math',magic:'Mathemagic',greek:'Greek Origins',fermi:'Fermi',labor:'Labor',sheets:'Sheets',python:'Python',ai:'AI',calc:'Calculator'})[t]||t}</span>`).join(''); }
  function blockHtml(b){
    if(typeof b === 'string') return `<div class="block">${b}</div>`;
    switch(b.t){
      case 'h': return `<h3>${b.html}</h3>`;
      case 'decoder': return `<div class="decoder"><div class="lbl">Decoder</div><div class="term">${esc(b.term)}</div><div>${b.def}</div>${b.ex?`<div class="small muted" style="margin-top:.4rem">${b.ex}</div>`:''}</div>`;
      case 'thread': { const lbl = {matmath:'Mat Math',magic:'Mathemagic',greek:'Greek Origins',story:'The Story',example:'Worked Example',paper:'On Paper'}[b.kind]||b.kind; return `<div class="thread ${b.kind}"><div class="lbl">${lbl}${b.title?' · '+esc(b.title):''}</div>${b.html}</div>`; }
      case 'formula': return `<div class="formula">${b.html}</div>`;
      case 'plot': return OLY.plot(b.spec);
      case 'table': return `<table><tr>${b.head.map(h=>`<th>${h}</th>`).join('')}</tr>${b.rows.map(r=>`<tr>${r.map(c=>`<td>${c}</td>`).join('')}</tr>`).join('')}</table>`;
      default: return `<div class="block">${b.html||''}</div>`;
    }
  }
  function problemHtml(p, i, opts){
    const prof = P(); const st = prof.probs[p.id] || {}; const ps = PS[p.id] || (PS[p.id]={hints:0,wrong:0});
    const labor = !!opts.labor; const again = !!ps.again;
    const locked = st.ok && !again;
    let input = '';
    if(p.type==='mc'){
      input = `<div class="choices">${p.choices.map((c,k)=>`<label><input type="radio" name="${p.id}" value="${k}" ${locked&&k===p.ans?'checked':''} ${locked?'disabled':''}> <span>${c}</span></label>`).join('')}</div>`;
    } else {
      input = `<input type="text" id="in-${p.id}" placeholder="${p.type==='text'?'your answer':'number'}" value="${locked?esc(st.last||''):''}" ${locked?'disabled':''}> ${p.unit?`<span class="unit">${esc(p.unit)}</span>`:''}`;
    }
    const canHint = !labor && !locked && !again && (p.hints||[]).length>ps.hints;
    const hintsShown = (p.hints||[]).slice(0, ps.hints).map((h,k)=>`<div class="hint"><b>Hint ${k+1}.</b> ${h}</div>`).join('');
    const allHints = ps.hints >= (p.hints||[]).length;
    const canReveal = (teacherMode&&canTeach()) || (!labor && !st.ok && ps.wrong>=2 && allHints);
    const showSol = (teacherMode&&canTeach()) || (ps.revealed && !labor) || (st.ok && !again);
    return `<div class="prob ${st.ok?'ok':''} ${labor?'labor':''}" id="prob-${p.id}">
      <div class="head"><span class="n">${labor?'Part':'Problem'} ${i+1} ${tagHtml(p.tags)}</span><span class="xp">${st.ok?`✓ earned ${st.xp} XP${st.repeats?` · practised ×${st.repeats}`:''}`:`${p.xp||10} XP`}</span></div>
      <div class="q">${p.q}</div>
      ${p.type==='mc'?input:''}
      <div class="ans">${p.type==='mc'?'':input}
        ${locked?'':`<button class="btn sm" data-act="check" data-pid="${p.id}">Check it</button>`}
        ${canHint?`<button class="btn sm ghost" data-act="hint" data-pid="${p.id}">Hint (${ps.hints+1}/${p.hints.length})</button>`:''}
        ${canReveal && !showSol ? `<button class="btn sm ghost" data-act="reveal" data-pid="${p.id}">Last hint: the worked solution</button>`:''}
        ${locked && !labor ? `<button class="btn sm ghost" data-act="again" data-pid="${p.id}" title="Solve it again for a quarter of the XP">Practise again</button>`:''}
      </div>
      ${p.paper?`<div class="small muted" style="margin-top:.5rem">✎ Work this one on paper first. Type only the answer.</div>`:''}
      <div class="hints">${hintsShown}</div>
      <div class="fb-slot" id="fb-${p.id}"></div>
      ${showSol && p.sol ? `<div class="sol"><div class="lbl">${teacherMode&&canTeach()&&!st.ok?'Answer key':'Worked solution'}</div><div><b>Answer: ${esc(answerText(p))}</b></div>${p.sol}</div>` : (teacherMode&&canTeach()?`<div class="sol"><div class="lbl">Answer key</div><b>${esc(answerText(p))}</b></div>`:'')}
    </div>`;
  }

  // ---------- views ----------
  function view(html){ app.innerHTML = html; window.scrollTo(0,0); updateTop(); }
  function crumbs(parts){ return `<div class="crumb">${parts.map(p=>p.href?`<a href="${p.href}">${p.t}</a>`:p.t).join(' › ')}</div>`; }

  /* The map: every module and every lesson on one page. The only way forward is forward. */
  function renderHome(){
    const p = P(); const r = rankOf(p.xp); const nr = nextRank(p.xp);
    const all = allSessions(); const firstOpen = all.find(s=>!sessionDone(p,s));
    const modules = OLY.units.map(u=>{
      const done = u.sessions.filter(s=>sessionDone(p,s)).length; const pct = Math.round(100*done/u.sessions.length);
      const hasBadge = !!p.badges[u.badge]; const ld = laborDone(p,u);
      const rows = u.sessions.map(s=>{ const d=sessionDone(p,s); const now = firstOpen && firstOpen.id===s.id; const seen = p.sessions[s.id]&&p.sessions[s.id].seen;
        return `<a class="lessonrow ${s.lab?'lab':''}" href="#/session/${s.id}/warmup"><span class="dot ${d?'done':now?'now':'todo'}">${d?'✓':now?'▸':s.day}</span><span><span class="day">Week ${s.week} · Day ${s.day}${s.lab?' · Lab':''}</span><b>${esc(s.title)}</b><em>${esc(s.subtitle||'')}</em></span></a>`; }).join('');
      return `<div class="card module" id="${u.id}">
        <div class="module-head"><div class="module-num">${unitShort(u)}</div>
          <div><h3>${unitLabel(u)}: ${esc(u.title)}</h3><p class="m-sub">${esc(u.subtitle||'')} · ${u.weeks} week${u.weeks>1?'s':''}</p></div>
          <div class="module-badge ${hasBadge?'':'locked'}" title="${esc((OLY.badgeMeta.find(b=>b.id===u.badge)||{}).name||'')}">${OLY.badgeArt[u.badge]||''}</div>
          <div class="module-prog"><span>${done} of ${u.sessions.length} done</span><div class="bar"><i style="width:${pct}%"></i></div></div></div>
        <div class="lessons">${rows}</div>
        <div class="module-foot">
          <a class="lessonrow special" href="#/labor/${u.id}"><span class="dot ${ld?'done':'todo'}">${ld?'✓':'⚔'}</span><span><span class="day">Labor ${u.num} · no hints</span><b>${esc(u.labor.title)}</b><em>Beat it for the ${esc((OLY.badgeMeta.find(b=>b.id===u.badge)||{}).name||'')} badge</em></span></a>
          <a class="lessonrow special" href="#/quest/${u.id}"><span class="dot todo">🗺</span><span><span class="day">Quest ${u.num+1} · at home</span><b>${esc(u.quest.title)}</b><em>Clues, a lock, and a box. Dad sets it up.</em></span></a>
          ${teacherMode&&canTeach()?`<a class="lessonrow special" href="#/unit/${u.id}"><span class="dot todo">🖨</span><span><span class="day">Teacher mode</span><b>Print this ${u.num===0?'module':'unit'}</b><em>Teacher's Edition and practice sheets</em></span></a>`:''}
        </div></div>`;
    }).join('');
    const future = [[2,'Money Math'],[3,"Daedalus' Workshop"],[4,'The Physics of Motion'],[5,'The Infinity Machine'],[6,'Chance and Patterns'],[7,"Prometheus' Fire"],[8,'The Human Machine'],[9,"Hermes' Map"],[10,'The Final Labor']]
      .filter(f=>!OLY.units.some(u=>u.num===f[0]))
      .map(f=>`<div class="card module" style="opacity:.55"><div class="module-head"><div class="module-num">${f[0]}</div><div><h3>Unit ${f[0]}: ${f[1]}</h3><p class="m-sub">Coming when you get there</p></div></div></div>`).join('');
    view(`
      <div class="hero"><h1>Welcome back, <span class="gold">${esc(p.name)}</span>.</h1>
        <div class="sub">Rank: <b>${r[0]}</b> · ${fmt(p.xp)} XP${nr?` · ${fmt(nr[1]-p.xp)} XP to ${nr[0]}`:' · Top of the mountain'} · ${Object.keys(p.badges).length} of ${OLY.badgeMeta.length} badges</div>
        ${p.hero?`<div class="heroname">⚔ ${esc(p.hero)}</div>`:`<div class="heroname" data-act="hero" style="cursor:pointer">⚔ Name your hero</div>`}
        <div style="margin-top:1.1rem;display:flex;gap:.6rem;flex-wrap:wrap">${firstOpen?`<a class="btn gold" href="#/session/${firstOpen.id}/warmup">Continue: ${esc(firstOpen.title)} →</a>`:''}<a class="btn ghost" style="background:rgba(255,255,255,.12);color:#fff;border-color:rgba(255,255,255,.35)" href="#/start">The rules of the game</a><a class="btn ghost" style="background:rgba(255,255,255,.12);color:#fff;border-color:rgba(255,255,255,.35)" href="#/beatdad">Beat Dad Friday</a></div>
      </div>
      <h2>Your map</h2>
      ${modules}${future}
      <p class="footer-note">Project Olympus · The Language of Everything · by David Balyeat, with Claude</p>`);
  }

  function renderStart(){ view(`${crumbs([{t:'Map',href:'#/'},{t:'The rules of the game'}])}<div class="card stage">${OLY.intro}</div>`); }

  function renderUnit(id){
    const u = findUnit(id); if(!u) return renderHome(); const p = P(); const ld = laborDone(p,u);
    view(`${crumbs([{t:'Map',href:'#/'},{t:unitLabel(u)}])}
      <div class="hero"><h1>${unitLabel(u)}: ${esc(u.title)}</h1><div class="sub">${u.intro||''}</div></div>
      <div class="grid two">
        <a class="card" href="#/labor/${u.id}" style="display:block"><span class="eyebrow">Labor ${u.num} · no hints</span><h3>${esc(u.labor.title)}</h3><p class="muted">Beat it to earn the <b>${esc((OLY.badgeMeta.find(b=>b.id===u.badge)||{}).name||'')}</b> badge.${ld?' <b style="color:var(--green-deep)">Done.</b>':''}</p></a>
        <a class="card" href="#/quest/${u.id}" style="display:block"><span class="eyebrow">Quest ${u.num+1} · at home</span><h3>${esc(u.quest.title)}</h3><p class="muted">Clues, a lock, and a box. Dad sets it up.</p></a>
      </div>
      <p><a class="btn ghost" href="#/#${u.id}">← Back to the map</a></p>
      ${teacherMode&&canTeach()?`<div class="teacheronly"><div class="lbl">Teacher mode</div>Print: <a href="#/print/teacher/${u.id}">Teacher's Edition (with answers)</a> · <a href="#/print/student/${u.id}">Student practice sheets</a></div>`:''}`);
  }

  /* One idea per screen. Warm-up, then the story a screen at a time, then practice, apply, log. */
  function renderSession(id, step){
    const f = findSession(id); if(!f) return renderHome();
    const {s,u} = f; const p = P();
    const ss = p.sessions[s.id] || (p.sessions[s.id] = {}); if(!ss.seen){ ss.seen = true; save(); }
    const steps = sessionSteps(s); const screens = storyScreens(s);
    if(step==='story') step='story-1';
    if(!steps.includes(step)) step='warmup';
    const k = steps.indexOf(step);
    const nProb = sessionProblems(s).length, nOk = sessionProblems(s).filter(x=>p.probs[x.id]&&p.probs[x.id].ok).length;
    let body='', label='';
    if(step==='warmup'){
      const w = s.warmup; label='Warm-up · 5 min';
      body = `<div class="stage"><span class="eyebrow">Warm-up</span><h3>Before we start</h3><div class="q" style="font-size:1.15rem;margin-bottom:1rem">${w.q}</div>
        ${w.type==='mc' ? `<div class="choices">${w.choices.map((c,kk)=>`<label><input type="radio" name="warm" value="${kk}"> <span>${c}</span></label>`).join('')}</div>` : `<div class="ans" style="display:flex;gap:.6rem;flex-wrap:wrap;align-items:center"><input type="text" id="warm-in" placeholder="answer" style="font-family:var(--mono);font-weight:700"></div>`}
        <div style="margin-top:.9rem;display:flex;gap:.6rem;flex-wrap:wrap"><button class="btn" data-act="warmcheck">Check it</button> <button class="btn ghost" data-act="warmreveal">Hint</button></div>
        <div id="warm-fb"></div>
        <div id="warm-sol" style="display:none" class="hint" style="margin-top:.8rem"><b>Hint.</b> ${w.reveal||''}</div>
        ${ss.warm?`<div class="fb good">Warm-up done (+5 XP earned)</div>`:''}</div>`;
    } else if(step.startsWith('story-')){
      const i = Number(step.split('-')[1])-1; const scr = screens[i]||[]; label=`The Story · ${i+1} of ${screens.length}`;
      const hasH = scr.some(b=>b&&b.t==='h');
      body = `<div class="stage"><span class="eyebrow">The Story · screen ${i+1} of ${screens.length}${hasH?'':' · continued'}</span>${scr.map(blockHtml).join('')}</div>`;
    } else if(step==='practice'){
      label='Practice · 20 min';
      body = `<div class="stage" style="padding-bottom:1rem"><span class="eyebrow">Practice</span><h3>Your turn</h3>
        <div class="thread paper" style="margin-top:.6rem"><div class="lbl">On Paper</div>Paper first, always. Write the problem, draw it if it has a shape, work it out, <i>then</i> type the answer here. The checker tells you right or wrong instantly. Hints cost a little XP. Two wrong tries plus all hints unlocks the worked solution as a last hint.</div>
        ${sessionProblems(s).map((x,i)=>problemHtml(x,i,{})).join('')}
        <div id="sess-summary">${sessionSummary(s)}</div></div>`;
    } else if(step==='apply'){
      const a = s.apply; ss.apply = ss.apply || []; label='Apply · 10-15 min';
      body = `<div class="stage"><span class="eyebrow">Apply</span><h3>${esc(a.title||'Make it real')}</h3>${a.intro||''}
        ${a.steps?`<ol class="steps">${a.steps.map(x=>`<li>${x}</li>`).join('')}</ol>`:''}
        ${a.checklist?`<h4 style="margin-top:1.2rem">Done when</h4><div class="checklist">${a.checklist.map((c,kk)=>`<label><input type="checkbox" data-act="applycheck" data-k="${kk}" ${ss.apply[kk]?'checked':''}> <span>${c}</span></label>`).join('')}</div>`:''}
        ${ss.applyBonus?`<div class="fb good">Apply complete (+10 XP earned)</div>`:''}
        ${teacherMode&&canTeach()&&a.dad?`<div class="teacheronly"><div class="lbl">Dad notes</div>${a.dad}</div>`:''}</div>`;
    } else if(step==='log'){
      label='Log · 2 min';
      body = `<div class="stage"><span class="eyebrow">Log</span><h3>One sentence</h3><p>What clicked today? Or what didn't. That counts too.</p>
        <textarea id="log-in">${esc(ss.log||'')}</textarea>
        <div style="margin-top:.8rem;display:flex;gap:.6rem;align-items:center;flex-wrap:wrap"><button class="btn" data-act="savelog">Save log</button> ${ss.logXp?'<span class="muted small">Logged (+5 XP earned)</span>':''}</div>
        <hr><div class="kv"><b>Problems</b><span>${nOk}/${nProb} solved</span><b>Warm-up</b><span>${ss.warm?'done':'not yet'}</span><b>Apply</b><span>${ss.applyBonus?'done':'not yet'}</span></div>
        ${s.feynman?`<div class="thread story" style="margin-top:1.2rem"><div class="lbl">Feynman Badge prompt</div>${s.feynman}</div>`:''}</div>`;
    }
    const all = allSessions(); const idx = all.findIndex(x=>x.id===s.id); const next = all[idx+1];
    const prevStep = k>0 ? steps[k-1] : null; const nextStep = k<steps.length-1 ? steps[k+1] : null;
    const nextLabel = nextStep ? ({practice:'To the problems →', apply:'To Apply →', log:'To the Log →'})[nextStep] || 'Next →' : (next ? `Next lesson: ${esc(next.title)} →` : `Labor ${u.num} →`);
    const nextHref = nextStep ? `#/session/${s.id}/${nextStep}` : (next ? `#/session/${next.id}/warmup` : `#/labor/${u.id}`);
    view(`${crumbs([{t:'Map',href:'#/'},{t:unitLabel(u),href:'#/#'+u.id},{t:s.title}])}
      <div class="lessonhead"><div><div class="muted small">Week ${s.week} · Day ${s.day}${s.lab?' · Lab Day':''} ${tagHtml(s.tags)}</div><h1>${esc(s.title)}</h1><div class="sub">${esc(s.subtitle||'')}</div></div>
        <div class="no-print">${teacherMode&&canTeach()?`<a class="btn sm ghost" href="#/print/session/${s.id}">Print this session</a>`:''}</div></div>
      <div class="card" style="padding:0">${body}
        <div class="pager">${prevStep?`<a class="btn ghost" href="#/session/${s.id}/${prevStep}">← Back</a>`:`<a class="btn ghost" href="#/#${u.id}">← Map</a>`}
          <div class="steps-dots">${steps.map((st,i)=>`<i class="${i===k?'on':i<k?'done':''}" title="${st}"></i>`).join('')}</div>
          <a class="btn" href="${nextHref}" data-act="pagenext">${nextLabel}</a>
          <div class="lbl">${label}</div></div></div>`);
  }

  function renderLabor(uid){
    const u = findUnit(uid); if(!u) return renderHome(); const p = P(); const L = u.labor; const done = laborDone(p,u);
    view(`${crumbs([{t:'Map',href:'#/'},{t:unitLabel(u),href:'#/#'+u.id},{t:'Labor '+u.num}])}
      <div class="hero" style="background:linear-gradient(135deg,#3a1f18,#7a2e20);border-bottom-color:var(--orange)"><div class="small" style="color:#f3d9d3;letter-spacing:.1em;font-weight:800">LABOR ${u.num} · NO HINTS · RETRIES ALLOWED</div><h1>${esc(L.title)}</h1><div class="sub">${L.intro||''}</div></div>
      ${L.problems.map((x,i)=>problemHtml(x,i,{labor:true})).join('')}
      ${done?`<div class="fb good">Labor ${u.num} complete. The ${esc((OLY.badgeMeta.find(b=>b.id===u.badge)||{}).name)} badge is yours.</div>`:`<div class="fb info">Beat every part to unlock the badge. Wrong answers cost a little XP; giving up costs more.</div>`}
      ${L.after?`<div class="card" style="margin-top:1rem">${L.after}</div>`:''}`);
  }

  function renderQuest(uid){
    const u = findUnit(uid); if(!u) return renderHome(); const Q = u.quest;
    view(`${crumbs([{t:'Map',href:'#/'},{t:unitLabel(u),href:'#/#'+u.id},{t:'Quest '+(u.num+1)}])}
      <div class="hero" style="background:linear-gradient(135deg,#2b3a24,#3f6a3a);border-bottom-color:var(--green)"><div class="small" style="color:#d6e8d0;letter-spacing:.1em;font-weight:800">QUEST ${u.num+1} · AT HOME</div><h1>${esc(Q.title)}</h1><div class="sub">${Q.intro||''}</div></div>
      <div class="card"><h3>How it works</h3><p>Each clue is a problem. The answer points to where the next clue is hidden. The last clues give the lock combination. Inside the box: the reward. Dad hides the clues before you start. No hints. No Claude. Pencil and brain.</p>
      ${teacherMode&&canTeach()?`<div class="teacheronly"><div class="lbl">Dad setup (only you can see this)</div>${Q.dad||''}<table><tr><th>Clue</th><th>Answer</th><th>Suggested hiding spot for the next clue</th></tr>${Q.clues.map((c,i)=>`<tr><td>${i+1}</td><td><b>${esc(c.ans)}</b></td><td>${c.spot}</td></tr>`).join('')}</table><p><b>Lock:</b> ${Q.lock}</p><p>Print the clue cards: <a href="#/print/quest/${u.id}">Quest ${u.num+1} clue cards</a></p></div>`
      :`<p class="muted">Clue cards are printed and hidden by Dad. This page is just the briefing.</p><p><b>Clue 1 (to get you started):</b> ${Q.clues[0].q}</p>`}
      </div>`);
  }

  function renderCodex(){
    const p = P(); const seen = new Set(Object.keys(p.sessions).filter(k=>p.sessions[k].seen));
    const items = decoders().filter(d=>seen.has(d.sid) || (teacherMode&&canTeach()));
    view(`${crumbs([{t:'Map',href:'#/'},{t:'Codex'}])}<div class="hero"><h1>The Codex</h1><div class="sub">Every term you meet, defined twice: once by the course, once by you. Your own definition, in your own words, earns 10 XP. By June this is a math dictionary you wrote.</div></div>
      <div class="card">${items.length?items.map(d=>{ const mine = p.codex[d.term]||{}; return `<div class="codex-item"><div class="term">${esc(d.term)} <span class="muted small">· ${d.unit===0?'Basecamp':'Unit '+d.unit}, ${esc(d.session)}</span></div><div>${d.def}</div>
        <div style="margin-top:.6rem"><input type="text" style="width:100%" id="cx-${esc(d.term)}" placeholder="Your definition, in your words" value="${esc(mine.def||'')}"> <button class="btn sm" style="margin-top:.5rem" data-act="codexsave" data-term="${esc(d.term)}">Save${mine.xp?'':' (+10 XP)'}</button></div></div>`; }).join('')
        :'<p class="muted">Nothing here yet. Terms appear as you open lessons.</p>'}</div>`);
  }

  /* Trophy case: earned badges lit, unearned as locked silhouettes. The empty slots are the pull. */
  function renderBadges(){
    const p = P(); const got = Object.keys(p.badges).length; const cur = rankOf(p.xp)[0];
    view(`${crumbs([{t:'Map',href:'#/'},{t:'Trophy case'}])}<div class="hero"><h1>Trophy case</h1><div class="sub">${got} earned, ${OLY.badgeMeta.length-got} still out there. Unit badges come from Labors. The others come from doing something real: teaching, performing, catching the AI, building, showing up.</div></div>
      <div class="rankrow">${RANKS.map(r=>`<div class="rank ${cur===r[0]?'on':(p.xp>=r[1]?'got':'')}"><div class="rn">${r[0]}</div><div class="rx">${fmt(r[1])} XP</div></div>`).join('')}</div>
      <h2 style="margin-top:1.4rem">Badges</h2>
      <div class="badges">${OLY.badgeMeta.map(b=>{ const g=!!p.badges[b.id]; return `<div class="badge ${g?'':'locked'}">${OLY.badgeArt[b.id]||''}<div class="bn">${esc(b.name)}</div><div class="bd">${g?'Earned '+new Date(p.badges[b.id]).toLocaleDateString():esc(b.how)}</div>${teacherMode&&canTeach()&&!g?`<button class="btn sm gold" style="margin-top:.5rem" data-act="award" data-b="${b.id}">Award</button>`:''}${teacherMode&&canTeach()&&g?`<button class="btn sm ghost" style="margin-top:.5rem" data-act="unaward" data-b="${b.id}">Revoke</button>`:''}</div>`; }).join('')}</div>
      ${teacherMode&&canTeach()?`<div class="teacheronly" style="margin-top:1rem"><div class="lbl">Teacher mode</div>Award the cross-cutting badges when he earns them in real life. <a href="#/print/badges">Print the badge sheet</a> (stickers) or import the SVGs into Orca-Flashforge to slice tokens.</div>`:''}`);
  }

  function renderBeatDad(){
    const p = P(); const names = Object.keys(S.profiles);
    const rows = OLY.beatdad.map(b=>{ const r = p.beatdad[b.week]||{}; const others = names.map(n=>{ const o=S.profiles[n].beatdad[b.week]; return `<td>${o?(o.ok?'✓ ':'✗ ')+o.secs+'s':'—'}</td>`; }).join('');
      return `<tr><td>Week ${b.week}</td>${others}<td>${r.ts?'':`<button class="btn sm" data-act="bdstart" data-w="${b.week}">Start</button>`}</td></tr>`; }).join('');
    view(`${crumbs([{t:'Map',href:'#/'},{t:'Beat Dad Friday'}])}<div class="hero"><h1>Beat Dad Friday</h1><div class="sub">One problem. Same clock. Fastest correct answer wins the week. Each profile gets one shot per week, so everyone signs in as themselves.</div></div>
      <div class="card"><table class="lb"><tr><th>Week</th>${names.map(n=>`<th>${esc(n)}</th>`).join('')}<th></th></tr>${rows}</table><div id="bd-arena"></div></div>`);
  }
  function bdStart(week){
    const b = OLY.beatdad.find(x=>x.week===week); const t0 = Date.now(); const arena = document.getElementById('bd-arena');
    arena.innerHTML = `<hr><div class="timer" id="bd-timer">0.0 s</div><div class="q" style="font-size:1.15rem;margin:.6rem 0">${b.q}</div><div class="ans" style="display:flex;gap:.6rem;flex-wrap:wrap"><input type="text" id="bd-in" placeholder="answer" autofocus> <button class="btn" data-act="bdsubmit" data-w="${week}">Submit</button></div><div id="bd-fb"></div>`;
    arena.dataset.t0 = t0; document.getElementById('bd-in').focus();
    const iv = setInterval(()=>{ const el=document.getElementById('bd-timer'); if(!el){ clearInterval(iv); return; } el.textContent = ((Date.now()-t0)/1000).toFixed(1)+' s'; }, 100);
  }
  function bdSubmit(week){
    const b = OLY.beatdad.find(x=>x.week===week); const arena = document.getElementById('bd-arena'); const secs = Math.round((Date.now()-Number(arena.dataset.t0))/100)/10;
    const ok = checkAnswer(b, document.getElementById('bd-in').value); const p = P();
    p.beatdad[week] = {ok:!!ok, secs, ts:Date.now()}; save();
    document.getElementById('bd-fb').innerHTML = `<div class="fb ${ok?'good':'bad'}">${ok?'Correct':'Not quite'} in ${secs} s. ${b.sol?'<div style="font-weight:400;margin-top:.3rem">'+b.sol+'</div>':''}</div>`;
    if(ok){ SFX.correct(); addXP(15, 'Beat Dad Friday', {quiet:true}); } else SFX.miss();
    setTimeout(()=>renderBeatDad(), 2500);
  }

  function renderProgress(){
    const p = P(); const all = allSessions(); const done = all.filter(s=>sessionDone(p,s)).length;
    const probs = Object.values(p.probs); const ok = probs.filter(x=>x.ok).length; const firstTry = probs.filter(x=>x.ok&&x.tries===1&&!x.hints).length;
    const logs = all.filter(s=>p.sessions[s.id]&&p.sessions[s.id].log).map(s=>`<tr><td>${esc(s.title)}</td><td>${esc(p.sessions[s.id].log)}</td></tr>`).join('');
    view(`${crumbs([{t:'Map',href:'#/'},{t:'Progress'}])}<div class="hero"><h1>${esc(p.name)}'s Progress</h1><div class="sub">${fmt(p.xp)} XP · ${rankOf(p.xp)[0]} · ${done}/${all.length} lessons · ${Object.keys(p.badges).length} badges${p.hero?` · ⚔ ${esc(p.hero)}`:''}</div></div>
      <div class="grid three"><div class="card tight center"><div class="display" style="font-size:2rem">${ok}</div><div class="muted small">problems solved</div></div><div class="card tight center"><div class="display" style="font-size:2rem">${probs.length?Math.round(100*firstTry/Math.max(ok,1)):0}%</div><div class="muted small">solved first try, no hints</div></div><div class="card tight center"><div class="display" style="font-size:2rem">${probs.reduce((a,x)=>a+(x.hints||0),0)}</div><div class="muted small">hints used</div></div></div>
      <div class="card"><h3>Hero name</h3><p class="small muted">The name on the mountain. Change it any time.</p><div style="display:flex;gap:.6rem;flex-wrap:wrap"><input type="text" id="hero-in" value="${esc(p.hero||'')}" placeholder="e.g. Hudson the Unbending"> <button class="btn sm" data-act="herosave">Save</button></div></div>
      <div class="card"><h3>Logs</h3>${logs?`<table>${logs}</table>`:'<p class="muted">No logs yet.</p>'}</div>
      ${SYNC.url?`<div class="card"><h3>Cloud save</h3><p class="small muted">Status: <b>${({synced:'saved',saving:'saving…',offline:'offline (kept in this browser; will sync when the cloud is reachable)',connecting:'connecting…'})[SYNC.status]||SYNC.status}</b>. Progress saves automatically a moment after every action and loads on any device when you pick your name.</p><button class="btn sm" data-act="syncnow">Sync now</button></div>`:''}
      <div class="card"><h3>Progress file</h3><p class="small muted">${SYNC.url?'A backup you can keep in the Math Program folder. With cloud save on, you rarely need it.':'Progress lives in this browser. To move it to another computer, save the file and open it on the other side.'}</p>
        <div style="display:flex;gap:.6rem;flex-wrap:wrap"><button class="btn" data-act="export">Save progress file</button> <label class="btn ghost" style="cursor:pointer">Load progress file <input type="file" id="imp" accept=".json" style="display:none" data-act="import"></label> <button class="btn ghost" data-act="csv">Copy XP summary for Sheets</button></div>
        ${teacherMode&&canTeach()?`<hr><button class="btn ghost" data-act="resetask">Reset this profile…</button><div id="reset-slot"></div>`:''}</div>
      ${teacherMode&&canTeach()?`<div class="card"><h3>Cloud sync URL</h3><p class="small muted">${(OLY.config||{}).syncUrl?'Set in content/config.js for every device. A value entered here overrides it on this device only.':'Not set in content/config.js. Paste the Apps Script Web app URL here to turn on cloud save for this device (better: put it in config.js so every device gets it).'}</p><input type="text" id="syncurl" style="width:100%" placeholder="https://script.google.com/macros/s/…/exec" value="${esc(localStorage.getItem('olympus.sync')||'')}"> <button class="btn sm" style="margin-top:.5rem" data-act="setsyncurl">Save and reload</button></div>`:''}`);
  }

  // ---------- print views ----------
  function pProblem(p, i, teacher, labor){
    return `<div class="pprob"><div><b>${labor?'Part':''} ${i+1}.</b> ${p.q}${p.type==='mc'?`<ol type="A" style="margin:.3rem 0 0 1.2rem">${p.choices.map(c=>`<li>${c}</li>`).join('')}</ol>`:''}</div>
      ${teacher?`<div class="key"><b>Answer:</b> ${esc(answerText(p))}${p.type==='mc'?` (${String.fromCharCode(65+p.ans)})`:''}${p.hints&&p.hints.length?`<br><b>Hints:</b> ${p.hints.map((h,k)=>`(${k+1}) ${h}`).join(' ')}`:''}${p.sol?`<br><b>Solution:</b> ${p.sol}`:''}</div>`:`<div class="work ${p.type==='mc'?'short':''}"></div>`}</div>`;
  }
  function printSessionHtml(s, u, teacher){
    const w = s.warmup;
    let h = `<h2>Week ${s.week} · Day ${s.day}${s.lab?' · Lab Day':''}: ${esc(s.title)}</h2><div class="meta">${esc(s.subtitle||'')}</div>`;
    h += `<h3>Warm-up</h3><div>${w.q}${w.type==='mc'?`<ol type="A">${w.choices.map(c=>`<li>${c}</li>`).join('')}</ol>`:''}</div>${teacher?`<div class="key"><b>Answer:</b> ${w.reveal||''}</div>`:''}`;
    if(teacher){ h += `<h3>The Story</h3>${(s.story||[]).map(blockHtml).join('')}`; }
    h += `<h3>Practice</h3>${sessionProblems(s).map((p,i)=>pProblem(p,i,teacher,false)).join('')}`;
    if(teacher){ const a=s.apply; h += `<h3>Apply: ${esc(a.title||'')}</h3>${a.intro||''}${a.steps?`<ol>${a.steps.map(x=>`<li>${x}</li>`).join('')}</ol>`:''}${a.dad?`<div class="key"><b>Dad notes:</b> ${a.dad}</div>`:''}${s.feynman?`<div class="key"><b>Feynman Badge prompt:</b> ${s.feynman}</div>`:''}`; }
    return h;
  }
  function renderPrint(kind, id){
    let h = ''; const printBtn = `<div class="no-print" style="text-align:right;margin-bottom:.6rem"><button class="btn" onclick="window.print()">Print / Save as PDF</button> <a class="btn ghost" href="#/">Back</a></div>`;
    if(kind==='session'){ const f=findSession(id); if(!f) return renderHome(); h = `<h1>Project Olympus · ${unitLabel(f.u)}</h1>` + printSessionHtml(f.s,f.u,true); }
    else if(kind==='teacher' || kind==='student'){
      const u = findUnit(id); if(!u) return renderHome(); const teacher = kind==='teacher';
      h = `<h1>Project Olympus · ${unitLabel(u)}: ${esc(u.title)}</h1><div class="meta">${teacher?"Teacher's Edition with answer keys, hints, and solutions":'Student practice sheets. Paper first.'} · The Language of Everything · David Balyeat, with Claude</div>${teacher?`<div style="margin:.6rem 0">${u.intro||''}</div>`:''}`;
      u.sessions.forEach((s,i)=>{ h += `<div class="${i?'pagebreak':''}">${printSessionHtml(s,u,teacher)}</div>`; });
      h += `<div class="pagebreak"><h2>Labor ${u.num}: ${esc(u.labor.title)}</h2>${u.labor.intro||''}${u.labor.problems.map((p,i)=>pProblem(p,i,teacher,true)).join('')}</div>`;
      if(teacher){ const Q=u.quest; h += `<div class="pagebreak"><h2>Quest ${u.num+1}: ${esc(Q.title)} (Dad setup)</h2>${Q.intro||''}${Q.dad||''}<table><tr><th>#</th><th>Clue</th><th>Answer</th><th>Hiding spot for the next clue</th></tr>${Q.clues.map((c,i)=>`<tr><td>${i+1}</td><td>${c.q}</td><td><b>${esc(c.ans)}</b></td><td>${c.spot}</td></tr>`).join('')}</table><p><b>Lock:</b> ${Q.lock}</p></div>`; }
    }
    else if(kind==='quest'){ const u=findUnit(id); if(!u) return renderHome(); const Q=u.quest;
      h = `<h1>Quest ${u.num+1}: ${esc(Q.title)}</h1><p class="meta">Cut along the lines. Hide in order. Clue 1 goes to Hudson directly.</p>` + Q.clues.map((c,i)=>`<div class="pprob" style="min-height:2.6in;page-break-inside:avoid"><div class="meta">PROJECT OLYMPUS · QUEST ${u.num+1} · CLUE ${i+1} of ${Q.clues.length}</div><div style="font-size:1.15rem;margin:.5rem 0">${c.q}</div><div class="meta">${c.hintSpot||''}</div></div>`).join(''); }
    else if(kind==='badges'){ h = `<h1>Badge Sheet</h1><p class="meta">Print on sticker paper, or on card stock and cut. For 3D tokens, import the SVG files from the badges folder into Orca-Flashforge.</p><div class="badges">${OLY.badgeMeta.map(b=>`<div class="badge">${OLY.badgeArt[b.id]||''}<div class="bn">${esc(b.name)}</div></div>`).join('')}</div>`; }
    app.innerHTML = `<div class="printpage">${printBtn}${h}</div>`; window.scrollTo(0,0);
  }

  // ---------- top bar / profiles ----------
  function updateTop(keepNum){
    const p = P(); const el = document.getElementById('top');
    if(!p){ el.innerHTML = `<span class="brand">PROJECT OLYMPUS<small>THE LANGUAGE OF EVERYTHING</small></span>`; return; }
    const r = rankOf(p.xp), nr = nextRank(p.xp); const pct = nr ? Math.round(100*(p.xp-r[1])/(nr[1]-r[1])) : 100;
    const route = location.hash.split('/')[1]||''; const got = Object.keys(p.badges).length;
    const shown = keepNum && document.getElementById('xp-num') ? document.getElementById('xp-num').textContent : fmt(p.xp);
    el.innerHTML = `<a class="brand" href="#/" style="text-decoration:none">PROJECT OLYMPUS<small>THE LANGUAGE OF EVERYTHING</small></a>
      <nav><a href="#/" class="${route===''?'on':''}">Map</a><a href="#/codex" class="${route==='codex'?'on':''}">Codex</a><a href="#/badges" class="${route==='badges'?'on':''}">Trophy case</a><a href="#/beatdad" class="${route==='beatdad'?'on':''}">Beat Dad</a><a href="#/progress" class="${route==='progress'?'on':''}">Progress</a></nav>
      <span class="spacer"></span>
      <div class="xpbar" id="xp-stat"><span>${r[0]}</span><div class="track"><div class="fill" style="width:${pct}%"></div></div><span class="num" id="xp-num">${shown}</span><span>XP</span></div>
      <a class="chip trophy" id="badge-stat" href="#/badges" title="Trophy case"><b>${got} / ${OLY.badgeMeta.length}</b> 🏅</a>
      ${SYNC.url?`<span class="chip sync ${SYNC.status}" id="sync-chip" data-act="syncnow"></span>`:''}
      <span class="chip" data-act="sound" title="${soundOn?'Sound is on':'Sound is off'}">${soundOn?'🔊':'🔇'}</span>
      <span class="chip" data-act="switch" title="Switch profile">👤 ${esc(p.name)}</span>
      ${canTeach()?`<span class="chip teacher ${teacherMode?'on':''}" data-act="teacher" title="Answer keys, awards, printing">${teacherMode?'Teacher mode ON':'Teacher mode'}</span>`:''}`;
    if(SYNC.url) setSync(SYNC.status);
  }
  async function profileModal(){
    if(document.getElementById('modal') || profileModal.pending) return; profileModal.pending = true;
    let cloud = null;
    if(SYNC.url){ setSync('connecting'); try{ const r = await api({action:'list'}); if(r.ok){ cloud = r.profiles; setSync('synced'); } else setSync('offline'); }catch(e){ setSync('offline'); } }
    SYNC.cloud = cloud;
    const names = Array.from(new Set([...Object.keys(S.profiles), ...(cloud||[]).map(c=>c.name)]));
    const xpOf = n => { const c=(cloud||[]).find(x=>x.name===n); return c ? c.xp : (S.profiles[n]?S.profiles[n].xp:0); };
    const SEED = ['Hudson','David','John'];
    const note = cloud ? 'Cloud save is on. Pick your name and your progress follows you to any device.' : (SYNC.url ? 'The cloud is not reachable right now, so this browser\'s saved progress is being used. It will sync when the connection comes back.' : 'Each profile keeps its own XP, badges, and progress.');
    profileModal.pending = false; if(document.getElementById('modal')) return;
    const bg = document.createElement('div'); bg.className='modal-bg'; bg.id='modal';
    bg.innerHTML = `<div class="modal"><h2>Who's climbing today?</h2><p class="muted">${note}</p>
      <div class="profiles">${names.map(n=>`<div class="pcard" data-act="pick" data-n="${esc(n)}" tabindex="0"><div class="pn">${esc(n)}</div><div class="px">${fmt(xpOf(n))} XP · ${rankOf(xpOf(n))[0]}${(cloud||[]).some(c=>c.name===n)?' ☁':''}</div></div>`).join('')}
        ${SEED.filter(n=>!names.includes(n)).map(n=>`<div class="pcard" data-act="pick" data-n="${n}" tabindex="0"><div class="pn">${n}</div><div class="px">new</div></div>`).join('')}</div>
      <div style="display:flex;gap:.5rem;align-items:center;flex-wrap:wrap"><input type="text" id="newname" placeholder="or another name"> <button class="btn sm" data-act="picknew">Add</button></div>
      ${S.active?`<p style="margin-top:1rem"><button class="btn ghost sm" data-act="closemodal">Cancel</button></p>`:''}</div>`;
    document.body.appendChild(bg);
  }
  /* The first thing anyone does on the mountain is name their hero. */
  function heroModal(){
    if(document.getElementById('modal')) return; const p=P(); if(!p) return;
    const bg = document.createElement('div'); bg.className='modal-bg'; bg.id='modal';
    bg.innerHTML = `<div class="modal"><span class="eyebrow">Character creation</span><h2>Name your hero</h2><p class="muted">Every climber on Olympus gets a name for the mountain. It goes on your rank-ups and your trophy case. You can change it later on the Progress page.</p>
      <div style="display:flex;gap:.6rem;flex-wrap:wrap;margin:.6rem 0 1rem"><input type="text" id="hero-in" placeholder="e.g. ${esc(p.name)} the Unbending" style="flex:1;min-width:220px"></div>
      <div style="display:flex;gap:.6rem;flex-wrap:wrap"><button class="btn gold" data-act="herosave">That's my name</button> <button class="btn ghost" data-act="heroskip">Later</button></div></div>`;
    document.body.appendChild(bg); setTimeout(()=>{ const el=document.getElementById('hero-in'); if(el) el.focus(); }, 60);
  }
  function closeModal(){ const m=document.getElementById('modal'); if(m) m.remove(); }

  // ---------- actions ----------
  document.addEventListener('click', e=>{
    const t = e.target.closest('[data-act]'); if(!t) return;
    const act = t.dataset.act; const p = P();
    if(act==='switch') return profileModal();
    if(act==='closemodal') return closeModal();
    if(act==='backtoprofiles'){ closeModal(); return profileModal(); }
    if(act==='pick' || act==='picknew'){ const n = act==='pick' ? t.dataset.n : (document.getElementById('newname').value||'').trim(); if(!n) return; return loginProfile(n); }
    if(act==='hero'){ return heroModal(); }
    if(act==='herosave'){ const v=(document.getElementById('hero-in').value||'').trim(); if(v){ p.hero=v; save(); SFX.correct(); toast(`⚔ Welcome to the mountain, <b>${esc(v)}</b>`, true); } closeModal(); return route(); }
    if(act==='heroskip'){ return closeModal(); }
    if(act==='sound'){ soundOn=!soundOn; localStorage.setItem('olympus.sound', soundOn?'on':'off'); if(soundOn) SFX.page(); return updateTop(true); }
    if(act==='pagenext'){ SFX.page(); return; }
    if(act==='syncnow'){ toast('Syncing…'); return pushProfile(); }
    if(act==='setsyncurl'){ const v=(document.getElementById('syncurl').value||'').trim(); if(v && !/^https:\/\/script\.google\.com\/macros\/s\/.+\/exec$/.test(v)){ toast('That does not look like an Apps Script /exec URL.'); return; } localStorage.setItem('olympus.sync', v); toast('Saved. Reloading…'); setTimeout(()=>location.reload(), 600); return; }
    if(act==='teacher'){ if(!canTeach()){ teacherMode=false; return; } teacherMode = !teacherMode; toast(teacherMode?'Teacher mode on':'Teacher mode off'); return route(); }
    if(act==='again'){ const pid=t.dataset.pid; const ps = PS[pid] || (PS[pid]={hints:0,wrong:0}); ps.again=true; SFX.page(); return rerenderProblem(pid, false); }
    if(act==='check' || act==='hint' || act==='reveal'){
      const pid = t.dataset.pid; let prob=null, labor=false;
      for(const u of OLY.units){ for(const s of u.sessions){ const x=(s.practice||[]).find(q=>q.id===pid); if(x) prob=x; } const y=u.labor.problems.find(q=>q.id===pid); if(y){ prob=y; labor=true; } }
      if(!prob) return; const ps = PS[pid] || (PS[pid]={hints:0,wrong:0}); const st = p.probs[pid] || (p.probs[pid]={ok:false,tries:0,hints:0,xp:0});
      if(act==='hint'){ ps.hints++; st.hints=Math.max(st.hints||0, ps.hints); save(); SFX.hint(); return rerenderProblem(pid, labor); }
      if(act==='reveal'){ ps.revealed=true; SFX.hint(); return rerenderProblem(pid, labor); }
      let raw; if(prob.type==='mc'){ const c=document.querySelector(`input[name="${pid}"]:checked`); if(!c){ fb(pid,'info','Pick one first.'); return; } raw=c.value; } else { raw=document.getElementById('in-'+pid).value; }
      const res = checkAnswer(prob, raw);
      if(res===null){ fb(pid,'info','That is not a number I can read. Try digits, like 12.5 or 3/4 or 4e8.'); return; }
      if(ps.again){
        if(res){ const earned=Math.max(1,Math.round((prob.xp||10)*0.25)); st.repeats=(st.repeats||0)+1; ps.again=false; save(); SFX.correct(); addXP(earned,'practised again',{quiet:true}); rerenderProblem(pid,labor); fb(pid,'good',pick(['Still got it.','Second time round and just as right.','Practice banked. That is how it sticks.'])); }
        else { SFX.miss(); shakeInput(pid); fb(pid,'bad','Not this time. Have another go, or leave it; you already earned this one.'); }
        return;
      }
      st.tries=(st.tries||0)+1; st.last=raw;
      if(res){
        const base = prob.xp||10; let mult = labor ? Math.max(0.5, 1-0.1*ps.wrong) : Math.max(0.3, 1-0.2*ps.hints-0.1*ps.wrong);
        const earned = Math.round(base*mult); st.ok=true; st.xp=earned; st.solved=Date.now(); save();
        SFX.correct(); addXP(earned, labor?'Labor':'correct', {quiet:true}); rerenderProblem(pid, labor);
        fb(pid,'good', pickPraise(ps));
        afterSolve(pid, labor);
      } else {
        ps.wrong++; save(); SFX.miss(); rerenderProblem(pid, labor); shakeInput(pid);
        fb(pid,'bad', ps.wrong===1?pick(['Not yet. Check your units and your arithmetic, then go again.','Close, but not it. Write the units next to every number and look again.','Not that one. Re-read the question slowly; the trap is usually in the wording.']):(labor?'Still no. Re-read the part. Draw it.':'Still no. Take a hint, or go back a screen and re-read the story.'));
      }
      return;
    }
    if(act==='warmcheck'){ const f=findSession(currentSession()); const w=f.s.warmup; let raw; if(w.type==='mc'){ const c=document.querySelector('input[name="warm"]:checked'); if(!c) return; raw=c.value; } else raw=document.getElementById('warm-in').value;
      const ok = checkAnswer(w, raw); document.getElementById('warm-fb').innerHTML = `<div class="fb ${ok?'good':'bad'}">${ok?pick(['That is it. Warmed up.','Exactly right. Brain is on.','Correct, and quick. Good start.','Yes. Now the real thing.']):pick(['Not that. One more try, or take the hint.','Not quite. Have another look.'])}</div>`;
      if(ok){ SFX.correct(); const ss=p.sessions[f.s.id]; if(!ss.warm){ ss.warm=true; save(); addXP(5,'warm-up',{quiet:true}); } document.getElementById('warm-sol').style.display='block'; } else { SFX.miss(); } return; }
    if(act==='warmreveal'){ SFX.hint(); document.getElementById('warm-sol').style.display='block'; return; }
    if(act==='applycheck'){ const f=findSession(currentSession()); const ss=p.sessions[f.s.id]; ss.apply=ss.apply||[]; ss.apply[Number(t.dataset.k)]=t.checked; const all = f.s.apply.checklist.every((c,k)=>ss.apply[k]); if(all && !ss.applyBonus){ ss.applyBonus=true; addXP(10,'apply'); } save(); return; }
    if(act==='savelog'){ const f=findSession(currentSession()); const ss=p.sessions[f.s.id]; ss.log=document.getElementById('log-in').value.trim(); if(ss.log && !ss.logXp){ ss.logXp=true; addXP(5,'log'); } save(); toast('Saved'); return renderSession(f.s.id,'log'); }
    if(act==='codexsave'){ const term=t.dataset.term; const v=document.getElementById('cx-'+term).value.trim(); if(!v) return; const c=p.codex[term]||(p.codex[term]={}); c.def=v; if(!c.xp){ c.xp=true; addXP(10,'Codex'); } save(); return renderCodex(); }
    if(act==='award'){ award(t.dataset.b, 'awarded in teacher mode'); return setTimeout(renderBadges, 50); }
    if(act==='unaward'){ delete p.badges[t.dataset.b]; save(); return renderBadges(); }
    if(act==='bdstart'){ return bdStart(Number(t.dataset.w)); }
    if(act==='bdsubmit'){ return bdSubmit(Number(t.dataset.w)); }
    if(act==='export'){ const blob=new Blob([JSON.stringify(S,null,1)],{type:'application/json'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=`olympus-progress-${new Date().toISOString().slice(0,10)}.json`; a.click(); return; }
    if(act==='csv'){ const rows=[['Profile','XP','Rank','Lessons done','Problems solved','Badges']]; for(const n of Object.keys(S.profiles)){ const q=S.profiles[n]; rows.push([n,q.xp,rankOf(q.xp)[0],allSessions().filter(s=>sessionDone(q,s)).length,Object.values(q.probs).filter(x=>x.ok).length,Object.keys(q.badges).length]); } const txt=rows.map(r=>r.join('\t')).join('\n'); navigator.clipboard&&navigator.clipboard.writeText(txt); toast('Copied. Paste into a Sheet.'); return; }
    if(act==='resetask'){ document.getElementById('reset-slot').innerHTML=`<div class="fb bad" style="margin-top:.6rem">This wipes ${esc(p.name)}'s XP, badges, and answers. <button class="btn sm" data-act="resetdo">Yes, reset</button></div>`; return; }
    if(act==='resetdo'){ S.profiles[p.name]=newProfile(p.name); save(); return renderProgress(); }
  });
  document.addEventListener('change', e=>{ const t=e.target; if(t.dataset.act==='import'){ const f=t.files[0]; if(!f) return; const r=new FileReader(); r.onload=()=>{ try{ const inc=JSON.parse(r.result); if(!inc.profiles) throw 0; for(const n of Object.keys(inc.profiles)){ const a=S.profiles[n], b=inc.profiles[n]; if(!a || b.xp>=a.xp) S.profiles[n]=b; } save(); toast('Loaded'); route(); }catch(err){ toast('That file did not look like a progress file.'); } }; r.readAsText(f); } });
  document.addEventListener('keydown', e=>{ if(e.key==='Enter' && e.target.matches('input[type=text]')){ const id=e.target.id; if(id.startsWith('in-')){ const b=document.querySelector(`[data-act="check"][data-pid="${id.slice(3)}"]`); if(b) b.click(); } else if(id==='warm-in'){ const b=document.querySelector('[data-act="warmcheck"]'); if(b) b.click(); } else if(id==='bd-in'){ const b=document.querySelector('[data-act="bdsubmit"]'); if(b) b.click(); } else if(id==='hero-in'){ const b=document.querySelector('[data-act="herosave"]'); if(b) b.click(); } else if(id==='newname'){ const b=document.querySelector('[data-act="picknew"]'); if(b) b.click(); } } });

  function fb(pid, kind, msg){ const el=document.getElementById('fb-'+pid); if(el) el.innerHTML=`<div class="fb ${kind}">${msg}</div>`; }
  function shakeInput(pid){ if(reduced) return; const el=document.getElementById('in-'+pid); if(el){ el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake'); } }
  function pickPraise(ps){ const clean = !ps.hints && !ps.wrong; return pick(clean ? ['Clean. First try, no hints.','Exactly right. Zeus nods approvingly.','Nailed it. Feynman would ask you to explain it now.','That is it. Write that method in the Codex.','Correct, and you got there the efficient way.','Right first time. Notice what happened to the units.'] : ['Correct. The road matters less than the arrival.','Got there. Now do the next one without the hint.','Right. Wrong answers were data; you used them.','That is it. Slower, but yours.']); }
  function rerenderProblem(pid, labor){
    let prob=null, idx=0; for(const u of OLY.units){ for(const s of u.sessions){ const k=(s.practice||[]).findIndex(q=>q.id===pid); if(k>=0){ prob=s.practice[k]; idx=k; } } const k=u.labor.problems.findIndex(q=>q.id===pid); if(k>=0){ prob=u.labor.problems[k]; idx=k; } }
    const el=document.getElementById('prob-'+pid); if(!el||!prob) return; const wrap=document.createElement('div'); wrap.innerHTML=problemHtml(prob, idx, {labor}); el.replaceWith(wrap.firstElementChild);
  }
  function afterSolve(pid, labor){
    const p=P();
    if(labor){ for(const u of OLY.units){ if(u.labor.problems.some(q=>q.id===pid) && laborDone(p,u)){ award(u.badge, `Labor ${u.num} complete`); setTimeout(()=>renderLabor(u.id), 1200); } } return; }
    const sid=currentSession(); const f=findSession(sid); if(!f) return; const ss=p.sessions[sid];
    const sum=document.getElementById('sess-summary'); if(sum) sum.innerHTML=sessionSummary(f.s);
    if(sessionDone(p,f.s) && !ss.bonus){ ss.bonus=true; save(); setTimeout(()=>{ addXP(20,'lesson cleared'); sparkle(LAST.x, LAST.y, 22); const doneCount=allSessions().filter(s=>sessionDone(p,s)).length; if(doneCount>=10) award('ironpencil','ten lessons'); renderSession(sid,'practice'); }, 900); }
  }
  function sessionSummary(s){ const p=P(); const ss=p.sessions[s.id]||{}; const nProb=sessionProblems(s).length, nOk=sessionProblems(s).filter(x=>p.probs[x.id]&&p.probs[x.id].ok).length; return sessionDone(p,s)?`<div class="fb good">Lesson cleared: ${nOk}/${nProb}. ${ss.bonus?'Bonus banked.':''}</div>`:`<div class="fb info">${nOk}/${nProb} solved. Clear them all for a 20 XP bonus.</div>`; }
  function currentSession(){ const m=location.hash.match(/#\/session\/([^\/]+)/); return m?m[1]:null; }

  // ---------- router ----------
  function route(){
    if(!S.active || !S.profiles[S.active]){ app.innerHTML=''; updateTop(); if(!document.getElementById('modal')) profileModal(); return; }
    const h = location.hash || '#/'; const parts = h.replace(/^#\//,'').split('/');
    switch(parts[0].split('#')[0]){
      case '': { renderHome(); const anchor = h.split('#')[2]; if(anchor){ const el=document.getElementById(anchor); if(el) el.scrollIntoView({behavior:'smooth',block:'start'}); } return; }
      case 'start': return renderStart();
      case 'unit': return renderUnit(parts[1]);
      case 'session': return renderSession(parts[1], parts[2]);
      case 'labor': return renderLabor(parts[1]);
      case 'quest': return renderQuest(parts[1]);
      case 'codex': return renderCodex();
      case 'badges': return renderBadges();
      case 'beatdad': return renderBeatDad();
      case 'progress': return renderProgress();
      case 'print': return renderPrint(parts[1], parts[2]);
      default: return renderHome();
    }
  }
  window.addEventListener('hashchange', route);
  // expose for testing
  OLY._ = { checkAnswer, parseNum, state:()=>S, setTeacher:v=>{teacherMode=!!v&&canTeach(); route();}, addXP, award, celebrate, storyScreens, RANKS, sfx:SFX };
  route();
})();
