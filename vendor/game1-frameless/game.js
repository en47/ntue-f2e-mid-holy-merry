"use strict";
const $=s=>document.querySelector(s),canvas=$('#canvas'),ctx=canvas.getContext('2d');
const handwriting='assets/handwriting.png';
const glyphs={"up": [1092, 216, 94, 131], "down": [1264, 222, 99, 130], "8": [541, 379, 64, 110], "9": [721, 376, 61, 116], "0": [545, 651, 75, 91], "1": [716, 642, 85, 92], "2": [900, 638, 97, 93], "3": [1098, 636, 88, 108], "4": [1277, 633, 85, 115], "5": [1468, 641, 77, 97], "6": [1657, 632, 61, 106], "7": [1823, 624, 81, 135], "unit": [688, 917, 277, 154], "continue": [702, 1185, 375, 159], "again": [1285, 1202, 557, 138], "start": [771, 1443, 329, 136], "pause": [1324, 1420, 276, 153], "distance": [765, 1710, 343, 127], "best": [1325, 1695, 296, 167]};
function word(key,cls=''){const r=glyphs[key];return `<svg class="word ${cls}" viewBox="${r.join(' ')}" aria-hidden="true" focusable="false"><image href="${handwriting}" width="2048" height="2048"/></svg>`}
document.querySelectorAll('[data-word]').forEach(e=>e.innerHTML=word(e.dataset.word));
function scoreInto(id,value){const e=$(id);value=String(Math.max(0,Math.floor(value)));if(e.dataset.value===value)return;e.dataset.value=value;e.innerHTML=[...value].map(n=>word(n,'digit')).join('')+word('unit','unit');e.setAttribute('aria-label',value+' 公尺')}
function setButton(id,key,label){const e=$(id);e.innerHTML=word(key);e.dataset.state=key;e.setAttribute('aria-label',label)}
const HEIGHT=510,lanes=[80,160,240,320,400];
let width=1100,lane=2,y=240,mode='loading',distance=0,best=0,elapsed=0,scroll=0,obstacles=[],spawn=2,last=0,ready=false;
const assets={},reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
try{const saved=Number(localStorage.getItem('santa-crayon-best'));if(Number.isFinite(saved)&&saved>0)best=Math.floor(saved)}catch{}
scoreInto('#best',best);scoreInto('#score',0);setButton('#start','start','開始');
function announce(text){$('#announcement').textContent=text}
function resize(){const box=canvas.getBoundingClientRect();width=Math.max(510,Math.round(box.width/box.height*HEIGHT));const dpr=Math.min(window.devicePixelRatio||1,2);canvas.width=Math.round(box.width*dpr);canvas.height=Math.round(box.height*dpr);ctx.setTransform(canvas.width/width,0,0,canvas.height/HEIGHT,0,0);if(mode==='playing')pause()}
new ResizeObserver(resize).observe(canvas);
function indicate(){document.querySelectorAll('.laneIndicator i').forEach((e,i)=>e.classList.toggle('active',i===lane))}
function move(d){if(mode!=='playing')return;lane=Math.max(0,Math.min(4,lane+d));indicate()}
function start(){if(!ready)return;mode='playing';lane=2;y=240;distance=0;elapsed=0;obstacles=[];spawn=2;$('#overlay').classList.add('hidden');$('#result').hidden=true;$('#pause').disabled=false;setButton('#pause','pause','暫停');scoreInto('#score',0);indicate();announce('開始飛行');$('#start').blur()}
function pause(){if(mode==='playing'){mode='paused';setButton('#pause','continue','繼續');setButton('#start','continue','繼續');$('#result').hidden=true;$('#overlay').classList.remove('hidden');announce('遊戲暫停')}else if(mode==='paused'){mode='playing';$('#overlay').classList.add('hidden');setButton('#pause','pause','暫停');announce('繼續飛行')}}
function end(){mode='over';const score=Math.floor(distance);if(score>best){best=score;try{localStorage.setItem('santa-crayon-best',best)}catch{}}scoreInto('#best',best);scoreInto('#score',score);scoreInto('#result',score);$('#result').hidden=false;$('#pause').disabled=true;setButton('#start','again','再玩一次');$('#overlay').classList.remove('hidden');announce('遊戲結束，飛行距離 '+score+' 公尺')}
$('#start').onclick=()=>mode==='error'?loadAssets():mode==='paused'?pause():start();$('#pause').onclick=pause;$('#up').onclick=()=>move(-1);$('#down').onclick=()=>move(1);
window.addEventListener('keydown',e=>{if(['ArrowUp','ArrowDown',' '].includes(e.key))e.preventDefault();if(e.repeat)return;if(e.key==='ArrowUp')move(-1);if(e.key==='ArrowDown')move(1);if(e.key===' '||e.key.toLowerCase()==='p')pause();if(e.key==='Enter'&&!['BUTTON','A'].includes(document.activeElement.tagName)){if(mode==='ready'||mode==='over')start();else if(mode==='paused')pause()}});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&mode==='playing')pause()});
function ellipse(x,y,rx,ry,c){ctx.fillStyle=c;ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fill()}
function line(points,c,w=2){ctx.strokeStyle=c;ctx.lineWidth=w;ctx.lineCap='round';ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.stroke()}
// All illustrated subjects use generated assets based on the supplied drawing.
function village(scale,speed,baseline,opacity){const tile=assets.village.width*scale,h=assets.village.height*scale;ctx.save();ctx.globalAlpha=opacity;const offset=scroll*speed%tile;for(let i=-1;i*tile-offset<width;i++)ctx.drawImage(assets.village,i*tile-offset,baseline-h,tile,h);ctx.restore()}
function playerGeometry(){const w=width<800?194:260;return {x:width<800?53:88,w,h:w*793/1983}}
function santa(){const p=playerGeometry();ctx.save();const bob=reducedMotion?0:Math.sin(elapsed*3.6)*2;ctx.translate(p.x+p.w/2,y+bob);ctx.rotate(reducedMotion?0:Math.max(-.08,Math.min(.08,(lanes[lane]-y)*.0015)));ctx.drawImage(assets.player,-p.w/2,-p.h/2,p.w,p.h);ctx.restore()}
// Source rectangles include every painted pixel plus transparent padding.
const obstacleSprites={chimney:[185,45,340,620],cloud:[690,140,695,410],balloon:[1515,105,375,545]};
function obstacleGeometry(o){const r=obstacleSprites[o.type];const w=o.type==='cloud'?108:o.type==='balloon'?54:72;let h=w*r[3]/r[2];const top=o.y-30;if(o.type==='chimney')h=HEIGHT-top;return {r,x:o.x-w/2,y:top,w,h}}
function obstacle(o){const g=obstacleGeometry(o);ctx.drawImage(assets.obstacles,...g.r,g.x,g.y,g.w,g.h)}
function obstacleBox(o){const g=obstacleGeometry(o);if(o.type==='chimney')return {left:g.x+10,right:g.x+g.w-10,top:g.y+6,bottom:HEIGHT};if(o.type==='balloon')return {left:g.x+6,right:g.x+g.w-6,top:g.y+5,bottom:g.y+g.h*.64};return {left:g.x+9,right:g.x+g.w-9,top:g.y+10,bottom:g.y+g.h-10}}
function playerBoxes(){const p=playerGeometry();return [{left:p.x+p.w*.08,right:p.x+p.w*.54,top:y-p.h*.32,bottom:y+p.h*.32},{left:p.x+p.w*.69,right:p.x+p.w*.96,top:y-p.h*.15,bottom:y+p.h*.23}]}
function overlaps(a,b){return a.right>b.left&&a.left<b.right&&a.bottom>b.top&&a.top<b.bottom}
function draw(){ctx.clearRect(0,0,width,HEIGHT);ctx.fillStyle='#e6d4d1';ctx.fillRect(0,0,width,HEIGHT);
// Small fixed speckles supply paper grain without flickering during movement.
ctx.fillStyle='#a88f7e12';for(let i=0;i<1700;i++){const x=(i*137.39)%width,yy=(i*73.31)%HEIGHT;ctx.fillRect(x,yy,i%3===0?1.5:.8,.8)}
ellipse(width-95,75,27,27,'#fff4d8');ellipse(width-83,65,25,25,'#e6d4d1');
village(.29,.12,455,.24);ctx.fillStyle='#f7eee2';ctx.fillRect(0,478,width,32);village(.40,.38,520,.65);
for(let i=0;i<34;i++){const x=((i*197-scroll*.18)%(width+20)+width+20)%(width+20),yy=(i*81+scroll*.045)%HEIGHT;ellipse(x,yy,i%4===0?2.3:1.4,i%4===0?2.3:1.4,'#fff9edcc')}
if(mode==='playing'){ctx.setLineDash([2,14]);lanes.forEach(l=>line([[42,l],[width-20,l]],'#fffaf238',1));ctx.setLineDash([])}
obstacles.forEach(obstacle);santa();
}

function update(dt){elapsed+=dt;if(!reducedMotion||mode==='playing')scroll+=dt*(mode==='playing'?150+Math.min(distance*.12,100):14);y+=(lanes[lane]-y)*Math.min(1,dt*16);if(mode!=='playing')return;distance+=dt*12;scoreInto('#score',distance);const speed=(width<800?145:215)+Math.min(distance*.12,width<800?65:100);spawn-=dt;if(spawn<=0){const l=Math.floor(Math.random()*5);obstacles.push({x:width+65,y:lanes[l],type:l>=3?'chimney':Math.random()<.5?'cloud':'balloon'});spawn=(width<800?2.15:1.85)+Math.random()*.6}for(const o of obstacles){o.x-=speed*dt;if(playerBoxes().some(p=>overlaps(p,obstacleBox(o)))){end();break}}obstacles=obstacles.filter(o=>o.x>-100)}
function frame(t){const dt=Math.min((t-last)/1000||0,.035);last=t;if(ready){if(mode!=='paused'&&mode!=='over')update(dt);draw()}requestAnimationFrame(frame)}
async function loadAssets(){ready=false;mode='loading';$('#start').disabled=true;try{await Promise.all(Object.entries({player:'santa-reindeer.png',village:'winter-village.png',obstacles:'obstacles.png',handwriting:'handwriting.png'}).map(([key,file])=>new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>{assets[key]=img;resolve()};img.onerror=reject;img.src='assets/'+file})));ready=true;mode='ready';$('#start').disabled=false;setButton('#start','start','開始');resize();announce('準備完成，按 Enter 或開始按鈕遊玩')}catch{mode='error';$('#start').disabled=false;$('#start').title='素材載入失敗，請確認 assets 資料夾完整，點按重試';announce($('#start').title)}}
indicate();loadAssets();requestAnimationFrame(frame);
