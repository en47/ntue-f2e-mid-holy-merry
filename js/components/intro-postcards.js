import { introCultures, cultureOutcome } from '../data/intro-cultures.js';
export function mountIntroPostcards(root, { cultures = introCultures, random = Math.random, scenes = {} } = {}) {
 const pins=root.querySelector('#intro-map-points'),shortcuts=root.querySelector('#intro-country-shortcuts'),dialog=root.querySelector('#culture-dialog');
 const $=id=>dialog.querySelector(`[data-post="${id}"]`);const cleanups=[],hosts=new Map(),steps={};let current=null,lastFocus=null;
 const on=(el,type,fn)=>{el.addEventListener(type,fn);cleanups.push(()=>el.removeEventListener(type,fn));};
 // A scene is cut once on first visit; every open starts it from the beginning.
 function sceneFor(id){if(!scenes[id])return null;if(!hosts.has(id)){const host=document.createElement('div');host.className='post-scene';hosts.set(id,{host,scene:scenes[id](host)});}return hosts.get(id);}
 function open(id,trigger){const country=cultures.find(c=>c.id===id);if(!country)return;current=country;lastFocus=trigger;
  $('country').textContent=country.name;$('title').textContent=country.title;$('description').textContent=country.description;$('result').textContent='';$('action-label').textContent=country.action;
  const art=$('art');art.setAttribute('aria-label',country.action);art.dataset.country=country.id;art.dataset.variant='';art.classList.remove('is-playing');
  const entry=sceneFor(id);art.replaceChildren(...(entry?[entry.host]:[]));entry?.scene.reset();steps[id]=0;
  for(const b of pins.children)b.setAttribute('aria-expanded',String(b.dataset.country===id));
  document.body.classList.add('intro-modal-open');if(!dialog.open)dialog.showModal();$('close').focus({preventScroll:true});
 }
 function reset(){document.body.classList.remove('intro-modal-open');for(const b of pins.children)b.setAttribute('aria-expanded','false');lastFocus?.focus({preventScroll:true});}
 function close(){dialog.close();}
 for(const country of cultures){const button=document.createElement('button');button.type='button';button.className='intro-map-pin';button.dataset.country=country.id;button.dataset.label=country.name;button.style.left=country.x+'%';button.style.top=country.y+'%';button.setAttribute('aria-label',`${country.name}：${country.title}`);button.setAttribute('aria-haspopup','dialog');button.setAttribute('aria-expanded','false');on(button,'click',()=>open(country.id,button));pins.append(button);
  const chip=document.createElement('button');chip.type='button';chip.className='intro-country-link';chip.textContent=country.name;chip.setAttribute('aria-haspopup','dialog');on(chip,'click',()=>open(country.id,chip));shortcuts.append(chip);
 }
 function play(event){if(!current)return;const id=current.id,outcome=cultureOutcome(id,random,steps[id]??0);steps[id]=(steps[id]??0)+1;const art=$('art');
  art.dataset.variant=outcome.variant;art.classList.add('is-playing');$('result').textContent=outcome.text;
  const box=event?.currentTarget?.getBoundingClientRect?.(),share=box&&event.clientX&&event.currentTarget===art?(event.clientX-box.left)/box.width:undefined;
  hosts.get(id)?.scene.play(outcome,{share});
 }
 on($('action'),'click',play);on($('art'),'click',play);
 on($('close'),'click',close);on(dialog,'close',reset);on(dialog,'click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)close();}});
 return {open,close,destroy(){if(dialog.open)dialog.close();cleanups.forEach(fn=>fn());pins.replaceChildren();shortcuts.replaceChildren();document.body.classList.remove('intro-modal-open');}};
}
