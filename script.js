const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
let APPS={},z=10,wid=0,wins={};
const LS=k=>{try{return JSON.parse(localStorage.getItem(k))}catch(e){return null}};
const SV=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}};
const esc=t=>String(t).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const BASE=['explorer','edge','notepad','calc','settings','store'],PROTECTED=['store','explorer','settings'];
const DL={explorer:'This PC',notepad:'Notes.txt'};
let installed=LS('w11.installed'),custom=LS('w11.custom')||[];
function notify(t,m){const n=$('#toast');n.innerHTML=`<b>${esc(t)}</b><div style="margin-top:4px;color:var(--sub)">${esc(m)}</div>`;n.style.transform='none';clearTimeout(notify.t);notify.t=setTimeout(()=>n.style.transform='translateX(380px)',5000)}
const FALLBACK=[
 {id:'explorer',name:'File Explorer',icon:'📁',type:'builtin',cat:'System',desc:'Browse files and folders (demo content).',w:760,h:480},
 {id:'edge',name:'Microsoft Edge',icon:'🌐',type:'builtin',cat:'System',desc:'Browser mockup page.',w:900,h:560},
 {id:'notepad',name:'Notepad',icon:'📝',type:'builtin',cat:'Utilities',desc:'Simple text editor.',w:560,h:400},
 {id:'calc',name:'Calculator',icon:'🧮',type:'builtin',cat:'Utilities',desc:'Standard calculator.',w:340,h:520},
 {id:'settings',name:'Settings',icon:'⚙️',type:'builtin',cat:'System',desc:'Dark mode and system options.',w:860,h:560},
 {id:'store',name:'Microsoft Store',icon:'🛍️',type:'builtin',cat:'System',desc:'Find and install apps.',w:860,h:560}];
/* app registry: apps.json + user-added custom apps */
async function loadRegistry(){
  let list=[];
  try{const r=await fetch('apps.json',{cache:'no-cache'});list=(await r.json()).apps}
  catch(e){list=FALLBACK;notify('Could not load apps.json','Showing built-in apps only. Open the page through a web server (http://127.0.0.1:8080), not by double-clicking index.html.')}
  APPS={};
  [...list,...custom].forEach(a=>{APPS[a.id]=Object.assign({w:760,h:500,icon:'📦',type:'web',cat:'Utilities',desc:''},a);APPS[a.id].i=APPS[a.id].icon;APPS[a.id].n=APPS[a.id].name});
  if(!installed)installed=BASE.slice();
  installed=installed.filter(id=>APPS[id]);
  renderShell();
}
function saveInstalled(){SV('w11.installed',installed);renderShell()}
/* desktop icons, Start menu, pinned taskbar buttons all follow the installed list */
function renderShell(){
  const desk=['explorer','edge','notepad',...installed.filter(id=>!BASE.includes(id))].filter(id=>installed.includes(id));
  $('#icons').innerHTML=[...desk.map(id=>`<div class="dicon" data-a="${id}"><span>${APPS[id].i}</span>${esc(DL[id]||APPS[id].n)}</div>`),'<div class="dicon"><span>🗑️</span>Recycle Bin</div>'].join('');
  $$('.dicon[data-a]').forEach(d=>{d.onclick=e=>{e.stopPropagation();$$('.dicon').forEach(x=>x.classList.remove('sel'));d.classList.add('sel')};d.ondblclick=()=>openApp(d.dataset.a)});
  $('#pinned').innerHTML=installed.map(id=>`<div class="app" data-a="${id}"><i>${APPS[id].i}</i>${esc(APPS[id].n.replace('Microsoft ',''))}</div>`).join('');
  $$('.app').forEach(a=>a.onclick=()=>{openApp(a.dataset.a);close_all()});
  $$('.tb.pin').forEach(t=>{const id=t.dataset.app;if(!Object.values(wins).some(w=>w.k===id))t.remove()});
  ['store','explorer','edge'].forEach(id=>{if(!installed.includes(id)||document.querySelector(`.tb.pin[data-app="${id}"]`))return;
    const t=document.createElement('div');t.className='tb pin';t.dataset.app=id;t.innerHTML=APPS[id].i;t.title=APPS[id].n;t.onclick=()=>openApp(id);$('#tb-apps').before(t)});
}
function installApp(id,open){if(!installed.includes(id))installed.push(id);saveInstalled();if(open)openApp(id)}
function uninstallApp(id){
  if(PROTECTED.includes(id))return;
  Object.values(wins).filter(w=>w.k===id).forEach(w=>w.el.querySelector('.x').click());
  installed=installed.filter(x=>x!==id);
  if(id.startsWith('custom-')){custom=custom.filter(a=>a.id!==id);delete APPS[id];SV('w11.custom',custom)}
  saveInstalled();
}
/* flyouts */
const FL=['start','widgets','qs','cal'];
function close_all(except){FL.forEach(f=>{if(f!==except)$('#'+f).classList.remove('open')});$('#pmenu').style.display='none';$('#start-btn').classList.toggle('active',except==='start')}
function toggle(id){const el=$('#'+id),o=el.classList.contains('open');close_all(o?null:id);el.classList.toggle('open',!o);$('#start-btn').classList.toggle('active',!o&&id==='start');if(id==='start'&&!o)$('#sq').focus()}
$('#start-btn').onclick=e=>{e.stopPropagation();toggle('start')};
$('#widgets-btn').onclick=e=>{e.stopPropagation();toggle('widgets')};
$('#tray').onclick=e=>{e.stopPropagation();toggle('qs')};
$('#clock').onclick=e=>{e.stopPropagation();toggle('cal')};
$('#search-box').onclick=e=>{e.stopPropagation();toggle('start')};
$('#pw').onclick=e=>{e.stopPropagation();const m=$('#pmenu');m.style.display=m.style.display==='block'?'none':'block'};
FL.forEach(f=>$('#'+f).onclick=e=>e.stopPropagation());
document.addEventListener('click',()=>{close_all();$('#ctx').style.display='none';$$('.dicon').forEach(x=>x.classList.remove('sel'))});
$('#sq').oninput=e=>{const q=e.target.value.toLowerCase();$$('#pinned .app').forEach(a=>a.style.display=a.textContent.toLowerCase().includes(q)?'':'none')};
/* quick settings */
$$('.q[data-t]').forEach(q=>q.onclick=()=>q.classList.toggle('on'));
$('#darkq').onclick=()=>setDark(!document.body.classList.contains('dark'));
function setDark(d){document.body.classList.toggle('dark',d);$('#darkq').classList.toggle('on',d);$$('.tog[data-dark]').forEach(t=>t.classList.toggle('on',d))}
$('#bright').oninput=e=>$('#desktop').style.opacity=.3+e.target.value/100*.7;
/* clock & calendar */
function tick(){const n=new Date();$('#ct').textContent=n.toLocaleTimeString([], {hour:'numeric',minute:'2-digit'});$('#cd').textContent=n.toLocaleDateString([], {day:'2-digit',month:'2-digit',year:'numeric'})}
tick();setInterval(tick,1000);
(function(){const n=new Date(),y=n.getFullYear(),m=n.getMonth();$('#calh').textContent=n.toLocaleDateString([], {weekday:'long',month:'long',day:'numeric',year:'numeric'});
 let h=['Su','Mo','Tu','We','Th','Fr','Sa'].map(d=>`<div class="h">${d}</div>`).join(''),f=new Date(y,m,1).getDay(),dm=new Date(y,m+1,0).getDate();
 for(let i=0;i<f;i++)h+='<div></div>';for(let d=1;d<=dm;d++)h+=`<div class="${d===n.getDate()?'today':''}">${d}</div>`;$('#cgrid').innerHTML=h})();
/* context menu */
$('#desktop').oncontextmenu=e=>{e.preventDefault();close_all();const c=$('#ctx');c.style.display='block';c.style.left=Math.min(e.clientX,innerWidth-230)+'px';c.style.top=Math.min(e.clientY,innerHeight-190)+'px'};
function refresh(){const d=$('#desktop');d.style.opacity=.4;setTimeout(()=>d.style.opacity=1,150)}
function lock(){document.body.innerHTML='<div style="position:fixed;inset:0;background:#000;color:#fff;display:grid;place-items:center;font-size:20px" onclick="location.reload()">Click to wake</div>'}
/* window manager */
function openApp(k){
  close_all();$('#ctx').style.display='none';
  if(!APPS[k])return;
  const existing=Object.values(wins).find(w=>w.k===k&&k!=='notepad'&&k!=='calc');
  if(existing){restore(existing.id);return}
  const a=Object.assign({},APPS[k],{w:Math.min(APPS[k].w,innerWidth-20),h:Math.min(APPS[k].h,innerHeight-68)}),id=++wid,el=document.createElement('div');
  el.className='win blur';el.style.cssText=`width:${a.w}px;height:${a.h}px;left:${Math.max(10,(innerWidth-a.w)/2+wid*22%120)}px;top:${Math.max(10,(innerHeight-a.h-48)/2+wid*22%100)}px;z-index:${++z}`;
  el.innerHTML=`<div class="title"><div class="t"><span>${a.i}</span>${a.n}</div><div class="ctl"><button class="mn">&#xE921;</button><button class="mx">&#xE922;</button><button class="x">&#xE8BB;</button></div></div><div class="body">${content(k)}</div><div class="rz"></div>`;
  $('#wins').appendChild(el);
  const pin=document.querySelector(`.tb.pin[data-app="${k}"]`),tb=pin||document.createElement('div');tb.classList.add('tb','run','active');tb.innerHTML=a.i;tb.title=a.n;if(!pin)$('#tb-apps').appendChild(tb);
  wins[id]={id,k,el,tb,max:false};
  const w=wins[id];
  tb.onclick=()=>{ if(w.el.classList.contains('min')||!w.el.classList.contains('focus'))restore(id);else minimize(id)};
  el.onmousedown=()=>focus(id);
  el.querySelector('.mn').onclick=()=>minimize(id);
  el.querySelector('.mx').onclick=()=>toggleMax(id);
  el.querySelector('.x').onclick=()=>{el.remove();delete wins[id];if(pin){tb.classList.remove('run','active');tb.onclick=()=>openApp(k)}else tb.remove()};
  el.querySelector('.title').ondblclick=()=>toggleMax(id);
  drag(el,el.querySelector('.title'),id);resize(el,el.querySelector('.rz'));
  bind(k,el);focus(id);
}
function focus(id){Object.values(wins).forEach(w=>{w.el.classList.remove('focus');w.tb.classList.remove('active')});const w=wins[id];if(!w)return;w.el.classList.add('focus');w.tb.classList.add('active');w.el.style.zIndex=++z}
function minimize(id){const w=wins[id];w.el.classList.add('min');w.el.classList.remove('focus');w.tb.classList.remove('active')}
function restore(id){wins[id].el.classList.remove('min');focus(id)}
function toggleMax(id){const w=wins[id];w.max=!w.max;w.el.classList.toggle('max',w.max)}
function drag(el,h,id){h.onmousedown=e=>{if(e.target.closest('.ctl')||wins[id].max)return;const ox=e.clientX-el.offsetLeft,oy=e.clientY-el.offsetTop;
  const mv=ev=>{el.style.left=ev.clientX-ox+'px';el.style.top=Math.max(0,Math.min(ev.clientY-oy,innerHeight-90))+'px'};
  document.body.classList.add('dragging');const up=()=>{document.body.classList.remove('dragging');removeEventListener('mousemove',mv);removeEventListener('mouseup',up)};addEventListener('mousemove',mv);addEventListener('mouseup',up)}}
function resize(el,h){h.onmousedown=e=>{e.stopPropagation();const sx=e.clientX,sy=e.clientY,sw=el.offsetWidth,sh=el.offsetHeight;
  const mv=ev=>{el.style.width=Math.max(300,sw+ev.clientX-sx)+'px';el.style.height=Math.max(200,sh+ev.clientY-sy)+'px'};
  document.body.classList.add('dragging');const up=()=>{document.body.classList.remove('dragging');removeEventListener('mousemove',mv);removeEventListener('mouseup',up)};addEventListener('mousemove',mv);addEventListener('mouseup',up)}}
/* app content */
function content(k){
 if(APPS[k].type==='web')return webView(APPS[k]);
 if(k==='store')return storeView();
 if(k==='notepad')return`<div class="np" style="height:100%;display:flex;flex-direction:column"><div class="menubar"><span>File</span><span>Edit</span><span>View</span></div><textarea spellcheck="false" placeholder="Start typing…"></textarea></div>`;
 if(k==='calc')return`<div class="calc"><div class="disp"><small></small><div class="v">0</div></div><div class="keys">${['C','±','%','÷','7','8','9','×','4','5','6','−','1','2','3','+','0','.','⌫','='].map(b=>`<button class="${/\d|\./.test(b)?'n':b==='='?'eq':''}">${b}</button>`).join('')}</div></div>`;
 if(k==='explorer')return`<div class="fe"><aside><div class="a">🏠 Home</div><div>🖥️ Desktop</div><div>⬇️ Downloads</div><div>📄 Documents</div><div>🖼️ Pictures</div><div>🎵 Music</div><div style="margin-top:12px">💻 This PC</div></aside><main><div class="addr">This PC › Documents</div><div class="files"><div><i>📁</i>Projects</div><div><i>📁</i>Work</div><div><i>📁</i>Photos</div><div><i>📄</i>Notes.txt</div><div><i>📊</i>Budget.xlsx</div><div><i>🖼️</i>Logo.png</div><div><i>📕</i>Guide.pdf</div><div><i>🎞️</i>Demo.mp4</div></div></main></div>`;
 if(k==='settings')return`<div class="set"><aside><div class="a">🖥️ System</div><div>🔵 Bluetooth &amp; devices</div><div>📶 Network &amp; internet</div><div>🎨 Personalization</div><div>📦 Apps</div><div>🕒 Time &amp; language</div></aside><main><h1>System</h1><div class="row"><span>🌙 Dark mode</span><div class="tog" data-dark></div></div><div class="row"><span>🔋 Battery saver</span><div class="tog"></div></div><div class="row"><span>🔔 Notifications</span><div class="tog on"></div></div><div class="row"><span>📐 Display scale</span><span style="color:var(--sub)">100% (Recommended)</span></div><div class="row"><span>💾 Storage</span><span style="color:var(--sub)">312 GB of 512 GB used</span></div></main></div>`;
 if(k==='edge')return`<div class="edge"><div class="bar"><span>←</span><span>→</span><span>⟳</span><div class="url">🔒 https://www.bing.com</div><span>⋯</span></div><div class="page"><div><h1>Search the web</h1><p style="margin-top:14px;font-size:15px">This is a static replica page.</p></div></div></div>`;
 return`<div style="display:grid;place-items:center;height:100%;font-size:16px;color:var(--sub);text-align:center"><div><div style="font-size:60px">${APPS[k].i}</div>${APPS[k].n}</div></div>`;
}
function bind(k,el){
 if(APPS[k].type==='web')return bindWeb(k,el);
 if(k==='store')return bindStore(el);
 el.querySelectorAll('.tog').forEach(t=>t.onclick=()=>{if(t.dataset.dark!==undefined)setDark(!document.body.classList.contains('dark'));else t.classList.toggle('on')});
 if(k==='settings')el.querySelector('.tog[data-dark]').classList.toggle('on',document.body.classList.contains('dark'));
 if(k==='calc'){let cur='0',prev=null,op=null,fresh=true;const v=el.querySelector('.v'),s=el.querySelector('small');
  const calc=(a,b,o)=>({'+':a+b,'−':a-b,'×':a*b,'÷':b?a/b:NaN})[o];
  const show=()=>v.textContent=isNaN(+cur)?'Error':String(+(+cur).toPrecision(12)===+cur?cur:(+cur).toPrecision(12));
  el.querySelectorAll('.keys button').forEach(b=>b.onclick=()=>{const t=b.textContent;
   if(/\d/.test(t)){cur=fresh||cur==='0'?t:cur+t;fresh=false}
   else if(t==='.'){if(!cur.includes('.'))cur+='.';fresh=false}
   else if(t==='C'){cur='0';prev=op=null;s.textContent='';fresh=true}
   else if(t==='⌫'){cur=cur.length>1?cur.slice(0,-1):'0'}
   else if(t==='±')cur=String(-cur);
   else if(t==='%')cur=String(cur/100);
   else if('+−×÷'.includes(t)){if(op&&!fresh)cur=String(calc(+prev,+cur,op));prev=cur;op=t;fresh=true;s.textContent=prev+' '+t}
   else if(t==='='&&op){s.textContent=prev+' '+op+' '+cur+' =';cur=String(calc(+prev,+cur,op));op=null;fresh=true}
   show()})}
}
/* open a few things via taskbar pinned shortcuts */
setTimeout(()=>$('#toast').style.transform='none',900);setTimeout(()=>$('#toast').style.transform='translateX(380px)',6000);

/* ---- web apps (iframe windows) ---- */
function webView(a){const ext=/^https?:\/\//i.test(a.url);
 return `<div class="webwrap"><div class="wbar"><span class="wt" title="${esc(a.url)}">${esc(a.url)}</span><button class="wr" title="Reload">⟳</button><button class="wo" title="Open in a new tab (use this if the page stays blank)">↗</button></div><div class="wmsg"></div><iframe title="${esc(a.n)}" allow="fullscreen; clipboard-read; clipboard-write; autoplay; gamepad"${ext?' sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-downloads allow-modals allow-pointer-lock"':''}></iframe></div>`}
function bindWeb(k,el){
 const a=APPS[k],f=el.querySelector('iframe'),m=el.querySelector('.wmsg'),ext=/^https?:\/\//i.test(a.url);
 const load=async()=>{
  if(!ext){try{const r=await fetch(a.url,{method:'HEAD'});if(!r.ok)throw 0}catch(e){m.style.display='flex';m.innerHTML=`<div><b>App files not found</b><br>Expected at <code>${esc(a.url)}</code><br>See apps/README.md</div>`;f.style.display='none';return}}
  m.style.display='none';f.style.display='';f.src=a.url};
 el.querySelector('.wr').onclick=load;
 el.querySelector('.wo').onclick=()=>window.open(a.url,'_blank','noopener');
 load()}
/* ---- Microsoft Store ---- */
function storeView(){return `<div class="store"><div class="sbar"><input class="sq2" placeholder="Search apps"><div class="cats"></div></div><div class="sgrid"></div><details class="custom"><summary>＋ Add your own web app</summary><div class="cf"><input class="cn" placeholder="Name"><input class="cu" placeholder="URL, e.g. apps/myapp/index.html or https://…"><button class="add">Add</button></div></details></div>`}
function bindStore(el){
 let q='',cat='All';
 const grid=el.querySelector('.sgrid'),cats=el.querySelector('.cats');
 const render=()=>{
  const all=Object.values(APPS).filter(a=>a.id!=='store');
  cats.innerHTML=['All',...new Set(all.map(a=>a.cat))].map(c=>`<span class="cat${c===cat?' on':''}" data-c="${esc(c)}">${esc(c)}</span>`).join('');
  grid.innerHTML=all.filter(a=>(cat==='All'||a.cat===cat)&&(a.n+' '+a.desc).toLowerCase().includes(q)).map(a=>{const ins=installed.includes(a.id);
   return `<div class="card"><div class="ci">${a.i}</div><div class="cm"><b>${esc(a.n)}</b><small>${esc(a.cat)} · ${a.type==='web'?'Web app':'Built-in'}</small><p>${esc(a.desc)}</p></div><div class="ca"><button class="${ins?'':'pri'}" data-id="${a.id}" data-act="${ins?'open':'get'}">${ins?'Open':'Get'}</button>${ins&&!PROTECTED.includes(a.id)?`<button data-id="${a.id}" data-act="rm">Uninstall</button>`:''}</div></div>`}).join('')||'<p style="padding:20px;color:var(--sub)">No apps found.</p>'};
 el.querySelector('.sq2').oninput=e=>{q=e.target.value.toLowerCase();render()};
 cats.onclick=e=>{const c=e.target.closest('.cat');if(c){cat=c.dataset.c;render()}};
 grid.onclick=e=>{const b=e.target.closest('button');if(!b)return;const id=b.dataset.id;
  if(b.dataset.act==='get'){installApp(id,true);notify('Installed',APPS[id].n+' was added to Start and your desktop.')}
  else if(b.dataset.act==='open')openApp(id);
  else{uninstallApp(id)}render()};
 el.querySelector('.add').onclick=()=>{const n=el.querySelector('.cn').value.trim(),u=el.querySelector('.cu').value.trim();
  if(!n||!u||/^\s*(javascript|data|vbscript):/i.test(u)){notify('Check the details','Enter a name and an http(s) or relative URL.');return}
  const a={id:'custom-'+Date.now(),name:n,url:u,icon:'🌐',cat:'Custom',desc:u,type:'web',w:900,h:580};
  custom.push(a);SV('w11.custom',custom);APPS[a.id]=Object.assign({w:760,h:500,i:a.icon,n:a.name},a);installApp(a.id,false);el.querySelector('.cn').value=el.querySelector('.cu').value='';render()};
 render()}
loadRegistry();
