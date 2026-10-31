import {test} from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {introStories} from '../js/data/intro-stories.js';
import {introCultures,cultureOutcome} from '../js/data/intro-cultures.js';
import {introImageBounds} from '../js/data/intro-image-bounds.js';
const pendingAnimations = new Set();
class El {
 constructor(){this.children=[];this.dataset={};this.attrs={};this.listeners={};this.textContent='';this.hidden=false;this.disabled=false;this.open=false;const set=new Set();this.classList={add:(...a)=>a.forEach(x=>set.add(x)),remove:(...a)=>a.forEach(x=>set.delete(x)),contains:x=>set.has(x)};this.style={setProperty:(k,v)=>this.style[k]=v};this.map=new Map();}
 querySelector(s){if(!this.map.has(s))this.map.set(s,new El());return this.map.get(s);}
 querySelectorAll(){return this.children.flatMap(n=>[n,...n.querySelectorAll()]);}
 setAttribute(k,v){this.attrs[k]=String(v);} getAttribute(k){return this.attrs[k];}removeAttribute(k){delete this.attrs[k];}
 append(...n){this.children.push(...n);}replaceChildren(...n){this.children=n;}
 cloneNode(){const n=new El();n.className=this.className;n.dataset={...this.dataset};n.attrs={...this.attrs};Object.assign(n.style,this.style);n.textContent=this.textContent;n.children=this.children.map(c=>c.cloneNode());return n;}
 animate(frames,options){let resolve,reject;const a={node:this,frames,options,finished:new Promise((ok,no)=>{resolve=ok;reject=no;}),finish(){pendingAnimations.delete(a);resolve();},cancel(){pendingAnimations.delete(a);reject(new Error('cancelled'));}};pendingAnimations.add(a);return a;}
 addEventListener(k,fn){(this.listeners[k]??=[]).push(fn);}removeEventListener(k,fn){this.listeners[k]=(this.listeners[k]||[]).filter(x=>x!==fn);}
 emit(type,extra={}){if(type==='click'&&this.disabled)return;for(const fn of this.listeners[type]||[])fn({target:this,preventDefault(){},...extra});}
 closest(){return null;}focus(){this.focused=true;}showModal(){this.open=true;}close(){this.open=false;this.emit('close');}
}
async function flush(){for(let i=0;i<16;i++)await Promise.resolve();}
async function settle(){for(let i=0;i<12;i++){await flush();if(!pendingAnimations.size)return;for(const a of [...pendingAnimations])a.finish();}throw new Error('Animation coordinator did not settle');}
async function fixture(file){const document=new El();document.body=new El();document.createElement=()=>new El();document.createElementNS=()=>new El();const context=vm.createContext({document,console}),modules=new Map();
 async function load(file){file=path.resolve(file);if(modules.has(file))return modules.get(file);const m=new vm.SourceTextModule(await fs.readFile(file,'utf8'),{context});modules.set(file,m);await m.link(spec=>load(path.resolve(path.dirname(file),spec)));return m;}
 const mod=await load(file);await mod.evaluate();return {api:mod.namespace,root:new El(),document};
}
test('three chapters: common architecture datum, offset backgrounds, original assets and alpha-bounds',async()=>{
 const manifest=JSON.parse(await fs.readFile('docs/INTRO-ASSETS.json','utf8'));
 for(const [name,digest]of Object.entries(manifest.assets))assert.equal(createHash('sha256').update(await fs.readFile('assets/illustrations/intro/'+name)).digest('hex'),digest);
 assert.equal(introStories.length,3);for(const story of introStories){assert.equal(story.story.split(/\n\s*\n/).length,3);assert.ok(story.story.length>180);assert.ok(!/[a-z]{4}/i.test(story.story));for(const p of story.pieces){const b=introImageBounds[p.src.split('/').pop().slice(0,-4)];assert.ok(b);assert.ok(b.viewBox[0]+b.viewBox[2]<=b.width);assert.ok(b.viewBox[1]+b.viewBox[3]<=b.height);}}
 const find=(n,id)=>introStories[n].pieces.find(p=>p.id===id);
 for(const[n,a,b]of[[0,'bethlehem','stable'],[1,'village','cottage']]){assert.equal(find(n,a).y,18);assert.equal(find(n,b).y,18);assert.ok(Math.abs(find(n,a).x-find(n,b).x)>20);assert.ok(find(n,a).z<find(n,b).z);}
 assert.ok(find(0,'mary').x<find(0,'manger').x&&find(0,'manger').x<find(0,'joseph').x);
 assert.ok(find(1,'family').x+find(1,'family').w<find(1,'fireplace').x);
 assert.ok(!introStories[2].pieces.some(p=>/village|bethlehem/.test(p.id)));
});
test('book waits for every hinge, populated leaf, forward/back, rapid-click guard and cancellation',async()=>{
 const f=await fixture('js/components/intro-book.js'),book=f.api.mountIntroBook(f.root,{motion:{matches:false}}),el=id=>f.root.querySelector(`[data-book="${id}"]`);
 assert.equal(book.snapshot().phase,'closed');assert.equal(el('copies').children.length,3);assert.equal(el('controls').hidden,true);
 assert.equal(await book.changePage(1),false,'a closed book cannot turn a page');
 const opening=book.open();assert.equal(book.snapshot().phase,'sliding');assert.equal(await book.open(),false);await settle();assert.equal(await opening,true);
 assert.equal(book.snapshot().phase,'open');assert.equal(el('cover').hidden,true);assert.equal(el('controls').hidden,false);
 const changing=book.changePage(1);assert.equal(book.snapshot().phase,'closing');assert.equal(await book.changePage(2),false);
 const hinges=[...pendingAnimations];assert.equal(hinges.length,introStories[0].pieces.length);
 for(const a of hinges.slice(1))a.finish();await flush();assert.equal(book.snapshot().phase,'closing','the last hinge must finish before turning');
 hinges[0].finish();await flush();assert.equal(book.snapshot().phase,'turning');assert.equal(book.snapshot().page,0,'chapter commits only when leaf lands');
 assert.ok(el('front').querySelectorAll().some(n=>n.className?.includes('intro-piece')),'the front carries the folded original scene');
 assert.ok(el('back').querySelectorAll().some(n=>n.textContent===introStories[1].story.split('\n\n')[0]),'the rear carries the next full story');
 assert.equal(pendingAnimations.size,1);[...pendingAnimations][0].finish();await flush();assert.equal(book.snapshot().phase,'opening');assert.equal(book.snapshot().page,1);
 await settle();assert.equal(await changing,true);assert.equal(el('gift').hidden,false);
 el('gift').emit('click');assert.equal(pendingAnimations.size,1);await settle();assert.equal(pendingAnimations.size,0);
 const forward=book.changePage(2);await settle();await forward;assert.equal(el('next').disabled,true);
 const backward=book.changePage(1);for(const a of [...pendingAnimations])a.finish();await flush();assert.equal(el('turn').dataset.direction,'backward');await settle();await backward;
 const first=book.changePage(0);await settle();await first;assert.equal(el('prev').disabled,true);
 const replay=book.replay();assert.equal(book.snapshot().phase,'closing');await settle();await replay;assert.equal(book.snapshot().phase,'open');
 const closing=book.close();assert.equal(book.snapshot().phase,'closing');await settle();assert.equal(await closing,true);
 assert.equal(book.snapshot().phase,'closed');assert.equal(el('cover').hidden,false);assert.equal(el('controls').hidden,true);
 const again=book.open();await settle();await again;
 const pending=book.changePage(1);book.destroy();assert.equal(await pending,false);assert.equal(pendingAnimations.size,0);
});
test('reduced motion and interrupted/background animations keep chapters usable',async()=>{
 const f=await fixture('js/components/intro-book.js'),book=f.api.mountIntroBook(f.root,{motion:{matches:true}});await book.open();
 f.root.emit('keydown',{key:'ArrowRight'});await flush();assert.equal(book.snapshot().page,1);assert.equal(book.snapshot().phase,'open');
 f.root.emit('keydown',{key:'ArrowLeft'});await flush();assert.equal(book.snapshot().page,0);assert.equal(pendingAnimations.size,0);book.destroy();
 const bg=await fixture('js/components/intro-book.js'),other=bg.api.mountIntroBook(bg.root,{motion:{matches:false}});const opened=other.open();await settle();await opened;
 const changing=other.changePage(1);bg.document.hidden=true;bg.document.emit('visibilitychange');await changing;
 assert.equal(other.snapshot().page,1);assert.equal(other.snapshot().busy,false);assert.equal(pendingAnimations.size,0);other.destroy();
});
test('six map positions and both random outcomes; all postcards reset, interact, close and restore focus',async()=>{
 assert.deepEqual(introCultures.map(c=>c.id),['iceland','taiwan','japan','newzealand','canada','brazil']);assert.ok(introCultures.every(c=>c.x>0&&c.x<100&&c.y>0&&c.y<100));
 assert.equal(cultureOutcome('iceland',()=>0).variant,'candy');assert.equal(cultureOutcome('iceland',()=>.5).variant,'gift');assert.equal(cultureOutcome('iceland',()=>.99).variant,'potato');assert.equal(cultureOutcome('taiwan',()=>0).variant,'kind');assert.equal(cultureOutcome('taiwan',()=>.99).variant,'funny');
 const f=await fixture('js/components/intro-postcards.js'),view=f.api.mountIntroPostcards(f.root,{random:()=>.99}),pins=f.root.querySelector('#intro-map-points'),dialog=f.root.querySelector('#culture-dialog'),el=id=>dialog.querySelector(`[data-post="${id}"]`);
 assert.equal(pins.children.length,6);assert.equal(f.root.querySelector('#intro-country-shortcuts').children.length,6);
 for(let i=0;i<6;i++){const pin=pins.children[i];pin.emit('click');assert.equal(dialog.open,true);assert.equal(pin.getAttribute('aria-expanded'),'true');assert.equal(el('result').textContent,'');el(i%2?'action':'art').emit('click');assert.ok(el('result').textContent.length>5);assert.ok(el('art').dataset.variant);assert.equal(el('art').classList.contains('is-playing'),true);if(i===4){assert.equal(el('reply').hidden,false);el('easter').emit('click');assert.match(el('easter-result').textContent,/不是加拿大獨有/);}el('close').emit('click');assert.equal(dialog.open,false);assert.equal(pin.focused,true);assert.equal(pin.getAttribute('aria-expanded'),'false');}
 view.destroy();assert.equal(pins.children.length,0);assert.equal(f.document.body.classList.contains('intro-modal-open'),false);
});
