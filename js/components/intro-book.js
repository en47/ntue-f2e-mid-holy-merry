import { introStories } from '../data/intro-stories.js';

// One coordinator owns every hinge and the leaf. No halfway content swap or timers.
export function mountIntroBook(root, {
 stories = introStories,
 motion = matchMedia('(prefers-reduced-motion: reduce)'),
 art = {},
} = {}) {
 const $ = id => root.querySelector(`[data-book="${id}"]`);
 const scene = $('scene'), turn = $('turn'), copies = $('copies');
 const prev = $('prev'), next = $('next'), replay = $('replay'), gift = $('gift');
 const shell = $('shell'), book = $('book'), cover = $('cover'), coverPage = $('cover-page'), close = $('close'), controlBar = $('controls');
 const listeners = [], animations = new Set();
 let page = 0, busy = false, shut = true, disposed = false, revision = 0, giftAnimation;
 const on = (target, type, fn) => {
  if (!target?.addEventListener) return;
  target.addEventListener(type, fn);
  listeners.push(() => target.removeEventListener(type, fn));
 };
 const element = (tag, className, text) => {
  const node = document.createElement(tag); node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
 };
 const views = stories.map((item, index) => {
  const copy = element('article', 'intro-page intro-copy');
  const title = element('h2', '', item.title); title.id = `intro-story-title-${index}`;
  copy.setAttribute('aria-labelledby', title.id);
  copy.append(element('span', 'intro-chapter', `${item.chapter} · 聖誕故事`), title,
   element('p', 'intro-subtitle', item.subtitle));
  const story = element('div', 'intro-story');
  for (const paragraph of item.story.split(/\n\s*\n/)) story.append(element('p', '', paragraph));
  copy.append(story, element('blockquote', '', item.quote));
  art.page?.(copy);
  const view = element('div', 'intro-scene-page');
  const panels = item.pieces.map(p => {
   const node = element('div', `intro-piece piece-${p.id}`);
   for (const key of ['x', 'y', 'w', 'h']) node.style.setProperty(`--${key}`, `${p[key]}%`);
   node.style.setProperty('--layer', p.z); node.style.setProperty('--depth', `${p.depth}px`);
   node.setAttribute('role', 'img'); node.setAttribute('aria-label', p.alt);
   art.piece?.(node, p); view.append(node);
   const folded = `translateZ(${p.depth}px) rotateX(-84deg)`;
   // Backdrops lean less than the depth gap between layers, so no plane slices through another.
   const raised = `translateZ(${p.depth}px) rotateX(${p.id === 'sky' ? 1 : -2}deg)`;
   node.style.transform = folded;
   return { node, folded, raised, delay: p.delay };
  });
  const coin = element('div', 'intro-coin'); coin.setAttribute('aria-hidden', 'true');
  art.coin?.(coin); view.append(coin); copies.append(copy); scene.append(view);
  return { copy, view, panels, coin };
 });
 function controls() {
  prev.disabled = busy || page === 0; next.disabled = busy || page === stories.length - 1;
  replay.disabled = busy; gift.disabled = busy; gift.hidden = page !== 1; close.disabled = busy;
  controlBar.hidden = shut;
  root.setAttribute('aria-busy', String(busy));
 }
 function phase(value) { root.dataset.phase = value; book.dataset.state = shut ? (value === 'closed' ? 'closed' : 'moving') : 'open'; }
 function choose(kind, index) {
  for (let i = 0; i < views.length; i++) {
   const node = views[i][kind], active = i === index;
   node.dataset.active = String(active); node.setAttribute('aria-hidden', String(!active)); node.inert = !active;
  }
  if (kind === 'view') { scene.dataset.chapter = String(index); scene.setAttribute('aria-label', stories[index].scene); }
 }
 function announce() {
  $('count').textContent = `${String(page + 1).padStart(2, '0')} / ${String(stories.length).padStart(2, '0')}`;
  $('caption').textContent = stories[page].scene;
 }
 async function animate(node, frames, options) {
  const last = frames[frames.length - 1];
  if (disposed) return false;
  if (motion.matches || document.hidden || !node.animate) { Object.assign(node.style, last); return true; }
  const animation = node.animate(frames, { ...options, fill: 'both' }); animations.add(animation);
  try { await animation.finished; if (disposed) return false; Object.assign(node.style, last); return true; }
  catch { return false; }
  finally { animations.delete(animation); animation.cancel(); }
 }
 function fold(index, opening) {
  return Promise.all(views[index].panels.map(p => animate(p.node,
   [{ transform: opening ? p.folded : p.raised }, { transform: opening ? p.raised : p.folded }],
   { duration: opening ? 660 : 420, delay: opening ? p.delay * .65 : (600 - p.delay) * .25,
    easing: opening ? 'cubic-bezier(.2,.76,.3,1.04)' : 'cubic-bezier(.42,0,.8,.5)' })));
 }
 function stopGift() { giftAnimation?.cancel(); giftAnimation = undefined; }
 function clone(node) {
  const copy = node.cloneNode(true);
  for (const el of [copy, ...copy.querySelectorAll('[id], [data-book], [aria-labelledby]')]) {
   el.removeAttribute('id'); el.removeAttribute('data-book'); el.removeAttribute('aria-labelledby');
  }
  copy.dataset.active = 'true'; copy.removeAttribute('aria-hidden'); copy.inert = false;
  return copy;
 }
 function picture(index) {
  const container = element('div', 'intro-page intro-picture intro-leaf-picture');
  const stage = element('div', 'intro-scene'); stage.append(clone(views[index].view)); container.append(stage);
  return container;
 }
 function face(target, desktop, index) {
  const desktopFace = element('div', 'intro-leaf-desktop'); desktopFace.append(desktop);
  // A stacked spread on narrow screens still turns as one populated paper leaf.
  const mobileFace = element('div', 'intro-leaf-mobile'); mobileFace.append(picture(index), clone(views[index].copy));
  target.replaceChildren(desktopFace, mobileFace);
 }
 function leaf(target) {
  const forward = target > page;
  face($('front'), forward ? picture(page) : picture(target), forward ? page : target);
  face($('back'), clone(views[forward ? target : page].copy), forward ? target : page);
  turn.dataset.direction = forward ? 'forward' : 'backward'; turn.hidden = false;
  turn.style.visibility = 'visible';
  return forward;
 }
 function hideLeaf() {
  turn.style.visibility = 'hidden'; turn.hidden = true;
  $('front').replaceChildren(); $('back').replaceChildren();
 }
 // The stacked phone layout puts the scene first, so a new chapter always starts from it.
 function showBookTop() {
  if (!globalThis.matchMedia?.('(max-width: 700px)').matches) return;
  root.querySelector('.intro-book')?.scrollIntoView?.({ block: 'start', behavior: motion.matches ? 'auto' : 'smooth' });
 }
 async function changePage(target) {
  if (disposed || busy || shut || target < 0 || target >= stories.length || target === page) return false;
  showBookTop(); busy = true; const token = ++revision; stopGift(); controls(); phase('closing');
  await fold(page, false); if (disposed || token !== revision) return false;
  phase('turning'); const forward = leaf(target);
  // The leaf covers the underlay. Only reveal its matching static page after it lands.
  if (forward) choose('view', target); else choose('copy', target);
  const from = forward ? 0 : -180, to = forward ? -180 : 0;
  await animate(turn, [
   { transform: `translateZ(30px) rotateY(${from}deg)`, boxShadow: '0 2px 2px #6e55331a' },
   { transform: `translateZ(30px) rotateY(${(from + to) / 2}deg)`, boxShadow: '8px 10px 7px #6e553347' },
   { transform: `translateZ(30px) rotateY(${to}deg)`, boxShadow: '0 2px 2px #6e55331a' },
  ], { duration: 820, easing: 'cubic-bezier(.45,.08,.25,1)' });
  if (disposed || token !== revision) return false;
  page = target; choose('copy', page); choose('view', page); hideLeaf(); announce();
  phase('opening'); await fold(page, true); if (disposed || token !== revision) return false;
  busy = false; phase('open'); controls(); return true;
 }
 // The closed book sits centred; it slides right so the cover's hinge lands on the spine.
 const stacked = () => Boolean(globalThis.matchMedia?.('(max-width: 700px)').matches);
 const slide = (from, to) => stacked() ? Promise.resolve(true) : animate(shell, [{ transform: `translateX(${from}%)` }, { transform: `translateX(${to}%)` }], { duration: 560, easing: 'cubic-bezier(.3,.7,.3,1)' });
 const swing = (from, to, duration) => animate(cover, [{ transform: `rotateY(${from}deg)` }, { transform: `rotateY(${to}deg)` }], { duration, easing: 'cubic-bezier(.42,.03,.2,1)' });
 async function openBook() {
  if (disposed || busy || !shut) return false;
  busy = true; const token = ++revision; controls(); phase('sliding');
  coverPage.replaceChildren(clone(views[page].copy));
  await slide(-25, 0); if (disposed || token !== revision) return false;
  phase('covering'); await swing(0, stacked() ? -105 : -180, 1000); if (disposed || token !== revision) return false;
  shut = false; cover.hidden = true; phase('opening'); await fold(page, true); if (disposed || token !== revision) return false;
  busy = false; phase('open'); controls(); next.focus?.({ preventScroll: true }); return true;
 }
 async function closeBook() {
  if (disposed || busy || shut) return false;
  busy = true; const token = ++revision; stopGift(); controls(); phase('closing');
  await fold(page, false); if (disposed || token !== revision) return false;
  coverPage.replaceChildren(clone(views[page].copy));
  shut = true; cover.hidden = false; phase('covering');
  await swing(stacked() ? -105 : -180, 0, 1000); if (disposed || token !== revision) return false;
  phase('sliding'); await slide(0, -25); if (disposed || token !== revision) return false;
  shell.style.transform = ''; busy = false; phase('closed'); controls(); cover.focus?.({ preventScroll: true }); return true;
 }
 async function replayScene() {
  if (disposed || busy || shut) return false;
  busy = true; const token = ++revision; stopGift(); controls(); phase('closing');
  await fold(page, false); if (disposed || token !== revision) return false;
  phase('opening'); await fold(page, true); if (disposed || token !== revision) return false;
  busy = false; phase('open'); controls(); return true;
 }
 async function playGift() {
  if (disposed || busy || page !== 1) return;
  stopGift(); const coin = views[page].coin;
  if (!coin.animate || motion.matches) { $('caption').textContent = '金幣送進長襪，善意為一家人帶來希望。'; return; }
  const animation = coin.animate([
   { opacity: 0, transform: 'translateZ(70px) translate(0,0) scale(.8)' },
   { opacity: 1, offset: .15 },
   { opacity: 1, transform: 'translateZ(70px) translate(300%,-140%) rotate(15deg) scale(.7)', offset: .45 },
   { opacity: 1, transform: 'translateZ(70px) translate(640%,40%) scale(.35)', offset: .85 },
   { opacity: 0, transform: 'translateZ(70px) translate(660%,80%) scale(.1)' },
  ], { duration: 1200, easing: 'ease-in-out' });
  giftAnimation = animation;
  try { await animation.finished; } catch { /* A new chapter cancels this temporary prop. */ }
  finally { animation.cancel(); if (giftAnimation === animation) giftAnimation = undefined; }
 }
 on(prev, 'click', () => changePage(page - 1)); on(next, 'click', () => changePage(page + 1));
 on(replay, 'click', replayScene); on(gift, 'click', playGift); on(cover, 'click', openBook); on(close, 'click', closeBook);
 on(root, 'keydown', event => {
  if (event.altKey || event.ctrlKey || event.metaKey || event.target.closest('input,textarea,select')) return;
  if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
   event.preventDefault(); changePage(page + (event.key === 'ArrowRight' ? 1 : -1));
  }
 });
 const finish = () => { for (const animation of animations) { try { animation.finish(); } catch { animation.cancel(); } } stopGift(); };
 on(motion, 'change', () => { if (motion.matches) finish(); });
 on(document, 'visibilitychange', () => { if (document.hidden) finish(); });
 on(globalThis, 'resize', finish);
 choose('copy', 0); choose('view', 0); hideLeaf(); announce(); controls(); phase('closed');
 return {
  open: openBook, close: closeBook, changePage, replay: replayScene, snapshot: () => ({ page, busy, shut, phase: root.dataset.phase }),
  destroy() { disposed = true; revision++; stopGift(); listeners.forEach(fn => fn()); for (const a of animations) a.cancel(); animations.clear(); hideLeaf(); },
 };
}
