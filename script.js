const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const APPS={
  explorer:{n:'File Explorer',i:'📁',w:760,h:480},
  edge:{n:'Microsoft Edge',i:'🌐',w:900,h:560},
  notepad:{n:'Notepad',i:'📝',w:560,h:400},
  calc:{n:'Calculator',i:'🧮',w:340,h:520},
  settings:{n:'Settings',i:'⚙️',w:860,h:560},
  store:{n:'Microsoft Store',i:'🛍️',w:720,h:480},
  photos:{n:'Photos',i:'🖼️',w:640,h:440},
  mail:{n:'Mail',i:'✉️',w:720,h:460},
};
let z=10,wid=0,wins={};
/* desktop icons + pinned */
const dIcons=[['explorer','This PC','💻'],['edge','Microsoft Edge','🌐'],['notepad','Notes.txt','📝']];
$('#icons').innerHTML=[...dIcons,['bin','Recycle Bin','🗑️']].map(([a,n,i])=>`<div class="dicon" data-a="${a}"><span>${i}</span>${n}</div>`).join('');
$$('.dicon').forEach(d=>{d.onclick=e=>{e.stopPropagation();$$('.dicon').forEach(x=>x.classList.remove('sel'));d.classList.add('sel')};d.ondblclick=()=>APPS[d.dataset.a]&&openApp(d.dataset.a)});
$('#pinned').innerHTML=Object.entries(APPS).map(([k,a])=>`<div class="app" data-a="${k}"><i>${a.i}</i>${a.n.replace('Microsoft ','')}</div>`).join('');
$$('.app').forEach(a=>a.onclick=()=>{openApp(a.dataset.a);close_all()});
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
  const a=APPS[k],id=++wid,el=document.createElement('div');
  el.className='win blur';el.style.cssText=`width:${a.w}px;height:${a.h}px;left:${Math.max(10,(innerWidth-a.w)/2+wid*22%120)}px;top:${Math.max(10,(innerHeight-a.h-48)/2+wid*22%100)}px;z-index:${++z}`;
  el.innerHTML=`<div class="title"><div class="t"><span>${a.i}</span>${a.n}</div><div class="ctl"><button class="mn">&#xE921;</button><button class="mx">&#xE922;</button><button class="x">&#xE8BB;</button></div></div><div class="body">${content(k)}</div><div class="rz"></div>`;
  $('#wins').appendChild(el);
  const tb=document.createElement('div');tb.className='tb run active';tb.id='tb'+id;tb.innerHTML=a.i;tb.title=a.n;$('#tb-apps').appendChild(tb);
  wins[id]={id,k,el,tb,max:false};
  const w=wins[id];
  tb.onclick=()=>{ if(w.el.classList.contains('min')||!w.el.classList.contains('focus'))restore(id);else minimize(id)};
  el.onmousedown=()=>focus(id);
  el.querySelector('.mn').onclick=()=>minimize(id);
  el.querySelector('.mx').onclick=()=>toggleMax(id);
  el.querySelector('.x').onclick=()=>{el.remove();tb.remove();delete wins[id]};
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
  const up=()=>{removeEventListener('mousemove',mv);removeEventListener('mouseup',up)};addEventListener('mousemove',mv);addEventListener('mouseup',up)}}
function resize(el,h){h.onmousedown=e=>{e.stopPropagation();const sx=e.clientX,sy=e.clientY,sw=el.offsetWidth,sh=el.offsetHeight;
  const mv=ev=>{el.style.width=Math.max(300,sw+ev.clientX-sx)+'px';el.style.height=Math.max(200,sh+ev.clientY-sy)+'px'};
  const up=()=>{removeEventListener('mousemove',mv);removeEventListener('mouseup',up)};addEventListener('mousemove',mv);addEventListener('mouseup',up)}}
/* app content */
function content(k){
 if(k==='notepad')return`<div class="np" style="height:100%;display:flex;flex-direction:column"><div class="menubar"><span>File</span><span>Edit</span><span>View</span></div><textarea spellcheck="false" placeholder="Start typing…"></textarea></div>`;
 if(k==='calc')return`<div class="calc"><div class="disp"><small></small><div class="v">0</div></div><div class="keys">${['C','±','%','÷','7','8','9','×','4','5','6','−','1','2','3','+','0','.','⌫','='].map(b=>`<button class="${/\d|\./.test(b)?'n':b==='='?'eq':''}">${b}</button>`).join('')}</div></div>`;
 if(k==='explorer')return`<div class="fe"><aside><div class="a">🏠 Home</div><div>🖥️ Desktop</div><div>⬇️ Downloads</div><div>📄 Documents</div><div>🖼️ Pictures</div><div>🎵 Music</div><div style="margin-top:12px">💻 This PC</div></aside><main><div class="addr">This PC › Documents</div><div class="files"><div><i>📁</i>Projects</div><div><i>📁</i>Work</div><div><i>📁</i>Photos</div><div><i>📄</i>Notes.txt</div><div><i>📊</i>Budget.xlsx</div><div><i>🖼️</i>Logo.png</div><div><i>📕</i>Guide.pdf</div><div><i>🎞️</i>Demo.mp4</div></div></main></div>`;
 if(k==='settings')return`<div class="set"><aside><div class="a">🖥️ System</div><div>🔵 Bluetooth &amp; devices</div><div>📶 Network &amp; internet</div><div>🎨 Personalization</div><div>📦 Apps</div><div>🕒 Time &amp; language</div></aside><main><h1>System</h1><div class="row"><span>🌙 Dark mode</span><div class="tog" data-dark></div></div><div class="row"><span>🔋 Battery saver</span><div class="tog"></div></div><div class="row"><span>🔔 Notifications</span><div class="tog on"></div></div><div class="row"><span>📐 Display scale</span><span style="color:var(--sub)">100% (Recommended)</span></div><div class="row"><span>💾 Storage</span><span style="color:var(--sub)">312 GB of 512 GB used</span></div></main></div>`;
 if(k==='edge')return`<div class="edge"><div class="bar"><span>←</span><span>→</span><span>⟳</span><div class="url">🔒 https://www.bing.com</div><span>⋯</span></div><div class="page"><div><h1>Search the web</h1><p style="margin-top:14px;font-size:15px">This is a static replica page.</p></div></div></div>`;
 return`<div style="display:grid;place-items:center;height:100%;font-size:16px;color:var(--sub);text-align:center"><div><div style="font-size:60px">${APPS[k].i}</div>${APPS[k].n}</div></div>`;
}
function bind(k,el){
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
[['explorer','📁'],['edge','🌐'],['store','🛍️']].forEach(([k,i])=>{const t=document.createElement('div');t.className='tb';t.innerHTML=i;t.title=APPS[k].n;t.onclick=()=>openApp(k);$('#tb-apps').before(t)});
setTimeout(()=>$('#toast').style.transform='none',900);setTimeout(()=>$('#toast').style.transform='translateX(380px)',6000);
