// The Christmas Market page (vending.html, docs/VENDING-MARKET.md): an old town's Christmas square in the snow at dusk,
// stood up in paper the way Santa's page is (components/vending-scene.js, laid out by services/market-layout.js): the
// vending machine in front (vending-machine.js, in the same scene), the Advent House on the right turned toward it
// (vending-advent.js), elves shopping at the stalls behind; and behind the machine the workshop (vending-coloring.js)
// where a thing from the machine is coloured in. Its title, in the coloured paper letters of the daytime pages, is on a
// cream sign that hangs where the string of stars across the sky begins, on any screen. Taken off the machine's stage,
// the street leans in toward it and fades as the workshop comes up out of that same spot; back to the market, it all runs
// the other way. Touched, the machine or the Advent House is looked at closer: the view turns to it and draws in; there it
// is worked. Under reduced motion all of it simply comes and goes.
import { mountTitleArt } from './components/title-art.js';
import { paperLayer } from './components/paper-art.js';
import { SIGN_VIEW, signBoard } from './components/vending-plaza-art.js';
import { mountCabinPaper } from './components/cabin-paper.js';
import { createSound } from './components/cabin-sound.js';
import { mountScene } from './components/vending-scene.js';
import { mountMachine } from './components/vending-machine.js';
import { mountAdvent } from './components/vending-advent.js';
import { mountWorkshop } from './components/vending-coloring.js';
import { MACHINE, SIGN } from './services/market-layout.js';
import { ITEMS, VENDING } from './data/vending.js';

const page = document.querySelector('#vending'), market = page.querySelector('#market'), stage = page.querySelector('#vending-stage'), shop = page.querySelector('#workshop');
const status = page.querySelector('#vending-status'), picker = page.querySelector('#vending-picker');
const motion = matchMedia('(prefers-reduced-motion: reduce)');
const nameOf = id => ITEMS.find(item => item.id === id)?.name ?? '';
mountTitleArt(page.querySelector('#vending-title'), 'christmas-market');
mountCabinPaper(page);
// The title's sign: its board under the letters (drawn a little past it, SIGN_VIEW, for its snow and holly), set each
// frame where the square shows SIGN, the end of the string of stars.
const heading = page.querySelector('.vending-heading');
{ const sign = document.createElement('div'), [x, y, width, height] = SIGN_VIEW; sign.className = 'market-sign'; sign.setAttribute('aria-hidden', 'true'); heading.prepend(sign);
  Object.assign(sign.style, { left: `${x / 5}%`, top: `${y / 2.2}%`, width: `${width / 5}%`, height: `${height / 2.2}%` });
  paperLayer(sign, SIGN_VIEW.join(' '), 'market-sign-board', signBoard, { paper: { scale: .8, grain: .4, shadow: .25, rim: '#f7efe2' }, eager: true }); }
let signAt = '';
function hangSign() {
  const [x, z] = SIGN.at, left = world.project([x - SIGN.width / 2, SIGN.foot + SIGN.height, z]), right = world.project([x + SIGN.width / 2, SIGN.foot, z]);
  const at = [left.x, left.y, right.x - left.x, right.y - left.y].map(value => value.toFixed(1)).join(' ');
  if (at === signAt) return; signAt = at;
  // (never nearer the edge of the view than a margin: pushed in, it still covers the start of the string of stars)
  const [l, t, w, h] = at.split(' ').map(Number), margin = Math.max(18, world.host.clientWidth * .02);
  Object.assign(heading.style, { left: `${Math.max(l, margin).toFixed(1)}px`, top: `${Math.max(t, margin * .7).toFixed(1)}px`, width: `${w}px`, height: `${h}px` });
}

// Should the street or the machine not come (no WebGL, a model missing), the four things are offered plainly instead.
function offer() {
  if (picker.childElementCount) { picker.hidden = false; return; }
  const words = document.createElement('p'); words.textContent = VENDING.failed; picker.append(words);
  for (const { id, name } of ITEMS) { const button = document.createElement('button'); button.type = 'button'; button.dataset.item = id; button.textContent = name; picker.append(button); }
  picker.hidden = false;
}
// The machine is walked up to as the Advent House is (vending-advent.js): from the street its buttons, lever and stage are
// out of reach (their layer is inert); a touch on it, or Enter on the button laid over it, walks up to it, square to its
// front, and there they take a press. Esc, ✕ or a touch beside it goes back into the square.
const spot = document.createElement('div'); spot.className = 'machine-spot'; market.append(spot);
// Focus moved for the visitor shows its ring only when they are using the keyboard (a touch or a click leaves no box).
let byKeys = false;
addEventListener('keydown', () => { byKeys = true; }, true); addEventListener('pointerdown', () => { byKeys = false; }, true);
const settle = node => node?.focus({ preventScroll: true, focusVisible: byKeys });
const lift = document.createElement('button'), shut = document.createElement('button');
lift.type = shut.type = 'button'; lift.className = 'machine-lift'; shut.className = 'machine-shut'; shut.textContent = '✕'; shut.hidden = true;
lift.setAttribute('aria-label', VENDING.near); shut.setAttribute('aria-label', VENDING.away); spot.append(lift, shut);
// Up at the machine, a paper tag on a red thread hangs by what to do next: the buttons, then the lever, then the tray.
const tag = document.createElement('p'); tag.className = 'machine-tag'; tag.hidden = true; tag.setAttribute('aria-hidden', 'true'); spot.append(tag);
const TAG_AT = { idle: ['keypad', 'left'], chosen: ['lever', 'right'], ready: ['tray', 'right'] };
let atMachine = false, leaving = false, offs = [];
const placeBox = (node, { left, top, width, height }) => Object.assign(node.style, { left: `${left.toFixed(1)}px`, top: `${top.toFixed(1)}px`, width: `${width.toFixed(1)}px`, height: `${height.toFixed(1)}px` });
const onMachine = event => { const box = machine?.frame(), rect = world.host.getBoundingClientRect(), x = event.clientX - rect.left, y = event.clientY - rect.top; return Boolean(box) && x >= box.left && x <= box.left + box.width && y >= box.top && y <= box.top + box.height; };
function up() {
  if (atMachine || leaving || !machine || world?.mode !== 'street') return;
  atMachine = true; lift.hidden = true; shut.hidden = false; world.host.classList.remove('is-pointing-machine'); sound?.play('whoosh');
  const [x, , z] = machine.middle();
  world.walk({ look: [x, MACHINE.height * .5, z], size: MACHINE.height / .9, wide: 1.5 }).then(() => {
    if (!atMachine) return; stage.inert = false;
    settle(stage.querySelector('.machine-button:not(:disabled)') ?? stage.querySelector('.machine-lever'));
  });
}
function away() {
  if (!atMachine) return; atMachine = false; leaving = true; stage.inert = true; shut.hidden = true; sound?.play('whoosh');
  world.walk(null).then(() => { leaving = false; if (atMachine) return; lift.hidden = false; settle(lift); });
}
lift.addEventListener('click', up); shut.addEventListener('click', away);
document.addEventListener('keydown', event => { if (event.key === 'Escape' && atMachine && shop.hidden && !event.defaultPrevented) { event.preventDefault(); away(); } });
function watchMachine() {
  stage.inert = true;
  offs.push(world.onFrame(hangSign));
  offs.push(world.onFrame(() => {
    const next = atMachine && !leaving && !stage.inert && shop.hidden ? TAG_AT[machine?.state] : null;
    tag.hidden = !next;
    if (next) { const at = machine.point(next[0]); if (tag.textContent !== VENDING.next[machine.state]) tag.textContent = VENDING.next[machine.state]; tag.dataset.side = next[1]; Object.assign(tag.style, { left: `${at.x.toFixed(1)}px`, top: `${at.y.toFixed(1)}px` }); }
  }));
  offs.push(world.onFrame(() => {
    const box = machine?.frame(); if (!box) return;
    if (!atMachine) placeBox(lift, box);
    else Object.assign(shut.style, { left: `${Math.min(box.left + box.width + 10, market.clientWidth - 60).toFixed(1)}px`, top: `${Math.max(box.top + 10, 12).toFixed(1)}px` });
  }));
  offs.push(world.onTap(event => {
    if (atMachine) { if (!onMachine(event)) away(); return true; }
    if (world.mode === 'street' && onMachine(event)) { up(); return true; }
    return false;
  }));
  const hover = event => world.host.classList.toggle('is-pointing-machine', event.pointerType !== 'touch' && world?.mode === 'street' && !atMachine && onMachine(event));
  world.host.addEventListener('pointermove', hover); offs.push(() => world.host.removeEventListener('pointermove', hover));
}

let world = null, sound = null, machine = null, advent = null, workshop = null, timer = 0;
function start() {
  sound = createSound();
  workshop = mountWorkshop(shop.querySelector('.shop-work'), { room: shop.querySelector('.shop-room'), sound, onBack: leaveShop });
  try { world = mountScene(page.querySelector('.vending-scene'), page.querySelector('.market-front')); } catch (error) { console.error('The market could not be drawn', error); stage.dataset.state = 'failed'; offer(); return; }
  advent = mountAdvent(page.querySelector('#advent-stand'), { world, sound, onLift: near => { if (near) page.dataset.view = 'advent'; else delete page.dataset.view; } });
  // What the machine is doing, read out: a pick, the delivery setting off, the thing on the stage; or why the lever did not go.
  machine = mountMachine(stage, { world, place: MACHINE, sound, onState: (state, id, note) => {
    const words = note ? VENDING[note] : { chosen: VENDING.chosen, running: VENDING.running, ready: VENDING.drop }[state];
    if (words) status.textContent = typeof words === 'function' ? words(nameOf(id)) : words;
    if (state === 'failed') offer();
  } });
  watchMachine();
}

// Into the workshop from a point on the page (the stage's tray): the street leans in toward it and fades, the
// workshop comes up out of it; once it covers the square the machine stops drawing (and puts itself back in order).
function enterShop(id, at) {
  clearTimeout(timer);
  const box = page.getBoundingClientRect();
  page.style.setProperty('--zoom-x', `${at.x - box.left}px`); page.style.setProperty('--zoom-y', `${at.y - box.top}px`);
  workshop.open(id); shop.hidden = false; shop.classList.remove('is-leaving'); page.classList.remove('is-returning'); page.dataset.mode = 'workshop'; sound?.play('whoosh');
  if (page.getBoundingClientRect().top < 0) page.scrollIntoView({ block: 'start', behavior: motion.matches ? 'auto' : 'smooth' });
  timer = setTimeout(() => { market.inert = true; machine?.hold(true); world?.hold(true); workshop.focus(); }, motion.matches ? 0 : 760);
}
function leaveShop() {
  clearTimeout(timer); market.inert = false; world?.hold(false); machine?.hold(false); workshop.close(); sound?.play('whoosh'); page.dataset.mode = 'market';
  const done = () => { shop.hidden = true; shop.classList.remove('is-leaving'); page.classList.remove('is-returning'); settle(stage.querySelector('.machine-button:not(:disabled)') ?? stage.querySelector('.machine-hit')); };
  if (motion.matches) { done(); return; }
  // (the workshop folds down first, then the square comes back: both together are just under a second)
  shop.classList.add('is-leaving'); page.classList.add('is-returning'); timer = setTimeout(done, 1000);
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
// The page leaves and comes back through the back-forward cache: everything holding a WebGL context or timers goes, and
// is built again.
function stop() {
  clearTimeout(timer); offs.forEach(off => off()); offs = []; machine?.destroy(); advent?.destroy(); workshop?.destroy(); sound?.destroy(); world?.destroy();
  machine = advent = workshop = sound = world = null; signAt = ''; atMachine = leaving = false; lift.hidden = false; shut.hidden = true; stage.inert = false;
  shop.hidden = true; market.inert = false; page.dataset.mode = 'market'; delete page.dataset.view;
}
window.addEventListener('pagehide', stop);
window.addEventListener('pageshow', event => { if (event.persisted) start(); });
start();
