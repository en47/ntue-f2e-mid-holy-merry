import { introStories } from '../data/intro-stories.js';

const PHONE_TURN = 180, SWIPE_START = 10, SWIPE_TURN = 48;

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
 let page = 0, busy = false, shut = true, disposed = false, revision = 0, giftAnimation, swipe;
 const on = (target, type, fn, options) => {
  if (!target?.addEventListener) return;
  target.addEventListener(type, fn, options);
  listeners.push(() => target.removeEventListener(type, fn, options));
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
  copy.append(story);
  art.page?.(copy);
  const view = element('div', 'intro-scene-page');
  const panels = item.pieces.map(p => {
   const node = element('div', `intro-piece piece-${p.id}`);
   for (const key of ['x', 'y', 'w', 'h']) node.style.setProperty(`--${key}`, `${p[key]}%`);
   node.style.setProperty('--layer', p.z); node.style.setProperty('--depth', `${p.depth}px`);
   node.setAttribute('role', 'img'); node.setAttribute('aria-label', p.alt);
   art.piece?.(node, p); view.append(node);
   // Cards fall backward, so perspective only ever shrinks them inside the page. Paint order is
   // plain z-index: no shared 3D space means no card can slice through another.
   const tilt = angle => `perspective(1000px) translateZ(${p.depth}px) rotateX(${angle}deg)`;
   const folded = tilt(86), raised = tilt(0);
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
  $('hint').textContent = page === stories.length - 1 ? '最後一頁' : '往上滑，翻下一頁';
  book.dataset.ends = page === stories.length - 1 ? 'last' : 'more';
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
 // iOS and iPadOS Safari do not reliably hide backfaces, so every sheet swaps its face while edge-on.
 async function hinge(node, axis, from, to, duration, showFace, { prefix = '', shade = false } = {}) {
  const middle = (from + to) / 2, back = angle => Math.abs(angle) > 90;
  const frame = (angle, lifted) => ({ transform: `${prefix}${axis}(${angle}deg)`, ...(shade && { boxShadow: lifted ? '8px 10px 7px #6e553347' : '0 2px 2px #6e55331a' }) });
  showFace(back(from));
  if (!await animate(node, [frame(from, false), frame(middle, true)], { duration: duration / 2, easing: 'cubic-bezier(.5,.05,.85,.55)' })) return false;
  showFace(back(to));
  return animate(node, [frame(middle, true), frame(to, false)], { duration: duration / 2, easing: 'cubic-bezier(.15,.45,.4,1)' });
 }
 function stopGift() { giftAnimation?.cancel(); giftAnimation = undefined; }
 const settle = (index, up) => views[index].panels.forEach(p => { p.node.style.transform = up ? p.raised : p.folded; });
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
 function face(target, content) {
  const wrapper = element('div', 'intro-leaf-desktop'); wrapper.append(content);
  target.replaceChildren(wrapper);
 }
 function leaf(target) {
  const forward = target > page;
  // Phones lay the spread out top to bottom, so the lower text page is the one that lifts.
  if (stacked()) {
   face($('front'), clone(views[forward ? page : target].copy));
   face($('back'), picture(forward ? target : page));
  } else {
   face($('front'), forward ? picture(page) : picture(target));
   face($('back'), clone(views[forward ? target : page].copy));
  }
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
  const upward = stacked();
  // A swipe answers at once on phones: the leaf lifts the page as it stands, scene included.
  if (!upward) { await fold(page, false); if (disposed || token !== revision) return false; }
  phase('turning'); const forward = leaf(target);
  if (upward) {
   const shown = $('front').querySelector?.('.intro-copy');
   if (shown && forward) shown.scrollTop = views[page].copy.scrollTop;
   views[target].copy.scrollTop = 0;
  }
  if (forward === upward) choose('copy', target); else choose('view', target);
  // The leaf covers the underlay. Only reveal its matching static page after it lands.
  const axis = upward ? 'rotateX' : 'rotateY', flat = 0, flipped = upward ? PHONE_TURN : -180;
  const from = forward ? flat : flipped, to = forward ? flipped : flat;
  await hinge(turn, axis, from, to, upward ? 760 : 820, side => { turn.dataset.side = side ? 'back' : 'front'; }, { prefix: 'translateZ(30px) ', shade: true });
  if (disposed || token !== revision) return false;
  if (upward) settle(page, false);
  page = target; choose('copy', page); choose('view', page); hideLeaf(); announce();
  phase('opening'); await fold(page, true); if (disposed || token !== revision) return false;
  busy = false; phase('open'); controls(); return true;
 }
 // The closed book sits centred; it slides right so the cover's hinge lands on the spine.
 const stacked = () => Boolean(globalThis.matchMedia?.('(max-width: 700px)').matches);
 const slide = (from, to) => { const axis = stacked() ? 'translateY' : 'translateX'; return animate(shell, [{ transform: `${axis}(${from}%)` }, { transform: `${axis}(${to}%)` }], { duration: 560, easing: 'cubic-bezier(.3,.7,.3,1)' }); };
 // Phones turn the book over a horizontal spine; wider screens keep the upright one.
 const swing = (from, to, duration) => hinge(cover, stacked() ? 'rotateX' : 'rotateY', from, to, duration, side => { cover.dataset.side = side ? 'inside' : 'outside'; });
 // One smooth scroll that frames the book with its buttons; scrolling stays free afterwards.
 function frameBook() {
  const top = shell.getBoundingClientRect?.().top, bottom = controlBar.getBoundingClientRect?.().bottom;
  if (top === undefined || !globalThis.scrollTo || stacked()) { showBookTop(); return; }
  const span = bottom - top, height = globalThis.innerHeight;
  const offset = span < height ? top - (height - span) / 2 : top - 12;
  globalThis.scrollTo({ top: Math.max(0, globalThis.scrollY + offset), behavior: motion.matches ? 'auto' : 'smooth' });
 }
 // The inside of the cover lands on the first page of the spread: scene on phones, text elsewhere.
 const showInsideCover = () => coverPage.replaceChildren(stacked() ? picture(page) : clone(views[page].copy));
 async function openBook() {
  if (disposed || busy || !shut) return false;
  frameBook(); busy = true; const token = ++revision; controls(); phase('sliding');
  showInsideCover();
  await slide(-25, 0); if (disposed || token !== revision) return false;
  showBookTop(); // The book only has its open height once the slide has settled.
  phase('covering'); await swing(0, stacked() ? PHONE_TURN : -180, 1000); if (disposed || token !== revision) return false;
  shut = false; cover.hidden = true; phase('opening'); await fold(page, true); if (disposed || token !== revision) return false;
  busy = false; phase('open'); controls(); next.focus?.({ preventScroll: true }); return true;
 }
 async function closeBook() {
  if (disposed || busy || shut) return false;
  showBookTop(); busy = true; const token = ++revision; stopGift(); controls(); phase('closing');
  await fold(page, false); if (disposed || token !== revision) return false;
  showInsideCover();
  shut = true; cover.hidden = false; phase('covering');
  await swing(stacked() ? PHONE_TURN : -180, 0, 1000); if (disposed || token !== revision) return false;
  phase('sliding'); await slide(0, -25); if (disposed || token !== revision) return false;
  shell.style.transform = ''; busy = false;
  // The next reader on a phone starts at the first page; only a swipe can move forward.
  if (stacked()) { settle(page, false); page = 0; choose('copy', 0); choose('view', 0); announce(); views.forEach(view => { view.copy.scrollTop = 0; }); }
  phase('closed'); controls(); cover.focus?.({ preventScroll: true }); return true;
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
 // Text scrolls first; a swipe turns the page only once the text has reached that end.
 const roomToScroll = (down, inside) => {
  if (!inside) return false;
  const text = views[page].copy;
  return down ? text.scrollTop + text.clientHeight < text.scrollHeight - 2 : text.scrollTop > 2;
 };
 on(book, 'touchstart', event => {
  swipe = !shut && !busy && stacked() && event.touches.length === 1 ? { x: event.touches[0].clientX, y: event.touches[0].clientY, target: event.target } : undefined;
 }, { passive: true });
 on(book, 'touchmove', event => {
  if (!swipe) return;
  const dx = event.touches[0].clientX - swipe.x, dy = event.touches[0].clientY - swipe.y;
  if (swipe.turn === undefined) {
   if (Math.hypot(dx, dy) < SWIPE_START) return;
   const down = dy < 0, target = page + (down ? 1 : -1);
   // Past either end there is no leaf left, so the gesture goes back to scrolling the site.
   const turns = Math.abs(dy) > Math.abs(dx) && target >= 0 && target < stories.length && !roomToScroll(down, Boolean(event.target.closest?.('.intro-copy')));
   swipe.turn = turns ? target : false;
  }
  if (swipe.turn === false) return;
  swipe.moved = Math.abs(dy);
  if (event.cancelable) event.preventDefault();
 }, { passive: false });
 on(book, 'touchend', () => {
  if (swipe?.turn !== undefined && swipe.turn !== false && swipe.moved >= SWIPE_TURN) changePage(swipe.turn);
  swipe = undefined;
 });
 on(book, 'touchcancel', () => { swipe = undefined; });
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
