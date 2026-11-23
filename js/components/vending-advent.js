// The advent calendar on its stand beside the vending machine: a little paper booth with snow on its roof and a few lights
// under the eaves, the calendar hung from its crossbar on two strings and swaying ever so slightly. Any of its twenty-four
// doors may be opened (this page keeps no story date). Opened, a door swings back on its hinge to show a little picture,
// the calendar bobs on its strings, and a card comes up with that day's paper scene (cabin-advent-scenes.js; a tap plays
// it on a step) and one line. Doors opened stay open in this browser; an open one tapped again shows its card again.
import { holly, paperLayer, shape } from './paper-art.js';
import { adventPicture } from './cabin-clue-art.js';
import { ADVENT_SCENES } from './cabin-advent-scenes.js';
import { ADVENT } from '../data/vending.js';

const KEY = 'holy-merry:vending:advent', DAYS = 24, TONES = ['red', 'green', 'gold', 'kraft'];
const PAPER = { paper: { scale: .5, grain: .45, shadow: .26 }, eager: true };
const element = (tag, className, parent, text) => { const node = document.createElement(tag); node.className = className; if (text) node.textContent = text; parent?.append(node); return node; };
const read = () => { try { const days = JSON.parse(localStorage.getItem(KEY)); return new Set(Array.isArray(days) ? days.filter(day => Number.isInteger(day) && day >= 1 && day <= DAYS) : []); } catch { return new Set(); } };
const write = days => { try { localStorage.setItem(KEY, JSON.stringify([...days].sort((a, b) => a - b))); } catch { /* open for this visit */ } };

// The booth, 300 × 400: two posts in the snow, a crossbar with two hooks, a little roof with snow and holly on top.
function booth(g) {
  for (const x of [34, 252]) { shape('path', { d: `M${x} 96H${x + 14}L${x + 15} 384H${x - 1}Z`, fill: '#8a5a3c' }, g); shape('path', { d: `M${x + 9} 96H${x + 14}L${x + 15} 384H${x + 10}Z`, fill: '#6b4430' }, g); }
  shape('rect', { x: 22, y: 88, width: 256, height: 12, rx: 3, fill: '#a8774d' }, g);
  for (const x of [76, 224]) shape('path', { d: `M${x} 100V108Q${x} 114 ${x + 5} 112`, fill: 'none', stroke: '#3b2a24', 'stroke-width': 3, 'stroke-linecap': 'round' }, g);
  shape('path', { d: 'M6 86L150 18L294 86H270L150 32L30 86Z', fill: '#8f3530' }, g);
  shape('path', { d: 'M30 86L150 32L270 86Z', fill: '#a8423b' }, g);
  shape('path', { d: 'M2 84C20 70 40 76 58 66S96 50 112 44 140 26 150 16 172 28 190 40 230 56 250 66 284 72 298 84 280 80 266 76 250 80 230 70 210 72 190 58 170 50 150 40 130 50 110 58 92 70 72 74 52 78 34 76L20 82Z', fill: '#f8f5ee' }, g);
  holly(g, 150, 22, .5);
  shape('path', { d: 'M8 392C40 374 90 380 130 386S220 372 292 390V400H8Z', fill: '#f6f3ea' }, g);
}
// The lights under the eaves: a few warm bulbs on a dark wire.
function bulbs(g) {
  shape('path', { d: 'M26 90Q88 104 150 92T274 90', fill: 'none', stroke: '#3b3238', 'stroke-width': 2 }, g);
  [[46, 95, '#e0b04f'], [88, 99, '#c63a33'], [130, 96, '#86b07e'], [172, 95, '#e0b04f'], [214, 98, '#c63a33'], [256, 93, '#8fb7cf']].forEach(([x, y, fill]) => { shape('rect', { x: x - 2.5, y: y - 1, width: 5, height: 4, fill: '#4b4048' }, g); shape('ellipse', { cx: x, cy: y + 7, rx: 4.5, ry: 6.5, fill }, g); });
}
// The calendar, 220 × 270, hung on two strings from the hooks: a kraft board, a band for its name, a cream panel the
// doors are set in.
function board(g) {
  shape('path', { d: 'M36 0L22 42M184 0L198 42', fill: 'none', stroke: '#e9dcc2', 'stroke-width': 2.4 }, g);
  shape('rect', { x: 6, y: 36, width: 208, height: 230, rx: 8, fill: '#c9a46a' }, g);
  shape('rect', { x: 14, y: 72, width: 192, height: 186, rx: 4, fill: '#f6ecd6' }, g);
  for (const x of [22, 198]) shape('circle', { cx: x, cy: 44, r: 4, fill: '#7a5236' }, g);
}

export function mountAdvent(stand, { sound = null } = {}) {
  const events = new AbortController(), on = (node, type, handler) => node.addEventListener(type, handler, { signal: events.signal }), still = matchMedia('(prefers-reduced-motion: reduce)');
  const timers = new Set(), later = (ms, fn) => { const id = setTimeout(() => { timers.delete(id); fn(); }, ms); timers.add(id); };
  paperLayer(stand, '0 0 300 400', 'cal-booth', booth, PAPER);
  paperLayer(stand, '0 0 300 400', 'cal-bulbs', bulbs, { paper: null, eager: true });
  // It sways on its strings (the outer layer, css); a door opened bobs it (the inner one), so the two never fight.
  const hang = element('div', 'cal-hang', stand), bob = element('div', 'cal-bob', hang);
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
    destroy() { events.abort(); timers.forEach(clearTimeout); if (note.open) note.close(); for (const { host } of scenes.values()) host.getAnimations({ subtree: true }).forEach(animation => animation.cancel()); stand.replaceChildren(); },
  };
}
