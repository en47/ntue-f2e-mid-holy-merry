// The advent calendar in its own little chalet at the edge of the market square: a snowy gable roof, a string of warm
// lights under the eaves, the calendar hung from the crossbeam on two twine cords with wooden pegs, gifts and pine at the
// posts' feet. Small on the stand its doors are out of reach: a touch on it (or Enter) lifts the calendar off its cords
// and brings it to the middle of the page, large; there any of its twenty-four doors may be opened (this page keeps no
// story date). Opened, a door swings back on its hinge to show a little picture, the calendar bobs, and a card comes up
// with that day's paper scene (cabin-advent-scenes.js; a tap plays it on a step) and one line. ✕, Esc or a touch beside
// it hangs it back. Doors opened stay open in this browser; an open one tapped again shows its card again.
import { holly, paperLayer, shape } from './paper-art.js';
import { star } from './paper-props.js';
import { adventPicture } from './cabin-clue-art.js';
import { ADVENT_SCENES } from './cabin-advent-scenes.js';
import { ADVENT } from '../data/vending.js';

const KEY = 'holy-merry:vending:advent', DAYS = 24, TONES = ['red', 'green', 'gold', 'kraft'];
const PAPER = { paper: { scale: .5, grain: .45, shadow: .26 }, eager: true };
const element = (tag, className, parent, text) => { const node = document.createElement(tag); node.className = className; if (text) node.textContent = text; parent?.append(node); return node; };
const read = () => { try { const days = JSON.parse(localStorage.getItem(KEY)); return new Set(Array.isArray(days) ? days.filter(day => Number.isInteger(day) && day >= 1 && day <= DAYS) : []); } catch { return new Set(); } };
const write = days => { try { localStorage.setItem(KEY, JSON.stringify([...days].sort((a, b) => a - b))); } catch { /* open for this visit */ } };

// The chalet, 300 × 400: two posts in the snow, a crossbeam with two hooks, a steep red gable under a thick cap of snow
// with a star at its peak, a lantern on the left post, gifts and pine at the posts' feet.
function booth(g) {
  for (const x of [22, 264]) { shape('path', { d: `M${x} 92H${x + 14}L${x + 15} 388H${x - 1}Z`, fill: '#8a5a3c' }, g); shape('path', { d: `M${x + 9} 92H${x + 14}L${x + 15} 388H${x + 10}Z`, fill: '#6b4430' }, g); }
  shape('rect', { x: 14, y: 86, width: 272, height: 13, rx: 3, fill: '#a8774d' }, g);
  shape('path', { d: 'M14 96H286', stroke: '#6b4430', 'stroke-width': 2, 'stroke-opacity': .5 }, g);
  for (const x of [76, 224]) shape('path', { d: `M${x} 99V107Q${x} 113 ${x + 5} 111`, fill: 'none', stroke: '#3b2a24', 'stroke-width': 3, 'stroke-linecap': 'round' }, g);
  shape('path', { d: 'M0 90L150 12L300 90H274L150 28L26 90Z', fill: '#8f3530' }, g);
  shape('path', { d: 'M26 90L150 28L274 90Z', fill: '#e6d3ad' }, g);
  for (let x = 46; x < 260; x += 22) shape('path', { d: `M${x} ${90 - Math.max(0, 62 - Math.abs(x - 150) * .52)}V90`, stroke: '#bfa274', 'stroke-width': 2 }, g);
  shape('circle', { cx: 150, cy: 64, r: 13, fill: '#f4c66e' }, g); shape('path', { d: 'M150 51V77M137 64H163', stroke: '#8a5a3c', 'stroke-width': 3 }, g);
  shape('path', { d: 'M-4 90C14 74 34 82 52 70S90 52 108 42 136 22 150 8 168 24 186 36 222 54 244 66 280 72 304 88 288 86 274 82 258 86 238 76 220 78 198 64 178 54 160 42 150 30 138 42 120 54 100 64 82 78 62 82 44 76 28 84 20 90 12 92Z', fill: '#f8f5ee' }, g);
  star(g, 150, 6, 11);
  shape('path', { d: 'M8 102V114', stroke: '#3b2a24', 'stroke-width': 2 }, g);
  shape('path', { d: 'M0 114H16L14 120H2Z', fill: '#3c3238' }, g); shape('path', { d: 'M2 120H14L16 144H0Z', fill: '#f6d38a' }, g); shape('path', { d: 'M0 144H16L13 150H3Z', fill: '#3c3238' }, g);
  const gift = (x, w, h, fill, ribbon) => { shape('rect', { x, y: 388 - h, width: w, height: h, fill }, g); shape('rect', { x: x + w / 2 - 3, y: 388 - h, width: 6, height: h, fill: ribbon }, g); shape('rect', { x: x - 2, y: 382 - h, width: w + 4, height: 8, fill }, g); };
  gift(0, 30, 30, '#3f6653', '#e0b04f'); gift(266, 32, 40, '#b5443c', '#f6ecd6'); gift(272, 22, 18, '#e0b04f', '#b5443c');
  holly(g, 40, 380, .45); holly(g, 262, 380, .42);
  shape('path', { d: 'M0 392C40 376 90 382 130 388S220 374 300 390V400H0Z', fill: '#f6f3ea' }, g);
}
// The lights under the eaves: warm bulbs on a dark wire, a little red and green among them.
function bulbs(g) {
  shape('path', { d: 'M18 100Q84 118 150 104T282 100', fill: 'none', stroke: '#3b3238', 'stroke-width': 2 }, g);
  [[40, 106, '#ffe4a3'], [74, 112, '#f2a08f'], [108, 110, '#ffe4a3'], [150, 104, '#9fd0a8'], [192, 108, '#ffe4a3'], [226, 112, '#f2a08f'], [260, 104, '#ffe4a3']].forEach(([x, y, fill]) => { shape('circle', { cx: x, cy: y + 7, r: 10, fill: '#ffd98a', opacity: .2 }, g); shape('rect', { x: x - 2.5, y: y - 1, width: 5, height: 4, fill: '#4b4048' }, g); shape('ellipse', { cx: x, cy: y + 7, rx: 4.2, ry: 6, fill }, g); });
}
// The calendar, 220 × 270, hung on two twine cords from the hooks, clipped at its corners with wooden pegs: a kraft board,
// a band for its name, a cream panel the doors are set in.
function board(g) {
  shape('path', { d: 'M36 0L24 40M184 0L196 40', fill: 'none', stroke: '#d8c29a', 'stroke-width': 2.6 }, g);
  shape('rect', { x: 6, y: 36, width: 208, height: 230, rx: 8, fill: '#c9a46a' }, g);
  shape('rect', { x: 14, y: 72, width: 192, height: 186, rx: 4, fill: '#f6ecd6' }, g);
  for (const x of [24, 196]) { shape('rect', { x: x - 5, y: 30, width: 10, height: 22, rx: 2, fill: '#a8774d' }, g); shape('path', { d: `M${x} 32V50`, stroke: '#6b4430', 'stroke-width': 1.4 }, g); }
}
// A warm light behind the calendar, there when it is pointed at.
const glow = g => { for (const [rx, ry, opacity] of [[140, 150, .16], [100, 110, .18]]) shape('ellipse', { cx: 150, cy: 232, rx, ry, fill: '#ffd98a', opacity }, g); };

export function mountAdvent(stand, { sound = null, onLift = () => {} } = {}) {
  const events = new AbortController(), on = (node, type, handler) => node.addEventListener(type, handler, { signal: events.signal }), still = matchMedia('(prefers-reduced-motion: reduce)');
  const timers = new Set(), later = (ms, fn) => { const id = setTimeout(() => { timers.delete(id); fn(); }, ms); timers.add(id); };
  paperLayer(stand, '0 0 300 400', 'cal-glow', glow, { paper: null, eager: true });
  paperLayer(stand, '0 0 300 400', 'cal-booth', booth, PAPER);
  paperLayer(stand, '0 0 300 400', 'cal-bulbs', bulbs, { paper: null, eager: true });
  // Lifted off its cords to the middle of the page (the outermost layer); it sways on its strings (css) and a door opened
  // bobs it (the inner ones), so none of the three fight.
  const zoom = element('div', 'cal-zoom', stand), hang = element('div', 'cal-hang', zoom), bob = element('div', 'cal-bob', hang);
  paperLayer(bob, '0 0 220 270', 'cal-board', board, PAPER);
  element('p', 'cal-title', bob, ADVENT.title).lang = 'en';
  const grid = element('div', 'cal-doors', bob), opened = read();
  Array.from({ length: DAYS }, (_, i) => {
    const day = i + 1, door = element('button', 'cal-door', grid); door.type = 'button'; door.dataset.day = day;
    element('i', '', element('span', 'cal-inside', door)).style.backgroundImage = adventPicture(ADVENT.art[i]);
    const leaf = element('span', 'cal-leaf', door);
    element('span', 'cal-face', leaf, String(day)).dataset.tone = TONES[(i + Math.floor(i / 6)) % TONES.length];
    element('span', 'cal-back', leaf);
    const label = () => door.setAttribute('aria-label', opened.has(day) ? ADVENT.opened(day) : ADVENT.door(day));
    door.classList.toggle('is-open', opened.has(day)); label();
    on(door, 'click', () => {
      const first = !opened.has(day);
      if (first) { opened.add(day); write(opened); door.classList.add('is-open'); label(); sound?.play('open'); if (!still.matches) bob.animate([{ rotate: '0deg' }, { rotate: '2.2deg' }, { rotate: '-1.4deg' }, { rotate: '.6deg' }, { rotate: '0deg' }], { duration: 1100, easing: 'ease-out' }); }
      else sound?.play('pick');
      later(first && !still.matches ? 450 : 0, () => show(day, door));
    });
  });

  // On the stand the doors are out of reach; the calendar itself is the button that lifts it to the middle of the page.
  grid.inert = true;
  const lift = element('button', 'cal-lift', stand); lift.type = 'button'; lift.setAttribute('aria-label', ADVENT.lift);
  const shut = element('button', 'cal-shut', stand, '✕'); shut.type = 'button'; shut.setAttribute('aria-label', ADVENT.hang); shut.hidden = true;
  let lifted = false;
  // Where it goes: centred in the part of the page in view, as large as fits (its doors then big enough for a finger).
  function place() {
    const page = (stand.closest('.vending') ?? document.body).getBoundingClientRect(), box = stand.getBoundingClientRect();
    const top = Math.max(page.top, 0), bottom = Math.min(page.bottom, innerHeight), from = { left: box.left + zoom.offsetLeft, top: box.top + zoom.offsetTop, width: zoom.offsetWidth, height: zoom.offsetHeight };
    const width = Math.min(page.width * .9, 540, (bottom - top - 96) * 220 / 270), scale = width / from.width, height = from.height * scale;
    const left = page.left + (page.width - width) / 2, y = top + (bottom - top - height) / 2;
    zoom.style.setProperty('--lift', `translate(${left - from.left}px, ${y - from.top}px) scale(${scale})`);
    Object.assign(shut.style, { left: `${left + width - box.left - 22}px`, top: `${y - box.top - 22}px` });
  }
  function liftDown() {
    if (lifted) return; lifted = true; place(); stand.classList.add('is-lifted'); grid.inert = false; lift.hidden = true; shut.hidden = false; onLift(true); sound?.play('whoosh');
    later(still.matches ? 0 : 580, () => (grid.querySelector('.cal-door:not(.is-open)') ?? grid.querySelector('.cal-door')).focus({ preventScroll: true }));
  }
  function hangBack() {
    if (!lifted) return; lifted = false; stand.classList.remove('is-lifted'); grid.inert = true; lift.hidden = false; shut.hidden = true; onLift(false); sound?.play('whoosh');
    lift.focus({ preventScroll: true });
  }
  on(lift, 'click', liftDown); on(shut, 'click', hangBack);
  on(document, 'keydown', event => { if (event.key === 'Escape' && lifted && !note.open) { event.preventDefault(); hangBack(); } });
  on(window, 'resize', () => { if (lifted) place(); });

  // The card: the date, the day's little scene (a tap plays it on), its line, and 收好.
  const note = element('dialog', 'cal-note', stand); note.setAttribute('aria-labelledby', 'cal-date');
  const date = element('p', 'cal-date', note); date.id = 'cal-date';
  const view = element('button', 'cal-scene', note); view.type = 'button';
  const line = element('p', 'cal-line', note), close = element('button', 'cal-close', note, ADVENT.close); close.type = 'button';
  const scenes = new Map();
  let staged = null, rounds = 0, from = null;
  function show(day, door) {
    from = door; date.textContent = ADVENT.date(day); line.textContent = ADVENT.days[day - 1].text; view.setAttribute('aria-label', ADVENT.days[day - 1].play);
    if (!scenes.has(day)) { const host = element('div', 'cal-cut', view); scenes.set(day, { host, ...ADVENT_SCENES[day - 1](host) }); }
    for (const [each, scene] of scenes) scene.host.hidden = each !== day;
    staged = scenes.get(day); rounds = 0; staged.reset();
    if (!note.open) note.showModal();
    close.focus({ preventScroll: true });
    // Its pieces stand up one after another, like a pop-up page, then it plays once.
    const pieces = [...staged.host.children].filter(piece => piece.style.opacity !== '0');
    if (still.matches) { staged.play(0, sound); return; }
    pieces.forEach((piece, i) => piece.animate(i ? [{ opacity: 0, transform: 'perspective(600px) rotateX(78deg)', transformOrigin: '50% 100%' }, { opacity: 1, transform: 'none', transformOrigin: '50% 100%' }] : [{ opacity: 0 }, { opacity: 1 }], { duration: i ? 650 : 400, delay: i * 110, easing: 'cubic-bezier(.2,.8,.3,1.1)', fill: 'backwards' }));
    const current = staged; later(pieces.length * 110 + 650, () => { if (staged === current && note.open) current.play(0, sound); });
  }
  on(view, 'click', () => { if (!staged) return; rounds = (rounds + 1) % staged.steps; if (!rounds && staged.steps > 1) staged.reset(); staged.play(rounds, sound); });
  on(close, 'click', () => note.close());
  on(note, 'close', () => { sound?.play('remove'); from?.focus({ preventScroll: true }); });
  return {
    close: hangBack,
    destroy() { events.abort(); timers.forEach(clearTimeout); if (note.open) note.close(); for (const { host } of scenes.values()) host.getAnimations({ subtree: true }).forEach(animation => animation.cancel()); stand.replaceChildren(); },
  };
}
