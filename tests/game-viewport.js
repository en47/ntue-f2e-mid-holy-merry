const frame=document.querySelector('#viewport'),box=document.querySelector('#preview'),output=document.querySelector('#metrics');
const params=new URLSearchParams(location.search);
const sizes={desktop:[1440,900],laptop:[1366,768],compact:[1024,768],tablet:[768,1024],mobile:[390,844]};
let [width,height]=sizes[params.get('viewport')]||sizes.desktop;
let observer;
function layout(){
  const scale=Math.min(1,(document.documentElement.clientWidth-24)/width,Math.max(300,innerHeight-190)/height);
  frame.style.width=`${width}px`;frame.style.height=`${height}px`;frame.style.transform=`scale(${scale})`;
  box.style.width=`${width*scale}px`;box.style.height=`${height*scale}px`;
}
function measure(){
  const doc=frame.contentDocument;if(!doc?.querySelector('#matching-frame'))return;
  const root=doc.documentElement,fly=doc.querySelector('#flying-game').getBoundingClientRect(),game=doc.querySelector('#matching-frame').getBoundingClientRect(),landscape=doc.querySelector('.page-foreground').getBoundingClientRect(),footer=doc.querySelector('.site-footer').getBoundingClientRect(),section=doc.querySelector('#matching-game').getBoundingClientRect();
  const snap=frame.contentWindow.getComputedStyle(root).scrollSnapType;
  const gifts=[...doc.querySelectorAll('.foreground-scene')].filter(el=>frame.contentWindow.getComputedStyle(el).display!=='none').map(el=>el.getBoundingClientRect());
  const clear=gifts.every(g=>g.right<=game.left||g.left>=game.right||g.top>=game.bottom||g.bottom<=game.top);
  const embedded=doc.querySelector('#matching-frame').contentDocument;
  const natural=embedded?.body?.getBoundingClientRect().height;
  const panels=[...doc.querySelectorAll('.game-frame')].map(el=>el.getBoundingClientRect());
  const equalPanels=Math.abs(panels[0].width-panels[1].width)<.5&&Math.abs(panels[0].height-panels[1].height)<.5;
  const panelMetrics=`外框 ${panels.map(rect=>`${rect.width.toFixed(2)} × ${rect.height.toFixed(2)}`).join(' / ')}px；同尺寸 ${equalPanels}；`;
  const gameRoot=embedded?.querySelector('#matching-app');
  const start=embedded?.querySelector('#start-btn').getBoundingClientRect();
  const playMin=frame.contentWindow.getComputedStyle(doc.querySelector('#sleigh-game')).minHeight, matchMin=frame.contentWindow.getComputedStyle(doc.querySelector('#matching-game')).minHeight;
  output.textContent=`Viewport ${width} × ${height}px；${panelMetrics}吸附 ${snap}；scrollY=${Math.round(frame.contentWindow.scrollY)} / Game 02 top=${Math.round(section.top)}px；水平溢出 ${Math.max(0,root.scrollWidth-root.clientWidth)}px；飛行 iframe ${Math.round(fly.width)} × ${Math.round(fly.height)}px；配對 iframe ${Math.round(game.width)} × ${Math.round(game.height)}px／內容 ${Math.ceil(natural||0)}px；配對內容完整 ${natural<=game.height+1}；Start位於遊戲內 ${start?.bottom<=game.height}；禮物不遮擋遊戲 ${clear}；雪景／頁尾間距 ${Math.round(footer.top-landscape.bottom)}px；stage min-height ${playMin} / ${matchMin}；配對狀態 ${gameRoot?.dataset.state||'載入中'}；兩個 iframe、無外部 Start ${doc.querySelectorAll('main iframe').length===2&&!doc.querySelector('#matching-start-shortcut')}。`;

}
frame.addEventListener('load',async()=>{
  observer?.disconnect();await frame.contentDocument.fonts.ready;
  observer=new ResizeObserver(measure);observer.observe(frame.contentDocument.body);
  frame.contentDocument.querySelector('.games-page').addEventListener('transitionend',measure);
  frame.contentDocument.addEventListener('scrollend',measure);
  if(params.get('stage')==='matching') frame.contentDocument.querySelector('#matching-game').scrollIntoView({behavior:'instant'});
  if(params.get('stage')==='footer') frame.contentDocument.querySelector('.site-footer').scrollIntoView({behavior:'instant'});
  measure();
});
document.querySelectorAll('[data-width]').forEach(button=>button.addEventListener('click',()=>{width=Number(button.dataset.width);height=Number(button.dataset.height);layout();frame.contentWindow.scrollTo({top:0,behavior:'instant'});requestAnimationFrame(measure);}));
document.querySelector('#check').addEventListener('click',measure);
document.querySelector('#jump-first').addEventListener('click',()=>frame.contentWindow.scrollTo({top:0,behavior:'instant'}));
document.querySelector('#jump-game').addEventListener('click',()=>frame.contentDocument.querySelector('#matching-game').scrollIntoView());
document.querySelector('#jump-footer').addEventListener('click',()=>frame.contentDocument.querySelector('.site-footer').scrollIntoView());
window.addEventListener('resize',()=>{layout();measure();});layout();
