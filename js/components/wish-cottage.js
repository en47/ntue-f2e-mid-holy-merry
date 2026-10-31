// The cottage is alive: smoke drifts with the wind, and its door opens on a random visitor.
import { paperLayer, shape } from './paper-art.js';
import { SNOW, star } from './paper-props.js';

const PAPER = { scale: .7, grain: .45, shadow: .2 }, STAY = 2800, STEP = 280, SKIN = '#f2cda9', INK = '#3b2a22';
const eyes = (parent, y, gap = 12, x = 60) => { for (const side of [-1, 1]) shape('circle', { cx: x + side * gap, cy: y, r: 3.4, fill: INK }, parent); };
const path = (parent, d, fill) => shape('path', { d, fill }, parent);

// Every guest stands on y=158 in a 120×160 sheet, so they all meet the doorstep.
const GUESTS = [
  ['聖誕老人', parent => {
    path(parent, 'M22 158C18 110 34 84 60 84 86 84 102 110 98 158Z', '#a84a42');
    shape('rect', { x: 26, y: 122, width: 68, height: 11, fill: '#54392a' }, parent);
    path(parent, 'M30 52C30 16 62 4 88 26L100 44C92 42 90 46 88 52Z', '#a84a42');
    shape('circle', { cx: 100, cy: 46, r: 8, fill: SNOW }, parent);
    shape('circle', { cx: 60, cy: 56, r: 26, fill: SKIN }, parent);
    path(parent, 'M30 56C30 100 46 112 60 114 74 112 90 100 90 56 80 72 70 72 60 70 50 72 40 72 30 56Z', SNOW);
    path(parent, 'M26 44C44 34 76 34 94 44 96 54 90 56 84 54 68 48 52 48 36 54 30 56 24 52 26 44Z', SNOW);
    eyes(parent, 58, 11); shape('circle', { cx: 60, cy: 66, r: 5, fill: '#e29a84' }, parent);
  }],
  ['麋鹿', parent => {
    path(parent, 'M34 158C30 118 40 92 60 92 80 92 90 118 86 158Z', '#a9764f');
    path(parent, 'M42 44C38 30 28 26 20 12M34 30C28 30 22 32 16 34M78 44C82 30 92 26 100 12M86 30C92 30 98 32 104 34', 'none').setAttribute('stroke', '#6d4f3a');
    parent.lastChild.setAttribute('stroke-width', 6); parent.lastChild.setAttribute('stroke-linecap', 'round');
    path(parent, 'M34 54C14 46 12 62 30 66ZM86 54C106 46 108 62 90 66Z', '#8f6242');
    path(parent, 'M32 60C30 34 90 34 88 60 90 88 74 104 60 104 46 104 30 88 32 60Z', '#b98a5e');
    path(parent, 'M44 84C44 72 76 72 76 84 76 100 44 100 44 84Z', '#ecd3b0');
    eyes(parent, 62, 14); shape('circle', { cx: 60, cy: 78, r: 7, fill: '#b5443c' }, parent);
    path(parent, 'M36 112C50 120 70 120 84 112L86 122C70 130 50 130 34 122Z', '#a84a42');
  }],
  ['小精靈', parent => {
    path(parent, 'M30 158C28 116 38 94 60 94 82 94 92 116 90 158Z', '#4f7d68');
    shape('rect', { x: 34, y: 124, width: 52, height: 8, fill: '#54392a' }, parent);
    path(parent, 'M30 66C10 56 8 72 28 78ZM90 66C110 56 112 72 92 78Z', SKIN);
    shape('circle', { cx: 60, cy: 68, r: 30, fill: SKIN }, parent);
    path(parent, 'M28 58C32 28 58 10 104 6 90 22 92 40 92 58Z', '#a84a42');
    shape('rect', { x: 26, y: 50, width: 68, height: 13, rx: 6, fill: SNOW }, parent);
    shape('circle', { cx: 104, cy: 8, r: 6, fill: '#e0b04f' }, parent);
    eyes(parent, 72, 11); path(parent, 'M50 84C54 90 66 90 70 84Z', '#a84a42');
  }],
  ['雪人', parent => {
    shape('circle', { cx: 60, cy: 118, r: 40, fill: SNOW }, parent);
    shape('circle', { cx: 60, cy: 58, r: 28, fill: SNOW }, parent);
    shape('rect', { x: 36, y: 30, width: 48, height: 6, rx: 3, fill: '#3f4d5a' }, parent);
    shape('rect', { x: 44, y: 6, width: 32, height: 28, rx: 3, fill: '#3f4d5a' }, parent);
    shape('rect', { x: 44, y: 22, width: 32, height: 6, fill: '#a84a42' }, parent);
    eyes(parent, 54, 10); path(parent, 'M60 60L82 66 60 68Z', '#d9823f');
    path(parent, 'M30 82C50 92 70 92 90 82L92 92C84 96 82 96 82 112L70 112 70 98C60 100 46 98 30 92Z', '#4f7d68');
    for (const y of [112, 130]) shape('circle', { cx: 60, cy: y, r: 3.6, fill: INK }, parent);
  }],
  ['薑餅人', parent => {
    path(parent, 'M60 14C80 14 90 30 86 48 104 56 116 68 110 80 104 90 92 84 82 78L84 104 104 140C110 152 96 160 86 152L60 124 34 152C24 160 10 152 16 140L36 104 38 78C28 84 16 90 10 80 4 68 16 56 34 48 30 30 40 14 60 14Z', '#b5824f');
    eyes(parent, 38, 10); path(parent, 'M50 48C54 54 66 54 70 48', 'none').setAttribute('stroke', '#fbf3e3');
    parent.lastChild.setAttribute('stroke-width', 3);
    for (const y of [72, 90]) shape('circle', { cx: 60, cy: y, r: 4.5, fill: '#a84a42' }, parent);
    star(parent, 60, 108, 6, '#fbf3e3');
  }],
];

export function mountCottage(room) {
  const house = room.querySelector('.night-cottage');
  const smoke = document.createElement('div'); smoke.className = 'cottage-smoke'; smoke.setAttribute('aria-hidden', 'true');
  const puff = paperLayer(smoke, '0 0 100 70', 'smoke-puff', parent => shape('path', { d: 'M18 58C2 56 2 36 18 34 18 14 44 8 52 24 66 10 90 20 86 38 98 42 96 58 84 58Z', fill: '#eef2f6' }, parent), { paper: { scale: .6, grain: .3, shadow: 0, rim: '#ffffff' }, eager: true });
  for (let index = 1; index < 3; index++) smoke.append(puff.cloneNode(true));
  [...smoke.children].forEach((layer, index) => { layer.style.animationDelay = `${index * 1.7}s`; });
  const door = document.createElement('button'); door.type = 'button'; door.className = 'cottage-door'; door.setAttribute('aria-label', '敲敲小屋的門，看看誰在家');
  paperLayer(door, '0 0 70 150', 'door-leaf', parent => {
    path(parent, 'M6 148V46C6 2 64 2 64 46V148Z', '#6b4a3c');
    path(parent, 'M16 68H54M16 106H54', 'none').setAttribute('stroke', '#54392f');
    parent.lastChild.setAttribute('stroke-width', 4);
    shape('circle', { cx: 54, cy: 92, r: 5, fill: '#efbe62' }, parent);
    shape('path', { d: 'M22 40C30 28 40 28 48 40', stroke: '#5f8a70', 'stroke-width': 6, fill: 'none' }, parent);
    shape('circle', { cx: 35, cy: 36, r: 4, fill: '#b5544c' }, parent);
  }, { paper: PAPER, eager: true });
  const guest = document.createElement('div'); guest.className = 'cottage-guest'; guest.setAttribute('aria-hidden', 'true');
  const status = document.createElement('p'); status.className = 'sr-only'; status.setAttribute('role', 'status');
  house.append(smoke, guest, door); room.append(status);
  const timers = new Set(), later = (ms, fn) => timers.add(setTimeout(fn, ms));
  let busy = false, lastGuest = -1;
  door.addEventListener('click', () => {
    if (busy) return; busy = true;
    let index = Math.floor(Math.random() * GUESTS.length);
    if (index === lastGuest) index = (index + 1) % GUESTS.length;
    lastGuest = index;
    const [name, draw] = GUESTS[index];
    guest.replaceChildren(); paperLayer(guest, '-8 0 136 170', '', draw, { paper: PAPER, eager: true });
    status.textContent = `${name}來打招呼了。`;
    house.classList.add('door-open');
    later(STEP, () => guest.classList.add('is-out'));
    later(STEP + STAY, () => guest.classList.remove('is-out'));            // Back through the door first…
    later(STEP * 3 + STAY, () => house.classList.remove('door-open'));     // …then it swings shut behind them.
    later(STEP * 5 + STAY, () => { busy = false; });
  });
  return { destroy() { timers.forEach(clearTimeout); } };
}
