
(()=>{'use strict';
const slides=[...document.querySelectorAll('.slide')], dots=[...document.querySelectorAll('.dot-link')], chapters=[...document.querySelectorAll('.chapters button')];
const viewport=document.querySelector('.slide-window'),prev=document.getElementById('prev'),next=document.getElementById('next'),full=document.getElementById('fullscreen'),count=document.getElementById('page-count'),pageSelect=document.getElementById('page-select'),progress=document.getElementById('progress'),notice=document.getElementById('notice');
let page=0, noticeTimer, touch=null;
let wheelLast=0, wheelAmount=0, wheelLocked=false, wheelTurn=-Infinity;
function hashPage(){const n=Number(location.hash.slice(1));return Number.isInteger(n)&&n>=1&&n<=slides.length?n-1:0}
function go(n,write=true){const target=Math.max(0,Math.min(slides.length-1,n)),entry=target>page?'next':target<page?'previous':'none';page=target;slides.forEach((s,i)=>{s.dataset.entry=i===page?entry:'none';s.hidden=i!==page;s.setAttribute('aria-current',String(i===page))});dots.forEach((d,i)=>{d.dataset.active=String(i===page);if(i===page)d.setAttribute('aria-current','page');else d.removeAttribute('aria-current')});chapters.forEach((b,i)=>{const selected=b.dataset.chapter===slides[page].dataset.chapter;b.classList.toggle('selected',selected);if(selected)b.setAttribute('aria-current','true');else b.removeAttribute('aria-current')});prev.disabled=page===0;next.disabled=page===slides.length-1;pageSelect.value=String(page);count.innerHTML=String(page+1).padStart(2,'0')+' <small>/ '+slides.length+'</small>';progress.style.width=((page+1)/slides.length*100)+'%';document.getElementById('slide-status').textContent=slides[page].getAttribute('aria-label');viewport.scrollTop=0;if(write&&location.hash!=='#'+(page+1)){try{history.replaceState(null,'','#'+(page+1))}catch{location.hash=String(page+1)}}}
// Start date inferred from the supplied 70th-anniversary date, 2028/4/12.
const journeyStart={year:1958,month:4,day:12};
const taipeiDate=new Intl.DateTimeFormat('en-US',{timeZone:'Asia/Taipei',year:'numeric',month:'numeric',day:'numeric'});
function elapsedParts(now){
const parts=Object.fromEntries(taipeiDate.formatToParts(new Date(now)).filter(p=>p.type!=='literal').map(p=>[p.type,Number(p.value)]));
let years=parts.year-journeyStart.year,months=parts.month-journeyStart.month,days=parts.day-journeyStart.day;
if(days<0){months--;days+=new Date(Date.UTC(parts.year,parts.month-1,0)).getUTCDate()}
if(months<0){years--;months+=12}
return years<0?[0,0,0]:[years,months,days];
}
function updateElapsed(){const values=elapsedParts(Date.now());['years','months','days'].forEach((unit,i)=>{const el=document.getElementById('elapsed-'+unit),value=String(values[i]);if(el.textContent!==value)el.textContent=value})}
updateElapsed();setInterval(updateElapsed,1000);document.addEventListener('visibilitychange',()=>{if(!document.hidden)updateElapsed()});
function showNotice(text){notice.textContent=text;notice.hidden=false;clearTimeout(noticeTimer);noticeTimer=setTimeout(()=>notice.hidden=true,4500)}
async function fullscreen(){try{if(document.fullscreenElement)await document.exitFullscreen();else if(document.documentElement.requestFullscreen)await document.documentElement.requestFullscreen();else showNotice('此瀏覽器不支援全螢幕，請使用瀏覽器的全螢幕功能。')}catch{showNotice('無法開啟全螢幕，請使用瀏覽器的全螢幕功能。')}}
document.querySelectorAll('[data-go]').forEach(b=>b.addEventListener('click',e=>{e.preventDefault();go(Number(b.dataset.go))}));prev.addEventListener('click',()=>go(page-1));next.addEventListener('click',()=>go(page+1));full.addEventListener('click',fullscreen);
pageSelect.addEventListener('change',()=>go(Number(pageSelect.value)));
window.addEventListener('hashchange',()=>go(hashPage(),false));document.addEventListener('fullscreenchange',()=>{const active=!!document.fullscreenElement;full.setAttribute('aria-label',active?'離開全螢幕':'全螢幕');full.title=active?'離開全螢幕（F）':'全螢幕（F）';full.setAttribute('aria-pressed',String(active))});
document.addEventListener('keydown',e=>{if(e.altKey||e.ctrlKey||e.metaKey||e.target.closest('input,textarea,select,[contenteditable=true]'))return;if(window.getSelection()?.toString())return;if(['ArrowRight','PageDown'].includes(e.key)){e.preventDefault();go(page+1)}else if(['ArrowLeft','PageUp'].includes(e.key)){e.preventDefault();go(page-1)}else if(e.key===' '&&!e.target.closest('button,a')){e.preventDefault();go(page+1)}else if(e.key==='Home'){e.preventDefault();go(0)}else if(e.key==='End'){e.preventDefault();go(slides.length-1)}else if(e.key.toLowerCase()==='f'){e.preventDefault();fullscreen()}});
document.addEventListener('wheel',e=>{
if(e.ctrlKey||e.metaKey||e.shiftKey||Math.abs(e.deltaX)>Math.abs(e.deltaY)||!e.deltaY||e.target.closest('input,textarea,select,[contenteditable=true]')||window.getSelection()?.toString())return;
const now=performance.now();
if(now-wheelLast>180){wheelAmount=0;wheelLocked=false}wheelLast=now;
e.preventDefault();
if(wheelLocked||now-wheelTurn<650)return;
const delta=e.deltaY*(e.deltaMode===1?16:e.deltaMode===2?viewport.clientHeight:1),direction=Math.sign(delta),bottom=Math.max(0,viewport.scrollHeight-viewport.clientHeight);
if((direction>0&&viewport.scrollTop<bottom-2)||(direction<0&&viewport.scrollTop>2)){
viewport.scrollTop+=delta;wheelAmount=0;
if(direction>0?viewport.scrollTop>=bottom-2:viewport.scrollTop<=2)wheelLocked=true;
return;
}
if(Math.sign(wheelAmount)!==direction)wheelAmount=0;
wheelAmount+=delta;
if(Math.abs(wheelAmount)>=45){wheelAmount=0;wheelLocked=true;wheelTurn=now;go(page+direction)}
},{passive:false});
viewport.addEventListener('touchstart',e=>{
touch=e.touches.length===1&&!e.target.closest('button,a,select,input,textarea,.gantt-scroll')?{x:e.touches[0].clientX,y:e.touches[0].clientY}:null;
},{passive:true});
viewport.addEventListener('touchmove',e=>{
if(!touch)return;
if(e.touches.length!==1){touch=null;return}
const dx=Math.abs(e.touches[0].clientX-touch.x),dy=Math.abs(e.touches[0].clientY-touch.y);
if(dy>12&&dy>dx)touch=null;
},{passive:true});
viewport.addEventListener('touchcancel',()=>{touch=null},{passive:true});
viewport.addEventListener('touchend',e=>{
const start=touch;touch=null;
if(!start||e.touches.length||e.changedTouches.length!==1||window.getSelection()?.toString())return;
const dx=e.changedTouches[0].clientX-start.x,dy=e.changedTouches[0].clientY-start.y;
if(Math.abs(dx)>75&&Math.abs(dx)>Math.abs(dy)*1.7)go(page+(dx<0?1:-1));
},{passive:true});
go(hashPage(),false);
})();