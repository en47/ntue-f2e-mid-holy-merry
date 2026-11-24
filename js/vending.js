// The Christmas Vending page (vending.html): a snowy night (components/vending-scene.js), the vending machine in the
// middle (vending-machine.js), the advent calendar on its stand to the right (vending-advent.js), and the coloring desk
// (vending-coloring.js) a little thing taken off the machine's stage is carried to. The desk opens out of the stage's tray
// like a sheet of paper unfolding, and folds back into it on the way back to the machine; under reduced motion it simply
// comes and goes.
// The page's paper (buttons, the desk's tin, the advent card) is drawn by cabin-paper.js, as on Santa's page.
import { mountTitleArt } from './components/title-art.js';
import { mountCabinPaper } from './components/cabin-paper.js';
import { createSound } from './components/cabin-sound.js';
import { mountScene } from './components/vending-scene.js';
import { mountMachine } from './components/vending-machine.js';
import { mountAdvent } from './components/vending-advent.js';
import { mountColoring } from './components/vending-coloring.js';
import { paperLayer, shape } from './components/paper-art.js';
import { star } from './components/paper-props.js';
import { ITEMS, VENDING } from './data/vending.js';

const page = document.querySelector('#vending'), stage = page.querySelector('#vending-stage'), desk = page.querySelector('#color-desk');
const status = page.querySelector('#vending-status'), picker = page.querySelector('#vending-picker'), motion = matchMedia('(prefers-reduced-motion: reduce)');
const nameOf = id => ITEMS.find(item => item.id === id)?.name ?? '';
mountTitleArt(page.querySelector('#vending-title'), 'christmas-vending', { palette: ['#fbecc4', '#f4d581', '#fbecc4', '#e8b84f'], rim: '#33526f' });
mountScene(page.querySelector('.vending-scene'));
mountCabinPaper(page);

// The desk's wood: warm planks, a stray crayon and a gold star sticker on it.
function wood(g) {
  shape('rect', { x: 0, y: 0, width: 1200, height: 800, fill: '#a97c55' }, g);
  for (let y = 0; y < 800; y += 100) { shape('rect', { x: 0, y, width: 1200, height: 96, fill: y % 200 ? '#b08459' : '#a57650' }, g); shape('path', { d: `M0 ${y + 40}C300 ${y + 30} 700 ${y + 52} 1200 ${y + 38}M0 ${y + 70}C400 ${y + 62} 800 ${y + 78} 1200 ${y + 66}`, fill: 'none', stroke: '#8f6544', 'stroke-width': 2, opacity: .45 }, g); }
  shape('path', { d: 'M90 690L190 650 198 664 98 704Z', fill: '#4a5f80' }, g); shape('path', { d: 'M190 650L214 646 198 664Z', fill: '#4a5f80' }, g); shape('path', { d: 'M118 680L160 664 164 674 122 690Z', fill: '#f6ecd6', opacity: .9 }, g);
  star(g, 1090, 120, 34, '#e0b04f');
}
paperLayer(desk.querySelector('.color-wood'), '0 0 1200 800', '', wood, { paper: { scale: 1.2, grain: .5, shadow: .2 }, eager: true, preserveAspectRatio: 'xMidYMid slice' });
// Under the machine, its blue shadow on the snow and the lamp's warm light round it (placed by the machine's own foot).
const pool = g => { shape('ellipse', { cx: 300, cy: 74, rx: 140, ry: 20, fill: '#8fa3b9', opacity: .28 }, g); for (const [rx, ry, opacity] of [[290, 60, .12], [210, 44, .14]]) shape('ellipse', { cx: 300, cy: 70, rx, ry, fill: '#ffd68c', opacity }, g); };
paperLayer(stage.querySelector('.machine-light'), '0 0 600 140', '', pool, { paper: null, eager: true });
// The stage's own light spilling onto the snow in front of it, there only while a thing stands on the stage.
const spill = g => { for (const [rx, ry, opacity] of [[230, 44, .14], [150, 28, .2]]) shape('ellipse', { cx: 250, cy: 60, rx, ry, fill: '#ffd68c', opacity }, g); };
paperLayer(stage.querySelector('.machine-glow'), '0 0 500 120', '', spill, { paper: null, eager: true });
// Should the 3D machine not come (no WebGL, a model missing), the four things are offered plainly instead.
function offer() {
  if (picker.childElementCount) { picker.hidden = false; return; }
  const words = document.createElement('p'); words.textContent = VENDING.failed; picker.append(words);
  for (const { id, name } of ITEMS) { const button = document.createElement('button'); button.type = 'button'; button.dataset.item = id; button.textContent = name; picker.append(button); }
  picker.hidden = false;
}

let sound = null, machine = null, advent = null, coloring = null, timer = 0;
function start() {
  sound = createSound();
  advent = mountAdvent(page.querySelector('#advent-stand'), { sound });
  coloring = mountColoring(desk.querySelector('.color-work'), { sound, onBack: closeDesk });
  // What the machine is doing, read out: a pick, the delivery setting off, the thing on the stage; or why the lever did not go.
  machine = mountMachine(stage, { sound, onState: (state, id, note) => {
    const words = note ? VENDING[note] : { chosen: VENDING.chosen, running: VENDING.running, ready: VENDING.drop }[state];
    if (words) status.textContent = typeof words === 'function' ? words(nameOf(id)) : words;
    if (state === 'failed') offer();
  } });
  if (!machine) offer();
}
// Out of the tray: the desk unfolds from the tray's mouth with the drawing on it.
stage.addEventListener('click', event => { if (event.target.closest('.machine-tray')) { const id = machine?.takeOut(); if (id) openDesk(id); } });
picker.addEventListener('click', event => { const id = event.target.closest('[data-item]')?.dataset.item; if (id) openDesk(id); });
function openDesk(id) {
  clearTimeout(timer); coloring.show(id);
  const box = page.getBoundingClientRect(), from = stage.getBoundingClientRect(), mouth = machine?.trayPoint() ?? { x: from.width / 2, y: from.height * .8 };
  desk.style.setProperty('--from-x', `${from.left - box.left + mouth.x}px`); desk.style.setProperty('--from-y', `${from.top - box.top + mouth.y}px`);
  desk.hidden = false; desk.classList.remove('is-closing'); page.dataset.mode = 'desk'; machine?.hold(true);
  if (desk.getBoundingClientRect().top < 0) desk.scrollIntoView({ block: 'start', behavior: motion.matches ? 'auto' : 'smooth' });
  timer = setTimeout(() => coloring.focus(), motion.matches ? 0 : 650);
}
function closeDesk() {
  clearTimeout(timer); page.dataset.mode = 'machine'; sound?.play('whoosh'); machine?.hold(false);
  const done = () => { desk.hidden = true; desk.classList.remove('is-closing'); (stage.querySelector('.machine-button:not(:disabled)') ?? stage).focus({ preventScroll: true }); };
  if (motion.matches) { done(); return; }
  desk.classList.add('is-closing'); timer = setTimeout(done, 450);
}
desk.addEventListener('keydown', event => { if (event.key === 'Escape' && !desk.hidden) { event.preventDefault(); closeDesk(); } });

// The page leaves and comes back through the back-forward cache: everything holding a WebGL context or timers goes, and
// is built again.
function stop() { clearTimeout(timer); machine?.destroy(); advent?.destroy(); coloring?.destroy(); sound?.destroy(); machine = advent = coloring = sound = null; desk.hidden = true; page.dataset.mode = 'machine'; }
window.addEventListener('pagehide', stop);
window.addEventListener('pageshow', event => { if (event.persisted) start(); });
start();
