/*
 * Credits : JOHN BLAK
 * Github  : https://www.github.com/JOHNBLAK
 */

/* ============================================================
   STUDYBUDDY — STUDENT OPERATING SYSTEM
   ============================================================ */

/* ---------- IndexedDB Layer ---------- */
const DB_NAME='studybuddy_db',DB_VER=1;
let db;
const STORES=['profile','subjects','modules','notes','flashcards','sessions','timetable','events','goals','journal','habits','settings'];

function openDB(){
  return new Promise((res,rej)=>{
    const r=indexedDB.open(DB_NAME,DB_VER);
    r.onupgradeneeded=e=>{
      const d=e.target.result;
      STORES.forEach(s=>{if(!d.objectStoreNames.contains(s))d.createObjectStore(s,{keyPath:'id'})});
    };
    r.onsuccess=e=>{db=e.target.result;res(db)};
    r.onerror=e=>rej(e);
  });
}
function tx(store,mode='readonly'){return db.transaction(store,mode).objectStore(store)}
function dbPut(store,data){return new Promise((res,rej)=>{const r=tx(store,'readwrite').put(data);r.onsuccess=()=>res(r.result);r.onerror=rej})}
function dbGet(store,id){return new Promise((res,rej)=>{const r=tx(store).get(id);r.onsuccess=()=>res(r.result);r.onerror=rej})}
function dbAll(store){return new Promise((res,rej)=>{const r=tx(store).getAll();r.onsuccess=()=>res(r.result||[]);r.onerror=rej})}
function dbDel(store,id){return new Promise((res,rej)=>{const r=tx(store,'readwrite').delete(id);r.onsuccess=()=>res();r.onerror=rej})}
function dbClear(store){return new Promise((res,rej)=>{const r=tx(store,'readwrite').clear();r.onsuccess=()=>res();r.onerror=rej})}

/* ---------- Utilities ---------- */
const $=s=>document.querySelector(s);
const $$=s=>document.querySelectorAll(s);
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,7);
const fmtDate=d=>{const x=new Date(d);return x.toLocaleDateString('en',{month:'short',day:'numeric'})};
const today=()=>new Date().toISOString().slice(0,10);
const toast=(m)=>{const t=$('#toast');t.textContent=m;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2200)};
const COLORS=['#7c9cff','#a78bfa','#34d399','#fbbf24','#f87171','#f472b6','#22d3ee','#fb923c'];

/* ---------- State ---------- */
const state={
  view:'dashboard',
  profile:null,
  subjects:[],modules:[],notes:[],flashcards:[],sessions:[],
  timetable:[],events:[],goals:[],journal:[],habits:[],
  settings:{pomodoro:25,break:5,ultradian:90},
  timer:null,timerRemaining:0,timerRunning:false,timerMode:'pomodoro',
  currentSubject:null,currentNote:null,
};

/* ---------- Level System ---------- */
function calcLevel(){
  const sessions=state.sessions.length;
  const goals=state.goals.filter(g=>g.done).length;
  const notes=state.notes.length;
  const score=sessions*3+goals*5+notes*1;
  if(score>=200)return{name:"Dean's Circle",n:6};
  if(score>=140)return{name:"Academic Elite",n:5};
  if(score>=90)return{name:"Distinguished Scholar",n:4};
  if(score>=50)return{name:"Scholar III",n:3};
  if(score>=20)return{name:"Scholar II",n:2};
  return{name:"Scholar I",n:1};
}

/* ---------- Navigation ---------- */
const TABS=[
  {id:'dashboard',label:'Dashboard',icon:'home'},
  {id:'subjects',label:'Subjects',icon:'book'},
  {id:'notes',label:'Notes',icon:'file'},
  {id:'sessions',label:'Sessions',icon:'clock'},
  {id:'flashcards',label:'Flashcards',icon:'layers'},
  {id:'goals',label:'Goals',icon:'target'},
  {id:'habits',label:'Habits',icon:'activity'},
  {id:'timetable',label:'Timetable',icon:'calendar'},
  {id:'journal',label:'Journal',icon:'edit'},
  {id:'graph',label:'Graph',icon:'git'},
];

function icon(name){
  const i={
    home:'<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>',
    book:'<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>',
    file:'<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>',
    clock:'<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
    layers:'<polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>',
    target:'<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
    activity:'<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>',
    calendar:'<rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>',
    edit:'<path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>',
    git:'<circle cx="18" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><path d="M6 21V9a9 9 0 0 0 9 9"/>',
    check:'<polyline points="20 6 9 17 4 12"/>',
    x:'<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
    plus:'<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
    trash:'<polyline points="3 6 5 6 21 6"/><path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6"/>',
    'file-text':'<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>',
    bar:'<line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/>',
    user:'<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  };
  return `<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">${i[name]||''}</svg>`;
}

function renderTabs(){
  $('#tabs').innerHTML=TABS.map(t=>`<button class="tab ${state.view===t.id?'active':''}" data-view="${t.id}">${t.label}</button>`).join('');
  $$('.tab').forEach(b=>b.onclick=()=>{state.view=b.dataset.view;renderTabs();renderView()});
  const primary=TABS.slice(0,5);
  $('#bottomNav').innerHTML=primary.map(t=>`<button class="nav-btn ${state.view===t.id?'active':''}" data-view="${t.id}">${icon(t.icon)}<span>${t.label}</span></button>`).join('');
  $$('.nav-btn').forEach(b=>b.onclick=()=>{state.view=b.dataset.view;renderTabs();renderView()});
}

/* ---------- Data Loading ---------- */
async function loadAll(){
  state.profile=await dbGet('profile','main')||{id:'main',name:'Student',semester:1};
  state.subjects=await dbAll('subjects');
  state.modules=await dbAll('modules');
  state.notes=await dbAll('notes');
  state.flashcards=await dbAll('flashcards');
  state.sessions=await dbAll('sessions');
  state.timetable=await dbAll('timetable');
  state.events=await dbAll('events');
  state.goals=await dbAll('goals');
  state.journal=await dbAll('journal');
  state.habits=await dbAll('habits');
  const s=await dbGet('settings','main');
  if(s)state.settings={...state.settings,...s};
  const lv=calcLevel();
  $('#levelBadge').textContent=lv.name+' · L'+lv.n;
}

/* ---------- Render Router ---------- */
function renderView(){
  const map={
    dashboard:viewDashboard,subjects:viewSubjects,notes:viewNotes,sessions:viewSessions,
    flashcards:viewFlashcards,goals:viewGoals,habits:viewHabits,timetable:viewTimetable,
    journal:viewJournal,graph:viewGraph,
  };
  (map[state.view]||viewDashboard)();
}

/* ---------- Modal ---------- */
function openModal(html){$('#modalContent').innerHTML=html;$('#modal').classList.add('open')}
function closeModal(){$('#modal').classList.remove('open')}
$('#modal').addEventListener('click',e=>{if(e.target.id==='modal')closeModal()});

/* ---------- DASHBOARD ---------- */
function viewDashboard(){
  const totalMin=state.sessions.reduce((a,s)=>a+(s.duration||0),0);
  const hrs=(totalMin/60).toFixed(1);
  const activeGoals=state.goals.filter(g=>!g.done).length;
  const doneGoals=state.goals.filter(g=>g.done).length;
  const streak=calcStreak();
  const focusScore=Math.min(100,Math.round((state.sessions.length*3)+(doneGoals*5)+streak*2));
  const lv=calcLevel();
  const upcoming=state.events.filter(e=>e.date>=today()).sort((a,b)=>a.date.localeCompare(b.date)).slice(0,4);
  const weekData=last7DaysStudy();

  $('#main').innerHTML=`
  <div class="page">
    <div class="hero">
      <div class="hero-label">Welcome back, ${state.profile.name||'Student'}</div>
      <div class="hero-title">Focus Score ${focusScore}</div>
      <div class="hero-sub">Daily productivity intelligence · ${new Date().toLocaleDateString('en',{weekday:'long',month:'long',day:'numeric'})}</div>
      <div class="hero-stats">
        <div><div class="hero-stat-val">${hrs}h</div><div class="hero-stat-lbl">Study Time</div></div>
        <div><div class="hero-stat-val">${streak}</div><div class="hero-stat-lbl">Day Streak</div></div>
        <div><div class="hero-stat-val">${activeGoals}</div><div class="hero-stat-lbl">Active Goals</div></div>
        <div><div class="hero-stat-val">L${lv.n}</div><div class="hero-stat-lbl">${lv.name}</div></div>
      </div>
    </div>

    <div class="grid grid-4">
      ${statCard('clock',hrs,'Hours Studied',state.sessions.length>0?'up':'',state.sessions.length+' sessions')}
      ${statCard('target',doneGoals,'Goals Done',state.goals.length?Math.round(doneGoals/state.goals.length*100)+'%':'',state.goals.length+' total')}
      ${statCard('book',state.subjects.length,'Subjects','','Sem '+state.profile.semester)}
      ${statCard('activity',state.notes.length,'Notes',state.flashcards.length+' cards','Knowledge')}
    </div>

    <div class="section">
      <div class="section-head"><div class="section-title">Weekly Study Activity</div></div>
      <div class="chart-box">
        <div class="bar-chart">
          ${weekData.map(d=>`<div class="bar-col"><div class="bar-val">${d.mins}</div><div class="bar" style="height:${Math.min(100,d.mins*2)}%"></div><div class="bar-label">${d.d}</div></div>`).join('')}
        </div>
      </div>
    </div>

    <div class="section">
      <div class="section-head"><div class="section-title">Subject Progress</div><span class="section-action" onclick="setView('subjects')">View all →</span></div>
      <div class="grid grid-2">
        ${state.subjects.slice(0,4).map(s=>subjectCardHTML(s)).join('')||emptyHTML('book','No subjects yet','Add your first subject to begin tracking')}
      </div>
    </div>

    <div class="section">
      <div class="section-head"><div class="section-title">Upcoming Events</div><span class="section-action" onclick="openEventModal()">+ Add</span></div>
      <div class="list">
        ${upcoming.map(e=>`<div class="list-item"><div class="list-dot" style="background:var(--accent)"></div><div class="list-main"><div class="list-title">${e.title}</div><div class="list-sub">${e.type||'Event'}</div></div><div class="list-right">${fmtDate(e.date)}</div><button class="icon-btn" onclick="event.stopPropagation();deleteEvent('${e.id}')">${icon('trash')}</button></div>`).join('')||emptyHTML('calendar','No upcoming events','Schedule exams, deadlines and study sessions')}
      </div>
    </div>
  </div>`;
}

function statCard(ic,v,l,delta,deltaLbl){
  return `<div class="stat"><div class="stat-icon">${icon(ic)}</div><div class="stat-val">${v}</div><div class="stat-lbl">${l}</div>${delta?`<div class="stat-delta ${delta}">${deltaLbl}</div>`:''}</div>`;
}
function subjectCardHTML(s){
  const mods=state.modules.filter(m=>m.subjectId===s.id);
  const pct=mods.length?Math.round(mods.filter(m=>m.done).length/mods.length*100):0;
  return `<div class="subject-card" style="--sc:${s.color||'#7c9cff'}" onclick="openSubject('${s.id}')"><div class="card-glow"></div><div class="subject-name">${s.name}</div><div class="subject-code">${s.code||''} · Sem ${s.semester||'-'}</div><div class="subject-meta"><span>${s.credits||0} cr</span><span>${mods.length} modules</span></div><div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div></div>`;
}
function emptyHTML(ic,t,s){return `<div class="empty" style="grid-column:1/-1"><div class="empty-icon">${icon(ic)}</div><div class="empty-title">${t}</div><div class="empty-sub">${s}</div></div>`}
function calcStreak(){
  const days=new Set(state.sessions.map(s=>s.date));
  let s=0,d=new Date();
  while(days.has(d.toISOString().slice(0,10))){s++;d.setDate(d.getDate()-1)}
  return s;
}
function last7DaysStudy(){
  const out=[];
  for(let i=6;i>=0;i--){
    const d=new Date();d.setDate(d.getDate()-i);
    const ds=d.toISOString().slice(0,10);
    const mins=Math.round(state.sessions.filter(s=>s.date===ds).reduce((a,x)=>a+(x.duration||0),0));
    out.push({d:d.toLocaleDateString('en',{weekday:'short'}).slice(0,3),mins});
  }
  return out;
}
function setView(v){state.view=v;renderTabs();renderView()}

/* ---------- EVENTS ---------- */
function openEventModal(){
  openModal(`
    <div class="modal-head"><div class="modal-title">New Event</div><button class="modal-close" onclick="closeModal()">${icon('x')}</button></div>
    <div class="field"><label>Title</label><input class="input" id="eTitle" placeholder="Mid-term Exam"></div>
    <div class="field"><label>Type</label><select class="select" id="eType"><option>Exam</option><option>Assignment</option><option>Study Session</option><option>Other</option></select></div>
    <div class="field"><label>Date</label><input class="input" type="date" id="eDate"></div>
    <button class="btn btn-primary w-full" onclick="saveEvent()">Add Event</button>
  `);
}
async function saveEvent(){
  const data={id:uid(),title:$('#eTitle').value.trim(),type:$('#eType').value,date:$('#eDate').value};
  if(!data.title||!data.date){toast('Fill all fields');return}
  await dbPut('events',data);await loadAll();closeModal();renderView();
}
async function deleteEvent(id){await dbDel('events',id);await loadAll();renderView()}

/* ---------- SUBJECTS ---------- */
function viewSubjects(){
  $('#main').innerHTML=`
  <div class="page">
    <div class="flex justify-between items-center mb-3">
      <div><div class="page-title">Subjects</div><div class="page-sub">${state.subjects.length} subjects · Track modules & progress</div></div>
      <button class="btn btn-primary" onclick="openSubjectModal()">${icon('plus')}<span>Add</span></button>
    </div>
    <div class="grid grid-2">
      ${state.subjects.map(s=>subjectCardHTML(s)).join('')||emptyHTML('book','No subjects yet','Tap Add to create your first subject')}
    </div>
  </div>`;
}
function openSubjectModal(id){
  const s=id?state.subjects.find(x=>x.id===id):{name:'',code:'',instructor:'',semester:state.profile.semester,color:COLORS[state.subjects.length%8],credits:3};
  openModal(`
    <div class="modal-head"><div class="modal-title">${id?'Edit':'New'} Subject</div><button class="modal-close" onclick="closeModal()">${icon('x')}</button></div>
    <div class="field"><label>Name</label><input class="input" id="sName" value="${s.name}" placeholder="Data Structures"></div>
    <div class="field"><label>Code</label><input class="input" id="sCode" value="${s.code||''}" placeholder="BCA101"></div>
    <div class="field"><label>Instructor</label><input class="input" id="sInst" value="${s.instructor||''}" placeholder="Dr. Smith"></div>
    <div class="grid grid-2">
      <div class="field"><label>Semester</label><input class="input" type="number" id="sSem" value="${s.semester||1}" min="1" max="10"></div>
      <div class="field"><label>Credits</label><input class="input" type="number" id="sCred" value="${s.credits||3}" min="1" max="10"></div>
    </div>
    <div class="field"><label>Color</label>
      <div class="flex gap-2" id="colorPick">${COLORS.map(c=>`<div class="color-dot" data-c="${c}" style="width:28px;height:28px;border-radius:8px;background:${c};cursor:pointer;border:2px solid ${c===s.color?'#fff':'transparent'}"></div>`).join('')}</div>
    </div>
    <button class="btn btn-primary w-full" onclick="saveSubject('${id||''}')">${id?'Save Changes':'Create Subject'}</button>
    ${id?`<button class="btn btn-ghost w-full mt-2" onclick="deleteSubject('${id}')">Delete Subject</button>`:''}
  `);
  let sel=s.color;
  $$('#colorPick .color-dot').forEach(d=>d.onclick=()=>{$$('#colorPick .color-dot').forEach(x=>x.style.border='2px solid transparent');d.style.border='2px solid #fff';sel=d.dataset.c});
  window._selColor=()=>sel;
}
async function saveSubject(id){
  const data={
    id:id||uid(),
    name:$('#sName').value.trim(),
    code:$('#sCode').value.trim(),
    instructor:$('#sInst').value.trim(),
    semester:+$('#sSem').value,
    credits:+$('#sCred').value,
    color:window._selColor(),
  };
  if(!data.name){toast('Name required');return}
  await dbPut('subjects',data);
  await loadAll();closeModal();renderView();toast('Subject saved');
}
async function deleteSubject(id){
  if(!confirm('Delete subject and all its modules?'))return;
  await dbDel('subjects',id);
  for(const m of state.modules.filter(m=>m.subjectId===id))await dbDel('modules',m.id);
  await loadAll();closeModal();renderView();toast('Deleted');
}
function openSubject(id){
  const s=state.subjects.find(x=>x.id===id);if(!s)return;
  state.currentSubject=s;
  const mods=state.modules.filter(m=>m.subjectId===id);
  const done=mods.filter(m=>m.done).length;
  const pct=mods.length?Math.round(done/mods.length*100):0;
  openModal(`
    <div class="modal-head"><div class="modal-title" style="color:${s.color}">${s.name}</div><button class="modal-close" onclick="closeModal()">${icon('x')}</button></div>
    <div class="flex gap-3 mb-3">
      <div class="chip">${s.code||'—'}</div>
      <div class="chip">Sem ${s.semester}</div>
      <div class="chip">${s.credits} cr</div>
      <div class="chip">${pct}% done</div>
    </div>
    ${s.instructor?`<div class="text-sm text-muted mb-3">Instructor: ${s.instructor}</div>`:''}
    <div class="progress-bar mb-3"><div class="progress-fill" style="width:${pct}%;background:${s.color}"></div></div>
    <div class="section-head"><div class="section-title">Modules (${mods.length})</div><button class="btn btn-sm btn-ghost" onclick="openModuleModal('${id}')">${icon('plus')} Module</button></div>
    <div class="list">
      ${mods.map(m=>`<div class="list-item" onclick="toggleModule('${m.id}')"><div class="habit-check ${m.done?'done':''}" style="${m.done?'background:'+s.color+';border-color:'+s.color:''}"></div><div class="list-main"><div class="list-title">${m.name}</div><div class="list-sub">Confidence: ${m.confidence||'—'}</div></div><button class="icon-btn" onclick="event.stopPropagation();deleteModule('${m.id}')">${icon('trash')}</button></div>`).join('')||'<div class="empty"><div class="empty-sub">No modules yet</div></div>'}
    </div>
    <div class="flex gap-2 mt-3"><button class="btn btn-ghost btn-sm" onclick="openSubjectModal('${id}')">Edit Subject</button></div>
  `);
}
function openModuleModal(subjectId){
  openModal(`
    <div class="modal-head"><div class="modal-title">New Module</div><button class="modal-close" onclick="closeModal()">${icon('x')}</button></div>
    <div class="field"><label>Module Name</label><input class="input" id="mName" placeholder="Arrays & Strings"></div>
    <div class="field"><label>Confidence</label>
      <select class="select" id="mConf"><option>Low</option><option>Medium</option><option selected>High</option></select>
    </div>
    <button class="btn btn-primary w-full" onclick="saveModule('${subjectId}')">Add Module</button>
  `);
}
async function saveModule(subjectId){
  const data={id:uid(),subjectId,name:$('#mName').value.trim(),confidence:$('#mConf').value,done:false};
  if(!data.name){toast('Name required');return}
  await dbPut('modules',data);await loadAll();openSubject(subjectId);toast('Module added');
}
async function toggleModule(id){
  const m=state.modules.find(x=>x.id===id);m.done=!m.done;
  await dbPut('modules',m);await loadAll();openSubject(m.subjectId);
}
async function deleteModule(id){
  const m=state.modules.find(x=>x.id===id);
  await dbDel('modules',id);await loadAll();openSubject(m.subjectId);
}

/* ---------- NOTES ---------- */
function viewNotes(){
  $('#main').innerHTML=`
  <div class="page">
    <div class="flex justify-between items-center mb-3">
      <div><div class="page-title">Notes</div><div class="page-sub">${state.notes.length} notes · Rich text & markdown</div></div>
      <button class="btn btn-primary" onclick="openNoteModal()">${icon('plus')}<span>New</span></button>
    </div>
    <div class="list">
      ${state.notes.sort((a,b)=>b.updated-a.updated).map(n=>{
        const sub=state.subjects.find(s=>s.id===n.subjectId);
        return `<div class="list-item" onclick="openNote('${n.id}')"><div class="list-dot" style="background:${sub?.color||'#7c9cff'}"></div><div class="list-main"><div class="list-title">${n.title||'Untitled'}</div><div class="list-sub">${sub?.name||'No subject'} · ${fmtDate(n.updated)}</div></div><button class="icon-btn" onclick="event.stopPropagation();deleteNote('${n.id}')">${icon('trash')}</button></div>`;
      }).join('')||emptyHTML('file','No notes yet','Create rich notes with markdown support')}
    </div>
  </div>`;
}
function openNoteModal(id){
  const n=id?state.notes.find(x=>x.id===id):{title:'',content:'',subjectId:state.subjects[0]?.id||'',tags:[]};
  openModal(`
    <div class="modal-head"><div class="modal-title">${id?'Edit':'New'} Note</div><button class="modal-close" onclick="closeModal()">${icon('x')}</button></div>
    <div class="field"><label>Title</label><input class="input" id="nTitle" value="${(n.title||'').replace(/"/g,'&quot;')}"></div>
    <div class="field"><label>Subject</label>
      <select class="select" id="nSub">${state.subjects.map(s=>`<option value="${s.id}" ${s.id===n.subjectId?'selected':''}>${s.name}</option>`).join('')}</select>
    </div>
    <div class="field"><label>Tags (comma separated)</label><input class="input" id="nTags" value="${(n.tags||[]).join(', ')}"></div>
    <button class="btn btn-primary w-full" onclick="saveNote('${id||''}')">Save Note</button>
  `);
}
async function saveNote(id){
  const existing=id?state.notes.find(x=>x.id===id):null;
  const data={
    id:id||uid(),
    title:$('#nTitle').value.trim()||'Untitled',
    content:existing?.content||'',
    subjectId:$('#nSub').value,
    tags:$('#nTags').value.split(',').map(t=>t.trim()).filter(Boolean),
    created:existing?.created||Date.now(),
    updated:Date.now(),
  };
  await dbPut('notes',data);await loadAll();closeModal();
  if(!id)openNote(data.id);else{renderView();toast('Note saved')}
}
async function deleteNote(id){if(!confirm('Delete note?'))return;await dbDel('notes',id);await loadAll();renderView();toast('Deleted')}
function openNote(id){
  const n=state.notes.find(x=>x.id===id);if(!n)return;
  state.currentNote=n;
  const sub=state.subjects.find(s=>s.id===n.subjectId);
  openModal(`
    <div class="modal-head">
      <div>
        <div class="modal-title">${n.title}</div>
        <div class="text-xs text-muted mt-2">${sub?.name||'No subject'} · ${n.tags?.map(t=>'#'+t).join(' ')||''}</div>
      </div>
      <button class="modal-close" onclick="closeModal()">${icon('x')}</button>
    </div>
    <div class="toolbar">
      <button class="tool-btn" onclick="execCmd('bold')" title="Bold"><b>B</b></button>
      <button class="tool-btn" onclick="execCmd('italic')" title="Italic"><i>I</i></button>
      <button class="tool-btn" onclick="execCmd('underline')" title="Underline"><u>U</u></button>
      <button class="tool-btn" onclick="execCmd('insertUnorderedList')" title="List">•</button>
      <button class="tool-btn" onclick="execCmd('formatBlock','H2')" title="Heading">H</button>
      <button class="tool-btn" onclick="insertCode()" title="Code">&lt;/&gt;</button>
    </div>
    <div class="note-editor" contenteditable="true" id="noteEditor">${n.content||'<p>Start writing...</p>'}</div>
    <div class="flex gap-2 mt-3">
      <button class="btn btn-primary" onclick="saveNoteContent('${n.id}')">Save</button>
      <button class="btn btn-ghost" onclick="openNoteModal('${n.id}')">Edit Meta</button>
    </div>
  `);
}
function execCmd(c,v=null){document.execCommand(c,false,v)}
function insertCode(){document.execCommand('insertHTML',false,'<pre><code>code here</code></pre>')}
async function saveNoteContent(id){
  const n=state.notes.find(x=>x.id===id);
  n.content=$('#noteEditor').innerHTML;n.updated=Date.now();
  await dbPut('notes',n);await loadAll();toast('Saved');
}

/* ---------- SESSIONS ---------- */
function viewSessions(){
  const totalMin=state.sessions.reduce((a,s)=>a+(s.duration||0),0);
  const todayMin=state.sessions.filter(s=>s.date===today()).reduce((a,s)=>a+(s.duration||0),0);
  $('#main').innerHTML=`
  <div class="page">
    <div class="page-title">Study Sessions</div>
    <div class="page-sub">Pomodoro · Ultradian · Flow</div>
    <div class="timer-display">
      <div class="timer-time" id="timerDisp">${fmtTime(state.timerRemaining||state.settings.pomodoro*60)}</div>
      <div class="timer-label" id="timerLbl">${state.timerMode} · ${state.timerRunning?'Running':'Ready'}</div>
      <div class="timer-controls">
        <button class="btn btn-primary" onclick="toggleTimer()">${state.timerRunning?'Pause':'Start'}</button>
        <button class="btn btn-ghost" onclick="resetTimer()">Reset</button>
      </div>
      <div class="flex gap-2 justify-between mt-4" style="justify-content:center">
        <button class="btn btn-sm ${state.timerMode==='pomodoro'?'btn-primary':'btn-ghost'}" onclick="setTimerMode('pomodoro')">Pomodoro</button>
        <button class="btn btn-sm ${state.timerMode==='ultradian'?'btn-primary':'btn-ghost'}" onclick="setTimerMode('ultradian')">Ultradian</button>
        <button class="btn btn-sm ${state.timerMode==='flow'?'btn-primary':'btn-ghost'}" onclick="setTimerMode('flow')">Flow</button>
      </div>
    </div>
    <div class="grid grid-3 mt-4">
      ${statCard('clock',(totalMin/60).toFixed(1),'Total Hours','','All time')}
      ${statCard('activity',Math.round(todayMin),'Today Mins','','Focus')}
      ${statCard('target',state.sessions.length,'Sessions','','Completed')}
    </div>
    <div class="section">
      <div class="section-head"><div class="section-title">Recent Sessions</div></div>
      <div class="list">
        ${state.sessions.slice(-10).reverse().map(s=>{
          const sub=state.subjects.find(x=>x.id===s.subjectId);
          return `<div class="list-item"><div class="list-dot" style="background:${sub?.color||'#7c9cff'}"></div><div class="list-main"><div class="list-title">${sub?.name||'Session'} · ${s.mode}</div><div class="list-sub">${fmtDate(s.date)} · Rating ${s.rating||'—'}/5</div></div><div class="list-right">${s.duration}m</div></div>`;
        }).join('')||emptyHTML('clock','No sessions yet','Start your first study session')}
      </div>
    </div>
  </div>`;
}
function fmtTime(s){const m=Math.floor(s/60),ss=s%60;return `${String(m).padStart(2,'0')}:${String(ss).padStart(2,'0')}`}
function setTimerMode(m){
  state.timerMode=m;
  const mins=m==='pomodoro'?state.settings.pomodoro:m==='ultradian'?state.settings.ultradian:60;
  state.timerRemaining=mins*60;state.timerRunning=false;
  if(state.timer)clearInterval(state.timer);
  renderView();
}
function toggleTimer(){
  if(!state.timerRemaining){
    const mins=state.timerMode==='pomodoro'?state.settings.pomodoro:state.timerMode==='ultradian'?state.settings.ultradian:60;
    state.timerRemaining=mins*60;
  }
  state.timerRunning=!state.timerRunning;
  if(state.timerRunning){
    const start=Date.now();const startRem=state.timerRemaining;
    state.timer=setInterval(()=>{
      state.timerRemaining=Math.max(0,startRem-Math.floor((Date.now()-start)/1000));
      const el=$('#timerDisp');if(el)el.textContent=fmtTime(state.timerRemaining);
      if(state.timerRemaining===0){
        clearInterval(state.timer);state.timerRunning=false;
        completeSession();
      }
    },500);
  }else{clearInterval(state.timer)}
  const lbl=$('#timerLbl');if(lbl)lbl.textContent=`${state.timerMode} · ${state.timerRunning?'Running':'Paused'}`;
  renderView();
}
function resetTimer(){
  clearInterval(state.timer);state.timerRunning=false;
  const mins=state.timerMode==='pomodoro'?state.settings.pomodoro:state.timerMode==='ultradian'?state.settings.ultradian:60;
  state.timerRemaining=mins*60;renderView();
}
async function completeSession(){
  const mins=state.timerMode==='pomodoro'?state.settings.pomodoro:state.timerMode==='ultradian'?state.settings.ultradian:60;
  openModal(`
    <div class="modal-head"><div class="modal-title">Session Complete! 🎉</div><button class="modal-close" onclick="closeModal()">${icon('x')}</button></div>
    <div class="field"><label>Subject</label>
      <select class="select" id="sesSub">${state.subjects.map(s=>`<option value="${s.id}">${s.name}</option>`).join('')}</select>
    </div>
    <div class="field"><label>Focus Rating (1-5)</label>
      <select class="select" id="sesRate"><option>5</option><option>4</option><option selected>3</option><option>2</option><option>1</option></select>
    </div>
    <button class="btn btn-primary w-full" onclick="saveSession(${mins})">Save Session</button>
  `);
}
async function saveSession(duration){
  const data={id:uid(),date:today(),duration,mode:state.timerMode,subjectId:$('#sesSub').value,rating:+$('#sesRate').value,ts:Date.now()};
  await dbPut('sessions',data);await loadAll();closeModal();renderView();toast('Session saved');
}

/* ---------- FLASHCARDS ---------- */
function viewFlashcards(){
  $('#main').innerHTML=`
  <div class="page">
    <div class="flex justify-between items-center mb-3">
      <div><div class="page-title">Flashcards</div><div class="page-sub">${state.flashcards.length} cards · Spaced repetition</div></div>
      <button class="btn btn-primary" onclick="openFlashcardModal()">${icon('plus')}<span>New</span></button>
    </div>
    ${state.flashcards.length?`
      <div class="flashcard" id="fcCard" onclick="this.classList.toggle('flipped')">
        <div class="flashcard-inner">
          <div class="flashcard-face">
            <div class="flashcard-q" id="fcQ"></div>
            <div class="text-xs mt-3" id="fcHint" style="display:none; margin-top: 16px; color: var(--accent); font-weight: 600;"></div>
            <div class="text-xs text-muted mt-3" id="fcTap">Tap to reveal</div>
          </div>
          <div class="flashcard-face flashcard-back"><div class="flashcard-a" id="fcA"></div></div>
        </div>
      </div>
      <div class="flex gap-2 mt-3" style="justify-content:center; flex-wrap: wrap;">
        <button class="btn btn-ghost" onclick="prevCard()">← Prev</button>
        <button class="btn btn-ghost" onclick="showHint()">Hint</button>
        <button class="btn btn-ghost" onclick="rateCard('hard')">Hard</button>
        <button class="btn btn-ghost" onclick="rateCard('ok')">OK</button>
        <button class="btn btn-primary" onclick="rateCard('easy')">Easy</button>
        <button class="btn btn-ghost" onclick="nextCard()">Next →</button>
      </div>
      <div class="flex gap-2 mt-3" style="justify-content:center; flex-wrap: wrap;">
        <button class="btn btn-ghost btn-sm" onclick="editCurrentCard()">${icon('edit')} Edit</button>
        <button class="btn btn-ghost btn-sm" style="color:var(--red)" onclick="deleteCurrentCard()">${icon('trash')} Delete</button>
      </div>
      <div class="text-sm text-muted mt-3" style="text-align:center"><span id="fcIdx">1</span> / ${state.flashcards.length}</div>
    `:emptyHTML('layers','No flashcards yet','Create cards for spaced repetition review')}
  </div>`;
  if(state.flashcards.length){state._fcIdx=0;showCard()}
}
function showCard(){
  const c=state.flashcards[state._fcIdx];if(!c)return;
  const q=$('#fcQ'),a=$('#fcA'),h=$('#fcHint'),tap=$('#fcTap');
  if(q)q.textContent=c.q;
  if(a)a.textContent=c.a;
  if(h){h.style.display='none'; h.textContent='';}
  if(tap)tap.style.display='block';
  const idx=$('#fcIdx');if(idx)idx.textContent=state._fcIdx+1;
  const card=$('#fcCard');if(card)card.classList.remove('flipped');
}
function showHint(){
  const c=state.flashcards[state._fcIdx];if(!c)return;
  const mod=state.modules.find(m=>m.id===c.moduleId);
  const h=$('#fcHint'),tap=$('#fcTap');
  if(h){
    if(mod){
      h.textContent='Module: '+mod.name;
    } else {
      h.textContent='No module associated.';
    }
    h.style.display='block';
    if(tap)tap.style.display='none';
  }
}
function nextCard(){state._fcIdx=(state._fcIdx+1)%state.flashcards.length;showCard()}
function prevCard(){state._fcIdx=(state._fcIdx-1+state.flashcards.length)%state.flashcards.length;showCard()}
async function rateCard(r){
  const c=state.flashcards[state._fcIdx];
  c.difficulty=r;c.reviewed=(c.reviewed||0)+1;c.lastReview=Date.now();
  await dbPut('flashcards',c);await loadAll();nextCard();
}
function openFlashcardModal(id){
  const c = id ? state.flashcards.find(x=>x.id===id) : {subjectId: state.subjects[0]?.id || '', moduleId: '', q: '', a: ''};
  const isEdit = !!id;
  openModal(`
    <div class="modal-head"><div class="modal-title">${isEdit ? 'Edit' : 'New'} Flashcard</div><button class="modal-close" onclick="closeModal()">${icon('x')}</button></div>
    <div class="field"><label>Subject</label>
      <select class="select" id="fcSub" onchange="updateFcModules()">${state.subjects.map(s=>`<option value="${s.id}" ${s.id===c.subjectId?'selected':''}>${s.name}</option>`).join('')}</select>
    </div>
    <div class="field"><label>Module (Tag)</label>
      <select class="select" id="fcMod"><option value="">No specific module</option></select>
    </div>
    <div class="field"><label>Question</label><textarea class="textarea" id="fcQIn" placeholder="What is...">${(c.q||'').replace(/</g,'&lt;')}</textarea></div>
    <div class="field"><label>Answer</label><textarea class="textarea" id="fcAIn" placeholder="It is...">${(c.a||'').replace(/</g,'&lt;')}</textarea></div>
    <button class="btn btn-primary w-full" onclick="saveFlashcard('${id||''}')">${isEdit ? 'Save Changes' : 'Create Card'}</button>
    ${isEdit ? `<button class="btn btn-ghost w-full mt-2" style="color:var(--red)" onclick="deleteFlashcard('${id}')">Delete Card</button>` : ''}
  `);
  setTimeout(() => updateFcModules(c.moduleId), 50);
}
function updateFcModules(selectedModId){
  const subId=$('#fcSub')?$('#fcSub').value:'';
  const modSelect=$('#fcMod');
  if(!modSelect)return;
  const mods=state.modules.filter(m=>m.subjectId===subId);
  modSelect.innerHTML='<option value="">No specific module</option>'+mods.map(m=>`<option value="${m.id}" ${m.id===selectedModId?'selected':''}>${m.name}</option>`).join('');
}
async function saveFlashcard(id){
  const existing = id ? state.flashcards.find(x=>x.id===id) : null;
  const data={
    ...(existing || {}),
    id: id || uid(),
    subjectId:$('#fcSub').value,
    moduleId:$('#fcMod').value,
    q:$('#fcQIn').value.trim(),
    a:$('#fcAIn').value.trim(),
    created: existing?.created || Date.now()
  };
  if(!data.q||!data.a){toast('Fill both sides');return}
  await dbPut('flashcards',data);
  await loadAll();
  closeModal();
  renderView();
  toast(id ? 'Card updated' : 'Card added');
}
async function deleteFlashcard(id){
  if(!confirm('Delete this flashcard?')) return;
  await dbDel('flashcards', id);
  await loadAll();
  if(state._fcIdx >= state.flashcards.length && state._fcIdx > 0) state._fcIdx--;
  closeModal();
  renderView();
  toast('Card deleted');
}
function editCurrentCard(){
  const c = state.flashcards[state._fcIdx];
  if(c) openFlashcardModal(c.id);
}
async function deleteCurrentCard(){
  const c = state.flashcards[state._fcIdx];
  if(!c) return;
  if(!confirm('Delete this flashcard?')) return;
  await dbDel('flashcards', c.id);
  await loadAll();
  if(state._fcIdx >= state.flashcards.length && state._fcIdx > 0) state._fcIdx--;
  renderView();
  toast('Card deleted');
}

/* ---------- GOALS ---------- */
function viewGoals(){
  const groups={daily:[],weekly:[],monthly:[],semester:[]};
  state.goals.forEach(g=>(groups[g.period]||groups.daily).push(g));
  $('#main').innerHTML=`
  <div class="page">
    <div class="flex justify-between items-center mb-3">
      <div><div class="page-title">Goals</div><div class="page-sub">${state.goals.filter(g=>g.done).length}/${state.goals.length} completed</div></div>
      <button class="btn btn-primary" onclick="openGoalModal()">${icon('plus')}<span>New</span></button>
    </div>
    ${['daily','weekly','monthly','semester'].map(p=>`
      <div class="section">
        <div class="section-head"><div class="section-title">${p[0].toUpperCase()+p.slice(1)}</div></div>
        <div class="list">
          ${groups[p].map(g=>`<div class="list-item" onclick="toggleGoal('${g.id}')"><div class="habit-check ${g.done?'done':''}"></div><div class="list-main"><div class="list-title" style="${g.done?'text-decoration:line-through;opacity:0.5':''}">${g.title}</div><div class="list-sub">${g.desc||''}</div></div><button class="icon-btn" onclick="event.stopPropagation();deleteGoal('${g.id}')">${icon('trash')}</button></div>`).join('')||`<div class="empty"><div class="empty-sub">No ${p} goals</div></div>`}
        </div>
      </div>
    `).join('')}
  </div>`;
}
function openGoalModal(){
  openModal(`
    <div class="modal-head"><div class="modal-title">New Goal</div><button class="modal-close" onclick="closeModal()">${icon('x')}</button></div>
    <div class="field"><label>Title</label><input class="input" id="gTitle" placeholder="Complete Chapter 3"></div>
    <div class="field"><label>Description</label><textarea class="textarea" id="gDesc"></textarea></div>
    <div class="field"><label>Period</label>
      <select class="select" id="gPer"><option value="daily">Daily</option><option value="weekly">Weekly</option><option value="monthly">Monthly</option><option value="semester">Semester</option></select>
    </div>
    <button class="btn btn-primary w-full" onclick="saveGoal()">Create Goal</button>
  `);
}
async function saveGoal(){
  const data={id:uid(),title:$('#gTitle').value.trim(),desc:$('#gDesc').value.trim(),period:$('#gPer').value,done:false,created:Date.now()};
  if(!data.title){toast('Title required');return}
  await dbPut('goals',data);await loadAll();closeModal();renderView();toast('Goal added');
}
async function toggleGoal(id){const g=state.goals.find(x=>x.id===id);g.done=!g.done;await dbPut('goals',g);await loadAll();renderView()}
async function deleteGoal(id){await dbDel('goals',id);await loadAll();renderView()}

/* ---------- HABITS ---------- */
function viewHabits(){
  const t=today();
  $('#main').innerHTML=`
  <div class="page">
    <div class="flex justify-between items-center mb-3">
      <div><div class="page-title">Habits</div><div class="page-sub">${state.habits.length} habits tracked</div></div>
      <button class="btn btn-primary" onclick="openHabitModal()">${icon('plus')}<span>New</span></button>
    </div>
    <div class="list">
      ${state.habits.map(h=>{
        const done=(h.log||[]).includes(t);
        const streak=calcHabitStreak(h);
        return `<div class="habit-row"><div class="habit-check ${done?'done':''}" onclick="toggleHabit('${h.id}')"></div><div><div class="fw-600">${h.name}</div><div class="text-xs text-muted">${h.category||'General'}</div></div><div class="habit-streak">🔥 ${streak}</div><button class="icon-btn" onclick="deleteHabit('${h.id}')">${icon('trash')}</button></div>`;
      }).join('')||emptyHTML('activity','No habits yet','Build consistent study habits')}
    </div>
  </div>`;
}
function calcHabitStreak(h){
  let s=0,d=new Date();
  while((h.log||[]).includes(d.toISOString().slice(0,10))){s++;d.setDate(d.getDate()-1)}
  return s;
}
function openHabitModal(){
  openModal(`
    <div class="modal-head"><div class="modal-title">New Habit</div><button class="modal-close" onclick="closeModal()">${icon('x')}</button></div>
    <div class="field"><label>Name</label><input class="input" id="hName" placeholder="Read 30 minutes"></div>
    <div class="field"><label>Category</label>
      <select class="select" id="hCat"><option>Study</option><option>Reading</option><option>Exercise</option><option>Meditation</option><option>Other</option></select>
    </div>
    <button class="btn btn-primary w-full" onclick="saveHabit()">Create Habit</button>
  `);
}
async function saveHabit(){
  const data={id:uid(),name:$('#hName').value.trim(),category:$('#hCat').value,log:[],created:Date.now()};
  if(!data.name){toast('Name required');return}
  await dbPut('habits',data);await loadAll();closeModal();renderView();
}
async function toggleHabit(id){
  const h=state.habits.find(x=>x.id===id);const t=today();
  h.log=h.log||[];
  if(h.log.includes(t))h.log=h.log.filter(d=>d!==t);else h.log.push(t);
  await dbPut('habits',h);await loadAll();renderView();
}
async function deleteHabit(id){await dbDel('habits',id);await loadAll();renderView()}

/* ---------- TIMETABLE ---------- */
function viewTimetable(){
  const days=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  const hours=[8,9,10,11,12,13,14,15,16,17];
  $('#main').innerHTML=`
  <div class="page">
    <div class="page-title">Timetable</div>
    <div class="page-sub">Tap slots to assign subjects</div>
    <div style="overflow-x:auto">
    <div class="tt-grid" style="min-width:700px">
      <div></div>${days.map(d=>`<div class="tt-head">${d}</div>`).join('')}
      ${hours.map(h=>`
        <div class="tt-time">${h}:00</div>
        ${days.map((d,di)=>{
          const slot=state.timetable.find(t=>t.day===di&&t.hour===h);
          const sub=slot?state.subjects.find(s=>s.id===slot.subjectId):null;
          return `<div class="tt-cell ${sub?'filled':''}" style="--sc:${sub?.color||''}" onclick="openSlotModal(${di},${h})">${sub?`<div class="tt-cell-title">${sub.name}</div>`:''}</div>`;
        }).join('')}
      `).join('')}
    </div>
    </div>
  </div>`;
}
function openSlotModal(day,hour){
  const existing=state.timetable.find(t=>t.day===day&&t.hour===hour);
  const days=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  openModal(`
    <div class="modal-head"><div class="modal-title">${days[day]} · ${hour}:00</div><button class="modal-close" onclick="closeModal()">${icon('x')}</button></div>
    <div class="field"><label>Subject</label>
      <select class="select" id="slotSub"><option value="">— None —</option>${state.subjects.map(s=>`<option value="${s.id}" ${existing?.subjectId===s.id?'selected':''}>${s.name}</option>`).join('')}</select>
    </div>
    <button class="btn btn-primary w-full" onclick="saveSlot(${day},${hour})">Save</button>
    ${existing?`<button class="btn btn-ghost w-full mt-2" onclick="deleteSlot(${day},${hour})">Remove</button>`:''}
  `);
}
async function saveSlot(day,hour){
  const subjectId=$('#slotSub').value;
  const id=`${day}-${hour}`;
  if(!subjectId){await dbDel('timetable',id)}
  else{await dbPut('timetable',{id,day,hour,subjectId})}
  await loadAll();closeModal();renderView();
}
async function deleteSlot(day,hour){await dbDel('timetable',`${day}-${hour}`);await loadAll();closeModal();renderView()}

/* ---------- JOURNAL ---------- */
function viewJournal(){
  $('#main').innerHTML=`
  <div class="page">
    <div class="flex justify-between items-center mb-3">
      <div><div class="page-title">Journal</div><div class="page-sub">${state.journal.length} entries</div></div>
      <button class="btn btn-primary" onclick="openJournalModal()">${icon('plus')}<span>New</span></button>
    </div>
    <div class="list">
      ${state.journal.sort((a,b)=>b.date.localeCompare(a.date)).map(j=>`
        <div class="list-item" onclick="openJournal('${j.id}')">
          <div class="list-main">
            <div class="list-title">${j.title||fmtDate(j.date)}</div>
            <div class="list-sub">${j.type} · ${fmtDate(j.date)}</div>
          </div>
          <button class="icon-btn" onclick="event.stopPropagation();deleteJournal('${j.id}')">${icon('trash')}</button>
        </div>
      `).join('')||emptyHTML('edit','No entries yet','Reflect on your academic journey')}
    </div>
  </div>`;
}
function openJournalModal(id){
  const j=id?state.journal.find(x=>x.id===id):{title:'',content:'',type:'Daily',date:today()};
  openModal(`
    <div class="modal-head"><div class="modal-title">${id?'Edit':'New'} Entry</div><button class="modal-close" onclick="closeModal()">${icon('x')}</button></div>
    <div class="field"><label>Title</label><input class="input" id="jTitle" value="${(j.title||'').replace(/"/g,'&quot;')}"></div>
    <div class="field"><label>Type</label>
      <select class="select" id="jType"><option ${j.type==='Daily'?'selected':''}>Daily</option><option ${j.type==='Weekly'?'selected':''}>Weekly</option><option ${j.type==='Academic'?'selected':''}>Academic</option></select>
    </div>
    <div class="field"><label>Reflection</label><textarea class="textarea" id="jContent" style="min-height:140px">${j.content||''}</textarea></div>
    <button class="btn btn-primary w-full" onclick="saveJournal('${id||''}')">Save</button>
  `);
}
async function saveJournal(id){
  const data={id:id||uid(),title:$('#jTitle').value.trim(),type:$('#jType').value,content:$('#jContent').value,date:id?state.journal.find(x=>x.id===id).date:today()};
  await dbPut('journal',data);await loadAll();closeModal();renderView();toast('Saved');
}
function openJournal(id){openJournalModal(id)}
async function deleteJournal(id){if(!confirm('Delete entry?'))return;await dbDel('journal',id);await loadAll();renderView()}

/* ---------- KNOWLEDGE GRAPH ---------- */
function viewGraph(){
  $('#main').innerHTML=`
  <div class="page">
    <div class="page-title">Knowledge Graph</div>
    <div class="page-sub">Visual connections between subjects, modules & notes</div>
    <div class="graph-wrap"><canvas id="graphCanvas"></canvas></div>
    <div class="section">
      <div class="section-title mb-3">Legend</div>
      <div class="flex gap-3" style="flex-wrap:wrap">
        <div class="chip"><div class="chip-dot" style="background:#7c9cff"></div>Subject</div>
        <div class="chip"><div class="chip-dot" style="background:#a78bfa"></div>Module</div>
        <div class="chip"><div class="chip-dot" style="background:#34d399"></div>Note</div>
      </div>
    </div>
  </div>`;
  setTimeout(drawGraph,50);
}
function drawGraph(){
  const c=$('#graphCanvas');if(!c)return;
  const ctx=c.getContext('2d');
  const dpr=window.devicePixelRatio||1;
  const w=c.clientWidth,h=c.clientHeight;
  c.width=w*dpr;c.height=h*dpr;ctx.scale(dpr,dpr);
  const nodes=[];const edges=[];
  state.subjects.forEach((s,i)=>{
    const a=(i/Math.max(1,state.subjects.length))*Math.PI*2;
    nodes.push({id:s.id,x:w/2+Math.cos(a)*Math.min(w,h)*0.3,y:h/2+Math.sin(a)*Math.min(w,h)*0.3,r:18,color:s.color||'#7c9cff',label:s.name,type:'subject'});
  });
  state.modules.forEach(m=>{
    const p=nodes.find(n=>n.id===m.subjectId);if(!p)return;
    const sibs=state.modules.filter(x=>x.subjectId===m.subjectId);
    const i=sibs.indexOf(m);const a=(i/sibs.length)*Math.PI*2;
    nodes.push({id:m.id,x:p.x+Math.cos(a)*50,y:p.y+Math.sin(a)*50,r:8,color:'#a78bfa',label:m.name,type:'module'});
    edges.push({from:m.id,to:m.subjectId});
  });
  state.notes.slice(0,20).forEach(n=>{
    const p=nodes.find(x=>x.id===n.subjectId);if(!p)return;
    const a=Math.random()*Math.PI*2;const d=70+Math.random()*30;
    nodes.push({id:n.id,x:p.x+Math.cos(a)*d,y:p.y+Math.sin(a)*d,r:6,color:'#34d399',label:n.title,type:'note'});
    edges.push({from:n.id,to:n.subjectId});
  });
  let t=0;
  function frame(){
    t+=0.01;
    ctx.clearRect(0,0,w,h);
    ctx.strokeStyle='rgba(255,255,255,0.08)';ctx.lineWidth=1;
    edges.forEach(e=>{
      const a=nodes.find(n=>n.id===e.from),b=nodes.find(n=>n.id===e.to);
      if(!a||!b)return;
      ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();
    });
    nodes.forEach(n=>{
      n.x+=Math.sin(t+n.id.charCodeAt(0))*0.2;
      n.y+=Math.cos(t+n.id.charCodeAt(0))*0.2;
      ctx.beginPath();ctx.arc(n.x,n.y,n.r,0,Math.PI*2);
      ctx.fillStyle=n.color;ctx.fill();
      ctx.strokeStyle='rgba(255,255,255,0.2)';ctx.stroke();
      if(n.type==='subject'){
        ctx.fillStyle='#fff';ctx.font='600 11px Inter';ctx.textAlign='center';
        ctx.fillText(n.label,n.x,n.y+n.r+14);
      }
    });
    if($('#graphCanvas'))requestAnimationFrame(frame);
  }
  frame();
}

/* ---------- SETTINGS ---------- */
function openSettings(){
  const p=state.profile;
  openModal(`
    <div class="modal-head"><div class="modal-title">Settings</div><button class="modal-close" onclick="closeModal()">${icon('x')}</button></div>

    <div class="section-title mb-3">Profile</div>
    <div class="field"><label>Name</label><input class="input" id="pName" value="${p.name||''}"></div>
    <div class="field"><label>Semester</label><input class="input" type="number" id="pSem" value="${p.semester||1}" min="1" max="10"></div>
    <button class="btn btn-ghost w-full mb-3" onclick="saveProfileSettings()">Save Profile</button>

    <div class="section-title mb-3">Timer Durations</div>
    <div class="field"><label>Pomodoro (minutes)</label><input class="input" type="number" id="setPom" value="${state.settings.pomodoro}"></div>
    <div class="field"><label>Break (minutes)</label><input class="input" type="number" id="setBrk" value="${state.settings.break}"></div>
    <div class="field"><label>Ultradian (minutes)</label><input class="input" type="number" id="setUlt" value="${state.settings.ultradian}"></div>
    <button class="btn btn-primary w-full" onclick="saveSettings()">Save Timer Settings</button>

    <div class="section-title mt-4 mb-3">Data Management</div>
    <div class="flex gap-2">
      <button class="btn btn-ghost" onclick="exportData()">Export Backup</button>
      <button class="btn btn-ghost" onclick="document.getElementById('importFile').click()">Import Backup</button>
      <input type="file" id="importFile" accept=".json" style="display:none" onchange="importData(event)">
    </div>
    <button class="btn btn-ghost w-full mt-2" style="color:var(--red)" onclick="resetAll()">Reset All Data</button>
    <div class="text-xs text-muted mt-4" style="text-align:center">StudyBuddy · Student Operating System<br>All data stored locally via IndexedDB</div>
  `);
}
async function saveProfileSettings(){
  state.profile={...state.profile,name:$('#pName').value.trim()||'Student',semester:+$('#pSem').value||1};
  await dbPut('profile',state.profile);await loadAll();toast('Profile saved');
}
async function saveSettings(){
  state.settings={pomodoro:+$('#setPom').value||25,break:+$('#setBrk').value||5,ultradian:+$('#setUlt').value||90};
  await dbPut('settings',{id:'main',...state.settings});
  closeModal();toast('Settings saved');setTimerMode(state.timerMode);
}
async function exportData(){
  const data={};
  for(const s of STORES)data[s]=await dbAll(s);
  const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);
  a.download=`studybuddy-backup-${today()}.json`;a.click();
  toast('Backup exported');
}
async function importData(e){
  const file=e.target.files[0];if(!file)return;
  const text=await file.text();
  try{
    const data=JSON.parse(text);
    for(const s of STORES){
      if(data[s]){
        await dbClear(s);
        for(const item of data[s])await dbPut(s,item);
      }
    }
    await loadAll();closeModal();renderView();toast('Backup imported');
  }catch(err){toast('Invalid backup file')}
}
async function resetAll(){
  if(!confirm('Delete ALL data? This cannot be undone.'))return;
  for(const s of STORES)await dbClear(s);
  await loadAll();closeModal();renderView();toast('All data cleared');
}

/* ---------- SEARCH ---------- */
function openSearch(){
  openModal(`
    <div class="modal-head"><div class="modal-title">Search</div><button class="modal-close" onclick="closeModal()">${icon('x')}</button></div>
    <input class="input" id="searchInput" placeholder="Search notes, subjects, modules..." autofocus>
    <div id="searchResults" class="mt-3"></div>
  `);
  $('#searchInput').oninput=e=>{
    const q=e.target.value.toLowerCase();
    if(!q){$('#searchResults').innerHTML='';return}
    const results=[];
    state.subjects.filter(s=>s.name.toLowerCase().includes(q)).forEach(s=>results.push({type:'Subject',title:s.name,action:`closeModal();openSubject('${s.id}')`}));
    state.notes.filter(n=>(n.title||'').toLowerCase().includes(q)).forEach(n=>results.push({type:'Note',title:n.title,action:`closeModal();openNote('${n.id}')`}));
    state.modules.filter(m=>m.name.toLowerCase().includes(q)).forEach(m=>{const s=state.subjects.find(x=>x.id===m.subjectId);results.push({type:'Module',title:m.name+' · '+(s?.name||''),action:`closeModal();openSubject('${m.subjectId}')`})});
    state.goals.filter(g=>g.title.toLowerCase().includes(q)).forEach(g=>results.push({type:'Goal',title:g.title,action:`closeModal();setView('goals')`}));
    state.journal.filter(j=>(j.title||'').toLowerCase().includes(q)||j.content.toLowerCase().includes(q)).forEach(j=>results.push({type:'Journal',title:j.title||fmtDate(j.date),action:`closeModal();openJournal('${j.id}')`}));
    $('#searchResults').innerHTML=results.length?`<div class="list">${results.slice(0,10).map(r=>`<div class="list-item" onclick="${r.action}"><div class="chip">${r.type}</div><div class="list-main"><div class="list-title">${r.title}</div></div></div>`).join('')}</div>`:'<div class="empty"><div class="empty-sub">No results</div></div>';
  };
}

/* ---------- EVENT LISTENERS ---------- */
$('#settingsBtn').onclick=openSettings;
$('#searchBtn').onclick=openSearch;

document.addEventListener('mousemove',e=>{
  $$('.card').forEach(c=>{
    const r=c.getBoundingClientRect();
    c.style.setProperty('--mx',(e.clientX-r.left)+'px');
    c.style.setProperty('--my',(e.clientY-r.top)+'px');
  });
});

/* ---------- SERVICE WORKER ---------- */
if('serviceWorker' in navigator){
  const swCode=`self.addEventListener('install',e=>self.skipWaiting());self.addEventListener('activate',e=>self.clients.claim());self.addEventListener('fetch',e=>{e.respondWith(fetch(e.request).catch(()=>caches.match(e.request)))});`;
  const blob=new Blob([swCode],{type:'application/javascript'});
  navigator.serviceWorker.register(URL.createObjectURL(blob)).catch(()=>{});
}

/* ---------- INIT ---------- */
(async()=>{
  await openDB();
  await loadAll();
  renderTabs();
  renderView();
})();

/* ---------- Expose for inline handlers ---------- */
window.setView=setView;
window.openSubjectModal=openSubjectModal;window.saveSubject=saveSubject;window.deleteSubject=deleteSubject;
window.openSubject=openSubject;window.openModuleModal=openModuleModal;window.saveModule=saveModule;
window.toggleModule=toggleModule;window.deleteModule=deleteModule;
window.openNoteModal=openNoteModal;window.saveNote=saveNote;window.deleteNote=deleteNote;
window.openNote=openNote;window.saveNoteContent=saveNoteContent;window.execCmd=execCmd;window.insertCode=insertCode;
window.toggleTimer=toggleTimer;window.resetTimer=resetTimer;window.setTimerMode=setTimerMode;
window.saveSession=saveSession;
window.openFlashcardModal=openFlashcardModal;window.saveFlashcard=saveFlashcard;window.deleteFlashcard=deleteFlashcard;
window.nextCard=nextCard;window.prevCard=prevCard;window.rateCard=rateCard;window.showHint=showHint;window.updateFcModules=updateFcModules;
window.editCurrentCard=editCurrentCard;window.deleteCurrentCard=deleteCurrentCard;
window.openGoalModal=openGoalModal;window.saveGoal=saveGoal;window.toggleGoal=toggleGoal;window.deleteGoal=deleteGoal;
window.openHabitModal=openHabitModal;window.saveHabit=saveHabit;window.toggleHabit=toggleHabit;window.deleteHabit=deleteHabit;
window.openSlotModal=openSlotModal;window.saveSlot=saveSlot;window.deleteSlot=deleteSlot;
window.openJournalModal=openJournalModal;window.saveJournal=saveJournal;window.deleteJournal=deleteJournal;window.openJournal=openJournal;
window.openEventModal=openEventModal;window.saveEvent=saveEvent;window.deleteEvent=deleteEvent;
window.saveProfileSettings=saveProfileSettings;
window.exportData=exportData;window.importData=importData;window.resetAll=resetAll;window.saveSettings=saveSettings;
window.closeModal=closeModal;
