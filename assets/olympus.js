/* Project Olympus Workbench engine. Vanilla JS, no build step, runs from a local file. */
(function(){
  const OLY = window.OLY;
  const KEY = 'olympus.v1';
  const RANKS = [['Mortal',0],['Hero',1500],['Demigod',3500],['Titan',6000],['Olympian',9000]];
  let S = load();
  let dadMode = false;
  const PS = {}; // transient per-problem state: {hints, wrong}

  // ---------- cloud sync (optional; Google Apps Script backend, see cloud/Code.gs) ----------
  const SYNC = { url: (((OLY.config||{}).syncUrl)||'').trim() || (localStorage.getItem('olympus.sync')||'').trim(), status:'off', timer:null, cloud:null };
  const PINS = {}; try{ Object.assign(PINS, JSON.parse(sessionStorage.getItem('olympus.pins')||'{}')); }catch(e){}
  function rememberPin(n,pin){ PINS[n]=pin; try{ sessionStorage.setItem('olympus.pins', JSON.stringify(PINS)); }catch(e){} }
  async function api(params, body){
    const u = SYNC.url + (SYNC.url.includes('?')?'&':'?') + new URLSearchParams(params).toString();
    const opt = body ? { method:'POST', body:JSON.stringify(body), redirect:'follow' } : { redirect:'follow', cache:'no-store' };
    const r = await fetch(u, opt); if(!r.ok) throw new Error('http '+r.status); return r.json();
  }
  function setSync(status){ SYNC.status=status; const el=document.getElementById('sync-chip'); if(el){ el.textContent = ({off:'',synced:'☁ saved',saving:'☁ saving…',offline:'☁ offline',connecting:'☁ …'})[status]||''; el.className='chip sync '+status; el.title = ({synced:'Progress is saved to the cloud',saving:'Saving…',offline:'Cloud unreachable; progress is kept in this browser and will sync when it can. Click to retry.',connecting:'Connecting…'})[status]||''; } }
  function scheduleSync(){ if(!SYNC.url || !S.active || !PINS[S.active]) return; clearTimeout(SYNC.timer); SYNC.dirty=true; setSync('saving'); SYNC.timer=setTimeout(pushProfile, 1500); }
  async function pushProfile(){
    const p=P(); if(!p||!SYNC.url) return; const pin=PINS[p.name]; if(!pin){ setSync('offline'); return; }
    clearTimeout(SYNC.timer); SYNC.dirty=false;
    try{
      const res = await api({action:'save'}, {action:'save', profile:p.name, pin, data:p, rank:rankOf(p.xp)[0], sessionsDone: allSessions().filter(s=>sessionDone(p,s)).length});
      if(res.ok){ p.cloudUpdated=res.updated; setSync(SYNC.dirty?'saving':'synced'); }
      else { setSync('offline'); if(res.error==='bad pin'){ delete PINS[p.name]; rememberPin(p.name, undefined); toast('Cloud save refused: wrong PIN. Switch profile and sign in again.'); } }
    }catch(e){ setSync('offline'); }
  }
  async function loginProfile(n, pin){
    const fb=document.getElementById('pin-fb'); const bad = m => { if(fb) fb.innerHTML=`<div class="fb bad">${m}</div>`; };
    try{
      const inCloud = (SYNC.cloud||[]).some(c=>c.name===n);
      if(inCloud){
        const r = await api({action:'load', profile:n, pin}); if(!r.ok){ bad(r.error==='bad pin'?'Nope. Try again.':'Cloud said: '+esc(r.error)); return; }
        const local=S.profiles[n]; const cloudData=r.data||{}; cloudData.name=n;
        const keepLocal = local && (local.updated||0) > (r.updated||0) && (local.xp||0) >= (cloudData.xp||0);
        if(!keepLocal) S.profiles[n] = Object.assign(newProfile(n), cloudData);
      } else {
        if(!/^\d{4}$/.test(pin)){ bad('Pick four digits for your PIN.'); return; }
        if(!S.profiles[n]) S.profiles[n]=newProfile(n);
      }
      rememberPin(n,pin); S.active=n; save(); closeModal(); route(); pushProfile();
    }catch(e){ bad('Cannot reach the cloud right now. Check the internet connection, then try again.'); }
  }

  // ---------- storage ----------
  function load(){
    try{ const raw = localStorage.getItem(KEY); if(raw) return JSON.parse(raw); }catch(e){}
    return { v:1, profiles:{}, active:null, dadPin:null };
  }
  function save(){ const p=P(); if(p) p.updated=Date.now(); try{ localStorage.setItem(KEY, JSON.stringify(S)); }catch(e){} scheduleSync(); }
  function P(){ return S.active ? S.profiles[S.active] : null; }
  function newProfile(name){
    return { name, xp:0, probs:{}, sessions:{}, badges:{}, codex:{}, beatdad:{}, created:Date.now() };
  }

  // ---------- utils ----------
  const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const fmt = n => Number.isInteger(n) ? n.toLocaleString() : n.toLocaleString(undefined,{maximumFractionDigits:3});
  function toast(msg, gold){
    const t = document.createElement('div'); t.className = 'toast' + (gold?' gold':''); t.innerHTML = msg;
    document.body.appendChild(t); setTimeout(()=>t.remove(), 3200);
  }
  function rankOf(xp){ let r = RANKS[0]; for(const k of RANKS){ if(xp >= k[1]) r = k; } return r; }
  function nextRank(xp){ for(const k of RANKS){ if(xp < k[1]) return k; } return null; }
  function addXP(n, why){
    const p = P(); if(!p || !n) return;
    const before = rankOf(p.xp)[0]; p.xp += n; save();
    toast(`+${n} XP${why?' · '+why:''}`);
    const after = rankOf(p.xp)[0];
    if(after !== before) setTimeout(()=>toast(`⚡ Rank up: <b>${after}</b>`, true), 700);
    updateTop();
  }
  function award(id, why){
    const p = P(); if(!p || p.badges[id]) return;
    p.badges[id] = Date.now(); save();
    const meta = OLY.badgeMeta.find(b=>b.id===id);
    setTimeout(()=>toast(`🏅 Badge unlocked: <b>${meta?meta.name:id}</b>${why?' · '+why:''}`, true), 400);
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

  // ---------- plots ----------
  OLY.plot = function(o){
    const W=o.w||560, H=o.h||320, m={l:56,r:16,t:16,b:44};
    const [x0,x1]=o.x, [y0,y1]=o.y;
    const sx = x => m.l + (x-x0)/(x1-x0)*(W-m.l-m.r), sy = y => H-m.b - (y-y0)/(y1-y0)*(H-m.t-m.b);
    let g = '';
    const xt = o.xt || niceTicks(x0,x1), yt = o.yt || niceTicks(y0,y1);
    for(const t of xt){ g += `<line x1="${sx(t)}" y1="${sy(y0)}" x2="${sx(t)}" y2="${sy(y1)}" stroke="#eef1f6"/><text x="${sx(t)}" y="${H-m.b+18}" font-size="12" text-anchor="middle" fill="#6b7686">${fmt(t)}</text>`; }
    for(const t of yt){ g += `<line x1="${sx(x0)}" y1="${sy(t)}" x2="${sx(x1)}" y2="${sy(t)}" stroke="#eef1f6"/><text x="${m.l-8}" y="${sy(t)+4}" font-size="12" text-anchor="end" fill="#6b7686">${fmt(t)}</text>`; }
    g += `<line x1="${sx(x0)}" y1="${sy(0>=y0&&0<=y1?0:y0)}" x2="${sx(x1)}" y2="${sy(0>=y0&&0<=y1?0:y0)}" stroke="#1b2433" stroke-width="1.5"/>`;
    g += `<line x1="${sx(0>=x0&&0<=x1?0:x0)}" y1="${sy(y0)}" x2="${sx(0>=x0&&0<=x1?0:x0)}" y2="${sy(y1)}" stroke="#1b2433" stroke-width="1.5"/>`;
    const cols = ['#0e7c86','#b3402b','#c9a227','#2e7d4f','#6b2c84'];
    (o.lines||[]).forEach((L,i)=>{
      const col = L.color||cols[i%cols.length]; let d='', started=false;
      const n=120, xa = L.x0!=null?L.x0:x0, xb = L.x1!=null?L.x1:x1;
      for(let k=0;k<=n;k++){ const x = xa+(xb-xa)*k/n; const y = L.f(x); if(y<y0-1e-9||y>y1+1e-9){ started=false; continue; } d += (started?'L':'M')+sx(x).toFixed(1)+','+sy(y).toFixed(1); started=true; }
      g += `<path d="${d}" fill="none" stroke="${col}" stroke-width="3"/>`;
      if(L.label){ const lx = L.lx!=null?L.lx:xb*0.75; const ly = L.f(lx); g += `<text x="${sx(lx)+6}" y="${sy(ly)-8}" font-size="13" font-weight="700" fill="${col}">${esc(L.label)}</text>`; }
    });
    (o.points||[]).forEach(pt=>{ g += `<circle cx="${sx(pt[0])}" cy="${sy(pt[1])}" r="5" fill="#1b2433"/>`; if(pt[2]) g += `<text x="${sx(pt[0])+8}" y="${sy(pt[1])-8}" font-size="12" fill="#1b2433">${esc(pt[2])}</text>`; });
    g += `<text x="${(m.l+W-m.r)/2}" y="${H-6}" font-size="13" text-anchor="middle" fill="#1b2433">${esc(o.xl||'x')}</text>`;
    g += `<text transform="translate(14,${(m.t+H-m.b)/2}) rotate(-90)" font-size="13" text-anchor="middle" fill="#1b2433">${esc(o.yl||'y')}</text>`;
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
      case 'decoder': return `<div class="decoder"><div class="lbl">Decoder</div><div class="term">${esc(b.term)}</div><div>${b.def}</div>${b.ex?`<div class="small muted" style="margin-top:.3rem">${b.ex}</div>`:''}</div>`;
      case 'thread': { const lbl = {matmath:'Mat Math',magic:'Mathemagic',greek:'Greek Origins',story:'The Story',example:'Worked Example',paper:'On Paper'}[b.kind]||b.kind; return `<div class="thread ${b.kind}"><div class="lbl">${lbl}${b.title?' · '+esc(b.title):''}</div>${b.html}</div>`; }
      case 'formula': return `<div class="formula">${b.html}</div>`;
      case 'plot': return OLY.plot(b.spec);
      case 'table': return `<table><tr>${b.head.map(h=>`<th>${h}</th>`).join('')}</tr>${b.rows.map(r=>`<tr>${r.map(c=>`<td>${c}</td>`).join('')}</tr>`).join('')}</table>`;
      default: return `<div class="block">${b.html||''}</div>`;
    }
  }
  function problemHtml(p, i, opts){
    const prof = P(); const st = prof.probs[p.id] || {}; const ps = PS[p.id] || (PS[p.id]={hints:0,wrong:0});
    const labor = !!opts.labor;
    let input = '';
    if(p.type==='mc'){
      input = `<div class="choices">${p.choices.map((c,k)=>`<label><input type="radio" name="${p.id}" value="${k}" ${st.ok&&k===p.ans?'checked':''} ${st.ok?'disabled':''}> <span>${c}</span></label>`).join('')}</div>`;
    } else {
      input = `<input type="text" id="in-${p.id}" placeholder="${p.type==='text'?'your answer':'number'}" value="${st.ok?esc(st.last||''):''}" ${st.ok?'disabled':''}> ${p.unit?`<span class="unit">${esc(p.unit)}</span>`:''}`;
    }
    const canHint = !labor && !st.ok && (p.hints||[]).length>ps.hints;
    const hintsShown = (p.hints||[]).slice(0, ps.hints).map((h,k)=>`<div class="hint"><b>Hint ${k+1}.</b> ${h}</div>`).join('');
    const allHints = ps.hints >= (p.hints||[]).length;
    const canReveal = dadMode || (!labor && !st.ok && ps.wrong>=2 && allHints);
    const showSol = dadMode || (ps.revealed && !labor) || st.ok;
    return `<div class="prob ${st.ok?'ok':''} ${labor?'labor':''}" id="prob-${p.id}">
      <div class="head"><span class="n">${labor?'Part':'Problem'} ${i+1} ${tagHtml(p.tags)}</span><span class="xp">${st.ok?`✓ earned ${st.xp} XP`:`${p.xp||10} XP`}</span></div>
      <div class="q">${p.q}</div>
      ${p.type==='mc'?input:''}
      <div class="ans">${p.type==='mc'?'':input}
        ${st.ok?'':`<button class="btn sm" data-act="check" data-pid="${p.id}">Check</button>`}
        ${canHint?`<button class="btn sm ghost" data-act="hint" data-pid="${p.id}">Hint (${ps.hints+1}/${p.hints.length})</button>`:''}
        ${canReveal && !showSol ? `<button class="btn sm ghost" data-act="reveal" data-pid="${p.id}">Show worked solution</button>`:''}
      </div>
      ${p.paper?`<div class="small muted" style="margin-top:.4rem">✎ Work this one on paper first. Type only the answer.</div>`:''}
      <div class="hints">${hintsShown}</div>
      <div class="fb-slot" id="fb-${p.id}"></div>
      ${showSol && p.sol ? `<div class="sol"><div class="lbl">${dadMode&&!st.ok?'Answer key':'Worked solution'}</div><div><b>Answer: ${esc(answerText(p))}</b></div>${p.sol}</div>` : (dadMode?`<div class="sol"><div class="lbl">Answer key</div><b>${esc(answerText(p))}</b></div>`:'')}
    </div>`;
  }

  // ---------- views ----------
  function view(html){ app.innerHTML = html; window.scrollTo(0,0); updateTop(); }
  function crumbs(parts){ return `<div class="crumb">${parts.map(p=>p.href?`<a href="${p.href}">${p.t}</a>`:p.t).join(' › ')}</div>`; }

  function renderHome(){
    const p = P(); const r = rankOf(p.xp); const nr = nextRank(p.xp);
    const unitRows = OLY.units.map(u=>{
      const done = u.sessions.filter(s=>sessionDone(p,s)).length;
      const hasBadge = !!p.badges[u.badge];
      return `<a class="unitrow" href="#/unit/${u.id}">
        <div class="num">${u.num}</div>
        <div><div class="display" style="font-weight:700;font-size:1.1rem">${esc(u.title)}</div><div class="muted small">${esc(u.subtitle||'')} · ${u.weeks} week${u.weeks>1?'s':''} · ${done}/${u.sessions.length} sessions</div>
          <div class="progress-dots">${u.sessions.map(s=>`<i class="${sessionDone(p,s)?'ok':(p.sessions[s.id]&&p.sessions[s.id].seen?'try':'')}"></i>`).join('')}</div></div>
        <div class="badge-mini ${hasBadge?'':'locked'}" style="${hasBadge?'':'filter:grayscale(1);opacity:.35'}">${OLY.badgeArt[u.badge]||''}</div>
      </a>`;
    }).join('');
    const future = [[2,'Money Math'],[3,"Daedalus' Workshop"],[4,'The Physics of Motion'],[5,'The Infinity Machine'],[6,'Chance and Patterns'],[7,"Prometheus' Fire"],[8,'The Human Machine'],[9,"Hermes' Map"],[10,'The Final Labor']]
      .filter(f=>!OLY.units.some(u=>u.num===f[0]))
      .map(f=>`<div class="unitrow locked"><div class="num">${f[0]}</div><div><div class="display" style="font-weight:700">${f[1]}</div><div class="muted small">Coming when you get there</div></div><div></div></div>`).join('');
    view(`
      <div class="hero"><h1>Welcome back, <span class="gold">${esc(p.name)}</span>.</h1>
        <div class="sub">Rank: <b class="gold">${r[0]}</b> · ${fmt(p.xp)} XP${nr?` · ${fmt(nr[1]-p.xp)} XP to ${nr[0]}`:' · Top of the mountain'} · Badges: ${Object.keys(p.badges).length}</div>
        <div style="margin-top:.9rem"><a class="btn gold" href="#/start">Start Here: the rules of the game</a> <a class="btn ghost" style="color:#fff;border-color:#8892a6" href="#/beatdad">Beat Dad Friday</a></div>
      </div>
      <h2>The Map</h2>
      <div class="unitlist">${unitRows}${future}</div>
      <p class="footer-note">Project Olympus · The Language of Everything · by David Balyeat, with Claude</p>`);
  }

  function renderStart(){
    view(`${crumbs([{t:'Home',href:'#/'},{t:'Start Here'}])}<div class="card">${OLY.intro}</div>`);
  }

  function renderUnit(id){
    const u = findUnit(id); if(!u) return renderHome();
    const p = P();
    const sess = u.sessions.map(s=>{ const d = sessionDone(p,s); return `<a class="sess ${d?'done':''} ${s.lab?'lab':''}" href="#/session/${s.id}/warmup">
        <div class="day">Week ${s.week} · Day ${s.day}${s.lab?' · Lab Day':''}</div><div class="t">${esc(s.title)}</div><div class="st">${esc(s.subtitle||'')}</div>
        <div class="progress-dots">${sessionProblems(s).map(x=>`<i class="${p.probs[x.id]&&p.probs[x.id].ok?'ok':(p.probs[x.id]?'try':'')}"></i>`).join('')}</div>${d?'<span class="check">✓</span>':''}</a>`; }).join('');
    const ld = laborDone(p,u);
    view(`${crumbs([{t:'Home',href:'#/'},{t:'Unit '+u.num}])}
      <div class="hero"><h1>Unit ${u.num}: ${esc(u.title)}</h1><div class="sub">${u.intro||''}</div></div>
      <h2>Sessions</h2><div class="sessions">${sess}</div>
      <h2 style="margin-top:1.4rem">Labor and Quest</h2>
      <div class="grid two">
        <a class="sess ${ld?'done':''}" href="#/labor/${u.id}"><div class="day">Labor ${u.num} · no hints</div><div class="t">${esc(u.labor.title)}</div><div class="st">Beat it to earn the <b>${esc((OLY.badgeMeta.find(b=>b.id===u.badge)||{}).name||'')}</b> badge.</div>${ld?'<span class="check">✓</span>':''}</a>
        <a class="sess" href="#/quest/${u.id}"><div class="day">Quest ${u.num+1} · at home</div><div class="t">${esc(u.quest.title)}</div><div class="st">Clues, a lock, and a box. Dad sets it up.</div></a>
      </div>
      ${dadMode?`<div class="dadonly"><div class="lbl">Dad mode</div>Print: <a href="#/print/teacher/${u.id}">Teacher's Edition (with answers)</a> · <a href="#/print/student/${u.id}">Student practice sheets</a></div>`:''}`);
  }

  function renderSession(id, tab){
    const f = findSession(id); if(!f) return renderHome();
    const {s,u} = f; const p = P();
    const ss = p.sessions[s.id] || (p.sessions[s.id] = {}); if(!ss.seen){ ss.seen = true; save(); }
    tab = tab || 'warmup';
    const tabs = [['warmup','Warm-up','5 min'],['story','The Story','10-15 min'],['practice','Practice','20 min'],['apply','Apply','10-15 min'],['log','Log','2 min']];
    const nProb = sessionProblems(s).length, nOk = sessionProblems(s).filter(x=>p.probs[x.id]&&p.probs[x.id].ok).length;
    let body = '';
    if(tab==='warmup'){
      const w = s.warmup;
      body = `<div class="card"><h3>Warm-up</h3><div class="q">${w.q}</div>
        ${w.type==='mc' ? `<div class="choices">${w.choices.map((c,k)=>`<label><input type="radio" name="warm" value="${k}"> <span>${c}</span></label>`).join('')}</div>` : `<div class="ans"><input type="text" id="warm-in" placeholder="answer"></div>`}
        <div style="margin-top:.6rem"><button class="btn sm" data-act="warmcheck">Check</button> <button class="btn sm ghost" data-act="warmreveal">Reveal</button></div>
        <div id="warm-fb"></div>
        <div id="warm-sol" style="display:none" class="sol"><div class="lbl">Answer</div>${w.reveal||''}</div>
        ${ss.warm?`<div class="fb good">Warm-up done (+5 XP earned)</div>`:''}</div>`;
    } else if(tab==='story'){
      body = `<div class="card">${(s.story||[]).map(blockHtml).join('')}</div>`;
    } else if(tab==='practice'){
      const done = sessionDone(p,s);
      body = `<div class="thread paper" style="margin-top:0"><div class="lbl">On Paper</div>Paper first, always. Write the problem, draw it if it has a shape, work it out, <i>then</i> type the answer here. The checker tells you right or wrong instantly. Hints cost a little XP. Two wrong tries plus all hints unlocks the worked solution.</div>
        ${sessionProblems(s).map((x,i)=>problemHtml(x,i,{})).join('')}
        <div id="sess-summary">${sessionSummary(s)}</div>`;
    } else if(tab==='apply'){
      const a = s.apply; ss.apply = ss.apply || [];
      body = `<div class="card"><h3>${esc(a.title||'Apply')}</h3>${a.intro||''}
        ${a.steps?`<ol class="steps">${a.steps.map(x=>`<li>${x}</li>`).join('')}</ol>`:''}
        ${a.checklist?`<h4 style="margin-top:1rem">Done when</h4><div class="checklist">${a.checklist.map((c,k)=>`<label><input type="checkbox" data-act="applycheck" data-k="${k}" ${ss.apply[k]?'checked':''}> <span>${c}</span></label>`).join('')}</div>`:''}
        ${ss.applyBonus?`<div class="fb good">Apply complete (+10 XP earned)</div>`:''}
        ${dadMode&&a.dad?`<div class="dadonly"><div class="lbl">Dad notes</div>${a.dad}</div>`:''}</div>`;
    } else if(tab==='log'){
      body = `<div class="card"><h3>Log</h3><p>One sentence. What clicked today? (Or what didn't. That counts too.)</p>
        <textarea id="log-in">${esc(ss.log||'')}</textarea>
        <div style="margin-top:.6rem"><button class="btn" data-act="savelog">Save log</button> ${ss.logXp?'<span class="muted small">Logged (+5 XP earned)</span>':''}</div>
        <hr><div class="kv"><b>Problems</b><span>${nOk}/${nProb} solved</span><b>Warm-up</b><span>${ss.warm?'done':'not yet'}</span><b>Apply</b><span>${ss.applyBonus?'done':'not yet'}</span></div>
        ${s.feynman?`<div class="thread story" style="margin-top:1rem"><div class="lbl">Feynman Badge prompt</div>${s.feynman}</div>`:''}
        </div>`;
    }
    const idx = allSessions().findIndex(x=>x.id===s.id); const all = allSessions(); const prev = all[idx-1], next = all[idx+1];
    view(`${crumbs([{t:'Home',href:'#/'},{t:'Unit '+u.num,href:'#/unit/'+u.id},{t:s.title}])}
      <div class="sessionbar"><div><div class="muted small">Week ${s.week} · Day ${s.day}${s.lab?' · Lab Day':''} ${tagHtml(s.tags)}</div><h1 style="margin:0">${esc(s.title)}</h1><div class="muted">${esc(s.subtitle||'')}</div></div>
        <div class="no-print">${dadMode?`<a class="btn sm ghost" href="#/print/session/${s.id}">Print this session</a>`:''}</div></div>
      <div class="tabs">${tabs.map(t=>`<a class="${tab===t[0]?'on':''}" href="#/session/${s.id}/${t[0]}">${t[1]}<span class="k">${t[2]}</span>${t[0]==='practice'?`<span class="k">${nOk}/${nProb}</span>`:''}</a>`).join('')}</div>
      ${body}
      <div class="nextprev">${prev?`<a class="btn ghost" href="#/session/${prev.id}/warmup">← ${esc(prev.title)}</a>`:'<span></span>'}${next?`<a class="btn ghost" href="#/session/${next.id}/warmup">${esc(next.title)} →</a>`:`<a class="btn ghost" href="#/labor/${u.id}">Labor ${u.num} →</a>`}</div>`);
  }

  function renderLabor(uid){
    const u = findUnit(uid); if(!u) return renderHome(); const p = P(); const L = u.labor; const done = laborDone(p,u);
    view(`${crumbs([{t:'Home',href:'#/'},{t:'Unit '+u.num,href:'#/unit/'+u.id},{t:'Labor '+u.num}])}
      <div class="hero" style="background:linear-gradient(135deg,#3a1f18,#7a2e20)"><div class="muted small" style="color:#f3d9d3">LABOR ${u.num} · NO HINTS · RETRIES ALLOWED</div><h1>${esc(L.title)}</h1><div class="sub">${L.intro||''}</div></div>
      ${L.problems.map((x,i)=>problemHtml(x,i,{labor:true})).join('')}
      ${done?`<div class="fb good">Labor ${u.num} complete. The ${esc((OLY.badgeMeta.find(b=>b.id===u.badge)||{}).name)} badge is yours.</div>`:`<div class="fb info">Beat every part to unlock the unit badge. Wrong answers cost a little XP; giving up costs more.</div>`}
      ${L.after?`<div class="card" style="margin-top:1rem">${L.after}</div>`:''}`);
  }

  function renderQuest(uid){
    const u = findUnit(uid); if(!u) return renderHome(); const Q = u.quest;
    view(`${crumbs([{t:'Home',href:'#/'},{t:'Unit '+u.num,href:'#/unit/'+u.id},{t:'Quest '+u.num}])}
      <div class="hero" style="background:linear-gradient(135deg,#2b3a24,#3f6a3a)"><div class="small" style="color:#d6e8d0">QUEST ${u.num+1} · AT HOME</div><h1>${esc(Q.title)}</h1><div class="sub">${Q.intro||''}</div></div>
      <div class="card"><h3>How it works</h3><p>Each clue is a problem. The answer points to where the next clue is hidden. The last clues give the lock combination. Inside the box: the reward. Dad hides the clues before you start. No hints. No Claude. Pencil and brain.</p>
      ${dadMode?`<div class="dadonly"><div class="lbl">Dad setup (only you can see this)</div>${Q.dad||''}<table><tr><th>Clue</th><th>Answer</th><th>Suggested hiding spot for the next clue</th></tr>${Q.clues.map((c,i)=>`<tr><td>${i+1}</td><td><b>${esc(c.ans)}</b></td><td>${c.spot}</td></tr>`).join('')}</table><p><b>Lock:</b> ${Q.lock}</p><p>Print the clue cards: <a href="#/print/quest/${u.id}">Quest ${u.num+1} clue cards</a></p></div>`
      :`<p class="muted">Clue cards are printed and hidden by Dad. This page is just the briefing.</p><p><b>Clue 1 (to get you started):</b> ${Q.clues[0].q}</p>`}
      </div>`);
  }

  function renderCodex(){
    const p = P(); const seen = new Set(Object.keys(p.sessions).filter(k=>p.sessions[k].seen));
    const items = decoders().filter(d=>seen.has(d.sid) || dadMode);
    view(`${crumbs([{t:'Home',href:'#/'},{t:'Codex'}])}<div class="hero"><h1>The Codex</h1><div class="sub">Every term you meet, defined twice: once by the course, once by you. Your own definition, in your own words, earns 10 XP. By June this is a math dictionary you wrote.</div></div>
      <div class="card">${items.length?items.map(d=>{ const mine = p.codex[d.term]||{}; return `<div class="codex-item"><div class="term">${esc(d.term)} <span class="muted small">· Unit ${d.unit}, ${esc(d.session)}</span></div><div class="small">${d.def}</div>
        <div style="margin-top:.4rem"><input type="text" style="width:100%" id="cx-${esc(d.term)}" placeholder="Your definition, in your words" value="${esc(mine.def||'')}"> <button class="btn sm" style="margin-top:.4rem" data-act="codexsave" data-term="${esc(d.term)}">Save${mine.xp?'':' (+10 XP)'}</button></div></div>`; }).join('')
        :'<p class="muted">Nothing here yet. Terms appear as you open sessions.</p>'}</div>`);
  }

  function renderBadges(){
    const p = P();
    view(`${crumbs([{t:'Home',href:'#/'},{t:'Badges'}])}<div class="hero"><h1>Badge Case</h1><div class="sub">Unit badges come from Labors. The others come from doing something real: teaching, performing, catching the AI, building, showing up.</div></div>
      <div class="rankrow">${RANKS.map(r=>`<div class="rank ${rankOf(p.xp)[0]===r[0]?'on':''}"><div class="rn">${r[0]}</div><div class="rx">${fmt(r[1])} XP</div></div>`).join('')}</div>
      <h2 style="margin-top:1.2rem">Earned and to earn</h2>
      <div class="badges">${OLY.badgeMeta.map(b=>{ const got=!!p.badges[b.id]; return `<div class="badge ${got?'':'locked'}">${OLY.badgeArt[b.id]||''}<div class="bn">${esc(b.name)}</div><div class="bd">${got?'Earned '+new Date(p.badges[b.id]).toLocaleDateString():esc(b.how)}</div>${dadMode&&!got&&(b.cross||true)?`<button class="btn sm gold" style="margin-top:.4rem" data-act="award" data-b="${b.id}">Award</button>`:''}${dadMode&&got?`<button class="btn sm ghost" style="margin-top:.4rem" data-act="unaward" data-b="${b.id}">Revoke</button>`:''}</div>`; }).join('')}</div>
      ${dadMode?`<div class="dadonly" style="margin-top:1rem"><div class="lbl">Dad mode</div>Award the cross-cutting badges when he earns them in real life. <a href="#/print/badges">Print the badge sheet</a> (stickers) or import the SVGs into Orca-Flashforge to slice tokens.</div>`:''}`);
  }

  function renderBeatDad(){
    const p = P(); const names = Object.keys(S.profiles);
    const rows = OLY.beatdad.map(b=>{ const r = p.beatdad[b.week]||{}; const others = names.map(n=>{ const o=S.profiles[n].beatdad[b.week]; return `<td>${o?(o.ok?'✓ ':'✗ ')+o.secs+'s':'—'}</td>`; }).join('');
      return `<tr><td>Week ${b.week}</td>${others}<td>${r.ts?'':`<button class="btn sm" data-act="bdstart" data-w="${b.week}">Start</button>`}</td></tr>`; }).join('');
    view(`${crumbs([{t:'Home',href:'#/'},{t:'Beat Dad Friday'}])}<div class="hero"><h1>Beat Dad Friday</h1><div class="sub">One problem. Same clock. Fastest correct answer wins the week. Each profile gets one shot per week, so Dad: log in as yourself.</div></div>
      <div class="card"><table class="lb"><tr><th>Week</th>${names.map(n=>`<th>${esc(n)}</th>`).join('')}<th></th></tr>${rows}</table><div id="bd-arena"></div></div>`);
  }
  function bdStart(week){
    const b = OLY.beatdad.find(x=>x.week===week); const t0 = Date.now();
    const arena = document.getElementById('bd-arena');
    arena.innerHTML = `<hr><div class="timer" id="bd-timer">0.0 s</div><div class="q" style="font-size:1.15rem;margin:.6rem 0">${b.q}</div><div class="ans"><input type="text" id="bd-in" placeholder="answer" autofocus> <button class="btn" data-act="bdsubmit" data-w="${week}">Submit</button></div><div id="bd-fb"></div>`;
    arena.dataset.t0 = t0; document.getElementById('bd-in').focus();
    const iv = setInterval(()=>{ const el=document.getElementById('bd-timer'); if(!el){ clearInterval(iv); return; } el.textContent = ((Date.now()-t0)/1000).toFixed(1)+' s'; }, 100);
  }
  function bdSubmit(week){
    const b = OLY.beatdad.find(x=>x.week===week); const arena = document.getElementById('bd-arena'); const secs = Math.round((Date.now()-Number(arena.dataset.t0))/100)/10;
    const ok = checkAnswer(b, document.getElementById('bd-in').value); const p = P();
    p.beatdad[week] = {ok:!!ok, secs, ts:Date.now()}; save();
    document.getElementById('bd-fb').innerHTML = `<div class="fb ${ok?'good':'bad'}">${ok?'Correct':'Not quite'} in ${secs} s. ${b.sol?'<div style="font-weight:400;margin-top:.3rem">'+b.sol+'</div>':''}</div>`;
    if(ok) addXP(15, 'Beat Dad Friday');
    setTimeout(()=>renderBeatDad(), 2500);
  }

  function renderProgress(){
    const p = P(); const all = allSessions(); const done = all.filter(s=>sessionDone(p,s)).length;
    const probs = Object.values(p.probs); const ok = probs.filter(x=>x.ok).length; const firstTry = probs.filter(x=>x.ok&&x.tries===1&&!x.hints).length;
    const logs = all.filter(s=>p.sessions[s.id]&&p.sessions[s.id].log).map(s=>`<tr><td>${esc(s.title)}</td><td>${esc(p.sessions[s.id].log)}</td></tr>`).join('');
    view(`${crumbs([{t:'Home',href:'#/'},{t:'Progress'}])}<div class="hero"><h1>${esc(p.name)}'s Progress</h1><div class="sub">${fmt(p.xp)} XP · ${rankOf(p.xp)[0]} · ${done}/${all.length} sessions · ${Object.keys(p.badges).length} badges</div></div>
      <div class="grid three"><div class="card tight center"><div class="display" style="font-size:1.8rem">${ok}</div><div class="muted small">problems solved</div></div><div class="card tight center"><div class="display" style="font-size:1.8rem">${probs.length?Math.round(100*firstTry/Math.max(ok,1)):0}%</div><div class="muted small">solved first try, no hints</div></div><div class="card tight center"><div class="display" style="font-size:1.8rem">${probs.reduce((a,x)=>a+(x.hints||0),0)}</div><div class="muted small">hints used</div></div></div>
      <div class="card"><h3>Logs</h3>${logs?`<table>${logs}</table>`:'<p class="muted">No logs yet.</p>'}</div>
      ${SYNC.url?`<div class="card"><h3>Cloud save</h3><p class="small muted">Status: <b>${({synced:'saved',saving:'saving…',offline:'offline (kept in this browser; will sync when the cloud is reachable)',connecting:'connecting…'})[SYNC.status]||SYNC.status}</b>. Progress saves automatically a moment after every action and loads on any device with your name and PIN.</p><button class="btn sm" data-act="syncnow">Sync now</button></div>`:''}
      <div class="card"><h3>Progress file</h3><p class="small muted">${SYNC.url?'A backup you can keep in the Math Program folder. With cloud save on, you rarely need it.':'Progress lives in this browser. To move it to another computer (or just to keep a backup in the Math Program folder), save the file and open it on the other side. Saving after every session is a good habit; it\'s one click.'}</p>
        <button class="btn" data-act="export">Save progress file</button> <label class="btn ghost" style="cursor:pointer">Load progress file <input type="file" id="imp" accept=".json" style="display:none" data-act="import"></label> <button class="btn ghost" data-act="csv">Copy XP summary for Sheets</button>
        ${dadMode?`<hr><button class="btn ghost" data-act="resetask">Reset this profile…</button><div id="reset-slot"></div>`:''}</div>
      ${dadMode?`<div class="card"><h3>Cloud sync URL (Dad)</h3><p class="small muted">${(OLY.config||{}).syncUrl?'Set in content/config.js for every device. A value entered here overrides it on this device only.':'Not set in content/config.js. Paste the Apps Script Web app URL here to turn on cloud save for this device (better: put it in config.js so every device gets it).'}</p><input type="text" id="syncurl" style="width:100%" placeholder="https://script.google.com/macros/s/…/exec" value="${esc(localStorage.getItem('olympus.sync')||'')}"> <button class="btn sm" style="margin-top:.4rem" data-act="setsyncurl">Save and reload</button></div>`:''}`);
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
    if(kind==='session'){ const f=findSession(id); if(!f) return renderHome(); h = `<h1>Project Olympus · Unit ${f.u.num}</h1>` + printSessionHtml(f.s,f.u,true); }
    else if(kind==='teacher' || kind==='student'){
      const u = findUnit(id); if(!u) return renderHome(); const teacher = kind==='teacher';
      h = `<h1>Project Olympus · Unit ${u.num}: ${esc(u.title)}</h1><div class="meta">${teacher?"Teacher's Edition with answer keys, hints, and solutions":'Student practice sheets. Paper first.'} · The Language of Everything · David Balyeat, with Claude</div>${teacher?`<div style="margin:.6rem 0">${u.intro||''}</div>`:''}`;
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
  function updateTop(){
    const p = P(); const el = document.getElementById('top');
    if(!p){ el.innerHTML = `<span class="brand">PROJECT OLYMPUS<small>THE LANGUAGE OF EVERYTHING</small></span>`; return; }
    const r = rankOf(p.xp), nr = nextRank(p.xp); const pct = nr ? Math.round(100*(p.xp-r[1])/(nr[1]-r[1])) : 100;
    const route = location.hash.split('/')[1]||'';
    el.innerHTML = `<a class="brand" href="#/" style="text-decoration:none">PROJECT OLYMPUS<small>THE LANGUAGE OF EVERYTHING</small></a>
      <nav><a href="#/" class="${route===''?'on':''}">Map</a><a href="#/codex" class="${route==='codex'?'on':''}">Codex</a><a href="#/badges" class="${route==='badges'?'on':''}">Badges</a><a href="#/beatdad" class="${route==='beatdad'?'on':''}">Beat Dad</a><a href="#/progress" class="${route==='progress'?'on':''}">Progress</a></nav>
      <span class="spacer"></span>
      <div class="xpbar"><span>${r[0]}</span><div class="track"><div class="fill" style="width:${pct}%"></div></div><span>${fmt(p.xp)} XP</span></div>
      ${SYNC.url?`<span class="chip sync ${SYNC.status}" id="sync-chip" data-act="syncnow"></span>`:''}
      <span class="chip" data-act="switch" title="Switch profile">👤 ${esc(p.name)}</span>
      <span class="chip dad ${dadMode?'on':''}" data-act="dad" title="Answer keys, awards, printing">${dadMode?'Dad mode ON':'Dad mode'}</span>`;
    if(SYNC.url) setSync(SYNC.status);
  }
  async function profileModal(){
    if(document.getElementById('modal') || profileModal.pending) return; profileModal.pending = true;
    let cloud = null;
    if(SYNC.url){ setSync('connecting'); try{ const r = await api({action:'list'}); if(r.ok){ cloud = r.profiles; setSync('synced'); } else setSync('offline'); }catch(e){ setSync('offline'); } }
    SYNC.cloud = cloud;
    const names = Array.from(new Set([...Object.keys(S.profiles), ...(cloud||[]).map(c=>c.name)]));
    const xpOf = n => { const c=(cloud||[]).find(x=>x.name===n); return c ? c.xp : (S.profiles[n]?S.profiles[n].xp:0); };
    const note = cloud ? 'Cloud save is on. Pick your name and enter your PIN; your progress follows you to any device.' : (SYNC.url ? 'The cloud is not reachable right now, so this browser\'s saved progress is being used. It will sync when the connection comes back.' : 'Each profile keeps its own XP, badges, and progress. Hudson and Dad each get one.');
    profileModal.pending = false; if(document.getElementById('modal')) return;
    const bg = document.createElement('div'); bg.className='modal-bg'; bg.id='modal';
    bg.innerHTML = `<div class="modal"><h2>Who's climbing today?</h2><p class="muted">${note}</p>
      <div class="profiles">${names.map(n=>`<div class="pcard" data-act="pick" data-n="${esc(n)}"><div class="pn">${esc(n)}</div><div class="px">${fmt(xpOf(n))} XP · ${rankOf(xpOf(n))[0]}${(cloud||[]).some(c=>c.name===n)?' ☁':''}</div></div>`).join('')}
        ${!names.includes('Hudson')?`<div class="pcard" data-act="pick" data-n="Hudson"><div class="pn">Hudson</div><div class="px">new</div></div>`:''}${!names.includes('Dad')?`<div class="pcard" data-act="pick" data-n="Dad"><div class="pn">Dad</div><div class="px">new</div></div>`:''}</div>
      <div style="display:flex;gap:.5rem;align-items:center"><input type="text" id="newname" placeholder="or another name"> <button class="btn sm" data-act="picknew">Add</button></div>
      ${S.active?`<p style="margin-top:1rem"><button class="btn ghost sm" data-act="closemodal">Cancel</button></p>`:''}</div>`;
    document.body.appendChild(bg);
  }
  function pinModal(mode){
    const bg = document.createElement('div'); bg.className='modal-bg'; bg.id='modal';
    bg.innerHTML = `<div class="modal"><h2>${mode==='set'?'Set a Dad PIN':'Dad mode'}</h2><p class="muted">${mode==='set'?'Four digits. Dad mode shows answer keys, awards badges, and unlocks printing. (Yes, a clever 13-year-old could dig this out of the browser. If he does, that is a Bug Hunter badge and a conversation.)':'Enter the PIN.'}</p>
      <input type="password" id="pin" inputmode="numeric" maxlength="4" placeholder="••••" style="font-size:1.4rem;letter-spacing:.4em;width:140px"> <button class="btn" data-act="${mode==='set'?'pinset':'pincheck'}">OK</button> <button class="btn ghost" data-act="closemodal">Cancel</button><div id="pin-fb"></div></div>`;
    document.body.appendChild(bg); setTimeout(()=>{ const el=document.getElementById('pin'); if(el) el.focus(); }, 50);
  }
  function profilePinModal(n){
    const isNew = !(SYNC.cloud||[]).some(c=>c.name===n);
    const bg = document.createElement('div'); bg.className='modal-bg'; bg.id='modal';
    bg.innerHTML = `<div class="modal"><h2>${esc(n)}</h2><p class="muted">${isNew?'New profile. Choose a 4-digit PIN. You will use it on every device, so pick one you will remember.':'Enter your PIN.'}</p>
      <input type="password" id="pin" inputmode="numeric" maxlength="4" placeholder="••••" style="font-size:1.4rem;letter-spacing:.4em;width:140px"> <button class="btn" data-act="profilepin" data-n="${esc(n)}">${isNew?'Create':'Sign in'}</button> <button class="btn ghost" data-act="backtoprofiles">Back</button><div id="pin-fb"></div></div>`;
    document.body.appendChild(bg); setTimeout(()=>{ const el=document.getElementById('pin'); if(el) el.focus(); }, 50);
  }
  function closeModal(){ const m=document.getElementById('modal'); if(m) m.remove(); }

  // ---------- actions ----------
  document.addEventListener('click', e=>{
    const t = e.target.closest('[data-act]'); if(!t) return;
    const act = t.dataset.act; const p = P();
    if(act==='switch') return profileModal();
    if(act==='closemodal') return closeModal();
    if(act==='backtoprofiles'){ closeModal(); return profileModal(); }
    if(act==='pick' || act==='picknew'){ const n = act==='pick' ? t.dataset.n : (document.getElementById('newname').value||'').trim(); if(!n) return;
      if(SYNC.url && SYNC.cloud){ closeModal(); return profilePinModal(n); }
      if(!S.profiles[n]) S.profiles[n]=newProfile(n); S.active=n; save(); closeModal(); return route(); }
    if(act==='profilepin'){ const n=t.dataset.n; const v=document.getElementById('pin').value; return loginProfile(n, v); }
    if(act==='syncnow'){ toast('Syncing…'); return pushProfile(); }
    if(act==='setsyncurl'){ const v=(document.getElementById('syncurl').value||'').trim(); if(v && !/^https:\/\/script\.google\.com\/macros\/s\/.+\/exec$/.test(v)){ toast('That does not look like an Apps Script /exec URL.'); return; } localStorage.setItem('olympus.sync', v); toast('Saved. Reloading…'); setTimeout(()=>location.reload(), 600); return; }
    if(act==='dad'){ if(dadMode){ dadMode=false; return route(); }
      if(SYNC.url && SYNC.status!=='offline'){ api({action:'dadcheck'}).then(r=>pinModal(r.ok&&r.set?'check':'set')).catch(()=>pinModal(S.dadPin?'check':'set')); return; }
      return pinModal(S.dadPin?'check':'set'); }
    if(act==='pinset'){ const v=document.getElementById('pin').value; const bad=m=>{ document.getElementById('pin-fb').innerHTML=`<div class="fb bad">${m}</div>`; }; if(!/^\d{4}$/.test(v)){ bad('Four digits.'); return; }
      const on=()=>{ S.dadPin=v; save(); dadMode=true; closeModal(); toast('Dad mode on'); route(); };
      if(SYNC.url && SYNC.status!=='offline'){ api({action:'dadpin'},{action:'dadpin', pin:v, oldPin:S.dadPin||''}).then(r=>{ if(r.ok) on(); else bad('Could not set the PIN: '+esc(r.error||'')); }).catch(()=>bad('Cloud unreachable.')); return; }
      return on(); }
    if(act==='pincheck'){ const v=document.getElementById('pin').value; const bad=m=>{ document.getElementById('pin-fb').innerHTML=`<div class="fb bad">${m}</div>`; };
      const on=()=>{ S.dadPin=v; save(); dadMode=true; closeModal(); toast('Dad mode on'); route(); };
      if(SYNC.url && SYNC.status!=='offline'){ api({action:'dadcheck', pin:v}).then(r=>{ if(r.ok&&r.match) on(); else bad('Nope.'); }).catch(()=>{ if(v===S.dadPin) on(); else bad('Cloud unreachable.'); }); return; }
      if(v===S.dadPin) return on(); bad('Nope.'); return; }
    if(act==='check' || act==='hint' || act==='reveal'){
      const pid = t.dataset.pid; let prob=null, labor=false;
      for(const u of OLY.units){ for(const s of u.sessions){ const x=(s.practice||[]).find(q=>q.id===pid); if(x) prob=x; } const y=u.labor.problems.find(q=>q.id===pid); if(y){ prob=y; labor=true; } }
      if(!prob) return; const ps = PS[pid] || (PS[pid]={hints:0,wrong:0}); const st = p.probs[pid] || (p.probs[pid]={ok:false,tries:0,hints:0,xp:0});
      if(act==='hint'){ ps.hints++; st.hints=Math.max(st.hints||0, ps.hints); save(); return rerenderProblem(pid, labor); }
      if(act==='reveal'){ ps.revealed=true; return rerenderProblem(pid, labor); }
      let raw; if(prob.type==='mc'){ const c=document.querySelector(`input[name="${pid}"]:checked`); if(!c){ fb(pid,'info','Pick one first.'); return; } raw=c.value; } else { raw=document.getElementById('in-'+pid).value; }
      const res = checkAnswer(prob, raw);
      if(res===null){ fb(pid,'info','That is not a number I can read. Try digits, like 12.5 or 3/4 or 4e8.'); return; }
      st.tries=(st.tries||0)+1; st.last=raw;
      if(res){
        const base = prob.xp||10; let mult = labor ? Math.max(0.5, 1-0.1*ps.wrong) : Math.max(0.3, 1-0.2*ps.hints-0.1*ps.wrong);
        const earned = Math.round(base*mult); st.ok=true; st.xp=earned; st.solved=Date.now(); save();
        addXP(earned, labor?'Labor':'correct'); rerenderProblem(pid, labor);
        fb(pid,'good', pickPraise(ps));
        afterSolve(pid, labor);
      } else {
        ps.wrong++; save(); rerenderProblem(pid, labor);
        fb(pid,'bad', ps.wrong===1?'Not yet. Check your units and your arithmetic, then try again.':(labor?'Still no. Re-read the part. Draw it.':'Still no. Take a hint, or re-read the story.'));
      }
      return;
    }
    if(act==='warmcheck'){ const f=findSession(currentSession()); const w=f.s.warmup; let raw; if(w.type==='mc'){ const c=document.querySelector('input[name="warm"]:checked'); if(!c) return; raw=c.value; } else raw=document.getElementById('warm-in').value;
      const ok = checkAnswer(w, raw); document.getElementById('warm-fb').innerHTML = `<div class="fb ${ok?'good':'bad'}">${ok?'Yes.':'Not that. Try once more, or reveal.'}</div>`;
      if(ok){ const ss=p.sessions[f.s.id]; if(!ss.warm){ ss.warm=true; save(); addXP(5,'warm-up'); } document.getElementById('warm-sol').style.display='block'; } return; }
    if(act==='warmreveal'){ document.getElementById('warm-sol').style.display='block'; return; }
    if(act==='applycheck'){ const f=findSession(currentSession()); const ss=p.sessions[f.s.id]; ss.apply=ss.apply||[]; ss.apply[Number(t.dataset.k)]=t.checked; const all = f.s.apply.checklist.every((c,k)=>ss.apply[k]); if(all && !ss.applyBonus){ ss.applyBonus=true; addXP(10,'apply'); } save(); return; }
    if(act==='savelog'){ const f=findSession(currentSession()); const ss=p.sessions[f.s.id]; ss.log=document.getElementById('log-in').value.trim(); if(ss.log && !ss.logXp){ ss.logXp=true; addXP(5,'log'); } save(); toast('Saved'); return renderSession(f.s.id,'log'); }
    if(act==='codexsave'){ const term=t.dataset.term; const v=document.getElementById('cx-'+term).value.trim(); if(!v) return; const c=p.codex[term]||(p.codex[term]={}); c.def=v; if(!c.xp){ c.xp=true; addXP(10,'Codex'); } save(); return renderCodex(); }
    if(act==='award'){ award(t.dataset.b, 'awarded by Dad'); return renderBadges(); }
    if(act==='unaward'){ delete p.badges[t.dataset.b]; save(); return renderBadges(); }
    if(act==='bdstart'){ return bdStart(Number(t.dataset.w)); }
    if(act==='bdsubmit'){ return bdSubmit(Number(t.dataset.w)); }
    if(act==='export'){ const blob=new Blob([JSON.stringify(S,null,1)],{type:'application/json'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=`olympus-progress-${new Date().toISOString().slice(0,10)}.json`; a.click(); return; }
    if(act==='csv'){ const rows=[['Profile','XP','Rank','Sessions done','Problems solved','Badges']]; for(const n of Object.keys(S.profiles)){ const q=S.profiles[n]; rows.push([n,q.xp,rankOf(q.xp)[0],allSessions().filter(s=>sessionDone(q,s)).length,Object.values(q.probs).filter(x=>x.ok).length,Object.keys(q.badges).length]); } const txt=rows.map(r=>r.join('\t')).join('\n'); navigator.clipboard&&navigator.clipboard.writeText(txt); toast('Copied. Paste into a Sheet.'); return; }
    if(act==='resetask'){ document.getElementById('reset-slot').innerHTML=`<div class="fb bad" style="margin-top:.6rem">This wipes ${esc(p.name)}'s XP, badges, and answers. <button class="btn sm" data-act="resetdo">Yes, reset</button></div>`; return; }
    if(act==='resetdo'){ S.profiles[p.name]=newProfile(p.name); save(); return renderProgress(); }
  });
  document.addEventListener('change', e=>{ const t=e.target; if(t.dataset.act==='import'){ const f=t.files[0]; if(!f) return; const r=new FileReader(); r.onload=()=>{ try{ const inc=JSON.parse(r.result); if(!inc.profiles) throw 0; for(const n of Object.keys(inc.profiles)){ const a=S.profiles[n], b=inc.profiles[n]; if(!a || b.xp>=a.xp) S.profiles[n]=b; } if(inc.dadPin&&!S.dadPin) S.dadPin=inc.dadPin; save(); toast('Loaded'); route(); }catch(err){ toast('That file did not look like a progress file.'); } }; r.readAsText(f); } });
  document.addEventListener('keydown', e=>{ if(e.key==='Enter' && e.target.matches('input[type=text]')){ const id=e.target.id; if(id.startsWith('in-')){ const b=document.querySelector(`[data-act="check"][data-pid="${id.slice(3)}"]`); if(b) b.click(); } else if(id==='warm-in'){ const b=document.querySelector('[data-act="warmcheck"]'); if(b) b.click(); } else if(id==='bd-in'){ const b=document.querySelector('[data-act="bdsubmit"]'); if(b) b.click(); } else if(id==='pin'){ const b=document.querySelector('[data-act="pinset"],[data-act="pincheck"],[data-act="profilepin"]'); if(b) b.click(); } } });

  function fb(pid, kind, msg){ const el=document.getElementById('fb-'+pid); if(el) el.innerHTML=`<div class="fb ${kind}">${msg}</div>`; }
  function pickPraise(ps){ const clean = !ps.hints && !ps.wrong; const arr = clean ? ['Clean. First try, no hints.','Correct. Zeus nods approvingly.','Right. Feynman would ask you to explain it now.','Yes. Write that method in the Codex.'] : ['Correct. The road matters less than the arrival.','Got there. Now do the next one without the hint.','Right. Wrong answers were data; you used them.']; return arr[Math.floor(Math.random()*arr.length)]; }
  function rerenderProblem(pid, labor){
    let prob=null, idx=0; for(const u of OLY.units){ for(const s of u.sessions){ const k=(s.practice||[]).findIndex(q=>q.id===pid); if(k>=0){ prob=s.practice[k]; idx=k; } } const k=u.labor.problems.findIndex(q=>q.id===pid); if(k>=0){ prob=u.labor.problems[k]; idx=k; } }
    const el=document.getElementById('prob-'+pid); if(!el||!prob) return; const wrap=document.createElement('div'); wrap.innerHTML=problemHtml(prob, idx, {labor}); el.replaceWith(wrap.firstElementChild);
  }
  function afterSolve(pid, labor){
    const p=P();
    if(labor){ for(const u of OLY.units){ if(u.labor.problems.some(q=>q.id===pid) && laborDone(p,u)){ award(u.badge, `Labor ${u.num} complete`); setTimeout(()=>renderLabor(u.id), 1200); } } return; }
    const sid=currentSession(); const f=findSession(sid); if(!f) return; const ss=p.sessions[sid];
    const sum=document.getElementById('sess-summary'); if(sum) sum.innerHTML=sessionSummary(f.s);
    if(sessionDone(p,f.s) && !ss.bonus){ ss.bonus=true; save(); setTimeout(()=>{ addXP(20,'session cleared'); const doneCount=allSessions().filter(s=>sessionDone(p,s)).length; if(doneCount>=10) award('ironpencil','ten sessions'); renderSession(sid,'practice'); }, 900); }
  }
  function sessionSummary(s){ const p=P(); const ss=p.sessions[s.id]||{}; const nProb=sessionProblems(s).length, nOk=sessionProblems(s).filter(x=>p.probs[x.id]&&p.probs[x.id].ok).length; return sessionDone(p,s)?`<div class="fb good">Session cleared: ${nOk}/${nProb}. ${ss.bonus?'Bonus banked.':''}</div>`:`<div class="fb info">${nOk}/${nProb} solved. Clear them all for a 20 XP session bonus.</div>`; }
  function currentSession(){ const m=location.hash.match(/#\/session\/([^\/]+)/); return m?m[1]:null; }

  // ---------- router ----------
  function route(){
    if(!S.active || !S.profiles[S.active]){ app.innerHTML=''; updateTop(); if(!document.getElementById('modal')) profileModal(); return; }
    const h = location.hash || '#/'; const parts = h.replace(/^#\//,'').split('/');
    switch(parts[0]){
      case '': return renderHome();
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
  OLY._ = { checkAnswer, parseNum, state:()=>S, setDad:v=>{dadMode=v; route();} };
  route();
})();
