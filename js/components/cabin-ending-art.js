// What the endings' paper theatre is cut from (cabin-ending.js stands it up and moves it). Units are the scene's: its box
// is 600 × 600, and the big sheets run 40 past every edge so the slow drift never shows a gap. Every piece is drawn once
// with the site's paper filter; only its layer moves (cabin's own styles in santa.css say how and when).
import { holly, paperLayer, shape } from './paper-art.js';
import { balloon } from './cabin-finale.js';
import { flakeDot } from './cabin-backdrop.js';
import { WISHES } from '../data/cabin-finale.js';
import { cloud, facetedPeak, snowyFir, star, SNOW } from './paper-props.js';

const SHEET = { scale: 1, grain: .4, shadow: .18 }, PIECE = { scale: .5, grain: .4, shadow: .22 }, SMALL = { scale: .3, grain: .35, shadow: .24 };
const RED = '#b5443c', DARK_RED = '#a8423b', GREEN = '#4f7d68', DEEP = '#3f6653', GOLD = '#e0b04f', LIT = '#f6d98c', TIMBER = '#6b4a33', SKIN = '#f2c9a8', INK = '#2b1d16', BOOT = '#2f2622';
const element = (className, parent) => { const node = document.createElement('div'); node.className = className; parent.append(node); return node; };
const group = (parent, x, y, s = 1, flip = false) => shape('g', { transform: `translate(${x} ${y}) scale(${flip ? -s : s} ${s})` }, parent);
const noise = index => { const value = Math.sin(index * 12.9898) * 43758.5453; return value - Math.floor(value); };

// One depth of the diorama: it stands up from the bottom like a pop-up page, then drifts a little as the scene goes on.
export function depth(scene, level, pop) {
  const node = element('theatre-depth', scene); node.dataset.depth = level;
  node.style.setProperty('--depth', level); node.style.setProperty('--pop', `${pop}s`);
  return node;
}
// A whole sheet across the box, or a small piece cut to its own box [x, y, w, h] and placed there (`origin`: its pivot).
export const sheet = (host, className, draw, paper = SHEET) => paperLayer(host, '-40 -40 680 680', `theatre-sheet ${className}`, draw, { paper, eager: true });
export function piece(host, [x, y, w, h], className, draw, { paper = PIECE, origin } = {}) {
  const layer = paperLayer(host, `${x} ${y} ${w} ${h}`, `theatre-piece ${className}`, draw, { paper, eager: true, origin: origin && [origin[0] - x, origin[1] - y] });
  Object.assign(layer.style, { left: `${x / 6}%`, top: `${y / 6}%`, width: `${w / 6}%`, height: `${h / 6}%` });
  return layer;
}
// Something that travels (`className` says where to), holding pieces drawn where it starts.
export const mover = (host, className) => element(`theatre-move ${className}`, host);

// The frame the diorama stands in: cream card with a rounded window and a sprig of holly at one corner.
export function frame(scene) {
  sheet(scene, 'theatre-frame', paper => {
    shape('path', { d: 'M-40-40H640V640H-40ZM30 14Q300 9 570 14Q587 15 587 32Q591 300 587 568Q586 585 569 586Q300 591 31 586Q14 586 13 569Q9 300 13 32Q14 15 30 14Z', fill: '#fbf3df', 'fill-rule': 'evenodd' }, paper);
    holly(paper, 34, 30, .5);
  }, { scale: 1, grain: .45, shadow: .3 });
}

// Snow falling through the scene: round paper dots, one cut and copied, each drifting down at its own pace.
export function snow(scene, count = 22) {
  const host = element('theatre-snow', scene), dot = flakeDot();
  for (let i = 0; i < count; i++) {
    const flake = element('theatre-flake', host); flake.append(dot.cloneNode(true));
    flake.style.left = `${(i * 37 + 11) % 100}%`; flake.style.setProperty('--size', `${.9 + noise(i) * .9}%`);
    flake.style.animationDuration = `${9 + noise(i + 7) * 7}s`; flake.style.animationDelay = `${-noise(i + 3) * 16}s`;
  }
  return host;
}
// A six-armed paper snowflake, only ever a few, big and in front.
export function snowflake(host, [x, y, size], className) {
  return piece(host, [x - size, y - size, size * 2, size * 2], `theatre-accent ${className}`, paper => {
    const g = group(paper, x, y, size / 40);
    for (let i = 0; i < 6; i++) {
      const arm = shape('g', { transform: `rotate(${i * 60})` }, g);
      shape('path', { d: 'M-2.6 0V-34Q0-38 2.6-34V0Z', fill: '#fffdf6' }, arm);
      for (const [y0, l] of [[-14, 10], [-24, 7]]) shape('path', { d: `M0 ${y0}L${-l} ${y0 - l * .8}L${-l + 2.6} ${y0 - l * .8 - 2}L0 ${y0 - 3.4}L${l - 2.6} ${y0 - l * .8 - 2}L${l} ${y0 - l * .8}Z`, fill: '#fffdf6' }, arm);
    }
    shape('circle', { cx: 0, cy: 0, r: 7, fill: '#fffdf6' }, g);
  }, { paper: { scale: .4, grain: .3, shadow: .25, rim: '#dfe8ee' } });
}

// The visitor, as on the loading screen: red coat, green scarf, red hat with its bobble, a lantern. Drawn facing right in
// a 50 × 80 box with the feet at (25, 80); `flip` turns them to walk the other way.
// The other substitutes are drawn the same way in their own colour (`coat`), with no lantern.
const visitorBody = ({ coat = '#a84a42', scarf = GREEN, tail = DEEP, lantern = true } = {}) => g => {
  shape('path', { d: 'M31 36C35 39 37 42 38 45L35 47C34 44 32 42 29 40Z', fill: coat }, g);
  shape('path', { d: 'M14 59C12 44 14 34 25 32 36 34 38 44 36 59Z', fill: coat }, g);
  shape('rect', { x: 13, y: 55, width: 24, height: 5, rx: 2, fill: SNOW }, g);
  shape('path', { d: 'M17 33C22 36 28 36 33 33V37C28 40 22 40 17 37Z', fill: scarf }, g);
  shape('path', { d: 'M28 37L32 49H27L25 38Z', fill: tail }, g);
  shape('circle', { cx: 25, cy: 24, r: 9, fill: SKIN }, g);
  shape('circle', { cx: 29, cy: 23, r: 1.2, fill: INK }, g); shape('circle', { cx: 30, cy: 27, r: 1.8, fill: '#e9a08f' }, g);
  shape('path', { d: 'M15 21C15 11 25 7 32 11 36 14 38 18 38 21Z', fill: coat }, g);
  shape('rect', { x: 14, y: 19, width: 25, height: 4, rx: 2, fill: SNOW }, g); shape('circle', { cx: 17, cy: 11, r: 3.4, fill: SNOW }, g);
  shape('circle', { cx: 37.5, cy: 46, r: 2.6, fill: scarf }, g);
  if (!lantern) return;
  // The lantern, in a green mitten.
  shape('path', { d: 'M37.5 47V50', stroke: '#3b2a24', 'stroke-width': 1.4 }, g);
  shape('path', { d: 'M33 52L37.5 49.5 42 52Z', fill: '#3b2a24' }, g);
  shape('rect', { x: 33.5, y: 52, width: 8, height: 10, rx: 2, fill: '#ffe3a0', stroke: '#3b2a24', 'stroke-width': 1.3 }, g);
  shape('rect', { x: 32.6, y: 62, width: 9.8, height: 2.4, rx: 1, fill: '#3b2a24' }, g);
};
const visitorLeg = x => g => {
  shape('rect', { x, y: 57, width: 7, height: 15, rx: 2, fill: '#3f5a6e' }, g);
  shape('path', { d: `M${x - .5} 71H${x + 7.5}V77Q${x + 11} 77 ${x + 11} 79.4V80H${x - .5}Z`, fill: BOOT }, g);
};
// Placed with the feet at (x, y), `s` times the loading screen's size.
export function visitor(host, x, y, s, flip = false, className = '', look) {
  const box = [x - 26 * s, y - 84 * s, 52 * s, 88 * s], draw = fn => paper => fn(group(paper, x - (flip ? -25 : 25) * s, y - 80 * s, s, flip));
  const hip = [x, y - 22 * s];
  piece(host, box, `theatre-leg is-back ${className}`, draw(visitorLeg(25)), { paper: SMALL, origin: hip });
  piece(host, box, `theatre-body ${className}`, draw(visitorBody(look)), { paper: SMALL });
  piece(host, box, `theatre-leg ${className}`, draw(visitorLeg(18)), { paper: SMALL, origin: hip });
}

// Santa standing, facing out: drawn in a 60 × 100 box, feet at (30, 100). His right arm (on the left of the picture)
// rests; the other is a piece of its own so it can wave, pivoting at the shoulder.
function santaBody(g) {
  shape('path', { d: 'M14 93H27V100H12Q11 96 14 93Z', fill: BOOT }, g); shape('path', { d: 'M33 93H46Q49 96 48 100H33Z', fill: BOOT }, g);
  shape('path', { d: 'M17 80H43L45 94H33L30 87 27 94H15Z', fill: DARK_RED }, g);
  shape('path', { d: 'M13 84C11 64 14 48 22 41H38C46 48 49 64 47 84Z', fill: RED }, g);
  shape('path', { d: 'M11.5 79.5Q30 77 48.5 79.5L48.5 86Q30 84 11.5 86Z', fill: SNOW }, g);
  shape('rect', { x: 27.5, y: 42, width: 5, height: 38, fill: SNOW }, g);
  shape('rect', { x: 12.6, y: 61, width: 34.8, height: 6, fill: BOOT }, g);
  shape('rect', { x: 26, y: 60, width: 8, height: 8, rx: 1.5, fill: 'none', stroke: GOLD, 'stroke-width': 2 }, g);
  shape('path', { d: 'M22 43C15 47 12 58 13 70L19.5 71C19.5 61 21 53 25.5 48Z', fill: DARK_RED }, g);
  shape('rect', { x: 11.5, y: 68, width: 9, height: 4.4, rx: 1.8, fill: SNOW }, g); shape('circle', { cx: 16, cy: 75.5, r: 4, fill: DEEP }, g);
  shape('circle', { cx: 30, cy: 30, r: 9.5, fill: SKIN }, g);
  shape('path', { d: 'M19 28C18 40 23 52 30 56 37 52 42 40 41 28 38 34 34 36.5 30 36.5 26 36.5 22 34 19 28Z', fill: SNOW }, g);
  shape('path', { d: 'M23 35.5C26 32.5 29 33 30 35 31 33 34 32.5 37 35.5 34 38.5 31 37.5 30 36.5 29 37.5 26 38.5 23 35.5Z', fill: '#ece6da' }, g);
  shape('circle', { cx: 30, cy: 32, r: 2, fill: '#e9a08f' }, g);
  shape('circle', { cx: 26.6, cy: 28.4, r: 1.15, fill: INK }, g); shape('circle', { cx: 33.4, cy: 28.4, r: 1.15, fill: INK }, g);
  shape('path', { d: 'M19.5 24C19 14 26 9.5 34 10.5 42 11.5 47.5 17 49.5 25L45.5 26.5C44 22 41.5 19.5 39 19 40.5 21 41 22.5 41 24Z', fill: RED }, g);
  shape('rect', { x: 18, y: 21.5, width: 24.4, height: 6, rx: 3, fill: SNOW }, g); shape('circle', { cx: 48.5, cy: 27, r: 3.8, fill: SNOW }, g);
}
function santaArm(g) {
  shape('path', { d: 'M36 43C43 40 48 33 50.5 24L56.5 25.5C55 36 48 46 40 50Z', fill: DARK_RED }, g);
  shape('rect', { x: 49, y: 20, width: 9.6, height: 4.6, rx: 1.8, fill: SNOW, transform: 'rotate(14 53.8 22.3)' }, g);
  shape('circle', { cx: 54.6, cy: 16, r: 4.4, fill: DEEP }, g);
}
export function santa(host, x, y, s, className = '') {
  const box = [x - 34 * s, y - 104 * s, 68 * s, 108 * s], draw = fn => paper => fn(group(paper, x - 30 * s, y - 100 * s, s));
  piece(host, box, `theatre-santa ${className}`, draw(santaBody), { paper: SMALL });
  piece(host, [x - 30 * s, y - 100 * s, 60 * s, 60 * s], `theatre-wave ${className}`, paper => santaArm(group(paper, x - 30 * s, y - 100 * s, s)), { paper: SMALL, origin: [x + 8 * s, y - 54 * s] });
}

// Santa's cabin from the front, as it stands in the village: plaster and timber, the dark roof deep in snow with a garland
// along its edge, the round window in the gable, the green door open on the warm room. Base at (468, 494).
function cabinFront(g) {
  const cx = 468, base = 494, left = 382, right = 554, eave = 392, peak = 306;
  shape('rect', { x: 516, y: 314, width: 20, height: 54, fill: '#8f6f5b' }, g);
  shape('path', { d: 'M511 318Q526 308 541 318V312Q526 302 511 312Z', fill: SNOW }, g);
  shape('path', { d: `M${left} ${base}V${eave}L${cx} ${peak + 10}L${right} ${eave}V${base}Z`, fill: '#f5eddd' }, g);
  shape('rect', { x: left, y: base - 17, width: right - left, height: 17, fill: '#cdbfae' }, g);
  for (let i = 0; i < 9; i++) shape('rect', { x: left + 3 + i * 19 + (i % 2) * 4, y: base - 14 + (i % 2) * 6, width: 14, height: 6, rx: 3, fill: '#ddd2c3' }, g);
  for (const x of [left, right - 8]) shape('rect', { x, y: eave, width: 8, height: base - 17 - eave, fill: TIMBER }, g);
  shape('rect', { x: left, y: eave - 4, width: right - left, height: 7, fill: TIMBER }, g);
  shape('path', { d: `M${cx} ${peak + 26}L${left + 18} ${eave - 3}M${cx} ${peak + 26}L${right - 18} ${eave - 3}`, stroke: TIMBER, 'stroke-width': 5, fill: 'none' }, g);
  shape('circle', { cx, cy: 356, r: 15, fill: GREEN }, g); shape('circle', { cx, cy: 356, r: 11, fill: LIT }, g);
  shape('path', { d: `M${cx} 345V367M${cx - 11} 356H${cx + 11}`, stroke: GREEN, 'stroke-width': 2.2 }, g);
  // The windows either side of the door, lit, a box of holly under the left one.
  for (const x of [398, 506]) {
    shape('rect', { x: x - 3, y: 409, width: 38, height: 38, rx: 2, fill: GREEN }, g); shape('rect', { x, y: 412, width: 32, height: 32, fill: LIT }, g);
    shape('path', { d: `M${x + 16} 412V444M${x} 428H${x + 32}`, stroke: GREEN, 'stroke-width': 2.6 }, g);
  }
  shape('rect', { x: 393, y: 447, width: 42, height: 8, rx: 2, fill: '#8f5a3c' }, g);
  for (let i = 0; i < 3; i++) holly(g, 401 + i * 13, 448, .2);
  // The doorway, warm light inside, the door swung in.
  shape('rect', { x: 441, y: 405, width: 54, height: base - 405, fill: '#8f5a3c' }, g);
  shape('rect', { x: 446, y: 410, width: 44, height: base - 410, fill: '#f3cf86' }, g);
  shape('rect', { x: 446, y: 470, width: 44, height: base - 470, fill: '#e8b96c' }, g);
  shape('path', { d: `M482 411L490 410V${base}L482 ${base - 4}Z`, fill: DEEP }, g);
  // A garland over the door, three berries.
  for (let i = 0; i <= 8; i++) { const t = i / 8, x = 438 + t * 60, y = 403 + Math.sin(t * Math.PI) * 6; shape('path', { d: 'M0-6C3-4 4-1 3 2 2 4 1 5 0 6-1 5-2 4-3 2-4-1-3-4 0-6Z', fill: i % 2 ? GREEN : DEEP, transform: `translate(${x} ${y}) rotate(${i * 47}) scale(1.2)` }, g); }
  for (const x of [446, 468, 490]) shape('circle', { cx: x, cy: 408 + (x === 468 ? 5 : 1), r: 2.4, fill: RED }, g);
  // The roof, its snow and the garland along the eaves.
  shape('path', { d: `M${left - 26} ${eave + 8}L${cx} ${peak - 6}L${right + 26} ${eave + 8}L${right + 13} ${eave + 12}L${cx} ${peak + 10}L${left - 13} ${eave + 12}Z`, fill: '#4f4440' }, g);
  shape('path', { d: `M${left - 31} ${eave + 5}L${cx} ${peak - 14}L${right + 31} ${eave + 5}Q${right + 24} ${eave + 10} ${right + 17} ${eave + 4}Q${right + 6} ${eave + 2} ${right - 4} ${eave - 6}Q${right - 18} ${eave - 6} ${right - 28} ${eave - 16}L${cx} ${peak + 2}L${left + 28} ${eave - 16}Q${left + 18} ${eave - 6} ${left + 4} ${eave - 6}Q${left - 6} ${eave + 2} ${left - 17} ${eave + 4}Q${left - 24} ${eave + 10} ${left - 31} ${eave + 5}Z`, fill: SNOW }, g);
  for (const [from, to] of [[[left - 20, eave + 12], [cx, peak + 12]], [[cx, peak + 12], [right + 20, eave + 12]]]) {
    for (let i = 0; i <= 12; i++) {
      const t = i / 12, x = from[0] + (to[0] - from[0]) * t, y = from[1] + (to[1] - from[1]) * t + Math.sin(t * Math.PI * 3) * 2.4;
      shape('path', { d: 'M0-6C3-4 4-1 3 2 2 4 1 5 0 6-1 5-2 4-3 2-4-1-3-4 0-6Z', fill: [DEEP, GREEN, '#5f8a70'][i % 3], transform: `translate(${x} ${y}) rotate(${i * 61}) scale(1.15)` }, g);
    }
  }
  for (const [x, y] of [[left - 20, eave + 12], [cx, peak + 12], [right + 20, eave + 12]]) {
    shape('path', { d: `M${x} ${y}c-8-7-14-1-8 3 3 2 7 1 8-3zm0 0c8-7 14-1 8 3-3 2-7 1-8-3z`, fill: '#a84a42' }, g);
    shape('circle', { cx: x, cy: y, r: 2.2, fill: '#87302f' }, g);
  }
  // Snow drifted along the foot of the walls.
  shape('path', { d: `M${left - 18} ${base + 3}C${left - 4} ${base - 12} ${left + 26} ${base - 8} ${left + 40} ${base - 4}S${left + 56} ${base - 2} ${441} ${base}V${base + 6}H${left - 18}Z`, fill: SNOW }, g);
  shape('path', { d: `M495 ${base}C510 ${base - 10} ${right - 10} ${base - 8} ${right + 4} ${base - 3}S${right + 20} ${base} ${right + 24} ${base + 4}V${base + 6}H495Z`, fill: SNOW }, g);
}

// A little house far off: its windows drawn dark, so they can light up as a piece of their own.
function cottage(g, x, base, w, h, roof, windows = DEEP) {
  shape('rect', { x: x - w / 2, y: base - h, width: w, height: h, fill: '#ecdcc0' }, g);
  shape('path', { d: `M${x - w / 2 - 3} ${base - h + 1}L${x} ${base - h - w * .48}L${x + w / 2 + 3} ${base - h + 1}Z`, fill: roof }, g);
  shape('path', { d: `M${x - w / 2 - 3.5} ${base - h + 1}L${x} ${base - h - w * .5}L${x + w / 2 + 3.5} ${base - h + 1}L${x + w / 2} ${base - h + 2}L${x} ${base - h - w * .3}L${x - w / 2} ${base - h + 2}Z`, fill: SNOW }, g);
  cottageWindows(g, x, base, w, h, windows);
}
function cottageWindows(g, x, base, w, h, fill) {
  for (const dx of [-.28, .12]) shape('rect', { x: x + w * dx, y: base - h * .72, width: w * .16, height: h * .3, fill }, g);
}
const HOMES = [[150, 413, 17, 11, '#a8564c'], [174, 415, 22, 14, '#3f6653'], [201, 412, 15, 10, '#8f5a3c'], [222, 414, 13, 9, '#a8564c']];
// The road home: a trodden band through the snow from the cabin's step to the houses far off, narrowing as it goes.
const ROAD = 'M476 506C430 520 372 512 318 494C282 482 258 466 236 448C220 434 206 422 192 414L200 413C214 421 230 431 248 443C272 459 300 474 334 484C380 497 430 500 470 494Z';
// The walk home (santa.css moves the visitor along the same points, `at` being the share of the walk at each): feet at
// [x, y], how big the visitor is there. They slow on the screen as they get further off, at the same pace on the road.
export const WALK = { from: 5, length: 10.5, points: [[436, 506, 1], [370, 498, .86], [305, 478, .68], [252, 452, .5], [215, 428, .36], [196, 414, .27]], at: [0, .16, .36, .59, .83, 1] };
// The footprints left behind, one every so often along the walk: [x, y, size, when it appears].
const PRINTS = Array.from({ length: 18 }, (_, i) => {
  const f = (i + .5) / 18, k = WALK.at.findIndex(share => share > f) - 1, u = (f - WALK.at[k]) / (WALK.at[k + 1] - WALK.at[k]);
  const [x0, y0, s0] = WALK.points[k], [x1, y1, s1] = WALK.points[k + 1], size = s0 + (s1 - s0) * u, side = i % 2 ? 1 : -1;
  return [x0 + (x1 - x0) * u + side * 2.6 * size, y0 + (y1 - y0) * u + side * 2.4 * size, size, WALK.from + f * WALK.length + .2];
});

// Ending A, going home: dusk over the far hills, the cabin with Santa waving from the door, the road home with the
// visitor walking off along it and footprints left behind, a postcard flying out to you, the lights coming on far off.
export function goingHome(scene) {
  const sky = depth(scene, 0, .1), far = depth(scene, 1, .45), mid = depth(scene, 2, .75), near = depth(scene, 3, 1.05);
  sheet(sky, '', paper => {
    shape('rect', { x: -40, y: -40, width: 680, height: 680, fill: '#cfdbe6' }, paper);
    shape('path', { d: 'M-40 170Q120 150 300 168T640 160V640H-40Z', fill: '#dfe1e6' }, paper);
    shape('path', { d: 'M-40 260Q150 240 320 258T640 250V640H-40Z', fill: '#ecdcd6' }, paper);
    shape('path', { d: 'M-40 330Q160 316 330 330T640 322V640H-40Z', fill: '#f5e1c6' }, paper);
    shape('circle', { cx: 212, cy: 384, r: 46, fill: '#fbe9c2' }, paper); shape('circle', { cx: 212, cy: 384, r: 33, fill: '#fdf2d8' }, paper);
    cloud(paper, 470, 116, .5); cloud(paper, 110, 196, .36, '#f7efe8');
  });
  piece(sky, [282, 50, 40, 40], 'a-star', paper => star(paper, 302, 70, 14), { paper: SMALL });
  sheet(far, '', paper => {
    const tones = { cream: '#efe7e2', ice: '#cfdae4', sky: '#aac0d3', dusk: '#8fa8c0' };
    facetedPeak(paper, 40, 262, 420, 150, 140, tones); facetedPeak(paper, 520, 238, 420, 180, 170, tones); facetedPeak(paper, 330, 318, 420, 118, 126, tones);
  });
  sheet(mid, '', paper => {
    shape('path', { d: 'M-40 420C60 406 150 410 230 414C330 418 420 402 640 406V640H-40Z', fill: '#f1efe9' }, paper);
    shape('path', { d: 'M-40 476C100 460 260 486 400 492C500 496 580 484 640 482V640H-40Z', fill: '#fbf8f1' }, paper);
    shape('path', { d: ROAD, fill: '#e2e9ee' }, paper);
    for (const [x, b, h, v] of [[132, 414, 22, 1], [246, 420, 26, 0], [266, 422, 18, 2], [100, 412, 18, 2]]) snowyFir(paper, x, b, h, v);
    for (const home of HOMES) cottage(paper, ...home);
    for (const [x, b, h, v] of [[24, 474, 96, 2], [122, 478, 80, 1], [70, 494, 124, 0], [596, 474, 128, 1]]) snowyFir(paper, x, b, h, v);
    cabinFront(paper);
  });
  // The lights of home coming on, far off along the road.
  piece(mid, [130, 380, 110, 40], 'a-lights', paper => { for (const [x, base, w, h] of HOMES) cottageWindows(paper, x, base, w, h, '#f4cf74'); }, { paper: SMALL });
  for (let i = 0; i < 3; i++) piece(mid, [512, 270, 50, 50], 'a-smoke', paper => { shape('circle', { cx: 530, cy: 300, r: 7, fill: '#f4f1ec' }, paper); }, { paper: SMALL }).style.animationDelay = `${-i * 1.4}s`;
  for (const [x, y, size, at] of PRINTS) piece(mid, [x - 6 * size, y - 4 * size, 12 * size, 8 * size], 'a-print', paper => shape('ellipse', { cx: x, cy: y, rx: 3.6 * size, ry: 1.8 * size, fill: '#c3d3de' }, paper), { paper: { scale: .1, grain: .3, shadow: 0, rim: '#e8eef2' } }).style.setProperty('--at', `${at.toFixed(2)}s`);
  santa(mid, 458, 495, .84);
  visitor(mover(mid, 'a-walker'), ...WALK.points[0].slice(0, 2), .62, true);
  snow(scene);
  sheet(near, '', paper => {
    shape('path', { d: 'M-40 540C80 524 200 546 300 556C400 566 520 542 640 536V640H-40Z', fill: '#e3ebf0' }, paper);
    shape('path', { d: 'M-40 548C80 532 200 554 300 564C400 574 520 550 640 544V640H-40Z', fill: '#fbf8f1' }, paper);
    snowyFir(paper, -8, 640, 290, 1); snowyFir(paper, 622, 640, 236, 2);
  });
  snowflake(near, [536, 92, 30], 'is-slow'); snowflake(near, [72, 150, 22], '');
  // The postcard, flying out from Santa's hand to land in front: the cabin under the evening star, his initial in the corner.
  piece(scene, [36, 462, 176, 120], 'a-postcard', paper => {
    shape('rect', { x: 40, y: 466, width: 168, height: 110, rx: 4, fill: '#fffaf0' }, paper);
    shape('rect', { x: 49, y: 475, width: 150, height: 92, fill: '#3f5a7a' }, paper);
    shape('path', { d: 'M49 545Q100 530 150 540T199 536V567H49Z', fill: '#fbf8f1' }, paper);
    const g = group(paper, 124, 546, .3);
    shape('path', { d: 'M-60 0V-40L0-82 60-40V0Z', fill: '#f5eddd' }, g); shape('path', { d: 'M-74-34L0-96 74-34Z', fill: SNOW }, g);
    shape('rect', { x: -12, y: -34, width: 24, height: 34, fill: '#f3cf86' }, g); shape('rect', { x: -48, y: -32, width: 20, height: 18, fill: LIT }, g); shape('rect', { x: 28, y: -32, width: 20, height: 18, fill: LIT }, g);
    star(paper, 170, 492, 8); for (const [x, y] of [[66, 490], [92, 502], [150, 512], [184, 520]]) shape('circle', { cx: x, cy: y, r: 1.4, fill: '#fbf3df' }, paper);
    holly(paper, 58, 556, .26);
    shape('path', { d: 'M178 561C181 553 187 553 185 559 183 564 177 565 180 560M188 562H189', fill: 'none', stroke: '#fbf3df', 'stroke-width': 1.6, 'stroke-linecap': 'round' }, paper);
  }, { paper: { scale: .5, grain: .4, shadow: .3 } });
  return { length: 16.5, text: 3 };
}

// Each substitute's colour (the ink of their initial everywhere in the village).
export const HANDS = { N: '#8f3b36', K: '#3f5a7a', H: '#3f6653', E: '#6e4a6b', O: '#9a6b2f' };
const TAKEN = ['N', 'K', 'H', 'E', 'O'];
const NIGHT = ['#2c4566', '#35517a', '#46658e', '#5c7aa0'];

// Stars that twinkle, [x, y, size] each.
function twinkle(host, list, fill = '#f3df9e') {
  list.forEach(([x, y, size], i) => { piece(host, [x - size - 3, y - size - 3, size * 2 + 6, size * 2 + 6], 'theatre-twinkle', paper => star(paper, x, y, size, fill), { paper: SMALL }).style.animationDelay = `${-(i * .73) % 3}s`; });
}
// A soft round of light behind something lit: rings of pale paper, fainter outward.
const glow = (paper, x, y, r, fill = '#f8e3a6') => { for (const [k, o] of [[1, .22], [.72, .32], [.46, .45]]) shape('circle', { cx: x, cy: y, r: r * k, fill, opacity: o }, paper); };
// A name tag on its string, with the initial written on it (as text: any letter may be yours). Pivots at the hook.
function nameTag(host, [x, y, w, h], { letter, ink, fill = '#fffaf0', mine = false, className = '' }) {
  const holder = document.createElement('div'); holder.className = `theatre-tag ${className}`;
  Object.assign(holder.style, { left: `${x / 6}%`, top: `${y / 6}%`, width: `${w / 6}%`, height: `${h / 6}%` });
  paperLayer(holder, `0 0 ${w} ${h}`, '', paper => {
    shape('path', { d: `M${w / 2} 0V${h * .3}`, stroke: '#8f6a4c', 'stroke-width': 1.4 }, paper);
    shape('path', { d: `M${w * .22} ${h * .24}H${w * .78}L${w * .94} ${h * .36}V${h * .94}H${w * .06}V${h * .36}Z`, fill }, paper);
    shape('circle', { cx: w / 2, cy: h * .33, r: w * .07, fill: '#8f5a3c' }, paper);
    if (mine) star(paper, w * .8, h * .3, w * .12);
  }, { paper: SMALL, eager: true });
  const words = document.createElement('span'); words.className = 'theatre-tag-letter'; words.textContent = `${letter}.`;
  Object.assign(words.style, { color: ink, fontSize: `${(w / 13).toFixed(2)}cqw` });
  holder.append(words); host.append(holder);
  return holder;
}

// A reindeer flying right, its body centred on (x, y); the leader has the red nose.
function reindeer(g, x, y, nose = '#7a5236') {
  const fur = '#9b6a45', dark = '#7a5236';
  for (const d of [`M${x + 6} ${y + 3}L${x + 15} ${y + 8}`, `M${x + 3} ${y + 4}L${x + 11} ${y + 11}`, `M${x - 6} ${y + 3}L${x - 16} ${y + 6}`, `M${x - 4} ${y + 4}L${x - 13} ${y + 10}`]) shape('path', { d, stroke: dark, 'stroke-width': 2.2, 'stroke-linecap': 'round', fill: 'none' }, g);
  shape('path', { d: `M${x - 11} ${y}C${x - 11} ${y - 6} ${x - 4} ${y - 8} ${x + 4} ${y - 7}C${x + 10} ${y - 6} ${x + 12} ${y - 2} ${x + 11} ${y + 2}C${x + 8} ${y + 6} ${x - 6} ${y + 6} ${x - 11} ${y}Z`, fill: fur }, g);
  shape('path', { d: `M${x - 10} ${y - 3}L${x - 15} ${y - 6}L${x - 13} ${y}Z`, fill: SNOW }, g);
  shape('path', { d: `M${x + 6} ${y - 5}L${x + 12} ${y - 13}C${x + 14} ${y - 16} ${x + 20} ${y - 15} ${x + 21} ${y - 12}L${x + 16} ${y - 8}L${x + 11} ${y - 1}Z`, fill: fur }, g);
  shape('path', { d: `M${x + 13} ${y - 15}L${x + 10} ${y - 22}M${x + 11} ${y - 19}L${x + 7} ${y - 21}M${x + 15} ${y - 15}L${x + 17} ${y - 22}M${x + 16} ${y - 19}L${x + 20} ${y - 21}`, stroke: dark, 'stroke-width': 1.5, 'stroke-linecap': 'round', fill: 'none' }, g);
  shape('circle', { cx: x + 15.5, cy: y - 12.5, r: .9, fill: INK }, g); shape('circle', { cx: x + 21, cy: y - 11.5, r: 1.7, fill: nose }, g);
  shape('path', { d: `M${x + 6} ${y - 4}Q${x + 9} ${y - 1} ${x + 12} ${y - 3}`, stroke: RED, 'stroke-width': 2, fill: 'none' }, g);
  shape('circle', { cx: x + 9, cy: y - 1.4, r: 1.3, fill: GOLD }, g);
}
// The sleigh and its two reindeer, facing right in a 140 × 56 box; the runners meet the snow at (68, 46).
const sleighTeam = ({ rider = true, sacks = false } = {}) => g => {
  shape('path', { d: 'M58 30Q78 26 92 30M58 30Q88 22 114 26', fill: 'none', stroke: '#8f6a4c', 'stroke-width': 1.2 }, g);
  reindeer(g, 90, 33); reindeer(g, 116, 27, RED);
  if (sacks) { shape('path', { d: 'M38 25C36 14 42 8 48 10 54 8 59 14 56 25Z', fill: '#c9a46a' }, g); shape('rect', { x: 46, y: 15, width: 11, height: 10, rx: 1, fill: GREEN }, g); shape('path', { d: 'M51.5 15V25', stroke: GOLD, 'stroke-width': 2 }, g); }
  if (rider) {
    shape('path', { d: 'M22 26C23 20 35 20 36 26Z', fill: '#a84a42' }, g); shape('circle', { cx: 29, cy: 16, r: 5.6, fill: SKIN }, g);
    shape('path', { d: 'M23 14C23 7 30 4 35 7 38 9 39 12 39 15Z', fill: '#a84a42' }, g); shape('rect', { x: 22.5, y: 12.5, width: 14, height: 3, rx: 1.5, fill: SNOW }, g); shape('circle', { cx: 24, cy: 7.5, r: 2.2, fill: SNOW }, g);
  }
  shape('path', { d: 'M6 38C3 28 5 18 12 13H21L24 24H56C62 24 64 31 61 38Z', fill: RED }, g);
  shape('path', { d: 'M12 13C7 12 6 6 10 5 13 4 15 7 13 9', fill: 'none', stroke: '#8a3530', 'stroke-width': 2.4, 'stroke-linecap': 'round' }, g);
  shape('path', { d: 'M8 33H59', stroke: GOLD, 'stroke-width': 1.8 }, g);
  shape('path', { d: 'M2 45H60Q70 45 70 36', fill: 'none', stroke: GOLD, 'stroke-width': 3, 'stroke-linecap': 'round' }, g);
  shape('path', { d: 'M14 44V38M50 44V38', stroke: GOLD, 'stroke-width': 2.4 }, g);
};
function sleigh(host, x, y, s, { flip = false, className = '', ...look } = {}) {
  return piece(host, [x - 72 * s, y - 50 * s, 144 * s, 58 * s], `theatre-sleigh ${className}`, paper => sleighTeam(look)(group(paper, x - (flip ? -68 : 68) * s, y - 46 * s, s, flip)), { paper: SMALL });
}

// What the window shows once the wish is home: the toy sleigh, a big snowflake, the gold star, a letter for someone dear.
const KEEPSAKE = {
  sleigh: g => sleighTeam({ rider: false })(group(g, -42, -17, .6)),
  snow: g => { for (let i = 0; i < 6; i++) { const arm = shape('g', { transform: `rotate(${i * 60})` }, g); shape('path', { d: 'M-2 0V-22Q0-25 2-22V0Z', fill: '#fffdf6' }, arm); shape('path', { d: 'M0-11L-6-17-4.4-18.4 0-14.4 4.4-18.4 6-17Z', fill: '#fffdf6' }, arm); } shape('circle', { cx: 0, cy: 0, r: 5, fill: '#fffdf6' }, g); },
  gift: g => { star(g, 0, 0, 22); shape('circle', { cx: 0, cy: 1, r: 8, fill: '#fff6dc' }, g); shape('path', { d: 'M0-30V-22', stroke: GOLD, 'stroke-width': 1.4 }, g); },
  blessing: g => { shape('rect', { x: -22, y: -14, width: 44, height: 30, rx: 2, fill: '#fffaf0' }, g); shape('path', { d: 'M-22-14L0 4 22-14', fill: 'none', stroke: '#c9b48f', 'stroke-width': 1.6 }, g); shape('path', { d: 'M0 7C-6 2-6-3-2-3-1-3 0-2 0-1 0-2 1-3 2-3 6-3 6 2 0 7Z', fill: RED }, g); },
};
// The flight from the North Pole to the house (santa.css flies the sleigh along the same points): [x, y, size].
export const FLIGHT = { from: 2.6, length: 8.2, points: [[525, 262, .3], [480, 215, .42], [420, 195, .55], [360, 205, .68], [318, 240, .78], [300, 262, .82]] };
const HOUSE = { x: 175, base: 500, width: 200, wall: 96, window: [130, 418, 90, 66] };

// Ending B, the wish taken home: night, the North Pole far off on the right with its striped pole, your house in the snow
// in front; the sleigh flies you home along a trail of little gold stars, and the window lights up with what you wished
// for. A note from whoever granted it is pinned to the door. (A snow wish brings a real snowfall; a blessing, a balloon.)
export function wishGranted(scene, { wish }) {
  const sky = depth(scene, 0, .1), far = depth(scene, 1, .45), mid = depth(scene, 2, .75), near = depth(scene, 3, 1.05), given = wish in KEEPSAKE ? wish : 'gift';
  sheet(sky, '', paper => {
    shape('rect', { x: -40, y: -40, width: 680, height: 680, fill: NIGHT[0] }, paper);
    NIGHT.slice(1).forEach((fill, i) => shape('path', { d: `M-40 ${200 + i * 70}Q140 ${186 + i * 70} 320 ${198 + i * 70}T640 ${192 + i * 70}V640H-40Z`, fill }, paper));
    shape('circle', { cx: 112, cy: 104, r: 26, fill: '#fbf3df' }, paper); shape('circle', { cx: 123, cy: 96, r: 22, fill: NIGHT[0] }, paper);
  });
  twinkle(sky, [[60, 60, 4], [200, 40, 3], [262, 110, 4.5], [400, 54, 3.5], [560, 80, 5], [470, 140, 3], [30, 180, 3], [590, 190, 3.5], [180, 190, 2.6]]);
  sheet(far, '', paper => {
    shape('path', { d: 'M-40 392Q80 352 200 380T420 364Q520 346 640 372V640H-40Z', fill: '#9fb4cb' }, paper);
    shape('path', { d: 'M420 382Q480 320 560 326Q610 330 640 350V640H420Z', fill: '#e6eef3' }, paper);
    // The North Pole: its striped pole and star, a workshop or two with the lights on.
    for (let i = 0; i < 6; i++) shape('rect', { x: 522, y: 270 + i * 9, width: 7, height: 9, fill: i % 2 ? '#fbf3df' : RED }, paper);
    star(paper, 525.5, 264, 7); cottage(paper, 568, 340, 26, 16, '#a8564c', '#f4cf74'); cottage(paper, 488, 352, 22, 13, '#3f6653', '#f4cf74');
  });
  // The trail the sleigh leaves, a star at a time, and the sleigh flying you home.
  const { points } = FLIGHT;
  for (let i = 0; i < 16; i++) {
    const f = (i + .5) / 16, k = Math.min(4, Math.floor(f * 5)), u = f * 5 - k, [x0, y0, s0] = points[k], [x1, y1, s1] = points[k + 1];
    const size = 2.2 + (s0 + (s1 - s0) * u) * 3.4, x = x0 + (x1 - x0) * u + 8, y = y0 + (y1 - y0) * u + 6;
    piece(far, [x - size - 3, y - size - 3, size * 2 + 6, size * 2 + 6], 'b-trail', paper => star(paper, x, y, size, '#f3df9e'), { paper: SMALL }).style.setProperty('--at', `${(FLIGHT.from + f * FLIGHT.length + .15).toFixed(2)}s`);
  }
  sheet(mid, '', paper => {
    shape('path', { d: 'M-40 430Q120 410 300 428T640 420V640H-40Z', fill: '#dfe7ee' }, paper);
    for (const [x, b, w, h, roof] of [[330, 444, 38, 24, '#3f6653'], [392, 450, 46, 28, '#a8564c'], [462, 446, 36, 22, '#8f5a3c'], [540, 452, 44, 26, '#3f6653']]) cottage(paper, x, b, w, h, roof, '#f4cf74');
    for (const [x, b, h, v] of [[300, 450, 44, 1], [430, 452, 40, 2], [600, 456, 56, 0]]) snowyFir(paper, x, b, h, v);
    shape('path', { d: 'M-40 482Q140 470 320 488T640 480V640H-40Z', fill: '#f1f3f4' }, paper);
    // Your house: cream walls, a red roof deep in snow, the big front window still dark, the door on the right.
    const { x, base, width, wall } = HOUSE, half = width / 2, eave = base - wall, peak = eave - half * .9;
    shape('rect', { x: x + half * .5, y: peak + 18, width: 18, height: 40, fill: '#8f6f5b' }, paper);
    shape('path', { d: `M${x - half} ${base}V${eave}H${x + half}V${base}Z`, fill: '#ecdcc0' }, paper);
    shape('path', { d: `M${x - half - 18} ${eave + 4}L${x} ${peak}L${x + half + 18} ${eave + 4}Z`, fill: '#a8564c' }, paper);
    shape('path', { d: `M${x - half - 22} ${eave + 2}L${x} ${peak - 8}L${x + half + 22} ${eave + 2}Q${x + half + 10} ${eave + 8} ${x + half} ${eave - 2}Q${x + half * .6} ${eave - 4} ${x + half * .4} ${eave - 14}Q${x} ${eave - 6} ${x - half * .4} ${eave - 16}Q${x - half * .7} ${eave - 2} ${x - half - 22} ${eave + 2}Z`, fill: SNOW }, paper);
    const [wx, wy, ww, wh] = HOUSE.window;
    shape('rect', { x: wx - 5, y: wy - 5, width: ww + 10, height: wh + 10, rx: 3, fill: GREEN }, paper); shape('rect', { x: wx, y: wy, width: ww, height: wh, fill: '#34465e' }, paper);
    shape('rect', { x: x + half - 36, y: base - 58, width: 26, height: 58, rx: 3, fill: DEEP }, paper); shape('circle', { cx: x + half - 15, cy: base - 28, r: 2, fill: GOLD }, paper);
    holly(paper, x + half - 23, base - 66, .3);
    shape('path', { d: `M-40 ${base + 6}Q${x - 60} ${base - 14} ${x} ${base + 2}T${x + 200} ${base}Q520 ${base - 6} 640 ${base + 4}V640H-40Z`, fill: SNOW }, paper);
  });
  // The window lit, with the wish in it, and the light spilling round it.
  const [wx, wy, ww, wh] = HOUSE.window, cx = wx + ww / 2, cy = wy + wh / 2;
  piece(mid, [wx - 40, wy - 40, ww + 80, wh + 80], 'b-glow', paper => glow(paper, cx, cy, ww * .78), { paper: { scale: .4, grain: .2, shadow: 0, rim: '#ffffff00' } });
  piece(mid, [wx - 6, wy - 6, ww + 12, wh + 12], 'b-window', paper => {
    shape('rect', { x: wx, y: wy, width: ww, height: wh, fill: LIT }, paper);
    KEEPSAKE[given](group(paper, cx, cy + 4, 1));
    shape('path', { d: `M${cx} ${wy}V${wy + wh}M${wx} ${cy}H${wx + ww}`, stroke: GREEN, 'stroke-width': 3, opacity: .55 }, paper);
  }, { paper: SMALL });
  // Whoever granted it left a note on the door, in their own colour.
  const { by } = WISHES.find(each => each.id === given);
  nameTag(mid, [HOUSE.x + HOUSE.width / 2 - 36, HOUSE.base - 52, 26, 34], { letter: by.slice(0, 1), ink: HANDS[by[0]], className: 'b-note' });
  const flight = mover(mid, 'b-flight'), [fx, fy, fs] = points[5];
  sleigh(flight, fx, fy, fs, { flip: true });
  if (given === 'blessing') piece(sky, [60, 60, 60, 92], 'b-balloon', paper => balloon(group(paper, 60, 60, 1)), { paper: SMALL });
  snow(scene, given === 'snow' ? 64 : 20);
  sheet(near, '', paper => {
    shape('path', { d: 'M-40 556C80 540 220 560 330 566C430 572 540 552 640 548V640H-40Z', fill: '#f6f3ec' }, paper);
    snowyFir(paper, 600, 640, 230, 0); snowyFir(paper, 548, 640, 150, 2); fenceRow(paper, -20, 600, 5);
  });
  if (given === 'snow') { snowflake(near, [520, 110, 34], 'is-slow'); snowflake(near, [250, 70, 26], ''); snowflake(near, [80, 300, 22], 'is-slow'); }
  else snowflake(near, [560, 120, 24], 'is-slow');
  return { length: 15.5, text: 3, note: 11.6 };
}
// A low fence of snowy posts along the front.
function fenceRow(g, x, base, count, gap = 34) {
  shape('path', { d: `M${x - 6} ${base - 28}H${x + (count - 1) * gap + 6}V${base - 22}H${x - 6}ZM${x - 6} ${base - 14}H${x + (count - 1) * gap + 6}V${base - 8}H${x - 6}Z`, fill: '#ad9076' }, g);
  for (let i = 0; i < count; i++) { const px = x + i * gap; shape('path', { d: `M${px - 5} ${base}V${base - 36}L${px} ${base - 42}L${px + 5} ${base - 36}V${base}Z`, fill: '#9c7f64' }, g); shape('ellipse', { cx: px, cy: base - 40, rx: 8, ry: 4, fill: SNOW }, g); }
}

// Ending C, the early shift: sunrise over the village. Your name tag swings onto the sixth hook of the board; the sacks
// go into the sleigh; the other five see you off as you fly out over the roofs, toward the sun.
export function stayingOn(scene, { mark }) {
  const sky = depth(scene, 0, .1), far = depth(scene, 1, .45), mid = depth(scene, 2, .75), near = depth(scene, 3, 1.05);
  sheet(sky, '', paper => {
    shape('rect', { x: -40, y: -40, width: 680, height: 680, fill: '#c3d1e2' }, paper);
    shape('path', { d: 'M-40 190Q140 172 320 188T640 182V640H-40Z', fill: '#d3d6e3' }, paper);
    shape('path', { d: 'M-40 280Q140 262 320 278T640 272V640H-40Z', fill: '#e2d8df' }, paper);
  });
  // The dawn coming up warm behind the hills, the sun after it.
  sheet(sky, 'c-dawn', paper => {
    shape('path', { d: 'M-40 230Q140 212 320 228T640 222V640H-40Z', fill: '#f1d8d0' }, paper);
    shape('path', { d: 'M-40 300Q140 284 320 298T640 292V640H-40Z', fill: '#f8e3c3' }, paper);
  });
  piece(sky, [370, 250, 100, 100], 'c-sun', paper => { shape('circle', { cx: 420, cy: 300, r: 40, fill: '#fbe1ab' }, paper); shape('circle', { cx: 420, cy: 300, r: 28, fill: '#fdf0cf' }, paper); }, { paper: { scale: .5, grain: .3, shadow: 0, rim: '#fdf3dc' } });
  piece(sky, [86, 92, 140, 60], '', paper => cloud(paper, 156, 120, .42, '#fbf3ec'), { paper: SMALL });
  sheet(far, '', paper => {
    const tones = { cream: '#f4e9e2', ice: '#d5dde8', sky: '#b4c4d8', dusk: '#97abc4' };
    facetedPeak(paper, 90, 280, 400, 160, 150, tones); facetedPeak(paper, 560, 300, 400, 150, 140, tones);
    shape('path', { d: 'M-40 396Q120 380 300 392T640 388V640H-40Z', fill: '#e9edf1' }, paper);
    [[40, 402, 26, 16, '#a8564c'], [92, 404, 30, 18, '#3f6653'], [150, 400, 22, 14, '#8f5a3c'], [300, 404, 30, 18, '#a8564c'], [350, 401, 24, 15, '#3f6653'], [500, 404, 28, 17, '#8f5a3c'], [548, 401, 22, 14, '#a8564c']].forEach(home => cottage(paper, ...home, '#f4cf74'));
    for (const [x, b, h, v] of [[200, 404, 30, 1], [240, 406, 22, 2], [420, 404, 26, 0], [600, 404, 30, 1]]) snowyFir(paper, x, b, h, v);
  });
  sheet(mid, '', paper => {
    shape('path', { d: 'M-40 430Q140 416 320 430T640 424V640H-40Z', fill: '#f4f1eb' }, paper);
    shape('path', { d: 'M-40 520Q120 500 300 516T640 508V640H-40Z', fill: '#fbf8f1' }, paper);
    for (const [x, b, h, v] of [[30, 470, 100, 2], [372, 452, 64, 0]]) snowyFir(paper, x, b, h, v);
    // The runners' tracks, left in the snow once the sleigh is up.
    for (const d of ['M-10 488Q110 484 226 494', 'M-6 499Q110 496 226 504']) shape('path', { d, stroke: '#d3dee7', 'stroke-width': 2.6, fill: 'none', 'stroke-linecap': 'round' }, paper);
  });
  // The sleigh on the snow, sacks dropped in one after another; then it flies.
  const flight = mover(mid, 'c-flight');
  sleigh(flight, 220, 498, 1.45, { rider: true });
  [[188, 455, 0], [203, 456, 1], [176, 457, 2]].forEach(([x, y, i]) => piece(flight, [x - 14, y - 16, 28, 28], 'c-sack', paper => {
    if (i === 1) { shape('rect', { x: x - 9, y: y - 8, width: 18, height: 16, rx: 2, fill: GREEN }, paper); shape('path', { d: `M${x} ${y - 8}V${y + 8}M${x - 9} ${y}H${x + 9}`, stroke: GOLD, 'stroke-width': 2.6 }, paper); }
    else { shape('path', { d: `M${x - 11} ${y + 9}C${x - 13} ${y - 4} ${x - 6} ${y - 11} ${x} ${y - 9}C${x + 6} ${y - 11} ${x + 13} ${y - 4} ${x + 11} ${y + 9}Z`, fill: i ? '#b5443c' : '#c9a46a' }, paper); shape('path', { d: `M${x - 4} ${y - 8}Q${x} ${y - 5} ${x + 4} ${y - 8}`, stroke: '#8f6a4c', 'stroke-width': 1.6, fill: 'none' }, paper); }
  }, { paper: SMALL }).style.setProperty('--at', `${4.4 + i * .5}s`));
  // The other five see you off.
  // The other five gather round to see you off.
  [[64, 516, .7], [110, 524, .72], [196, 566, .78], [256, 572, .8], [318, 562, .78]].forEach(([x, y, size], i) => { const friend = mover(mid, 'c-friend'); friend.style.setProperty('--hop', `${9 + i * .13}s`); visitor(friend, x, y, size, false, '', { coat: HANDS[TAKEN[i]], scarf: '#fbf3df', tail: '#e9dcc4', lantern: false }); });
  snow(scene, 14);
  // The name board: five tags and the empty sixth hook, until yours swings onto it.
  sheet(near, '', paper => {
    for (const x of [416, 574]) shape('rect', { x: x - 6, y: 372, width: 12, height: 300, fill: '#8f5a3c' }, paper);
    shape('rect', { x: 398, y: 370, width: 196, height: 52, rx: 4, fill: '#a8774d' }, paper);
    for (const y of [384, 398, 410]) shape('path', { d: `M404 ${y}Q500 ${y - 3} 588 ${y + 1}`, stroke: '#8f5a3c', 'stroke-width': 1.6, fill: 'none' }, paper);
    shape('path', { d: 'M394 372Q420 360 450 368Q490 358 530 368Q566 360 598 372V378H394Z', fill: SNOW }, paper);
    holly(paper, 404, 376, .32);
    for (let i = 0; i < 6; i++) shape('path', { d: `M${422 + i * 30} 418V430Q${422 + i * 30} 434 ${426 + i * 30} 432`, stroke: '#3b2a24', 'stroke-width': 2.4, fill: 'none', 'stroke-linecap': 'round' }, paper);
    shape('path', { d: 'M-40 600C80 584 220 604 330 610C430 616 540 598 640 594V640H-40Z', fill: '#f6f3ec' }, paper);
  });
  TAKEN.forEach((letter, i) => nameTag(near, [409 + i * 30, 426, 26, 42], { letter, ink: HANDS[letter], className: 'theatre-sway' }).style.setProperty('--sway', `${-i * .9}s`));
  nameTag(near, [559, 426, 26, 42], { letter: mark || '?', ink: '#fffaf0', fill: RED, mine: true, className: 'c-tag' });
  return { length: 15.6, text: 3, log: 5.4 };
}

// Ending D, the light passed on: night over the whole village, the six name tags hung along a garland across the sky.
// One after another they light up, N, K, H, E, O and yours; then the light goes out from the cabin's door to every
// window in the village, until the last one is lit.
export const VILLAGE = [[110, 506, 64, 42, '#a8564c'], [196, 456, 46, 30, '#3f6653'], [76, 432, 34, 22, '#8f5a3c'], [214, 414, 28, 18, '#a8564c'], [490, 506, 64, 42, '#3f6653'], [404, 456, 46, 30, '#a8564c'], [526, 432, 34, 22, '#8f5a3c'], [386, 414, 28, 18, '#3f6653']];
export const PASS = { from: 8.4, step: .72, travel: 1.6 };
export function miracle(scene, { mark }) {
  const sky = depth(scene, 0, .1), far = depth(scene, 1, .45), mid = depth(scene, 2, .75), near = depth(scene, 3, 1.05);
  sheet(sky, '', paper => {
    shape('rect', { x: -40, y: -40, width: 680, height: 680, fill: NIGHT[0] }, paper);
    NIGHT.slice(1).forEach((fill, i) => shape('path', { d: `M-40 ${230 + i * 60}Q140 ${216 + i * 60} 320 ${228 + i * 60}T640 ${222 + i * 60}V640H-40Z`, fill }, paper));
    shape('circle', { cx: 508, cy: 196, r: 22, fill: '#fbf3df' }, paper); shape('circle', { cx: 518, cy: 189, r: 19, fill: NIGHT[0] }, paper);
  });
  twinkle(sky, [[40, 210, 3.4], [150, 250, 3], [260, 200, 4], [360, 236, 3], [450, 262, 3.6], [590, 230, 3], [100, 300, 2.6], [560, 300, 2.6]]);
  // The garland across the top, and on it the six tags, each with a light behind it.
  const sag = x => 52 + 58 * Math.sin(Math.PI * (x + 40) / 680);
  sheet(sky, '', paper => {
    for (let x = -40; x <= 640; x += 13) shape('path', { d: 'M0-7C4-5 5-1 4 2 3 5 1 6 0 7-1 6-3 5-4 2-5-1-4-5 0-7Z', fill: [DEEP, GREEN, '#5f8a70'][(Math.round(x / 13) + 3) % 3], transform: `translate(${x} ${sag(x)}) rotate(${x * 7}) scale(1.6)` }, paper);
    for (const x of [14, 300, 586]) { const y = sag(x); shape('path', { d: `M${x} ${y}c-10-9-18-1-10 4 4 3 9 1 10-4zm0 0c10-9 18-1 10 4-4 3-9 1-10-4z`, fill: '#a84a42' }, paper); shape('circle', { cx: x, cy: y, r: 2.8, fill: '#87302f' }, paper); }
  });
  const tags = [...TAKEN, mark || '?'];
  tags.forEach((letter, i) => {
    const x = 90 + i * 84, y = sag(x) + 2, mine = i === 5;
    piece(sky, [x - 44, y - 6, 88, 88], 'd-glow', paper => glow(paper, x, y + 34, 33), { paper: { scale: .4, grain: .2, shadow: 0, rim: '#ffffff00' } }).style.setProperty('--at', `${3.2 + i * .9}s`);
    const tag = nameTag(sky, [x - 18, y - 2, 36, 56], { letter, ink: mine ? '#fffaf0' : HANDS[letter], fill: mine ? RED : '#fffaf0', mine, className: 'theatre-sway d-tag' });
    tag.style.setProperty('--sway', `${-i * .8}s`); tag.style.setProperty('--at', `${3.2 + i * .9}s`);
  });
  sheet(far, '', paper => {
    shape('path', { d: 'M-40 412Q100 380 240 398T460 386Q560 374 640 392V640H-40Z', fill: '#7f98b6' }, paper);
    for (const [x, b, h, v] of [[30, 420, 50, 1], [570, 410, 56, 2], [160, 404, 30, 0], [450, 398, 34, 1]]) snowyFir(paper, x, b, h, v);
  });
  sheet(mid, '', paper => {
    shape('path', { d: 'M-40 420Q140 404 320 420T640 414V640H-40Z', fill: '#dbe3eb' }, paper);
    shape('path', { d: 'M-40 470Q120 456 300 470T640 464V640H-40Z', fill: '#e8edf1' }, paper);
    for (const home of VILLAGE) cottage(paper, ...home, '#3d4f66');
    cabinFront(group(paper, 300 - 468 * .62, 492 - 494 * .62, .62));
  });
  // The light, from the cabin's open door out to each house; each window lit as it arrives.
  VILLAGE.forEach(([x, base, w, h], i) => {
    const at = PASS.from + i * PASS.step, orb = mover(mid, 'd-orb');
    orb.style.setProperty('--at', `${at}s`); orb.style.setProperty('--dx', `${((x - 300) / 6).toFixed(2)}%`); orb.style.setProperty('--dy', `${((base - h * .55 - 468) / 6).toFixed(2)}%`);
    piece(orb, [286, 454, 28, 28], '', paper => { glow(paper, 300, 468, 13, '#fbe7a8'); shape('circle', { cx: 300, cy: 468, r: 4, fill: '#fff4cc' }, paper); }, { paper: { scale: .3, grain: .2, shadow: 0, rim: '#ffffff00' } });
    piece(mid, [x - w / 2, base - h, w, h], 'd-lit', paper => cottageWindows(paper, x, base, w, h, '#f4cf74'), { paper: SMALL }).style.setProperty('--at', `${(at + PASS.travel - .15).toFixed(2)}s`);
  });
  snow(scene, 16);
  sheet(near, '', paper => {
    shape('path', { d: 'M-40 560C80 544 220 566 330 572C430 578 540 556 640 552V640H-40Z', fill: '#eef2f5' }, paper);
    snowyFir(paper, -4, 640, 250, 0); snowyFir(paper, 620, 640, 220, 1);
  });
  snowflake(near, [92, 330, 22], 'is-slow'); snowflake(near, [520, 360, 18], '');
  return { length: 17, text: 3, last: PASS.from + VILLAGE.length * PASS.step + PASS.travel };
}
