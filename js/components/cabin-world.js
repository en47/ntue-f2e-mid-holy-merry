// The village around Santa's cabin, found by turning on the spot: a Christmas fair and a wishing corner on the left, a
// winter coast with a lighthouse on the right, a ski mountain far behind. Every piece is a paper board like the cabin's
// (cabin-art.js); the zones stand outside the resting view, so they only appear once you turn toward them.
// Units: 1 = Santa's seated height. Light comes from the upper left.
import { holly, pine, shape } from './paper-art.js';
import { facetedPeak, roofHouse, snowyFir, star } from './paper-props.js';
import { GROUND, bench, candyCane, drift, fence, hills, lampPost, path, pond } from './cabin-art.js';

// Where the visitor stands looking at the house (cabin-scene.js keeps the eye about here on a wide screen).
export const VIEWPOINT = { x: 0, z: 11.5 };
const face = (x, z) => Math.atan2(VIEWPOINT.x - x, VIEWPOINT.z - z);
const CREAM = '#fbf3df', SNOW = '#fbf8f1', RED = '#a84a42', DEEP_RED = '#87302f', GREEN = '#4f7d68', DEEP_GREEN = '#3f6653', GOLD = '#e0b04f';
const WOOD = '#8f5a3c', WOOD_LIT = '#a86b47', CORK = '#c39466', INK = '#3b2a24', IRON = '#3b302a';
const SEA = '#7fa6bf', SEA_LIGHT = '#a3c2d4', SEA_DEEP = '#6a93ad', FOAM = '#eef5f6', ROCK = '#9aa6ad', ROCK_DARK = '#7f8b93';
const BULBS = ['#ef6f5e', '#f4c668', '#7fce9a', '#7cb8ec'];
const noise = index => { const value = Math.sin(index * 12.9898) * 43758.5453; return value - Math.floor(value); };

// The rides and the far mountain. Wheel: hub height and rim radius. Carousel: canopy height and the ring the horses ride on.
export const WHEEL = { x: -17, z: -1, hub: 4.7, radius: 3.2 };
export const CAROUSEL = { x: -12.6, z: 6.8, radius: 1.75, ring: 1.3, top: 2.75, horses: 6 };
// The shoreline, from the far back to behind the visitor; the sea lies on its +x side.
export const SHORE = [[32, -90], [24, -40], [18, -20], [14.6, -8], [12.8, 2], [12.2, 12], [13, 24], [16, 40], [22, 90]];
const LIGHT = { x: 19.5, z: 4.4, base: GROUND + .55, h: 4.8, px: 160, lamp: 105 };
export const LIGHTHOUSE = { x: LIGHT.x, z: LIGHT.z, lamp: LIGHT.base + LIGHT.h - LIGHT.lamp / LIGHT.px };
// The mountain board's own units: x across from its centre, y up from its foot. Ski runs and the lift are drawn on it in
// these units, and skiers and cabins travel along the same lines (cabin-scene.js).
export const SKI = { x: 6, z: -27, w: 34, h: 11 };
const RIDGE = [[-17, 1.2], [-13, 3.4], [-9.5, 6.1], [-6, 8.6], [-3.6, 10.1], [-2, 10.7], [-.4, 10], [2.4, 7.6], [4.8, 7], [7, 7.8], [9, 8.4], [11.2, 7.1], [14, 4.4], [17, 2.2]];
export const RUNS = [
  [[-2.2, 10], [-3.6, 8.6], [-1.4, 7], [-3.8, 5.4], [-1.6, 3.8], [-3.4, 2.2], [-2.4, .6]],
  [[8.8, 7.9], [7.2, 6.6], [9.2, 5.2], [7, 3.6], [8.8, 2], [7.6, .6]],
];
export const LIFT = { from: [-11.6, .7], to: [-6.6, 8.1] };
// The roller coaster at the back of the fair, in the board's own units (x across from its middle, y up from the snow): out
// of a little station on the left, a chain lift up to the tallest crest, a steep drop, then two lower hills — each lower
// than the last, as a train coasting on its own speed could climb — and into a snowy tunnel on the right. The train's speed
// follows the drop below the crest (cabin-scene.js), so it crawls up the lift and races down.
export const COASTER = { x: -18.5, z: 15.8, w: 13, h: 7, lift: [-5.4, -1.1] };
export const TRACK = [[-6.3, 1], [-5.4, 1], [-4.6, 1.9], [-3.4, 3.4], [-2.2, 4.9], [-1.55, 5.7], [-1.1, 5.85], [-.7, 5.4], [-.25, 3.5], [.2, 1.5], [.6, .95], [1.25, 1.05], [1.85, 2.5], [2.4, 3.7], [2.85, 3.9], [3.3, 3.3], [3.8, 1.6], [4.3, 1], [4.85, 1.75], [5.3, 2.15], [5.75, 1.6], [6.3, 1.05]];
// Hot-air balloons drifting over the fair; each sways a little about its place.
export const BALLOONS = [[-18, 5.4, 3], [-25, 6.4, 12.5], [-21, 4.8, -6]];
// The far ends of the turn, so neither edge is bare snow. Left, past the fair: a skating pond (its long axis turned across
// the line of sight) with two skaters gliding round it. Right, past the lighthouse: buoys and a seal on an ice floe.
export const POND = { x: -7.8, z: 15.6, turn: -1.09, radius: [1.45, .55] };
export const FLOATS = [[16.8, 11.2], [19.5, 17.5]];
export const FLOE = [17.8, 8.4];
export const RIGS = {
  wheel: { at: [WHEEL.x, GROUND + WHEEL.hub, WHEEL.z], turn: face(WHEEL.x, WHEEL.z) },
  carousel: { at: [CAROUSEL.x, GROUND, CAROUSEL.z] },
  ski: { at: [SKI.x, GROUND, SKI.z], turn: face(SKI.x, SKI.z) },
  coaster: { at: [COASTER.x, GROUND, COASTER.z], turn: face(COASTER.x, COASTER.z) },
};

// A smooth line through points (uniform Catmull-Rom, the same curve THREE.SplineCurve follows).
function smooth(points) {
  let d = `M${points[0][0]} ${points[0][1]}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i], p1 = points[i], p2 = points[i + 1], p3 = points[i + 2] ?? p2;
    d += `C${p1[0] + (p2[0] - p0[0]) / 6} ${p1[1] + (p2[1] - p0[1]) / 6} ${p2[0] - (p3[0] - p1[0]) / 6} ${p2[1] - (p3[1] - p1[1]) / 6} ${p2[0]} ${p2[1]}`;
  }
  return d;
}
const lights = (parent, from, to, sag, count, r = 7) => {
  shape('path', { d: `M${from[0]} ${from[1]}Q${(from[0] + to[0]) / 2} ${(from[1] + to[1]) / 2 + sag * 2} ${to[0]} ${to[1]}`, stroke: '#4f6a62', 'stroke-width': 3, fill: 'none' }, parent);
  for (let i = 1; i < count; i++) {
    const t = i / count, x = from[0] + (to[0] - from[0]) * t, y = from[1] + (to[1] - from[1]) * t + sag * 4 * t * (1 - t);
    shape('circle', { cx: x, cy: y + r, r, fill: BULBS[i % 4] }, parent);
  }
};
const snowCap = (parent, x, y, width, lift = 16) => shape('path', { d: `M${x - 6} ${y + 4}C${x + width * .3} ${y - lift} ${x + width * .7} ${y - lift * .6} ${x + width + 6} ${y + 2}V${y + 8}H${x - 6}Z`, fill: SNOW }, parent);
function gift(parent, x, base, w, h, fill, ribbon) {
  shape('rect', { x, y: base - h, width: w, height: h, rx: 6, fill }, parent);
  shape('rect', { x: x + w / 2 - 7, y: base - h, width: 14, height: h, fill: ribbon }, parent);
  shape('path', { d: `M${x + w / 2} ${base - h}c-26-30-44-6-16 2m16-2c26-30 44-6 16 2`, stroke: ribbon, 'stroke-width': 9, fill: 'none', 'stroke-linecap': 'round' }, parent);
}

// ——— The wishing corner, beside the fair: the Wish page's world, seen from the street. ———
// A fir hung with sealed wish envelopes: only their backs show, so no one's letter can be read.
export function wishTree({ paper }, { width, height }) {
  const cx = width / 2;
  snowyFir(paper, cx, height - 10, height - 70, 2, .58);
  for (let i = 0; i < 11; i++) {
    const t = .18 + noise(i + 4) * .72, y = 90 + t * (height - 220), x = cx + (noise(i + 21) * 2 - 1) * t * width * .32;
    shape('path', { d: `M${x} ${y - 30}v16`, stroke: GOLD, 'stroke-width': 3 }, paper);
    const card = shape('g', { transform: `translate(${x} ${y}) rotate(${(noise(i + 9) - .5) * 24})` }, paper);
    shape('rect', { x: -24, y: -14, width: 48, height: 32, rx: 3, fill: ['#fbf3df', '#f6e1d3', '#e5eef0'][i % 3] }, card);
    shape('path', { d: 'M-24 -14L0 5 24 -14', stroke: '#c9b48f', 'stroke-width': 3, fill: 'none' }, card);
    shape('circle', { cx: 0, cy: 4, r: 6, fill: RED }, card);
  }
  star(paper, cx, 46, 34, GOLD);
}
// The wishing post: a red pillar box with a letter half posted.
export function wishPost({ paper }, { width, height }) {
  const cx = width / 2, top = 40;
  shape('path', { d: `M${cx - 62} ${height - 16}V${top + 60}C${cx - 62} ${top - 10} ${cx + 62} ${top - 10} ${cx + 62} ${top + 60}V${height - 16}Z`, fill: RED }, paper);
  shape('path', { d: `M${cx + 24} ${height - 16}V${top + 40}C${cx + 50} ${top + 50} ${cx + 62} ${top + 70} ${cx + 62} ${top + 90}V${height - 16}Z`, fill: DEEP_RED, opacity: .5 }, paper);
  shape('rect', { x: cx - 70, y: height - 32, width: 140, height: 28, rx: 6, fill: DEEP_RED }, paper);
  shape('rect', { x: cx - 70, y: top + 56, width: 140, height: 18, rx: 6, fill: DEEP_RED }, paper);
  shape('rect', { x: cx - 38, y: top + 104, width: 76, height: 12, rx: 6, fill: INK }, paper);
  shape('rect', { x: cx - 26, y: top + 84, width: 52, height: 28, rx: 3, fill: CREAM, transform: `rotate(-8 ${cx} ${top + 98})` }, paper);
  shape('path', { d: `M${cx} ${top + 200}c-30-22-36-44-18-52 10-4 18 4 18 10 0-6 8-14 18-10 18 8 12 30-18 52Z`, fill: GOLD }, paper);
  shape('path', { d: `M${cx - 66} ${top + 30}C${cx - 50} ${top - 22} ${cx + 50} ${top - 22} ${cx + 66} ${top + 30}C${cx + 30} ${top + 14} ${cx - 30} ${top + 18} ${cx - 66} ${top + 30}Z`, fill: SNOW }, paper);
}
// A notice board of little wish cards: each carries a doodle, never words.
export function wishBoard({ paper }, { width, height }) {
  for (const x of [30, width - 54]) shape('rect', { x, y: 60, width: 24, height: height - 60, fill: WOOD }, paper);
  const board = { x: 14, y: 46, w: width - 28, h: height * .62 };
  shape('rect', { x: board.x, y: board.y, width: board.w, height: board.h, rx: 14, fill: WOOD_LIT }, paper);
  shape('rect', { x: board.x + 12, y: board.y + 12, width: board.w - 24, height: board.h - 24, rx: 8, fill: CORK }, paper);
  const cw = (board.w - 60) / 3, ch = (board.h - 54) / 2;
  for (let i = 0; i < 6; i++) {
    const x = board.x + 22 + (i % 3) * (cw + 8), y = board.y + 24 + Math.floor(i / 3) * (ch + 8);
    const card = shape('g', { transform: `rotate(${(noise(i + 2) - .5) * 14} ${x + cw / 2} ${y + ch / 2})` }, paper);
    shape('rect', { x, y, width: cw, height: ch, rx: 4, fill: ['#fbf3df', '#f6e1d3', '#e5eef0', '#f4e7b8'][i % 4] }, card);
    for (const k of [0, 1]) shape('path', { d: `M${x + 10} ${y + ch * (.55 + k * .2)}q${cw * .2} -8 ${cw * .4} 0t${cw * .4} 0`, stroke: '#b9a88a', 'stroke-width': 3, fill: 'none' }, card);
    if (i % 2) star(card, x + cw * .3, y + ch * .3, 9, GOLD);
    else shape('path', { d: `M${x + cw * .3} ${y + ch * .42}c-10-8-12-16-6-19 3-1 6 1 6 4 0-3 3-5 6-4 6 3 4 11-6 19Z`, fill: RED }, card);
    shape('circle', { cx: x + cw / 2, cy: y + 6, r: 5, fill: [RED, GREEN][i % 2] }, card);
  }
  lights(paper, [board.x, board.y + 4], [board.x + board.w, board.y + 4], 10, 8, 6);
  snowCap(paper, board.x, board.y, board.w);
}
export function giftPile({ paper }, { width, height }) {
  const base = height - 4;
  gift(paper, 8, base, 92, 80, RED, CREAM); gift(paper, 92, base, 74, 104, GREEN, GOLD); gift(paper, 156, base, 72, 58, '#8aa9ad', RED);
  for (const [x, w, h] of [[8, 92, 80], [92, 74, 104], [156, 72, 58]]) snowCap(paper, x, base - h, w, 10);
}

// ——— The Christmas fair. ———
// The big wheel's legs, platform and ticket booth; the wheel itself turns on its own board in front of them.
export const STAND = { w: 6.6, h: WHEEL.hub + .3 };
export function wheelStand({ paper }, { width, height }) {
  const unit = width / STAND.w, cx = width / 2, hub = height - WHEEL.hub * unit, ground = height - 6, foot = 2.5 * unit;
  for (const side of [-1, 1]) {
    shape('path', { d: `M${cx + side * foot} ${ground}L${cx} ${hub}`, stroke: '#e9dcc4', 'stroke-width': 24, 'stroke-linecap': 'round' }, paper);
    shape('path', { d: `M${cx + side * foot} ${ground}L${cx} ${hub}`, stroke: '#cdbb9c', 'stroke-width': 8 }, paper);
  }
  for (const t of [.35, .65]) shape('path', { d: `M${cx - foot * (1 - t)} ${ground - (ground - hub) * t}H${cx + foot * (1 - t)}`, stroke: RED, 'stroke-width': 12 }, paper);
  shape('rect', { x: cx - foot - 50, y: ground - 40, width: foot * 2 + 100, height: 40, rx: 10, fill: CREAM }, paper);
  shape('rect', { x: cx - foot - 50, y: ground - 40, width: foot * 2 + 100, height: 12, fill: RED }, paper);
  snowCap(paper, cx - foot - 50, ground - 42, foot * 2 + 100, 8);
  // Ticket booth with a striped awning, by the left foot.
  const bx = 20, bw = 120, bt = ground - 170;
  shape('rect', { x: bx, y: bt + 40, width: bw, height: ground - bt - 40, fill: '#e9d9b8' }, paper);
  shape('rect', { x: bx + 24, y: bt + 70, width: bw - 48, height: 46, rx: 8, fill: '#fbe7b0' }, paper);
  for (let i = 0; i < 4; i++) shape('path', { d: `M${bx - 10 + i * (bw + 20) / 4} ${bt + 40}h${(bw + 20) / 4}v-14a${(bw + 20) / 8} ${(bw + 20) / 8} 0 0 1 -${(bw + 20) / 4} 0Z`, fill: i % 2 ? CREAM : RED }, paper);
  shape('path', { d: `M${bx - 10} ${bt + 26}L${bx + bw / 2} ${bt}L${bx + bw + 10} ${bt + 26}Z`, fill: RED }, paper);
  snowCap(paper, bx - 10, bt + 10, bw + 20, 12);
}
export function wheel({ paper }, { width, height }) {
  const cx = width / 2, cy = height / 2, unit = width / 7.4, R = WHEEL.radius * unit, inner = R - .32 * unit;
  for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2; shape('path', { d: `M${cx} ${cy}L${cx + Math.cos(a) * R} ${cy + Math.sin(a) * R}`, stroke: '#efe4cc', 'stroke-width': 7 }, paper); }
  let truss = '';
  for (let i = 0; i <= 48; i++) { const a = i / 48 * Math.PI * 2, r = i % 2 ? R : inner; truss += `${i ? 'L' : 'M'}${cx + Math.cos(a) * r} ${cy + Math.sin(a) * r}`; }
  shape('path', { d: truss, stroke: CREAM, 'stroke-width': 5, fill: 'none' }, paper);
  shape('circle', { cx, cy, r: R, fill: 'none', stroke: '#c8574c', 'stroke-width': 16 }, paper);
  shape('circle', { cx, cy, r: inner, fill: 'none', stroke: '#c8574c', 'stroke-width': 10 }, paper);
  for (let i = 0; i < 32; i++) { const a = (i + .5) / 32 * Math.PI * 2; shape('circle', { cx: cx + Math.cos(a) * R, cy: cy + Math.sin(a) * R, r: 7, fill: BULBS[i % 4] }, paper); }
  shape('circle', { cx, cy, r: 42, fill: GOLD }, paper);
  shape('circle', { cx, cy, r: 18, fill: DEEP_RED }, paper);
}
// A cabin hanging from the rim; it hangs from its top, so it can swing a little as the wheel turns.
export function wheelCar(fill) {
  return ({ paper }, { width, height }) => {
    const cx = width / 2, top = height * .34;
    shape('path', { d: `M${cx} 0V${top}`, stroke: IRON, 'stroke-width': 8 }, paper);
    shape('rect', { x: cx - 68, y: top + 10, width: 136, height: height - top - 16, rx: 22, fill }, paper);
    shape('rect', { x: cx - 50, y: top + 26, width: 100, height: (height - top) * .4, rx: 12, fill: '#fbe7b0' }, paper);
    shape('path', { d: `M${cx - 82} ${top + 16}C${cx - 60} ${top - 30} ${cx + 60} ${top - 30} ${cx + 82} ${top + 16}Z`, fill: CREAM }, paper);
    snowCap(paper, cx - 70, top - 6, 140, 18);
  };
}
// The carousel's paper skins, wrapped round its drum, roof and fringe in cabin-scene.js (no paper filter: they tile).
export function carouselRoof({ plain }, { width, height }) {
  for (let i = 0; i < 16; i++) shape('rect', { x: i * width / 16, y: 0, width: width / 16 + 1, height, fill: i % 2 ? CREAM : RED }, plain);
  for (let i = 0; i < 32; i++) shape('circle', { cx: (i + .5) * width / 32, cy: height - 9, r: 4.5, fill: BULBS[i % 4] }, plain);
}
export function carouselFringe({ plain }, { width, height }) {
  const scallop = width / 32;
  let d = `M0 0H${width}V${height * .35}`;
  for (let i = 32; i > 0; i--) d += `A${scallop / 2} ${height * .6} 0 0 1 ${(i - 1) * scallop} ${height * .35}`;
  shape('path', { d: `${d}Z`, fill: RED }, plain);
  shape('rect', { x: 0, y: 0, width, height: height * .2, fill: GOLD }, plain);
  for (let i = 0; i < 32; i++) shape('circle', { cx: (i + .5) * scallop, cy: height * .55, r: 3, fill: CREAM }, plain);
}
export function carouselDrum({ plain }, { width, height }) {
  shape('rect', { x: 0, y: 0, width, height, fill: CREAM }, plain);
  for (let i = 0; i < 24; i++) shape('path', { d: `M${(i + .5) * width / 24} ${height * .25}l${width / 96} ${height * .25}-${width / 96} ${height * .25}-${width / 96} -${height * .25}Z`, fill: RED }, plain);
  for (const y of [0, height - 4]) shape('rect', { x: 0, y, width, height: 4, fill: GOLD }, plain);
}
// A carousel horse in profile, facing the way the ride turns; its pole is a gilt rod in 3D.
export function horse({ paper }, { width, height }) {
  const g = shape('g', { transform: `scale(${width / 260} ${height / 220})` }, paper);
  shape('path', { d: 'M74 120L50 172M96 124L92 186M166 120L194 164M184 114L218 140', stroke: '#e9dcc4', 'stroke-width': 15, 'stroke-linecap': 'round' }, g);
  for (const [x, y] of [[50, 176], [92, 190], [196, 168], [222, 142]]) shape('circle', { cx: x, cy: y, r: 8, fill: GOLD }, g);
  shape('path', { d: 'M58 98C34 92 20 112 16 136 32 124 44 118 62 114Z', fill: GOLD }, g);
  shape('ellipse', { cx: 128, cy: 104, rx: 74, ry: 34, fill: CREAM }, g);
  shape('path', { d: 'M174 94C184 62 196 40 214 34 232 30 250 40 252 56 246 62 232 60 224 62 216 78 208 98 198 112Z', fill: CREAM }, g);
  shape('path', { d: 'M212 36l4-16 9 14Z', fill: CREAM }, g);
  shape('path', { d: 'M210 30C196 34 184 54 178 78 174 94 168 102 160 106 174 82 184 50 210 30Z', fill: GOLD }, g);
  shape('circle', { cx: 232, cy: 46, r: 3.5, fill: INK }, g);
  shape('path', { d: 'M226 60L200 84', stroke: RED, 'stroke-width': 5 }, g);
  shape('path', { d: 'M104 74H160C164 92 160 110 154 118H114C106 108 102 90 104 74Z', fill: RED }, g);
  shape('path', { d: 'M104 80H160', stroke: GOLD, 'stroke-width': 6 }, g);
}
// A market stall: cocoa or gingerbread, each with a picture on its sign instead of words.
export function stall(kind) {
  const roof = kind === 'cocoa' ? RED : GREEN;
  return ({ paper }, { width, height }) => {
    const ground = height - 6, counter = height * .62, top = height * .3;
    shape('rect', { x: 30, y: top, width: width - 60, height: counter - top, fill: '#e9d9b8' }, paper);
    for (const x of [22, width - 46]) shape('rect', { x, y: top - 10, width: 24, height: ground - top + 10, fill: WOOD }, paper);
    if (kind === 'cocoa') {
      for (let i = 0; i < 4; i++) {
        const x = 70 + i * (width - 140) / 3, y = counter - 8;
        shape('path', { d: `M${x - 18} ${y - 40}h36l-4 40h-28Z`, fill: [RED, GREEN, CREAM, RED][i] }, paper);
        shape('path', { d: `M${x + 18} ${y - 32}c14 0 14 18 0 18`, stroke: [RED, GREEN, '#d9c3a0', RED][i], 'stroke-width': 5, fill: 'none' }, paper);
        shape('path', { d: `M${x - 6} ${y - 50}c-8-12 8-18 0-30M${x + 6} ${y - 50}c-8-12 8-18 0-30`, stroke: '#fffdf7', 'stroke-width': 4, fill: 'none', opacity: .9 }, paper);
      }
    } else {
      for (let i = 0; i < 5; i++) {
        const x = 64 + i * (width - 128) / 4, y = counter - 10;
        shape('path', { d: `M${x} ${y - 52}c8 0 10 6 8 10 7 0 14 2 14 7s-7 4-12 3l4 22c0 6-6 7-9 3l-5-9-5 9c-3 4-9 3-9-3l4-22c-5 1-12 2-12-3s7-7 14-7c-2-4 0-10 8-10Z`, fill: '#b9773f' }, paper);
        shape('path', { d: `M${x - 6} ${y - 30}h12`, stroke: CREAM, 'stroke-width': 3 }, paper);
      }
    }
    shape('rect', { x: 14, y: counter, width: width - 28, height: 30, rx: 6, fill: WOOD_LIT }, paper);
    shape('rect', { x: 30, y: counter + 30, width: width - 60, height: ground - counter - 30, fill: roof }, paper);
    for (let x = 52; x < width - 60; x += 46) shape('rect', { x, y: counter + 30, width: 14, height: ground - counter - 30, fill: CREAM, opacity: .35 }, paper);
    const sign = { x: width / 2 - 70, y: counter + 50, w: 140, h: 70 };
    shape('rect', { x: sign.x, y: sign.y, width: sign.w, height: sign.h, rx: 10, fill: CREAM }, paper);
    if (kind === 'cocoa') { shape('path', { d: `M${width / 2 - 22} ${sign.y + 18}h44l-6 38h-32Z`, fill: RED }, paper); shape('path', { d: `M${width / 2 + 22} ${sign.y + 26}c16 0 16 20 0 20`, stroke: RED, 'stroke-width': 5, fill: 'none' }, paper); }
    else star(paper, width / 2, sign.y + sign.h / 2, 24, '#b9773f');
    const stripes = 8, sw = (width + 20) / stripes;
    for (let i = 0; i < stripes; i++) shape('path', { d: `M${-10 + i * sw} ${top - 50}h${sw}v50a${sw / 2} ${sw / 2.6} 0 0 1 -${sw} 0Z`, fill: i % 2 ? CREAM : roof }, paper);
    shape('path', { d: `M-10 ${top - 50}L${width / 2} ${top - 120}L${width + 10} ${top - 50}Z`, fill: roof }, paper);
    snowCap(paper, -10, top - 64, width + 20, 30);
    lights(paper, [0, top + 6], [width, top + 6], 14, 10, 6);
  };
}
// Candy-striped poles with a string of pennants and lights between them.
export function bunting({ paper }, { width, height }) {
  for (const x of [14, width - 30]) {
    shape('rect', { x, y: 40, width: 16, height: height - 40, rx: 6, fill: CREAM }, paper);
    for (let y = 50; y < height - 10; y += 34) shape('path', { d: `M${x} ${y}l16 -12v14l-16 12Z`, fill: RED }, paper);
    shape('circle', { cx: x + 8, cy: 34, r: 12, fill: GOLD }, paper);
  }
  const from = [22, 52], to = [width - 22, 52], sag = 40;
  shape('path', { d: `M${from[0]} ${from[1]}Q${width / 2} ${from[1] + sag * 2} ${to[0]} ${to[1]}`, stroke: INK, 'stroke-width': 3, fill: 'none' }, paper);
  for (let i = 1; i < 16; i++) {
    const t = i / 16, x = from[0] + (to[0] - from[0]) * t, y = from[1] + sag * 4 * t * (1 - t);
    shape('path', { d: `M${x - 13} ${y}L${x + 13} ${y + 2}L${x} ${y + 34}Z`, fill: [RED, GOLD, GREEN, CREAM][i % 4] }, paper);
  }
}

export function coaster({ paper }, { width, height }) {
  const unit = width / COASTER.w, X = x => (x + COASTER.w / 2) * unit, Y = y => height - y * unit, line = TRACK.map(([x, y]) => [X(x), Y(y)]);
  // The trestle: a post every 0.45 units, ledgers and one diagonal per bay, all standing in the snow; taller bents under the hills.
  const at = x => { for (let i = 1; i < line.length; i++) if (line[i][0] >= x) { const [x0, y0] = line[i - 1], [x1, y1] = line[i]; return y0 + (y1 - y0) * (x - x0) / (x1 - x0); } return line.at(-1)[1]; };
  for (let x = X(-5.3); x <= X(5.8); x += .45 * unit) {
    const top = at(x) + 6, next = x + .45 * unit;
    shape('path', { d: `M${x} ${top}V${height}`, stroke: '#a98c6f', 'stroke-width': 5 }, paper);
    for (let y = height - .7 * unit; y > Math.max(top, at(next) + 6) + 8; y -= .7 * unit) shape('path', { d: `M${x} ${y}H${next}M${x} ${y}L${next} ${Math.min(height, y + .7 * unit)}`, stroke: '#c4ab8c', 'stroke-width': 2.6 }, paper);
  }
  const d = smooth(line);
  shape('path', { d, stroke: '#8f6a4f', 'stroke-width': 11, fill: 'none', 'stroke-linejoin': 'round' }, paper);
  shape('path', { d, stroke: '#6f513d', 'stroke-width': 11, fill: 'none', 'stroke-dasharray': '3 10' }, paper);
  // The chain up the lift hill, the one stretch the train is pulled.
  const [from, to] = COASTER.lift, chain = smooth(line.filter(([x]) => x >= X(from) && x <= X(to)));
  shape('path', { d: chain, stroke: '#3b302a', 'stroke-width': 2.4, fill: 'none', 'stroke-dasharray': '4 3' }, paper);
  shape('path', { d, stroke: SNOW, 'stroke-width': 3.5, fill: 'none', 'stroke-linecap': 'round', transform: 'translate(0 -5)' }, paper);
}
// The station the train leaves from and the snowy hill with the tunnel it runs into, on their own sheet in front of the cars
// (same units as the track), so the train rolls out from behind the station wall and disappears into the tunnel mouth.
export function coasterEnds({ paper }, { width, height }) {
  const unit = width / COASTER.w, X = x => (x + COASTER.w / 2) * unit, Y = y => height - y * unit, sx = X(-5.95);
  shape('rect', { x: sx - 62, y: Y(1.7), width: 124, height: Y(0) - Y(1.7), fill: '#e9d9b8' }, paper);
  shape('path', { d: `M${sx - 78} ${Y(1.65)}L${sx} ${Y(2.5)}L${sx + 78} ${Y(1.65)}Z`, fill: RED }, paper);
  snowCap(paper, sx - 72, Y(1.85), 144, 14);
  shape('rect', { x: sx - 40, y: Y(1.3), width: 80, height: 32, rx: 6, fill: CREAM }, paper);
  star(paper, sx, Y(1.3) + 16, 12, RED);
  const tx = X(6.05);
  shape('path', { d: `M${tx - 70} ${height}C${tx - 70} ${Y(2.5)} ${tx + 60} ${Y(2.7)} ${width} ${Y(1.8)}V${height}Z`, fill: '#eef2f3' }, paper);
  shape('path', { d: `M${tx - 34} ${height}V${Y(.9)}C${tx - 34} ${Y(1.55)} ${tx + 28} ${Y(1.55)} ${tx + 28} ${Y(.9)}V${height}Z`, fill: '#4a3f3a' }, paper);
  shape('path', { d: `M${tx - 44} ${Y(.9)}C${tx - 44} ${Y(1.7)} ${tx + 38} ${Y(1.7)} ${tx + 38} ${Y(.9)}`, stroke: '#c4ab8c', 'stroke-width': 8, fill: 'none' }, paper);
}
// A coaster car for two, the sleigh-shaped kind the Game page's coaster runs, drawn level; the scene tilts it on the track.
export function coasterCar(index) {
  return ({ paper }, { width, height }) => {
    const g = shape('g', { transform: `scale(${width / 64} ${height / 46})` }, paper), body = [RED, GREEN, GOLD][index % 3];
    for (const [cx, hat] of [[22, GREEN], [42, RED]]) {
      shape('circle', { cx, cy: 15, r: 7, fill: '#f2c9a8' }, g);
      shape('path', { d: `M${cx - 8} 11L${cx + 2} -1L${cx + 8} 11Z`, fill: hat }, g);
      shape('path', { d: `M${cx - 9} 11H${cx + 9}`, stroke: CREAM, 'stroke-width': 3.5, 'stroke-linecap': 'round' }, g);
    }
    shape('path', { d: 'M4 20H58C62 20 62 36 56 38H8C4 38 2 24 4 20Z', fill: body }, g);
    shape('path', { d: 'M6 22H56', stroke: CREAM, 'stroke-width': 3, 'stroke-linecap': 'round' }, g);
    for (const cx of [16, 46]) shape('circle', { cx, cy: 41, r: 5, fill: '#5a4a44' }, g);
  };
}
// A hot-air balloon in red, cream and gold, as on the Game page, with a small basket.
export function balloon(colours) {
  const [outer, inner, middle] = colours;
  return ({ paper }, { width, height }) => {
    const g = shape('g', { transform: `scale(${width / 200} ${height / 270})` }, paper);
    shape('path', { d: 'M100 14C40 14 8 62 18 110 26 146 70 178 84 196H116C130 178 174 146 182 110 192 62 160 14 100 14Z', fill: outer }, g);
    shape('path', { d: 'M100 14C74 14 56 62 62 110 66 146 84 178 92 196H108C116 178 134 146 138 110 144 62 126 14 100 14Z', fill: inner }, g);
    shape('path', { d: 'M100 14C92 30 88 70 92 110 94 146 98 178 100 196 102 178 106 146 108 110 112 70 108 30 100 14Z', fill: middle }, g);
    shape('path', { d: 'M86 196L84 226M114 196L116 226', stroke: '#8a6a55', 'stroke-width': 3, fill: 'none' }, g);
    shape('rect', { x: 78, y: 226, width: 44, height: 30, rx: 5, fill: '#a98c6f' }, g);
  };
}
// Far ranges cut like Home's and Game's peaks (facetedPeak), in the paler tones of distance. Each entry: [x across the board
// 0–1, peak height 0–1, half-widths left and right as a share of the board]. They sit low at both ends of the board.
const FAR_TONES = { cream: '#f3f1ec', ice: '#d9e4ea', sky: '#bcd0dd', dusk: '#a6bfd0' };
export function peaks(range) {
  return ({ paper }, { width, height }) => {
    shape('path', { d: `M0 ${height}C${width * .2} ${height * .78} ${width * .8} ${height * .78} ${width} ${height}Z`, fill: FAR_TONES.cream }, paper);
    for (const [x, top, left, right] of range) facetedPeak(paper, width * x, height * (1 - top), height, width * left, width * right, FAR_TONES);
  };
}

// ——— The winter coast. ———
// One large tile of the sea, repeated across the bay. Mostly calm water: a few broad, faint patches and a handful of short,
// uneven glints, scattered rather than in rows (rows of ripples, squeezed by distance, made a dense pattern). Everything stays
// inside the tile, so the tiles meet without seams; drawn without the paper filter for the same reason.
export function seaTile({ plain }, { width, height }) {
  shape('rect', { x: 0, y: 0, width, height, fill: SEA }, plain);
  for (const [x, y, rx, ry, fill] of [[.3, .32, .2, .09, SEA_LIGHT], [.72, .7, .18, .08, SEA_DEEP], [.62, .2, .12, .05, SEA_DEEP], [.2, .78, .14, .06, SEA_LIGHT]]) shape('ellipse', { cx: width * x, cy: height * y, rx: width * rx, ry: height * ry, fill, opacity: .22 }, plain);
  for (const [x, y, w] of [[.14, .2, .1], [.52, .44, .06], [.34, .62, .08], [.78, .3, .07], [.66, .86, .09], [.1, .52, .05]]) {
    const x0 = width * x, y0 = height * y, run = width * w;
    shape('path', { d: `M${x0} ${y0}q${run / 2} -${height * .008} ${run} 0`, stroke: '#cfe0ea', 'stroke-width': height * .006, fill: 'none', 'stroke-linecap': 'round', opacity: .55 }, plain);
  }
}
// A long paper wave standing in the water, parallel to the shore; it rocks and slides gently (cabin-scene.js). Its body is
// the sea's own colour; its crests come at uneven spacing and heights (a regular row of them read as a pattern), only the
// tallest carry a little foam, and they shrink to nothing toward both ends, so the wave melts into the water.
export function wave(level) {
  const crest = [SEA_DEEP, SEA, SEA_LIGHT][level];
  return ({ paper }, { width, height }) => {
    const fade = width * .16, lift = x => Math.max(0, Math.min(1, x / fade, (width - x) / fade)), peaks = [];
    for (let x = 0, i = level * 7; x < width; i++) { const span = height * (3.2 + noise(i + 30) * 3.4); peaks.push([x, span, .35 + noise(i + 50) * .65]); x += span; }
    const top = x => { const [start, span, size] = peaks.findLast(([at]) => at <= x) ?? peaks[0], phase = (x - start) / span; return height - height * (.16 + .46 * size * Math.pow(Math.sin(phase * Math.PI), 2)) * lift(x); };
    let d = `M0 ${height}`;
    for (let x = 0; x <= width; x += height / 4) d += `L${x.toFixed(1)} ${top(x).toFixed(1)}`;
    shape('path', { d: `${d}L${width} ${height}Z`, fill: SEA }, paper);
    shape('path', { d: d.replace(`M0 ${height}`, `M0 ${top(0)}`), fill: 'none', stroke: crest, 'stroke-width': 3, opacity: .5 }, paper);
    for (const [start, span, size] of peaks) {
      const x = start + span / 2, scale = size * lift(x); if (scale < .7) continue;
      const y = top(x), w = span * .18 * scale;
      shape('path', { d: `M${x - w} ${y + 3}C${x - w * .4} ${y - 5 * scale} ${x + w * .4} ${y - 5 * scale} ${x + w} ${y + 3}C${x + w * .3} ${y} ${x - w * .3} ${y} ${x - w} ${y + 3}Z`, fill: FOAM }, paper);
    }
  };
}
const rock = (parent, x, base, w, h, tone) => {
  shape('path', { d: `M${x} ${base}C${x} ${base - h * .7} ${x + w * .2} ${base - h} ${x + w * .5} ${base - h}C${x + w * .85} ${base - h} ${x + w} ${base - h * .6} ${x + w} ${base}Z`, fill: tone }, parent);
  shape('path', { d: `M${x + w * .15} ${base - h * .72}C${x + w * .3} ${base - h * 1.04} ${x + w * .75} ${base - h * 1.04} ${x + w * .88} ${base - h * .62}C${x + w * .6} ${base - h * .78} ${x + w * .4} ${base - h * .7} ${x + w * .15} ${base - h * .72}Z`, fill: SNOW }, parent);
};
const waterline = (parent, width, height, depth) => {
  shape('path', { d: `M0 ${height - depth}C${width * .25} ${height - depth - 8} ${width * .5} ${height - depth + 6} ${width * .75} ${height - depth - 4}S${width} ${height - depth} ${width} ${height - depth}V${height}H0Z`, fill: SEA }, parent);
  shape('path', { d: `M${width * .05} ${height - depth}C${width * .3} ${height - depth - 10} ${width * .6} ${height - depth + 4} ${width * .95} ${height - depth - 2}`, stroke: FOAM, 'stroke-width': 7, fill: 'none', 'stroke-linecap': 'round' }, parent);
};
export function islet({ paper }, { width, height }) {
  rock(paper, width * .05, height - 20, width * .5, height * .7, ROCK_DARK);
  rock(paper, width * .38, height - 20, width * .56, height * .9, ROCK);
  rock(paper, width * .7, height - 20, width * .26, height * .45, ROCK_DARK);
  waterline(paper, width, height, 34);
}
export function lighthouse({ paper, svg }, { width, height }) {
  const cx = width / 2, base = height - 10, top = LIGHT.lamp + 46, room = { y: LIGHT.lamp - 40, h: 80 };
  const tower = `M${cx - 74} ${base}L${cx - 46} ${top}H${cx + 46}L${cx + 74} ${base}Z`;
  shape('path', { d: tower, fill: CREAM }, paper);
  const id = 'lighthouse-bands';
  shape('path', { d: tower }, shape('clipPath', { id }, shape('defs', {}, svg)));
  const bands = shape('g', { 'clip-path': `url(#${id})` }, paper);
  for (let i = 0; i < 5; i += 2) shape('rect', { x: 0, y: top + i * (base - top) / 5, width, height: (base - top) / 5, fill: '#c8574c' }, bands);
  shape('path', { d: `M${cx + 20} ${base}L${cx + 14} ${top}H${cx + 46}L${cx + 74} ${base}Z`, fill: INK, opacity: .12 }, paper);
  shape('path', { d: `M${cx - 18} ${base}V${base - 60}a18 18 0 0 1 36 0V${base}Z`, fill: DEEP_GREEN }, paper);
  for (const y of [.3, .55]) shape('rect', { x: cx - 9, y: top + (base - top) * y, width: 18, height: 26, rx: 8, fill: '#fbe7b0' }, paper);
  shape('rect', { x: cx - 64, y: top - 10, width: 128, height: 16, rx: 4, fill: INK }, paper);
  for (let x = cx - 58; x <= cx + 58; x += 14) shape('path', { d: `M${x} ${top - 10}v-26`, stroke: INK, 'stroke-width': 4 }, paper);
  shape('path', { d: `M${cx - 62} ${top - 36}H${cx + 62}`, stroke: INK, 'stroke-width': 5 }, paper);
  shape('rect', { x: cx - 36, y: room.y, width: 72, height: room.h, fill: '#fbe7b0' }, paper);
  shape('path', { d: `M${cx - 36} ${room.y}V${room.y + room.h}M${cx} ${room.y}V${room.y + room.h}M${cx + 36} ${room.y}V${room.y + room.h}`, stroke: INK, 'stroke-width': 6 }, paper);
  shape('path', { d: `M${cx - 44} ${room.y}C${cx - 44} ${room.y - 50} ${cx + 44} ${room.y - 50} ${cx + 44} ${room.y}Z`, fill: '#c8574c' }, paper);
  shape('path', { d: `M${cx} ${room.y - 36}V${room.y - 66}`, stroke: INK, 'stroke-width': 5 }, paper);
  shape('circle', { cx, cy: room.y - 70, r: 7, fill: GOLD }, paper);
  snowCap(paper, cx - 46, room.y - 34, 92, 12);
}
export function boat({ paper }, { width, height }) {
  const cx = width / 2, deck = height - 70;
  shape('path', { d: `M${cx} ${deck}V40`, stroke: WOOD, 'stroke-width': 8 }, paper);
  shape('path', { d: `M${cx + 6} 50L${cx + 86} ${deck - 18}H${cx + 6}Z`, fill: CREAM }, paper);
  shape('path', { d: `M${cx - 6} 70L${cx - 70} ${deck - 18}H${cx - 6}Z`, fill: '#f1e4c8' }, paper);
  shape('path', { d: `M${cx + 6} ${deck - 60}L${cx + 52} ${deck - 60}`, stroke: RED, 'stroke-width': 10 }, paper);
  shape('path', { d: `M${cx} 40l30 10-30 10Z`, fill: RED }, paper);
  shape('path', { d: `M${cx - 100} ${deck}H${cx + 100}L${cx + 76} ${deck + 42}H${cx - 80}Z`, fill: RED }, paper);
  shape('path', { d: `M${cx - 96} ${deck + 8}H${cx + 96}`, stroke: CREAM, 'stroke-width': 6 }, paper);
  waterline(paper, width, height, 30);
}
export function rocks({ paper }, { width, height }) {
  rock(paper, 6, height - 16, width * .46, height * .8, ROCK);
  rock(paper, width * .4, height - 16, width * .34, height * .55, ROCK_DARK);
  rock(paper, width * .68, height - 16, width * .3, height * .7, ROCK);
  waterline(paper, width, height, 22);
}
export function gull({ paper }, { width, height }) {
  const cx = width / 2, cy = height * .6;
  shape('path', { d: `M4 ${height * .25}C${cx * .5} ${cy - 18} ${cx * .8} ${cy - 10} ${cx} ${cy}C${cx * 1.2} ${cy - 10} ${cx * 1.5} ${cy - 18} ${width - 4} ${height * .25}C${cx * 1.5} ${cy - 4} ${cx * 1.2} ${cy + 6} ${cx} ${cy + 10}C${cx * .8} ${cy + 6} ${cx * .5} ${cy - 4} 4 ${height * .25}Z`, fill: '#fbfaf6' }, paper);
  for (const x of [8, width - 8]) shape('circle', { cx: x, cy: height * .27, r: 5, fill: '#6f7d86' }, paper);
}
// The signpost to the rest of the world: one arrow for each country on the Intro page's map, each carrying a little flag.
const FLAGS = [
  (g, x, y) => { shape('rect', { x, y, width: 44, height: 28, fill: '#3b6aa8' }, g); shape('path', { d: `M${x} ${y + 14}h44M${x + 16} ${y}v28`, stroke: SNOW, 'stroke-width': 8 }, g); shape('path', { d: `M${x} ${y + 14}h44M${x + 16} ${y}v28`, stroke: '#c8443c', 'stroke-width': 4 }, g); },
  (g, x, y) => { shape('rect', { x, y, width: 44, height: 28, fill: '#c8443c' }, g); shape('rect', { x, y, width: 22, height: 14, fill: '#2d4f9a' }, g); shape('circle', { cx: x + 11, cy: y + 7, r: 4, fill: SNOW }, g); },
  (g, x, y) => { shape('rect', { x, y, width: 44, height: 28, fill: SNOW }, g); shape('circle', { cx: x + 22, cy: y + 14, r: 8, fill: '#c8443c' }, g); },
  (g, x, y) => { shape('rect', { x, y, width: 44, height: 28, fill: '#2d4f9a' }, g); for (const [dx, dy] of [[30, 7], [36, 14], [24, 15], [30, 22]]) shape('circle', { cx: x + dx, cy: y + dy, r: 2.6, fill: '#c8443c' }, g); },
  (g, x, y) => { shape('rect', { x, y, width: 44, height: 28, fill: SNOW }, g); for (const dx of [0, 33]) shape('rect', { x: x + dx, y, width: 11, height: 28, fill: '#c8443c' }, g); shape('path', { d: `M${x + 22} ${y + 5}l4 7 4-2-2 8h-12l-2-8 4 2Z`, fill: '#c8443c' }, g); },
  (g, x, y) => { shape('rect', { x, y, width: 44, height: 28, fill: '#3e8a55' }, g); shape('path', { d: `M${x + 22} ${y + 3}L${x + 40} ${y + 14} ${x + 22} ${y + 25} ${x + 4} ${y + 14}Z`, fill: '#f2c94c' }, g); shape('circle', { cx: x + 22, cy: y + 14, r: 6, fill: '#2d4f9a' }, g); },
];
export function worldSign({ paper }, { width, height }) {
  const cx = width / 2;
  shape('rect', { x: cx - 12, y: 40, width: 24, height: height - 40, fill: WOOD }, paper);
  FLAGS.forEach((flag, i) => {
    const y = 66 + i * 58, dir = i % 2 ? -1 : 1, end = cx + dir * 124, start = cx - dir * 22;
    shape('path', { d: `M${start} ${y}H${end - dir * 22}L${end} ${y + 20}L${end - dir * 22} ${y + 40}H${start}Z`, fill: i % 2 ? WOOD_LIT : CORK }, paper);
    flag(paper, dir > 0 ? cx + 30 : cx - 74, y + 6);
  });
  snowCap(paper, cx - 18, 40, 36, 14);
}
// Postcards from those places, pinned to a board: an aurora, a lantern, a strawberry cake, a summer tree in flower.
export function postcards({ paper }, { width, height }) {
  for (const x of [34, width - 58]) shape('rect', { x, y: 60, width: 24, height: height - 60, fill: WOOD }, paper);
  const board = { x: 14, y: 40, w: width - 28, h: height * .66 };
  shape('rect', { x: board.x, y: board.y, width: board.w, height: board.h, rx: 12, fill: WOOD_LIT }, paper);
  shape('rect', { x: board.x + 12, y: board.y + 12, width: board.w - 24, height: board.h - 24, rx: 8, fill: CORK }, paper);
  const cw = (board.w - 56) / 2, ch = (board.h - 56) / 2;
  const scenes = [
    (x, y) => { shape('rect', { x, y, width: cw, height: ch, fill: '#2f4a68' }, paper); shape('path', { d: `M${x} ${y + ch * .45}q${cw * .25} -${ch * .3} ${cw * .5} 0t${cw * .5} 0`, stroke: '#7fce9a', 'stroke-width': 9, fill: 'none', opacity: .9 }, paper); shape('path', { d: `M${x} ${y + ch}V${y + ch * .8}Q${x + cw / 2} ${y + ch * .7} ${x + cw} ${y + ch * .8}V${y + ch}Z`, fill: SNOW }, paper); },
    (x, y) => { shape('rect', { x, y, width: cw, height: ch, fill: '#8a3a36' }, paper); shape('ellipse', { cx: x + cw / 2, cy: y + ch * .5, rx: cw * .2, ry: ch * .28, fill: '#f2a541' }, paper); shape('path', { d: `M${x + cw / 2} ${y + ch * .22}V${y + ch * .1}`, stroke: GOLD, 'stroke-width': 4 }, paper); },
    (x, y) => { shape('rect', { x, y, width: cw, height: ch, fill: '#f6e1d3' }, paper); shape('rect', { x: x + cw * .25, y: y + ch * .45, width: cw * .5, height: ch * .38, rx: 6, fill: SNOW }, paper); shape('circle', { cx: x + cw / 2, cy: y + ch * .4, r: 8, fill: '#c8443c' }, paper); },
    (x, y) => { shape('rect', { x, y, width: cw, height: ch, fill: '#cfe3ee' }, paper); shape('circle', { cx: x + cw * .78, cy: y + ch * .25, r: 10, fill: '#f6d98c' }, paper); shape('path', { d: `M${x + cw * .4} ${y + ch}V${y + ch * .6}`, stroke: WOOD, 'stroke-width': 6 }, paper); shape('circle', { cx: x + cw * .4, cy: y + ch * .5, r: ch * .26, fill: '#3f6653' }, paper); for (let k = 0; k < 6; k++) shape('circle', { cx: x + cw * .4 + Math.cos(k) * ch * .18, cy: y + ch * .5 + Math.sin(k * 2) * ch * .14, r: 4, fill: '#d9614f' }, paper); },
  ];
  scenes.forEach((draw, i) => {
    const x = board.x + 22 + (i % 2) * (cw + 12), y = board.y + 22 + Math.floor(i / 2) * (ch + 12);
    shape('rect', { x: x - 5, y: y - 5, width: cw + 10, height: ch + 10, rx: 3, fill: SNOW }, paper);
    draw(x, y);
    shape('rect', { x: x + cw - 18, y: y + 4, width: 14, height: 16, fill: CREAM, stroke: RED, 'stroke-width': 2 }, paper);
    shape('circle', { cx: x + cw / 2, cy: y - 2, r: 5, fill: [RED, GREEN][i % 2] }, paper);
  });
  snowCap(paper, board.x, board.y, board.w);
}
export function dinghy({ paper }, { width, height }) {
  const base = height - 6;
  shape('path', { d: `M14 ${base}C20 ${base - 70} ${width - 40} ${base - 80} ${width - 10} ${base}Z`, fill: RED }, paper);
  shape('path', { d: `M30 ${base - 24}C${width * .35} ${base - 52} ${width * .7} ${base - 56} ${width - 22} ${base - 20}`, stroke: CREAM, 'stroke-width': 6, fill: 'none' }, paper);
  shape('path', { d: `M24 ${base - 30}C${width * .3} ${base - 84} ${width * .7} ${base - 92} ${width - 16} ${base - 22}C${width * .7} ${base - 66} ${width * .3} ${base - 60} 24 ${base - 30}Z`, fill: SNOW }, paper);
  shape('path', { d: `M${width * .2} ${base}L${width * .75} ${base - 40}`, stroke: WOOD_LIT, 'stroke-width': 8, 'stroke-linecap': 'round' }, paper);
}
export function beachGrass({ paper }, { width, height }) {
  for (let i = 0; i < 14; i++) {
    const x = 20 + noise(i + 3) * (width - 40), lean = (noise(i + 8) - .5) * 60, tall = height * (.5 + noise(i + 5) * .45);
    shape('path', { d: `M${x} ${height}Q${x + lean * .3} ${height - tall * .6} ${x + lean} ${height - tall}`, stroke: ['#b9a77a', '#a8956a', '#c9b78c'][i % 3], 'stroke-width': 6, fill: 'none', 'stroke-linecap': 'round' }, paper);
  }
  shape('path', { d: `M0 ${height}C${width * .2} ${height - 30} ${width * .6} ${height - 22} ${width} ${height - 12}V${height}Z`, fill: SNOW }, paper);
}

// ——— The edges of the turn. ———
// A fisherman's boathouse at the water's edge: on stilts, a round window, a life ring by the door, snow on the roof.
export function boathouse({ paper }, { width, height }) {
  const ground = height - 10, eave = height * .42, left = width * .14, right = width * .86, cx = width / 2, floor = ground - 46;
  for (const x of [left + 14, cx, right - 14]) shape('rect', { x: x - 7, y: floor, width: 14, height: 46, fill: '#6f513d' }, paper);
  shape('rect', { x: left, y: eave, width: right - left, height: floor - eave, fill: '#7fa3a8' }, paper);
  for (let y = eave + 22; y < floor - 4; y += 22) shape('path', { d: `M${left} ${y}H${right}`, stroke: '#6b8f94', 'stroke-width': 3 }, paper);
  shape('path', { d: `M${left - 24} ${eave + 8}L${cx} ${height * .12}L${right + 24} ${eave + 8}Z`, fill: '#4a3f3a' }, paper);
  shape('path', { d: `M${left - 26} ${eave + 8}L${cx} ${height * .1}L${right + 26} ${eave + 8}C${right - 20} ${eave - 12} ${cx + 30} ${height * .22} ${cx} ${height * .2}C${cx - 30} ${height * .22} ${left + 20} ${eave - 12} ${left - 26} ${eave + 8}Z`, fill: SNOW }, paper);
  shape('rect', { x: cx - 30, y: eave + 46, width: 60, height: floor - eave - 46, rx: 6, fill: '#4f6a62' }, paper);
  shape('circle', { cx: (left + cx) / 2 - 6, cy: eave + 62, r: 20, fill: '#fbe7b0', stroke: CREAM, 'stroke-width': 6 }, paper);
  shape('circle', { cx: right - 40, cy: eave + 66, r: 22, fill: 'none', stroke: RED, 'stroke-width': 12 }, paper);
  shape('circle', { cx: right - 40, cy: eave + 66, r: 22, fill: 'none', stroke: CREAM, 'stroke-width': 12, 'stroke-dasharray': '17 17.6' }, paper);
  shape('path', { d: `M0 ${height}C${width * .2} ${ground - 18} ${width * .5} ${ground - 6} ${width} ${ground - 14}V${height}Z`, fill: SNOW }, paper);
}
// A short wooden landing stage out into the water, with a mooring post and its rope.
export function dock({ paper }, { width, height }) {
  const deck = height * .42;
  for (let x = 30; x < width; x += 90) shape('rect', { x: x - 9, y: deck, width: 18, height: height - deck, fill: '#6f513d' }, paper);
  shape('rect', { x: 0, y: deck - 22, width, height: 26, rx: 4, fill: '#a8774d' }, paper);
  for (let x = 34; x < width; x += 34) shape('path', { d: `M${x} ${deck - 22}v26`, stroke: '#8f6340', 'stroke-width': 2 }, paper);
  snowCap(paper, 0, deck - 24, width, 8);
  shape('rect', { x: width - 46, y: deck - 72, width: 16, height: 54, rx: 4, fill: '#6f513d' }, paper);
  shape('path', { d: `M${width - 44} ${deck - 52}C${width - 70} ${deck - 40} ${width - 84} ${deck - 20} ${width - 96} ${deck + 4}`, stroke: '#c9a46a', 'stroke-width': 4, fill: 'none' }, paper);
  waterline(paper, width, height, height * .3);
}
export function buoy({ paper }, { width, height }) {
  const cx = width / 2;
  shape('path', { d: `M${cx - 30} ${height - 40}C${cx - 30} ${height * .35} ${cx + 30} ${height * .35} ${cx + 30} ${height - 40}Z`, fill: RED }, paper);
  shape('rect', { x: cx - 31, y: height * .58, width: 62, height: 14, fill: CREAM }, paper);
  shape('path', { d: `M${cx} ${height * .44}V${height * .1}`, stroke: INK, 'stroke-width': 4 }, paper);
  shape('path', { d: `M${cx} ${height * .1}l22 8-22 8Z`, fill: GOLD }, paper);
  waterline(paper, width, height, 34);
}
// A grey seal resting on a small ice floe, head up toward the shore.
export function sealFloe({ paper }, { width, height }) {
  shape('path', { d: `M10 ${height - 34}L${width * .2} ${height - 58}L${width * .55} ${height - 62}L${width * .9} ${height - 54}L${width - 8} ${height - 36}L${width * .7} ${height - 26}L${width * .3} ${height - 24}Z`, fill: '#f4f8f9' }, paper);
  shape('path', { d: `M10 ${height - 34}L${width * .3} ${height - 24}L${width * .7} ${height - 26}L${width - 8} ${height - 36}V${height - 22}L${width * .7} ${height - 12}L${width * .3} ${height - 10}L10 ${height - 20}Z`, fill: '#c9dbe5' }, paper);
  const by = height - 56, grey = '#8d99a0';
  shape('path', { d: `M${width * .3} ${by}C${width * .3} ${by - 40} ${width * .62} ${by - 46} ${width * .74} ${by - 18}C${width * .8} ${by - 6} ${width * .86} ${by + 2} ${width * .9} ${by - 4}L${width * .88} ${by + 6}C${width * .7} ${by + 8} ${width * .45} ${by + 8} ${width * .3} ${by}Z`, fill: grey }, paper);
  shape('path', { d: `M${width * .5} ${by}l-14 10 22 -2Z`, fill: '#77838a' }, paper);
  shape('circle', { cx: width * .3, cy: by - 24, r: 22, fill: grey }, paper);
  shape('ellipse', { cx: width * .23, cy: by - 18, rx: 11, ry: 8, fill: '#a9b3b9' }, paper);
  shape('circle', { cx: width * .29, cy: by - 31, r: 3, fill: INK }, paper);
  shape('circle', { cx: width * .19, cy: by - 21, r: 3.4, fill: INK }, paper);
  waterline(paper, width, height, 20);
}
// Fishermen's barrels and a crate of fish waiting by the boathouse.
export function barrels({ paper }, { width, height }) {
  const base = height - 6;
  for (const [x, w, h] of [[16, 80, 120], [104, 74, 100]]) {
    shape('path', { d: `M${x} ${base}C${x - 9} ${base - h * .5} ${x - 9} ${base - h * .5} ${x} ${base - h}H${x + w}C${x + w + 9} ${base - h * .5} ${x + w + 9} ${base - h * .5} ${x + w} ${base}Z`, fill: '#a8774d' }, paper);
    for (const t of [.22, .78]) shape('path', { d: `M${x - 4} ${base - h * t}H${x + w + 4}`, stroke: '#3b302a', 'stroke-width': 5 }, paper);
    shape('ellipse', { cx: x + w / 2, cy: base - h, rx: w / 2 + 2, ry: 9, fill: SNOW }, paper);
  }
  const cx = 196, top = base - 56;
  shape('rect', { x: cx, y: top, width: 92, height: 56, rx: 4, fill: '#c39466' }, paper);
  shape('path', { d: `M${cx} ${top + 28}h92`, stroke: '#a8774d', 'stroke-width': 4 }, paper);
  for (const [x, tilt] of [[cx + 26, -12], [cx + 62, 10]]) {
    const fish = shape('g', { transform: `rotate(${tilt} ${x} ${top})` }, paper);
    shape('ellipse', { cx: x, cy: top - 4, rx: 22, ry: 8, fill: '#9fb5c0' }, fish);
    shape('path', { d: `M${x + 20} ${top - 4}l12 -8v16Z`, fill: '#9fb5c0' }, fish);
    shape('circle', { cx: x - 14, cy: top - 6, r: 2, fill: INK }, fish);
  }
}
// A skater gliding with arms out, facing right; the scene flips her when she turns the other way round the pond.
export function skater(colour) {
  return ({ paper }, { width, height }) => {
    const g = shape('g', { transform: `scale(${width / 120} ${height / 185})` }, paper);
    shape('path', { d: 'M54 120L46 166M66 120L84 160', stroke: '#3f5a6e', 'stroke-width': 10, 'stroke-linecap': 'round' }, g);
    shape('path', { d: 'M32 172H62M72 166L100 161', stroke: '#c9d6dc', 'stroke-width': 4, 'stroke-linecap': 'round' }, g);
    shape('path', { d: 'M42 124C38 98 44 72 60 68 76 72 82 98 78 124Z', fill: colour }, g);
    shape('path', { d: 'M46 86L20 100M74 86L102 74', stroke: colour, 'stroke-width': 9, 'stroke-linecap': 'round' }, g);
    for (const [x, y] of [[18, 101], [104, 73]]) shape('circle', { cx: x, cy: y, r: 6, fill: CREAM }, g);
    shape('path', { d: 'M48 72C56 76 66 76 74 72V80C66 84 56 84 48 80Z', fill: GREEN }, g);
    shape('path', { d: 'M66 80L77 100 70 101 62 82Z', fill: DEEP_GREEN }, g);
    shape('circle', { cx: 61, cy: 54, r: 15, fill: '#f2c9a8' }, g);
    shape('circle', { cx: 67, cy: 52, r: 1.8, fill: INK }, g);
    shape('circle', { cx: 69, cy: 59, r: 3, fill: '#e9a08f' }, g);
    shape('path', { d: 'M45 50C45 32 77 32 77 50Z', fill: colour === RED ? GREEN : RED }, g);
    shape('circle', { cx: 61, cy: 32, r: 6, fill: CREAM }, g);
  };
}
// A wooden sled with a sack of presents, left in the snow by the pond.
export function sledSacks({ paper }, { width, height }) {
  const base = height - 10;
  shape('path', { d: `M16 ${base}H${width - 40}C${width - 16} ${base} ${width - 10} ${base - 20} ${width - 14} ${base - 34}`, stroke: '#a9845b', 'stroke-width': 7, fill: 'none', 'stroke-linecap': 'round' }, paper);
  shape('path', { d: `M50 ${base}V${base - 22}M${width - 70} ${base}V${base - 22}`, stroke: '#a9845b', 'stroke-width': 6 }, paper);
  shape('rect', { x: 24, y: base - 36, width: width - 70, height: 16, rx: 5, fill: RED }, paper);
  shape('path', { d: `M70 ${base - 36}C50 ${base - 70} 70 ${base - 110} 110 ${base - 104}C150 ${base - 110} 168 ${base - 70} 150 ${base - 36}Z`, fill: '#d9c3a0' }, paper);
  shape('path', { d: `M100 ${base - 100}l10 -12 10 12`, stroke: RED, 'stroke-width': 5, fill: 'none' }, paper);
  gift(paper, 158, base - 36, 44, 36, GREEN, GOLD); gift(paper, 196, base - 36, 34, 26, RED, CREAM);
  snowCap(paper, 76, base - 104, 70, 10);
}
// A low snow-block fort with a pile of snowballs ready beside it.
export function snowFort({ paper }, { width, height }) {
  const base = height - 6;
  for (let row = 0; row < 2; row++) for (let col = 0; col < 3 - row; col++) shape('rect', { x: 14 + col * 46 + row * 23, y: base - 30 - row * 28, width: 44, height: 28, rx: 8, fill: SNOW, stroke: '#d6e3e9', 'stroke-width': 3 }, paper);
  shape('path', { d: `M84 ${base - 58}V${base - 100}`, stroke: '#8a6a55', 'stroke-width': 4 }, paper);
  shape('path', { d: `M84 ${base - 100}l28 9-28 9Z`, fill: RED }, paper);
  for (const [x, y] of [[178, base - 14], [204, base - 14], [191, base - 36]]) shape('circle', { cx: x, cy: y, r: 13, fill: SNOW, stroke: '#d6e3e9', 'stroke-width': 3 }, paper);
}
// The fair's candy-striped ticket booth.
export function ticketBooth({ paper }, { width, height }) {
  const base = height - 6, top = height * .32, cx = width / 2;
  shape('rect', { x: 24, y: top, width: width - 48, height: base - top, fill: CREAM }, paper);
  for (let x = 24; x < width - 24; x += 28) shape('rect', { x, y: top + 110, width: 14, height: base - top - 110, fill: RED }, paper);
  shape('rect', { x: cx - 44, y: top + 24, width: 88, height: 62, rx: 8, fill: '#fbe7b0', stroke: '#8f5a3c', 'stroke-width': 6 }, paper);
  shape('rect', { x: cx - 52, y: top + 88, width: 104, height: 12, rx: 4, fill: '#8f5a3c' }, paper);
  shape('path', { d: `M10 ${top}C10 ${top - 84} ${width - 10} ${top - 84} ${width - 10} ${top}Z`, fill: RED }, paper);
  for (let i = 0; i < 6; i++) { const x = 10 + i * (width - 20) / 6, w = (width - 20) / 6; shape('path', { d: `M${x} ${top}a${w / 2} ${w / 2.4} 0 0 0 ${w} 0Z`, fill: i % 2 ? RED : CREAM }, paper); }
  snowCap(paper, 16, top - 62, width - 32, 18);
  shape('path', { d: `M${cx} ${top - 64}V${top - 110}`, stroke: '#8a6a55', 'stroke-width': 4 }, paper);
  shape('path', { d: `M${cx} ${top - 110}l26 8-26 8Z`, fill: GREEN }, paper);
  star(paper, cx, top + 55, 14, RED);
}

// ——— The ski mountain behind the village, painted in the haze of distance (it is drawn without fog). ———
export function skiMountain({ paper }, { width, height }) {
  const X = x => (x + SKI.w / 2) * width / SKI.w, Y = y => height - y * height / SKI.h, P = ([x, y]) => [X(x), Y(y)];
  const ridge = RIDGE.map(P);
  shape('path', { d: `${smooth(ridge)}V${height}H${ridge[0][0]}Z`, fill: '#eef2f4' }, paper);
  // The sides facing away from the morning sun, in a cool blue shade.
  for (const [peak, foot] of [[[-2, 10.7], [3.4, 0]], [[9, 8.4], [15, 0]], [[-6, 8.6], [-4.4, 4]]]) shape('path', { d: `M${X(peak[0])} ${Y(peak[1])}C${X(peak[0] + 1.6)} ${Y(peak[1] * .6)} ${X(foot[0] - 1)} ${Y(foot[1] + 1.5)} ${X(foot[0])} ${Y(foot[1])}H${X(peak[0] + .6)}C${X(peak[0] + .8)} ${Y(peak[1] * .5)} ${X(peak[0] + .2)} ${Y(peak[1] * .8)} ${X(peak[0])} ${Y(peak[1])}Z`, fill: '#d5e0e8', opacity: .85 }, paper);
  for (const run of RUNS) {
    const d = smooth(run.map(P));
    shape('path', { d, stroke: '#dde7ee', 'stroke-width': 46, fill: 'none', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, paper);
    shape('path', { d, stroke: '#fbfcfc', 'stroke-width': 32, fill: 'none', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, paper);
  }
  // A few stands of fir on the slopes, irregular and far apart.
  for (const [x, y, size] of [[-12, 2.4, 1.3], [-11.2, 2, 1], [-7.4, 4.2, 1.2], [1.6, 3.6, 1.4], [2.4, 3.1, 1], [5, 2.2, 1.2], [12.4, 3, 1.3], [13, 2.4, .9], [-15, 1, 1.1]]) pine(paper, X(x), Y(y), size * height / SKI.h, '#9fb8b0', '#f4f7f8');
  // The chair lift: a cable on towers from the lodge to the ridge.
  const [fx, fy] = P(LIFT.from), [tx, ty] = P(LIFT.to);
  for (let i = 1; i < 4; i++) { const x = fx + (tx - fx) * i / 4, y = fy + (ty - fy) * i / 4; shape('path', { d: `M${x} ${y}V${y + 60}M${x - 14} ${y}H${x + 14}`, stroke: '#7d8a92', 'stroke-width': 5 }, paper); }
  shape('path', { d: `M${fx} ${fy}L${tx} ${ty}`, stroke: '#6f7d86', 'stroke-width': 3 }, paper);
  roofHouse(paper, tx, ty + 30, 70, 42, { wall: '#ecdcc0', roof: '#a8564c' });
  roofHouse(paper, X(-14.4), height - 4, 170, 90, { wall: '#ecdcc0', roof: '#a8564c', chimney: true });
  roofHouse(paper, fx, height - 4, 80, 48, { wall: '#e4d0b0', roof: '#8a6a55' });
  for (const [x, colour] of [[-9.2, RED], [-8.4, GREEN], [-7.6, GOLD]]) { shape('path', { d: `M${X(x)} ${height - 4}V${height - 60}`, stroke: '#7d8a92', 'stroke-width': 3 }, paper); shape('path', { d: `M${X(x)} ${height - 60}l22 8-22 8Z`, fill: colour }, paper); }
  shape('path', { d: `M0 ${height}V${height - 24}C${width * .3} ${height - 36} ${width * .7} ${height - 20} ${width} ${height - 30}V${height}Z`, fill: '#f5efe8' }, paper);
}
// A skier crouched over her skis, facing right; the scene flips her at each turn of the run.
export function skier({ paper }, { width, height }) {
  const g = shape('g', { transform: `scale(${width / 120} ${height / 150})` }, paper);
  shape('path', { d: 'M8 132L112 122', stroke: '#3b6aa8', 'stroke-width': 7, 'stroke-linecap': 'round' }, g);
  shape('path', { d: 'M44 126L54 96 70 100 74 124', stroke: '#3b302a', 'stroke-width': 11, fill: 'none', 'stroke-linejoin': 'round' }, g);
  shape('path', { d: 'M46 98C40 74 48 52 66 48 82 46 88 62 84 80 80 94 70 100 46 98Z', fill: RED }, g);
  shape('path', { d: 'M62 52C70 56 80 58 88 54', stroke: CREAM, 'stroke-width': 7, 'stroke-linecap': 'round' }, g);
  shape('circle', { cx: 78, cy: 34, r: 15, fill: '#f2cda9' }, g);
  shape('path', { d: 'M62 30C62 12 92 10 94 30Z', fill: GREEN }, g);
  shape('circle', { cx: 78, cy: 12, r: 7, fill: CREAM }, g);
  shape('path', { d: 'M82 66L106 112M50 70L28 114', stroke: '#6f7d86', 'stroke-width': 4 }, g);
}
export function gondola({ paper }, { width, height }) {
  const cx = width / 2, top = height * .3;
  shape('path', { d: `M${cx} 0V${top}`, stroke: '#6f7d86', 'stroke-width': 6 }, paper);
  shape('rect', { x: 8, y: top, width: width - 16, height: height - top - 6, rx: 14, fill: RED }, paper);
  shape('rect', { x: 18, y: top + 12, width: width - 36, height: (height - top) * .4, rx: 6, fill: '#fbe7b0' }, paper);
}

// ——— Signs that tie the village together. ———
// Toward the mountain, a big painted board: a flying sleigh with a gift and two matching cards, the Game page's two games.
export function gameSign({ paper }, { width, height }) {
  for (const x of [40, width - 64]) shape('rect', { x, y: 60, width: 24, height: height - 60, fill: WOOD }, paper);
  const board = { x: 12, y: 30, w: width - 24, h: height * .6 };
  shape('rect', { x: board.x, y: board.y, width: board.w, height: board.h, rx: 16, fill: WOOD_LIT }, paper);
  shape('rect', { x: board.x + 14, y: board.y + 14, width: board.w - 28, height: board.h - 28, rx: 10, fill: '#dfeef3' }, paper);
  const sx = board.x + 50, sy = board.y + board.h * .58;
  shape('path', { d: `M${sx} ${sy}h90c20 0 28-14 28-30`, stroke: GOLD, 'stroke-width': 6, fill: 'none', 'stroke-linecap': 'round' }, paper);
  shape('path', { d: `M${sx + 6} ${sy - 12}h84l-12-40h-42c-18-6-30 8-30 40Z`, fill: RED }, paper);
  gift(paper, sx + 34, sy - 50, 34, 30, GREEN, GOLD);
  for (let i = 0; i < 3; i++) shape('path', { d: `M${sx - 20 - i * 18} ${sy - 30 + i * 6}h-14`, stroke: CREAM, 'stroke-width': 5, 'stroke-linecap': 'round' }, paper);
  for (const [dx, tilt] of [[0, -8], [52, 6]]) {
    const cx = board.x + board.w - 110 + dx, cy = board.y + board.h / 2;
    const card = shape('g', { transform: `rotate(${tilt} ${cx} ${cy})` }, paper);
    shape('rect', { x: cx - 24, y: cy - 34, width: 48, height: 68, rx: 8, fill: dx ? CREAM : RED, stroke: CREAM, 'stroke-width': 4 }, card);
    star(card, cx, cy, 14, dx ? RED : GOLD);
  }
  lights(paper, [board.x, board.y + 6], [board.x + board.w, board.y + 6], 12, 12, 7);
  snowCap(paper, board.x, board.y, board.w, 20);
  holly(paper, board.x + 24, board.y + board.h - 10, .6);
}
// The packed-snow path from where you stand up to the front door, with a line of boot prints along it.
export function doorPath({ paper }, { width, height }) {
  shape('path', { d: `M0 ${height * .5}C${width * .3} ${height * .38} ${width * .6} ${height * .62} ${width} ${height * .5}`, stroke: '#dbe5ec', 'stroke-width': height * .7, fill: 'none', 'stroke-linecap': 'round' }, paper);
  for (let i = 0; i < 9; i++) {
    const x = 40 + i * (width - 80) / 8, y = height * .5 + (i % 2 ? 14 : -14) + Math.sin(i) * 6;
    shape('ellipse', { cx: x, cy: y, rx: 14, ry: 8, fill: '#c5d4de' }, paper);
  }
}

const at = (x, z) => [x, GROUND, z];
// Every board of the village. Boards with `rig` stand on a moving group (cabin-art.js explains the other fields). Every other
// board has an `at`, even ones the scene moves every frame: one without would wait at the origin, inside the cabin.
export const WORLD = [
  // The wishing corner, the first thing you meet turning left.
  { id: 'wish-tree', w: 1.7, h: 3.1, px: 220, at: at(-9.4, .4), turn: face(-9.4, .4), draw: wishTree },
  { id: 'wish-post', w: .62, h: 1.35, px: 260, at: at(-7.7, 2.3), turn: face(-7.7, 2.3), draw: wishPost },
  { id: 'wish-board', w: 1.4, h: 1.4, px: 230, at: at(-10.9, 2.7), turn: face(-10.9, 2.7), draw: wishBoard },
  { id: 'wish-gifts', w: 1, h: .55, px: 240, at: at(-8.6, 1.5), turn: face(-8.6, 1.5), draw: giftPile },
  { id: 'wish-lamp', w: .55, h: 2.2, px: 240, at: at(-6.9, .2), turn: face(-6.9, .2), draw: lampPost },
  // The fair: the big wheel, the carousel (built round in cabin-scene.js), stalls and pennants.
  { id: 'wheel-stand', w: STAND.w, h: STAND.h, px: 100, rig: 'wheel', at: [0, -WHEEL.hub, -.14], draw: wheelStand },
  { id: 'wheel', w: 7.4, h: 7.4, px: 110, rig: 'wheel', at: [0, 0, 0], center: true, draw: wheel },
  { id: 'car-red', w: .9, h: 1, px: 200, rig: 'wheel', at: [0, 0, .08], hang: true, clones: 4, draw: wheelCar(RED) },
  { id: 'car-green', w: .9, h: 1, px: 200, rig: 'wheel', at: [0, 0, .08], hang: true, clones: 4, draw: wheelCar(GREEN) },
  { id: 'horse', w: 1.05, h: .9, px: 240, rig: 'carousel', at: [0, .95, CAROUSEL.ring], center: true, clones: CAROUSEL.horses, draw: horse },
  { id: 'carousel-roof', w: 12.6, h: 2.2, px: 60, texture: true, draw: carouselRoof },
  { id: 'carousel-fringe', w: 12.6, h: .34, px: 100, texture: true, draw: carouselFringe },
  { id: 'carousel-drum', w: 11, h: .3, px: 100, texture: true, draw: carouselDrum },
  { id: 'coaster', w: COASTER.w, h: COASTER.h, px: 80, rig: 'coaster', at: [0, 0, 0], draw: coaster },
  { id: 'coaster-ends', w: COASTER.w, h: COASTER.h, px: 80, rig: 'coaster', at: [0, 0, .1], draw: coasterEnds },
  { id: 'coaster-car-a', w: .64, h: .46, px: 200, rig: 'coaster', at: [0, 0, .06], center: true, clones: 2, draw: coasterCar(0) },
  { id: 'coaster-car-b', w: .64, h: .46, px: 200, rig: 'coaster', at: [0, 0, .06], center: true, draw: coasterCar(1) },
  { id: 'balloon-red', w: 1.5, h: 2, px: 160, at: BALLOONS[0], center: true, billboard: true, clones: 2, draw: balloon([RED, CREAM, GOLD]) },
  { id: 'balloon-green', w: 1.5, h: 2, px: 160, at: BALLOONS[2], center: true, billboard: true, draw: balloon([GREEN, CREAM, '#7fa3a8']) },
  { id: 'stall-cocoa', w: 2.1, h: 2.3, px: 190, at: at(-12.2, 11), turn: face(-12.2, 11), draw: stall('cocoa') },
  { id: 'stall-cookie', w: 2.1, h: 2.3, px: 190, at: at(-9.6, 13.2), turn: face(-9.6, 13.2), draw: stall('cookie') },
  { id: 'bunting-wheel', w: 6, h: 3.2, px: 90, at: at(-14.8, 3), turn: face(-14.8, 3), draw: bunting },
  { id: 'bunting-stalls', w: 4.6, h: 3, px: 100, at: at(-11, 9), turn: face(-11, 9), draw: bunting },
  { id: 'park-path', w: 14, h: 2, px: 60, at: at(-12, 5), flat: 'ground', turn: 1.25, draw: path },
  // Far mountain ranges all round, drawn hazy (no fog) like the ski mountain: behind everything, to the left past the fair, and
  // across the bay.
  { id: 'peaks-back', w: 120, h: 14, px: 12, at: at(0, -52), kind: 'scenery', fog: false, draw: peaks([[.12, .55, .07, .08], [.27, .8, .09, .08], [.42, .62, .07, .07], [.6, .95, .1, .09], [.76, .7, .08, .08], [.9, .5, .07, .06]]) },
  { id: 'peaks-left', w: 60, h: 10, px: 14, at: at(-44, 2), turn: face(-44, 2), kind: 'scenery', fog: false, draw: peaks([[.18, .6, .1, .1], [.38, .9, .12, .12], [.6, .7, .1, .1], [.8, .55, .1, .09]]) },
  { id: 'peaks-bay', w: 56, h: 9, px: 14, at: at(46, -18), turn: face(46, -18), kind: 'scenery', fog: false, draw: peaks([[.2, .55, .1, .1], [.42, .85, .12, .11], [.66, .65, .1, .1], [.84, .45, .09, .08]]) },
  { id: 'hills-left', w: 56, h: 4.6, px: 18, at: at(-34, 6), turn: face(-34, 6), draw: hills(1), kind: 'scenery', fog: false },
  { id: 'fence-left', w: 2.4, h: .7, px: 200, at: at(-6.6, 6.4), turn: face(-6.6, 6.4), draw: fence },
  { id: 'cane-left', w: .3, h: .95, px: 260, at: at(-7.4, 4.3), turn: face(-7.4, 4.3), draw: candyCane },
  { id: 'drift-left-near', w: 1.6, h: .5, px: 160, at: at(-6.2, 9.8), turn: face(-6.2, 9.8), draw: drift },
  { id: 'drift-left-mid', w: 1.2, h: .4, px: 180, at: at(-5, 4.6), turn: face(-5, 4.6), mirror: true, draw: drift },
  // The coast: the sea itself is one flat sheet in cabin-scene.js, tiled with this pattern.
  { id: 'sea', w: 18, h: 18, px: 40, texture: true, repeat: [1 / 18, 1 / 18], draw: seaTile },
  { id: 'wave-near', w: 16, h: .55, px: 100, at: [14.2, GROUND - .06, 6], turn: -Math.PI / 2 + .04, draw: wave(0) },
  { id: 'wave-mid', w: 24, h: .6, px: 80, at: [16.6, GROUND - .06, 2], turn: -Math.PI / 2 + .1, draw: wave(1) },
  { id: 'islet', w: 3.6, h: 1.3, px: 140, at: [LIGHT.x, GROUND - .1, LIGHT.z + .25], turn: face(LIGHT.x, LIGHT.z), draw: islet },
  { id: 'lighthouse', w: 1.2, h: LIGHT.h, px: LIGHT.px, at: [LIGHT.x, LIGHT.base, LIGHT.z], turn: face(LIGHT.x, LIGHT.z), draw: lighthouse },
  { id: 'boat', w: 1.4, h: 1.7, px: 160, at: [24, GROUND - .12, -6], turn: face(24, -6), draw: boat },
  { id: 'rocks', w: 1.6, h: .7, px: 200, at: [13.6, GROUND - .05, 9.2], turn: face(13.6, 9.2), draw: rocks },
  { id: 'gull', w: .5, h: .26, px: 200, at: [LIGHT.x - 3, 4.3, LIGHT.z + 1], center: true, billboard: true, clones: 3, draw: gull },
  { id: 'island', w: 14, h: 2.4, px: 22, at: at(30, -12), turn: face(30, -12), draw: hills(1), kind: 'scenery', fog: false },
  { id: 'world-sign', w: 1.2, h: 2.1, px: 240, at: at(10.2, 9.4), turn: face(10.2, 9.4), draw: worldSign },
  { id: 'postcards', w: 1.4, h: 1.5, px: 220, at: at(9.2, 11.8), turn: face(9.2, 11.8), draw: postcards },
  { id: 'dinghy', w: 1.3, h: .5, px: 220, at: at(11.2, 5.6), turn: face(11.2, 5.6), draw: dinghy },
  { id: 'grass-near', w: 1.2, h: .6, px: 200, at: at(8.2, 7.6), turn: face(8.2, 7.6), draw: beachGrass },
  { id: 'grass-far', w: 1.2, h: .6, px: 200, at: at(10.8, 13.6), turn: face(10.8, 13.6), mirror: true, draw: beachGrass },
  { id: 'drift-right-near', w: 1.6, h: .5, px: 160, at: at(6.4, 10.6), turn: face(6.4, 10.6), mirror: true, draw: drift },
  { id: 'drift-right-mid', w: 1.2, h: .4, px: 180, at: at(7.8, 4.2), turn: face(7.8, 4.2), draw: drift },
  // The mountain, with skiers and lift cabins travelling over its face.
  { id: 'ski-mountain', w: SKI.w, h: SKI.h, px: 50, rig: 'ski', at: [0, 0, 0], kind: 'scenery', fog: false, draw: skiMountain },
  { id: 'skier', w: .55, h: .7, px: 220, rig: 'ski', at: [0, 0, .05], center: true, clones: 3, fog: false, draw: skier },
  { id: 'gondola', w: .42, h: .55, px: 220, rig: 'ski', at: [0, 0, .07], hang: true, clones: 3, fog: false, draw: gondola },
  // The right edge of the turn: the boathouse and its landing stage, a moored boat, buoys, a seal on a floe, barrels and a bench.
  { id: 'boathouse', w: 2.4, h: 2.5, px: 170, at: at(11.4, 15.2), turn: face(11.4, 15.2), draw: boathouse },
  { id: 'dock', w: 3.2, h: 1.2, px: 170, at: [13.6, GROUND - .2, 13.6], turn: face(13.6, 13.6), draw: dock },
  { id: 'boat-moored', w: 1.4, h: 1.7, px: 160, at: [15.6, GROUND - .12, 14.8], turn: face(15.6, 14.8), draw: boat },
  { id: 'buoy', w: .42, h: .7, px: 220, at: [FLOATS[0][0], GROUND - .14, FLOATS[0][1]], billboard: true, clones: FLOATS.length, draw: buoy },
  { id: 'seal-floe', w: 1.7, h: .8, px: 200, at: [FLOE[0], GROUND - .1, FLOE[1]], turn: face(...FLOE), draw: sealFloe },
  { id: 'barrels', w: 1.5, h: .95, px: 200, at: at(7.6, 13.6), turn: face(7.6, 13.6), draw: barrels },
  { id: 'bench-shore', w: 1.4, h: .9, px: 200, at: at(6.2, 14.4), turn: face(6.2, 14.4), draw: bench },
  { id: 'rocks-shore', w: 1.6, h: .7, px: 200, at: [11.9, GROUND - .05, 18.6], turn: face(11.9, 18.6), draw: rocks },
  // The left edge, past the fair: a skating pond with two skaters, a sled of presents, a snow fort, the ticket booth, a lamp.
  { id: 'skating-pond', w: 4.4, h: 2, px: 80, at: at(POND.x, POND.z), flat: 'ground', turn: POND.turn, draw: pond },
  { id: 'skater-red', w: .55, h: .85, px: 220, at: at(POND.x, POND.z), billboard: true, draw: skater(RED) },
  { id: 'skater-green', w: .55, h: .85, px: 220, at: at(POND.x, POND.z), billboard: true, draw: skater(GREEN) },
  { id: 'sled-sacks', w: 1.4, h: .75, px: 200, at: at(-5.6, 13.6), turn: face(-5.6, 13.6), draw: sledSacks },
  { id: 'snow-fort', w: 1.2, h: .7, px: 200, at: at(-12.6, 16.4), turn: face(-12.6, 16.4), draw: snowFort },
  { id: 'ticket-booth', w: 1.1, h: 1.9, px: 200, at: at(-14.6, 13.6), turn: face(-14.6, 13.6), draw: ticketBooth },
  { id: 'lamp-pond', w: .55, h: 2.2, px: 240, at: at(-4.6, 13.2), turn: face(-4.6, 13.2), draw: lampPost },
  // The centre: the path to the door and the signs pointing everywhere else.
  { id: 'door-path', w: 4.2, h: 1.1, px: 120, at: at(0, 3.75), flat: 'ground', turn: Math.PI / 2, draw: doorPath },
  { id: 'game-sign', w: 2.4, h: 2.2, px: 150, at: at(5.4, -16), turn: face(5.4, -16), draw: gameSign },
];

// Things in the village that answer a tap with a line of their own. `sheet` is the board that gives a little wiggle.
export const PROPS = [
  { id: 'wish-post', name: '許願郵筒', box: [[-7.7, .55, 2.3], [.9, 1.4, .9]], note: '許願郵筒：寄給聖誕老人的願望信，都從這裡出發。' },
  { id: 'wish-tree', name: '願望樹', box: [[-9.4, 1.4, .4], [1.7, 3.1, 1.4]], note: '樹上掛滿封好的願望信封，只有聖誕老人能拆開。' },
  { id: 'wish-board', name: '願望留言板', box: [[-10.9, .6, 2.7], [1.4, 1.4, 1.2]], note: '留言板上釘滿小卡片，每一張都畫著一個心願。' },
  { id: 'wheel', name: '摩天輪', box: [[WHEEL.x, GROUND + WHEEL.hub, WHEEL.z], [4, 7.6, 6.6]], note: '摩天輪慢慢地轉，坐到最高的地方看得到整片海。' },
  { id: 'carousel', name: '旋轉木馬', box: [[CAROUSEL.x, 1.5, CAROUSEL.z], [4.2, 3.8, 4.2]], note: '旋轉木馬叮叮咚咚地轉，小馬們跑了一圈又一圈。' },
  { id: 'stall-cocoa', name: '熱可可攤', box: [[-12.2, 1, 11], [2.2, 2.3, 2.2]], note: '熱可可攤冒著白煙，隔壁的小攤賣薑餅人。' },
  { id: 'lighthouse', name: '燈塔', box: [[LIGHT.x, 2.6, LIGHT.z], [2, 5.4, 2]], note: '燈塔的光慢慢掃過海面，替夜裡的雪橇指路。' },
  { id: 'world-sign', name: '世界路標', box: [[10.2, .9, 9.4], [1.3, 2.1, 1.3]], note: '路標指向冰島、台灣、日本、紐西蘭、加拿大和巴西：那些地方也正在過聖誕。' },
  { id: 'postcards', name: '明信片看板', box: [[9.2, .6, 11.8], [1.5, 1.5, 1.5]], note: '世界各地寄來的明信片，每張郵戳都蓋著不一樣的聖誕節。' },
  { id: 'game-sign', name: '遊戲看板', box: [[5.4, .95, -16], [2.6, 2.2, 1.4]], note: '看板上畫著飛行雪橇和配對卡片：Game 頁的兩個遊戲，就是在這座村子裡玩的。' },
  { id: 'ski-mountain', name: '滑雪場', box: [[SKI.x - 2, 5.5, SKI.z], [20, 10, 2]], note: '雪山上有人從滑雪道一路滑下來，纜車一趟趟把大家送上山。' },
];
