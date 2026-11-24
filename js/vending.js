// The Christmas Market page (vending.html, docs/VENDING-MARKET.md): a little market square on a snowy night
// (components/vending-scene.js): the vending machine on the left of the street (vending-machine.js), the advent calendar in
// its stall on the right (vending-advent.js), and behind the machine the workshop (vending-coloring.js) where a thing
// from the machine is coloured in. Taken off the machine's stage, the street leans in toward it and fades as the workshop
// comes up out of that same spot; back to the market, it all runs the other way. While the machine is being worked, or
// the calendar is lifted down, the rest of the street dims a little. With a mouse its layers shift a few pixels with the
// pointer, the far ones least. Under reduced motion all of it simply comes and goes.
import { mountTitleArt } from './components/title-art.js';
import { mountCabinPaper } from './components/cabin-paper.js';
import { createSound } from './components/cabin-sound.js';
import { mountScene } from './components/vending-scene.js';
import { mountMachine } from './components/vending-machine.js';
import { mountAdvent } from './components/vending-advent.js';
import { mountWorkshop } from './components/vending-coloring.js';
import { paperLayer, shape } from './components/paper-art.js';
import { ITEMS, VENDING } from './data/vending.js';

const page = document.querySelector('#vending'), market = page.querySelector('#market'), stage = page.querySelector('#vending-stage'), shop = page.querySelector('#workshop');
const status = page.querySelector('#vending-status'), picker = page.querySelector('#vending-picker'), veil = page.querySelector('.market-veil');
const motion = matchMedia('(prefers-reduced-motion: reduce)'), fine = matchMedia('(hover: hover) and (pointer: fine)');
const nameOf = id => ITEMS.find(item => item.id === id)?.name ?? '';
mountTitleArt(page.querySelector('#vending-title'), 'christmas-market', { palette: ['#fbecc4', '#f4d581', '#fbecc4', '#e8b84f'], rim: '#33526f' });
mountScene(page.querySelector('.vending-scene'), page.querySelector('.market-front'));
mountCabinPaper(page);

// Under the machine, its round wooden dais and the warm light round it (placed by the machine's own foot); and the stage's
// own light spilling onto the cobbles in front of it, there only while a thing stands on the stage.
const pool = g => { for (const [rx, ry, opacity] of [[290, 60, .14], [210, 44, .16]]) shape('ellipse', { cx: 300, cy: 70, rx, ry, fill: '#ffd68c', opacity }, g); };
paperLayer(stage.querySelector('.machine-light'), '0 0 600 140', '', pool, { paper: null, eager: true });
const dais = g => {
  shape('path', { d: 'M20 66A280 40 0 0 0 580 66V92A280 40 0 0 1 20 92Z', fill: '#5e3d2c' }, g); shape('ellipse', { cx: 300, cy: 66, rx: 280, ry: 40, fill: '#7a5238' }, g);
  shape('path', { d: 'M70 48A230 30 0 0 0 530 48V64A230 30 0 0 1 70 64Z', fill: '#8a5a3c' }, g); shape('ellipse', { cx: 300, cy: 48, rx: 230, ry: 30, fill: '#a8774d' }, g);
  shape('ellipse', { cx: 300, cy: 48, rx: 230, ry: 30, fill: 'none', stroke: '#e0b04f', 'stroke-width': 4 }, g); shape('ellipse', { cx: 300, cy: 66, rx: 280, ry: 40, fill: 'none', stroke: '#e0b04f', 'stroke-width': 3, 'stroke-dasharray': '2 0' }, g);
};
paperLayer(stage.querySelector('.machine-dais'), '0 0 600 110', '', dais, { paper: { scale: .6, grain: .45, shadow: .24 }, eager: true });
const spill = g => { for (const [rx, ry, opacity] of [[230, 44, .14], [150, 28, .2]]) shape('ellipse', { cx: 250, cy: 60, rx, ry, fill: '#ffd68c', opacity }, g); };
paperLayer(stage.querySelector('.machine-glow'), '0 0 500 120', '', spill, { paper: null, eager: true });
// Should the 3D machine not come (no WebGL, a model missing), the four things are offered plainly instead.
function offer() {
  if (picker.childElementCount) { picker.hidden = false; return; }
  const words = document.createElement('p'); words.textContent = VENDING.failed; picker.append(words);
  for (const { id, name } of ITEMS) { const button = document.createElement('button'); button.type = 'button'; button.dataset.item = id; button.textContent = name; picker.append(button); }
  picker.hidden = false;
}
// The street dims round what is being used: the machine while it is worked, the calendar while it is lifted down.
function focus(kind) { if (kind) page.dataset.focus = kind; else delete page.dataset.focus; }

let sound = null, machine = null, advent = null, workshop = null, timer = 0;
function start() {
  sound = createSound();
  advent = mountAdvent(page.querySelector('#advent-stand'), { sound, onLift: lifted => focus(lifted ? 'advent' : busy() ? 'machine' : '') });
  workshop = mountWorkshop(shop.querySelector('.shop-work'), { room: shop.querySelector('.shop-room'), sound, onBack: leaveShop });
  // What the machine is doing, read out: a pick, the delivery setting off, the thing on the stage; or why the lever did not go.
  machine = mountMachine(stage, { sound, onState: (state, id, note) => {
    const words = note ? VENDING[note] : { chosen: VENDING.chosen, running: VENDING.running, ready: VENDING.drop }[state];
    if (words) status.textContent = typeof words === 'function' ? words(nameOf(id)) : words;
    if (state === 'failed') offer();
    if (page.dataset.focus !== 'advent') focus(busy(state) ? 'machine' : '');
  } });
  if (!machine) offer();
}
const busy = (state = machine?.state) => ['chosen', 'pulling', 'running', 'ready'].includes(state);
veil.addEventListener('click', () => advent?.close());

// Into the workshop from a point on the page (the stage's tray): the street leans in toward it and fades, the
// workshop comes up out of it; once it covers the square the machine stops drawing (and puts itself back in order).
function enterShop(id, at) {
  clearTimeout(timer);
  const box = page.getBoundingClientRect();
  page.style.setProperty('--zoom-x', `${at.x - box.left}px`); page.style.setProperty('--zoom-y', `${at.y - box.top}px`);
  workshop.open(id); shop.hidden = false; shop.classList.remove('is-leaving'); page.classList.remove('is-returning'); page.dataset.mode = 'workshop'; focus(''); sound?.play('whoosh');
  if (page.getBoundingClientRect().top < 0) page.scrollIntoView({ block: 'start', behavior: motion.matches ? 'auto' : 'smooth' });
  timer = setTimeout(() => { market.inert = true; machine?.hold(true); workshop.focus(); }, motion.matches ? 0 : 760);
}
function leaveShop() {
  clearTimeout(timer); market.inert = false; machine?.hold(false); workshop.close(); sound?.play('whoosh'); page.dataset.mode = 'market';
  const done = () => { shop.hidden = true; shop.classList.remove('is-leaving'); page.classList.remove('is-returning'); (stage.querySelector('.machine-button:not(:disabled)') ?? stage.querySelector('.machine-hit'))?.focus({ preventScroll: true }); };
  if (motion.matches) { done(); return; }
  shop.classList.add('is-leaving'); page.classList.add('is-returning'); timer = setTimeout(done, 650);
}
const centreOf = node => { const box = node.getBoundingClientRect(); return { x: box.left + box.width / 2, y: box.top + box.height * .55 }; };
// Taken off the stage: it pops up a little, then off to the workshop with it.
stage.addEventListener('click', event => {
  if (!event.target.closest('.machine-tray')) return;
  const box = stage.getBoundingClientRect(), point = machine?.trayPoint(), id = machine?.takeOut();
  if (id) timer = setTimeout(() => enterShop(id, { x: box.left + point.x, y: box.top + point.y }), motion.matches ? 0 : 240);
});
picker.addEventListener('click', event => { const id = event.target.closest('[data-item]')?.dataset.item; if (id) enterShop(id, centreOf(picker)); });
shop.addEventListener('keydown', event => { if (event.key === 'Escape' && !shop.hidden && !event.defaultPrevented) { event.preventDefault(); leaveShop(); } });
// With a mouse, the street's layers shift a few pixels with the pointer (css uses --tilt-x and --tilt-y).
market.addEventListener('pointermove', event => {
  if (!fine.matches || motion.matches || page.dataset.mode !== 'market') return;
  const box = market.getBoundingClientRect();
  market.style.setProperty('--tilt-x', ((event.clientX - box.left) / box.width - .5).toFixed(3)); market.style.setProperty('--tilt-y', ((event.clientY - box.top) / box.height - .5).toFixed(3));
});

// The page leaves and comes back through the back-forward cache: everything holding a WebGL context or timers goes, and
// is built again.
function stop() { clearTimeout(timer); machine?.destroy(); advent?.destroy(); workshop?.destroy(); sound?.destroy(); machine = advent = workshop = sound = null; shop.hidden = true; market.inert = false; page.dataset.mode = 'market'; focus(''); }
window.addEventListener('pagehide', stop);
window.addEventListener('pageshow', event => { if (event.persisted) start(); });
start();
