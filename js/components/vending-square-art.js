// The Christmas Market's square late in the afternoon (vending-scene.js stands these up): a sky of paper bands from pale
// blue to peach, snowy mountains far off, the old town on its hill (houses in soft colours climbing to a clock tower, bulbs
// strung between the roofs), firs and heaps of snow at the corners, the way trodden to the machine, and the elves who
// shop at the stalls, each cut in pieces so its arm, or its legs, can move on their own.
import { shape } from './paper-art.js';
import { glowFill } from './vending-world-art.js';

const f = n => (Math.round(n * 10) / 10).toString();
const noise = i => { const v = Math.sin(i * 12.9898 + 78.233) * 43758.5453; return v - Math.floor(v); };
const wave = (x0, x1, y, amp, step, seed) => { const points = []; for (let x = x0; x <= x1 + .1; x += step) points.push([x, y + Math.sin(x / step * .9 + seed) * amp + (noise(seed * 31 + x / step) - .5) * amp]); return points; };
const path = points => points.map(([x, y], i) => `${i ? 'L' : 'M'}${f(x)} ${f(y)}`).join('');
const rect = (g, x, y, w, h, fill, extra = {}) => shape('rect', { x: f(x), y: f(y), width: f(w), height: f(h), fill, ...extra }, g);
// A lumpy cap of snow along y from x0 to x1.
const lumps = (g, x0, x1, y, deep, seed) => {
  const n = Math.max(3, Math.round((x1 - x0) / 14)), top = [], low = [];
  for (let i = 0; i <= n; i++) { const x = x0 + (x1 - x0) * i / n; top.push([x, y - deep * (.4 + noise(seed + i) * .6)]); low.push([x, y + deep * (i % 3 === 1 ? .9 : .4)]); }
  shape('path', { d: `${path([[x0 - 4, y + deep * .3], ...top, [x1 + 4, y + deep * .3], ...low.reverse()])}Z`, fill: SNOW }, g);
};
export const SNOW = '#f3f1f7', SHADE = '#dcd8ea';

// The sky: bands of paper, pale blue overhead to peach low down, the low sun's glow, a few clouds.
const BANDS = [[90, '#b9d7e8'], [190, '#c7dfec'], [290, '#d6e5ee'], [370, '#e6e6ea'], [440, '#f3e0d4'], [600, '#f8e7da']];
export const SKY = { box: [0, 0, 2600, 600], draw: g => {
  rect(g, 0, 0, 2600, 600, '#f9eadf');
  for (let i = BANDS.length - 1; i >= 0; i--) { const [y, fill] = BANDS[i]; shape('path', { d: `${path([[0, 0], ...wave(0, 2600, y, 6, 90, i * 3 + 2), [2600, 0]])}Z`, fill }, g); }
  shape('circle', { cx: 1500, cy: 560, r: 340, fill: glowFill(g, '#ffe7c8', .6) }, g);
  for (const [x, y, s] of [[700, 150, 1], [1150, 95, .8], [1900, 170, 1.1], [2250, 110, .7], [380, 250, .7]]) for (const [dx, dy, r] of [[0, 0, 34], [30, -12, 28], [58, 2, 30], [24, 10, 30]]) shape('circle', { cx: f(x + dx * s), cy: f(y + dy * s), r: f(r * s), fill: '#fbf7f2' }, g);
} };
// Snowy mountains far off, pale blue, white at their peaks; a lower ridge before them.
export const MOUNTAINS = { box: [0, 0, 3000, 360], draw: g => {
  const peaks = [[0, 250], [260, 120], [520, 230], [760, 70], [1080, 210], [1330, 110], [1600, 220], [1900, 60], [2200, 200], [2450, 100], [2750, 230], [3000, 140]];
  shape('path', { d: `${path([[0, 360], ...peaks, [3000, 360]])}Z`, fill: '#c3d2e6' }, g);
  for (const [x, y] of peaks.slice(1, -1)) { if (y > 160) continue; const d = (360 - y) * .28; shape('path', { d: `M${f(x)} ${f(y)}L${f(x + d * .9)} ${f(y + d * .7)}L${f(x + d * .45)} ${f(y + d * .62)}L${f(x + d * .1)} ${f(y + d * .8)}L${f(x - d * .35)} ${f(y + d * .6)}L${f(x - d * .8)} ${f(y + d * .72)}Z`, fill: '#f4f6fa' }, g); }
  shape('path', { d: `${path([[0, 360], ...wave(0, 3000, 300, 14, 220, 9), [3000, 360]])}Z`, fill: '#d7e0ee' }, g);
} };

// The old town on its hill: houses in soft colours, snow on every roof, lit windows, a wreath here and there; the clock
// tower rising among them on the right; little bulbs strung from roof to roof. Each house: [middle, width, height, wall,
// roof].
const TOWN = [[570, 120, 120, '#efb9a5', '#6c7a92'], [700, 120, 130, '#bcd3e3', '#a84a42'], [880, 130, 150, '#f3e3c3', '#a84a42'], [1010, 120, 175, '#bfdccb', '#6c7a92'], [1125, 140, 150, '#efb9a5', '#4f7d68'], [1255, 110, 190, '#f2d98f', '#a84a42'], [1380, 120, 165, '#f3e3c3', '#6c7a92'], [1505, 125, 165, '#bcd3e3', '#a84a42'], [1625, 135, 200, '#f3e3c3', '#4f7d68'], [1760, 120, 160, '#efb9a5', '#6c7a92'], [1880, 150, 185, '#bfdccb', '#a84a42'], [2025, 120, 150, '#f2d98f', '#6c7a92'], [2160, 120, 130, '#f3e3c3', '#4f7d68'], [2290, 120, 115, '#bfdccb', '#a84a42']];
const hill = x => 560 - 120 * Math.exp(-(((x - 1450) / 700) ** 2));
export const TOWER = 1960;
export const OLDTOWN = { box: [0, 0, 3000, 640], draw: g => {
  const ground = []; for (let x = 0; x <= 3000; x += 50) ground.push([x, hill(x)]);
  shape('path', { d: `${path([[0, 640], ...ground, [3000, 640]])}Z`, fill: '#eeedf3' }, g);
  { const x = TOWER, base = hill(x + 45) + 8, w = 90;
    rect(g, x, base - 330, w, 330, '#efe3cb'); rect(g, x + w - 18, base - 330, 18, 330, '#d9c8ad');
    shape('path', { d: `M${x - 10} ${base - 330}L${x + w / 2} ${base - 470}L${x + w + 10} ${base - 330}Z`, fill: '#4f6b7d' }, g); lumps(g, x - 10, x + w + 10, base - 330, 10, 3);
    shape('circle', { cx: x + w / 2, cy: base - 270, r: 30, fill: '#fbf5e6', stroke: '#c08a3e', 'stroke-width': 6 }, g);
    shape('path', { d: `M${x + w / 2} ${base - 270}V${base - 292}M${x + w / 2} ${base - 270}H${x + w / 2 + 15}`, stroke: '#3c3238', 'stroke-width': 4, 'stroke-linecap': 'round' }, g);
    for (const y of [base - 200, base - 120]) rect(g, x + 30, y, 30, 44, '#f6cd78', { rx: 14 });
    shape('circle', { cx: x + w / 2, cy: base - 478, r: 8, fill: '#e0b04f' }, g); }
  for (const [i, [middle, w, h, wall, roof]] of TOWN.entries()) {
    const base = hill(middle) + 10, x = middle - w / 2, top = base - h, peak = top - w * (i % 2 ? .55 : .42);
    rect(g, x, top, w, h, wall); rect(g, x + w - 12, top, 12, h, '#00000014');
    shape('path', { d: `M${f(x - 10)} ${f(top + 4)}L${f(middle)} ${f(peak)}L${f(x + w + 10)} ${f(top + 4)}Z`, fill: roof }, g);
    shape('path', { d: `M${f(x - 12)} ${f(top + 4)}L${f(middle)} ${f(peak - 3)}L${f(x + w + 12)} ${f(top + 4)}L${f(x + w - 4)} ${f(top + 12)}L${f(middle)} ${f(peak + 14)}L${f(x + 4)} ${f(top + 12)}Z`, fill: SNOW }, g);
    for (const [a, b] of [[.18, .42], [.58, .82]]) for (const y of [.22, .58]) rect(g, x + w * a, top + h * y, w * (b - a), h * .2, noise(i * 5 + a * 10 + y) > .35 ? '#f6cd78' : '#9fb0c8');
    if (i % 3 === 0) shape('circle', { cx: f(middle), cy: f(top + h * .12 + 6), r: 9, fill: 'none', stroke: '#4f7d68', 'stroke-width': 5 }, g);
  }
  const tops = TOWN.map(([middle, , h]) => [middle, hill(middle) + 10 - h]);
  for (let k = 0; k < tops.length - 1; k++) {
    const [x0, y0] = tops[k], [x1, y1] = tops[k + 1], dip = (y0 + y1) / 2 + 40;
    if (x1 - x0 > 200) continue;
    shape('path', { d: `M${f(x0)} ${f(y0)}Q${f((x0 + x1) / 2)} ${f(dip)} ${f(x1)} ${f(y1)}`, fill: 'none', stroke: '#6a5a5e', 'stroke-width': 1.6 }, g);
    for (let j = 1; j < 6; j++) { const t = j / 6, x = (1 - t) ** 2 * x0 + 2 * (1 - t) * t * (x0 + x1) / 2 + t * t * x1, y = (1 - t) ** 2 * y0 + 2 * (1 - t) * t * dip + t * t * y1; shape('circle', { cx: f(x), cy: f(y + 3), r: 3.6, fill: ['#ffe4a3', '#f2a08f', '#9fd0a8'][j % 3] }, g); }
  }
}, glow: g => { const fill = glowFill(g, '#ffd98a', .5); for (const [middle, w, h] of TOWN) shape('ellipse', { cx: f(middle), cy: f(hill(middle) + 10 - h * .45), rx: f(w * .7), ry: f(h * .5), fill }, g); } };

// A fir in three tiers, snow on each; drawn plain, or pale as the far ones are.
export function firShape(g, middle, base, h, w, fill = '#3f6653', dark = '#33584a', snow = SNOW) {
  rect(g, middle - w * .06, base - h * .12, w * .12, h * .12, '#6b4a3a');
  for (const [k, top, bottom, width] of [[0, 0, .45, .62], [1, .2, .7, .82], [2, .42, .9, 1]]) {
    const y0 = base - h + h * top, y1 = base - h + h * bottom, half = w * width / 2;
    shape('path', { d: `M${f(middle)} ${f(y0)}L${f(middle + half)} ${f(y1)}Q${f(middle)} ${f(y1 + h * .05)} ${f(middle - half)} ${f(y1)}Z`, fill: k % 2 ? dark : fill }, g);
    shape('path', { d: `M${f(middle)} ${f(y0)}L${f(middle + half * .3)} ${f(y0 + (y1 - y0) * .3)}Q${f(middle)} ${f(y0 + (y1 - y0) * .38)} ${f(middle - half * .3)} ${f(y0 + (y1 - y0) * .3)}Z`, fill: snow }, g);
    shape('path', { d: `M${f(middle - half)} ${f(y1)}Q${f(middle)} ${f(y1 + h * .05)} ${f(middle + half)} ${f(y1)}Q${f(middle)} ${f(y1 - h * .02)} ${f(middle - half)} ${f(y1)}Z`, fill: snow }, g);
  }
}
export const FIR = { box: [0, 0, 200, 330], draw: g => firShape(g, 100, 326, 320, 190) };
// A soft heap of snow at the front, lavender in its shade.
export const MOUND = { box: [0, 0, 600, 170], draw: g => {
  shape('path', { d: 'M0 170C40 90 130 40 250 38S470 70 530 110 590 150 600 170Z', fill: SNOW }, g);
  shape('path', { d: 'M300 170C380 150 470 120 540 116C570 136 590 152 600 170Z', fill: SHADE }, g);
  shape('path', { d: 'M40 170C90 150 150 140 210 146C170 156 120 164 90 170Z', fill: SHADE, opacity: .7 }, g);
} };
// The way trodden in the snow to the machine, from above (its far end at the top): a soft band with footprints in it.
export const PATH = { box: [0, 0, 240, 1000], draw: g => {
  const middle = t => 120 + Math.sin(t * Math.PI * 1.1 + .4) * 26, left = [], right = [];
  for (let i = 0; i <= 20; i++) { const t = i / 20, half = (42 + t * 12 + (noise(i) - .5) * 8) * Math.min(1, .35 + t * 5); left.push([middle(t) - half, t * 1000]); right.push([middle(t) + half, t * 1000]); }
  shape('path', { d: `${path([[middle(0), -6], ...left, ...right.reverse()])}Z`, fill: '#dedbea' }, g);
  for (let i = 0; i < 18; i++) { const t = .09 + i / 20; shape('ellipse', { cx: f(middle(t) + (i % 2 ? 13 : -13)), cy: f(t * 1000), rx: 7, ry: 15, fill: '#cdc9df' }, g); }
} };

// An elf in paper, 100 units wide and 162 tall, its feet at the bottom: a tunic with a scalloped hem, a belt, pointed ears,
// rosy cheeks, a hat with a bobble; what it carries (a pile of presents, a basket) drawn with it. Its legs are drawn
// with it unless they walk (then each leg is a piece of its own); its right arm (on the left of the drawing) is drawn
// with it, hanging or holding what it carries; the arm that moves, its left, is a piece of its own (`free: false` when
// both hold the presents).
const SKIN = '#f2c9a5', TUNIC = '#4f7d68', HAT = '#b5443c', CREAM = '#fbf3df';
export const HIP = 116, SHOULDER = [66, 76];
function leg(g, x, { tiptoe = false, toe = 1 } = {}) {
  for (let k = 0; k < 4; k++) rect(g, x, 118 + k * 7, 10, 7, k % 2 ? CREAM : '#b5443c');
  shape('path', { d: tiptoe ? `M${x - 1} 146L${x + 11} 146L${x + 9} 158L${x + 1} 158Z` : `M${x} 146H${x + 10}Q${f(x + 5 + toe * 13)} 146 ${f(x + 5 + toe * 12)} 140L${f(x + 5 + toe * 10)} 156H${x}Z`, fill: '#3f6653' }, g);
}
// A colour a little darker.
const shade = hex => `#${[1, 3, 5].map(i => Math.round(parseInt(hex.slice(i, i + 2), 16) * .82).toString(16).padStart(2, '0')).join('')}`;
// An arm hanging from the shoulder at (x, 76) down to the hand at (hx, hy).
function sleeve(g, x, hx, hy, tunic) {
  const dx = hx - x, dy = hy - 76, length = Math.hypot(dx, dy), [nx, ny] = [-dy / length * 7, dx / length * 7];
  shape('path', { d: `M${f(x + nx)} ${f(76 + ny)}L${f(hx + nx * .85)} ${f(hy - 6 + ny * .85)}L${f(hx - nx * .85)} ${f(hy - 6 - ny * .85)}L${f(x - nx)} ${f(76 - ny)}Z`, fill: tunic }, g);
  shape('circle', { cx: f(hx), cy: f(hy), r: 5.5, fill: SKIN }, g);
}
function elfDrawing(g, { tunic = TUNIC, hat = HAT, load = null, tiptoe = false, legs = true } = {}) {
  if (legs) for (const side of [-1, 1]) leg(g, 50 + side * 11 - 5, { tiptoe, toe: side });
  shape('path', { d: 'M30 72H70L80 120H20Z', fill: tunic }, g);
  for (let k = 0; k < 6; k++) shape('path', { d: `M${20 + k * 10} 118Q${25 + k * 10} 128 ${30 + k * 10} 118Z`, fill: CREAM }, g);
  rect(g, 26, 96, 48, 7, '#3c3238'); rect(g, 45, 95, 10, 9, '#e0b04f');
  shape('path', { d: 'M36 72Q50 82 64 72L62 70H38Z', fill: CREAM }, g);
  // its right arm, a shade darker than the tunic it lies on: hanging, or down to the basket's handle (the presents'
  // arms come after them)
  if (load === 'basket') sleeve(g, 33, 30, 98, shade(tunic)); else if (load !== 'gifts') sleeve(g, 33, 20, 108, shade(tunic));
  for (const side of [-1, 1]) shape('path', { d: `M${50 + side * 16} 52L${50 + side * 30} 42L${50 + side * 18} 60Z`, fill: SKIN }, g);
  shape('circle', { cx: 50, cy: 54, r: 18, fill: SKIN }, g);
  for (const side of [-1, 1]) { shape('circle', { cx: 50 + side * 7, cy: 54, r: 2.2, fill: '#3c3238' }, g); shape('circle', { cx: 50 + side * 11, cy: 60, r: 3.4, fill: '#f0a8a0' }, g); }
  shape('path', { d: 'M45 62Q50 66 55 62', fill: 'none', stroke: '#8a4a3c', 'stroke-width': 1.8, 'stroke-linecap': 'round' }, g);
  shape('path', { d: 'M30 46Q50 10 78 8Q66 22 70 44Z', fill: hat }, g); rect(g, 29, 40, 42, 9, CREAM, { rx: 4 }); shape('circle', { cx: 79, cy: 9, r: 6, fill: CREAM }, g);
  if (load === 'gifts') {
    for (const [y, w, fill, ribbon] of [[100, 44, '#b5443c', '#e0b04f'], [80, 36, '#4f7d68', CREAM], [62, 26, '#e0b04f', '#b5443c']]) { rect(g, 50 - w / 2, y - 18, w, 20, fill); rect(g, 47, y - 18, 6, 20, ribbon); }
    for (const side of [-1, 1]) sleeve(g, 50 + side * 16, 50 + side * 22, 92, shade(tunic));
  }
  if (load === 'basket') {
    shape('path', { d: 'M18 104H42L39 118H21Z', fill: '#a8774d' }, g); shape('path', { d: 'M20 104Q30 92 40 104', fill: 'none', stroke: '#7a5238', 'stroke-width': 2.4 }, g);
    shape('circle', { cx: 26, cy: 102, r: 4, fill: '#b5443c' }, g); shape('circle', { cx: 34, cy: 101, r: 4, fill: '#e0b04f' }, g);
  }
}
export const elf = options => ({ box: [0, 0, 100, 162], draw: g => elfDrawing(g, options) });
// One leg from the hip down (the hip at 5, 0), for an elf that walks.
export const LEG = { box: [-6, -2, 30, 46], draw: g => leg(shape('g', { transform: `translate(0 ${-118})` }, g), 0, { toe: 1 }) };
// An arm from the shoulder (at 0, 0) hanging down, in the elf's own tunic, the hand holding `thing`: a cup of cocoa, a
// bauble, or nothing.
export const arm = (thing, tunic = TUNIC) => ({ box: [-8, -4, 22, 56], draw: g => {
  shape('path', { d: 'M-6 0H8L9 32H-5Z', fill: shade(tunic) }, g); rect(g, -6, 30, 15, 5, CREAM);
  shape('circle', { cx: 1.5, cy: 39, r: 5.5, fill: SKIN }, g);
  if (thing === 'cup') { rect(g, -3, 32, 11, 13, CREAM, { rx: 2 }); rect(g, -3, 36, 11, 3, '#b5443c'); }
  if (thing === 'bauble') { shape('circle', { cx: 1.5, cy: 45, r: 6, fill: '#b5443c' }, g); rect(g, -.5, 37, 4, 3, '#e0b04f'); }
} });
// A puff of steam off the cocoa.
export const PUFF = { box: [0, 0, 40, 40], draw: g => shape('circle', { cx: 20, cy: 20, r: 15, fill: '#ffffff', opacity: .85 }, g) };
